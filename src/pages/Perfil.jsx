import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import BottomNav from "../components/BottomNav.jsx";
import {
  ArrowLeft, User, Settings, Info, Shield, Users, Lock, LogOut,
  ChevronDown, ChevronRight, UserPlus, X, Check, Receipt, TrendingUp, BarChart3,
  Trash2,
} from "lucide-react";

import { useUserState, setUserState } from "@/lib/userState";
import {
  lerContas, lerContaAtivaId, ativarConta, removerAcessoConta,
} from "@/lib/contas";

const FOTO_KEY = "tacerto_foto_usuario";

function Secao({ titulo, children }) {
  return (
    <div style={{ marginTop: 18 }}>
      <p
        className="text-[12px] font-semibold uppercase mb-1"
        style={{ color: "var(--text-tertiary)", letterSpacing: "0.06em" }}
      >
        {titulo}
      </p>
      <div>{children}</div>
    </div>
  );
}

function Item({ Icon, label, onClick, cor, primeiro }) {
  return (
    <button
      onClick={onClick}
      className="toque w-full flex items-center gap-3 py-3 text-left"
      style={{
        borderTop: primeiro ? "none" : "1px solid var(--border)",
      }}
    >
      <Icon
        size={21}
        strokeWidth={2}
        style={{ color: cor || "var(--primary)" }}
        className="shrink-0"
      />
      <span
        className="flex-1 text-[15px] font-semibold"
        style={{ color: cor || "var(--text)" }}
      >
        {label}
      </span>
      <ChevronRight size={17} style={{ color: "var(--text-tertiary)" }} className="shrink-0" />
    </button>
  );
}

