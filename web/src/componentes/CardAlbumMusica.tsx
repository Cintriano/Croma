import { formatarDuracaoTotal } from '../logica/fila';
import { urlCapaMusica } from '../logica/imagens';
import { caminhoAlbumMusica } from '../logica/rotas';
import type { AlbumMusicaUI } from '../tipos';

// Link comum (<a>): a navegação interna é feita pelo Layout, como nos cards de fotos.
export function CardAlbumMusica({ bibliotecaId, album }: { bibliotecaId: number; album: AlbumMusicaUI }) {
  return (
    <article className="card-album card-poster" aria-label={album.titulo}>
      <a href={caminhoAlbumMusica(bibliotecaId, album)} data-interno>
        <div className="card-imagem quadrada">
          {album.capaId ? <img src={urlCapaMusica(bibliotecaId, album.capaId, 300)} alt="" loading="lazy" /> : <div className="card-sem-imagem" aria-hidden="true">♪</div>}
        </div>
        <div className="card-texto">
          <h3>{album.titulo}</h3>
          <p>{album.totalFaixas === 1 ? '1 faixa' : `${album.totalFaixas} faixas`}</p>
          <p>{formatarDuracaoTotal(album.duracaoTotal) || '\u00a0'}</p>
        </div>
      </a>
    </article>
  );
}
