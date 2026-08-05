-- =====================================================================
-- Condomínio como entidade própria
--
-- Cadastrar um imóvel e cadastrar um condomínio são coisas diferentes. Um
-- condomínio existe sozinho, tem lazer, planta, construtora e entrega — e
-- vários imóveis apontam para ele.
--
-- No acervo atual: 370 imóveis (28%) estão em condomínio, distribuídos em
-- 158 condomínios. O Horizon Clube Residencial sozinho tem 45. Sem esta
-- tabela, esses 45 repetem nome, endereço e lazer em cada ficha — e para
-- corrigir a piscina do condomínio seria preciso editar 45 imóveis.
-- =====================================================================

create table if not exists condominio (
  id              bigserial primary key,
  nome            text not null,
  slug            text unique,               -- /condominios/horizon-clube-residencial
  cidade_id       bigint references cidade(id),
  bairro_id       bigint references bairro(id),
  cep             text,
  logradouro      text,
  numero          text,
  lat             double precision,
  lng             double precision,

  -- é aqui que mora a "página de vendas"
  chamada         text,                      -- uma linha de destaque
  descricao       text,
  construtora     text,
  ano_entrega     smallint,
  situacao_obra   text check (situacao_obra in
                    ('LANCAMENTO','EM_OBRAS','PRONTO','ENTREGUE')),
  total_unidades  smallint,
  torres          smallint,
  andares         smallint,
  valor_condominio_medio numeric(12,2),

  publicado       boolean not null default false,
  origem_flip_id  bigint unique,             -- condominioId do CRM atual
  criado_em       timestamptz not null default now(),
  atualizado_em   timestamptz not null default now()
);

create index if not exists condominio_cidade_idx on condominio (cidade_id);

create table if not exists condominio_foto (
  id             bigserial primary key,
  condominio_id  bigint not null references condominio(id) on delete cascade,
  url            text not null,
  legenda        text,
  ordem          smallint not null default 0,
  capa           boolean not null default false,
  tipo           text not null default 'FOTO'
                 check (tipo in ('FOTO','PLANTA','IMPLANTACAO'))
);

-- reaproveita a tabela de características, com grupo = 'CONDOMINIO'
create table if not exists condominio_caracteristica (
  condominio_id     bigint not null references condominio(id) on delete cascade,
  caracteristica_id bigint not null references caracteristica(id) on delete cascade,
  primary key (condominio_id, caracteristica_id)
);

-- ---- liga o imóvel ao condomínio -------------------------------------
alter table imovel add column if not exists condominio_id bigint
  references condominio(id) on delete set null;
create index if not exists imovel_condominio_idx on imovel (condominio_id);

-- A coluna de texto `condominio` continua, para o imóvel cujo condomínio
-- ainda não foi cadastrado. Quando houver `condominio_id`, ele manda.
comment on column imovel.condominio is
  'nome solto, usado só quando condominio_id é nulo';

-- ---- RLS -------------------------------------------------------------
alter table condominio                enable row level security;
alter table condominio_foto           enable row level security;
alter table condominio_caracteristica enable row level security;

drop policy if exists condominio_publico on condominio;
create policy condominio_publico on condominio for select using (publicado);

drop policy if exists cond_foto_publica on condominio_foto;
create policy cond_foto_publica on condominio_foto for select using (
  exists (select 1 from condominio c
           where c.id = condominio_foto.condominio_id and c.publicado));

drop policy if exists cond_carac_publica on condominio_caracteristica;
create policy cond_carac_publica on condominio_caracteristica for select using (
  exists (select 1 from condominio c
           where c.id = condominio_caracteristica.condominio_id and c.publicado));

do $$
declare t text;
begin
  foreach t in array array['condominio','condominio_foto','condominio_caracteristica']
  loop
    execute format('drop policy if exists equipe_gerencia on %I', t);
    execute format($f$create policy equipe_gerencia on %I
                        for all to authenticated using (true) with check (true)$f$, t);
  end loop;
end $$;

drop trigger if exists tg_condominio_atualizado on condominio;
create trigger tg_condominio_atualizado before update on condominio
  for each row execute function tocar_atualizado_em();
