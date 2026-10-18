/* CENTRAL app v1 — telas Início, Pedir, Aprovar e Conferir.
   Tudo que vem do GitHub entra na tela como texto (nunca como HTML). */

const tela = document.getElementById("tela");
const abas = document.getElementById("abas");
const folha = document.getElementById("folha");
const folhaFundo = document.getElementById("folha-fundo");
const aviso = document.getElementById("aviso");

const estado = {
  aba: "inicio",
  dados: null,
  carregadoEm: 0,
  agente: "chatgpt",
  rascunho: "",
  soResponder: false,
  conjuntos: null,
  conjuntoAberto: null,
  infoPrints: {},
};

try {
  estado.rascunho = localStorage.getItem("central_rascunho") || "";
} catch { /* sem armazenamento: tudo bem */ }

// ---------- utilidades ----------
function h(tag, attrs = {}, ...filhos) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v === undefined || v === null || v === false) continue;
    if (k === "class") el.className = v;
    else if (k.startsWith("on")) el.addEventListener(k.slice(2), v);
    else if (k === "html") el.innerHTML = v; // só para ícones fixos deste arquivo
    else el.setAttribute(k, v === true ? "" : v);
  }
  for (const f of filhos.flat()) {
    if (f === null || f === undefined || f === false) continue;
    el.append(f instanceof Node ? f : document.createTextNode(String(f)));
  }
  return el;
}

const ICONES = {
  seta: '<svg viewBox="0 0 24 24"><path d="M5 12h14"/><path d="M13 6l6 6-6 6"/></svg>',
  externo: '<svg viewBox="0 0 24 24"><path d="M14 4h6v6"/><path d="M20 4l-9 9"/><path d="M19 14v5H5V5h5"/></svg>',
  atualizar: '<svg viewBox="0 0 24 24"><path d="M20 12a8 8 0 1 1-2.3-5.6"/><path d="M20 4v5h-5"/></svg>',
  cadeado: '<svg viewBox="0 0 24 24"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>',
  fechar: '<svg viewBox="0 0 24 24"><path d="M6 6l12 12"/><path d="M18 6L6 18"/></svg>',
};
const icone = (nome) => h("span", { html: ICONES[nome], "aria-hidden": "true", style: "display:flex" });

function haQuanto(iso) {
  if (!iso) return "";
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "agora";
  if (s < 3600) return `há ${Math.floor(s / 60)} min`;
  if (s < 86400) return `há ${Math.floor(s / 3600)} h`;
  const d = Math.floor(s / 86400);
  return d === 1 ? "ontem" : `há ${d} dias`;
}

function avisar(texto, erro = false) {
  aviso.textContent = texto;
  aviso.className = erro ? "aviso erro" : "aviso";
  aviso.hidden = false;
  clearTimeout(avisar.t);
  avisar.t = setTimeout(() => (aviso.hidden = true), erro ? 6000 : 3500);
}

async function api(caminho, opcoes = {}) {
  const r = await fetch(caminho, {
    method: opcoes.metodo || "GET",
    headers: opcoes.dados ? { "Content-Type": "application/json" } : {},
    body: opcoes.dados ? JSON.stringify(opcoes.dados) : undefined,
    credentials: "same-origin",
  });
  if (r.status === 401 && caminho !== "/api/entrar") {
    estado.dados = null;
    mostrarEntrar();
    throw new Error("Entre com a senha.");
  }
  const corpo = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(corpo.erro || `Erro ${r.status}`);
  return corpo;
}

/** Copia o texto (dentro do toque, para o iPhone deixar) e abre o link. */
function copiarEAbrir(texto, link) {
  let copiou = false;
  try {
    const area = h("textarea", { readonly: true, style: "position:fixed;top:0;left:0;opacity:0;font-size:16px" });
    area.value = texto;
    document.body.append(area);
    area.focus();
    area.setSelectionRange(0, texto.length);
    copiou = document.execCommand("copy");
    area.remove();
  } catch { /* segue para o outro jeito */ }
  if (navigator.clipboard?.writeText) navigator.clipboard.writeText(texto).catch(() => {});
  if (link) window.open(link, "_blank", "noopener");
  avisar(copiou ? "Pedido copiado. É só colar e enviar." : "Abri. Se não colar, use o botão Copiar.");
}

