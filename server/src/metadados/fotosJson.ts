import { readFile } from 'node:fs/promises';
import path from 'node:path';
import type { Aviso } from '../avisos';
import { PASTA_METADADOS } from './colecao';
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
