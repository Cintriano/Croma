import { createHash } from 'node:crypto';
import { readdir, readFile, stat } from 'node:fs/promises';
import { parseFile } from 'music-metadata';
import path from 'node:path';
import { compararNomes } from '../ordenacao';

export const TIPOS_AUDIO: Record<string, string> = {
  '.mp3': 'audio/mpeg',
  '.m4a': 'audio/mp4',
  '.aac': 'audio/aac',
  '.flac': 'audio/flac',
  '.ogg': 'audio/ogg',
  '.opus': 'audio/ogg',
  '.wav': 'audio/wav',
};
const EXTENSOES_IMAGEM = new Set(['.jpg', '.jpeg', '.png', '.webp']);
const NOMES_CAPA = ['capa', 'cover', 'poster', 'folder'];
const LIMITE_DESCRICAO = 2000;

export interface FaixaMusica {
  id: string;
  titulo: string;
  tamanho: number;
  /** Segundos; null quando o arquivo não pôde ser lido. */
  duracao: number | null;
}

export interface AlbumMusica {
  id: string;
  titulo: string;
  /** Pastas acima do álbum (ex.: "Artistas"), ou null quando ele está na raiz. */
  grupo: string | null;
  descricao: string | null;
  capaId: string | null;
  /** Soma, em segundos, da duração das faixas que puderam ser lidas. */
  duracaoTotal: number;
  faixas: FaixaMusica[];
}

export interface BibliotecaMusicas {
  albuns: AlbumMusica[];
  /** Caminho no disco de cada faixa e capa, por id. */
  arquivos: Map<string, { caminho: string; tipo: string }>;
}

const idDe = (relativo: string, tamanho: number) => createHash('sha1').update(relativo).digest('hex').slice(0, tamanho);

// Cada pasta que tem áudio vira um álbum; as pastas acima dele formam o grupo. A pasta "metadados"
// (qualquer capitalização) guarda a capa e a descrição; sem ela, vale a primeira imagem solta na pasta.
export async function varrerMusicas(raiz: string): Promise<BibliotecaMusicas> {
  const resultado: BibliotecaMusicas = { albuns: [], arquivos: new Map() };
  await percorrer(path.resolve(raiz), [], resultado);
  resultado.albuns.sort((a, b) => compararNomes(a.grupo ?? '', b.grupo ?? '') || compararNomes(a.titulo, b.titulo));
  return resultado;
}

async function percorrer(pasta: string, partes: string[], resultado: BibliotecaMusicas): Promise<void> {
  const entradas = await readdir(pasta, { withFileTypes: true }).catch(() => []);
  const arquivos = entradas.filter((e) => e.isFile() && !e.name.startsWith('.')).map((e) => e.name).sort(compararNomes);
  const subpastas = entradas.filter((e) => e.isDirectory() && !e.name.startsWith('.')).map((e) => e.name).sort(compararNomes);
  const pastaMetadados = subpastas.find((nome) => nome.toLowerCase() === 'metadados');

  const nomesAudio = arquivos.filter((nome) => path.extname(nome).toLowerCase() in TIPOS_AUDIO);
  if (nomesAudio.length > 0 && partes.length > 0) {
    const relativo = partes.join('/');
    const faixas: FaixaMusica[] = await Promise.all(
      nomesAudio.map(async (nome) => {
        const caminho = path.join(pasta, nome);
        const id = idDe(`${relativo}/${nome}`, 12);
        resultado.arquivos.set(id, { caminho, tipo: TIPOS_AUDIO[path.extname(nome).toLowerCase()] });
        const info = await stat(caminho);
        return { id, titulo: path.basename(nome, path.extname(nome)), tamanho: info.size, duracao: await duracaoDe(caminho, info.size, info.mtimeMs) };
      }),
    );
    const metadados = pastaMetadados ? await lerMetadados(path.join(pasta, pastaMetadados)) : { imagens: [], descricao: null };
    const capa = escolherCapa(metadados.imagens.map((n) => path.join(pasta, pastaMetadados!, n))) ?? escolherCapa(arquivos.filter(ehImagem).map((n) => path.join(pasta, n)));
    let capaId: string | null = null;
    if (capa) {
      capaId = idDe(`${relativo}/capa/${path.basename(capa)}`, 12);
      resultado.arquivos.set(capaId, { caminho: capa, tipo: 'image' });
    }
    resultado.albuns.push({
      id: idDe(relativo, 10),
      titulo: partes[partes.length - 1],
      grupo: partes.length > 1 ? partes.slice(0, -1).join(' / ') : null,
      descricao: metadados.descricao,
      capaId,
      duracaoTotal: faixas.reduce((soma, f) => soma + (f.duracao ?? 0), 0),
      faixas,
    });
  }

  for (const nome of subpastas) {
    if (nome.toLowerCase() === 'metadados') continue;
    await percorrer(path.join(pasta, nome), [...partes, nome], resultado);
  }
}

