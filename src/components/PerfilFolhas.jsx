/* PERFILFOLHAS v2 — menos cor: janelas com fundo preto, sem barras cinza, item escolhido so mais claro (sem verde nem cinza); verde so no confirmar (v1: linha com campo (Nome), aviso "fale com a gente" e a folha "Seu tipo de MEI", agora usados pelo Perfil e pelo Editar perfil (vieram do EditarPerfil.jsx, sem mudar o visual)) */
import { useState } from "react";
import { ChevronRight, ChevronLeft, X } from "lucide-react";
import Valor from "./Valor.jsx";
import { LIMITES_ANUAIS } from "@/lib/fiscal";
import { LABEL_PERFIL, DIAS_PARA_CORRIGIR_TIPO } from "@/lib/perfil";

/* Linha da lista com um campo dentro (o Nome). E um <label>: tocar em
   qualquer ponto da linha abre o teclado no campo. `Icon` tambem serve
   para a SecaoLista recuar a risca igual as outras linhas. */
export function LinhaCampo({ Icon, rotulo, children }) {
  return (
    <label className="w-full flex items-center" style={{ gap: 14, padding: "14px 0", minHeight: 54 }}>
      <Icon size={20} strokeWidth={1.9} className="shrink-0" style={{ color: "var(--text-tertiary)" }} />
      <span className="shrink-0 font-medium" style={{ color: "var(--text)", fontSize: 16.5 }}>
        {rotulo}
      </span>
      {children}
    </label>
  );
}

/* Aviso simples (troca de WhatsApp / e-mail): texto + botao do
   WhatsApp + "Agora nao". */
export function AvisoFaleConosco({ texto, onWhatsApp, onFechar, cardStyle }) {
  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.7)" }}
      onClick={onFechar}
    >
      <div
        className="w-full max-w-sm rounded-2xl p-5"
        style={cardStyle}
        onClick={(e) => e.stopPropagation()}
      >
        <p style={{ color: "var(--text)", fontSize: 15, lineHeight: 1.5 }}>{texto}</p>
        <button
          onClick={onWhatsApp}
          className="botao-confirmar w-full py-3 rounded-xl font-semibold transition active:scale-[0.99]"
          style={{ marginTop: 18, backgroundColor: "var(--primary)", color: "var(--primary-contrast)", fontSize: 15 }}
        >
          Falar no WhatsApp
        </button>
        <button
          onClick={onFechar}
          className="w-full py-3 rounded-xl font-semibold"
          style={{ marginTop: 8, color: "var(--text-secondary)", fontSize: 15 }}
        >
          Agora não
        </button>
      </div>
    </div>
  );
}

/* ===================================================================
   FOLHA "SEU TIPO DE MEI" (EditarPerfil v12)

   O tipo segue o CNPJ e e travado. Passos: "inicio" (O que mudou?) ->
   "atividade" | "novoCnpj" | "errado" -> "confirmar" (so quando pode
   corrigir sozinho, nos primeiros DIAS_PARA_CORRIGIR_TIPO dias).
   =================================================================== */
