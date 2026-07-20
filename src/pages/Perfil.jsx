import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import BottomNav from "../components/BottomNav.jsx";
import { SectionTitle, FlatGroup, FlatItem } from "../components/FlatList.jsx";
import {
  ArrowLeft, User, Settings, Info, Shield, Users, Lock, LogOut,
  ChevronDown, UserPlus, X, Check, Receipt, TrendingUp, BarChart3,
} from "lucide-react";
import ModalFaturamentoInicial from "../components/ModalFaturamentoInicial.jsx";

import { useUserState, setUserState } from "@/lib/userState";
import { lerContas, lerContaAtivaId, ativarConta } from "@/lib/contas";

const FOTO_KEY = "tacerto_foto_usuario";

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
  const [modalFaturamento, setModalFaturamento] = useState(false);

  useEffect(() => {
    const handler = () => {
      setContas(lerContas());
      setContaAtivaId(lerContaAtivaId());
      try {
        setFoto(localStorage.getItem(FOTO_KEY) || null);
      } catch {}
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

  function sair() {
    setConfirmarSair(false);
    navigate("/");
  }

  let contaItem;
  if (visitante) {
    contaItem = {
      Icon: UserPlus,
      label: "Cadastrar conta",
      onClick: () => navigate("/cadastro"),
    };
  } else if (totalContas <= 1) {
    contaItem = {
      Icon: UserPlus,
      label: "Adicionar nova conta",
      onClick: () => navigate("/cadastro"),
    };
  } else {
    contaItem = {
      Icon: Users,
      label: "Trocar de conta",
      onClick: () => setSeletorAberto(true),
    };
  }

  return (
    <div
      className="min-h-screen min-h-[100dvh] w-full flex flex-col"
      style={{ backgroundColor: "var(--bg)", color: "var(--text)" }}
    >
      <div
        className="flex-1 overflow-y-auto flex flex-col"
        style={{ paddingBottom: "calc(90px + env(safe-area-inset-bottom))" }}
      >
        <header className="px-5 pt-6 pb-4 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            aria-label="Voltar"
            className="w-10 h-10 rounded-full flex items-center justify-center hover:opacity-80"
            style={{ backgroundColor: "var(--field)" }}
          >
            <ArrowLeft size={20} style={{ color: "var(--text)" }} />
          </button>
          <h1 className="text-xl font-bold" style={{ color: "var(--text)" }}>
            Perfil
          </h1>
        </header>

        <div className="px-5 pt-2 pb-6 flex flex-col items-center">
          <div
            className="w-24 h-24 rounded-full overflow-hidden"
            style={{ backgroundColor: "var(--field)" }}
          >
            {foto && !visitante ? (
              <img src={foto} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span
                  className="font-bold"
                  style={{ color: "var(--primary)", fontSize: 40 }}
                >
                  {inicial || "?"}
                </span>
              </div>
            )}
          </div>

          <button
            type="button"
            disabled={!temMultiplas}
            onClick={() => temMultiplas && setSeletorAberto(true)}
            className="mt-4 flex items-center gap-1.5"
          >
            <span className="font-bold" style={{ color: "var(--text)", fontSize: 22 }}>
              {nomeExibido}
            </span>
            {temMultiplas && (
              <ChevronDown size={18} style={{ color: "var(--text-secondary)" }} />
            )}
          </button>
        </div>

        <div className="px-5 flex-1 flex flex-col">
          <SectionTitle>Geral</SectionTitle>
          <FlatGroup>
            <FlatItem
              Icon={User}
              label="Editar perfil"
              onClick={() => navigate("/editar-perfil")}
            />
            <FlatItem
              Icon={Settings}
              label="Preferências"
              onClick={() => navigate("/preferencias")}
            />
            <FlatItem
              Icon={contaItem.Icon}
              label={contaItem.label}
              onClick={contaItem.onClick}
            />
          </FlatGroup>

          <div style={{ marginTop: 24 }}>
            <SectionTitle>Meu MEI</SectionTitle>
            <FlatGroup>
              <FlatItem
                Icon={Receipt}
                label="Histórico de lançamentos"
                onClick={() => navigate("/historico")}
              />
              <FlatItem
                Icon={TrendingUp}
                label="Adicionar faturamento do ano 2026"
                onClick={() => navigate("/adicionar-faturamento")}
              />
              <FlatItem
                Icon={BarChart3}
                label="Resumo 2026"
                onClick={() => navigate("/perfil/resumo")}
              />
            </FlatGroup>
          </div>

          <div style={{ marginTop: 24 }}>
            <SectionTitle>Segurança e Privacidade</SectionTitle>
            <FlatGroup>
              {!visitante && (
                <FlatItem
                  Icon={Lock}
                  label="Alterar senha"
                  onClick={() => navigate("/alterar-senha")}
                />
              )}
              <FlatItem
                Icon={Shield}
                label="Termos e Privacidade"
                onClick={() => navigate("/termos")}
              />
              <FlatItem
                Icon={Info}
                label="Sobre o TaCerto!"
                onClick={() => navigate("/sobre")}
              />
            </FlatGroup>
          </div>

          <div style={{ marginTop: "auto", paddingTop: 40 }}>
            <FlatGroup>
              <FlatItem
                Icon={LogOut}
                label="Sair da conta"
                cor="#ef4444"
                iconCor="#ef4444"
                semChevron
                onClick={() => setConfirmarSair(true)}
              />
            </FlatGroup>
            <p
              className="text-center"
              style={{
                color: "var(--text-secondary)",
                opacity: 0.6,
                fontSize: 11,
                marginTop: 16,
                marginBottom: 8,
              }}
            >
              v0.1
            </p>
          </div>
        </div>
      </div>

      <ModalFaturamentoInicial
        aberto={modalFaturamento}
        onClose={() => setModalFaturamento(false)}
        onSalvar={() => setModalFaturamento(false)}
      />

      {seletorAberto && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
          style={{ backgroundColor: "rgba(0,0,0,0.7)" }}
          onClick={() => setSeletorAberto(false)}
        >
          <div
            className="w-full max-w-md p-4 space-y-2 animate-in slide-in-from-bottom duration-200"
            style={{
              backgroundColor: "var(--surface)",
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-1 pb-2">
              <p className="text-base font-bold" style={{ color: "var(--text)" }}>
                Suas contas
              </p>
              <button
                onClick={() => setSeletorAberto(false)}
                aria-label="Fechar"
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ backgroundColor: "var(--field)" }}
              >
                <X size={16} style={{ color: "var(--text)" }} />
              </button>
            </div>
            <div className="space-y-1">
              {contas.map((c) => {
                const ini = (c.nome || "?").trim().charAt(0).toUpperCase();
                const ativa = c.id === contaAtivaId;
                return (
                  <button
                    key={c.id}
                    onClick={() => trocarConta(c.id)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl active:opacity-80"
                  >
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 overflow-hidden"
                      style={{ backgroundColor: "var(--field)" }}
                    >
                      {c.foto ? (
                        <img src={c.foto} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="font-bold" style={{ color: "var(--primary)" }}>
                          {ini}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <p
                        className="text-sm font-semibold truncate"
                        style={{ color: "var(--text)" }}
                      >
                        {c.nome || "Conta"}
                      </p>
                      {c.email && (
                        <p
                          className="text-xs truncate"
                          style={{ color: "var(--text-secondary)" }}
                        >
                          {c.email}
                        </p>
                      )}
                    </div>
                    {ativa && <Check size={20} style={{ color: "var(--primary)" }} />}
                  </button>
                );
              })}
              <button
                onClick={() => {
                  setSeletorAberto(false);
                  navigate("/cadastro");
                }}
                className="w-full flex items-center gap-3 p-3 rounded-xl active:opacity-80"
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                  style={{ backgroundColor: "var(--field)" }}
                >
                  <UserPlus size={18} style={{ color: "var(--primary)" }} />
                </div>
                <span
                  className="text-sm font-semibold"
                  style={{ color: "var(--primary)" }}
                >
                  Adicionar nova conta
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmarSair && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.7)" }}
        >
          <div
            className="w-full max-w-sm rounded-2xl p-5 space-y-4"
            style={{
              backgroundColor: "var(--surface)",
              border: "1px solid var(--border)",
            }}
          >
            <h3 className="text-base font-bold" style={{ color: "var(--text)" }}>
              Deseja sair da sua conta?
            </h3>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmarSair(false)}
                className="flex-1 py-3 rounded-xl font-semibold"
                style={{ backgroundColor: "var(--field)", color: "var(--text)" }}
              >
                Cancelar
              </button>
              <button
                onClick={sair}
                className="flex-1 py-3 rounded-xl font-semibold"
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