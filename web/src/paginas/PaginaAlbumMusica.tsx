import { useParams } from 'react-router-dom';
import { api, ErroApi } from '../api';
import { BotoesTocar } from '../componentes/BotoesTocar';
import { Carregando } from '../componentes/Carregando';
import { embaralhar, formatarDuracaoTotal, formatarTempo, type FaixaFila } from '../logica/fila';
import { urlCapaMusica } from '../logica/imagens';
import { usePlayer } from '../musica/Player';
import { useDados } from '../usarDados';

export function PaginaAlbumMusica() {
  const { id, albumId } = useParams();
  const bibliotecaId = Number(id);
  const album = useDados(() => api.albumMusica(bibliotecaId, albumId!), [bibliotecaId, albumId]);
  const { atual, tocando, tocar } = usePlayer();

  if (album.erro) {
    return <p className="pagina-vazia">{album.erro instanceof ErroApi && album.erro.status === 404 ? 'Álbum não encontrado.' : album.erro.message}</p>;
  }
  const a = album.dados;
  if (!a) return <Carregando />;

  const faixas = a.faixas ?? [];
  const fila: FaixaFila[] = faixas.map((f) => ({ id: f.id, titulo: f.titulo, bibliotecaId, album: a.titulo, capaId: a.capaId }));

  return (
    <div className="pagina pagina-album-musica">
      <header className="cabecalho-musica">
        <div className="capa-musica">
          {a.capaId ? <img src={urlCapaMusica(bibliotecaId, a.capaId, 600)} alt="" /> : <div className="card-sem-imagem" aria-hidden="true">♪</div>}
        </div>
        <div className="informacoes">
          {a.grupo && <p className="texto-suave">{a.grupo}</p>}
          <h1>{a.titulo}</h1>
          <p className="texto-suave">{[a.totalFaixas === 1 ? '1 faixa' : `${a.totalFaixas} faixas`, formatarDuracaoTotal(a.duracaoTotal)].filter(Boolean).join(' · ')}</p>
          {a.descricao && <p className="descricao">{a.descricao}</p>}
          <BotoesTocar desativado={fila.length === 0} onTocar={() => tocar(fila, 0)} onAleatorio={() => tocar(embaralhar(fila), 0)} />
        </div>
      </header>

      <ol className="lista-faixas" aria-label="Faixas">
        {faixas.map((faixa, indice) => {
          const ativa = atual?.id === faixa.id;
          return (
            <li key={faixa.id} data-ativa={ativa ? 'true' : undefined}>
              <button type="button" onClick={() => tocar(fila, indice)} aria-label={`Tocar ${faixa.titulo}`}>
                <span className="faixa-numero" aria-hidden="true">{ativa && tocando ? '♪' : indice + 1}</span>
                <span className="faixa-titulo">{faixa.titulo}</span>
                {faixa.duracao !== null && <span className="faixa-duracao">{formatarTempo(faixa.duracao)}</span>}
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
