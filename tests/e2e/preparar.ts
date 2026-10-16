// Cria a biblioteca de fotos de teste antes do Playwright subir o servidor.
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { criarBibliotecaPadrao } from '../ajuda/fixtures';

export const ARQUIVO_ESTADO = path.resolve('tests/e2e/.biblioteca.json');

export default async function preparar() {
  const { raiz, limpar } = await criarBibliotecaPadrao();
  await writeFile(ARQUIVO_ESTADO, JSON.stringify({ raiz }));
  return limpar;
}
