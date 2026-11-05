// Formatos que a interface usa, espelhando as respostas da API.

export type Nivel = 1 | 2 | 3;
export type Plataforma = 'desktop' | 'mobile' | 'tv';

export interface Contagem {
  total: number;
  nivel1: number;
  nivel2: number;
  nivel3: number;
  semNivel: number;
}

export interface BibliotecaUI {
  id: number;
  nome: string;
  tipo: 'fotos' | 'musicas';
  caminho: string;
  totalColecoes: number;
}

export interface AlbumUI {
  id: number;
  titulo: string;
  contagem: Contagem;
  tags: string[];
  oculto: boolean;
  nome?: string;
  bibliotecaId?: number;
  disponivel?: boolean;
  colecao?: Record<string, unknown> | null;
  /** Fotos escolhidas para cada arte (ou a primeira foto, se não houver escolha). */
  posterFotoId?: number | null;
  capaFotoId?: number | null;
  miniaturaFotoId?: number | null;
}

export interface FotoUI {
  id: number;
  nome: string;
  caminhoRelativo: string;
  nivel: Nivel | null;
  dataCaptura: string | null;
  camera: string | null;
  /** Tags próprias da foto. */
  tags: string[];
  albumId?: number;
  albumTitulo?: string;
  /** Tags herdadas do álbum (vêm na pesquisa de fotos). */
  herdadas?: string[];
  orientacao?: number | null;
  tamanho?: number;
}

export interface TagContada {
  tag: string;
  albuns: number;
  fotos: number;
  usos: number;
}

export interface Aviso {
  tipo: 'pasta-ignorada' | 'sem-metadados' | 'json-invalido' | 'tag-orfa';
  caminho: string;
  mensagem: string;
}

export interface FaixaMusicaUI {
  id: string;
  titulo: string;
  tamanho: number;
  /** Segundos; null quando o arquivo não pôde ser lido. */
  duracao: number | null;
}

export interface AlbumMusicaUI {
  id: string;
  titulo: string;
  /** Pastas acima do álbum (ex.: "Artistas"); null quando está na raiz. */
  grupo: string | null;
  descricao: string | null;
  capaId: string | null;
  totalFaixas: number;
  /** Soma da duração das faixas, em segundos. */
  duracaoTotal: number;
  /** Só vem ao abrir o álbum. */
  faixas?: FaixaMusicaUI[];
}
