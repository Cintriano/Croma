export const LARGURAS = [300, 600, 1200] as const;
export type Largura = (typeof LARGURAS)[number];

export const urlCapaMusica = (bibliotecaId: number, capaId: string, largura: Largura = 600) =>
  `/api/libraries/${bibliotecaId}/music/capas/${capaId}?w=${largura}`;
export const urlFaixa = (bibliotecaId: number, faixaId: string) => `/api/libraries/${bibliotecaId}/music/files/${faixaId}`;

// Com largura, a versão do cache; sem largura, o original (usado só no zoom).
export function urlImagem(fotoId: number, largura?: Largura): string {
  return largura ? `/api/photos/${fotoId}/imagem?w=${largura}` : `/api/items/${fotoId}/file`;
}
