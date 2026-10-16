import { randomBytes } from 'node:crypto';
import { access, mkdir, rename, rm } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

// Sem o cache interno do sharp: no Windows ele pode manter o original aberto e travar o arquivo.
sharp.cache(false);

export const LARGURAS_PADRAO = [300, 600, 1200] as const;

const QUALIDADE_JPEG = 82;
// Fundo usado ao achatar PNG/WebP com transparência (o JPEG não tem canal alfa).
const FUNDO = '#140c0a';

export interface VersoesGeradas {
  /** Caminho de cada versão no cache, por largura. */
  versoes: Record<number, string>;
  /** Quantas versões precisaram ser criadas nesta chamada (0 = tudo veio do cache). */
  geradas: number;
}

export const caminhoVersao = (pastaCache: string, chave: string, largura: number) => path.join(pastaCache, `${chave}-${largura}.jpg`);

// Pedidos simultâneos da mesma chave (ex.: a grade e o visualizador ao mesmo tempo) compartilham o mesmo trabalho.
const emAndamento = new Map<string, Promise<VersoesGeradas>>();

// Gera as versões redimensionadas da foto no cache, só lendo o original.
// A chave deve mudar quando o original muda (ex.: id + data de modificação), senão o cache antigo é reaproveitado.
export function gerarVersoes(
  original: string,
  pastaCache: string,
  chave: string,
  larguras: readonly number[] = LARGURAS_PADRAO,
): Promise<VersoesGeradas> {
  const id = `${path.resolve(pastaCache)}|${chave}|${larguras.join(',')}`;
  let tarefa = emAndamento.get(id);
  if (!tarefa) {
    tarefa = gerar(original, pastaCache, chave, larguras).finally(() => emAndamento.delete(id));
    emAndamento.set(id, tarefa);
  }
  return tarefa;
}

async function gerar(original: string, pastaCache: string, chave: string, larguras: readonly number[]): Promise<VersoesGeradas> {
  const versoes: Record<number, string> = {};
  const faltando: number[] = [];
  for (const largura of larguras) {
    versoes[largura] = caminhoVersao(pastaCache, chave, largura);
    if (!(await existe(versoes[largura]))) faltando.push(largura);
  }
  if (faltando.length === 0) return { versoes, geradas: 0 };

  await mkdir(pastaCache, { recursive: true });
  const base = sharp(original, { failOn: 'error' }).rotate();
  try {
    await base.metadata();
  } catch (erro: any) {
    throw Object.assign(new Error(`Não foi possível ler a imagem ${original}: ${erro.message}`), { codigo: 'imagem-invalida' });
  }

  for (const largura of faltando) {
    const temporario = `${versoes[largura]}.${randomBytes(4).toString('hex')}.tmp`;
    try {
      await base
        .clone()
        .resize({ width: largura, withoutEnlargement: true })
        .flatten({ background: FUNDO })
        .jpeg({ quality: QUALIDADE_JPEG, mozjpeg: true })
        .toFile(temporario);
      await rename(temporario, versoes[largura]);
    } catch (erro: any) {
      await rm(temporario, { force: true });
      throw Object.assign(new Error(`Não foi possível gerar a versão de ${largura}px de ${original}: ${erro.message}`), { codigo: 'imagem-invalida' });
    }
  }
  return { versoes, geradas: faltando.length };
}

const existe = (arquivo: string) => access(arquivo).then(() => true, () => false);
