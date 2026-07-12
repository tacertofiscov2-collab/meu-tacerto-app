import { useNavigate } from "react-router-dom";
import { Gauge, CheckCircle2, Info } from "lucide-react";
import { AuthLayout } from "@/components/AuthLayout";
import Brand from "@/components/Brand";

export default function Sobre() {
  const navigate = useNavigate();
  return (
    <AuthLayout onBack={() => navigate(-1)}>
      <div className="text-center mb-4">
        <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-3">
          <Gauge size={32} strokeWidth={2.5} className="text-green-600" />
        </div>
        <h2 className="text-xl font-bold text-gray-800">
          Sobre o <Brand />
        </h2>
      </div>

      <p className="text-sm text-gray-600 leading-relaxed mb-3">
        O <Brand /> é seu assistente de educação fiscal para MEI e MEI Caminhoneiro.
        Ajudamos você a acompanhar seu faturamento, entender seu limite anual e evitar
        surpresas com o Leão.
      </p>

      <p className="text-sm text-gray-600 leading-relaxed mb-4">
        Contamos com inteligência artificial que se mantém atualizada perante as reformas
        e mudanças na legislação fiscal, para te dar as informações mais precisas possíveis.
      </p>

      <div className="bg-green-50 border border-green-200 rounded-xl p-3 mb-4 flex gap-2">
        <Info size={18} strokeWidth={2} className="text-green-600 shrink-0 mt-0.5" />
        <p className="text-xs text-green-800 leading-relaxed">
          <span className="font-semibold">Importante:</span> o <Brand /> não substitui um
          contador. Somos uma ferramenta de apoio e educação. Decisões fiscais importantes
          devem sempre ser confirmadas com um profissional habilitado.
        </p>
      </div>

      <ul className="space-y-2 mb-4">
        {[
          "Acompanhe seu limite em tempo real",
          "Alertas antes de ultrapassar o teto",
          "Calculadoras e calendário fiscal",
        ].map((t) => (
          <li key={t} className="flex items-center gap-2 text-sm text-gray-700">
            <CheckCircle2 size={16} strokeWidth={2} className="text-green-600 shrink-0" />
            {t}
          </li>
        ))}
      </ul>

      <p className="text-center text-xs text-gray-400">
        <Brand /> · Educação fiscal para seu MEI
      </p>
      <p className="text-center text-xs text-gray-400 mt-4">
        <span className="text-gray-800">Ta</span>
        <span className="text-green-600">Certo!</span> v0.1
      </p>
    </AuthLayout>
  );
}
