// ENVIAR-OTP-WHATSAPP v1 — "Send SMS Hook" do Supabase Auth: manda o codigo de login pelo WhatsApp (Z-API)
//
// ===================================================================
// COMO FUNCIONA (05/10/2026 — login somente por WhatsApp)
//
// 1. A pessoa digita o numero no app e toca em "Receber codigo".
//    O app chama supabase.auth.signInWithOtp({ phone }).
// 2. O Supabase Auth gera o codigo de 6 digitos e, como o "Send SMS
//    Hook" esta ligado (painel: Authentication -> Hooks), chama ESTA
//    funcao em vez de mandar SMS. O corpo traz { user: { phone }, sms: { otp } }.
// 3. Esta funcao confere a ASSINATURA do pedido (padrao Standard
//    Webhooks, com o segredo do hook). Assinatura errada = recusa.
// 4. Manda o codigo pela Z-API (mesmos secrets da funcao enviar-codigo:
//    ZAPI_INSTANCE_ID, ZAPI_TOKEN, ZAPI_CLIENT_TOKEN).
// 5. Responde 200 com {} (sucesso) ou { error: { http_code, message } }
//    (formato que o hook espera). Com erro, o app mostra "Nao
//    conseguimos enviar agora".
//
// SECRETS (so no painel do Supabase, NUNCA no codigo nem no Git):
//   SEND_SMS_HOOK_SECRET  -> o segredo gerado ao criar o hook ("v1,whsec_...")
//   ZAPI_INSTANCE_ID, ZAPI_TOKEN, ZAPI_CLIENT_TOKEN -> ja existem
//
// PUBLICAR com "Verify JWT" DESLIGADO (quem chama e o Supabase Auth, nao
// o app). Passo a passo: docs/LOGIN-WHATSAPP-PASSO-A-PASSO.md
//
// LOGS: nunca imprimem o codigo inteiro nem o numero inteiro.
// ===================================================================

import { Webhook } from "https://esm.sh/standardwebhooks@1.0.0";

const CABECALHOS_JSON = { "Content-Type": "application/json" };

/* O hook do Supabase espera ate ~5 segundos. A Z-API tem 4,5s. */
const TEMPO_MAXIMO_ZAPI_MS = 4500;

/* Erro no formato que o Send SMS Hook entende */
function erro(httpCode: number, mensagem: string): Response {
  return new Response(
    JSON.stringify({ error: { http_code: httpCode, message: mensagem } }),
    { status: httpCode, headers: CABECALHOS_JSON },
  );
}

/* "5537999998888" -> "5537*****88" (para log) */
function numeroMascarado(numero: string): string {
  if (numero.length < 6) return "***";
  return `${numero.slice(0, 4)}*****${numero.slice(-2)}`;
}

/* Texto da mensagem no WhatsApp (sem acento no codigo-fonte; os
   ó e é viram "o" e "e" com acento na mensagem). */
function textoDaMensagem(codigo: string): string {
  return `Seu código do TaCerto é: ${codigo}. Não compartilhe com ninguém. Vale por 10 minutos.`;
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return erro(405, "Metodo nao permitido");
  }

  // 1) Segredo do hook
  const segredo =
    Deno.env.get("SEND_SMS_HOOK_SECRET") || Deno.env.get("SEND_SMS_HOOK_SECRETS");
  if (!segredo) {
    console.error("[enviar-otp-whatsapp] falta o secret SEND_SMS_HOOK_SECRET");
    return erro(500, "Hook sem segredo configurado");
  }

  // 2) Confere a assinatura (Standard Webhooks)
  const corpo = await req.text();
  const cabecalhos = Object.fromEntries(req.headers);
  let dados: { user?: { phone?: string }; sms?: { otp?: string } };
  try {
    const webhook = new Webhook(segredo.replace("v1,whsec_", ""));
    dados = webhook.verify(corpo, cabecalhos) as typeof dados;
  } catch (_e) {
    console.warn("[enviar-otp-whatsapp] assinatura invalida: pedido recusado");
    return erro(401, "Assinatura do hook invalida");
  }

  // 3) Telefone no formato da Z-API (so numeros, com 55) e o codigo
  const codigo = String(dados?.sms?.otp || "");
  let numero = String(dados?.user?.phone || "").replace(/\D/g, "");
  if (numero && !numero.startsWith("55")) numero = `55${numero}`;

  if (numero.length < 12 || numero.length > 13 || !/^\d{6}$/.test(codigo)) {
    console.warn("[enviar-otp-whatsapp] telefone ou codigo invalido", {
      numero: numeroMascarado(numero),
      codigoOk: /^\d{6}$/.test(codigo),
    });
    return erro(400, "Telefone ou codigo invalido");
  }

  // 4) Z-API (mesmos secrets da funcao enviar-codigo)
  const instancia = Deno.env.get("ZAPI_INSTANCE_ID");
  const token = Deno.env.get("ZAPI_TOKEN");
  const clientToken = Deno.env.get("ZAPI_CLIENT_TOKEN");
  if (!instancia || !token || !clientToken) {
    console.error("[enviar-otp-whatsapp] secrets da Z-API faltando");
    return erro(500, "Z-API nao configurada");
  }

  const url = `https://api.z-api.io/instances/${instancia}/token/${token}/send-text`;

  try {
    const resposta = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Client-Token": clientToken },
      body: JSON.stringify({ phone: numero, message: textoDaMensagem(codigo) }),
      signal: AbortSignal.timeout(TEMPO_MAXIMO_ZAPI_MS),
    });

    if (!resposta.ok) {
      const detalhe = (await resposta.text()).slice(0, 300);
      console.error("[enviar-otp-whatsapp] Z-API recusou", {
        status: resposta.status,
        numero: numeroMascarado(numero),
        detalhe,
      });
      return erro(502, "Nao foi possivel enviar o codigo pelo WhatsApp");
    }
  } catch (e) {
    console.error("[enviar-otp-whatsapp] falha ao chamar a Z-API", {
      numero: numeroMascarado(numero),
      motivo: String(e).slice(0, 200),
    });
    return erro(502, "Nao foi possivel enviar o codigo pelo WhatsApp");
  }

  console.log("[enviar-otp-whatsapp] codigo enviado", {
    numero: numeroMascarado(numero),
    codigo: `${codigo.slice(0, 1)}*****`,
  });
  return new Response("{}", { status: 200, headers: CABECALHOS_JSON });
});
