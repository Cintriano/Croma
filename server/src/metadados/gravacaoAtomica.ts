import { randomBytes } from 'node:crypto';
import { mkdir, rename, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';

// Grava num temporário na mesma pasta e só então substitui o arquivo,
// para que uma falha no meio nunca deixe um JSON pela metade no disco.
export async function gravarJsonAtomico(caminho: string, objeto: unknown): Promise<void> {
  const conteudo = JSON.stringify(objeto, null, 2) + '\n';
  const pasta = path.dirname(caminho);
  await mkdir(pasta, { recursive: true });

  const temporario = path.join(pasta, `.${path.basename(caminho)}.${randomBytes(6).toString('hex')}.tmp`);
  try {
    await writeFile(temporario, conteudo, 'utf8');
    await rename(temporario, caminho);
  } catch (erro) {
    await rm(temporario, { force: true });
    throw erro;
  }
}
