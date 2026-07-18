import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import BottomNav from "../components/BottomNav.jsx";
import { SectionTitle, FlatGroup, FlatItem } from "../components/FlatList.jsx";
import {
  ArrowLeft, User, Settings, Info, Shield, Users, Lock, LogOut,
  ChevronDown, UserPlus, Trash2, Pencil, X, Check, Plus,
} from "lucide-react";

import { useUserState } from "@/lib/userState";

const FOTO_KEY = "tacerto_foto_usuario";
const CONTAS_KEY = "tacerto_contas";
const CONTA_ATIVA_KEY = "tacerto_conta_ativa";

function lerContas() {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(CONTAS_KEY);
    const arr = raw ? JSON.parse(raw) : null;
    return Array.isArray(arr) ? arr : [];
  } catch { return []; }
}

export default function Perfil() {
  const navigate = useNavigate();
  const { nome } = useUserState();
  const fileRef = useRef(null);

  const [foto, setFoto] = useState(() => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(FOTO_KEY) || null;
  });
  const [contas, setContas] = useState(lerContas);
  const [contaAtiva, setContaAtiva] = useState(() => {
    if (typeof window === "undefined") return 0;
    return Number(localStorage.getItem(CONTA_ATIVA_KEY) || 0);
  });
  const [seletorAberto, setSeletorAberto] = useState(false);
  const [confirmarSair, setConfirmarSair] = useState(false);

  useEffect(() => {
    const handler = () => setContas(lerContas());
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  const nomePersistido = !!nome;
  const totalContas = contas.length > 0 ? contas.length : (nomePersistido ? 1 : 0);
  const ehVisitante = totalContas === 0;
  const temMultiplas = totalContas >= 2;

  const nomeExibido = ehVisitante ? "Visitante" : (nome || "Visitante");
  const inicial = (nome || "").trim().charAt(0).toUpperCase();

  function handleFoto(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = String(reader.result || "");
      try { localStorage.setItem(FOTO_KEY, base64); } catch {}
      setFoto(base64);
    };
    reader.readAsDataURL(file);
  }

  function trocarConta(idx) {
    setContaAtiva(idx);
    try { localStorage.setItem(CONTA_ATIVA_KEY, String(idx)); } catch {}
    setSeletorAberto(false);
  }

  function sair() {
    setConfirmarSair(false);
    navigate("/");
  }

  // Item dinâmico "conta"
  let contaItem;
  if (ehVisitante) {
    contaItem = { Icon: UserPlus, label: "Cadastrar", onClick: () => navigate("/cadastro") };
  } else if (totalContas === 1) {
    contaItem = { Icon: UserPlus, label: "Adicionar nova conta", onClick: () => navigate("/cadastro") };
  } else {
    contaItem = { Icon: Users, label: "Trocar de conta", onClick: () => setSeletorAberto(true) };
  }

  return (
    <div
      className="min-h-screen min-h-[100dvh] w-full flex flex-col"
      style={{ backgroundColor: "var(--bg)", color: "var(--text)" }}
    >
      <div
        className="flex-1 overflow-y-auto"
        style={{ paddingBottom: "calc(104px + env(safe-area-inset-bottom))" }}
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

        {/* Topo — avatar grande centralizado */}
        <div className="px-5 pt-2 pb-6 flex flex-col items-center">
          <div className="relative">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="block w-24 h-24 rounded-full overflow-hidden active:opacity-80"
              style={{ backgroundColor: "var(--field)" }}
              aria-label="Alterar foto"
            >
              {foto ? (
                <img
                  src={foto}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : ehVisitante ? (
                <div className="w-full h-full flex items-center justify-center">
                  <User size={40} style={{ color: "var(--text-secondary)" }} />
                </div>
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="font-bold" style={{ color: "var(--primary)", fontSize: 40 }}>
                    {inicial || "?"}
                  </span>
                </div>
              )}
            </button>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              aria-label="Editar foto"
              className="absolute bottom-0 right-0 w-7 h-7 rounded-full flex items-center justify-center shadow"
              style={{ backgroundColor: "var(--primary)" }}
            >
              <Pencil size={14} style={{ color: "#0f0f11" }} />
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFoto}
            />
          </div>

          <button
            type="button"
            disabled={!temMultiplas}
            onClick={() => temMultiplas && setSeletorAberto(true)}
            className="mt-4 flex items-center gap-1.5"
          >
            <span
              className="font-bold"
              style={{
                color: ehVisitante ? "var(--text-secondary)" : "var(--text)",
                fontSize: 22,
              }}
            >
              {nomeExibido}
            </span>
            {temMultiplas && (
              <ChevronDown size={18} style={{ color: "var(--text-secondary)" }} />
            )}
          </button>
        </div>

        <div className="px-5">
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

          <SectionTitle>Segurança</SectionTitle>
          <FlatGroup>
            <FlatItem
              Icon={Lock}
              label="Alterar senha"
              onClick={() => navigate("/alterar-senha")}
            />
          </FlatGroup>

          <SectionTitle>Privacidade</SectionTitle>
          <FlatGroup>
            <FlatItem
              Icon={Shield}
              label="Termos e Privacidade"
              onClick={() => navigate("/termos")}
            />
          </FlatGroup>

          <SectionTitle>Sobre</SectionTitle>
          <FlatGroup>
            <FlatItem
              Icon={Info}
              label="Sobre o TaCerto!"
              onClick={() => navigate("/sobre")}
            />
          </FlatGroup>

          {/* Ações finais — sem chevron */}
          <div style={{ marginTop: 32 }}>
            <FlatGroup>
              <FlatItem
                Icon={Trash2}
                label="Excluir conta"
                cor="#ef4444"
                iconCor="#ef4444"
                semChevron
                onClick={() => navigate("/excluir-conta")}
              />
              <FlatItem
                Icon={LogOut}
                label="Sair da conta"
                cor="#ef4444"
                iconCor="#ef4444"
                semChevron
                onClick={() => setConfirmarSair(true)}
              />
            </FlatGroup>
          </div>

          {/* Versão discreta */}
          <p
            className="text-center"
            style={{
              color: "var(--text-secondary)",
              opacity: 0.6,
              fontSize: 11,
              marginTop: 24,
            }}
          >
            v0.1
          </p>
        </div>
      </div>

      {/* Bottom sheet: seletor de contas */}
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
              {contas.map((c, idx) => {
                const ini = (c.nome || "?").trim().charAt(0).toUpperCase();
                const ativa = idx === contaAtiva;
                return (
                  <button
                    key={idx}
                    onClick={() => trocarConta(idx)}
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
                      <p className="text-sm font-semibold truncate" style={{ color: "var(--text)" }}>
                        {c.nome || "Conta"}
                      </p>
                      {c.email && (
                        <p className="text-xs truncate" style={{ color: "var(--text-secondary)" }}>
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
                <span className="text-sm font-semibold" style={{ color: "var(--primary)" }}>
                  Adicionar nova conta
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmar sair */}
      {confirmarSair && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.7)" }}
        >
          <div
            className="w-full max-w-sm rounded-2xl p-5 space-y-4"
            style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}
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
