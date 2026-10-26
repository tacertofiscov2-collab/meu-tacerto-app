/* EMITIRNOTA v1 — emitir a nota fiscal de servico (NFS-e Nacional) direto no app: valor, o que foi feito e para quem; chama /api/nfse/emitir (servidor da Vercel) e mostra a nota com o PDF. Enquanto nao houver certificado A1, o servidor esta no modo simulado e a nota sai marcada como TESTE. Rota /emitir-nota; fora dos menus enquanto MOSTRAR_EMISSAO_PROPRIA = false. */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, FileDown } from "lucide-react";
import { toast } from "sonner";
import TopoRolavel from "../components/TopoRolavel.jsx";
import { supabase } from "@/lib/supabase";
import { CODIGO_SERVICO_NOTA } from "@/config/piloto";

const campo = {
  backgroundColor: "transparent",
  border: "1px solid var(--border)",
  color: "var(--text)",
  fontSize: 16, // iPhone: abaixo de 16px o Safari da zoom
};

const soDigitos = (v) => v.replace(/\D/g, "");

/* "15000" -> "150,00" enquanto digita */
function mascaraValor(v) {
  const d = soDigitos(v).replace(/^0+/, "").slice(0, 10);
  if (!d) return "";
  const n = Number(d) / 100;
  return n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function EmitirNota() {
  const navigate = useNavigate();
  const [valor, setValor] = useState("");
  const [descricao, setDescricao] = useState("");
  const [documento, setDocumento] = useState("");
  const [nome, setNome] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [nota, setNota] = useState(null);

  const numeroValor = Number(soDigitos(valor)) / 100;
  const doc = soDigitos(documento);
  const docOk = doc.length === 0 || doc.length === 11 || doc.length === 14;
  const pode = numeroValor > 0 && descricao.trim().length >= 3 && docOk && !enviando;

  async function emitir() {
    if (!pode) return;
    setEnviando(true);
    try {
      const { data } = await supabase.auth.getSession();
      const token = data?.session?.access_token;
      if (!token) { toast("Entre na sua conta para emitir a nota."); return; }
      const r = await fetch("/api/nfse/emitir", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          valor: numeroValor,
          descricao: descricao.trim(),
          cTribNac: CODIGO_SERVICO_NOTA,
          ...(doc ? { tomador: { documento: doc, nome: nome.trim() } } : {}),
        }),
      });
      const resp = await r.json().catch(() => null);
      if (resp?.ok) {
        setNota(resp);
      } else if (resp?.motivo === "desligada") {
        toast("A emissão de nota ainda não está liberada.");
      } else {
        toast(resp?.mensagem || "Não deu para emitir agora. Tente de novo.");
      }
    } catch {
      toast("Sem conexão. Tente de novo.");
    } finally {
      setEnviando(false);
    }
  }

  function baixarPdf() {
    const a = document.createElement("a");
    a.href = `data:application/pdf;base64,${nota.pdfBase64}`;
    a.download = `nota-${nota.chaveAcesso.slice(-8)}.pdf`;
    a.click();
  }

  return (
    <div className="tela-rolavel w-full flex flex-col" style={{ backgroundColor: "var(--bg)", color: "var(--text)" }}>
      <div className="conteudo-rolavel hide-scrollbar px-5" style={{ paddingBottom: "calc(24px + env(safe-area-inset-bottom))" }}>
        <TopoRolavel titulo="Emitir nota" onVoltar={() => navigate(-1)} />

        <div className="max-w-sm w-full mx-auto pt-6">
          {nota ? (
            <div className="flex flex-col items-center text-center">
              <CheckCircle2 size={44} style={{ color: "var(--primary)" }} />
              <p className="font-bold" style={{ fontSize: 20, marginTop: 14 }}>Nota emitida</p>
              {nota.ambiente !== "producao" && (
                <p style={{ fontSize: 13, color: "var(--text-tertiary)", marginTop: 6 }}>Teste — sem valor fiscal</p>
              )}
              <p style={{ fontSize: 12, color: "var(--text-tertiary)", marginTop: 14, wordBreak: "break-all" }}>
                {nota.chaveAcesso}
              </p>
              <button onClick={baixarPdf} className="botao-confirmar w-full py-3.5 rounded-xl font-semibold flex items-center justify-center gap-2"
                style={{ marginTop: 24, backgroundColor: "var(--primary)", color: "var(--primary-contrast)", fontSize: 15 }}>
                <FileDown size={18} /> Baixar PDF
              </button>
              <button onClick={() => { setNota(null); setValor(""); setDescricao(""); setDocumento(""); setNome(""); }}
                className="w-full py-3 rounded-xl font-semibold" style={{ marginTop: 8, color: "var(--text-secondary)", fontSize: 15 }}>
                Emitir outra
              </button>
            </div>
          ) : (
            <div className="flex flex-col" style={{ gap: 14 }}>
              <label className="flex flex-col" style={{ gap: 6 }}>
                <span style={{ fontSize: 14, color: "var(--text-secondary)" }}>Valor</span>
                <input inputMode="numeric" placeholder="R$ 0,00" value={valor ? `R$ ${valor}` : ""}
                  onChange={(e) => setValor(mascaraValor(e.target.value))}
                  className="campo-tacerto w-full px-4 py-3.5 rounded-xl focus:outline-none" style={campo} />
              </label>
              <label className="flex flex-col" style={{ gap: 6 }}>
                <span style={{ fontSize: 14, color: "var(--text-secondary)" }}>O que foi feito</span>
                <textarea rows={3} maxLength={500} placeholder="Ex.: frete de Divinópolis a BH" value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  className="campo-tacerto w-full px-4 py-3.5 rounded-xl focus:outline-none resize-none" style={campo} />
              </label>
              <label className="flex flex-col" style={{ gap: 6 }}>
                <span style={{ fontSize: 14, color: "var(--text-secondary)" }}>CPF ou CNPJ de quem pagou (opcional)</span>
                <input inputMode="numeric" placeholder="Só números" value={documento} maxLength={18}
                  onChange={(e) => setDocumento(e.target.value)}
                  className="campo-tacerto w-full px-4 py-3.5 rounded-xl focus:outline-none" style={campo} />
                {!docOk && <span style={{ fontSize: 13, color: "var(--text-tertiary)" }}>CPF tem 11 números; CNPJ tem 14.</span>}
              </label>
              {doc.length > 0 && (
                <label className="flex flex-col" style={{ gap: 6 }}>
                  <span style={{ fontSize: 14, color: "var(--text-secondary)" }}>Nome de quem pagou</span>
                  <input value={nome} maxLength={150} onChange={(e) => setNome(e.target.value)}
                    className="campo-tacerto w-full px-4 py-3.5 rounded-xl focus:outline-none" style={campo} />
                </label>
              )}
              <button onClick={emitir} disabled={!pode} className="botao-confirmar w-full py-3.5 rounded-xl font-semibold"
                style={{ marginTop: 8, backgroundColor: "var(--primary)", color: "var(--primary-contrast)", fontSize: 15, opacity: pode ? 1 : 0.4 }}>
                {enviando ? "Emitindo..." : "Emitir nota"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
