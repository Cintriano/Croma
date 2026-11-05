// Erros com código, respondidos em JSON pelo tratador de erros do app.
export class ErroHttp extends Error {
  constructor(
    readonly status: number,
    readonly codigo: string,
    mensagem: string,
  ) {
    super(mensagem);
  }
}

export const naoEncontrado = (o_que: string) => new ErroHttp(404, 'nao-encontrado', `${o_que} não encontrado.`);
export const pedidoInvalido = (mensagem: string, codigo = 'pedido-invalido') => new ErroHttp(400, codigo, mensagem);

// Erros do domínio (lançados com `codigo`) que viram respostas HTTP específicas.
export const STATUS_POR_CODIGO: Record<string, number> = {
  'caminho-invalido': 400,
  'json-invalido': 409,
  'imagem-invalida': 422,
};

export function lerId(valor: unknown): number {
  const id = Number(valor);
  if (!Number.isInteger(id) || id <= 0) throw naoEncontrado('Item');
  return id;
}

export const lerBooleano = (valor: unknown) => valor === 'true' || valor === '1' || valor === true;

export function lerListaTags(valor: unknown): string[] {
  if (typeof valor !== 'string' || valor.trim() === '') return [];
  return valor.split(',').map((t) => t.trim()).filter(Boolean);
}

export function lerModo(valor: unknown): 'todas' | 'qualquer' {
  if (valor === undefined || valor === '') return 'todas';
  if (valor === 'todas' || valor === 'qualquer') return valor;
  throw pedidoInvalido('O modo deve ser "todas" ou "qualquer".', 'modo-invalido');
}

export function lerListaDeTexto(valor: unknown, campo: string): string[] {
  if (valor === undefined) return [];
  if (!Array.isArray(valor) || valor.some((v) => typeof v !== 'string')) throw pedidoInvalido(`"${campo}" deve ser uma lista de textos.`);
  return valor;
}

export function lerListaDeIds(valor: unknown, campo: string): number[] {
  if (!Array.isArray(valor) || valor.some((v) => !Number.isInteger(v) || v <= 0)) throw pedidoInvalido(`"${campo}" deve ser uma lista de ids.`);
  return valor;
}
