import path from 'node:path';

export interface Config {
  porta: number;
  caminhoBanco: string;
  caminhoCache: string;
}

const PORTA_PADRAO = 8080;
const PASTA_DADOS = path.resolve('dados');

export function carregarConfig(env: Record<string, string | undefined> = process.env): Config {
  return {
    porta: lerPorta(env.PORTA),
    caminhoBanco: env.CAMINHO_BANCO || path.join(PASTA_DADOS, 'central-midia.sqlite'),
    caminhoCache: env.CAMINHO_CACHE || path.join(PASTA_DADOS, 'cache'),
  };
}

function lerPorta(valor: string | undefined): number {
  if (valor === undefined || valor === '') return PORTA_PADRAO;
  const porta = Number(valor);
  if (!Number.isInteger(porta) || porta < 1 || porta > 65535) {
    throw new Error(`Porta inválida: "${valor}". Use um número inteiro entre 1 e 65535.`);
  }
  return porta;
}
