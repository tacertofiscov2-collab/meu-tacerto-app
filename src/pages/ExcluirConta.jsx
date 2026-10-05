/* EXCLUIRCONTA v6 — padrao do Perfil: confirmacoes em linhas (sem cartoes), letras maiores, campos com 16px (sem zoom no iPhone), botoes em contorno vermelho (v5: piloto: aviso "Excluir todos os lançamentos" (opcao que nao existe) escondido */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Check, Info } from "lucide-react";
import TopoRolavel from "../components/TopoRolavel.jsx";
import { useAppState } from "@/context/AppStateContext";
import { supabase } from "@/lib/supabase";
import { MOSTRAR_INACABADOS } from "@/config/piloto";

/* ===================================================================
   EXCLUIRCONTA v5 (04/10/2026) — PILOTO: o aviso "Se você quiser
   apenas zerar sua conta... 'Excluir todos os lançamentos'" ficou
   escondido (MOSTRAR_INACABADOS em src/config/piloto.js): essa opcao
   nao existe no app. A exclusao em si nao mudou.
   =================================================================== */

/* ===================================================================
   EXCLUIRCONTA v4 (28/09/2026): o cabecalho passou para DENTRO da area
   que rola (TopoRolavel): o titulo sobe com a rolagem e a setinha fica
   parada e transparente. A setinha continua fazendo o mesmo: na etapa 2
   volta para a etapa 1; na etapa 1 volta para a tela anterior. Nada
   mais mudou.

   EXCLUIRCONTA v3

   MUDANCAS DA v2 PARA A v3 (pedido do Fernando, 17/09/2026):

     1) TITULO AO LADO DA SETA, nao centralizado.
        Era `flex-1 text-center` com um `pr-10` para compensar a seta.
        Agora acompanha o padrao do resto do app (ver EditarPerfil.jsx
        e AlterarWhatsapp.jsx): seta a esquerda, titulo logo ao lado.

     2) FOLGA FIXA NO FIM DO CONTEUDO.
        O `:focus-within` do index.css da meia tela de espaco enquanto
        um campo esta em foco — mas some quando o foco sai. A folga
        abaixo existe sempre, entao a tela tem para onde rolar mesmo
        antes de tocar em qualquer campo.

   HERDADO DA v2 — POR QUE UM SO ELEMENTO ROLA:
     A tela misturava os dois padroes: raiz `min-h-screen` (pagina
     rolava) e miolo com `overflow-y-auto` (conteudo tambem rolava).
     Dois elementos disputando o mesmo gesto e o que dava a sensacao de
     travada. Agora e `.tela-rolavel` + `.conteudo-rolavel`, e so o
     miolo rola.

   ATENCAO AO MEXER: o `.conteudo-rolavel` precisa ser filho DIRETO do
   `.tela-rolavel`. Se alguem enfiar uma div no meio, a rolagem quebra
   de novo e o sintoma volta sem aviso.
   =================================================================== */

