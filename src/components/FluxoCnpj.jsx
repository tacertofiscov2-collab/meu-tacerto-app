/* FLUXOCNPJ v1 — "Qual o CNPJ do seu MEI?" (digitar com mascara, validar e buscar os dados publicos na BrasilAPI) e "Achei você" (nome, tipo de MEI e "MEI desde"); usado no Onboarding e no Perfil (/perfil/cnpj) */
import { useEffect, useRef, useState } from "react";
import { ArrowRight, Loader2, AlertTriangle } from "lucide-react";
import {
  formatarCnpj, soDigitosCnpj, cnpjValido, buscarCnpj, mesAnoTexto,
} from "@/lib/cnpj";
import { LABEL_PERFIL } from "@/lib/perfil";

/* ===================================================================
   CNPJ (10/10/2026 — tarefa de 08-10, decisao do Fernando)

   "Aparece so quando precisa": o CNPJ e OPCIONAL. Uma frase diz o
   beneficio ("Com ele eu preencho o resto pra você") e "Preencher
   depois" sempre funciona.

   1) PassoDigitarCnpj: mascara 00.000.000/0000-00, teclado numerico,
      letra de 16px (o iPhone nao da zoom), confere os digitos
      verificadores antes de buscar. "Buscar" vai na BrasilAPI (8 s no
      maximo, src/lib/cnpj.js). Nao achou ou falhou: avisa quem chamou
      (onFalhou) e a pessoa segue normal.
   2) PassoAcheiVoce: o nome (razao social sem o numero do comeco),
      "Parece MEI Caminhoneiro" (CNAE 4930-2, principal ou secundario)
      ou "Parece MEI", e "MEI desde MM/AAAA". Tipo errado: 1 toque em
      "Trocar" troca na propria tela (so no cadastro; no Perfil o tipo
      e travado — regra do app — e a tela so avisa). Se a Receita diz
      que o CNPJ nao e MEI: aviso curto em amarelo, e segue.
   =================================================================== */

const AMARELO = "#f59e0b";

/* Botao principal: contorno verde (o unico verde da tela) */
const estiloBotaoPrincipal = {
  backgroundColor: "transparent",
  border: "1.5px solid var(--primary)",
  color: "var(--primary)",
  width: 232,
  height: 52,
};
const classeBotaoPrincipal =
  "btn-pill-tacerto mx-auto flex items-center justify-center gap-2 rounded-full font-semibold text-[15px] disabled:opacity-35";

export function PassoDigitarCnpj({
  valorInicial = "",
  onAchou,
  onFalhou,
  onPular,
  textoPular = "Preencher depois",
  autoFocus = true,
}) {
  const [digitos, setDigitos] = useState(() => soDigitosCnpj(valorInicial));
  const [buscando, setBuscando] = useState(false);
  const campoRef = useRef(null);
  const ativoRef = useRef(true);
  useEffect(() => () => { ativoRef.current = false; }, []);

  const completo = digitos.length === 14;
  const valido = completo && cnpjValido(digitos);
  const mostrarErro = completo && !valido;

  async function buscar() {
    if (!valido || buscando) return;
    campoRef.current?.blur();
    setBuscando(true);
    const r = await buscarCnpj(digitos);
    if (!ativoRef.current) return;
    setBuscando(false);
    if (r.ok) onAchou?.(r.dados);
    else onFalhou?.(digitos, r.motivo);
  }

  return (
    <div className="shrink-0">
      <h1 className="text-2xl font-bold text-center" style={{ color: "var(--text)", marginBottom: 8 }}>
        Qual o CNPJ do seu MEI?
      </h1>
      <p className="text-center" style={{ color: "var(--text-secondary)", fontSize: 15, marginBottom: 20 }}>
        Com ele eu preencho o resto pra você.
      </p>

      <input
        ref={campoRef}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        autoFocus={autoFocus}
        aria-label="CNPJ do MEI"
        placeholder="00.000.000/0000-00"
        value={formatarCnpj(digitos)}
        onChange={(e) => setDigitos(soDigitosCnpj(e.target.value))}
        onKeyDown={(e) => { if (e.key === "Enter") buscar(); }}
        className="campo-tacerto w-full px-4 py-3.5 rounded-xl text-center placeholder:opacity-60"
        style={{
          backgroundColor: "transparent",
          border: "1px solid var(--card-borda)",
          color: "var(--text)",
          fontSize: 18,
          letterSpacing: "0.02em",
        }}
      />

      <div style={{ minHeight: 30 }} className="flex items-center justify-center">
        {mostrarErro ? (
          <p className="text-center" style={{ color: "var(--danger)", fontSize: 13.5 }}>
            Confira os números do CNPJ.
          </p>
        ) : (
          <p className="text-center" style={{ color: "var(--text-tertiary)", fontSize: 13.5 }}>
            Está no boleto do DAS ou no app MEI do governo.
          </p>
        )}
      </div>

      <button
        type="button"
        onClick={buscar}
        disabled={!valido || buscando}
        className={classeBotaoPrincipal}
        style={{ ...estiloBotaoPrincipal, marginTop: 6 }}
      >
        {buscando ? (
          <>
            <Loader2 size={18} className="animate-spin" />
            Buscando...
          </>
        ) : (
          <>
            Buscar
            <ArrowRight size={18} strokeWidth={2.4} />
          </>
        )}
      </button>

      {onPular && (
        <button
          type="button"
          onClick={onPular}
          disabled={buscando}
          className="w-full text-center text-[15px] pt-4 disabled:opacity-40"
          style={{ color: "var(--text-secondary)" }}
        >
          {textoPular}
        </button>
      )}
    </div>
  );
}

