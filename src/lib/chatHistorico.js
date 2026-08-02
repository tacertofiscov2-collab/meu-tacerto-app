/* ===================================================================
   HISTÓRICO DE CONVERSAS DO CHAT DO FISCO
   ===================================================================

   ⚠️  QUANDO O SUPABASE ESTIVER PRONTO, MUDE APENAS ESTE ARQUIVO.  ⚠️

   O chat inteiro conversa SÓ com as funções daqui — ele não sabe
   (nem precisa saber) se as conversas estão no aparelho ou na nuvem.

   Para migrar para o Supabase:
     1. Crie a tabela `conversas` (id, user_id, titulo, mensagens,
        criada_em, atualizada_em).
     2. Reescreva as 5 funções abaixo usando o cliente do Supabase.
     3. Pronto. Nenhum outro arquivo do app precisa mudar.

   Enquanto isso, tudo fica salvo no localStorage do aparelho.
   Limitação conhecida: se o usuário trocar de celular ou limpar os
   dados do navegador, o histórico se perde. É por isso que a
   migração para o Supabase importa.
   =================================================================== */

   const CHAVE = "tacerto_conversas_fisco";
   const MAX_CONVERSAS = 50; // guarda as 50 mais recentes
   
   /** Lê todas as conversas, da mais recente para a mais antiga. */
   export function lerConversas() {
     if (typeof window === "undefined") return [];
     try {
       const bruto = localStorage.getItem(CHAVE);
       if (!bruto) return [];
       const lista = JSON.parse(bruto);
       if (!Array.isArray(lista)) return [];
       return lista.sort(
         (a, b) => new Date(b.atualizadaEm) - new Date(a.atualizadaEm),
       );
     } catch {
       return [];
     }
   }
   
   /** Busca uma conversa específica pelo id. */
   export function lerConversa(id) {
     return lerConversas().find((c) => c.id === id) || null;
   }
   
   /**
    * Salva (cria ou atualiza) uma conversa.
    * O título sai da primeira mensagem do usuário, cortado.
    */
   export function salvarConversa(id, mensagens) {
     if (typeof window === "undefined") return null;
     if (!Array.isArray(mensagens) || mensagens.length === 0) return null;
   
     const primeiraDoUsuario = mensagens.find((m) => m.autor === "user");
     const titulo = primeiraDoUsuario
       ? String(primeiraDoUsuario.texto).trim().slice(0, 48)
       : "Conversa";
   
     const agora = new Date().toISOString();
     const lista = lerConversas();
     const existente = lista.find((c) => c.id === id);
   
     const conversa = {
       id,
       titulo,
       mensagens,
       criadaEm: existente?.criadaEm || agora,
       atualizadaEm: agora,
     };
   
     const novaLista = [conversa, ...lista.filter((c) => c.id !== id)].slice(
       0,
       MAX_CONVERSAS,
     );
   
     try {
       localStorage.setItem(CHAVE, JSON.stringify(novaLista));
     } catch {
       // Sem espaço no localStorage: descarta as mais antigas e tenta de novo.
       try {
         localStorage.setItem(CHAVE, JSON.stringify(novaLista.slice(0, 10)));
       } catch {
         /* desiste em silêncio — não vale quebrar o chat por causa disso */
       }
     }
     return conversa;
   }
   
   /** Apaga uma conversa. */
   export function apagarConversa(id) {
     if (typeof window === "undefined") return;
     try {
       const lista = lerConversas().filter((c) => c.id !== id);
       localStorage.setItem(CHAVE, JSON.stringify(lista));
     } catch {
       /* ignora */
     }
   }
   
   /** Apaga tudo. */
   export function apagarTodasConversas() {
     if (typeof window === "undefined") return;
     try {
       localStorage.removeItem(CHAVE);
     } catch {
       /* ignora */
     }
   }
   
   /** Gera um id novo para uma conversa. */
   export function novoIdConversa() {
     return `c_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
   }
   
   /** Data amigável para a lista ("Hoje", "Ontem", "12 mar"). */
   export function rotuloData(iso) {
     try {
       const d = new Date(iso);
       const hoje = new Date();
       const ontem = new Date();
       ontem.setDate(hoje.getDate() - 1);
   
       const mesmoDia = (a, b) =>
         a.getDate() === b.getDate() &&
         a.getMonth() === b.getMonth() &&
         a.getFullYear() === b.getFullYear();
   
       if (mesmoDia(d, hoje)) {
         return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
       }
       if (mesmoDia(d, ontem)) return "Ontem";
   
       const MESES = [
         "jan", "fev", "mar", "abr", "mai", "jun",
         "jul", "ago", "set", "out", "nov", "dez",
       ];
       return `${d.getDate()} ${MESES[d.getMonth()]}`;
     } catch {
       return "";
     }
   }