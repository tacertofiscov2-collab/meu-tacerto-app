import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, Gauge, Database, EyeOff, Lock, ShieldCheck,
  UserCheck, Bot, Pencil, ChevronRight,
} from "lucide-react";

// TODO: inserir texto completo dos documentos aqui

const SECOES = [
  {
    titulo: "O QUE COLETAMOS",
    itens: [
      { Icon: Database, t: "Só o essencial: nome, e-mail ou telefone, e os lançamentos que você registra." },
      { Icon: EyeOff, t: "Não pedimos CPF, endereço nem dados bancários nesta fase." },
    ],
  },
  {
    titulo: "COMO PROTEGEMOS",
    itens: [
      { Icon: Lock, t: "Seus dados são protegidos e nunca vendidos a terceiros." },
      { Icon: ShieldCheck, t: "Guardamos com segurança e criptografia, seguindo a LGPD." },
    ],
  },
  {
    titulo: "SEUS DIREITOS",
    itens: [
      { Icon: UserCheck, t: "Você pode acessar, corrigir ou excluir seus dados quando quiser." },
      { Icon: Bot, t: "Pode pedir revisão humana de decisões feitas pela IA." },
    ],
  },
  {
    titulo: "SUAS RESPONSABILIDADES",
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
    <div className="min-h-screen min-h-[100dvh] w-full bg-white px-5 py-6">
      <button
        onClick={() => navigate(-1)}
        aria-label="Voltar"
        className="fixed top-4 left-4 z-20 p-2 text-green-600 hover:text-green-700 transition-colors"
      >
        <ArrowLeft size={24} strokeWidth={2} />
      </button>

      <div className="max-w-md mx-auto pt-8">
        {/* Cabeçalho */}
        <h1 className="text-2xl font-bold text-gray-800">Termos e Privacidade</h1>
        <div className="flex items-center gap-1.5 mt-1.5">
          <Gauge size={15} strokeWidth={2.5} className="text-green-600" />
          <span className="text-sm font-medium text-gray-800">
            Ta<span className="text-green-600">Certo!</span>
          </span>
          <span className="text-xs text-gray-400">· atualizado em breve</span>
        </div>
        <p className="text-sm text-gray-500 mt-3">
          Resumo em linguagem simples. Você pode ler os documentos completos nos botões ao final.
        </p>

        {/* Bloco de destaque */}
        <div className="mt-5 border-l-4 border-green-600 bg-green-50 p-3">
          <p className="text-sm text-green-800 leading-relaxed">
            O <span className="text-gray-800 font-medium">Ta</span>
            <span className="text-green-600 font-medium">Certo!</span> é uma ferramenta de
            educação fiscal com IA. Não substitui um contador — sempre confirme decisões
            importantes com um profissional.
          </p>
        </div>

        {/* Seções */}
        <div className="mt-6 space-y-6">
          {SECOES.map((s) => (
            <section key={s.titulo}>
              <h2 className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">
                {s.titulo}
              </h2>
              <div className="flex flex-col gap-2">
                {s.itens.map(({ Icon, t }) => (
                  <div
                    key={t}
                    className="flex items-start gap-2.5 bg-gray-50 rounded-lg"
                    style={{ padding: "11px 12px" }}
                  >
                    <Icon size={17} strokeWidth={2} className="text-green-600 shrink-0 mt-0.5" />
                    <p className="text-sm text-gray-700 leading-relaxed">{t}</p>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>

        {/* Botões documentos completos */}
        <div className="mt-6 space-y-2">
          {["Ver Política de Privacidade", "Ver Termos de Uso"].map((label) => (
            <button
              key={label}
              onClick={docEmBreve}
              className="w-full flex items-center justify-between px-4 py-3 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 text-sm text-gray-700 font-medium transition-colors"
            >
              <span>{label}</span>
              <ChevronRight size={18} strokeWidth={2} className="text-gray-400" />
            </button>
          ))}
        </div>

        {/* Rodapé */}
        <p className="text-center text-xs text-gray-400 mt-8">
          Dúvidas sobre seus dados? Fale com a gente em privacidade@tacerto.com.br
        </p>
      </div>
    </div>
  );
}
