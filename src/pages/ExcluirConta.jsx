import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft, Check, Info } from "lucide-react";
import { useAppState } from "@/context/AppStateContext";

function Checkbox({ checked, onChange, ariaLabel }) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={ariaLabel}
      onClick={() => onChange(!checked)}
      className="w-6 h-6 rounded-md flex items-center justify-center shrink-0 transition-colors"
      style={{
        backgroundColor: checked ? "var(--primary)" : "transparent",
        border: `1.5px solid ${checked ? "var(--primary)" : "var(--border)"}`,
      }}
    >
      {checked && <Check size={16} strokeWidth={3} color="#ffffff" />}
    </button>
  );
}

export default function ExcluirConta() {
  const navigate = useNavigate();
  const { resetarConta } = useAppState();

  const [etapa, setEtapa] = useState(1); // 1 = avisos, 2 = confirmação
  const [ck1, setCk1] = useState(false);
  const [ck2, setCk2] = useState(false);
  const [motivo, setMotivo] = useState("");
  const [palavra, setPalavra] = useState("");

  const podeContinuar = ck1 && ck2;
  const podeExcluir = palavra === "EXCLUIR";

  const cardStyle = {
    backgroundColor: "var(--surface)",
    border: "1px solid var(--border)",
  };

  const fieldStyle = {
    backgroundColor: "var(--field)",
    border: "1px solid var(--border)",
    color: "var(--text)",
  };

  function voltar() {
    if (etapa === 2) setEtapa(1);
    else navigate(-1);
  }

  function excluirDefinitivo() {
    // salvar feedback (se houver motivo)
    if (motivo.trim()) {
      try {
        const raw = localStorage.getItem("tacerto_feedback_exclusoes");
        const arr = raw ? JSON.parse(raw) : [];
        const lista = Array.isArray(arr) ? arr : [];
        lista.push({ motivo: motivo.trim(), data: new Date().toISOString() });
        localStorage.setItem("tacerto_feedback_exclusoes", JSON.stringify(lista));
      } catch {}
    }
    // reset completo
    try {
      resetarConta();
    } catch {}
    try {
      localStorage.removeItem("tacerto_app_state");
      localStorage.removeItem("tacerto_contas");
    } catch {}
    toast.success("Conta excluída.");
    navigate("/", { replace: true });
  }

  return (
    <div
      className="min-h-screen min-h-[100dvh] w-full flex flex-col"
      style={{ backgroundColor: "var(--bg)", color: "var(--text)" }}
    >
      <header className="px-5 pt-6 pb-4 flex items-center gap-3">
        <button
          onClick={voltar}
          aria-label="Voltar"
          className="w-10 h-10 rounded-full flex items-center justify-center hover:opacity-80"
          style={{ background: "linear-gradient(160deg, rgba(255,255,255,0.13) 0%, rgba(255,255,255,0.05) 24%, rgba(255,255,255,0) 58%), rgba(14,14,16,0.82)", backdropFilter: "blur(24px) saturate(160%)", WebkitBackdropFilter: "blur(24px) saturate(160%)", border: "1px solid rgba(255,255,255,0.12)", boxShadow: "inset 0 1.5px 0 0 rgba(255,255,255,0.40), inset 0 9px 20px -8px rgba(255,255,255,0.28), inset 0 -1.5px 0 0 rgba(0,0,0,0.30), 0 8px 24px rgba(0,0,0,0.38)" }}
        >
          <ArrowLeft size={20} style={{ color: "var(--text)" }} />
        </button>
        <h1
          className="flex-1 text-center text-lg font-bold pr-10"
          style={{ color: "var(--text)" }}
        >
          Excluir conta
        </h1>
      </header>

      <div className="flex-1 overflow-y-auto px-5 pb-8">
        {etapa === 1 ? (
          <div className="space-y-5">
            <div className="space-y-2 pt-2">
              <h2 className="text-2xl font-bold leading-tight" style={{ color: "var(--text)" }}>
                Você está prestes a excluir sua conta
              </h2>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                Confirme essas informações importantes sobre sua conta antes de continuar com a exclusão
              </p>
            </div>

            {/* Card 1 */}
            <div className="rounded-2xl p-4 flex items-start gap-3" style={cardStyle}>
              <div className="pt-0.5">
                <Checkbox
                  checked={ck1}
                  onChange={setCk1}
                  ariaLabel="Confirmo sobre os lançamentos"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>
                  Seus lançamentos dentro do app
                </p>
                <p className="text-xs mt-1 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                  Todas as movimentações serão excluídas e não poderão ser restauradas.
                </p>
              </div>
            </div>

            {/* Card 2 */}
            <div className="rounded-2xl p-4 flex items-start gap-3" style={cardStyle}>
              <div className="pt-0.5">
                <Checkbox
                  checked={ck2}
                  onChange={setCk2}
                  ariaLabel="Confirmo sobre os dados"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>
                  Seus dados dentro do app
                </p>
                <p className="text-xs mt-1 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                  Você concorda que está ciente que os dados excluídos não serão restaurados em nenhum momento.
                </p>
              </div>
            </div>

            {/* Aviso info */}
            <div className="flex items-start gap-3 px-1">
              <Info size={18} style={{ color: "var(--text-secondary)" }} className="shrink-0 mt-0.5" />
              <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                Se você quiser apenas zerar sua conta, volte na tela anterior e selecione a opção "Excluir todos os lançamentos"
              </p>
            </div>

            <div className="pt-2 space-y-3">
              <button
                disabled={!podeContinuar}
                onClick={() => podeContinuar && setEtapa(2)}
                className="w-full py-4 rounded-xl font-semibold transition-opacity"
                style={{
                  backgroundColor: podeContinuar ? "#ef4444" : "var(--field)",
                  color: podeContinuar ? "#ffffff" : "var(--text-secondary)",
                  cursor: podeContinuar ? "pointer" : "not-allowed",
                }}
              >
                Continuar com exclusão
              </button>
              <button
                onClick={() => navigate("/perfil")}
                className="w-full py-2 text-sm font-medium"
                style={{ color: "var(--text-secondary)" }}
              >
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="space-y-2 pt-2">
              <h2 className="text-2xl font-bold leading-tight" style={{ color: "var(--text)" }}>
                Você tem certeza que deseja excluir esta conta?
              </h2>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                Vamos sentir a sua falta! Pode nos dizer qual o motivo da exclusão? Assim podemos melhorar ainda mais nosso app.
              </p>
            </div>

            {/* Motivo */}
            <div className="space-y-2">
              <label className="text-sm font-medium" style={{ color: "var(--text)" }}>
                Motivo
              </label>
              <textarea
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                placeholder="Digite seu motivo aqui (opcional)"
                rows={4}
                className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 resize-y"
                style={{ ...fieldStyle, maxHeight: "200px", minHeight: "96px" }}
              />
            </div>

            <hr style={{ border: 0, borderTop: "1px solid var(--border)", opacity: 0.6 }} />

            {/* Confirmação por palavra */}
            <div className="space-y-2">
              <label className="text-sm font-medium" style={{ color: "var(--text)" }}>
                Digite a palavra{" "}
                <span style={{ color: "#ef4444", fontWeight: 700 }}>EXCLUIR</span>{" "}
                para confirmar
              </label>
              <input
                type="text"
                value={palavra}
                onChange={(e) => setPalavra(e.target.value)}
                placeholder="Digite aqui"
                autoCapitalize="characters"
                autoCorrect="off"
                spellCheck={false}
                className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2"
                style={fieldStyle}
              />
            </div>

            <div className="pt-2 space-y-3">
              <button
                disabled={!podeExcluir}
                onClick={() => podeExcluir && excluirDefinitivo()}
                className="w-full py-4 rounded-xl font-semibold transition-opacity"
                style={{
                  backgroundColor: podeExcluir ? "#ef4444" : "var(--field)",
                  color: podeExcluir ? "#ffffff" : "var(--text-secondary)",
                  cursor: podeExcluir ? "pointer" : "not-allowed",
                }}
              >
                Excluir conta definitivamente
              </button>
              <button
                onClick={() => navigate("/perfil")}
                className="w-full py-2 text-sm font-medium"
                style={{ color: "var(--text-secondary)" }}
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


