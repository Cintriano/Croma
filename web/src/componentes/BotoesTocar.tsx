// Botões do álbum de música: tocar em ordem e tocar embaralhado.
export function BotoesTocar({ desativado, onTocar, onAleatorio }: { desativado?: boolean; onTocar: () => void; onAleatorio: () => void }) {
  return (
    <div className="botoes-acao">
      <button type="button" className="botao botao-principal" disabled={desativado} onClick={onTocar}>▶ Tocar</button>
      <button type="button" className="botao" disabled={desativado} onClick={onAleatorio}>⤮ Aleatório</button>
    </div>
  );
}
