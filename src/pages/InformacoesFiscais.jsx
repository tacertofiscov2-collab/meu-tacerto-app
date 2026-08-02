import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import BottomNav from "../components/BottomNav.jsx";
import Valor from "../components/Valor.jsx";
import { SectionTitle } from "../components/FlatList.jsx";
import { useUserState } from "@/lib/userState";
import { LABEL_TIPO, LIMITES_ANUAIS, DAS_2026 } from "@/lib/fiscal";

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

  const limiteAnual = LIMITES_ANUAIS[tipo];
  const dasValores = DAS_2026[tipo] || {};

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
            style={{ background: "linear-gradient(160deg, rgba(255,255,255,0.13) 0%, rgba(255,255,255,0.05) 24%, rgba(255,255,255,0) 58%), rgba(14,14,16,0.82)", backdropFilter: "blur(24px) saturate(160%)", WebkitBackdropFilter: "blur(24px) saturate(160%)", border: "1px solid rgba(255,255,255,0.12)", boxShadow: "inset 0 1.5px 0 0 rgba(255,255,255,0.40), inset 0 9px 20px -8px rgba(255,255,255,0.28), inset 0 -1.5px 0 0 rgba(0,0,0,0.30), 0 8px 24px rgba(0,0,0,0.38)" }}
          >
            <ArrowLeft size={20} style={{ color: "var(--text)" }} />
          </button>
          <h1 className="text-xl font-bold" style={{ color: "var(--text)" }}>
            Informações fiscais
          </h1>
        </header>

        <div className="px-5">
          {/* Perfil + Limite */}
          <SectionTitle className="mt-2">Perfil</SectionTitle>
          <div>
            <Linha rotulo="Tipo de perfil" valor={LABEL_TIPO[tipo]} primeiro />
            <Linha
              rotulo="Limite anual"
              valor={<Valor tamanho="sm">{limiteAnual}</Valor>}
            />
          </div>

          <SectionTitle>Vencimento do DAS</SectionTitle>
          <p className="text-[15px] leading-relaxed" style={{ color: "var(--text)" }}>
            Todo dia 20 (antecipa se cair em fim de semana ou feriado).
          </p>

          <SectionTitle>Valor do DAS mensal (2026)</SectionTitle>
          <div>
            {Object.entries(dasValores).map(([chave, valor], i) => (
              <Linha
                key={chave}
                rotulo={DAS_LABELS[tipo]?.[chave] ?? chave}
                valor={<Valor tamanho="sm" decimais={2}>{valor}</Valor>}
                primeiro={i === 0}
              />
            ))}
          </div>

          <SectionTitle>DASN-SIMEI</SectionTitle>
          <p className="text-[15px] leading-relaxed" style={{ color: "var(--text)" }}>
            Declaração anual obrigatória. Prazo: 31 de maio de cada ano.
            Obrigatória mesmo com faturamento zero.
          </p>

          <p
            className="text-xs leading-relaxed mt-8"
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

function Linha({ rotulo, valor, primeiro }) {
  return (
    <div
      className="flex justify-between items-center gap-3 py-3.5"
      style={{
        borderTop: primeiro ? "none" : "1px solid var(--border)",
      }}
    >
      <span className="text-[15px]" style={{ color: "var(--text-secondary)" }}>
        {rotulo}
      </span>
      <span className="text-[15px] font-semibold text-right" style={{ color: "var(--text)" }}>
        {valor}
      </span>
    </div>
  );
}


