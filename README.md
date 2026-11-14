# SysVelox Fiscal API — SDK Node.js

Casca fina em volta da [API Fiscal SysVelox](https://api.sysvelox.com/docs/), pra quem usa Node/TypeScript e quer menos código repetitivo. **100% opcional** — a API REST continua funcionando igual para quem prefere `fetch`/HTTP puro, em qualquer linguagem.

## Instalação

```bash
npm install @sysvelox/api-fiscal
```

## Uso

```ts
import { SysVeloxClient } from '@sysvelox/api-fiscal';

const client = new SysVeloxClient('sk_test_...');

const nota = await client.notas.emitirNfce({
  company_id: 'emp_xxx',
  payments: [{ method: 'pix', amount_cents: 1500 }],
  items: [{
    description: 'Pão francês', ncm: '19059090', cfop: '5102',
    unit: 'KG', quantity: 2, unit_price_cents: 1290,
    csosn: '102', cst_pis: '07', cst_cofins: '07',
  }],
});
// Idempotency-Key gerada automaticamente se você não passar uma

console.log(nota.status); // "processando"

await nota.aguardarAutorizacao(); // polling até sair de "processando" (ou use webhook)
console.log(nota.status); // "autorizado", "rejeitado" ou "contingencia"
```

### Verificar webhook

```ts
import { verificarWebhook } from '@sysvelox/api-fiscal';

app.post('/webhooks/sysvelox', express.raw({ type: 'application/json' }), (req, res) => {
  const corpoBruto = req.body.toString('utf8');
  const header = req.header('X-SysVelox-Signature') ?? '';

  if (!verificarWebhook(corpoBruto, header, process.env.SYSVELOX_WEBHOOK_SECRET!)) {
    return res.sendStatus(401);
  }

  // ...
});
```

## O que o SDK faz por você

- Idempotency-Key automática (UUID v4) quando você não informa uma
- Retry automático de rede/5xx/429 com backoff
- Verificação de assinatura HMAC do webhook, com comparação em tempo constante e proteção de janela contra replay
- Classe `Documento` tipada em vez de JSON cru, com `aguardarAutorizacao()` pra quem não quiser lidar com webhook

## O que o SDK NÃO muda

Nada na API em si. Endpoints, payloads e comportamento são exatamente os documentados em
https://api.sysvelox.com/docs/referencia.php — o SDK só chama a mesma API por baixo dos panos.
Quem já está integrado via HTTP puro não precisa migrar.
