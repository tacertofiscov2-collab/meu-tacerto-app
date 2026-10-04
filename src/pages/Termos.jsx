/* TERMOS v4 — piloto: "Ver Politica de Privacidade" e "Ver Termos de Uso" abrem os documentos (antes: "em breve"); texto do resumo nao mudou */
import { useNavigate } from "react-router-dom";
import {
  Gauge, Database, EyeOff, Lock, ShieldCheck,
  UserCheck, Bot, Pencil, ChevronRight,
} from "lucide-react";
import Brand from "@/components/Brand";

import BottomNav from "../components/BottomNav.jsx";
import TopoRolavel from "../components/TopoRolavel.jsx";
import { SectionTitle } from "../components/FlatList.jsx";

/* ===================================================================
   TERMOS v4 (04/10/2026, PILOTO): os dois botoes do fim mostravam o
   alerta "Documento completo em breve". Agora abrem as paginas novas
   /privacidade (Privacidade.jsx) e /termos-de-uso (TermosDeUso.jsx).
   O texto deste resumo NAO foi reescrito (pendencias anotadas no
   relatorio do piloto: ainda fala em "educacao fiscal").

   TERMOS v3 (28/09/2026): o cabecalho passou para DENTRO da area que
   rola (TopoRolavel): o titulo sobe com a rolagem e a setinha fica
   parada e transparente. Nada mais mudou.

   TERMOS v2 — ROLAGEM DESTRAVADA

   O que estava errado: esta tela era min-h-screen e rolava a PAGINA
   INTEIRA (scroll do documento). Só que o script do index.html devolve
   a janela ao topo escutando visualViewport.resize — e no Safari do
   iPhone esse evento dispara tambem quando a barra de endereco encolhe
   ao rolar. Resultado: rolava, a barra mudava, e o scrollTo(0,0) puxava
   de volta. A rolagem parecia travada.

   Correcao: o padrao do resto do app — .tela-rolavel na raiz e
   .conteudo-rolavel (filho DIRETO) no miolo. A rolagem passa a
   acontecer dentro do container, onde o window.scrollTo nao alcanca.
   O BottomNav fica fixo fora da area que rola.
   =================================================================== */

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

  return (
    <div
      className="tela-rolavel w-full flex flex-col"
      style={{ backgroundColor: "var(--bg)", color: "var(--text)" }}
    >
      {/* Filho DIRETO de .tela-rolavel — e disso que depende o
          overflow-y: auto definido no index.css. */}
      <div
        className="conteudo-rolavel hide-scrollbar w-full max-w-md mx-auto px-5"
        style={{ paddingBottom: "calc(104px + env(safe-area-inset-bottom))" }}
      >
        <TopoRolavel titulo="Termos e Privacidade" onVoltar={() => navigate(-1)} />

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
          {[
            { label: "Ver Política de Privacidade", rota: "/privacidade" },
            { label: "Ver Termos de Uso", rota: "/termos-de-uso" },
          ].map(({ label, rota }) => (
            <button
              key={label}
              onClick={() => navigate(rota)}
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