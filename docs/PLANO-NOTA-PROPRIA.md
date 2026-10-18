# Plano — emissão de nota fiscal própria (sem terceirizar)

Decisão do Fernando (16-17/10/2026): o TaCerto emite a nota da pessoa pela
ligação oficial e gratuita do governo, sem plataforma paga no meio.

## Fase 1 — NFS-e Nacional (serviço; frete na mesma cidade)

- **Quem recebe:** Sefin Nacional (governo federal). Gratuita.
  - Testes: `https://sefin.producaorestrita.nfse.gov.br/SefinNacional`
    (produção restrita: nota de mentira, sem valor fiscal)
  - Consultas e PDF (DANFSe): `adn.producaorestrita.nfse.gov.br`
  - Produção: mesmos caminhos sem `producaorestrita`.
- **Como funciona:** o app monta a **DPS** (declaração do serviço) em XML,
  assina com o **certificado A1 da pessoa** (XMLDSig, RSA-SHA256),
  compacta (GZip + Base64) e envia em JSON por **mTLS** (a conexão também
  usa o A1). Volta a NFS-e com a chave de acesso; o PDF vem do DANFSe.
- **Onde roda:** Edge Function nova `emitir-nfse` (Supabase/Deno). O A1
  nunca vai para o celular depois de enviado.
- **Base de código:** a biblioteca aberta `open-nfse` (TypeScript, licença
  MIT) já faz DPS, assinatura, mTLS, cancelamento e DANFSe. Usar como
  referência/dependência, conferindo tudo contra os XSD oficiais.

### Guarda do certificado (a parte mais delicada)
- A pessoa envia o arquivo `.pfx` e a senha **só na hora de emitir pela
  primeira vez**, com a Isa ajudando (o que é, como tirar, arquivo com erro).
- O arquivo e a senha são **criptografados no servidor** (chave mestra
  como segredo do Supabase) e guardados num lugar que **nenhuma tela lê**.
- Excluir conta apaga o certificado. Certificado vencido: o app avisa.
- Nunca registrar o certificado, a senha ou o XML assinado nos logs.

### Telas
1. Notas → **Emitir nota** → (1ª vez) enviar o A1 + senha, com ajuda da Isa.
2. Dados da nota: quem contratou (CPF/CNPJ e nome), valor, data, descrição
   ("Frete dentro de <cidade>"). O resto vem do perfil e do CNPJ.
3. Conferir → Emitir → nota pronta (PDF), guardada em **Minhas notas** e
   ligada ao recebimento (selo "com nota" do Bloco 4).
4. Cancelar nota (evento 101101) dentro do prazo.

### A CONFERIR na documentação oficial antes de produção
- Campos do MEI na DPS (regime especial / optante pelo Simples - MEI) e o
  código do serviço de frete municipal (LC 116, item 16.02).
- Se o município da pessoa já aceita o Emissor Nacional (os conveniados).
- Limites de envio da API e regras de "procurador" (emitir em nome de
  outro CNPJ): por enquanto, sempre com o A1 da própria pessoa.

## Fase 2 — CT-e (frete entre cidades)

- É da **SEFAZ de cada estado** (MG tem a sua), não do governo federal.
- Exige: **Inscrição Estadual** de transportador, **RNTRC** ativo na ANTT e
  **certificado A1**. Não há emissor gratuito oficial: teríamos de falar
  direto com o webservice da SEFAZ (SOAP, mais complexo). Mais o MDF-e.
- Desde 24/05/2026 o **CIOT** é obrigatório nas contratações de TAC
  (Resolução ANTT 6.078/2026) — normalmente obrigação de quem contrata.
- Fazer depois da Fase 1 funcionar com gente real.

## Para começar (o que falta)
- Um **CNPJ de MEI real com certificado A1** para testar na produção
  restrita (a nota de teste não tem valor fiscal, mas o certificado tem de
  ser verdadeiro, ICP-Brasil).
