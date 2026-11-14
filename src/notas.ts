import { HttpClient, gerarIdempotencyKey } from './httpClient';
import { Documento } from './documento';

export class Notas {
  constructor(private readonly http: HttpClient) {}

  async emitirNfce(payload: Record<string, unknown>, idempotencyKey?: string): Promise<Documento> {
    return this.emitir('/v1/nfce', payload, idempotencyKey);
  }

  async emitirNfe(payload: Record<string, unknown>, idempotencyKey?: string): Promise<Documento> {
    return this.emitir('/v1/nfe', payload, idempotencyKey);
  }

  async emitirNfse(payload: Record<string, unknown>, idempotencyKey?: string): Promise<Documento> {
    return this.emitir('/v1/nfse', payload, idempotencyKey);
  }

  private async emitir(path: string, payload: Record<string, unknown>, idempotencyKey?: string): Promise<Documento> {
    const chave = idempotencyKey ?? gerarIdempotencyKey();
    const resposta = await this.http.post(path, payload, chave);

    return new Documento(this, resposta);
  }

  async consultar(id: string): Promise<Documento> {
    const resposta = await this.http.get(`/v1/notas/${id}`);

    return new Documento(this, resposta);
  }

  async baixarXml(id: string): Promise<string> {
    const resposta = await this.http.get(`/v1/notas/${id}/xml`);

    return resposta.xml ?? '';
  }

  async baixarDanfe(id: string, tipo: 'termica' | 'a4' = 'termica'): Promise<{ conteudo_base64: string; content_type: string }> {
    return this.http.get(`/v1/notas/${id}/danfe`, { tipo });
  }

  async cancelar(id: string, justificativa: string): Promise<Documento> {
    const resposta = await this.http.post(`/v1/notas/${id}/cancelamento`, { justificativa });

    return new Documento(this, resposta);
  }

  async listar(filtros: Record<string, string | number> = {}): Promise<any> {
    return this.http.get('/v1/notas', filtros);
  }
}
