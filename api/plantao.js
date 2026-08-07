/* =======================================================================
   Envia o pedido de avaliação para o WhatsApp do plantão.

   Por que isto existe no servidor e não no navegador: mandar mensagem pelo
   WhatsApp exige um token da conta. Token no código da página é token
   público — qualquer visitante lê o código-fonte e passa a mandar mensagem
   em nome da Enove. Aqui ele fica nas variáveis de ambiente da Vercel, que
   o navegador nunca vê.

   O link `wa.me` que o site usava não envia nada: ele ABRE o WhatsApp da
   pessoa com o texto escrito, e ela ainda precisa apertar enviar. Muita
   gente não aperta.

   Dois caminhos, nesta ordem:

   1. WHATSAPP_TOKEN + WHATSAPP_PHONE_ID -> API oficial da Meta.
      ATENÇÃO: mensagem que a empresa inicia, fora de uma conversa aberta
      nas últimas 24 horas, precisa ser um MODELO aprovado pela Meta. Texto
      livre é recusado. Configure WHATSAPP_TEMPLATE com o nome do modelo se
      o destino não estiver em conversa ativa.

   2. PLANTAO_WEBHOOK -> qualquer outro caminho: um gateway ligado ao
      número que a Enove já usa (Z-API, Evolution e afins), n8n, Make. Faz
      um POST com o pedido em JSON e deixa o serviço entregar. É a via mais
      curta para quem não quer migrar o número para a plataforma da Meta.

   Sem nenhuma das duas configuradas, responde 501 e o site cai no `wa.me`
   de sempre — o pedido não se perde, só volta a depender do clique.
   ======================================================================= */

const DESTINO = process.env.PLANTAO_NUMERO || '5551997668999';

function texto({ nome, telefone, tipo, area, quartos, bairro }) {
  return `Nova simulação pelo site\n\n` +
         `Nome: ${nome}\n` +
         `WhatsApp: ${telefone}\n` +
         `Imóvel: ${tipo}, ${area} m², ${quartos} quartos\n` +
         (bairro ? `Bairro: ${bairro}\n` : '') +
         `\nQuer saber quanto vale para vender.`;
}

async function viaMeta(pedido) {
  const versao = process.env.WHATSAPP_API_VERSAO || 'v21.0';
  const url = `https://graph.facebook.com/${versao}/${process.env.WHATSAPP_PHONE_ID}/messages`;
  const modelo = process.env.WHATSAPP_TEMPLATE;

  /* Com modelo configurado, manda o modelo: é o que a Meta aceita quando a
     empresa inicia a conversa. Sem modelo, manda texto livre — só funciona
     se o plantão tiver falado com esse número nas últimas 24 horas. */
  const corpo = modelo
    ? { messaging_product: 'whatsapp', to: DESTINO, type: 'template',
        template: { name: modelo, language: { code: 'pt_BR' },
                    components: [{ type: 'body', parameters: [
                      { type: 'text', text: pedido.nome },
                      { type: 'text', text: pedido.telefone },
                      { type: 'text', text: `${pedido.tipo}, ${pedido.area} m²` }
                    ] }] } }
    : { messaging_product: 'whatsapp', to: DESTINO, type: 'text',
        text: { preview_url: false, body: texto(pedido) } };

  const r = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
               'Content-Type': 'application/json' },
    body: JSON.stringify(corpo)
  });
  if (!r.ok) throw new Error('Meta ' + r.status + ' ' + (await r.text()).slice(0, 300));
}

async function viaWebhook(pedido) {
  const r = await fetch(process.env.PLANTAO_WEBHOOK, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ destino: DESTINO, mensagem: texto(pedido), pedido })
  });
  if (!r.ok) throw new Error('webhook ' + r.status);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ erro: 'use POST' });

  const p = req.body || {};
  /* O navegador já valida, mas quem chama esta rota pode não ser o site. */
  if (!p.nome || !p.telefone || !p.area) {
    return res.status(400).json({ erro: 'nome, telefone e area são obrigatórios' });
  }
  /* Limites para o campo não virar porta de spam para o WhatsApp da Enove. */
  const pedido = {
    nome:     String(p.nome).slice(0, 80),
    telefone: String(p.telefone).slice(0, 32),
    tipo:     String(p.tipo || 'imóvel').slice(0, 24),
    area:     String(p.area).slice(0, 10),
    quartos:  String(p.quartos || '').slice(0, 4),
    bairro:   String(p.bairro || '').slice(0, 90)
  };

  try {
    if (process.env.WHATSAPP_TOKEN && process.env.WHATSAPP_PHONE_ID) {
      await viaMeta(pedido);
    } else if (process.env.PLANTAO_WEBHOOK) {
      await viaWebhook(pedido);
    } else {
      return res.status(501).json({ erro: 'envio não configurado' });
    }
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error('[plantao]', e.message);
    return res.status(502).json({ erro: 'falha ao enviar' });
  }
}