function copiar(texto) {
  copiarEAbrir(texto, null);
}

// ---------- folha (sheet) ----------
function abrirFolha(...conteudo) {
  folha.replaceChildren(...conteudo);
  folha.hidden = false;
  folhaFundo.hidden = false;
  document.body.style.overflow = "hidden";
}
function fecharFolha() {
  folha.hidden = true;
  folhaFundo.hidden = true;
  document.body.style.overflow = "";
}
folhaFundo.addEventListener("click", fecharFolha);

function confirmar(titulo, texto, botaoSim, acao) {
  abrirFolha(
    h("h2", { style: "font-size:20px" }, titulo),
    texto ? h("p", { class: "nota", style: "margin:0" }, texto) : null,
    h(
      "div",
      { class: "botoes" },
      h("button", { class: "botao", onclick: fecharFolha }, "Cancelar"),
      h(
        "button",
        {
          class: "botao verde",
          onclick: async (e) => {
            e.currentTarget.disabled = true;
            e.currentTarget.textContent = "Um momento…";
            try {
              await acao();
              fecharFolha();
            } catch (err) {
              fecharFolha();
              avisar(err.message, true);
            }
          },
        },
        botaoSim
      )
    )
  );
}

// ---------- navegação ----------
function irPara(aba) {
  estado.aba = aba;
  for (const b of abas.querySelectorAll(".aba")) {
    if (b.dataset.aba === aba) b.setAttribute("aria-current", "page");
    else b.removeAttribute("aria-current");
  }
  desenhar();
  window.scrollTo(0, 0);
}
abas.addEventListener("click", (e) => {
  const b = e.target.closest(".aba");
  if (b) irPara(b.dataset.aba);
});

async function carregar(silencioso = false) {
  try {
    estado.dados = await api("/api/estado");
    estado.carregadoEm = Date.now();
    abas.hidden = false;
    const n = estado.dados.prs.filter((p) => p.tipo === "juntar" || p.tipo === "destino-errado").length;
    const bolinha = document.getElementById("bolinha-aprovar");
    bolinha.hidden = n === 0;
    bolinha.textContent = String(n);
    desenhar();
  } catch (e) {
    if (!silencioso && estado.dados !== null) avisar(e.message, true);
    else if (!silencioso && !tela.querySelector(".entrar")) {
      tela.replaceChildren(h("div", { class: "carregando" }, e.message));
    }
  }
}

function desenhar() {
  if (!estado.dados) return;
  const telas = { inicio: telaInicio, pedir: telaPedir, aprovar: telaAprovar, conferir: telaConferir };
  tela.replaceChildren(...[telas[estado.aba]()].flat(Infinity).filter(Boolean));
}

// ---------- entrar ----------
function mostrarEntrar() {
  abas.hidden = true;
  const campo = h("input", {
    type: "password",
    id: "senha",
    autocomplete: "current-password",
    placeholder: "Senha da Central",
    enterkeyhint: "go",
  });
  const botao = h("button", { class: "botao verde", type: "submit" }, "Entrar");
  const form = h(
    "form",
    {
      class: "secao",
      onsubmit: async (e) => {
        e.preventDefault();
        botao.disabled = true;
        try {
          await api("/api/entrar", { metodo: "POST", dados: { senha: campo.value } });
          tela.replaceChildren(h("div", { class: "carregando" }, "Carregando…"));
          await carregar();
          irPara("inicio");
        } catch (err) {
          avisar(err.message, true);
          botao.disabled = false;
        }
      },
    },
    h("label", { class: "rotulo", for: "senha" }, "Senha"),
    campo,
    botao
  );
  tela.replaceChildren(
    h(
      "div",
      { class: "secao entrar" },
      h("div", {}, h("div", { class: "sobretitulo" }, "Central"), h("h1", {}, "Entrar")),
      form,
      h("p", { class: "nota" }, "A senha fica salva neste celular por 90 dias.")
    )
  );
}

