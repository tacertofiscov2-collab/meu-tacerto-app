/* NOTIFICACOESCELULAR v1 — notificacao da semana no celular: estado (instalar/indisponivel/ativar/ligadas/desligadas/bloqueadas), ativar (permissao no toque + inscricao push), desligar e garantir a inscricao; grava em inscricoes_push sem nunca lancar erro (a tabela ainda nao existe no banco) */
import { supabase } from "@/lib/supabase";

/* ===================================================================
   NOTIFICACOES DO CELULAR (12/10/2026)

   Uma notificacao por semana com o resumo do velocimetro. Quem mostra
   a notificacao e o public/sw.js (o "service worker": um pedacinho do
   app que o celular deixa acordado em segundo plano).

   COMO FUNCIONA NO iPHONE (o que mais importa no piloto):
   - So funciona com o TaCerto ADICIONADO A TELA DE INICIO (Safari >
     Compartilhar > "Adicionar a Tela de Inicio") e com iOS 16.4 ou mais
     novo. No Safari normal o iPhone nem mostra a opcao de notificacao:
     por isso o estado "instalar".
   - O pedido de permissao ("TaCerto quer enviar notificacoes") so pode
     sair DENTRO DE UM TOQUE da pessoa num botao. Se o app esperar
     qualquer outra coisa antes (internet, banco), o iPhone entende que
     nao foi a pessoa que pediu e ignora. Por isso ativarNotificacoes
     pede a permissao como PRIMEIRA coisa.
   - O app instalado tem a sua propria "gaveta" de dados, separada do
     Safari: a pessoa entra de novo na conta dentro do app instalado.

   ESTADOS (estadoNotificacoes):
     "instalar"     iPhone sem a opcao: precisa adicionar a Tela de Inicio
     "indisponivel" este aparelho/navegador nao tem notificacao
     "ativar"       ainda nao pediu a permissao
     "ligadas"      permissao dada e ligada no app
     "desligadas"   permissao dada, mas a pessoa desligou no app
     "bloqueadas"   a pessoa (ou o celular) negou a permissao; so volta
                    pelos Ajustes do celular

   CHAVE PUBLICA (VITE_VAPID_PUBLIC_KEY): e a "fechadura" que liga este
   aparelho ao servidor que manda a notificacao da semana. Sem ela, o
   app fica so com a permissao e faz a inscricao depois
   (garantirInscricaoPush, ao abrir a tela).

   BANCO: tabela inscricoes_push (uma linha por pessoa + aparelho). A
   tabela AINDA NAO EXISTE (o SQL espera o "pode" do Fernando): todo
   erro do Supabase e ignorado e o app segue normal. Nunca apaga linha:
   desligar so marca ativa = false.

   Nenhuma funcao daqui lanca erro: no pior caso, devolve o estado.
   =================================================================== */

export const CHAVE_PUBLICA_PUSH = import.meta.env.VITE_VAPID_PUBLIC_KEY || "";

const CHAVE_DESLIGADAS = "tacerto_notificacoes_desligadas";
const ARQUIVO_SW = "/sw.js";
const ESPERA_SW_MS = 10000; // tempo maximo esperando o service worker ficar pronto

/* ---------- aparelho ---------- */

/* iPhone, iPod ou iPad. O iPad novo se apresenta como Mac ("MacIntel"),
   mas tem tela de toque: e assim que ele e reconhecido. */
export function ehIphone() {
  try {
    if (typeof navigator === "undefined") return false;
    const ua = navigator.userAgent || "";
    if (/iPhone|iPad|iPod/i.test(ua)) return true;
    return navigator.platform === "MacIntel" && (navigator.maxTouchPoints || 0) > 1;
  } catch {
    return false;
  }
}

/* App aberto pela Tela de Inicio (sem a barra do Safari). */
export function estaInstalado() {
  try {
    if (typeof window === "undefined") return false;
    if (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) return true;
    return window.navigator.standalone === true;
  } catch {
    return false;
  }
}

/* Versao do iOS pelo userAgent ([16, 4]) ou null se nao der para saber.
   iPhone: "iPhone OS 17_2"; iPad que se apresenta como Mac: "Version/17.2". */
