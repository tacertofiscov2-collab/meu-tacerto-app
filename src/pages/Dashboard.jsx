import { useNavigate } from "react-router-dom";
import { getPerfilLocal } from "@/lib/localData";

export default function Dashboard() {
  const navigate = useNavigate();
  const perfil = getPerfilLocal();
  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gray-50">
      <div className="w-full max-w-md text-center bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          Bem-vindo, {perfil.nome}!
        </h1>
        <p className="text-sm text-gray-500 mb-6">
          Dashboard em construção — próxima rodada.
        </p>
        <button
          onClick={() => navigate("/")}
          className="w-full py-3 rounded-xl bg-green-600 hover:bg-green-700 text-white font-medium text-sm transition-colors"
        >
          Voltar ao início
        </button>
      </div>
    </div>
  );
}
