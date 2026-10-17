import { caminhoAlbum } from '../logica/rotas';
import { urlImagem } from '../logica/imagens';
import type { AlbumUI } from '../tipos';

export type ModoCard = 'miniatura' | 'poster';

interface Props {
  album: Pick<AlbumUI, 'id' | 'titulo' | 'contagem' | 'tags' | 'oculto'> & Pick<AlbumUI, 'posterFotoId' | 'capaFotoId' | 'miniaturaFotoId'>;
  modo: ModoCard;
  selecionado?: boolean;
  onSelecionar?: (evento: React.MouseEvent) => void;
}

// Link comum (<a>): a navegação interna é feita pelo Layout, então o card funciona também fora do roteador.
export function CardAlbum({ album, modo, selecionado, onSelecionar }: Props) {
  const total = album.contagem.total;
  const imagemId = (modo === 'poster' ? album.posterFotoId : album.miniaturaFotoId) ?? album.capaFotoId;
  return (
    <article
      className={`card-album card-${modo}`}
      data-oculto={album.oculto ? 'true' : undefined}
      data-selecionado={selecionado ? 'true' : undefined}
      aria-label={album.titulo}
    >
      <a
        href={caminhoAlbum(album)}
        data-interno
        onClick={(e) => {
          if (onSelecionar) {
            e.preventDefault();
            onSelecionar(e);
          }
        }}
      >
        <div className="card-imagem">
          {imagemId ? <img src={urlImagem(imagemId, 600)} alt="" loading="lazy" /> : <div className="card-sem-imagem" aria-hidden="true">▣</div>}
          {album.oculto && (
            <span className="selo-oculto" aria-label="Álbum oculto" title="Álbum oculto">
              <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
                <path fill="currentColor" d="M2 4.3 3.3 3 21 20.7 19.7 22l-3.2-3.2A10.8 10.8 0 0 1 12 20C6.5 20 2.7 16 1 12c.8-1.9 2-3.6 3.6-5L2 4.3ZM12 4c5.5 0 9.3 4 11 8a12 12 0 0 1-3.4 4.6l-2.9-2.9A5 5 0 0 0 10.3 7.3L8.1 5.1C9.3 4.4 10.6 4 12 4Zm-5 8a5 5 0 0 0 6.7 4.7l-1.6-1.6A3 3 0 0 1 8.9 12L7.3 10.3c-.2.5-.3 1.1-.3 1.7Z" />
              </svg>
            </span>
          )}
        </div>
        <div className="card-texto">
          <h3>{album.titulo}</h3>
          <p>{total === 1 ? '1 foto' : `${total} fotos`}</p>
        </div>
      </a>
    </article>
  );
}
