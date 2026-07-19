import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import SwipeBack from "./components/SwipeBack.jsx";
import ExcluirConta from "./pages/ExcluirConta.jsx";
import Welcome from "./pages/Welcome.jsx";
import Onboarding from "./pages/Onboarding.jsx";
import Login from "./pages/Login.jsx";
import Cadastro from "./pages/Cadastro.jsx";
import EsqueciSenha from "./pages/EsqueciSenha.jsx";
import CadastroObrigatorio from "./pages/CadastroObrigatorio.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Sobre from "./pages/Sobre.jsx";
import Termos from "./pages/Termos.jsx";
import Lancar from "./pages/Lancar.jsx";
import LimiteAtingido from "./pages/LimiteAtingido.jsx";
import EmConstrucao from "./pages/EmConstrucao.jsx";
import Historico from "./pages/Historico.jsx";
import Perfil from "./pages/Perfil.jsx";
import Alertas from "./pages/Alertas.jsx";
import Preferencias from "./pages/Preferencias.jsx";
import Faq from "./pages/Faq.jsx";
import Contas from "./pages/Contas.jsx";
import Velocimetro from "./pages/Velocimetro.jsx";
import AlterarSenha from "./pages/AlterarSenha.jsx";
import EditarPerfil from "./pages/EditarPerfil.jsx";
import ResumoPerfil from "./pages/ResumoPerfil.jsx";
import InformacoesFiscais from "./pages/InformacoesFiscais.jsx";
import Chat from "./pages/Chat.jsx";
import DevSimulador from "./pages/DevSimulador.jsx";

export default function App() {
  return (
    <BrowserRouter>
      <SwipeBack />
      <Routes>
        <Route path="/" element={<Welcome />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/login" element={<Login />} />
        <Route path="/cadastro" element={<Cadastro />} />
        <Route path="/esqueci-senha" element={<EsqueciSenha />} />
        <Route path="/cadastro-obrigatorio" element={<CadastroObrigatorio />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/sobre" element={<Sobre />} />
        <Route path="/termos" element={<Termos />} />
        <Route path="/lancar" element={<Lancar />} />
        <Route path="/lancar/limite-atingido" element={<LimiteAtingido />} />
        <Route path="/historico" element={<Historico />} />
        <Route path="/perfil" element={<Perfil />} />
        <Route path="/alertas" element={<Alertas />} />
        <Route path="/preferencias" element={<Preferencias />} />
        <Route path="/faq" element={<Faq />} />
        <Route path="/contas" element={<Contas />} />
        <Route path="/velocimetro" element={<Velocimetro />} />
        <Route path="/alterar-senha" element={<AlterarSenha />} />
        <Route path="/editar-perfil" element={<EditarPerfil />} />
        <Route path="/perfil/resumo" element={<ResumoPerfil />} />
        <Route path="/perfil/informacoes-fiscais" element={<InformacoesFiscais />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="/dev/simulador" element={<DevSimulador />} />
        <Route path="/excluir-conta" element={<ExcluirConta />} />
        <Route path="*" element={<EmConstrucao />} />
      </Routes>
      <Toaster
        theme="dark"
        position="top-center"
        toastOptions={{
          style: {
            background: "var(--surface)",
            border: "1px solid var(--border)",
            color: "var(--text)",
          },
        }}
      />
    </BrowserRouter>
  );
}
