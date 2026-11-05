export function ResultadoVazio({ busca, onLimpar }: { busca: 'albuns' | 'fotos'; onLimpar: () => void }) {
  return (
    <div className="resultado-vazio">
      <p>{busca === 'fotos' ? 'Nenhuma foto com essas tags' : 'Nenhum álbum com essas tags'}</p>
      <button type="button" className="botao" onClick={onLimpar}>Limpar pesquisa</button>
    </div>
  );
}
