import FerramentaLayout from "../components/FerramentaLayout.jsx";
import { SimuladorDesenquadramento } from "../components/ferramentas.jsx";

export default function SimuladorDesenquadramentoPage() {
  return (
    <FerramentaLayout titulo="Simulador de Desenquadramento">
      <SimuladorDesenquadramento />
    </FerramentaLayout>
  );
}
