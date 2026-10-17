/* EXCLUIR-CONTA v5 — limpa comprovantes e avatares antes do Auth; falha preserva a conta (v4: cópia da função publicada) */
// Alteração local do Bloco 7. NÃO publicada.
// Pluggy permanece desativada; desconexão precisa ser tratada antes de religar.
import { createClient } from "jsr:@supabase/supabase-js@2";

// Cabeçalhos CORS: liberam o app (no navegador) a chamar esta função.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type ClienteAdmin = ReturnType<typeof createClient>;
const TAMANHO_LOTE = 100;

// Pagina tudo antes de remover, para a exclusão não deslocar a próxima página.
async function listarArquivosDaPessoa(cliente: ClienteAdmin, balde: string, userId: string) {
  const arquivos: string[] = [];
  const pastas = [userId];
  while (pastas.length) {
    const pasta = pastas.pop()!;
    if (pasta !== userId && !pasta.startsWith(`${userId}/`)) {
      throw new Error("Pasta fora da conta.");
    }
    for (let offset = 0; ; offset += TAMANHO_LOTE) {
      const { data, error } = await cliente.storage.from(balde).list(pasta, {
        limit: TAMANHO_LOTE, offset, sortBy: { column: "name", order: "asc" },
      });
      if (error || !data) throw new Error(`Não consegui listar os arquivos de ${balde}.`);
      for (const item of data) {
        if (!item.name || item.name === "." || item.name === ".." || /[/\\]/.test(item.name)) {
          throw new Error("Nome de arquivo inválido.");
        }
        const caminho = `${pasta}/${item.name}`;
        if (item.id === null) pastas.push(caminho);
        else arquivos.push(caminho);
      }
      if (data.length < TAMANHO_LOTE) break;
    }
  }

  // Compatibilidade com foto antiga salva na raiz como <id>.jpg (ou similar).
  if (balde === "avatares") {
    for (let offset = 0; ; offset += TAMANHO_LOTE) {
      const { data, error } = await cliente.storage.from(balde).list("", {
        search: userId, limit: TAMANHO_LOTE, offset, sortBy: { column: "name", order: "asc" },
      });
      if (error || !data) throw new Error("Não consegui listar os avatares antigos.");
      for (const item of data) {
        if (item.id !== null && (item.name === userId ||
          (item.name.startsWith(`${userId}.`) && /\.(jpe?g|png|webp|gif|avif|heic)$/i.test(item.name)))) {
          arquivos.push(item.name);
        }
      }
      if (data.length < TAMANHO_LOTE) break;
    }
  }
  return arquivos;
}

async function limparArquivos(cliente: ClienteAdmin, userId: string) {
  // Lista os dois baldes primeiro. Se algum falhar, nenhum arquivo é apagado.
  const listas = [];
  for (const balde of ["comprovantes", "avatares"]) {
    listas.push({ balde, arquivos: await listarArquivosDaPessoa(cliente, balde, userId) });
  }
  for (const { balde, arquivos } of listas) {
    for (let i = 0; i < arquivos.length; i += TAMANHO_LOTE) {
      const { error } = await cliente.storage.from(balde).remove(arquivos.slice(i, i + TAMANHO_LOTE));
      if (error) throw new Error(`Não consegui limpar os arquivos de ${balde}. Tente novamente.`);
    }
    if ((await listarArquivosDaPessoa(cliente, balde, userId)).length) {
      throw new Error(`Ainda há arquivos de ${balde}. Tente novamente.`);
    }
  }
}

Deno.serve(async (req) => {
  // Pré-voo do navegador (CORS): responde OK e encerra.
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Método não permitido." }), {
      status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    // 1) Pega o token do usuário que está pedindo a exclusão.
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Sem autenticação." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // 2) Cliente comum, só para descobrir QUEM é o usuário pelo token.
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const clienteUsuario = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: userData, error: userErr } =
      await clienteUsuario.auth.getUser();
    if (userErr || !userData?.user) {
      return new Response(
        JSON.stringify({ error: "Sessão inválida." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const userId = userData.user.id;

    // 3) Cliente ADMIN (service_role) — só existe aqui no servidor.
    //    É ele que tem permissão para apagar o usuário do Auth.
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const clienteAdmin = createClient(supabaseUrl, serviceKey);

    // 4) Só apaga a conta depois de limpar e conferir seus arquivos.
    await limparArquivos(clienteAdmin, userId);

    // 5) Apaga o usuário do Auth. O cascade (on delete) apaga
    //    perfil + lançamentos + conversas junto.
    const { error: delErr } =
      await clienteAdmin.auth.admin.deleteUser(userId);

    if (delErr) {
      return new Response(
        JSON.stringify({ error: "Falha ao excluir: " + delErr.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({ sucesso: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ error: "Erro inesperado: " + String(e) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
