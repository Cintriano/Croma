import { api } from '../api';
import { Carregando } from '../componentes/Carregando';
import { caminhoBiblioteca, caminhoConfiguracoes, caminhoMusicas } from '../logica/rotas';
import { usePlataforma } from '../plataforma';
import { useDados } from '../usarDados';

export function PaginaInicio() {
  const { dados: bibliotecas, carregando } = useDados(() => api.bibliotecas(), []);
  const plataforma = usePlataforma();

  return (
    <div className="pagina">
      <h1 className="titulo-pagina">Início</h1>
      <ul className="grade-bibliotecas" aria-label="Bibliotecas">
        {bibliotecas?.map((b) => (
          <li key={b.id}>
            <a className="card-biblioteca" href={b.tipo === 'musicas' ? caminhoMusicas(b.id) : caminhoBiblioteca(b.id)}>
              <span className="tipo">{b.tipo === 'musicas' ? 'Músicas' : 'Fotos'}</span>
              <strong>{b.nome}</strong>
              <span className="texto-suave">{b.totalColecoes === 1 ? '1 álbum' : `${b.totalColecoes} álbuns`}</span>
            </a>
          </li>
        ))}
      </ul>
      {carregando && bibliotecas === undefined && <Carregando />}
      {!carregando && bibliotecas?.length === 0 && (
        <p className="texto-suave">
          Nenhuma biblioteca ainda.{' '}
          {plataforma === 'desktop' && <a href={`${caminhoConfiguracoes()}/bibliotecas`}>Criar a primeira biblioteca de Fotos</a>}
        </p>
      )}
    </div>
  );
}
