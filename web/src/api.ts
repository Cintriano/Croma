import type { AlbumUI, Aviso, BibliotecaUI, FotoUI, TagContada } from './tipos';

export class ErroApi extends Error {
  constructor(
    readonly status: number,
    readonly codigo: string,
    mensagem: string,
  ) {
    super(mensagem);
  }
}

async function pedir<T>(url: string, opcoes: RequestInit = {}): Promise<T> {
  const resposta = await fetch(url, {
    ...opcoes,
    headers: opcoes.body ? { 'content-type': 'application/json', ...opcoes.headers } : opcoes.headers,
  });
  const corpo = await resposta.json().catch(() => ({}));
  if (!resposta.ok) throw new ErroApi(resposta.status, corpo.codigo ?? 'erro', corpo.mensagem ?? `Erro ${resposta.status}`);
  return corpo as T;
}

const enviar = (metodo: string, corpo: unknown): RequestInit => ({ method: metodo, body: JSON.stringify(corpo) });

function consulta(parametros: Record<string, string | number | boolean | undefined | null>): string {
  const p = new URLSearchParams();
  for (const [chave, valor] of Object.entries(parametros)) {
    if (valor !== undefined && valor !== null && valor !== '' && valor !== false) p.set(chave, String(valor));
  }
  const texto = p.toString();
  return texto ? `?${texto}` : '';
}

export interface Pasta {
  nome: string;
  caminho: string;
}

export interface ResultadoMassa {
  alteradas: number[];
  falhas: { id: number; mensagem: string }[];
}

export const api = {
  bibliotecas: () => pedir<{ bibliotecas: BibliotecaUI[] }>('/api/libraries').then((r) => r.bibliotecas),
  criarBiblioteca: (dados: { nome: string; tipo: 'fotos'; caminho: string }) =>
    pedir<BibliotecaUI & { avisos: Aviso[] }>('/api/libraries', enviar('POST', dados)),
  previa: (caminho: string) => pedir<{ albuns: string[]; avisos: Aviso[] }>('/api/libraries/previa', enviar('POST', { caminho })),
  pastas: (caminho?: string) =>
    pedir<{ caminho: string | null; pai: string | null; pastas: Pasta[] }>(`/api/fs${consulta({ path: caminho })}`),

  albuns: (bibliotecaId: number, opcoes: { tags?: string[]; modo?: string; incluirOcultos?: boolean } = {}) =>
    pedir<{ colecoes: AlbumUI[] }>(
      `/api/libraries/${bibliotecaId}/collections${consulta({ tags: opcoes.tags?.join(','), modo: opcoes.modo, incluirOcultos: opcoes.incluirOcultos })}`,
    ).then((r) => r.colecoes),
  buscarFotos: (bibliotecaId: number, opcoes: { tags: string[]; modo?: string; nivel?: number }) =>
    pedir<{ fotos: (FotoUI & { proprias: string[]; herdadas: string[] })[] }>(
      `/api/libraries/${bibliotecaId}/photos${consulta({ tags: opcoes.tags.join(','), modo: opcoes.modo, nivel: opcoes.nivel })}`,
    ).then((r) => r.fotos),
  tags: (bibliotecaId: number) => pedir<{ tags: TagContada[] }>(`/api/libraries/${bibliotecaId}/tags`).then((r) => r.tags),

  album: (id: number, incluirOcultos = false) => pedir<AlbumUI>(`/api/collections/${id}${consulta({ incluirOcultos })}`),
  fotosDoAlbum: (id: number, incluirOcultos = false) =>
    pedir<{ fotos: FotoUI[] }>(`/api/collections/${id}/photos${consulta({ incluirOcultos })}`).then((r) => r.fotos),
  editarAlbum: (id: number, alteracoes: Record<string, unknown>) => pedir<AlbumUI>(`/api/collections/${id}`, enviar('PUT', alteracoes)),
  tagsEmMassa: (colecoes: number[], adicionar: string[], remover: string[]) =>
    pedir<ResultadoMassa>('/api/collections/tags', enviar('PATCH', { colecoes, adicionar, remover })),
  tagsDeFotos: (fotos: number[], adicionar: string[], remover: string[]) =>
    pedir<ResultadoMassa>('/api/photos/tags', enviar('PATCH', { fotos, adicionar, remover })),

  varrer: (bibliotecaId?: number) => pedir<{ avisos: Aviso[] }>('/api/scan', enviar('POST', { bibliotecaId })),
};
