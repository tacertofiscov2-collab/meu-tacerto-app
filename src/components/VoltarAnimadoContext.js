import { createContext, useContext } from "react";

/**
 * Permite que uma tela peça a SAÍDA ANIMADA em vez de um navigate(-1)
 * seco. Quem fornece é o TelaComVoltarReal; quem usa são os botões de
 * voltar das telas que vivem dentro dele.
 *
 * Nas telas que NÃO estão dentro do TelaComVoltarReal, o valor é null
 * e o hook devolve um voltar normal — então o mesmo código funciona
 * em qualquer tela, sem precisar saber onde está.
 *
 * Uso na tela:
 *   const voltar = useVoltar();
 *   <button onClick={voltar}>...</button>
 */
export const VoltarAnimadoContext = createContext(null);

export function useVoltar(navigate) {
  const sairAnimando = useContext(VoltarAnimadoContext);
  return sairAnimando || (() => navigate(-1));
}