/* SW v1 — service worker so de notificacao (push e toque na notificacao), sem cache e sem interceptar nada */

/* ===================================================================
   SERVICE WORKER DO TaCerto! — SO PARA NOTIFICACAO

   O que e: um pedacinho do app que o celular deixa "acordado" em
   segundo plano. E ele que recebe o aviso da semana (push) mesmo com
   o app fechado e mostra a notificacao na tela.

   O que ele NAO faz (de proposito):
   - NAO guarda copia do app (sem cache). Se guardasse, depois de cada
     publicacao na Vercel o iPhone continuaria vendo a versao velha.
   - NAO tem o "fetch" (nao fica no meio do caminho entre o app e a
     internet). O app carrega igualzinho a antes.

   iPhone: so recebe notificacao com o app ADICIONADO A TELA DE INICIO
   (Safari > Compartilhar > "Adicionar a Tela de Inicio"), iOS 16.4 ou
   mais novo. E a Apple exige: TODA push recebida tem que mostrar uma
   notificacao. Se alguma chegar e nao mostrar nada, a Apple cancela a
   inscricao do aparelho. Por isso, se a mensagem vier vazia ou
   quebrada, mostramos um texto padrao.

   Este arquivo fica em public/ e NAO passa pelo Vite: e servido como
   esta, em /sw.js. Por isso nada de import aqui.
   =================================================================== */

const TITULO_PADRAO = "TaCerto!";
const TEXTO_PADRAO = "Confira como está o seu velocímetro desta semana.";
const URL_PADRAO = "/dashboard";
const ICONE = "/icones/icone-192.png";
/* Selo: o desenho pequeno da barra de cima do Android (branco sobre
   transparente; o Android usa so o contorno). O iPhone ignora. */
const SELO = "/icones/icone-selo-96.png";

/* Versao nova do arquivo: assume na hora, sem esperar fechar o app. */
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

/* Le o que veio na push. Aceita JSON ({ titulo, texto, url }, ou os
   nomes em ingles title/body) ou texto simples. Nunca quebra. */
function lerMensagem(event) {
  let dados = {};
  try {
    if (event.data) {
      try {
        dados = event.data.json() || {};
      } catch {
        const texto = event.data.text();
        dados = texto ? { texto } : {};
      }
    }
  } catch {
    dados = {};
  }
  if (typeof dados === "string") dados = { texto: dados };
  if (typeof dados !== "object" || dados === null) dados = {};

  const titulo = String(dados.titulo || dados.title || "").trim() || TITULO_PADRAO;
  const texto = String(dados.texto || dados.body || "").trim() || TEXTO_PADRAO;
  /* So abre endereco do proprio app (link de fora vira o Inicio) */
  let url = URL_PADRAO;
  try {
    const endereco = new URL(String(dados.url || "").trim() || URL_PADRAO, self.location.origin);
    if (endereco.origin === self.location.origin) url = endereco.pathname + endereco.search + endereco.hash;
  } catch {
    url = URL_PADRAO;
  }

  return { titulo, texto, url };
}

self.addEventListener("push", (event) => {
  const { titulo, texto, url } = lerMensagem(event);
  event.waitUntil(
    self.registration.showNotification(titulo, {
      body: texto,
      icon: ICONE,
      badge: SELO,
      data: { url },
      tag: "semanal",
    }),
  );
});

/* Tocou na notificacao: fecha ela e leva para o app. Se o app ja
   estiver aberto, traz essa janela para frente; senao abre o app no
   endereco que veio na mensagem (padrao: o Inicio). */
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || URL_PADRAO;

  event.waitUntil(
    (async () => {
      const janelas = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      /* So traz a janela para frente, sem recarregar: recarregar faria
         a pessoa perder o que estava fazendo no app. */
      for (const janela of janelas) {
        try {
          if (new URL(janela.url).origin !== self.location.origin) continue;
          await janela.focus();
          return;
        } catch {
          /* tenta a proxima */
        }
      }
      if (self.clients.openWindow) await self.clients.openWindow(url);
    })(),
  );
});
