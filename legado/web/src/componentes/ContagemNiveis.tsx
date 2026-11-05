import type { FiltroDeNivel } from '../logica/fotos';
import type { Contagem, Nivel } from '../tipos';

const plural = (n: number) => (n === 1 ? '1 foto' : `${n} fotos`);

// Blocos "Nível 1 · 40 fotos" do cabeçalho do álbum, com a fatia de cada nível no total.
// Cada bloco aplica o filtro da grade; clicar no nível já filtrado volta para Todos.
export function ContagemNiveis({ contagem, ativo = 'todos', onSelecionarNivel }: { contagem: Contagem; ativo?: FiltroDeNivel; onSelecionarNivel: (nivel: FiltroDeNivel) => void }) {
  const blocos: { chave: Nivel | 'sem'; rotulo: string; quantidade: number }[] = [
    { chave: 1, rotulo: 'Nível 1', quantidade: contagem.nivel1 },
    { chave: 2, rotulo: 'Nível 2', quantidade: contagem.nivel2 },
    { chave: 3, rotulo: 'Nível 3', quantidade: contagem.nivel3 },
  ];
  if (contagem.semNivel > 0) blocos.push({ chave: 'sem', rotulo: 'Sem nível', quantidade: contagem.semNivel });

  return (
    <div className="contagem-niveis" role="group" aria-label="Fotos por nível">
      {blocos.map(({ chave, rotulo, quantidade }) => {
        const fatia = contagem.total ? Math.round((quantidade / contagem.total) * 100) : 0;
        const selecionado = ativo === chave;
        return (
          <button
            key={chave}
            type="button"
            className="nivel-bloco"
            aria-label={`${rotulo}: ${plural(quantidade)}`}
            aria-pressed={selecionado}
            disabled={quantidade === 0}
            onClick={() => onSelecionarNivel(selecionado ? 'todos' : chave)}
          >
            <span className="nivel-rotulo">
              {chave !== 'sem' && <span className="estrela" aria-hidden="true">★</span>}
              {rotulo}
            </span>
            <span className="nivel-quantidade">
              <strong>{quantidade}</strong> {quantidade === 1 ? 'foto' : 'fotos'}
            </span>
            <span className="nivel-fatia" aria-hidden="true">
              <span style={{ width: `${fatia}%` }} />
            </span>
          </button>
        );
      })}
    </div>
  );
}
