-- =====================================================================
-- Ajuste encontrado na carga real
--
-- O CRM atual usa QUATRO níveis de exibição de endereço, não três. Faltava
-- SOMENTE_RUA (29 imóveis do acervo): mostra a rua, esconde o número.
-- =====================================================================

alter table imovel drop constraint if exists imovel_mostrar_endereco_check;
alter table imovel add  constraint imovel_mostrar_endereco_check
  check (mostrar_endereco in ('COMPLETO','SOMENTE_RUA','SOMENTE_BAIRRO','OCULTO'));

-- confere
select conname, pg_get_constraintdef(oid)
  from pg_constraint
 where conrelid = 'imovel'::regclass and conname like '%mostrar_endereco%';
