import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ChevronDown } from "lucide-react";

import BottomNav from "../components/BottomNav.jsx";
import { SectionTitle } from "../components/FlatList.jsx";

function Segmented({ opcoes, valor, onChange }) {
  return (
    <div
      className="flex p-1 rounded-xl"
      style={{ backgroundColor: "var(--field)" }}
    >
      {opcoes.map((op) => {
        const ativo = valor === op.value;
        return (
          <button
            key={op.value}
            onClick={() => onChange(op.value)}
            className="flex-1 py-2 text-xs font-semibold rounded-lg transition"
            style={{
              backgroundColor: ativo ? "var(--primary)" : "transparent",
              color: ativo ? "var(--primary-contrast)" : "var(--text-secondary)",
            }}
          >
            {op.label}
          </button>
        );
      })}
    </div>
  );
}

function Switch({ ativo, onChange, label }) {
  return (
    <button
      onClick={() => onChange(!ativo)}
      role="switch"
      aria-checked={ativo}
      aria-label={label}
      className="relative w-11 h-6 rounded-full transition-colors shrink-0"
      style={{ backgroundColor: ativo ? "var(--primary)" : "var(--field)" }}
    >
      <span
        className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full transition-transform"
        style={{
          backgroundColor: "#fff",
          transform: ativo ? "translateX(20px)" : "translateX(0)",
        }}
      />
    </button>
  );
}

export default function Preferencias() {
  const navigate = useNavigate();

  const [tema, setTema] = useState("escuro");
  const [fonte, setFonte] = useState("padrao");
  const [push, setPush] = useState(true);
  const [lembreteDas, setLembreteDas] = useState("3");

  const selectStyle = {
    backgroundColor: "var(--field)",
    color: "var(--text)",
  };

  return (
    <div
      className="min-h-screen min-h-[100dvh] w-full"
      style={{ backgroundColor: "var(--bg)", color: "var(--text)" }}
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
          Preferências
        </h1>
      </header>

      <div
        className="px-5"
        style={{ paddingBottom: "calc(104px + env(safe-area-inset-bottom))" }}
      >
        <SectionTitle>Aparência</SectionTitle>
        <div className="space-y-5 pt-1">
          <div>
            <p className="text-[15px] mb-2" style={{ color: "var(--text)" }}>
              Tema
            </p>
            <Segmented
              opcoes={[
                { value: "claro", label: "Claro" },
                { value: "escuro", label: "Escuro" },
                { value: "auto", label: "Automático" },
              ]}
              valor={tema}
              onChange={setTema}
            />
          </div>

          <div>
            <p className="text-[15px] mb-2" style={{ color: "var(--text)" }}>
              Tamanho da fonte
            </p>
            <Segmented
              opcoes={[
                { value: "padrao", label: "Padrão" },
                { value: "grande", label: "Grande" },
              ]}
              valor={fonte}
              onChange={setFonte}
            />
          </div>
        </div>

        <SectionTitle>Notificações</SectionTitle>
        <div className="space-y-5 pt-1">
          <div className="flex items-center gap-3 py-1">
            <div className="flex-1 min-w-0">
              <p className="text-[15px]" style={{ color: "var(--text)" }}>
                Notificações push
              </p>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>
                Receber alertas do app
              </p>
            </div>
            <Switch ativo={push} onChange={setPush} label="Notificações push" />
          </div>

          <div>
            <p className="text-[15px] mb-2" style={{ color: "var(--text)" }}>
              Lembrete do DAS
            </p>
            <div className="relative">
              <select
                value={lembreteDas}
                onChange={(e) => setLembreteDas(e.target.value)}
                className="w-full appearance-none pl-4 pr-10 py-3 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[var(--primary)]"
                style={selectStyle}
              >
                <option value="5">5 dias antes</option>
                <option value="3">3 dias antes</option>
                <option value="1">1 dia antes</option>
                <option value="0">No dia do vencimento</option>
              </select>
              <ChevronDown
                size={18}
                className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ color: "var(--text-secondary)" }}
              />
            </div>
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
