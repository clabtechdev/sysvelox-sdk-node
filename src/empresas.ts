import { HttpClient } from './httpClient';

export class Empresas {
  constructor(private readonly http: HttpClient) {}

  async listar(): Promise<any> {
    return this.http.get('/v1/empresas');
  }

  async buscar(cnpj: string): Promise<any> {
    return this.http.get(`/v1/empresas/${cnpj}`);
  }

  async atualizar(cnpj: string, dados: Record<string, unknown>): Promise<any> {
    return this.http.put(`/v1/empresas/${cnpj}`, dados);
  }

  async definirCertificado(cnpj: string, certificadoBase64: string, senha: string): Promise<any> {
    return this.http.put(`/v1/empresas/${cnpj}/certificado`, {
      certificado_base64: certificadoBase64,
      senha,
    });
  }

  async definirNumeracao(cnpj: string, modelo: number, serie: number, proximoNumero: number): Promise<any> {
    return this.http.put(`/v1/empresas/${cnpj}/numeracao`, {
      modelo,
      serie,
      proximo_numero: proximoNumero,
    });
  }
}
