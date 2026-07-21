import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import { AppStateProvider } from "./context/AppStateContext.jsx";
import "./index.css";

(function boot() {
  try {
    const tema = localStorage.getItem("tacerto_tema") || "auto";
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