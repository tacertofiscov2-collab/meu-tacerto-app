import { useNavigate } from "react-router-dom";
import { Shield, Database, Lock, UserCog, Sparkles, UserCheck } from "lucide-react";
import { AuthLayout } from "@/components/AuthLayout";
import Brand from "@/components/Brand";

// TODO: inserir texto completo de Termos e Privacidade aqui

const PONTOS = [
  { Icon: Database, t: "Coletamos só o essencial: nome, e-mail ou telefone, e seus lançamentos." },
  { Icon: Lock, t: "Seus dados são protegidos e nunca vendidos a terceiros." },
  { Icon: UserCog, t: "Você pode acessar, corrigir ou excluir seus dados quando quiser." },
  { Icon: Sparkles, t: "Usamos IA para te ajudar, mas ela não substitui um contador." },
  { Icon: UserCheck, t: "Você é responsável pelos dados que insere no app." },
];

export default function Termos() {
  const navigate = useNavigate();

  function docEmBreve() {
    alert("Documento completo em breve.");
  }

  return (
    <AuthLayout onBack={() => navigate(-1)}>
      <div className="text-center mb-4">
        <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-3">
          <Shield size={32} strokeWidth={2} className="text-green-600" />
        </div>
        <h2 className="text-xl font-bold text-gray-800">Termos e Privacidade</h2>
        <p className="text-sm text-gray-500 mt-1">Resumo em linguagem simples</p>
      </div>

      <ul className="space-y-2 mb-4">
        {PONTOS.map(({ Icon, t }) => (
          <li
            key={t}
            className="flex items-start gap-2.5 p-2.5 rounded-xl border border-gray-100 bg-gray-50"
          >
            <div className="w-7 h-7 rounded-lg bg-green-50 flex items-center justify-center shrink-0">
              <Icon size={14} strokeWidth={2} className="text-green-600" />
            </div>
            <p className="text-xs text-gray-700 leading-relaxed">{t}</p>
          </li>
        ))}
      </ul>

      <div className="space-y-2 mb-3">
        <button
          onClick={docEmBreve}
          className="w-full py-2.5 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-medium text-xs transition-colors"
        >
          Ver Política de Privacidade completa
        </button>
        <button
          onClick={docEmBreve}
          className="w-full py-2.5 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-medium text-xs transition-colors"
        >
          Ver Termos de Uso completos
        </button>
      </div>

      <p className="text-center text-[11px] text-gray-400 leading-relaxed">
        Última atualização em breve. Ao usar o <Brand />, você concorda com nossos termos.
      </p>
    </AuthLayout>
  );
}
