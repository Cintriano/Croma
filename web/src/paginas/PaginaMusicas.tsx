import musicas from '../mocks/musicas.json';

// Biblioteca de Músicas fora do escopo: só exibe os dados mockados, com o selo "Em breve".
export function PaginaMusicas() {
  return (
    <div className="pagina">
      <h1 className="titulo-pagina">
        Músicas <span className="selo-em-breve">Em breve</span>
      </h1>
      <p className="texto-suave">Prévia com dados de exemplo; a biblioteca de Músicas ainda não lê arquivos do disco.</p>
      <ul className="grade-albuns" aria-label="Álbuns de música">
        {musicas.albuns.map((album) => (
          <li key={album.id}>
            <article className="card-album card-poster" aria-label={album.titulo}>
              <div className="card-imagem poster">
                <img src={album.poster} alt="" loading="lazy" />
              </div>
              <div className="card-texto">
                <h3>{album.titulo}</h3>
                <p>{album.artista} · {album.ano} · {album.faixas.length} faixas</p>
              </div>
            </article>
          </li>
        ))}
      </ul>
    </div>
  );
}
