import type { TagExistente } from '../logica/tagPicker';
import { TagPicker } from './TagPicker';

interface Props {
  proprias: string[];
  herdadas: string[];
  existentes: TagExistente[];
  onChange: (proprias: string[]) => void;
  /** Só o desktop edita; mobile e TV mostram as tags como leitura. */
  editavel: boolean;
  prioritarias?: string[];
}

// Tags da foto no painel ⓘ: as próprias (editáveis) e as herdadas do álbum, esmaecidas e sem ×.
export function PainelTagsFoto({ proprias, herdadas, existentes, onChange, editavel, prioritarias }: Props) {
  return (
    <div className="painel-tags-foto">
      <h3>Tags</h3>
      {editavel ? (
        <TagPicker valor={proprias} existentes={existentes} onChange={onChange} prioritarias={prioritarias} rotulo="Tags da foto" />
      ) : (
        <div className="lista-chips" role="group" aria-label="Tags da foto">
          {proprias.length === 0 && <span className="texto-apagado">Sem tags próprias</span>}
          {proprias.map((tag) => <span key={tag} className="chip-tag">{tag}</span>)}
        </div>
      )}
      {herdadas.length > 0 && (
        <div className="lista-chips herdadas" role="group" aria-label="Tags do álbum">
          {herdadas.map((tag) => <span key={tag} className="chip-tag herdada">{tag}</span>)}
          <span className="rotulo-herdadas">do álbum</span>
        </div>
      )}
    </div>
  );
}