/* ===================================================================
   "ACHEI VOCÊ"
   tipo            o tipo que vai ser gravado (o detectado, ou o que a
                   pessoa trocou com 1 toque)
   tipoDetectado   o que o CNAE sugere (para o "Parece ...")
   onTrocarTipo    so no cadastro; sem ele, nao aparece "Trocar"
   tipoNoApp       so no Perfil: o tipo de hoje, para avisar se o CNPJ
                   sugere outro
   =================================================================== */
export function PassoAcheiVoce({
  dados,
  tipo,
  tipoDetectado,
  onTrocarTipo,
  tipoNoApp,
  onConfirmar,
  onNaoSouEu,
  salvando = false,
}) {
  const desde = mesAnoTexto(dados?.dataOpcaoMei);
  const nome = dados?.nome || dados?.razaoSocial || "";
  const rotuloTipo = LABEL_PERFIL[tipo] || "MEI";
  const ehODetectado = tipo === tipoDetectado;
  const tipoDiferenteDoApp = tipoNoApp && tipoNoApp !== tipoDetectado;

  return (
    <div className="shrink-0">
      <h1 className="text-2xl font-bold text-center" style={{ color: "var(--text)", marginBottom: 20 }}>
        Achei você
      </h1>

      <div
        className="rounded-2xl text-left"
        style={{ border: "1px solid var(--card-borda)", padding: "16px 18px" }}
      >
        <p className="font-bold leading-snug" style={{ color: "var(--text)", fontSize: 19, overflowWrap: "anywhere" }}>
          {nome}
        </p>
        <p style={{ color: "var(--text-secondary)", fontSize: 14.5, marginTop: 4 }}>
          CNPJ {formatarCnpj(dados?.cnpj)}
        </p>
        {desde && (
          <p style={{ color: "var(--text-secondary)", fontSize: 14.5, marginTop: 2 }}>
            MEI desde {desde}
          </p>
        )}

        <div
          className="flex items-center"
          style={{ gap: 10, marginTop: 14, paddingTop: 12, borderTop: "1px solid var(--border)" }}
        >
          <p className="flex-1 min-w-0 font-semibold" style={{ color: "var(--text)", fontSize: 15.5 }}>
            {ehODetectado ? `Parece ${rotuloTipo}` : rotuloTipo}
          </p>
          {onTrocarTipo && (
            <button
              type="button"
              onClick={onTrocarTipo}
              className="toque shrink-0 rounded-full font-medium"
              style={{ fontSize: 14, padding: "6px 14px", border: "1px solid var(--border)", color: "var(--text-secondary)" }}
            >
              Trocar
            </button>
          )}
        </div>
        {tipoDiferenteDoApp && (
          <p style={{ color: "var(--text-tertiary)", fontSize: 13.5, marginTop: 6, lineHeight: 1.45 }}>
            No app você está como {LABEL_PERFIL[tipoNoApp] || "MEI"}. Para trocar, use “Tipo de MEI”.
          </p>
        )}
      </div>

      {dados?.opcaoMei === false && (
        <p
          className="flex items-center justify-center text-center"
          style={{ gap: 6, color: AMARELO, fontSize: 14, marginTop: 14 }}
        >
          <AlertTriangle size={15} strokeWidth={2.2} className="shrink-0" />
          Esse CNPJ não aparece como MEI na Receita
        </p>
      )}

      <button
        type="button"
        onClick={onConfirmar}
        disabled={salvando}
        className={classeBotaoPrincipal}
        style={{ ...estiloBotaoPrincipal, marginTop: 24 }}
      >
        {salvando ? <Loader2 size={18} className="animate-spin" /> : (
          <>
            Está certo
            <ArrowRight size={18} strokeWidth={2.4} />
          </>
        )}
      </button>
      <button
        type="button"
        onClick={onNaoSouEu}
        disabled={salvando}
        className="w-full text-center text-[15px] pt-4 disabled:opacity-40"
        style={{ color: "var(--text-secondary)" }}
      >
        Não sou eu
      </button>
    </div>
  );
}
