import type { Contagem, Nivel } from '../tipos';

const plural = (n: number) => (n === 1 ? '1 foto' : `${n} fotos`);

// Linha "★1 40 · ★2 60 · ★3 28" do cabeçalho do álbum; cada nível aplica o filtro da grade.
export function ContagemNiveis({ contagem, onSelecionarNivel }: { contagem: Contagem; onSelecionarNivel: (nivel: Nivel | 'sem') => void }) {
  const niveis: [Nivel, number][] = [
    [1, contagem.nivel1],
    [2, contagem.nivel2],
    [3, contagem.nivel3],
  ];
  return (
    <div className="contagem-niveis">
      {niveis.map(([nivel, quantidade]) => (
        <button
          key={nivel}
          type="button"
          className="botao-texto"
          aria-label={`Nível ${nivel}: ${plural(quantidade)}`}
          onClick={() => onSelecionarNivel(nivel)}
        >
          <span className="estrela">★</span>{nivel} <span className="contagem">{quantidade}</span>
        </button>
      ))}
      {contagem.semNivel > 0 && (
        <button type="button" className="botao-texto" onClick={() => onSelecionarNivel('sem')}>
          sem nível <span className="contagem">{contagem.semNivel}</span>
        </button>
      )}
    </div>
  );
}
