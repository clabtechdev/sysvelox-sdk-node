import type { Notas } from './notas';

const STATUS_TERMINAIS = ['autorizado', 'rejeitado', 'cancelado', 'contingencia', 'erro'];

export class Documento {
  private dados: Record<string, any>;

  constructor(private readonly notas: Notas, dados: Record<string, any>) {
    this.dados = dados;
  }

  get id(): string | undefined {
    return this.dados.id;
  }

  get status(): string | undefined {
    return this.dados.status;
  }

  paraObjeto(): Record<string, any> {
    return this.dados;
  }

  /**
   * Consulta o status em intervalos até o documento saber do que deu, ou até o timeout
   * esgotar. Útil pra quem não quiser configurar webhook; em produção, prefira webhook.
   */
  async aguardarAutorizacao(timeoutMs = 30_000, intervaloMs = 1_500): Promise<this> {
    if (this.id === undefined) {
      return this;
    }

    const inicio = Date.now();

    while (!STATUS_TERMINAIS.includes(this.status ?? '')) {
      if (Date.now() - inicio >= timeoutMs) {
        break;
      }
      await new Promise((resolve) => setTimeout(resolve, intervaloMs));
      this.dados = (await this.notas.consultar(this.id)).paraObjeto();
    }

    return this;
  }
}
