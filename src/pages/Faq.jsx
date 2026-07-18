import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Search, ChevronDown } from "lucide-react";

import BottomNav from "../components/BottomNav.jsx";
const PERGUNTAS = [
  {
    id: 1,
    pergunta: "Qual o limite de faturamento do MEI?",
    resposta:
      "Para a maioria dos MEIs, o limite é de R$ 81.000 por ano. Já o MEI Caminhoneiro pode faturar até R$ 251.600 por ano, conforme a legislação específica da categoria.",
  },
  {
    id: 2,
    pergunta: "O que acontece se eu ultrapassar o limite?",
    resposta:
      "Existe a regra dos 20%: até 20% acima do limite você continua como MEI até o fim do ano, pagando uma DAS complementar. Acima de 20% ocorre o desenquadramento retroativo ao início do ano-calendário.",
  },
  {
    id: 3,
    pergunta: "Quando vence o DAS?",
    resposta:
      "O DAS (Documento de Arrecadação do Simples Nacional) vence todo dia 20 de cada mês. Se cair em final de semana ou feriado, o vencimento pode ser prorrogado para o próximo dia útil.",
  },
  {
    id: 4,
    pergunta: "Quanto custa o DAS do MEI?",
    resposta:
      "O valor varia conforme a atividade. Comércio/Indústria paga ICMS, Serviços pagam ISS e Caminhoneiros têm alíquota diferenciada de INSS. Use a Calculadora DAS aqui no app para simular.",
  },
  {
    id: 5,
    pergunta: "O que é a DASN?",
    resposta:
      "A DASN é a Declaração Anual do Simples Nacional, obrigatória para todo MEI. Ela deve ser entregue até 31 de maio de cada ano e informa o faturamento do ano anterior.",
  },
  {
    id: 6,
    pergunta: "Preciso emitir nota fiscal?",
    resposta:
      "Para pessoa jurídica (empresa ou outro CNPJ) a emissão é obrigatória. Para consumidor final não é exigida, mas é recomendável guardar o comprovante da venda por segurança.",
  },
  {
    id: 7,
    pergunta: "MEI pode ter funcionário?",
    resposta:
      "Sim, o MEI pode contratar até 1 funcionário. Nesse caso, é preciso fazer o recolhimento de INSS e outras obrigações trabalhistas, geralmente com auxílio de um contador.",
  },
  {
    id: 8,
    pergunta: "Como funciona o velocímetro do TaCerto!?",
    resposta:
      "O velocímetro mostra, em tempo real, quanto do seu limite anual já foi usado com base nos lançamentos que você faz no app. Assim você sabe se está no verde, amarelo ou vermelho.",
  },
  {
    id: 9,
    pergunta: "Meus dados estão seguros?",
    resposta:
      "Sim. Seus dados são criptografados, armazenados com segurança e tratados de acordo com a LGPD. Nunca vendemos nem compartilhamos suas informações sem autorização.",
  },
  {
    id: 10,
    pergunta: "O TaCerto! substitui um contador?",
    resposta:
      "Não. O TaCerto! é uma ferramenta de apoio e educação fiscal. Sempre que necessário, consulte um contador ou profissional de confiança para decisões contábeis e tributárias.",
  },
  {
    id: 11,
    pergunta: "Como o app calcula meu limite se abri o MEI no meio do ano?",
    resposta:
      "Fazemos o cálculo proporcional: dividimos o limite anual pelos meses do ano e multiplicamos pelos meses restantes desde o início da sua atividade como MEI.",
  },
  {
    id: 12,
    pergunta: "Existe algum projeto para aumentar o limite do MEI?",
    resposta:
      "Há projetos de lei em tramitação, como o chamado 'Super MEI', que propõem elevar limites e permitir mais funcionários. No entanto, nenhuma mudança está em vigor: acompanhe sempre fontes oficiais.",
  },
];

function AccordionItem({ item, aberto, onToggle }) {
  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}
    >
      <button
        onClick={onToggle}
        aria-expanded={aberto}
        className="w-full flex items-center justify-between gap-3 px-4 py-4 text-left"
      >
        <span className="text-sm font-medium" style={{ color: "var(--text)" }}>
          {item.pergunta}
        </span>
        <ChevronDown
          size={18}
          className="shrink-0"
          style={{
            color: "var(--text-secondary)",
            transform: aberto ? "rotate(180deg)" : "none",
            transition: "transform 0.2s",
          }}
        />
      </button>
      {aberto && (
        <div
          className="px-4 pb-4 text-sm leading-relaxed"
          style={{ color: "var(--text-secondary)" }}
        >
          {item.resposta}
        </div>
      )}
    </div>
  );
}

export default function Faq() {
  const navigate = useNavigate();
  const [busca, setBusca] = useState("");
  const [aberto, setAberto] = useState(null);

  const filtradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return PERGUNTAS;
    return PERGUNTAS.filter(
      (p) =>
        p.pergunta.toLowerCase().includes(termo) ||
        p.resposta.toLowerCase().includes(termo)
    );
  }, [busca]);

  const toggle = (id) => setAberto((a) => (a === id ? null : id));

  const fieldStyle = {
    backgroundColor: "var(--field)",
    border: "1px solid var(--border)",
    color: "var(--text)",
  };

  return (
    <div
      className="min-h-screen min-h-[100dvh] w-full flex flex-col"
      style={{ backgroundColor: "var(--bg)", color: "var(--text)" }}
    >
      <div className="flex-1 overflow-y-auto pb-[110px]">
        {/* Header */}
        <header className="flex items-center gap-3 px-5 pt-6 pb-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 rounded-full hover:opacity-80"
            aria-label="Voltar"
          >
            <ArrowLeft size={24} style={{ color: "var(--text)" }} />
          </button>
          <h1 className="text-xl font-bold" style={{ color: "var(--text)" }}>
            Dúvidas frequentes
          </h1>
        </header>

        <div className="px-5 space-y-4">
          {/* Search */}
          <div className="relative">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              style={{ color: "var(--text-secondary)" }}
            />
            <input
              type="text"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar dúvida..."
              className="w-full pl-10 pr-4 py-3 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[var(--primary)]"
              style={fieldStyle}
            />
          </div>

          {/* List */}
          {filtradas.length > 0 ? (
            <div className="space-y-2">
              {filtradas.map((item) => (
                <AccordionItem
                  key={item.id}
                  item={item}
                  aberto={aberto === item.id}
                  onToggle={() => toggle(item.id)}
                />
              ))}
            </div>
          ) : (
            <div
              className="rounded-xl p-6 text-center text-sm"
              style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}
            >
              Nenhuma dúvida encontrada. Tente outra palavra.
            </div>
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
