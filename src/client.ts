import { HttpClient } from './httpClient';
import { Notas } from './notas';
import { Empresas } from './empresas';

export class SysVeloxClient {
  private readonly http: HttpClient;
  readonly notas: Notas;
  readonly empresas: Empresas;

  constructor(apiKey: string, baseUrl = 'https://api.sysvelox.com') {
    this.http = new HttpClient(apiKey, baseUrl);
    this.notas = new Notas(this.http);
    this.empresas = new Empresas(this.http);
  }
}
