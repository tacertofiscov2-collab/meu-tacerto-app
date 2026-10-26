# Nota fiscal própria (NFS-e Nacional) — onde estamos (26/10/2026)

## Pronto (branch `claude/nota-propria`, sem mexer no app do piloto)
- `server/nfse/emissao.js`: monta a nota do MEI com os dados do TaCerto, confere
  nos esquemas oficiais (XSD), emite e gera o PDF (DANFSe). Usa a biblioteca
  open-nfse (MIT), que fala direto com a API oficial do governo.
- `api/nfse/emitir.js`: função da Vercel (Node) que o app vai chamar.
  Confere quem está logado no Supabase, lê o CNPJ do perfil, pega o código IBGE
  do município nos dados públicos do CNPJ e emite. **Desligada** até
  `NFSE_LIGADA=true` na Vercel.
- `tests/nfse.test.js` (`npm run test:nfse`): 6 testes passando, sem certificado
  e sem internet — nota montada, XSD oficial, assinatura conferida com
  certificado de mentira, emissão simulada com PDF, erros claros.
- Por que Vercel e não Supabase: a conexão com o governo exige o certificado
  na própria conexão (mTLS), que funciona bem em Node e mal nas funções do
  Supabase (Deno).

## Ambientes (`NFSE_AMBIENTE` na Vercel)
- `simulado` (padrão): servidor falso, para testar o app inteiro.
- `producao-restrita`: teste no governo, nota sem valor. Precisa do A1 real.
- `producao`: nota de verdade. Só depois de passar na restrita.

## Falta (depende do Fernando)
1. Incluir uma atividade de SERVIÇO no MEI (hoje só tem comércio), ex.
   9511-8/00 (reparação de computadores), no Portal do Empreendedor.
2. Comprar o e-CNPJ A1 (.pfx). Colocar na Vercel: `NFSE_CERT_PFX_BASE64`
   (arquivo em base64) e `NFSE_CERT_SENHA`. Nunca no GitHub.
3. Testar na `producao-restrita` e confirmar o código do serviço (cTribNac;
   nos testes usamos 140101 = conserto/manutenção de máquinas e aparelhos).

## Falta (código, fase 2)
- Tela "Emitir nota" no app (valor, descrição, para quem) chamando
  `/api/nfse/emitir`, mostrando o PDF e guardando em `notas_fiscais`.
- Contador do número da nota (nDPS) e fila de reenvio no Postgres (hoje em memória).
- Certificado de CADA usuário: guardar criptografado, nunca em texto puro
  (decidir antes de abrir para o público).
- Cancelar e substituir nota (a biblioteca já tem).
- CT-e para frete entre cidades (outro sistema, por estado) — depois.
