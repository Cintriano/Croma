import { api } from '../api';
import { caminhoBiblioteca, caminhoConfiguracoes, caminhoMusicas } from '../logica/rotas';
import musicas from '../mocks/musicas.json';
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
            <a className="card-biblioteca" href={caminhoBiblioteca(b.id)}>
              <span className="tipo">Fotos</span>
              <strong>{b.nome}</strong>
              <span className="texto-suave">{b.totalColecoes === 1 ? '1 álbum' : `${b.totalColecoes} álbuns`}</span>
            </a>
          </li>
        ))}
        <li>
          <a className="card-biblioteca em-breve" href={caminhoMusicas()}>
            <span className="tipo">Músicas</span>
            <strong>Músicas</strong>
            <span className="texto-suave">{musicas.albuns.length} álbuns</span>
            <span className="selo-em-breve">Em breve</span>
          </a>
        </li>
      </ul>
      {!carregando && bibliotecas?.length === 0 && (
        <p className="texto-suave">
          Nenhuma biblioteca ainda.{' '}
          {plataforma === 'desktop' && <a href={`${caminhoConfiguracoes()}/bibliotecas`}>Criar a primeira biblioteca de Fotos</a>}
        </p>
      )}
    </div>
  );
}
