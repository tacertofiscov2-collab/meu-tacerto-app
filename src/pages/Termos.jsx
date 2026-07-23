import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, Gauge, Database, EyeOff, Lock, ShieldCheck,
  UserCheck, Bot, Pencil, ChevronRight,
} from "lucide-react";
import Brand from "@/components/Brand";

import BottomNav from "../components/BottomNav.jsx";
import { SectionTitle } from "../components/FlatList.jsx";

const SECOES = [
  {
    titulo: "O que coletamos",
    itens: [
      { Icon: Database, t: "Só o essencial: nome, e-mail ou telefone, e os lançamentos que você registra." },
      { Icon: EyeOff, t: "Não pedimos CPF, endereço nem dados bancários nesta fase." },
    ],
  },
  {
    titulo: "Como protegemos",
    itens: [
      { Icon: Lock, t: "Seus dados são protegidos e nunca vendidos a terceiros." },
      { Icon: ShieldCheck, t: "Guardamos com segurança e criptografia, seguindo a LGPD." },
    ],
  },
  {
    titulo: "Seus direitos",
    itens: [
      { Icon: UserCheck, t: "Você pode acessar, corrigir ou excluir seus dados quando quiser." },
      { Icon: Bot, t: "Pode pedir revisão humana de decisões feitas pela IA." },
    ],
  },
  {
    titulo: "Suas responsabilidades",
    itens: [
      { Icon: Pencil, t: "Você é responsável pela veracidade dos dados que insere no app." },
    ],
  },
];

export default function Termos() {
  const navigate = useNavigate();

  function docEmBreve() {
    alert("Documento completo em breve.");
  }

  return (
    <div
      className="min-h-screen min-h-[100dvh] w-full"
      style={{ backgroundColor: "var(--bg)", color: "var(--text)" }}
    >
      <header className="px-5 pt-5 pb-1 flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          aria-label="Voltar"
          className="w-10 h-10 rounded-full flex items-center justify-center hover:opacity-80 shrink-0"
          style={{ backgroundColor: "var(--field)" }}
        >
          <ArrowLeft size={20} style={{ color: "var(--text)" }} />
        </button>
        <h1 className="text-xl font-bold" style={{ color: "var(--text)" }}>
          Termos e Privacidade
        </h1>
      </header>

      <div
        className="max-w-md mx-auto px-5"
        style={{ paddingBottom: "calc(104px + env(safe-area-inset-bottom))" }}
      >
        <div className="flex items-center gap-1.5 mt-2">
          <Gauge size={15} strokeWidth={2.5} style={{ color: "var(--primary)" }} />
          <span className="text-sm font-medium"><Brand /></span>
          <span className="text-xs" style={{ color: "var(--text-secondary)" }}>· atualizado em breve</span>
        </div>
        <p className="text-sm mt-3" style={{ color: "var(--text-secondary)" }}>
          Resumo em linguagem simples. Você pode ler os documentos completos nos botões ao final.
        </p>

        <div
          className="mt-5 p-3 rounded-r"
          style={{
            backgroundColor: "rgba(34, 197, 94, 0.08)",
            borderLeft: "3px solid var(--primary)",
          }}
        >
          <p className="text-sm leading-relaxed" style={{ color: "var(--text)" }}>
            O <Brand /> é uma ferramenta de educação fiscal com IA. Não substitui um contador — sempre confirme decisões importantes com um profissional.
          </p>
        </div>

        {SECOES.map((s) => (
          <section key={s.titulo}>
            <SectionTitle>{s.titulo}</SectionTitle>
            <ul className="space-y-3 pt-1">
              {s.itens.map(({ Icon, t }) => (
                <li key={t} className="flex items-start gap-3">
                  <Icon
                    size={22}
                    strokeWidth={1.75}
                    style={{ color: "var(--primary)" }}
                    className="shrink-0 mt-0.5"
                  />
                  <p className="text-[15px] leading-relaxed" style={{ color: "var(--text)" }}>
                    {t}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        ))}

        <div className="mt-8 space-y-1">
          {["Ver Política de Privacidade", "Ver Termos de Uso"].map((label) => (
            <button
              key={label}
              onClick={docEmBreve}
              className="w-full flex items-center justify-between py-4 text-[16px] active:opacity-70"
              style={{ color: "var(--text)" }}
            >
              <span>{label}</span>
              <ChevronRight size={18} style={{ color: "var(--text-secondary)" }} />
            </button>
          ))}
        </div>

        <p className="text-center text-xs mt-8" style={{ color: "var(--text-secondary)" }}>
          Dúvidas sobre seus dados? Fale com a gente em privacidade@tacerto.com.br
        </p>
        <p className="text-center text-xs mt-3" style={{ color: "var(--text-secondary)" }}>
          <Brand /> v0.1
        </p>
      </div>

      <BottomNav />
    </div>
  );
}