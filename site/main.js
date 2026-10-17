/* MAIN v1 — menu móvel acessível; perguntas usam details nativo, sem JavaScript */
(() => {
  const button = document.querySelector(".menu-toggle");
  const navigation = document.querySelector("#navegacao");
  if (!button || !navigation) return;
  document.documentElement.classList.add("js");

  function setOpen(open, returnFocus = false) {
    navigation.classList.toggle("is-open", open);
    button.setAttribute("aria-expanded", String(open));
    button.setAttribute("aria-label", open ? "Fechar menu" : "Abrir menu");
    if (returnFocus) button.focus();
  }

  button.addEventListener("click", () => setOpen(button.getAttribute("aria-expanded") !== "true"));
  navigation.addEventListener("click", (event) => {
    if (event.target.closest("a")) setOpen(false);
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && button.getAttribute("aria-expanded") === "true") setOpen(false, true);
  });
  document.addEventListener("click", (event) => {
    if (!event.target.closest(".site-header")) setOpen(false);
  });
  window.matchMedia("(min-width: 761px)").addEventListener?.("change", () => setOpen(false));
})();
