import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { verificarWebhook } from '../src/webhook';

test('aceita assinatura válida', () => {
  const segredo = 'whsec_teste';
  const corpo = '{"evento":"nfce.authorized"}';
  const timestamp = Math.floor(Date.now() / 1000);
  const assinatura = createHmac('sha256', segredo).update(`${timestamp}.${corpo}`).digest('hex');
  const header = `t=${timestamp},v1=${assinatura}`;

  assert.equal(verificarWebhook(corpo, header, segredo), true);
});

test('rejeita assinatura errada', () => {
  const timestamp = Math.floor(Date.now() / 1000);
  const header = `t=${timestamp},v1=assinaturaerrada`;

  assert.equal(verificarWebhook('{}', header, 'whsec_teste'), false);
});

test('rejeita timestamp fora da janela', () => {
  const segredo = 'whsec_teste';
  const corpo = '{}';
  const timestamp = Math.floor(Date.now() / 1000) - 3600;
  const assinatura = createHmac('sha256', segredo).update(`${timestamp}.${corpo}`).digest('hex');
  const header = `t=${timestamp},v1=${assinatura}`;

  assert.equal(verificarWebhook(corpo, header, segredo), false);
});

test('rejeita header malformado', () => {
  assert.equal(verificarWebhook('{}', 'lixo-sem-formato', 'whsec_teste'), false);
});