export default function Perfil() {
  const navigate = useNavigate();
  const { nome, visitante } = useUserState();

  const [foto, setFoto] = useState(() => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(FOTO_KEY) || null;
  });
  const [contas, setContas] = useState(lerContas);
  const [contaAtivaId, setContaAtivaId] = useState(lerContaAtivaId);
  const [seletorAberto, setSeletorAberto] = useState(false);
  const [confirmarSair, setConfirmarSair] = useState(false);
  const [contaARemover, setContaARemover] = useState(null);

  useEffect(() => {
    const handler = () => {
      setContas(lerContas());
      setContaAtivaId(lerContaAtivaId());
      try { setFoto(localStorage.getItem(FOTO_KEY) || null); } catch {}
    };
    window.addEventListener("storage", handler);
    window.addEventListener("tacerto-user-changed", handler);
    return () => {
      window.removeEventListener("storage", handler);
      window.removeEventListener("tacerto-user-changed", handler);
    };
  }, []);

  const totalContas = contas.length;
  const temMultiplas = !visitante && totalContas >= 2;
  const nomeExibido = nome && nome.trim() ? nome : "Visitante";
  const inicial = (nomeExibido || "?").trim().charAt(0).toUpperCase();
  const anoAtual = new Date().getFullYear();

  function trocarConta(id) {
    const conta = ativarConta(id);
    if (conta) {
      setUserState({
        nome: conta.nome || "",
        email: conta.email || "",
        visitante: false,
      });
      setContaAtivaId(id);
    }
    setSeletorAberto(false);
  }

  function confirmarRemocao() {
    if (!contaARemover) return;
    const { novaAtivaId } = removerAcessoConta(contaARemover.id);
    const restantes = lerContas();
    setContas(restantes);
    setContaAtivaId(novaAtivaId);

    /* Se a conta removida era a que estava em uso, entra na que
       assumiu o lugar. Sem nenhuma conta, volta a ser visitante. */
    if (novaAtivaId) {
      const nova = restantes.find((c) => c.id === novaAtivaId);
      if (nova) {
        setUserState({
          nome: nova.nome || "",
          email: nova.email || "",
          visitante: false,
        });
      }
    } else {
      setUserState({ nome: "", email: "", visitante: true });
    }

    setContaARemover(null);
    if (restantes.length === 0) setSeletorAberto(false);
  }

  let contaItem;
  if (visitante) {
    contaItem = { Icon: UserPlus, label: "Cadastrar conta", onClick: () => navigate("/cadastro") };
  } else if (totalContas <= 1) {
    contaItem = { Icon: UserPlus, label: "Adicionar nova conta", onClick: () => navigate("/cadastro") };
  } else {
    contaItem = { Icon: Users, label: "Trocar de conta", onClick: () => setSeletorAberto(true) };
  }

  return (
    <div
      className="tela-rolavel w-full flex flex-col"
      style={{ backgroundColor: "var(--bg)", color: "var(--text)" }}
    >
      <div
        className="conteudo-rolavel hide-scrollbar"
        style={{ paddingBottom: "calc(100px + env(safe-area-inset-bottom))" }}
      >
        <header className="px-5 pt-6 pb-2 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            aria-label="Voltar"
            className="toque w-10 h-10 rounded-full flex items-center justify-center"
            style={{ background: "linear-gradient(160deg, rgba(255,255,255,0.13) 0%, rgba(255,255,255,0.05) 24%, rgba(255,255,255,0) 58%), rgba(14,14,16,0.82)", backdropFilter: "blur(6px) saturate(160%)", WebkitBackdropFilter: "blur(6px) saturate(160%)", border: "1px solid rgba(255,255,255,0.12)", boxShadow: "inset 0 1.5px 0 0 rgba(255,255,255,0.40), inset 0 9px 20px -8px rgba(255,255,255,0.28), inset 0 -1.5px 0 0 rgba(0,0,0,0.30), 0 8px 24px rgba(0,0,0,0.38)" }}
          >
            <ArrowLeft size={20} style={{ color: "var(--text)" }} />
          </button>
          <h1 className="text-xl font-bold" style={{ color: "var(--text)" }}>
            Perfil
          </h1>
        </header>

        <div className="px-5 pt-3 pb-5 flex flex-col items-center">
          <div
            className="w-20 h-20 rounded-full overflow-hidden"
            style={{ background: "linear-gradient(160deg, rgba(255,255,255,0.13) 0%, rgba(255,255,255,0.05) 24%, rgba(255,255,255,0) 58%), rgba(14,14,16,0.82)", backdropFilter: "blur(6px) saturate(160%)", WebkitBackdropFilter: "blur(6px) saturate(160%)", border: "1px solid rgba(255,255,255,0.12)", boxShadow: "inset 0 1.5px 0 0 rgba(255,255,255,0.40), inset 0 9px 20px -8px rgba(255,255,255,0.28), inset 0 -1.5px 0 0 rgba(0,0,0,0.30), 0 8px 24px rgba(0,0,0,0.38)" }}
          >
            {foto && !visitante ? (
              <img src={foto} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="font-bold" style={{ color: "var(--primary)", fontSize: 34 }}>
                  {inicial || "?"}
                </span>
              </div>
            )}
          </div>

          <button
            type="button"
            disabled={!temMultiplas}
            onClick={() => temMultiplas && setSeletorAberto(true)}
            className="mt-3 flex items-center gap-1.5"
          >
            <span className="font-bold" style={{ color: "var(--text)", fontSize: 20 }}>
              {nomeExibido}
            </span>
            {temMultiplas && (
              <ChevronDown size={17} style={{ color: "var(--text-secondary)" }} />
            )}
          </button>
        </div>

        <div className="px-5">
          <Secao titulo="Geral">
            <Item primeiro Icon={User} label="Editar perfil" onClick={() => navigate("/editar-perfil")} />
            <Item Icon={Settings} label="Preferências" onClick={() => navigate("/preferencias")} />
            <Item Icon={contaItem.Icon} label={contaItem.label} onClick={contaItem.onClick} />
          </Secao>

          <Secao titulo="Meu MEI">
            <Item primeiro Icon={Receipt} label="Histórico de lançamentos" onClick={() => navigate("/historico")} />
            <Item Icon={TrendingUp} label={`Adicionar faturamento de ${anoAtual}`} onClick={() => navigate("/adicionar-faturamento")} />
            <Item Icon={BarChart3} label={`Resumo de ${anoAtual}`} onClick={() => navigate("/perfil/resumo")} />
          </Secao>

          <Secao titulo="Segurança e Privacidade">
            {!visitante && (
              <Item primeiro Icon={Lock} label="Alterar senha" onClick={() => navigate("/alterar-senha")} />
            )}
            <Item primeiro={visitante} Icon={Shield} label="Termos e Privacidade" onClick={() => navigate("/termos")} />
            <Item Icon={Info} label="Sobre o TaCerto!" onClick={() => navigate("/sobre")} />
          </Secao>

          <div style={{ marginTop: 24 }}>
            <button
              onClick={() => setConfirmarSair(true)}
              className="toque w-full flex items-center gap-3 py-3 text-left"
            >
              <LogOut size={21} strokeWidth={2} style={{ color: "var(--danger)" }} className="shrink-0" />
              <span className="flex-1 text-[15px] font-semibold" style={{ color: "var(--danger)" }}>
                Sair da conta
              </span>
            </button>
            <p
              className="text-center"
              style={{
                color: "var(--text-tertiary)",
                fontSize: 11,
                marginTop: 10,
              }}
            >
              v0.1
            </p>
          </div>
        </div>
      </div>

      {seletorAberto && (
        <div
          className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center"
          style={{ backgroundColor: "rgba(0,0,0,0.7)" }}
          onClick={() => setSeletorAberto(false)}
        >
          <div
            className="w-full max-w-md p-4 flex flex-col"
            style={{
              backgroundColor: "var(--surface)",
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              /* O rodapé fixo tem ~100px. Sem contar com ele aqui, o
                 último item da lista ("Adicionar nova conta") ficava
                 escondido atrás do BottomNav. */
              paddingBottom: "calc(env(safe-area-inset-bottom) + 96px)",
              maxHeight: "80dvh",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-1 pb-2 shrink-0">
              <p className="text-base font-bold" style={{ color: "var(--text)" }}>
                Minhas contas
              </p>
              <button
                onClick={() => setSeletorAberto(false)}
                aria-label="Fechar"
                className="toque w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: "linear-gradient(160deg, rgba(255,255,255,0.13) 0%, rgba(255,255,255,0.05) 24%, rgba(255,255,255,0) 58%), rgba(14,14,16,0.82)", backdropFilter: "blur(6px) saturate(160%)", WebkitBackdropFilter: "blur(6px) saturate(160%)", border: "1px solid rgba(255,255,255,0.12)", boxShadow: "inset 0 1.5px 0 0 rgba(255,255,255,0.40), inset 0 9px 20px -8px rgba(255,255,255,0.28), inset 0 -1.5px 0 0 rgba(0,0,0,0.30), 0 8px 24px rgba(0,0,0,0.38)" }}
              >
                <X size={16} style={{ color: "var(--text)" }} />
              </button>
            </div>
            {/* Rola quando há muitas contas, em vez de estourar a tela */}
            <div className="space-y-1 overflow-y-auto hide-scrollbar min-h-0">
              {contas.map((c) => {
                const ini = (c.nome || "?").trim().charAt(0).toUpperCase();
                const ativa = c.id === contaAtivaId;
                return (
                  <div key={c.id} className="flex items-center rounded-xl">
                    <button
                      onClick={() => trocarConta(c.id)}
                      className="toque flex-1 min-w-0 flex items-center gap-3 p-3 rounded-xl"
                    >
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 overflow-hidden"
                        style={{ background: "linear-gradient(160deg, rgba(255,255,255,0.13) 0%, rgba(255,255,255,0.05) 24%, rgba(255,255,255,0) 58%), rgba(14,14,16,0.82)", backdropFilter: "blur(6px) saturate(160%)", WebkitBackdropFilter: "blur(6px) saturate(160%)", border: "1px solid rgba(255,255,255,0.12)", boxShadow: "inset 0 1.5px 0 0 rgba(255,255,255,0.40), inset 0 9px 20px -8px rgba(255,255,255,0.28), inset 0 -1.5px 0 0 rgba(0,0,0,0.30), 0 8px 24px rgba(0,0,0,0.38)" }}
                      >
                        {c.foto ? (
                          <img src={c.foto} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span className="font-bold" style={{ color: "var(--primary)" }}>{ini}</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0 text-left">
                        <p className="text-sm font-semibold truncate" style={{ color: "var(--text)" }}>
                          {c.nome || "Conta"}
                        </p>
                        {c.email && (
                          <p className="text-xs truncate" style={{ color: "var(--text-secondary)" }}>
                            {c.email}
                          </p>
                        )}
                      </div>
                      {ativa && <Check size={20} style={{ color: "var(--primary)" }} className="shrink-0" />}
                    </button>

                    {/* Remove só o acesso neste aparelho — não exclui a conta */}
                    <button
                      onClick={(e) => { e.stopPropagation(); setContaARemover(c); }}
                      aria-label={`Remover acesso da conta ${c.nome || ""}`}
                      className="toque w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                      style={{ marginLeft: 4 }}
                    >
                      <Trash2 size={17} style={{ color: "var(--text-tertiary)" }} />
                    </button>
                  </div>
                );
              })}
              <button
                onClick={() => { setSeletorAberto(false); navigate("/cadastro"); }}
                className="toque w-full flex items-center gap-3 p-3 rounded-xl"
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                  style={{ background: "linear-gradient(160deg, rgba(255,255,255,0.13) 0%, rgba(255,255,255,0.05) 24%, rgba(255,255,255,0) 58%), rgba(14,14,16,0.82)", backdropFilter: "blur(6px) saturate(160%)", WebkitBackdropFilter: "blur(6px) saturate(160%)", border: "1px solid rgba(255,255,255,0.12)", boxShadow: "inset 0 1.5px 0 0 rgba(255,255,255,0.40), inset 0 9px 20px -8px rgba(255,255,255,0.28), inset 0 -1.5px 0 0 rgba(0,0,0,0.30), 0 8px 24px rgba(0,0,0,0.38)" }}
                >
                  <UserPlus size={18} style={{ color: "var(--primary)" }} />
                </div>
                <span className="text-sm font-semibold" style={{ color: "var(--primary)" }}>
                  Adicionar nova conta
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {contaARemover && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.7)" }}
          onClick={() => setContaARemover(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-2xl p-5 space-y-3"
            style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}
          >
            <h3 className="text-base font-bold" style={{ color: "var(--text)" }}>
              Remover acesso?
            </h3>
            <p className="text-sm leading-snug" style={{ color: "var(--text-secondary)" }}>
              A conta{" "}
              <span style={{ color: "var(--text)", fontWeight: 600 }}>
                {contaARemover.email || contaARemover.nome || "selecionada"}
              </span>{" "}
              sai deste aparelho, mas não é excluída. Você pode entrar nela de
              novo quando quiser.
            </p>
            <p className="text-xs leading-snug" style={{ color: "var(--text-tertiary)" }}>
              Para excluir a conta de verdade, entre nela e use “Excluir conta”.
            </p>
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setContaARemover(null)}
                className="toque flex-1 py-3 rounded-xl font-semibold"
                style={{ backgroundColor: "var(--field)", color: "var(--text)" }}
              >
                Cancelar
              </button>
              <button
                onClick={confirmarRemocao}
                className="toque flex-1 py-3 rounded-xl font-semibold"
                style={{ backgroundColor: "#ef4444", color: "#fff" }}
              >
                Remover
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmarSair && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.7)" }}
        >
          <div
            className="w-full max-w-sm rounded-2xl p-5 space-y-4"
            style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}
          >
            <h3 className="text-base font-bold" style={{ color: "var(--text)" }}>
              Quer sair da conta?
            </h3>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmarSair(false)}
                className="toque flex-1 py-3 rounded-xl font-semibold"
                style={{ backgroundColor: "var(--field)", color: "var(--text)" }}
              >
                Cancelar
              </button>
              <button
                onClick={() => { setConfirmarSair(false); navigate("/"); }}
                className="toque flex-1 py-3 rounded-xl font-semibold"
                style={{ backgroundColor: "#ef4444", color: "#fff" }}
              >
                Sair
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav ativo="perfil" />
    </div>
  );
}