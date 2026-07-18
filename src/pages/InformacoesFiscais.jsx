import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import BottomNav from "../components/BottomNav.jsx";
import Valor from "../components/Valor.jsx";
import { useUserState } from "@/lib/userState";
import { LABEL_TIPO, LIMITES_ANUAIS, DAS_2026 } from "@/lib/fiscal";

const fmtBRL2 = (v) =>
  "R$ " +
  Number(v || 0).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const DAS_LABELS = {
  MEI: {
    comercio_industria: "Comércio / Indústria",
    servicos: "Serviços",
    comercio_e_servicos: "Comércio + Serviços",
  },
  MEI_CAMINHONEIRO: {
    intermunicipal_interestadual: "Intermunicipal / Interestadual",
    municipal: "Municipal",
    produtos_perigosos_mudancas: "Produtos perigosos / Mudanças",
  },
};

export default function InformacoesFiscais() {
  const navigate = useNavigate();
  const { tipo } = useUserState();

  const cardStyle = {
    backgroundColor: "var(--surface)",
    border: "1px solid var(--border)",
  };
  const innerStyle = {
    backgroundColor: "var(--field)",
    border: "1px solid var(--border)",
  };

  const limiteAnual = LIMITES_ANUAIS[tipo];
  const dasValores = DAS_2026[tipo] || {};

  return (
    <div
      className="min-h-screen min-h-[100dvh] w-full flex flex-col"
      style={{ backgroundColor: "var(--bg)", color: "var(--text)" }}
    >
      <div
        className="flex-1 overflow-y-auto"
        style={{ paddingBottom: "calc(130px + env(safe-area-inset-bottom))" }}
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
            Informações fiscais
          </h1>
        </header>

        <div className="px-5 space-y-4">
          {/* Perfil + Limite */}
          <div className="rounded-2xl p-5 space-y-3" style={cardStyle}>
            <Linha rotulo="Tipo de perfil" valor={LABEL_TIPO[tipo]} />
            <Linha rotulo="Limite anual" valor={fmtBRL(limiteAnual)} />
          </div>

          {/* Vencimento DAS */}
          <div className="rounded-2xl p-5 space-y-2" style={cardStyle}>
            <p className="text-xs uppercase tracking-wide" style={{ color: "var(--text-secondary)" }}>
              Vencimento do DAS
            </p>
            <p className="text-sm leading-relaxed" style={{ color: "var(--text)" }}>
              Todo dia 20 (antecipa se cair em fim de semana ou feriado).
            </p>
          </div>

          {/* Valor DAS mensal */}
          <div className="rounded-2xl p-5 space-y-3" style={cardStyle}>
            <p className="text-xs uppercase tracking-wide" style={{ color: "var(--text-secondary)" }}>
              Valor do DAS mensal (2026)
            </p>
            <div className="space-y-2">
              {Object.entries(dasValores).map(([chave, valor]) => (
                <div
                  key={chave}
                  className="rounded-xl p-3 flex items-center justify-between"
                  style={innerStyle}
                >
                  <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
                    {DAS_LABELS[tipo]?.[chave] ?? chave}
                  </span>
                  <span className="text-sm font-bold" style={{ color: "var(--text)" }}>
                    {fmtBRL2(valor)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* DASN-SIMEI */}
          <div className="rounded-2xl p-5 space-y-2" style={cardStyle}>
            <p className="text-xs uppercase tracking-wide" style={{ color: "var(--text-secondary)" }}>
              DASN-SIMEI
            </p>
            <p className="text-sm leading-relaxed" style={{ color: "var(--text)" }}>
              Declaração anual obrigatória. Prazo: 31 de maio de cada ano.
              Obrigatória mesmo com faturamento zero.
            </p>
          </div>

          {/* Aviso */}
          <p
            className="text-xs leading-relaxed px-1 pt-1"
            style={{ color: "var(--text-secondary)" }}
          >
            Estas informações são educativas e baseadas na LC 123/2006. O
            TaCerto! não substitui o trabalho do seu contador.
          </p>
        </div>
      </div>

      <BottomNav ativo="perfil" />
    </div>
  );
}

function Linha({ rotulo, valor }) {
  return (
    <div className="flex justify-between text-sm gap-3">
      <span style={{ color: "var(--text-secondary)" }}>{rotulo}</span>
      <span className="font-semibold text-right" style={{ color: "var(--text)" }}>
        {valor}
      </span>
    </div>
  );
}
