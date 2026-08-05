-- =====================================================================
-- Enove — schema inicial
-- Rodar no SQL Editor do Supabase, de uma vez. É idempotente: pode rodar
-- de novo sem estragar nada.
-- =====================================================================

-- ---------------------------------------------------------------- tipos
-- O código do imóvel é sigla + 4 dígitos (CA2875). A coluna `proximo`
-- guarda o último número USADO; o próximo gerado é proximo + 1.
create table if not exists tipo_imovel (
  sigla    char(2) primary key,
  nome     text    not null,
  proximo  integer not null check (proximo >= 0)
);

-- --------------------------------------------------------- localização
create table if not exists cidade (
  id     bigserial primary key,
  nome   text not null,
  uf     char(2) not null default 'RS',
  unique (nome, uf)
);

create table if not exists bairro (
  id         bigserial primary key,
  cidade_id  bigint not null references cidade(id) on delete cascade,
  nome       text not null,
  texto      text,              -- o texto editorial de "como é morar aqui"
  valor_m2   numeric(12,2),
  unique (cidade_id, nome)
);

-- ------------------------------------------------------------ corretor
create table if not exists corretor (
  id        bigserial primary key,
  auth_id   uuid unique,        -- liga com auth.users do Supabase
  nome      text not null,
  creci     text,
  telefone  text,
  email     text,
  foto_url  text,
  ativo     boolean not null default true
);

-- -------------------------------------------------------------- imóvel
create table if not exists imovel (
  codigo             text primary key,          -- CA2875 — é a chave, não um id
  tipo               char(2) not null references tipo_imovel(sigla),
  finalidade         text not null default 'VENDA'
                     check (finalidade in ('VENDA','LOCACAO','LANCAMENTO')),
  situacao           text not null default 'RASCUNHO'
                     check (situacao in ('RASCUNHO','PUBLICADO','VENDIDO','SUSPENSO')),

  titulo             text,
  descricao          text,
  exclusivo          boolean not null default false,
  destaque           boolean not null default false,

  cidade_id          bigint references cidade(id),
  bairro_id          bigint references bairro(id),
  cep                text,
  logradouro         text,
  numero             text,
  complemento        text,
  condominio         text,
  lat                double precision,
  lng                double precision,
  -- o Flip usa SOMENTE_BAIRRO na maioria: o endereço exato não vai ao ar
  mostrar_endereco   text not null default 'SOMENTE_BAIRRO'
                     check (mostrar_endereco in ('COMPLETO','SOMENTE_BAIRRO','OCULTO')),

  valor              numeric(14,2),
  valor_locacao      numeric(14,2),
  valor_condominio   numeric(12,2),
  valor_iptu         numeric(12,2),
  valor_sob_consulta boolean not null default false,
  aceita_financiamento boolean,
  aceita_permuta     boolean,

  area_util          numeric(10,2),
  area_total         numeric(10,2),
  dormitorios        smallint,
  suites             smallint,
  banheiros          smallint,
  vagas              smallint,
  vagas_cobertas     smallint,
  ano_construcao     smallint,
  mobiliado          boolean,

  link_video         text,
  tour_virtual       text,

  corretor_id        bigint references corretor(id),
  origem_flip_id     bigint,                    -- idPostgres do Flip, para conferência
  criado_em          timestamptz not null default now(),
  atualizado_em      timestamptz not null default now(),
  publicado_em       timestamptz
);

create index if not exists imovel_situacao_idx  on imovel (situacao);
create index if not exists imovel_tipo_idx      on imovel (tipo);
create index if not exists imovel_cidade_idx    on imovel (cidade_id);
create index if not exists imovel_bairro_idx    on imovel (bairro_id);
create index if not exists imovel_valor_idx     on imovel (valor);

-- --------------------------------------------------------------- fotos
create table if not exists imovel_foto (
  id             bigserial primary key,
  imovel_codigo  text not null references imovel(codigo) on delete cascade,
  url            text not null,
  thumb_url      text,
  legenda        text,
  ordem          smallint not null default 0,
  capa           boolean not null default false,
  origem_url     text                                   -- a URL no S3 do Flip
);
create index if not exists foto_imovel_idx on imovel_foto (imovel_codigo, ordem);

-- ----------------------------------------------------- características
create table if not exists caracteristica (
  id     bigserial primary key,
  nome   text not null unique,
  grupo  text not null default 'IMOVEL'
         check (grupo in ('IMOVEL','CONDOMINIO','ENTORNO'))
);

create table if not exists imovel_caracteristica (
  imovel_codigo     text not null references imovel(codigo) on delete cascade,
  caracteristica_id bigint not null references caracteristica(id) on delete cascade,
  primary key (imovel_codigo, caracteristica_id)
);

-- ------------------------------------------------- destaques (stories)
create table if not exists destaque (
  id             bigserial primary key,
  imovel_codigo  text not null references imovel(codigo) on delete cascade,
  titulo         text not null,
  capa_url       text,
  ordem          smallint not null default 0
);

create table if not exists destaque_quadro (
  id           bigserial primary key,
  destaque_id  bigint not null references destaque(id) on delete cascade,
  foto_url     text not null,
  legenda      text,
  ordem        smallint not null default 0
);

-- --------------------------------------------------------------- leads
create table if not exists lead (
  id             bigserial primary key,
  imovel_codigo  text references imovel(codigo) on delete set null,
  nome           text,
  telefone       text,
  email          text,
  mensagem       text,
  origem         text,                -- ficha, busca, whatsapp, story...
  criado_em      timestamptz not null default now()
);

-- =====================================================================
-- Geração do código
-- =====================================================================
create or replace function gerar_codigo(p_sigla char(2)) returns text as $$
declare n integer;
begin
  -- O `update ... returning` trava a LINHA do tipo. Dois corretores salvando
  -- ao mesmo tempo entram em fila em vez de receberem o mesmo número.
  -- Um `select max(...) + 1` faria os dois lerem o mesmo valor e colidirem.
  update tipo_imovel
     set proximo = proximo + 1
   where sigla = p_sigla
  returning proximo into n;

  if n is null then
    raise exception 'tipo de imóvel % não cadastrado em tipo_imovel', p_sigla;
  end if;
  if n > 9999 then
    raise exception 'tipo % passou de 9999: definir a regra de virada', p_sigla;
  end if;

  return p_sigla || lpad(n::text, 4, '0');
end $$ language plpgsql;

-- preenche o código no insert, quando não vier pronto (a carga inicial
-- traz os códigos históricos e passa por aqui sem ser alterada)
create or replace function imovel_antes_inserir() returns trigger as $$
begin
  if new.codigo is null or new.codigo = '' then
    new.codigo := gerar_codigo(new.tipo);
  end if;
  return new;
end $$ language plpgsql;

drop trigger if exists tg_imovel_codigo on imovel;
create trigger tg_imovel_codigo before insert on imovel
  for each row execute function imovel_antes_inserir();

create or replace function tocar_atualizado_em() returns trigger as $$
begin new.atualizado_em := now(); return new; end $$ language plpgsql;

drop trigger if exists tg_imovel_atualizado on imovel;
create trigger tg_imovel_atualizado before update on imovel
  for each row execute function tocar_atualizado_em();
