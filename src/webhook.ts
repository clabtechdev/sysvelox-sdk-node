import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * Verificação da assinatura HMAC-SHA256 enviada no header X-SysVelox-Signature,
 * formato "t={timestamp},v1={assinatura}" sobre "{timestamp}.{body}". A janela de
 * tolerância protege contra replay de uma entrega antiga reenviada depois.
 */
export function verificarWebhook(
  corpoBruto: string,
  headerAssinatura: string,
  segredo: string,
  janelaToleranciaSegundos = 300,
): boolean {
  const partes = new Map<string, string>();
  for (const par of headerAssinatura.split(',')) {
    const [chave, valor] = par.split('=');
    if (chave !== undefined && valor !== undefined) {
      partes.set(chave, valor);
    }
  }

  const timestampStr = partes.get('t');
  const assinaturaRecebida = partes.get('v1');

  if (timestampStr === undefined || assinaturaRecebida === undefined) {
    return false;
  }

  const timestamp = Number(timestampStr);
  if (Math.abs(Date.now() / 1000 - timestamp) > janelaToleranciaSegundos) {
    return false;
  }

  const assinaturaEsperada = createHmac('sha256', segredo).update(`${timestamp}.${corpoBruto}`).digest('hex');

  const bufferEsperado = Buffer.from(assinaturaEsperada, 'utf8');
  const bufferRecebido = Buffer.from(assinaturaRecebida, 'utf8');

  if (bufferEsperado.length !== bufferRecebido.length) {
    return false;
  }

  return timingSafeEqual(bufferEsperado, bufferRecebido);
}
