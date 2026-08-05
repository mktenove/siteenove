-- =====================================================================
-- Enove — segurança de linha (RLS)
--
-- Sem RLS, a chave anônima do Supabase lê e escreve TUDO. Como ela vai
-- embutida no site público, isso significaria qualquer visitante podendo
-- alterar imóveis. Ligar RLS é o passo que não pode ser esquecido.
-- =====================================================================

alter table imovel                enable row level security;
alter table imovel_foto           enable row level security;
alter table imovel_caracteristica enable row level security;
alter table caracteristica        enable row level security;
alter table destaque              enable row level security;
alter table destaque_quadro       enable row level security;
alter table cidade                enable row level security;
alter table bairro                enable row level security;
alter table corretor              enable row level security;
alter table tipo_imovel           enable row level security;
alter table lead                  enable row level security;

-- ---- público: lê só o que está publicado -----------------------------
drop policy if exists imovel_publico on imovel;
create policy imovel_publico on imovel
  for select using (situacao = 'PUBLICADO');

-- as tabelas filhas seguem a situação do imóvel pai
drop policy if exists foto_publica on imovel_foto;
create policy foto_publica on imovel_foto for select using (
  exists (select 1 from imovel i
           where i.codigo = imovel_foto.imovel_codigo and i.situacao = 'PUBLICADO'));

drop policy if exists carac_do_imovel_publica on imovel_caracteristica;
create policy carac_do_imovel_publica on imovel_caracteristica for select using (
  exists (select 1 from imovel i
           where i.codigo = imovel_caracteristica.imovel_codigo and i.situacao = 'PUBLICADO'));

drop policy if exists destaque_publico on destaque;
create policy destaque_publico on destaque for select using (
  exists (select 1 from imovel i
           where i.codigo = destaque.imovel_codigo and i.situacao = 'PUBLICADO'));

drop policy if exists quadro_publico on destaque_quadro;
create policy quadro_publico on destaque_quadro for select using (
  exists (select 1 from destaque d join imovel i on i.codigo = d.imovel_codigo
           where d.id = destaque_quadro.destaque_id and i.situacao = 'PUBLICADO'));

-- tabelas de apoio: leitura livre, escrita só autenticada
drop policy if exists apoio_leitura on caracteristica;
create policy apoio_leitura on caracteristica for select using (true);
drop policy if exists cidade_leitura on cidade;
create policy cidade_leitura on cidade for select using (true);
drop policy if exists bairro_leitura on bairro;
create policy bairro_leitura on bairro for select using (true);
drop policy if exists corretor_leitura on corretor;
create policy corretor_leitura on corretor for select using (ativo);
drop policy if exists tipo_leitura on tipo_imovel;
create policy tipo_leitura on tipo_imovel for select using (true);

-- ---- lead: qualquer um cria, ninguém lê pelo site --------------------
-- O formulário precisa gravar. Mas deixar SELECT aberto exporia telefone e
-- e-mail de todo mundo que já pediu informação.
drop policy if exists lead_criar on lead;
create policy lead_criar on lead for insert with check (true);
drop policy if exists lead_ler on lead;
create policy lead_ler on lead for select using (auth.role() = 'authenticated');

-- ---- equipe autenticada: gerencia tudo -------------------------------
do $$
declare t text;
begin
  foreach t in array array['imovel','imovel_foto','imovel_caracteristica',
                           'caracteristica','destaque','destaque_quadro',
                           'cidade','bairro','corretor','tipo_imovel']
  loop
    execute format('drop policy if exists equipe_gerencia on %I', t);
    execute format($f$create policy equipe_gerencia on %I
                        for all to authenticated
                        using (true) with check (true)$f$, t);
  end loop;
end $$;
