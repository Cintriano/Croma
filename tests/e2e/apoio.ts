import { readFileSync } from 'node:fs';
import type { APIRequestContext } from '@playwright/test';
import { ARQUIVO_ESTADO } from './preparar';

export const raizFotos = (): string => JSON.parse(readFileSync(ARQUIVO_ESTADO, 'utf8')).raiz;

/** Cria (uma vez) a biblioteca de teste pela API e devolve o id. */
export async function garantirBiblioteca(request: APIRequestContext): Promise<number> {
  const { bibliotecas } = await (await request.get('/api/libraries')).json();
  const existente = bibliotecas.find((b: any) => b.nome === 'Fotos E2E');
  if (existente) return existente.id;
  const r = await request.post('/api/libraries', { data: { nome: 'Fotos E2E', tipo: 'fotos', caminho: raizFotos() } });
  return (await r.json()).id;
}
