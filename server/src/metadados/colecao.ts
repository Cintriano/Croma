import { readFile } from 'node:fs/promises';
import path from 'node:path';
import type { Aviso } from '../avisos';
import { gravarJsonAtomico } from './gravacaoAtomica';
import { normalizarTags } from './tags';

export const PASTA_METADADOS = 'metadados';
export const ARQUIVO_COLECAO = 'colecao.json';

// Campos conhecidos do colecao.json; os demais (ex.: nome, cabelo) são preservados como estão.
export interface Colecao {
  titulo?: string;
  tags: string[];
  oculto: boolean;
  [campo: string]: unknown;
}

export type DadosColecao = Partial<Colecao>;

export interface LeituraColecao {
  dados: Colecao | null;
  aviso: Aviso | null;
}

export const caminhoColecao = (pastaAlbum: string) => path.join(pastaAlbum, PASTA_METADADOS, ARQUIVO_COLECAO);

export async function lerColecao(pastaAlbum: string): Promise<LeituraColecao> {
  const arquivo = caminhoColecao(pastaAlbum);
  const bruto = await lerJsonBruto(arquivo);
  if (bruto.tipo === 'ausente') return { dados: null, aviso: null };
  if (bruto.tipo === 'invalido') {
    return { dados: null, aviso: { tipo: 'json-invalido', caminho: arquivo, mensagem: bruto.mensagem } };
  }
  return { dados: normalizarColecao(bruto.objeto), aviso: null };
}

export async function gravarColecao(pastaAlbum: string, dados: DadosColecao): Promise<void> {
  await gravarJsonAtomico(caminhoColecao(pastaAlbum), prepararParaGravar(dados));
}

// Mescla as alterações no JSON que está no disco, mantendo os campos que o sistema não conhece.
export async function atualizarColecao(pastaAlbum: string, alteracoes: DadosColecao): Promise<Colecao> {
  const arquivo = caminhoColecao(pastaAlbum);
  const bruto = await lerJsonBruto(arquivo);
  if (bruto.tipo === 'invalido') {
    throw Object.assign(new Error(`Não foi possível atualizar ${arquivo}: ${bruto.mensagem}`), { codigo: 'json-invalido' });
  }
  const atual = bruto.tipo === 'ok' ? bruto.objeto : {};
  const mesclado: Record<string, unknown> = { ...atual, ...alteracoes };
  if (mesclado.oculto === false && !('oculto' in atual)) delete mesclado.oculto;

  const final = prepararParaGravar(mesclado);
  await gravarJsonAtomico(arquivo, final);
  return normalizarColecao(final);
}

function normalizarColecao(objeto: Record<string, unknown>): Colecao {
  return {
    ...objeto,
    tags: Array.isArray(objeto.tags) ? normalizarTags(objeto.tags) : [],
    oculto: objeto.oculto === true,
  };
}

function prepararParaGravar(dados: Record<string, unknown>): Record<string, unknown> {
  return 'tags' in dados ? { ...dados, tags: Array.isArray(dados.tags) ? normalizarTags(dados.tags) : [] } : { ...dados };
}

type JsonBruto =
  | { tipo: 'ausente' }
  | { tipo: 'invalido'; mensagem: string }
  | { tipo: 'ok'; objeto: Record<string, unknown> };

async function lerJsonBruto(arquivo: string): Promise<JsonBruto> {
  let texto: string;
  try {
    texto = await readFile(arquivo, 'utf8');
  } catch (erro: any) {
    if (erro?.code === 'ENOENT') return { tipo: 'ausente' };
    throw erro;
  }
  try {
    const objeto = JSON.parse(texto.replace(/^\uFEFF/, ''));
    if (objeto === null || typeof objeto !== 'object' || Array.isArray(objeto)) {
      return { tipo: 'invalido', mensagem: 'O conteúdo precisa ser um objeto JSON.' };
    }
    return { tipo: 'ok', objeto };
  } catch (erro: any) {
    return { tipo: 'invalido', mensagem: `JSON inválido: ${erro.message}` };
  }
}