// A duração vem do cabeçalho do arquivo (rápido). Fica guardada enquanto o arquivo não mudar de tamanho nem de data.
const duracoes = new Map<string, number | null>();
const MAX_LEITURAS = 16;
let leituras = 0;
const fila: (() => void)[] = [];

async function duracaoDe(caminho: string, tamanho: number, modificadoEm: number): Promise<number | null> {
  const chave = `${caminho}|${tamanho}|${modificadoEm}`;
  if (duracoes.has(chave)) return duracoes.get(chave)!;
  if (leituras >= MAX_LEITURAS) await new Promise<void>((libera) => fila.push(libera));
  leituras++;
  try {
    let { format } = await parseFile(caminho, { skipCovers: true });
    // Sem a duração no cabeçalho, só percorrendo o arquivo todo (mais lento, por isso só neste caso).
    if (format.duration === undefined) ({ format } = await parseFile(caminho, { skipCovers: true, duration: true }));
    const segundos = typeof format.duration === 'number' && Number.isFinite(format.duration) ? format.duration : null;
    duracoes.set(chave, segundos);
    return segundos;
  } catch {
    duracoes.set(chave, null);
    return null;
  } finally {
    leituras--;
    fila.shift()?.();
  }
}

const ehImagem = (nome: string) => EXTENSOES_IMAGEM.has(path.extname(nome).toLowerCase());

async function lerMetadados(pasta: string): Promise<{ imagens: string[]; descricao: string | null }> {
  const nomes = (await readdir(pasta).catch(() => [])).sort(compararNomes);
  const txt = nomes.find((n) => path.extname(n).toLowerCase() === '.txt');
  const descricao = txt ? (await readFile(path.join(pasta, txt), 'utf8').catch(() => '')).trim().slice(0, LIMITE_DESCRICAO) : '';
  return { imagens: nomes.filter(ehImagem), descricao: descricao || null };
}

// Prefere uma imagem chamada capa/cover/poster; senão, a primeira em ordem natural.
function escolherCapa(caminhos: string[]): string | null {
  const preferida = caminhos.find((c) => NOMES_CAPA.some((n) => path.basename(c).toLowerCase().startsWith(n)));
  return preferida ?? caminhos[0] ?? null;
}

// A varredura lê o disco inteiro; guardamos o resultado por poucos segundos (as faixas pedem vários Range seguidos).
const VALIDADE_MS = 15_000;
const cache = new Map<string, { em: number; resultado: Promise<BibliotecaMusicas> }>();

export function musicasDaBiblioteca(raiz: string, agora = Date.now()): Promise<BibliotecaMusicas> {
  const guardado = cache.get(raiz);
  if (guardado && agora - guardado.em < VALIDADE_MS) return guardado.resultado;
  const resultado = varrerMusicas(raiz);
  cache.set(raiz, { em: agora, resultado });
  resultado.catch(() => cache.delete(raiz));
  return resultado;
}

export const esquecerMusicas = (raiz?: string) => (raiz ? cache.delete(raiz) : cache.clear());
