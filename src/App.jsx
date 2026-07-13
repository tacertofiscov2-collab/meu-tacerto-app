import { BrowserRouter, Routes, Route } from "react-router-dom";
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
import EmConstrucao from "./pages/EmConstrucao.jsx";
import Historico from "./pages/Historico.jsx";
import Perfil from "./pages/Perfil.jsx";

export default function App() {
  return (
    <BrowserRouter>
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
        <Route path="/historico" element={<Historico />} />
        <Route path="/menu" element={<EmConstrucao titulo="Menu" />} />
        <Route path="/perfil" element={<Perfil />} />
        <Route path="/alertas" element={<EmConstrucao titulo="Alertas" />} />
      </Routes>
    </BrowserRouter>
  );
}
