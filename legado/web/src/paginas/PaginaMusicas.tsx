import { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { api, ErroApi } from '../api';
import { Carregando } from '../componentes/Carregando';
import { CardAlbumMusica } from '../componentes/CardAlbumMusica';
import { useDados } from '../usarDados';
import type { AlbumMusicaUI } from '../tipos';

// Biblioteca de músicas: álbuns da raiz primeiro e, depois, um bloco por grupo (ex.: Artistas, Trilhas).
export function PaginaMusicas() {
  const id = Number(useParams().id);
  const bibliotecas = useDados(() => api.bibliotecas(), []);
  const albuns = useDados(() => api.musicas(id), [id]);
  const biblioteca = bibliotecas.dados?.find((b) => b.id === id);

  const grupos = useMemo(() => {
    const porGrupo = new Map<string, AlbumMusicaUI[]>();
    for (const album of albuns.dados ?? []) porGrupo.set(album.grupo ?? '', [...(porGrupo.get(album.grupo ?? '') ?? []), album]);
    return [...porGrupo].sort(([a], [b]) => (a === '' ? -1 : b === '' ? 1 : a.localeCompare(b, 'pt-BR')));
  }, [albuns.dados]);

  if (albuns.erro) {
    return <p className="pagina-vazia">{albuns.erro instanceof ErroApi && albuns.erro.status === 404 ? 'Biblioteca não encontrada.' : albuns.erro.message}</p>;
  }
  if (!albuns.dados) return <Carregando />;

  const total = albuns.dados.length;
  return (
    <div className="pagina">
      <h1 className="titulo-pagina">{biblioteca?.nome ?? 'Músicas'}</h1>
      <p className="texto-suave">{total === 1 ? '1 álbum' : `${total} álbuns`}</p>
      {total === 0 && <p className="texto-suave">Nenhum álbum com músicas encontrado nesta pasta.</p>}
      {grupos.map(([grupo, lista]) => (
        <section key={grupo} aria-label={grupo || 'Álbuns'} className="grupo-musicas">
          {grupo && <h2>{grupo}</h2>}
          <ul className="grade-albuns modo-poster">
            {lista.map((album) => (
              <li key={album.id}>
                <CardAlbumMusica bibliotecaId={id} album={album} />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