// ---------- pedido (folha com o texto para colar) ----------
function folhaPedido(pedido) {
  const ag = estado.dados.projeto.agentes[pedido.para];
  const prompt = pedido.prompt || "";
  abrirFolha(
    h(
      "div",
      { class: "topo" },
      h(
        "div",
        {},
        h("div", { class: "sobretitulo" }, `Pedido #${pedido.numero} · ${ag.nome}`),
        h("h2", { style: "font-size:19px;margin-top:4px" }, pedido.titulo)
      ),
      h("button", { class: "chip", "aria-label": "Fechar", onclick: fecharFolha }, icone("fechar"))
    ),
    pedido.estado === "aguardando"
      ? h(
          "div",
          { class: "secao" },
          h("div", { class: "passo" }, h("b", {}, "1"), h("span", {}, `Toque em "Copiar e abrir o ${ag.nome}".`)),
          h("div", { class: "passo" }, h("b", {}, "2"), h("span", {}, ag.dica)),
          h("div", { class: "passo" }, h("b", {}, "3"), h("span", {}, "Quando ele abrir o PR, o pedido aparece em Aprovar."))
        )
      : null,
    prompt ? h("pre", {}, prompt) : h("p", { class: "nota" }, "Este pedido não tem texto pronto."),
    prompt
      ? h(
          "button",
          { class: "botao verde", onclick: () => copiarEAbrir(prompt, ag.abrir) },
          `Copiar e abrir o ${ag.nome}`,
          icone("externo")
        )
      : null,
    h(
      "div",
      { class: "botoes" },
      prompt ? h("button", { class: "botao", onclick: () => copiar(prompt) }, "Só copiar") : null,
      h("a", { class: "botao", href: pedido.url, target: "_blank", rel: "noopener" }, "Ver no GitHub")
    ),
    pedido.estado !== "feito"
      ? h(
          "button",
          {
            class: "botao",
            style: "border-color:transparent;color:var(--apagado)",
            onclick: () =>
              confirmar(
                "Marcar como feito?",
                "Use quando o pedido foi resolvido sem PR (ex.: só uma resposta).",
                "Marcar como feito",
                async () => {
                  const r = await api("/api/aprovar", {
                    metodo: "POST",
                    dados: { acao: "fechar-pedido", numero: pedido.numero },
                  });
                  avisar(r.mensagem);
                  carregar(true);
                }
              ),
          },
          "Marcar como feito"
        )
      : null
  );
}

