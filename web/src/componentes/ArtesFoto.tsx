import { ROTULOS_ARTE, type CampoArte } from './ArtesAlbum';

interface Props {
  /** Quais artes do álbum já usam esta foto. */
  atuais: Record<CampoArte, boolean>;
  onEscolher: (campo: CampoArte) => void;
}

// Ação do painel ⓘ da foto: usar esta foto como poster, capa de fundo ou miniatura do álbum.
export function ArtesFoto({ atuais, onEscolher }: Props) {
  return (
    <div className="artes-foto">
      <h3>Usar como</h3>
      <div className="lista-chips">
        {(Object.keys(ROTULOS_ARTE) as CampoArte[]).map((campo) => (
          <button key={campo} type="button" className="botao" disabled={atuais[campo]} onClick={() => onEscolher(campo)}>
            {ROTULOS_ARTE[campo]}{atuais[campo] ? ' (atual)' : ''}
          </button>
        ))}
      </div>
    </div>
  );
}
