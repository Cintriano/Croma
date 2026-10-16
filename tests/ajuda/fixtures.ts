// Gera bibliotecas de fotos de verdade em pastas temporárias para os testes.
// As imagens são JPEGs pequenos criados com sharp, então EXIF e redimensionamento funcionam.
import { mkdtemp, mkdir, writeFile, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import sharp from 'sharp';

export async function criarPastaTemp(prefixo = 'central-midia-'): Promise<string> {
  return mkdtemp(path.join(tmpdir(), prefixo));
}

export interface OpcoesJpeg {
  largura?: number;
  altura?: number;
  cor?: string;
  orientacao?: number;
  camera?: { marca: string; modelo: string };
}

export async function criarJpeg(caminho: string, opcoes: OpcoesJpeg = {}): Promise<void> {
  await mkdir(path.dirname(caminho), { recursive: true });
  let imagem = sharp({
    create: {
      width: opcoes.largura ?? 64,
      height: opcoes.altura ?? 48,
      channels: 3,
      background: opcoes.cor ?? '#ff6b1a',
    },
  }).jpeg();
  if (opcoes.camera) {
    imagem = imagem.withExif({ IFD0: { Make: opcoes.camera.marca, Model: opcoes.camera.modelo } });
  }
  if (opcoes.orientacao) {
    imagem = imagem.withMetadata({ orientation: opcoes.orientacao });
  }
  await imagem.toFile(caminho);
}

export interface AlbumFixture {
  nome: string;
  /** Objeto vira colecao.json; string é gravada crua (para testar JSON inválido). */
  colecao?: object | string;
  /** Entradas sem `tamanho` recebem o tamanho real do arquivo. */
  fotosJson?: { versao: number; fotos: Record<string, { tags: string[]; tamanho?: number }> };
  /** Chave = subpasta do álbum ('Nivel_1', 'Extras'...) ou 'raiz' para fotos soltas. */
  fotos?: Record<string, string[]>;
  /** Arquivos que não são foto, relativos ao álbum. */
  outrosArquivos?: string[];
}

export interface BibliotecaFixture {
  raiz: string;
  limpar: () => Promise<void>;
}

export async function criarBibliotecaFotos(albuns: AlbumFixture[]): Promise<BibliotecaFixture> {
  const raiz = await criarPastaTemp('fotos-');
  for (const album of albuns) {
    const pastaAlbum = path.join(raiz, album.nome);
    await mkdir(pastaAlbum, { recursive: true });

    let cor = 0;
    for (const [subpasta, arquivos] of Object.entries(album.fotos ?? {})) {
      for (const arquivo of arquivos) {
        const destino = subpasta === 'raiz' ? path.join(pastaAlbum, arquivo) : path.join(pastaAlbum, subpasta, arquivo);
        // Cores diferentes deixam cada arquivo com tamanho próprio.
        await criarJpeg(destino, { cor: `#${(0x203040 + cor * 0x0a1b2c).toString(16).slice(-6)}`, largura: 64 + cor });
        cor++;
      }
    }

    for (const arquivo of album.outrosArquivos ?? []) {
      const destino = path.join(pastaAlbum, arquivo);
      await mkdir(path.dirname(destino), { recursive: true });
      await writeFile(destino, 'não é foto');
    }

    if (album.colecao !== undefined || album.fotosJson !== undefined) {
      await mkdir(path.join(pastaAlbum, 'metadados'), { recursive: true });
    }
    if (album.colecao !== undefined) {
      const conteudo = typeof album.colecao === 'string' ? album.colecao : JSON.stringify(album.colecao, null, 2);
      await writeFile(path.join(pastaAlbum, 'metadados', 'colecao.json'), conteudo);
    }
    if (album.fotosJson !== undefined) {
      const fotos: Record<string, { tags: string[]; tamanho: number }> = {};
      for (const [chave, entrada] of Object.entries(album.fotosJson.fotos)) {
        const tamanho = entrada.tamanho ?? (await stat(path.join(pastaAlbum, chave))).size;
        fotos[chave] = { tags: entrada.tags, tamanho };
      }
      await writeFile(
        path.join(pastaAlbum, 'metadados', 'fotos.json'),
        JSON.stringify({ versao: album.fotosJson.versao, fotos }, null, 2),
      );
    }
  }
  return { raiz, limpar: () => rm(raiz, { recursive: true, force: true }) };
}

/**
 * Biblioteca usada pela maioria dos testes:
 * - Viagem Nordeste: 2 fotos no nível 1, 1 no 2, 1 no 3, 1 solta; pastas fora do padrão; tags por foto.
 * - Aniversario 2025: 1 foto no nível 1, 2 no nível 2.
 * - Neve: álbum oculto.
 * - Sem Metadados: sem pasta metadados.
 */
export const ALBUNS_PADRAO: AlbumFixture[] = [
  {
    nome: 'Viagem Nordeste',
    colecao: { titulo: 'Viagem Nordeste', descricao: 'Férias de julho', ano: 2025, tags: ['praia', 'família', 'nordeste'] },
    fotos: {
      Nivel_1: ['IMG_0001.jpg', 'IMG_0002.JPG'],
      Nivel_2: ['IMG_0042.jpg'],
      Nivel_3: ['IMG_0107.jpg'],
      raiz: ['solta.jpg'],
      Nivel_4: ['fora.jpg'],
      Extras: ['extra.jpg'],
    },
    outrosArquivos: ['Nivel_1/notas.txt', 'Nivel_2/video.ts'],
    fotosJson: { versao: 1, fotos: { 'Nivel_1/IMG_0001.jpg': { tags: ['mar', 'pôr do sol'] } } },
  },
  {
    nome: 'Aniversario 2025',
    colecao: { titulo: 'Aniversário 2025', ano: 2025, tags: ['família', 'festa'] },
    fotos: { Nivel_1: ['A.jpg'], Nivel_2: ['B.jpg', 'C.jpg'] },
    fotosJson: { versao: 1, fotos: { 'Nivel_2/B.jpg': { tags: ['bolo'] } } },
  },
  {
    nome: 'Neve',
    colecao: { titulo: 'Neve', tags: ['neve', 'família'], oculto: true },
    fotos: { Nivel_1: ['N1.jpg'] },
  },
  {
    nome: 'Sem Metadados',
    fotos: { Nivel_1: ['X.jpg'] },
  },
];

export function criarBibliotecaPadrao(): Promise<BibliotecaFixture> {
  return criarBibliotecaFotos(ALBUNS_PADRAO);
}