// ---------- tela: Início ----------
function telaInicio() {
  const d = estado.dados;
  const esperando = d.prs.filter((p) => p.tipo === "juntar" || p.tipo === "destino-errado");
  const abertos = d.pedidos.filter((p) => p.estado !== "feito");
  const previas = d.previas.filter((p) => !p.producao).slice(0, 4);

  return [
    h(
      "div",
      { class: "topo" },
      h("div", {}, h("div", { class: "sobretitulo" }, d.projeto.nomeCurto), h("h1", {}, "Olá, Fernando")),
      h(
        "button",
        {
          class: "chip",
          onclick: async (e) => {
            e.currentTarget.disabled = true;
            await carregar();
            avisar("Atualizado.");
          },
          "aria-label": "Atualizar",
        },
        h("span", { class: d.robo.rodando ? "ponto amarelo" : "ponto" }),
        d.robo.rodando ? "Tirando prints" : haQuanto(d.agora)
      )
    ),

    h(
      "div",
      { class: "secao" },
      h(
        "div",
        { class: "secao-topo" },
        h("h2", {}, "Esperando você"),
        esperando.length ? h("a", { href: "#", onclick: (e) => (e.preventDefault(), irPara("aprovar")), class: "pequeno" }, "Ver tudo") : null
      ),
      esperando.length
        ? esperando.slice(0, 3).map((pr) =>
            h(
              "button",
              { class: "linha", onclick: () => irPara("aprovar") },
              h(
                "div",
                { class: "esq" },
                h("div", { class: "titulo" }, pr.titulo),
                h("div", { class: "pequeno apagado" }, `PR #${pr.numero} · ${pr.head} · ${haQuanto(pr.criado)}`)
              ),
              pr.tipo === "juntar"
                ? h("span", { class: "etiqueta verde" }, "Aprovar")
                : h("span", { class: "etiqueta amarela" }, "Destino errado")
            )
          )
        : h("div", { class: "vazio" }, "Nada para aprovar agora.")
    ),

    h(
      "div",
      { class: "secao" },
      h("h2", {}, "Pedidos"),
      abertos.length
        ? abertos.slice(0, 6).map((p) =>
            h(
              "button",
              { class: "linha", onclick: () => (p.estado === "pronto" ? irPara("aprovar") : folhaPedido(p)) },
              h(
                "div",
                { class: "esq" },
                h("div", { class: "titulo" }, `#${p.numero} ${p.titulo}`),
                h(
                  "div",
                  { class: "pequeno apagado" },
                  `${d.projeto.agentes[p.para].nome} · ${haQuanto(p.criado)}`
                )
              ),
              p.estado === "pronto"
                ? h("span", { class: "etiqueta verde" }, `PR #${p.pr}`)
                : h("span", { class: "etiqueta contorno" }, "Enviar")
            )
          )
        : h("div", { class: "vazio" }, "Nenhum pedido aberto.")
    ),

    h(
      "div",
      { class: "secao" },
      h("h2", {}, "Testar no iPhone"),
      previas.length
        ? h(
            "div",
            { class: "grade2" },
            previas.map((p) =>
              h(
                "a",
                { class: "cartao", href: p.url, target: "_blank", rel: "noopener", style: "text-decoration:none;color:var(--texto)" },
                h("div", { class: "pequeno apagado" }, `Prévia · ${haQuanto(p.quando)}`),
                h("div", { style: "font-weight:500;word-break:break-word" }, p.branch)
              )
            )
          )
        : h("div", { class: "vazio" }, "Nenhuma prévia recente.")
    ),

    d.diario.length
      ? h(
          "div",
          { class: "secao" },
          h("h2", {}, "Diário"),
          h(
            "div",
            { class: "cartao" },
            d.diario.slice(0, 3).map((l) => h("div", { class: "pequeno apagado", style: "line-height:1.5" }, l))
          )
        )
      : null,

    h(
      "div",
      { class: "secao" },
      h(
        "button",
        {
          class: "botao verde grande",
          onclick: () => {
            estado.agente = "chatgpt";
            irPara("pedir");
          },
        },
        h("span", {}, "Pedir ao ChatGPT", h("small", {}, "Dia a dia · faz e te avisa")),
        icone("seta")
      ),
      h(
        "button",
        {
          class: "botao grande",
          onclick: () => {
            estado.agente = "claude";
            irPara("pedir");
          },
        },
        h("span", {}, "Chamar o Claude", h("small", { class: "apagado" }, "Caso grave · revisa e conserta")),
        icone("seta")
      )
    ),

    h(
      "div",
      { class: "atalhos" },
      d.projeto.links.map((l) => h("a", { href: l.url, target: "_blank", rel: "noopener" }, l.nome))
    ),
    h(
      "button",
      {
        class: "chip",
        style: "align-self:center",
        onclick: async () => {
          await api("/api/entrar", { metodo: "DELETE" }).catch(() => {});
          estado.dados = null;
          mostrarEntrar();
        },
      },
      "Sair"
    ),
  ];
}

