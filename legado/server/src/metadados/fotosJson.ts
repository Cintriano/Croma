import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import type { Aviso } from '../avisos';
import { PASTA_METADADOS } from './colecao';
import { gravarJsonAtomico } from './gravacaoAtomica';
import { normalizarTags } from './tags';

export const ARQUIVO_FOTOS = 'fotos.json';

// Chave: caminho relativo ao álbum, com barras normais (ex.: "Nivel_1/IMG_0001.jpg").
// Só fotos com tags entram no arquivo; o tamanho ajuda a reencontrar fotos movidas.
export interface EntradaFoto {
  tags: string[];
  tamanho: number;
}

export interface FotosJson {
  versao: number;
  fotos: Record<string, EntradaFoto>;
}

export interface LeituraFotosJson {
  fotosJson: FotosJson;
  aviso: Aviso | null;
}

export const fotosJsonVazio = (): FotosJson => ({ versao: 1, fotos: {} });

export const caminhoFotosJson = (pastaAlbum: string) => path.join(pastaAlbum, PASTA_METADADOS, ARQUIVO_FOTOS);

export async function lerFotosJson(pastaAlbum: string): Promise<LeituraFotosJson> {
  const arquivo = caminhoFotosJson(pastaAlbum);
  let texto: string;
  try {
    texto = await readFile(arquivo, 'utf8');
  } catch (erro: any) {
    if (erro?.code === 'ENOENT') return { fotosJson: fotosJsonVazio(), aviso: null };
    throw erro;
  }

  let objeto: any;
  try {
    objeto = JSON.parse(texto.replace(/^﻿/, ''));
  } catch (erro: any) {
    return { fotosJson: fotosJsonVazio(), aviso: { tipo: 'json-invalido', caminho: arquivo, mensagem: `JSON inválido: ${erro.message}` } };
  }
  if (objeto === null || typeof objeto !== 'object' || typeof objeto.fotos !== 'object' || objeto.fotos === null) {
    return { fotosJson: fotosJsonVazio(), aviso: { tipo: 'json-invalido', caminho: arquivo, mensagem: 'O arquivo precisa ter o campo "fotos".' } };
  }

  const fotos: Record<string, EntradaFoto> = {};
  for (const [chave, entrada] of Object.entries<any>(objeto.fotos)) {
    if (entrada === null || typeof entrada !== 'object') continue;
    fotos[chave.replaceAll('\\', '/')] = {
      tags: Array.isArray(entrada.tags) ? normalizarTags(entrada.tags) : [],
      tamanho: typeof entrada.tamanho === 'number' ? entrada.tamanho : 0,
    };
  }
  return { fotosJson: { versao: 1, fotos }, aviso: null };
}

// Só cria o arquivo quando alguma foto tem tag; se ele já existia, é mantido mesmo vazio.
export async function gravarFotosJson(pastaAlbum: string, fotosJson: FotosJson): Promise<void> {
  const arquivo = caminhoFotosJson(pastaAlbum);
  if (Object.keys(fotosJson.fotos).length === 0 && !(await existe(arquivo))) return;
  await gravarJsonAtomico(arquivo, { versao: 1, fotos: fotosJson.fotos });
}

export interface AlteracaoTagsFotos {
  fotos: { caminhoRelativo: string; tamanho: number }[];
  adicionar: string[];
  remover: string[];
}

// Função pura: devolve um novo FotosJson. Entrada que fica sem tags é apagada.
export function aplicarTagsFotos(fotosJson: FotosJson, alteracao: AlteracaoTagsFotos): FotosJson {
  const fotos = structuredClone(fotosJson.fotos);
  const remover = new Set(normalizarTags(alteracao.remover));
  for (const foto of alteracao.fotos) {
    const atuais = fotos[foto.caminhoRelativo]?.tags ?? [];
    const tags = normalizarTags([...atuais, ...alteracao.adicionar]).filter((tag) => !remover.has(tag));
    if (tags.length === 0) delete fotos[foto.caminhoRelativo];
    else fotos[foto.caminhoRelativo] = { tags, tamanho: foto.tamanho };
  }
  return { versao: fotosJson.versao, fotos };
}

export interface ArquivoParaReconciliar {
  caminhoRelativo: string;
  tamanho: number;
  dataCaptura: string | null;
}

export interface OpcoesReconciliacao {
  /** Data de captura que cada chave tinha na varredura anterior (vem do banco). */
  datasAnteriores?: Record<string, string | null>;
}

export interface ResultadoReconciliacao {
  fotosJson: FotosJson;
  corrigidas: { de: string; para: string }[];
  orfas: string[];
}

// Reaponta entradas cujas fotos foram movidas ou renomeadas fora do sistema.
// Só corrige quando há um único candidato, disputado por uma única entrada; senão a entrada vira órfã.
export function reconciliarFotosJson(
  fotosJson: FotosJson,
  arquivos: ArquivoParaReconciliar[],
  opcoes: OpcoesReconciliacao = {},
): ResultadoReconciliacao {
  const noDisco = new Set(arquivos.map((a) => a.caminhoRelativo));
  const chaves = Object.keys(fotosJson.fotos);
  const comEntrada = new Set(chaves);
  const livres = arquivos.filter((a) => !comEntrada.has(a.caminhoRelativo));
  const datas = opcoes.datasAnteriores ?? {};

  const candidatos = new Map<string, ArquivoParaReconciliar[]>();
  const disputa = new Map<string, number>();
  for (const chave of chaves) {
    if (noDisco.has(chave)) continue;
    const entrada = fotosJson.fotos[chave];
    const dataAnterior = datas[chave] ?? null;
    const achados = livres.filter(
      (a) =>
        a.tamanho === entrada.tamanho &&
        (path.posix.basename(a.caminhoRelativo) === path.posix.basename(chave) || (dataAnterior !== null && a.dataCaptura === dataAnterior)),
    );
    candidatos.set(chave, achados);
    if (achados.length === 1) disputa.set(achados[0].caminhoRelativo, (disputa.get(achados[0].caminhoRelativo) ?? 0) + 1);
  }

  const fotos: Record<string, EntradaFoto> = {};
  const corrigidas: ResultadoReconciliacao['corrigidas'] = [];
  const orfas: string[] = [];
  for (const chave of chaves) {
    const entrada = { ...fotosJson.fotos[chave], tags: [...fotosJson.fotos[chave].tags] };
    const achados = candidatos.get(chave);
    if (!achados) {
      fotos[chave] = entrada;
    } else if (achados.length === 1 && disputa.get(achados[0].caminhoRelativo) === 1) {
      fotos[achados[0].caminhoRelativo] = entrada;
      corrigidas.push({ de: chave, para: achados[0].caminhoRelativo });
    } else {
      fotos[chave] = entrada;
      orfas.push(chave);
    }
  }
  return { fotosJson: { versao: fotosJson.versao, fotos }, corrigidas, orfas };
}

const existe = (arquivo: string) => access(arquivo).then(() => true, () => false);
