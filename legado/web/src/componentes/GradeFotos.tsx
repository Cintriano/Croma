import { urlImagem } from '../logica/imagens';
import type { FotoUI } from '../tipos';
import { SeloNivel } from './SeloNivel';

interface Props {
  fotos: FotoUI[];
  onAbrir: (indice: number) => void;
  /** Mostra o nome do álbum em cada card (pesquisa de fotos). */
  mostrarAlbum?: boolean;
}

export function GradeFotos({ fotos, onAbrir, mostrarAlbum }: Props) {
  return (
    <ul className="grade-fotos" aria-label="Fotos">
      {fotos.map((foto, indice) => (
        <li key={foto.id} className="card-foto" onClick={() => onAbrir(indice)}>
          <button type="button" className="card-foto-botao" aria-label={`Abrir ${foto.nome}`}>
            <img src={urlImagem(foto.id, 300)} alt="" loading="lazy" />
          </button>
          <SeloNivel nivel={foto.nivel} className="no-canto" />
          {foto.tags.length > 0 && (
            <span className="icone-tag" title={foto.tags.join(', ')} aria-label="Foto com tags">🏷</span>
          )}
          {mostrarAlbum && foto.albumTitulo && <span className="nome-album">{foto.albumTitulo}</span>}
        </li>
      ))}
    </ul>
  );
}