// ---------- tela: Pedir ----------
function telaPedir() {
  const ag = estado.dados.projeto.agentes;
  const area = h("textarea", {
    id: "pedido",
    placeholder: "Ex.: trocar o texto do botão Entrar por Começar na tela inicial.",
    oninput: (e) => {
      estado.rascunho = e.target.value;
      try {
        localStorage.setItem("central_rascunho", estado.rascunho);
      } catch { /* sem armazenamento */ }
    },
  });
  area.value = estado.rascunho;

  const opcao = (id) =>
    h(
      "button",
      {
        class: "opcao",
        "aria-pressed": String(estado.agente === id),
        onclick: () => {
          estado.agente = id;
          desenhar();
        },
      },
      h("b", {}, ag[id].nome),
      h("span", {}, ag[id].papel)
    );

  const caixa = h("input", {
    type: "checkbox",
    id: "so-responder",
    checked: estado.soResponder,
    onchange: (e) => (estado.soResponder = e.target.checked),
  });

  const enviar = h(
    "button",
    {
      class: "botao verde",
      style: "min-height:56px",
      onclick: async (e) => {
        const texto = area.value.trim();
        if (texto.length < 5) return avisar("Escreva o pedido primeiro.", true);
        const b = e.currentTarget;
        b.disabled = true;
        b.textContent = "Criando o pedido…";
        try {
          const r = await api("/api/pedido", {
            metodo: "POST",
            dados: { para: estado.agente, texto, soResponder: estado.soResponder },
          });
          estado.rascunho = "";
          try {
            localStorage.removeItem("central_rascunho");
          } catch { /* sem armazenamento */ }
          area.value = "";
          folhaPedido({
            numero: r.numero,
            titulo: texto.split("\n")[0],
            para: estado.agente,
            estado: "aguardando",
            prompt: r.prompt,
            url: r.url,
          });
          carregar(true);
        } catch (err) {
          avisar(err.message, true);
        }
        b.disabled = false;
        b.textContent = "Criar pedido";
      },
    },
    "Criar pedido"
  );

  return [
    h("div", {}, h("div", { class: "sobretitulo" }, "Novo pedido"), h("h1", {}, "Para quem?")),
    h("div", { class: "escolha" }, opcao("chatgpt"), opcao("claude")),
    h("div", { class: "secao" }, h("label", { class: "rotulo", for: "pedido" }, "O que você quer?"), area),
    h(
      "label",
      { class: "troca", for: "so-responder" },
      h("span", {}, "Só investigar e responder", h("div", { class: "pequeno apagado" }, "Sem mexer no código")),
      caixa
    ),
    h(
      "p",
      { class: "nota", style: "margin:0" },
      "O pedido fica guardado no GitHub. Ele trabalha numa cópia; o app só muda quando você aprovar. Os prints saem sozinhos quando a prévia fica pronta."
    ),
    enviar,
  ];
}

// ---------- tela: Aprovar ----------
function telaAprovar() {
  const d = estado.dados;
  const previaDe = (branch) => d.previas.find((p) => p.branch === branch);
  const ordem = { juntar: 0, "destino-errado": 1, outro: 2, "so-claude": 3 };
  const prs = [...d.prs].sort((a, b) => ordem[a.tipo] - ordem[b.tipo]);

  const cartaoPR = (pr) => {
    const previa = previaDe(pr.head);
    const pedidos = pr.pedidos.length ? ` · Pedido #${pr.pedidos.join(", #")}` : "";
    let acoes;
    if (pr.tipo === "juntar") {
      acoes = h(
        "button",
        {
          class: "botao verde",
          disabled: pr.rascunho,
          onclick: () =>
            confirmar(
              "Juntar no piloto?",
              `"${pr.titulo}" vai para ${d.projeto.branchPiloto}. Dá para desfazer depois com o Claude.`,
              "Sim, juntar",
              async () => {
                const r = await api("/api/aprovar", { metodo: "POST", dados: { acao: "juntar", numero: pr.numero } });
                avisar(r.mensagem);
                await carregar(true);
              }
            ),
        },
        pr.rascunho ? "Ainda em rascunho" : "Aprovar e juntar"
      );
    } else if (pr.tipo === "destino-errado") {
      acoes = h(
        "button",
        {
          class: "botao verde",
          onclick: () =>
            confirmar(
              "Trocar o destino?",
              `Este PR aponta para ${pr.base}. Vou apontar para ${d.projeto.branchPiloto}.`,
              "Trocar",
              async () => {
                const r = await api("/api/aprovar", {
                  metodo: "POST",
                  dados: { acao: "corrigir-destino", numero: pr.numero },
                });
                avisar(r.mensagem);
                await carregar(true);
              }
            ),
        },
        `Trocar destino para o piloto`
      );
    } else {
      acoes = h("div", { class: "cadeado" }, icone("cadeado"), h("span", {}, `Vai para ${pr.base}: só com o Claude.`));
    }

    return h(
      "div",
      { class: "cartao" },
      h(
        "div",
        { class: "secao-topo" },
        h("span", { class: "pequeno apagado" }, `PR #${pr.numero} · ${pr.head}`),
        pr.tipo === "destino-errado"
          ? h("span", { class: "pequeno", style: "color:var(--amarelo)" }, `Destino: ${pr.base}`)
          : h("span", { class: "pequeno apagado" }, haQuanto(pr.criado))
      ),
      h("div", { style: "font-size:16px;font-weight:500" }, pr.titulo),
      h("div", { class: "pequeno apagado" }, `De ${pr.autor}${pedidos}`),
      h(
        "div",
        { class: "botoes" },
        previa
          ? h("a", { class: "botao", href: previa.url, target: "_blank", rel: "noopener" }, "Abrir prévia")
          : h("button", { class: "botao", disabled: true }, "Prévia ainda não"),
        h(
          "button",
          {
            class: "botao",
            onclick: () => {
              estado.filtroBranch = pr.head;
              estado.conjuntoAberto = null;
              irPara("conferir");
            },
          },
          "Ver prints"
        )
      ),
      acoes,
      h("a", { href: pr.url, target: "_blank", rel: "noopener", class: "pequeno", style: "align-self:center" }, "Ver mudanças no GitHub")
    );
  };

  return [
    h(
      "div",
      {},
      h("div", { class: "sobretitulo" }, "Aprovar"),
      h("h1", {}, prs.length ? `${prs.length} ${prs.length === 1 ? "PR aberto" : "PRs abertos"}` : "Tudo em dia")
    ),
    prs.length ? prs.map(cartaoPR) : h("div", { class: "vazio" }, "Quando o ChatGPT ou o Claude abrirem um PR, ele aparece aqui."),
    h(
      "div",
      { class: "cartao" },
      h(
        "div",
        { class: "cadeado" },
        icone("cadeado"),
        h(
          "span",
          {},
          "Supabase, apagar dados e a main nunca aparecem aqui: só no chat com o Claude, com o seu \"pode\"."
        )
      ),
      h(
        "a",
        { class: "botao", href: d.projeto.agentes.claude.abrir, target: "_blank", rel: "noopener" },
        "Abrir o Claude"
      )
    ),
  ];
}

