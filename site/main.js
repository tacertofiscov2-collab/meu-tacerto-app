/* MAIN v3 — média mensal arredondada e menu no tablet (v2: simulador, links e movimento) */
const APP_URL = "https://meu-tacerto-app.vercel.app";

document.querySelectorAll("a[data-app]").forEach(link => {
  link.href = `${APP_URL}/${link.dataset.app}`;
});

(() => {
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const money = cents => (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const input = document.querySelector("#recebido");
  const month = document.querySelector("#mes");
  const now = new Date();
  const currentMonth = now.getMonth();
  // A abertura precisa ter acontecido: meses futuros não podem ser escolhidos.
  Array.from(month.options).forEach(option => { option.disabled = Number(option.value) > currentMonth; });
  month.value = String(currentMonth);
  let received = 0;
  function update() {
    const truck = document.querySelector('input[name="tipo"]:checked').value === "caminhoneiro";
    const opened = document.querySelector('input[name="abertura"]:checked').value === "sim";
    document.querySelector("#month-field").hidden = !opened;
    // Valores em centavos preservam os R$ 0,02 do limite proporcional de julho.
    const limit = opened ? (truck ? 2096667 : 675000) * (12 - Number(month.value)) : (truck ? 25160000 : 8100000);
    const percentage = received / limit * 100;
    const remaining = Math.max(0, limit - received);
    const band = received > limit * 1.2 ? "excess" : received > limit ? "over" : percentage >= 80 ? "watch" : "ok";
    const warnings = {
      ok: "Seu faturamento está dentro do limite.",
      watch: "Fique de olho. Você está perto do limite do ano.",
      over: "Passou, mas até 20%: continua MEI até dezembro e paga uma guia extra. Em janeiro vira Microempresa.",
      excess: `Passou mais de 20%: procure um contador o quanto antes. Você deixa de ser MEI desde ${opened ? "a abertura" : "1º de janeiro do mesmo ano"}. Os impostos são recalculados com multa e juros.`
    };
    document.querySelector("#sim-percent").textContent = `Você já usou ${percentage.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}% do limite`;
    document.querySelector("#sim-remaining").textContent = `Ainda pode faturar ${money(remaining)}`;
    document.querySelector("#sim-average").textContent = `Dá uma média de ${money(Math.round(remaining / (12 - currentMonth)))} por mês até dezembro`;
    document.querySelector("#sim-warning").textContent = warnings[band];
    document.querySelector("#sim-limit").textContent = `Limite ${opened ? "proporcional" : "anual"} de ${now.getFullYear()}: ${money(limit)}.${opened ? " O mês da abertura conta inteiro." : ""}`;
    document.querySelector(".sim-result").dataset.band = band;
    const angle = Math.min(100, percentage) * 1.8;
    document.querySelector("#sim-needle").style.transform = `rotate(${angle}deg)`;
    document.querySelector("#sim-fill").setAttribute("stroke-dasharray", `${Math.min(100, percentage)} 100`);
  }
  input.addEventListener("input", () => {
    const digits = input.value.replace(/\D/g, "").replace(/^0+/, "").slice(0, 12);
    received = Number(digits || 0);
    input.value = money(received);
    update();
  });
  document.querySelector(".sim-form").addEventListener("change", update);
  update();

  const device = /android/i.test(navigator.userAgent) ? "android" : /iPhone|iPad|iPod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1) ? "ios" : null;
  if (device) {
    const card = document.querySelector(`#install-${device}`);
    card.classList.add("highlighted");
    card.querySelector(".device-note").hidden = false;
  }

  const needle = document.querySelector(".hero-needle");
  const fill = document.querySelector(".hero .gauge-fill");
  function animateHero() {
    if (reduced.matches) return;
    needle.animate([{ transform: "rotate(0deg)" }, { transform: "rotate(104.4deg)" }], { duration: 1100, easing: "cubic-bezier(.2,.7,.2,1)" });
    fill.animate([{ strokeDasharray: "0 100" }, { strokeDasharray: "58 100" }], { duration: 1100, easing: "cubic-bezier(.2,.7,.2,1)" });
  }
  animateHero();
  const reveals = document.querySelectorAll("main > section:not(.hero):not(.facts)");
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.remove("reveal-pending"); observer.unobserve(entry.target); }
    }), { threshold: 0.04 });
    if (!reduced.matches) reveals.forEach(section => { section.classList.add("reveal-pending"); observer.observe(section); });
    const bar = document.querySelector(".mobile-cta");
    const hero = document.querySelector(".hero");
    const final = document.querySelector(".final-cta");
    const updateBar = () => {
      bar.hidden = !(hero.getBoundingClientRect().bottom <= 0 && final.getBoundingClientRect().top >= innerHeight);
    };
    const ctaObserver = new IntersectionObserver(updateBar);
    ctaObserver.observe(hero);
    ctaObserver.observe(final);
    addEventListener("resize", updateBar, { passive: true });
    updateBar();
  }
  reduced.addEventListener("change", () => {
    if (reduced.matches) {
      document.getAnimations().forEach(animation => animation.finish());
      reveals.forEach(section => section.classList.remove("reveal-pending"));
    }
  });
})();
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
  window.matchMedia("(min-width: 1001px)").addEventListener?.("change", () => setOpen(false));
})();
