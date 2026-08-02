import { createContext } from "react";

/**
 * Diz aos componentes se eles estão sendo renderizados DENTRO do trilho
 * deslizante das abas (AbasDeslizantes).
 *
 * Serve para o BottomNav não se desenhar duas vezes: dentro do trilho,
 * quem mostra o rodapé é o AbasDeslizantes, por fora — assim ele fica
 * parado enquanto as telas deslizam.
 */
export const TrilhoContext = createContext(false);