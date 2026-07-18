import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, HelpCircle, Calculator, Receipt, Calendar, TrendingUp,
  AlertCircle, BarChart3, MessageCircle, FileText,
} from "lucide-react";
import ModalFaturamentoInicial from "../components/ModalFaturamentoInicial.jsx";
import BottomNav from "../components/BottomNav.jsx";
import { FlatItem, FlatGroup, SectionTitle } from "../components/FlatList.jsx";

export default function Menu() {
  const navigate = useNavigate();
  const [modalFaturamento, setModalFaturamento] = useState(false);

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
            Menu
          </h1>
        </header>

        <div className="px-5">
          <SectionTitle className="mt-2">Fiscal</SectionTitle>
          <FlatGroup>
            <FlatItem
              Icon={BarChart3}
              label="Resumo de 2026"
              onClick={() => navigate("/perfil/resumo")}
            />
            <FlatItem
              Icon={FileText}
              label="Informações fiscais"
              onClick={() => navigate("/perfil/informacoes-fiscais")}
            />
            <FlatItem
              Icon={TrendingUp}
              label="Adicionar faturamento do ano"
              onClick={() => setModalFaturamento(true)}
            />
            <FlatItem
              Icon={Calculator}
              label="Calculadora DAS"
              onClick={() => navigate("/menu/calculadora-das")}
            />
            <FlatItem
              Icon={Receipt}
              label="Guia de Pagamento do DAS"
              onClick={() => navigate("/menu/guia-das")}
            />
            <FlatItem
              Icon={Calendar}
              label="Calendário Fiscal"
              onClick={() => navigate("/menu/calendario-fiscal")}
            />
            <FlatItem
              Icon={AlertCircle}
              label="Simulador de Desenquadramento"
              onClick={() => navigate("/menu/simulador-desenquadramento")}
            />
          </FlatGroup>

          <SectionTitle>Assistência</SectionTitle>
          <FlatGroup>
            <FlatItem
              Icon={MessageCircle}
              label="Chat IA"
              onClick={() => navigate("/chat")}
            />
          </FlatGroup>

          <SectionTitle>Ajuda</SectionTitle>
          <FlatGroup>
            <FlatItem
              Icon={HelpCircle}
              label="Dúvidas"
              onClick={() => navigate("/faq")}
            />
          </FlatGroup>
        </div>
      </div>

      <ModalFaturamentoInicial
        aberto={modalFaturamento}
        onClose={() => setModalFaturamento(false)}
        onSalvar={() => setModalFaturamento(false)}
      />

      <BottomNav ativo="menu" />
    </div>
  );
}
