-- =====================================================================
-- Enove — carga dos tipos e semeadura dos contadores
--
-- Os números vêm dos imóveis PUBLICADOS no site atual (1.286 de 5.591).
-- Os ~4.290 arquivados não são visíveis, e um deles pode ter número maior
-- que o maior ativo do mesmo tipo. Por isso cada contador leva FOLGA de
-- 50: um código repetido é indistinguível de outro imóvel numa placa
-- de rua ou num print de WhatsApp.
--
-- Se o Flip informar o máximo REAL de cada tipo, troque os valores abaixo
-- pelo máximo real (sem folga) antes de rodar.
-- =====================================================================

insert into tipo_imovel (sigla, nome, proximo) values
  ('CA', 'Casa', 2924),                     -- 537 publicados, maior visto CA2874
  ('TE', 'Terreno', 1310),                  -- 385 publicados, maior visto TE1260
  ('AP', 'Apartamento', 1271),              -- 273 publicados, maior visto AP1221
  ('AR', 'Área', 98),                       --  40 publicados, maior visto AR0048
  ('PR', 'Prédio', 94),                     --  17 publicados, maior visto PR0044
  ('CH', 'Chácara', 87),                    --  12 publicados, maior visto CH0037
  ('SA', 'Sala', 191),                      --   6 publicados, maior visto SA0141
  ('PA', 'Pavilhão', 90),                   --   6 publicados, maior visto PA0040
  ('LJ', 'Loja', 54),                       --   3 publicados, maior visto LJ0004
  ('ES', 'Estúdio', 53),                    --   3 publicados, maior visto ES0003
  ('SI', 'Sítio', 56),                      --   2 publicados, maior visto SI0006
  ('AD', 'Apartamento Duplex', 52),         --   1 publicados, maior visto AD0002
  ('SJ', 'Sobreloja', 51)                   --   1 publicados, maior visto SJ0001
on conflict (sigla) do update
  set nome = excluded.nome,
      -- nunca RETROCEDE o contador: se já houver um valor maior, mantém
      proximo = greatest(tipo_imovel.proximo, excluded.proximo);

-- confere o que ficou
select sigla, nome, proximo,
       sigla || lpad((proximo + 1)::text, 4, '0') as proximo_codigo
  from tipo_imovel order by proximo desc;
