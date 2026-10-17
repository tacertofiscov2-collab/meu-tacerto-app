/* MAIN v3 — registra o /sw.js (service worker so de notificacao, sem cache) quando a pagina carrega (v2: tema padrao ESCURO quando nada foi escolhido (antes era "auto")) */
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import { AppStateProvider } from "./context/AppStateContext.jsx";
import "./index.css";

/* ===================================================================
   BOOT — aplica tema e tamanho de fonte ANTES do app desenhar a tela

   BUG CORRIGIDO (v2): quando o navegador nao tinha nenhuma escolha de
   tema guardada (janela anonima, aparelho novo, navegador que limpou os
   dados do site), o padrao aqui era "auto" — claro das 6h as 18h. De
   dia o app abria BRANCO sem ninguem ter escolhido isso, e so voltava
   ao escuro quando a pessoa abria Preferencias (que grava "escuro").

   Agora o padrao e "escuro", o tema oficial do app — o mesmo padrao do
   hook useTemaEscuroForcado. Quem ESCOLHER "Automatico" em Preferencias
   continua tendo claro de dia e escuro a noite.
   =================================================================== */
(function boot() {
  try {
    const tema = localStorage.getItem("tacerto_tema") || "escuro";
    const fonte = localStorage.getItem("tacerto_fonte") || "medium";
    const root = document.documentElement;

    let modo = tema;
    if (tema === "auto") {
      const h = new Date().getHours();
      modo = h >= 6 && h < 18 ? "claro" : "escuro";
    }
    root.classList.remove("theme-light");
    if (modo === "claro") root.classList.add("theme-light");

    root.classList.remove("font-small", "font-medium", "font-large");
    if (fonte === "small") root.classList.add("font-small");
    else if (fonte === "large") root.classList.add("font-large");
    else root.classList.add("font-medium");
  } catch {}
})();

createRoot(document.getElementById("root")).render(
  <AppStateProvider>
    <App />
  </AppStateProvider>,
);

/* ===================================================================
   v3: SERVICE WORKER (public/sw.js) — so para as notificacoes semanais

   Ele NAO guarda copia do app e NAO intercepta nada (sem cache, sem
   fetch), entao pode ser registrado sempre, ate no desenvolvimento:
   nao atrapalha o Vite nem faz o iPhone ver versao velha.
   Se o navegador nao tiver suporte ou o registro falhar, o app segue
   normal (so fica sem notificacao).
   =================================================================== */
if (typeof window !== "undefined" && "serviceWorker" in navigator) {
  const registrar = () => {
    try {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    } catch {}
  };
  if (document.readyState === "complete") registrar();
  else window.addEventListener("load", registrar, { once: true });
}