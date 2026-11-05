// URLs das telas. Cada tela tem a sua, para o Voltar (inclusive o da TV) subir um nível.

export function slug(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

type AlbumRota = { id: number; titulo: string };

export const caminhoInicio = () => '/';
export const caminhoBiblioteca = (id: number) => `/biblioteca/${id}`;
export const caminhoAlbum = (album: AlbumRota) => `/album/${album.id}/${slug(album.titulo) || 'album'}`;
export const caminhoFoto = (album: AlbumRota, fotoId: number) => `${caminhoAlbum(album)}/foto/${fotoId}`;
export const caminhoConfiguracoes = () => '/configuracoes';
export const caminhoMusicas = (bibliotecaId: number) => `/musicas/${bibliotecaId}`;
export const caminhoAlbumMusica = (bibliotecaId: number, album: { id: string; titulo: string }) =>
  `/musicas/${bibliotecaId}/album/${album.id}/${slug(album.titulo) || 'album'}`;