function versaoIos() {
  try {
    const ua = navigator.userAgent || "";
    let m = ua.match(/OS (\d+)_(\d+)/);
    if (!m && /Macintosh/i.test(ua)) m = ua.match(/Version\/(\d+)\.(\d+)/);
    return m ? [Number(m[1]), Number(m[2])] : null;
  } catch {
    return null;
  }
}

function iosAntigo() {
  const v = versaoIos();
  if (!v) return false;
  return v[0] < 16 || (v[0] === 16 && v[1] < 4);
}

function temSuporte() {
  try {
    return (
      typeof window !== "undefined" &&
      "Notification" in window &&
      "serviceWorker" in navigator &&
      "PushManager" in window
    );
  } catch {
    return false;
  }
}

/* ---------- marca "desligadas" (fica so neste aparelho) ---------- */

function marcadoDesligadas() {
  try {
    return localStorage.getItem(CHAVE_DESLIGADAS) === "1";
  } catch {
    return false;
  }
}

function marcarDesligadas(desligadas) {
  try {
    if (desligadas) localStorage.setItem(CHAVE_DESLIGADAS, "1");
    else localStorage.removeItem(CHAVE_DESLIGADAS);
  } catch {
    /* sem armazenamento: segue */
  }
}

/* ---------- estado ---------- */

export function estadoNotificacoes() {
  try {
    if (!temSuporte()) {
      /* iPhone no Safari normal: a opcao so aparece com o app na Tela de
         Inicio. iOS mais velho que o 16.4 nao tem como, nem instalado. */
      if (ehIphone() && !estaInstalado() && !iosAntigo()) return "instalar";
      return "indisponivel";
    }
    const permissao = Notification.permission;
    if (permissao === "denied") return "bloqueadas";
    if (permissao !== "granted") return "ativar";
    return marcadoDesligadas() ? "desligadas" : "ligadas";
  } catch {
    return "indisponivel";
  }
}

/* ---------- ajudantes ---------- */

/* A chave publica vem em "base64url" (letras, numeros, - e _); o
   navegador quer os bytes. */
function chaveEmBytes(base64url) {
  const preenchimento = "=".repeat((4 - (base64url.length % 4)) % 4);
  const base64 = (base64url + preenchimento).replace(/-/g, "+").replace(/_/g, "/");
  const texto = atob(base64);
  const bytes = new Uint8Array(texto.length);
  for (let i = 0; i < texto.length; i++) bytes[i] = texto.charCodeAt(i);
  return bytes;
}

function mesmosBytes(a, b) {
  if (!a || !b) return false;
  const x = new Uint8Array(a);
  const y = new Uint8Array(b);
  if (x.length !== y.length) return false;
  for (let i = 0; i < x.length; i++) if (x[i] !== y[i]) return false;
  return true;
}

function comPrazo(promessa, ms) {
  return new Promise((resolve) => {
    const t = setTimeout(() => resolve(null), ms);
    Promise.resolve(promessa).then(
      (v) => { clearTimeout(t); resolve(v); },
      () => { clearTimeout(t); resolve(null); },
    );
  });
}

/* Pede a permissao. Safari antigo usa "callback" em vez de promessa:
   aceita os dois jeitos. A chamada sai na hora (dentro do toque). */
function pedirPermissao() {
  return new Promise((resolve) => {
    try {
      const r = Notification.requestPermission((p) => resolve(p));
      if (r && typeof r.then === "function") {
        r.then(resolve, () => resolve(Notification.permission));
      }
    } catch {
      resolve(Notification.permission);
    }
  });
}

/* Garante o service worker registrado e pronto (ou null). */
async function swPronto() {
  try {
    if (!("serviceWorker" in navigator)) return null;
    await navigator.serviceWorker.register(ARQUIVO_SW).catch(() => null);
    return await comPrazo(navigator.serviceWorker.ready, ESPERA_SW_MS);
  } catch {
    return null;
  }
}

