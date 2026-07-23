import {
    cloneElement, createContext, useCallback, useContext,
    useEffect, useMemo, useRef, useState,
  } from "react";
  import { useLocation, useNavigationType } from "react-router-dom";
  
  const ContextoTransicao = createContext(null);
  
  /** Usado pelo SwipeBack para comandar o arrasto com o dedo. */
  export function useTransicao() {
    return useContext(ContextoTransicao);
  }
  
  const CURVA = "cubic-bezier(0.32, 0.72, 0, 1)";
  
  /**
   * TransicaoTela — desliza a tela ao navegar, com as DUAS telas visíveis.
   *
   * Modelo CARROSSEL: as telas ficam coladas e andam juntas, 1:1 —
   * o mesmo movimento do carrossel do velocímetro.
   *
   * Dois modos:
   *
   * 1. AUTOMÁTICO (clique): monta a tela que sai e a que entra e roda
   *    a animação CSS do começo ao fim.
   *
   * 2. ARRASTO (dedo): monta a tela de DESTINO colada na lateral e
   *    move as duas acompanhando o dedo. Ao soltar, completa ou volta.
   *    Quem manda é o SwipeBack, que sabe para onde o gesto vai.
   *
   * No arrasto o transform é escrito DIRETO no DOM via ref. Passar por
   * estado seria um render por frame da árvore inteira — com duas telas
   * montadas o iPhone não aguenta.
   */
  export default function TransicaoTela({ children }) {
    const location = useLocation();
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
    const pularAnimacao = useRef(false);
    const soltando = useRef(false);
    const cfg = useRef(null); // { loc, lado, ir }
  
    const refFrente = useRef(null);
    const refDestino = useRef(null);
  
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
  
    /** Rota anterior conhecida, para o gesto de voltar. Null se não houver. */
    const rotaAnterior = useCallback(() => {
      const ant = locAnterior.current;
      if (!ant) return null;
      if (ant.pathname + ant.search === chaveAtual) return null;
      return ant;
    }, [chaveAtual]);
  
    /**
     * Começa o arrasto.
     * loc  = para onde vai (objeto com pathname/search)
     * lado = de que borda a tela de destino entra: "direita" | "esquerda"
     * ir   = o que executar quando o gesto se completar
     */
    const iniciar = useCallback((loc, lado, ir) => {
      if (!loc || soltando.current) return false;
      cfg.current = { loc, lado, ir };
      setArrastando(true);
      return true;
    }, []);
  
    const mover = useCallback((dx) => {
      const c = cfg.current;
      if (!c) return;
      const w = window.innerWidth || 1;
  
      // Colado: destino começa a uma tela de distância e anda junto.
      const offset = c.lado === "direita" ? w : -w;
      const d = c.lado === "direita"
        ? Math.max(-w, Math.min(0, dx))
        : Math.max(0, Math.min(w, dx));
  
      if (refFrente.current) {
        refFrente.current.style.transition = "none";
        refFrente.current.style.transform = `translateX(${d}px)`;
      }
      if (refDestino.current) {
        refDestino.current.style.transition = "none";
        refDestino.current.style.transform = `translateX(${offset + d}px)`;
      }
    }, []);
  
    /* Ao soltar: completa o gesto ou devolve a tela ao lugar. A duração
       é proporcional ao que falta percorrer — soltar perto do fim tem
       que terminar rápido, senão parece emperrado. */
    const soltar = useCallback((dx, velocidade) => {
      const c = cfg.current;
      if (!c) return;
      const w = window.innerWidth || 1;
  
      const offset = c.lado === "direita" ? w : -w;
      const d = c.lado === "direita"
        ? Math.max(-w, Math.min(0, dx))
        : Math.max(0, Math.min(w, dx));
  
      const andado = Math.abs(d);
      const concluir = andado > w * 0.35 || (velocidade > 0.45 && andado > 40);
  
      const restante = concluir ? w - andado : andado;
      const dur = Math.max(150, Math.min(400, (restante / w) * 430));
      const trans = `transform ${dur}ms ${CURVA}`;
  
      soltando.current = true;
  
      if (refFrente.current) {
        refFrente.current.style.transition = trans;
        refFrente.current.style.transform =
          concluir ? `translateX(${-offset}px)` : "translateX(0px)";
      }
      if (refDestino.current) {
        refDestino.current.style.transition = trans;
        refDestino.current.style.transform =
          concluir ? "translateX(0px)" : `translateX(${offset}px)`;
      }
  
      window.setTimeout(() => {
        soltando.current = false;
  
        if (refFrente.current) {
          refFrente.current.style.transition = "";
          refFrente.current.style.transform = "";
        }
  
        if (concluir) {
          // A tela de destino já está exatamente onde a nova rota vai
          // nascer. A animação automática é suprimida: seria um segundo
          // deslize por cima de um movimento que já terminou.
          pularAnimacao.current = true;
          const ir = c.ir;
          cfg.current = null;
          setArrastando(false);
          ir();
        } else {
          cfg.current = null;
          setArrastando(false);
        }
      }, dur + 30);
    }, []);
  
    const api = useMemo(
      () => ({ rotaAnterior, iniciar, mover, soltar }),
      [rotaAnterior, iniciar, mover, soltar],
    );
  
    /* ===================== RENDER ===================== */
  
    const dir = estado.direcao;
    const animando = dir !== null && !arrastando;
  
    const c = cfg.current;
    const larguraTela = typeof window !== "undefined" ? window.innerWidth : 0;
    const offsetInicial = c ? (c.lado === "direita" ? larguraTela : -larguraTela) : 0;
  
    return (
      <ContextoTransicao.Provider value={api}>
        <div className="pilha-telas">
          {/* Tela de DESTINO, colada na lateral durante o arrasto */}
          {arrastando && c && (
            <div
              ref={refDestino}
              className="camada-tela camada-arrasto-destino"
              style={{ transform: `translateX(${offsetInicial}px)` }}
              aria-hidden="true"
            >
              {cloneElement(children, { location: c.loc })}
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