/* ===================================================================
   HISTÓRICO DE CONVERSAS DO CHAT DO FISCO
   ===================================================================

   As 5 funções públicas (lerConversas, lerConversa, salvarConversa,
   apagarConversa, apagarTodasConversas) continuam SÍNCRONAS — o chat
   as chama esperando resposta na hora. Por baixo, elas operam sobre um
   CACHE em memória (espelhado no localStorage) e disparam a gravação no
   Supabase em SEGUNDO PLANO, sem travar a interface.

   Fluxo:
     - Ao logar, o Dashboard chama `carregarConversasDoBanco()` uma vez.
       Isso busca as conversas do usuário no Supabase e enche o cache.
     - lerConversas() devolve o cache na hora (rápido, síncrono).
     - salvarConversa()/apagarConversa() atualizam o cache + localStorage
       imediatamente E espelham no banco em background.
     - Visitante (sem sessão): tudo funciona só no local, como antes.

   Nomes de coluna do banco (snake_case) x objeto do app (camelCase):
     banco:  id, user_id, titulo, mensagens(jsonb), criada_em, atualizada_em
     app:    id, titulo, mensagens, criadaEm, atualizadaEm
   As funções de tradução ficam logo abaixo.
   =================================================================== */

   import { supabase } from "@/lib/supabase";

   const CHAVE = "tacerto_conversas_fisco";
   const MAX_CONVERSAS = 50; // guarda as 50 mais recentes no cache local
   
   // Cache em memória — fonte síncrona para o chat.
   let cache = null;
   
   // ---- localStorage: base do cache (sobrevive a reload, funciona deslogado) ----
   
   function lerLocal() {
     if (typeof window === "undefined") return [];
     try {
       const bruto = localStorage.getItem(CHAVE);
       if (!bruto) return [];
       const lista = JSON.parse(bruto);
       return Array.isArray(lista) ? lista : [];
     } catch {
       return [];
     }
   }
   
   function gravarLocal(lista) {
     if (typeof window === "undefined") return;
     try {
       localStorage.setItem(CHAVE, JSON.stringify(lista.slice(0, MAX_CONVERSAS)));
     } catch {
       // Sem espaço: tenta guardar só as 10 mais recentes.
       try {
         localStorage.setItem(CHAVE, JSON.stringify(lista.slice(0, 10)));
       } catch {
         /* desiste em silêncio — não vale quebrar o chat por causa disso */
       }
     }
   }
   
   function garantirCache() {
     if (cache === null) cache = lerLocal();
     return cache;
   }
   
   function ordenar(lista) {
     return [...lista].sort(
       (a, b) => new Date(b.atualizadaEm) - new Date(a.atualizadaEm),
     );
   }
   
   // Escreve o cache (e o localStorage) de uma vez.
   function setCache(lista) {
     cache = ordenar(lista).slice(0, MAX_CONVERSAS);
     gravarLocal(cache);
     return cache;
   }
   
   // ---- tradução banco <-> app ----
   
   function doBanco(row) {
     return {
       id: row.id,
       titulo: row.titulo,
       mensagens: Array.isArray(row.mensagens) ? row.mensagens : [],
       criadaEm: row.criada_em,
       atualizadaEm: row.atualizada_em,
     };
   }
   
   // ---- sessão ----
   
   async function usuarioLogado() {
     try {
       const { data } = await supabase.auth.getUser();
       return data?.user || null;
     } catch {
       return null;
     }
   }
   
   // ===================================================================
   // API PÚBLICA
   // ===================================================================
   
   /**
    * Carrega as conversas do usuário logado a partir do banco e enche o
    * cache. Deve ser chamada uma vez ao logar (o Dashboard faz isso).
    * É assíncrona — retorna a lista já pronta, mas o chat NÃO depende de
    * esperar por ela: enquanto isso, lerConversas() já devolve o cache local.
    */
   export async function carregarConversasDoBanco() {
     const user = await usuarioLogado();
     if (!user) {
       // Visitante: cache é só o que estiver no local.
       return garantirCache();
     }
     try {
       const { data } = await supabase
         .from("conversas")
         .select("id, titulo, mensagens, criada_em, atualizada_em")
         .eq("user_id", user.id)
         .order("atualizada_em", { ascending: false });
   
       if (Array.isArray(data)) {
         return setCache(data.map(doBanco));
       }
     } catch {
       /* falha de rede — mantém o cache local */
     }
     return garantirCache();
   }
   
   /** Lê todas as conversas, da mais recente para a mais antiga (síncrono). */
   export function lerConversas() {
     return ordenar(garantirCache());
   }
   
   /** Busca uma conversa específica pelo id (síncrono). */
   export function lerConversa(id) {
     return garantirCache().find((c) => c.id === id) || null;
   }
   
   /**
    * Salva (cria ou atualiza) uma conversa.
    * Atualiza o cache na hora e espelha no banco em segundo plano.
    * O título sai da primeira mensagem do usuário, cortado.
    */
   export function salvarConversa(id, mensagens) {
     if (!Array.isArray(mensagens) || mensagens.length === 0) return null;
   
     const primeiraDoUsuario = mensagens.find((m) => m.autor === "user");
     const titulo = primeiraDoUsuario
       ? String(primeiraDoUsuario.texto).trim().slice(0, 48)
       : "Conversa";
   
     const agora = new Date().toISOString();
     const lista = garantirCache();
     const existente = lista.find((c) => c.id === id);
   
     const conversa = {
       id,
       titulo,
       mensagens,
       criadaEm: existente?.criadaEm || agora,
       atualizadaEm: agora,
     };
   
     setCache([conversa, ...lista.filter((c) => c.id !== id)]);
   
     // Espelha no banco em segundo plano (só se logado).
     (async () => {
       const user = await usuarioLogado();
       if (!user) return;
       try {
         await supabase.from("conversas").upsert({
           id,
           user_id: user.id,
           titulo,
           mensagens,
           criada_em: conversa.criadaEm,
           atualizada_em: conversa.atualizadaEm,
         });
       } catch {
         /* falha de rede — fica salvo no local, sincroniza depois */
       }
     })();
   
     return conversa;
   }
   
   /** Apaga uma conversa (cache na hora + banco em segundo plano). */
   export function apagarConversa(id) {
     const lista = garantirCache();
     setCache(lista.filter((c) => c.id !== id));
   
     (async () => {
       const user = await usuarioLogado();
       if (!user) return;
       try {
         await supabase.from("conversas").delete().eq("id", id);
       } catch {
         /* ignora */
       }
     })();
   }
   
   /** Apaga tudo (cache na hora + banco em segundo plano). */
   export function apagarTodasConversas() {
     setCache([]);
   
     (async () => {
       const user = await usuarioLogado();
       if (!user) return;
       try {
         await supabase.from("conversas").delete().eq("user_id", user.id);
       } catch {
         /* ignora */
       }
     })();
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