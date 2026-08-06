/* Ligação com o Supabase.

   A chave aqui é a PUBLICÁVEL: começa com `sb_publishable_`. Ela é feita
   para ficar exposta no navegador — quem protege o banco é o RLS.

   A chave que começa com `sb_secret_` NÃO pode entrar aqui: ela ignora o
   RLS, e qualquer visitante leria ela no código-fonte da página. Se ela for
   colada por engano, dados.js recusa a conexão e avisa no console. */
window.ENOVE_CONFIG = {
  url:   'https://guohwcoaymnklzyeinnf.supabase.co',
  chave: 'sb_publishable_iJLZaZ4d84uQ44X8Sow0sA_OeygoEbz'   // cole aqui a chave publishable / anon
};
