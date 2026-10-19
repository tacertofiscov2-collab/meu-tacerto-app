/* MAIN v6 — ponteiro acompanha a rolagem, movimento só nos instrumentos (v5: redução de movimento) */
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
    const remainingLabel = document.createElement("span");
    remainingLabel.textContent = "Ainda pode faturar ";
    const remainingValue = document.createElement("strong");
    remainingValue.textContent = money(remaining);
    document.querySelector("#sim-remaining").replaceChildren(remainingLabel, remainingValue);
    document.querySelector("#sim-average").textContent = `Dá uma média de ${money(Math.round(remaining / (12 - currentMonth)))} por mês até dezembro`;
    document.querySelector("#sim-warning").textContent = warnings[band];
    document.querySelector("#sim-limit").textContent = `Limite ${opened ? "proporcional" : "anual"} de ${now.getFullYear()}: ${money(limit)}.${opened ? " O mês da abertura conta inteiro." : ""}`;
    document.querySelector(".sim-result").dataset.band = band;
    const angle = Math.min(100, percentage) * 1.8;
    document.querySelector("#sim-needle").style.transform = `rotate(${angle}deg)`;
    document.querySelector("#sim-fill").setAttribute("stroke-dasharray", `${Math.min(100, percentage)} 100`);
    document.querySelector("#sim-fill").style.opacity = received === 0 ? "0" : "1";
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

  // O painel vai de 0 a 58 quando o celular entra na área de leitura.
  const panel = document.querySelector(".hero-instrument");
  const phone = document.querySelector(".product-stage > .phone");
  const needle = document.querySelector("#road-needle");
  const fill = document.querySelector("#road-fill");
  const value = document.querySelector("#road-value");
  let frame = 0;
  function drawRoadGauge() {
    frame = 0;
    const destination = Math.max(1, phone.getBoundingClientRect().top + scrollY - innerHeight * .78);
    const progress = Math.max(0, Math.min(1, scrollY / destination));
    const percentage = reduced.matches ? 58 : progress * 58;
    needle.style.transform = `rotate(${percentage * 1.8}deg)`;
    fill.setAttribute("stroke-dasharray", `${percentage} 100`);
    fill.style.opacity = percentage > 0 ? "1" : "0";
    value.textContent = String(Math.round(percentage)).padStart(2, "0");
    panel.dataset.percent = String(Math.round(percentage));
  }
  function scheduleRoadGauge() { if (!frame) frame = requestAnimationFrame(drawRoadGauge); }
  addEventListener("scroll", scheduleRoadGauge, { passive: true });
  addEventListener("resize", scheduleRoadGauge, { passive: true });
  reduced.addEventListener("change", scheduleRoadGauge);
  document.fonts?.ready.then(scheduleRoadGauge);
  drawRoadGauge();
  if ("IntersectionObserver" in window) {
    const countObserver = new IntersectionObserver(entries => entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      countObserver.unobserve(entry.target);
      if (reduced.matches) return;
      const target = Number(entry.target.dataset.count);
      let startTime;
      const draw = time => {
        if (!startTime) startTime = time;
        const progress = reduced.matches ? 1 : Math.min(1, (time - startTime) / 1000);
        const value = Math.round(target * (1 - Math.pow(1 - progress, 3)));
        entry.target.textContent = (entry.target.dataset.format === "currency" ? "R$ " : "") + value.toLocaleString("pt-BR");
        if (progress < 1) requestAnimationFrame(draw);
      };
      requestAnimationFrame(draw);
    }), { threshold: 0.6 });
    document.querySelectorAll("[data-count]").forEach(el => countObserver.observe(el));

    const timelineObserver = new IntersectionObserver(entries => {
      const active = entries.filter(entry => entry.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top).at(-1);
      if (!active) return;
      const index = active.target.dataset.step;
      document.querySelectorAll(".timeline-item").forEach(el => el.classList.toggle("is-active", el.dataset.step === index));
      document.querySelectorAll(".day-notification").forEach(el => {
        const selected = el.dataset.notification === index;
        el.classList.toggle("is-active", selected);
        el.setAttribute("aria-hidden", String(!selected));
      });
      document.querySelector(".day-clock").textContent = ["06:00", "11:00", "15:00", "21:00"][index];
    }, { rootMargin: "-30% 0px -40% 0px", threshold: 0 });
    document.querySelectorAll(".timeline-item").forEach(el => timelineObserver.observe(el));

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
  window.matchMedia("(min-width: 901px)").addEventListener?.("change", () => setOpen(false));
})();
