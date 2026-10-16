import type { FiltroDeNivel } from '../logica/fotos';
import type { Contagem, Nivel } from '../tipos';

// Botões "Todos 128 · ★1 40 · ★2 60 · ★3 28"; nível sem fotos fica desativado.
export function FiltroNivel({ contagem, valor, onChange }: { contagem: Contagem; valor: FiltroDeNivel; onChange: (valor: FiltroDeNivel) => void }) {
  const niveis: [Nivel, number][] = [
    [1, contagem.nivel1],
    [2, contagem.nivel2],
    [3, contagem.nivel3],
  ];
  return (
    <div className="filtro-nivel" role="group" aria-label="Filtrar por nível">
      <button type="button" className="chip" aria-pressed={valor === 'todos'} onClick={() => onChange('todos')}>
        Todos {contagem.total}
      </button>
      {niveis.map(([nivel, quantidade]) => (
        <button
          key={nivel}
          type="button"
          className="chip"
          aria-label={`Nível ${nivel}: ${quantidade}`}
          aria-pressed={valor === nivel}
          disabled={quantidade === 0}
          onClick={() => onChange(nivel)}
        >
          <span className="estrela">★</span>{nivel} {quantidade}
        </button>
      ))}
      {contagem.semNivel > 0 && (
        <button type="button" className="chip" aria-pressed={valor === 'sem'} onClick={() => onChange('sem')}>
          sem nível {contagem.semNivel}
        </button>
      )}
    </div>
  );
}
