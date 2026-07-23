import {
    cloneElement, createContext, useCallback, useContext,
    useEffect, useMemo, useRef, useState,
  } from "react";
  import { useLocation, useNavigate, useNavigationType } from "react-router-dom";
  
  const ContextoTransicao = createContext(null);
  
  /** Usado pelo SwipeBack para comandar o arrasto interativo. */
  export function useTransicao() {
    return useContext(ContextoTransicao);
  }
  
  const CURVA = "cubic-bezier(0.32, 0.72, 0, 1)";
  
  /**
   * TransicaoTela — desliza a tela ao navegar, com as DUAS telas visíveis.
   *
   * Modelo CARROSSEL: as telas ficam coladas e andam juntas, 1:1 — o
   * mesmo movimento do carrossel do velocímetro. (O modelo do iOS, com
   * a tela de trás recuando só 25% e escurecendo, foi descartado.)
   *
   * Dois modos:
   *
   * 1. AUTOMÁTICO (clique num botão): monta a tela que sai e a que entra,
   *    e roda a animação CSS do começo ao fim.
   *
   * 2. ARRASTO (dedo na borda esquerda): monta a tela anterior atrás e
   *    move as duas acompanhando o dedo. Ao soltar, completa ou volta.
   *
   * No modo arrasto o transform é escrito DIRETO no DOM via ref. Passar
   * por estado seria um render por frame da árvore inteira — com duas
   * telas montadas, o iPhone não aguenta.
   */
  export default function TransicaoTela({ children }) {
    const location = useLocation();
    const navigate = useNavigate();
    const tipoNav = useNavigationType(); // "PUSH" | "POP" | "REPLACE"
  
    const chaveAtual = location.pathname + location.search;
  
    const [estado, setEstado] = useState({
      chave: chaveAtual,
      direcao: null,    // "avancar" | "voltar" | null
      locSaindo: null,
    });
  
    // Só liga/desliga as camadas do arrasto. O movimento não passa por aqui.
    const [arrastando, setArrastando] = useState(false);
  
    const locAnterior = useRef(location);
    const locPreview = useRef(null);
    const pularAnimacao = useRef(false);
    const soltando = useRef(false);
  
    const refFrente = useRef(null);
    const refFundo = useRef(null);
  
    // Ajuste durante o render: chave, direção e camadas chegam juntas na
    // tela. Se a classe entrasse um frame depois, a tela nova apareceria
    // no lugar final e só então pularia pra trás — a "vibrada".
    if (estado.chave !== chaveAtual) {
      const pular = pularAnimacao.current;
      pularAnimacao.current = false;
      setEstado({
        chave: chaveAtual,
        direcao: pular ? null : tipoNav === "POP" ? "voltar" : "avancar",
        locSaindo: pular ? null : locAnterior.current,
      });
    }
  
    useEffect(() => {
      locAnterior.current = location;
    }, [location]);
  
    function aoTerminarAnimacao(e) {
      if (e.target !== e.currentTarget) return;
      setEstado((anterior) => ({ ...anterior, direcao: null, locSaindo: null }));
    }
  
    /* ===================== API DO ARRASTO ===================== */
  
    /* Só dá pra arrastar se houver uma tela anterior conhecida para
       desenhar atrás. Em entrada direta por link, não há — e aí o
       SwipeBack cai no comportamento antigo. */
    const podeArrastar = useCallback(() => {
      const ant = locAnterior.current;
      if (!ant) return false;
      return ant.pathname + ant.search !== chaveAtual;
    }, [chaveAtual]);
  
    const iniciar = useCallback(() => {
      if (!podeArrastar() || soltando.current) return false;
      locPreview.current = locAnterior.current;
      setArrastando(true);
      return true;
    }, [podeArrastar]);
  
    /* Colado: a tela de trás anda a mesma distância que a da frente.
       Frente em +p, fundo em -(largura - p). */
    const mover = useCallback((px) => {
      const w = window.innerWidth || 1;
      const p = Math.max(0, Math.min(px, w));
  
      if (refFrente.current) {
        refFrente.current.style.transition = "none";
        refFrente.current.style.transform = `translateX(${p}px)`;
      }
      if (refFundo.current) {
        refFundo.current.style.transition = "none";
        refFundo.current.style.transform = `translateX(${p - w}px)`;
      }
    }, []);
  
    /* Ao soltar: completa o gesto ou devolve a tela ao lugar.
       A duração é proporcional ao que falta percorrer — soltar perto
       do fim tem que terminar rápido, senão parece emperrado. */
    const soltar = useCallback((px, velocidade) => {
      const w = window.innerWidth || 1;
      const p = Math.max(0, Math.min(px, w));
      const concluir = p > w * 0.35 || (velocidade > 0.45 && p > 40);
  
      const restante = concluir ? w - p : p;
      const dur = Math.max(150, Math.min(400, (restante / w) * 430));
      const trans = `transform ${dur}ms ${CURVA}`;
  
      soltando.current = true;
  
      if (refFrente.current) {
        refFrente.current.style.transition = trans;
        refFrente.current.style.transform =
          concluir ? `translateX(${w}px)` : "translateX(0px)";
      }
      if (refFundo.current) {
        refFundo.current.style.transition = trans;
        refFundo.current.style.transform =
          concluir ? "translateX(0px)" : `translateX(${-w}px)`;
      }
  
      window.setTimeout(() => {
        soltando.current = false;
  
        if (concluir) {
          // A tela de trás já está exatamente onde a nova rota vai nascer.
          // Por isso a animação automática é suprimida: seria um segundo
          // deslize por cima de um movimento que já terminou.
          pularAnimacao.current = true;
          setArrastando(false);
          navigate(-1);
        } else {
          setArrastando(false);
        }
  
        if (refFrente.current) {
          refFrente.current.style.transition = "";
          refFrente.current.style.transform = "";
        }
      }, dur + 30);
    }, [navigate]);
  
    const api = useMemo(
      () => ({ podeArrastar, iniciar, mover, soltar }),
      [podeArrastar, iniciar, mover, soltar],
    );
  
    /* ===================== RENDER ===================== */
  
    const dir = estado.direcao;
    const animando = dir !== null && !arrastando;
  
    return (
      <ContextoTransicao.Provider value={api}>
        <div className="pilha-telas">
          {/* Tela anterior, desenhada atrás durante o arrasto */}
          {arrastando && locPreview.current && (
            <div
              ref={refFundo}
              className="camada-tela camada-arrasto-fundo"
              aria-hidden="true"
            >
              {cloneElement(children, { location: locPreview.current })}
            </div>
          )}
  
          {/* Tela que sai, na navegação automática */}
          {animando && estado.locSaindo && (
            <div
              key="camada-saindo"
              className={`camada-tela camada-sai-${dir}`}
              aria-hidden="true"
            >
              {cloneElement(children, { location: estado.locSaindo })}
            </div>
          )}
  
          {/* Tela atual */}
          <div
            key={estado.chave}
            ref={refFrente}
            className={
              arrastando
                ? "camada-tela camada-arrasto-frente"
                : animando
                  ? `camada-tela camada-entra-${dir}`
                  : "camada-tela"
            }
            onAnimationEnd={animando ? aoTerminarAnimacao : undefined}
          >
            {children}
          </div>
        </div>
      </ContextoTransicao.Provider>
    );
  }