// ---------- tela: Conferir ----------
function telaConferir() {
  const d = estado.dados;
  const corpo = h("div", { class: "secao" }, h("div", { class: "carregando" }, "Carregando prints…"));

  const pedirNovo = () => {
    const opcoes = d.previas;
    if (!opcoes.length) return avisar("Não achei prévia para fotografar.", true);
    const sel = h(
      "select",
      { id: "previa", "aria-label": "Qual prévia" },
      opcoes.map((p, i) => h("option", { value: String(i) }, `${p.branch} · ${haQuanto(p.quando)}`))
    );
    abrirFolha(
      h("h2", { style: "font-size:20px" }, "Pedir print novo"),
      h("label", { class: "rotulo", for: "previa" }, "De qual prévia?"),
      sel,
      h("p", { class: "nota", style: "margin:0" }, "O robô tira os prints no tamanho do iPhone. Fica pronto em uns 2 minutos."),
      h(
        "div",
        { class: "botoes" },
        h("button", { class: "botao", onclick: fecharFolha }, "Cancelar"),
        h(
          "button",
          {
            class: "botao verde",
            onclick: async (e) => {
              e.currentTarget.disabled = true;
              const p = opcoes[Number(sel.value)];
              try {
                const r = await api("/api/prints", { metodo: "POST", dados: { url: p.url, branch: p.branch } });
                fecharFolha();
                avisar(r.mensagem);
              } catch (err) {
                fecharFolha();
                avisar(err.message, true);
              }
            },
          },
          "Pedir"
        )
      )
    );
  };

  const abrirVisor = (conjunto, telas, i) => {
    const t = telas[i];
    const visor = h(
      "div",
      { class: "visor", role: "dialog", "aria-label": t.nome },
      h(
        "div",
        { class: "barra" },
        h("div", {}, h("div", {}, t.nome), h("div", { class: "pequeno apagado" }, `${conjunto.branch} · ${t.caminho}`)),
        h("button", { class: "chip", "aria-label": "Fechar", onclick: () => visor.remove() }, icone("fechar"))
      ),
      h("img", { src: `/api/prints?id=${conjunto.id}&arquivo=${t.arquivo}`, alt: `Print: ${t.nome}` }),
      t.erros?.length
        ? h("div", { class: "pequeno", style: "color:var(--amarelo);padding:0 16px" }, `Erro no Console: ${t.erros[0]}`)
        : null,
      h(
        "div",
        { class: "barra-baixo" },
        h("button", { class: "botao", style: "flex:1", disabled: i === 0, onclick: () => (visor.remove(), abrirVisor(conjunto, telas, i - 1)) }, "Anterior"),
        h("button", { class: "botao", style: "flex:1", disabled: i === telas.length - 1, onclick: () => (visor.remove(), abrirVisor(conjunto, telas, i + 1)) }, "Próxima")
      )
    );
    document.body.append(visor);
  };

  const mostrarConjunto = async (conjuntos) => {
    if (!conjuntos.length) {
      corpo.replaceChildren(h("div", { class: "vazio" }, "Ainda não há prints. Eles saem sozinhos quando a Vercel termina uma prévia."));
      return;
    }
    let atual = conjuntos.find((c) => c.id === estado.conjuntoAberto);
    if (!atual && estado.filtroBranch) {
      const nome = estado.filtroBranch.replace(/[^A-Za-z0-9._-]/g, "-");
      atual = conjuntos.find((c) => c.branch === nome);
    }
    atual = atual || conjuntos[0];
    estado.conjuntoAberto = atual.id;
    estado.filtroBranch = null;

    const chips = h(
      "div",
      { class: "rolagem" },
      conjuntos.slice(0, 15).map((c) =>
        h(
          "button",
          {
            class: "chip",
            "aria-pressed": String(c.id === atual.id),
            onclick: () => {
              estado.conjuntoAberto = c.id;
              mostrarConjunto(conjuntos);
            },
          },
          `${c.branch} · ${haQuanto(c.criado)}`
        )
      )
    );
    corpo.replaceChildren(chips, h("div", { class: "carregando" }, "Abrindo…"));

    try {
      const info = estado.infoPrints[atual.id] || (await api(`/api/prints?id=${atual.id}`));
      estado.infoPrints[atual.id] = info;
      const telas = (info.telas || []).filter((t) => t.arquivo);
      const comErro = (info.telas || []).filter((t) => t.erros?.length).length;
      corpo.replaceChildren(
        chips,
        h(
          "div",
          { class: "pequeno apagado" },
          `${telas.length} telas · ${haQuanto(info.quando)}`,
          comErro ? h("span", { style: "color:var(--amarelo)" }, ` · ${comErro} com erro no Console`) : null
        ),
        h(
          "div",
          { class: "prints" },
          (info.telas || []).map((t, i) =>
            t.arquivo
              ? h(
                  "button",
                  { class: "print", onclick: () => abrirVisor(atual, telas, telas.indexOf(t)) },
                  h("img", { src: `/api/prints?id=${atual.id}&arquivo=${t.arquivo}`, alt: `Print: ${t.nome}`, loading: i > 3 ? "lazy" : "eager" }),
                  h("span", { class: "pequeno" }, t.nome, t.erros?.length ? h("span", { style: "color:var(--amarelo)" }, " · erro") : null)
                )
              : h("div", { class: "print" }, h("div", { class: "falhou" }, `Não abriu: ${t.nome}`), h("span", { class: "pequeno" }, t.nome))
          )
        ),
        info.url ? h("a", { class: "botao", href: info.url, target: "_blank", rel: "noopener" }, "Abrir esta prévia") : null
      );
    } catch (err) {
      corpo.replaceChildren(chips, h("div", { class: "vazio" }, err.message));
    }
  };

  (async () => {
    try {
      if (!estado.conjuntos || Date.now() - estado.conjuntos.em > 60000) {
        const r = await api("/api/prints");
        estado.conjuntos = { lista: r.conjuntos, em: Date.now() };
      }
      mostrarConjunto(estado.conjuntos.lista);
    } catch (err) {
      corpo.replaceChildren(h("div", { class: "vazio" }, err.message));
    }
  })();

  return [
    h(
      "div",
      { class: "topo" },
      h("div", {}, h("div", { class: "sobretitulo" }, "Conferir"), h("h1", {}, "Prints")),
      h("button", { class: "chip", onclick: pedirNovo }, "Pedir novo")
    ),
    corpo,
  ];
}

// ---------- começo ----------
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible" && estado.dados && Date.now() - estado.carregadoEm > 20000) {
    estado.conjuntos = null;
    carregar(true);
  }
});
setInterval(() => {
  if (document.visibilityState === "visible" && estado.dados && estado.aba !== "pedir") carregar(true);
}, 60000);

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("/sw.js").catch(() => {});
}

tela.replaceChildren(h("div", { class: "carregando" }, "Carregando…"));
carregar().then(() => estado.dados && irPara("inicio"));
