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
  tipo: 'fotos';
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
  capaFotoId?: number | null;
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
