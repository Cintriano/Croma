import type { FiltroDeNivel } from '../logica/fotos';
import type { Contagem, Nivel } from '../tipos';

// Botões "Todos 128 · Nível 1 40 · Nível 2 60 · Nível 3 28" (contagem em selo à parte); nível sem fotos fica desativado.
export function FiltroNivel({ contagem, valor, onChange }: { contagem: Contagem; valor: FiltroDeNivel; onChange: (valor: FiltroDeNivel) => void }) {
  const niveis: [Nivel, number][] = [
    [1, contagem.nivel1],
    [2, contagem.nivel2],
    [3, contagem.nivel3],
  ];
  return (
    <div className="filtro-nivel" role="group" aria-label="Filtrar por nível">
      <button type="button" className="chip" aria-pressed={valor === 'todos'} onClick={() => onChange('todos')}>
        Todos <span className="contagem">{contagem.total}</span>
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
          <span className="estrela">★</span> Nível {nivel} <span className="contagem">{quantidade}</span>
        </button>
      ))}
      {contagem.semNivel > 0 && (
        <button type="button" className="chip" aria-label={`Sem nível: ${contagem.semNivel}`} aria-pressed={valor === 'sem'} onClick={() => onChange('sem')}>
          Sem nível <span className="contagem">{contagem.semNivel}</span>
        </button>
      )}
    </div>
  );
}
