import type { Dirent } from 'node:fs';
import { readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import type { Aviso } from '../avisos';
import { lerExif, type Exif } from '../imagens/exif';
import { lerColecao, type Colecao } from '../metadados/colecao';
import { lerFotosJson, reconciliarFotosJson, type FotosJson } from '../metadados/fotosJson';
import { classificarSubpasta } from './niveis';

export const EXTENSOES_FOTO = new Set(['.jpg', '.jpeg', '.png', '.webp']);

// Pastas de sistema que aparecem na raiz de discos do Windows e nunca são álbuns.
const PASTAS_DE_SISTEMA = new Set(['$recycle.bin', 'system volume information']);

export interface FotoVarrida {
  /** Relativo ao álbum, com barras normais. */
  caminhoRelativo: string;
  nivel: 1 | 2 | 3 | null;
  tamanho: number;
  /** mtime em milissegundos. */
  modificadoEm: number;
  exif: Exif | null;
}

export interface ContagemNiveis {
  total: number;
  nivel1: number;
  nivel2: number;
  nivel3: number;
  semNivel: number;
}

export interface AlbumVarrido {
  /** Nome da pasta do álbum. */
  nome: string;
  caminho: string;
  titulo: string;
  colecao: Colecao | null;
  fotosJson: FotosJson;
  /** Verdadeiro quando a varredura corrigiu entradas do fotos.json e ele precisa ser regravado. */
  fotosJsonAlterado: boolean;
  fotos: FotoVarrida[];
  contagem: ContagemNiveis;
}

export interface AlteracoesVarredura {
  /** Caminhos no formato "Álbum/Nivel_1/foto.jpg". */
  novas: string[];
  alteradas: string[];
  removidas: string[];
}

export interface ResultadoVarredura {
  albuns: AlbumVarrido[];
  avisos: Aviso[];
  alteracoes: AlteracoesVarredura;
}

export interface OpcoesVarredura {
  /** Varredura anterior: fotos com mesmo tamanho e data reaproveitam o EXIF já lido. */
  anterior?: ResultadoVarredura;
}

export interface PreviaBiblioteca {
  albuns: string[];
  avisos: Aviso[];
}

export async function varrerBibliotecaFotos(raiz: string, opcoes: OpcoesVarredura = {}): Promise<ResultadoVarredura> {
  const pastas = await listarPastasDeAlbum(raiz);
  const anteriores = indexarAnterior(opcoes.anterior);
  const avisos: Aviso[] = [];
  const albuns: AlbumVarrido[] = [];

  for (const nome of pastas) {
    const caminho = path.join(raiz, nome);
    const estrutura = await lerEstruturaAlbum(caminho, avisos);
    const leitura = await lerFotosJson(caminho);
    if (leitura.aviso) avisos.push(leitura.aviso);

    const fotosAnteriores = anteriores.get(nome);
    const fotos = await lerFotos(estrutura.arquivos, fotosAnteriores);
    const { fotosJson, corrigidas, orfas } = reconciliarFotosJson(
      leitura.fotosJson,
      fotos.map((f) => ({ caminhoRelativo: f.caminhoRelativo, tamanho: f.tamanho, dataCaptura: f.exif?.dataCaptura ?? null })),
      { datasAnteriores: datasDeCaptura(fotosAnteriores) },
    );
    for (const chave of orfas) {
      avisos.push({ tipo: 'tag-orfa', caminho: path.join(caminho, chave), mensagem: 'Foto com tags no fotos.json não foi encontrada no álbum; a entrada foi mantida.' });
    }

    albuns.push({
      nome,
      caminho,
      titulo: tituloDoAlbum(nome, estrutura.colecao),
      colecao: estrutura.colecao,
      fotosJson,
      fotosJsonAlterado: corrigidas.length > 0,
      fotos,
      contagem: contar(fotos),
    });
  }

  return { albuns, avisos, alteracoes: compararComAnterior(albuns, opcoes.anterior) };
}

// Lista os álbuns e os avisos de estrutura sem ler as fotos, para a tela de criação da biblioteca.
export async function previaBibliotecaFotos(raiz: string): Promise<PreviaBiblioteca> {
  const albuns = await listarPastasDeAlbum(raiz);
  const avisos: Aviso[] = [];
  for (const nome of albuns) await lerEstruturaAlbum(path.join(raiz, nome), avisos);
  return { albuns, avisos };
}

async function listarPastasDeAlbum(raiz: string): Promise<string[]> {
  let entradas: Dirent[];
  try {
    if (!(await stat(raiz)).isDirectory()) throw new Error('não é pasta');
    entradas = await readdir(raiz, { withFileTypes: true });
  } catch {
    throw Object.assign(new Error(`Caminho inválido ou inacessível: ${raiz}`), { codigo: 'caminho-invalido' });
  }
  return entradas
    .filter((e) => e.isDirectory() && !e.name.startsWith('.') && !PASTAS_DE_SISTEMA.has(e.name.toLowerCase()))
    .map((e) => e.name)
    .sort(compararNomes);
}

interface ArquivoFoto {
  absoluto: string;
  relativo: string;
  nivel: 1 | 2 | 3 | null;
}

interface EstruturaAlbum {
  colecao: Colecao | null;
  arquivos: ArquivoFoto[];
}

// Lê o colecao.json e localiza os arquivos de foto (raiz e pastas de nível), registrando os avisos.
async function lerEstruturaAlbum(caminho: string, avisos: Aviso[]): Promise<EstruturaAlbum> {
  const { dados, aviso } = await lerColecao(caminho);
  if (aviso) avisos.push(aviso);
  else if (!dados) avisos.push({ tipo: 'sem-metadados', caminho, mensagem: 'Álbum sem metadados/colecao.json; serão usados os valores padrão.' });

  const arquivos: ArquivoFoto[] = [];
  for (const entrada of await readdir(caminho, { withFileTypes: true })) {
    if (entrada.isFile()) {
      if (ehFoto(entrada.name)) arquivos.push({ absoluto: path.join(caminho, entrada.name), relativo: entrada.name, nivel: null });
      continue;
    }
    if (!entrada.isDirectory()) continue;

    const subpasta = classificarSubpasta(entrada.name);
    const pasta = path.join(caminho, entrada.name);
    if (subpasta.tipo === 'metadados') continue;
    if (subpasta.tipo === 'ignorada') {
      avisos.push({ tipo: 'pasta-ignorada', caminho: pasta, mensagem: 'Subpasta fora do padrão (Nivel_1, Nivel_2, Nivel_3 ou metadados); as fotos dela não entram no álbum.' });
      continue;
    }
    for (const dentro of await readdir(pasta, { withFileTypes: true })) {
      if (dentro.isFile() && ehFoto(dentro.name)) {
        arquivos.push({ absoluto: path.join(pasta, dentro.name), relativo: `${entrada.name}/${dentro.name}`, nivel: subpasta.nivel });
      } else if (dentro.isDirectory()) {
        avisos.push({ tipo: 'pasta-ignorada', caminho: path.join(pasta, dentro.name), mensagem: 'Subpastas dentro de um nível não são lidas.' });
      }
    }
  }
  arquivos.sort((a, b) => compararNomes(a.relativo, b.relativo));
  return { colecao: dados, arquivos };
}

async function lerFotos(arquivos: ArquivoFoto[], anteriores?: Map<string, FotoVarrida>): Promise<FotoVarrida[]> {
  return mapearComLimite(arquivos, 8, async (arquivo) => {
    const info = await stat(arquivo.absoluto);
    const tamanho = info.size;
    const modificadoEm = Math.floor(info.mtimeMs);
    const anterior = anteriores?.get(arquivo.relativo);
    const inalterada = anterior && anterior.tamanho === tamanho && anterior.modificadoEm === modificadoEm;
    const exif = inalterada ? anterior.exif : await lerExif(arquivo.absoluto);
    return { caminhoRelativo: arquivo.relativo, nivel: arquivo.nivel, tamanho, modificadoEm, exif };
  });
}

function tituloDoAlbum(nome: string, colecao: Colecao | null): string {
  const titulo = typeof colecao?.titulo === 'string' ? colecao.titulo.trim() : '';
  return titulo || nome;
}

function contar(fotos: FotoVarrida[]): ContagemNiveis {
  const contagem: ContagemNiveis = { total: fotos.length, nivel1: 0, nivel2: 0, nivel3: 0, semNivel: 0 };
  for (const foto of fotos) {
    if (foto.nivel === 1) contagem.nivel1++;
    else if (foto.nivel === 2) contagem.nivel2++;
    else if (foto.nivel === 3) contagem.nivel3++;
    else contagem.semNivel++;
  }
  return contagem;
}

function datasDeCaptura(fotos?: Map<string, FotoVarrida>): Record<string, string | null> {
  const datas: Record<string, string | null> = {};
  for (const [chave, foto] of fotos ?? []) datas[chave] = foto.exif?.dataCaptura ?? null;
  return datas;
}

function indexarAnterior(anterior?: ResultadoVarredura): Map<string, Map<string, FotoVarrida>> {
  const indice = new Map<string, Map<string, FotoVarrida>>();
  for (const album of anterior?.albuns ?? []) {
    indice.set(album.nome, new Map(album.fotos.map((f) => [f.caminhoRelativo, f])));
  }
  return indice;
}

function compararComAnterior(albuns: AlbumVarrido[], anterior?: ResultadoVarredura): AlteracoesVarredura {
  const alteracoes: AlteracoesVarredura = { novas: [], alteradas: [], removidas: [] };
  if (!anterior) return alteracoes;

  const antes = new Map<string, FotoVarrida>();
  for (const album of anterior.albuns) for (const foto of album.fotos) antes.set(`${album.nome}/${foto.caminhoRelativo}`, foto);

  const agora = new Set<string>();
  for (const album of albuns) {
    for (const foto of album.fotos) {
      const chave = `${album.nome}/${foto.caminhoRelativo}`;
      agora.add(chave);
      const velha = antes.get(chave);
      if (!velha) alteracoes.novas.push(chave);
      else if (velha.tamanho !== foto.tamanho || velha.modificadoEm !== foto.modificadoEm) alteracoes.alteradas.push(chave);
    }
  }
  for (const chave of antes.keys()) if (!agora.has(chave)) alteracoes.removidas.push(chave);
  return alteracoes;
}

const ehFoto = (nome: string) => EXTENSOES_FOTO.has(path.extname(nome).toLowerCase());

const comparador = new Intl.Collator('pt-BR', { numeric: true, sensitivity: 'base' });
const compararNomes = (a: string, b: string) => comparador.compare(a, b);

async function mapearComLimite<T, R>(itens: T[], limite: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const resultados = new Array<R>(itens.length);
  let proximo = 0;
  const trabalhador = async () => {
    while (proximo < itens.length) {
      const i = proximo++;
      resultados[i] = await fn(itens[i]);
    }
  };
  await Promise.all(Array.from({ length: Math.min(limite, itens.length) }, trabalhador));
  return resultados;
}