/* Folga no fim do conteudo, para a tela sempre ter para onde rolar. */
const FOLGA_TECLADO = 320;

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
  const [excluindo, setExcluindo] = useState(false);

  const podeContinuar = ck1 && ck2;
  const podeExcluir = palavra.trim().toUpperCase() === "EXCLUIR";

  const fieldStyle = {
    backgroundColor: "var(--field)",
    border: "1px solid var(--border)",
    color: "var(--text)",
  };

  function voltar() {
    if (etapa === 2) setEtapa(1);
    else navigate(-1);
  }

  async function excluirDefinitivo() {
    if (excluindo) return;
    setExcluindo(true);

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

    // 1) Apaga a conta NO SERVIDOR (Auth + tabelas via cascade) chamando
    //    a Edge Function. Sem isso, a conta continuaria viva no Supabase.
    try {
      const { data: sessao } = await supabase.auth.getSession();
      const token = sessao?.session?.access_token;
      if (!token) {
        toast.error("Sua sessão expirou. Entre de novo para excluir.");
        setExcluindo(false);
        return;
      }
      const { error } = await supabase.functions.invoke("excluir-conta", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (error) {
        toast.error("Não foi possível excluir agora. Tente de novo.");
        setExcluindo(false);
        return;
      }
    } catch {
      toast.error("Falha de conexão. Tente de novo.");
      setExcluindo(false);
      return;
    }

    // 2) Servidor OK: agora desloga e limpa o aparelho.
    try { await supabase.auth.signOut(); } catch {}
    try { resetarConta(); } catch {}
    try {
      localStorage.removeItem("tacerto_app_state");
      localStorage.removeItem("tacerto_contas");
    } catch {}
    toast.success("Conta excluída.");
    navigate("/", { replace: true });
  }

  return (
    <div
      className="tela-rolavel w-full flex flex-col"
      style={{ backgroundColor: "var(--bg)", color: "var(--text)" }}
    >
      <div
        className="conteudo-rolavel hide-scrollbar px-5"
        style={{
          paddingBottom: `calc(${FOLGA_TECLADO}px + env(safe-area-inset-bottom))`,
        }}
      >
        {/* Seta a esquerda, titulo ao lado — padrao do app (agora rola junto) */}
        <TopoRolavel titulo="Excluir conta" onVoltar={voltar} />

        {etapa === 1 ? (
          <div className="space-y-5">
            <div className="space-y-2 pt-2">
              <h2 className="text-2xl font-bold leading-tight" style={{ color: "var(--text)" }}>
                Você está prestes a excluir sua conta
              </h2>
              <p style={{ color: "var(--text-secondary)", fontSize: 15.5, lineHeight: 1.45 }}>
                Confirme essas informações importantes sobre sua conta antes de continuar com a exclusão
              </p>
            </div>

            {/* Card 1 */}
            <div className="flex items-start gap-3" style={{ padding: "16px 0", borderTop: "1px solid color-mix(in srgb, var(--border) 55%, transparent)" }}>
              <div className="pt-0.5">
                <Checkbox
                  checked={ck1}
                  onChange={setCk1}
                  ariaLabel="Confirmo sobre os lançamentos"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold" style={{ color: "var(--text)", fontSize: 16.5 }}>
                  Seus lançamentos dentro do app
                </p>
                <p className="mt-1 leading-relaxed" style={{ color: "var(--text-secondary)", fontSize: 14 }}>
                  Todas as movimentações serão excluídas e não poderão ser restauradas.
                </p>
              </div>
            </div>

            {/* Card 2 */}
            <div className="flex items-start gap-3" style={{ padding: "16px 0", borderTop: "1px solid color-mix(in srgb, var(--border) 55%, transparent)" }}>
              <div className="pt-0.5">
                <Checkbox
                  checked={ck2}
                  onChange={setCk2}
                  ariaLabel="Confirmo sobre os dados"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold" style={{ color: "var(--text)", fontSize: 16.5 }}>
                  Seus dados dentro do app
                </p>
                <p className="mt-1 leading-relaxed" style={{ color: "var(--text-secondary)", fontSize: 14 }}>
                  Você concorda que está ciente que os dados excluídos não serão restaurados em nenhum momento.
                </p>
              </div>
            </div>

            {/* Aviso info — piloto (v5): escondido, a opcao citada nao existe */}
            {MOSTRAR_INACABADOS && (
              <div className="flex items-start gap-3 px-1">
                <Info size={18} style={{ color: "var(--text-secondary)" }} className="shrink-0 mt-0.5" />
                <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                  Se você quiser apenas zerar sua conta, volte na tela anterior e selecione a opção "Excluir todos os lançamentos"
                </p>
              </div>
            )}

            <div className="pt-2 space-y-3">
              <button
                disabled={!podeContinuar}
                onClick={() => podeContinuar && setEtapa(2)}
                className={`${podeContinuar ? "botao-perigo " : ""}w-full py-4 rounded-xl font-semibold transition-opacity`}
                style={{
                  backgroundColor: "transparent",
                  border: "1px solid var(--border)",
                  color: "var(--text-tertiary)",
                  fontSize: 16,
                  cursor: podeContinuar ? "pointer" : "not-allowed",
                }}
              >
                Continuar com exclusão
              </button>
              <button
                onClick={() => navigate("/perfil")}
                className="w-full py-2 font-medium"
                style={{ color: "var(--text-secondary)", fontSize: 15.5 }}
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
              <p style={{ color: "var(--text-secondary)", fontSize: 15.5, lineHeight: 1.45 }}>
                Vamos sentir a sua falta! Pode nos dizer qual o motivo da exclusão? Assim podemos melhorar ainda mais nosso app.
              </p>
            </div>

            {/* Motivo */}
            <div className="space-y-2">
              <label className="font-medium" style={{ color: "var(--text)", fontSize: 15.5 }}>
                Motivo
              </label>
              <textarea
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                placeholder="Digite seu motivo aqui (opcional)"
                rows={4}
                className="campo-tacerto w-full px-4 py-3 rounded-xl focus:outline-none resize-y"
                style={{ ...fieldStyle, fontSize: 16, maxHeight: "200px", minHeight: "96px" }}
              />
            </div>

            <hr style={{ border: 0, borderTop: "1px solid var(--border)", opacity: 0.6 }} />

            {/* Confirmação por palavra */}
            <div className="space-y-2">
              <label className="font-medium" style={{ color: "var(--text)", fontSize: 15.5 }}>
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
                className="campo-tacerto w-full px-4 py-3 rounded-xl focus:outline-none"
                style={{ ...fieldStyle, fontSize: 16 }}
              />
            </div>

            <div className="pt-2 space-y-3">
              <button
                disabled={!podeExcluir || excluindo}
                onClick={() => podeExcluir && excluirDefinitivo()}
                className={`${podeExcluir && !excluindo ? "botao-perigo " : ""}w-full py-4 rounded-xl font-semibold transition-opacity`}
                style={{
                  backgroundColor: "transparent",
                  border: "1px solid var(--border)",
                  color: "var(--text-tertiary)",
                  fontSize: 16,
                  cursor: podeExcluir && !excluindo ? "pointer" : "not-allowed",
                }}
              >
                {excluindo ? "Excluindo..." : "Excluir conta definitivamente"}
              </button>
              <button
                onClick={() => navigate("/perfil")}
                className="w-full py-2 font-medium"
                style={{ color: "var(--text-secondary)", fontSize: 15.5 }}
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