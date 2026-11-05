import { useId } from 'react';
import type { EstadoPesquisa } from '../logica/pesquisa';
import type { TagExistente } from '../logica/tagPicker';
import { TagPicker } from './TagPicker';

interface Props {
  estado: EstadoPesquisa;
  existentes: TagExistente[];
  /** Tags mais usadas no resultado atual, para refinar com um clique. */
  sugestoes: TagExistente[];
  onChange: (estado: EstadoPesquisa) => void;
}

export function BarraPesquisaTags({ estado, existentes, sugestoes, onChange }: Props) {
  const id = useId();
  const mudar = (parcial: Partial<EstadoPesquisa>) => onChange({ ...estado, ...parcial });

  return (
    <div className="barra-pesquisa" role="search">
      <TagPicker valor={estado.tags} existentes={existentes} onChange={(tags) => mudar({ tags })} rotulo="Pesquisar tags" />
      <div className="barra-pesquisa-opcoes">
        <fieldset className="segmentado">
          <legend className="visualmente-oculto">Procurar em</legend>
          <label>
            <input type="radio" name={`${id}-busca`} checked={estado.busca === 'albuns'} onChange={() => mudar({ busca: 'albuns' })} />
            Álbuns
          </label>
          <label>
            <input type="radio" name={`${id}-busca`} checked={estado.busca === 'fotos'} onChange={() => mudar({ busca: 'fotos' })} />
            Fotos
          </label>
        </fieldset>
        <fieldset className="segmentado">
          <legend>Combinar:</legend>
          <label>
            <input type="radio" name={`${id}-modo`} checked={estado.modo === 'todas'} onChange={() => mudar({ modo: 'todas' })} />
            Todas as tags
          </label>
          <label>
            <input type="radio" name={`${id}-modo`} checked={estado.modo === 'qualquer'} onChange={() => mudar({ modo: 'qualquer' })} />
            Qualquer tag
          </label>
        </fieldset>
      </div>
      {sugestoes.length > 0 && (
        <div className="sugestoes">
          <span className="texto-suave">Sugestões:</span>
          {sugestoes.map((s) => (
            <button key={s.tag} type="button" className="botao-texto" onClick={() => mudar({ tags: [...estado.tags, s.tag] })}>
              {s.tag} ({s.usos})
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
