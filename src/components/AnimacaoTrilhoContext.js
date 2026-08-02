import { createContext } from "react";

/**
 * Contexto só de TESTE: avisa Dashboard/Perfil que o trilho está em
 * movimento (arrastando ou animando), para desativarem temporariamente
 * o backdrop-filter (vidro) enquanto isso acontece. Se confirmar que
 * ajuda, isso pode virar parte do TrilhoContext depois.
 */
export const AnimacaoTrilhoContext = createContext(false);