export function FolhaTipoMei({ tipo, podeCorrigir, onFechar, onCorrigir, cardStyle }) {
  const [passo, setPasso] = useState("inicio");

  const outroTipo = tipo === "MEI_CAMINHONEIRO" ? "MEI" : "MEI_CAMINHONEIRO";
  const nomeOutro = outroTipo === "MEI" ? "MEI comum" : "MEI Caminhoneiro";

  const texto = { color: "var(--text-secondary)", fontSize: 14, lineHeight: 1.55 };
  const avisoEquipe = (
    <p style={{ ...texto, marginTop: 12, color: "var(--text-tertiary)", fontSize: 13 }}>
      Quando a troca valer no seu CNPJ, a equipe TaCerto atualiza seu tipo aqui
      no app.
    </p>
  );

  const botaoPrincipal = (rotulo, aoTocar) => (
    <button
      onClick={aoTocar}
      className="botao-confirmar w-full py-3 rounded-xl font-semibold transition active:scale-[0.99]"
      style={{
        marginTop: 16,
        backgroundColor: "var(--primary)",
        color: "var(--primary-contrast)",
        fontSize: 15,
      }}
    >
      {rotulo}
    </button>
  );

  const voltar = (
    <button
      onClick={() => setPasso("inicio")}
      className="flex items-center gap-1 active:opacity-70 transition"
      style={{ color: "var(--text-secondary)", fontSize: 13.5, marginBottom: 10 }}
    >
      <ChevronLeft size={16} />
      Voltar
    </button>
  );

  const opcao = (rotulo, destino) => (
    <button
      key={destino}
      onClick={() => setPasso(destino)}
      className="w-full rounded-xl px-4 py-3.5 flex items-center gap-3 text-left active:opacity-75 transition"
      style={{ border: "1px solid var(--border)" }}
    >
      <span className="flex-1 text-[14.5px] font-semibold" style={{ color: "var(--text)" }}>
        {rotulo}
      </span>
      <ChevronRight size={17} style={{ color: "var(--text-tertiary)" }} className="shrink-0" />
    </button>
  );

  let conteudo;

  if (passo === "inicio") {
    conteudo = (
      <>
        <div className="rounded-xl px-4 py-3" style={{ border: "1px solid var(--border)" }}>
          <p className="text-[15.5px] font-bold" style={{ color: "var(--text)" }}>
            {LABEL_PERFIL[tipo] || "MEI"}
          </p>
          <p
            className="text-[13px] mt-0.5 flex items-center gap-1"
            style={{ color: "var(--text-secondary)" }}
          >
            Limite de <Valor tamanho="sm">{LIMITES_ANUAIS[tipo] || LIMITES_ANUAIS.MEI}</Valor> no ano
          </p>
        </div>

        <p style={{ ...texto, marginTop: 12 }}>
          O tipo segue o que está registrado no seu CNPJ e define o seu limite. Por
          isso ele não muda por aqui.
        </p>

        <p
          className="text-[14px] font-semibold"
          style={{ color: "var(--text)", marginTop: 16, marginBottom: 8 }}
        >
          O que mudou?
        </p>
        <div className="space-y-2">
          {opcao("Mudei de atividade no mesmo CNPJ", "atividade")}
          {opcao("Fechei meu MEI e abri outro CNPJ", "novoCnpj")}
          {opcao("Escolhi errado no cadastro", "errado")}
        </div>
      </>
    );
  } else if (passo === "atividade") {
    conteudo = (
      <>
        {voltar}
        <p className="text-[15.5px] font-bold" style={{ color: "var(--text)" }}>
          Mudei de atividade no mesmo CNPJ
        </p>
        <p style={{ ...texto, marginTop: 8 }}>
          {tipo === "MEI_CAMINHONEIRO"
            ? "Se você passou a fazer outra atividade além do transporte de cargas, seu CNPJ vira MEI comum e o limite cai para R$ 81.000, já neste ano."
            : "A troca para MEI Caminhoneiro é feita no Portal do Empreendedor, e só em janeiro. Feita em janeiro, vale para o ano todo. Fora de janeiro, só passa a valer no ano seguinte."}
        </p>
        {avisoEquipe}
        {botaoPrincipal("Entendi", onFechar)}
      </>
    );
  } else if (passo === "novoCnpj") {
    conteudo = (
      <>
        {voltar}
        <p className="text-[15.5px] font-bold" style={{ color: "var(--text)" }}>
          Fechei meu MEI e abri outro CNPJ
        </p>
        <p style={{ ...texto, marginTop: 8 }}>
          O MEI fechado não volta, e o novo começa do zero, com limite proporcional
          aos meses que faltam no ano. O CNPJ antigo ainda precisa entregar a
          declaração de extinção.
        </p>
        {avisoEquipe}
        {botaoPrincipal("Entendi", onFechar)}
      </>
    );
  } else if (passo === "errado") {
    conteudo = (
      <>
        {voltar}
        <p className="text-[15.5px] font-bold" style={{ color: "var(--text)" }}>
          Escolhi errado no cadastro
        </p>
        {podeCorrigir ? (
          <>
            <p style={{ ...texto, marginTop: 8 }}>
              Nos primeiros {DIAS_PARA_CORRIGIR_TIPO} dias depois do cadastro, você
              mesmo pode corrigir.
            </p>
            {botaoPrincipal(`Trocar para ${nomeOutro}`, () => setPasso("confirmar"))}
          </>
        ) : (
          <>
            <p style={{ ...texto, marginTop: 8 }}>
              O prazo para corrigir sozinho passou ({DIAS_PARA_CORRIGIR_TIPO} dias
              depois do cadastro). Avise a equipe TaCerto e a gente corrige para você.
            </p>
            {botaoPrincipal("Entendi", onFechar)}
          </>
        )}
      </>
    );
  } else {
    // "confirmar"
    conteudo = (
      <>
        <p className="text-[15.5px] font-bold" style={{ color: "var(--text)" }}>
          Trocar para {nomeOutro}?
        </p>
        <p className="text-sm flex items-center gap-1 flex-wrap" style={{ ...texto, marginTop: 8 }}>
          O limite passa a ser <Valor tamanho="sm">{LIMITES_ANUAIS[outroTipo]}</Valor>.
        </p>
        <div className="flex gap-2" style={{ marginTop: 16 }}>
          <button
            onClick={() => setPasso("errado")}
            className="flex-1 py-3 rounded-xl font-semibold"
            style={{ border: "1px solid var(--border)", color: "var(--text)" }}
          >
            Cancelar
          </button>
          <button
            onClick={() => onCorrigir(outroTipo)}
            className="botao-confirmar flex-1 py-3 rounded-xl font-semibold"
            style={{ backgroundColor: "var(--primary)", color: "var(--primary-contrast)" }}
          >
            Confirmar
          </button>
        </div>
      </>
    );
  }

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.7)" }}
      onClick={onFechar}
    >
      <div
        className="w-full max-w-sm rounded-2xl p-5 relative"
        style={{ ...cardStyle, maxHeight: "calc(100dvh - 32px)", overflowY: "auto" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between" style={{ marginBottom: 12 }}>
          <h3 className="text-base font-bold" style={{ color: "var(--text)" }}>
            Seu tipo de MEI
          </h3>
          <button
            onClick={onFechar}
            aria-label="Fechar"
            className="rounded-full flex items-center justify-center shrink-0 active:scale-95 transition"
            style={{ width: 30, height: 30, border: "1px solid var(--border)" }}
          >
            <X size={15} style={{ color: "var(--text-secondary)" }} />
          </button>
        </div>
        {conteudo}
      </div>
    </div>
  );
}
