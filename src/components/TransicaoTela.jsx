import { cloneElement, useEffect, useRef, useState } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

/**
 * TransicaoTela — desliza a tela ao navegar, com as DUAS telas visíveis.
 *
 * Durante a transição existem duas camadas montadas:
 *  - a que SAI  (cópia da rota anterior, congelada, sem receber toque)
 *  - a que ENTRA (a rota nova, de verdade)
 *
 * Avançar: a nova entra pela direita, a antiga recua 25% pra esquerda
 * e escurece um pouco. Voltar: o inverso. É o mesmo movimento do iOS.
 *
 * Quando não está animando, só existe UMA camada — o app fica igual
 * ao que era antes, sem camada extra pesando.
 */
export default function TransicaoTela({ children }) {
  const location = useLocation();
  const tipoNav = useNavigationType(); // "PUSH" | "POP" | "REPLACE"

  const chaveAtual = location.pathname + location.search;

  const [estado, setEstado] = useState({
    chave: chaveAtual,
    direcao: null,    // "avancar" | "voltar" | null
    locSaindo: null,  // location da tela que está saindo
  });

  // Guarda a rota do render anterior sem provocar novo render.
  const locAnterior = useRef(location);

  // Ajuste durante o render: chave, direção e camadas entram juntas
  // na tela. Se a classe chegasse um frame depois, a tela nova
  // apareceria no lugar final e só então pularia pra trás — a "vibrada".
  if (estado.chave !== chaveAtual) {
    setEstado({
      chave: chaveAtual,
      direcao: tipoNav === "POP" ? "voltar" : "avancar",
      locSaindo: locAnterior.current,
    });
  }

  useEffect(() => {
    locAnterior.current = location;
  }, [location]);

  function aoTerminar(e) {
    if (e.target !== e.currentTarget) return;
    setEstado((anterior) => ({ ...anterior, direcao: null, locSaindo: null }));
  }

  const dir = estado.direcao;
  const animando = dir !== null;

  return (
    <div className="pilha-telas">
      {animando && estado.locSaindo && (
        <div
          key="camada-saindo"
          className={`camada-tela camada-sai-${dir}`}
          aria-hidden="true"
        >
          {cloneElement(children, { location: estado.locSaindo })}
        </div>
      )}

      <div
        key={estado.chave}
        className={animando ? `camada-tela camada-entra-${dir}` : "camada-tela"}
        onAnimationEnd={animando ? aoTerminar : undefined}
      >
        {children}
      </div>
    </div>
  );
}