/* Pega a inscricao deste aparelho ou cria uma nova (so com a chave). */
async function inscricaoDoAparelho(registro) {
  try {
    if (!registro || !registro.pushManager || !CHAVE_PUBLICA_PUSH) return null;
    const chave = chaveEmBytes(CHAVE_PUBLICA_PUSH);
    let inscricao = await registro.pushManager.getSubscription();

    /* Inscricao feita com outra chave (a chave mudou): refaz. */
    if (inscricao) {
      const chaveAntiga = inscricao.options && inscricao.options.applicationServerKey;
      if (chaveAntiga && !mesmosBytes(chaveAntiga, chave)) {
        await inscricao.unsubscribe().catch(() => {});
        inscricao = null;
      }
    }

    if (!inscricao) {
      inscricao = await registro.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: chave,
      });
    }
    return inscricao || null;
  } catch {
    return null;
  }
}

/* Grava (ou atualiza) a linha desta pessoa + aparelho. Erro: ignora. */
async function gravarInscricao(userId, inscricao) {
  try {
    if (!userId || !inscricao) return;
    const json = typeof inscricao.toJSON === "function" ? inscricao.toJSON() : {};
    const endpoint = json.endpoint || inscricao.endpoint;
    const p256dh = json.keys && json.keys.p256dh;
    const auth = json.keys && json.keys.auth;
    if (!endpoint || !p256dh || !auth) return;
    await supabase
      .from("inscricoes_push")
      .upsert(
        {
          user_id: userId,
          endpoint,
          p256dh,
          auth,
          ativa: true,
          atualizado_em: new Date().toISOString(),
        },
        { onConflict: "user_id,endpoint" },
      );
  } catch {
    /* tabela ainda nao existe ou sem internet: segue */
  }
}

/* ---------- acoes ---------- */

/* CHAMAR DENTRO DO TOQUE no botao "Ativar". Devolve o estado novo. */
export async function ativarNotificacoes(userId) {
  try {
    if (!temSuporte()) return estadoNotificacoes();

    /* 1) PRIMEIRA coisa, antes de qualquer outra espera: o pedido de
          permissao (no iPhone, so vale dentro do toque). */
    const permissao = await pedirPermissao();

    if (permissao === "denied") return "bloqueadas";
    if (permissao !== "granted") return "ativar"; // fechou o aviso sem responder

    /* 2) Permissao dada: tira a marca de "desligadas" deste aparelho. */
    marcarDesligadas(false);

    /* 3) Service worker + inscricao (so com a chave publica; sem ela,
          fica so com a permissao e a inscricao vem depois). */
    if (CHAVE_PUBLICA_PUSH) {
      const registro = await swPronto();
      const inscricao = await inscricaoDoAparelho(registro);
      await gravarInscricao(userId, inscricao);
    } else {
      await swPronto();
    }

    return estadoNotificacoes();
  } catch {
    return estadoNotificacoes();
  }
}

/* Desliga NO APP (a permissao do celular continua dada). Devolve
   "desligadas". */
export async function desligarNotificacoes(userId) {
  marcarDesligadas(true);
  try {
    if (!("serviceWorker" in navigator)) return "desligadas";
    const registro = await comPrazo(navigator.serviceWorker.getRegistration(), ESPERA_SW_MS);
    const inscricao =
      registro && registro.pushManager
        ? await registro.pushManager.getSubscription().catch(() => null)
        : null;
    if (!inscricao) return "desligadas";

    const endpoint = inscricao.endpoint;
    await inscricao.unsubscribe().catch(() => {});

    if (userId && endpoint) {
      try {
        await supabase
          .from("inscricoes_push")
          .update({ ativa: false, atualizado_em: new Date().toISOString() })
          .eq("user_id", userId)
          .eq("endpoint", endpoint);
      } catch {
        /* tabela ainda nao existe ou sem internet: segue */
      }
    }
  } catch {
    /* segue */
  }
  return "desligadas";
}

/* Para chamar ao abrir o app ou a tela: se estiver "ligadas", garante
   que este aparelho esta inscrito e gravado no banco (ex.: a pessoa
   ativou antes de existir a chave ou a tabela). */
export async function garantirInscricaoPush(userId) {
  try {
    if (!userId || !CHAVE_PUBLICA_PUSH) return;
    if (estadoNotificacoes() !== "ligadas") return;
    const registro = await swPronto();
    const inscricao = await inscricaoDoAparelho(registro);
    await gravarInscricao(userId, inscricao);
  } catch {
    /* segue */
  }
}
