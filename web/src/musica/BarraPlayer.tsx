import { formatarTempo } from '../logica/fila';
import { urlCapaMusica } from '../logica/imagens';
import { usePlayer } from './Player';

const Icone = ({ d }: { d: string }) => (
  <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" fill="currentColor">
    <path d={d} />
  </svg>
);
const PLAY = 'M8 5.5v13a1 1 0 0 0 1.52.85l10.4-6.5a1 1 0 0 0 0-1.7L9.52 4.65A1 1 0 0 0 8 5.5Z';
const PAUSA = 'M7 5h3.5v14H7V5Zm6.5 0H17v14h-3.5V5Z';
const ANTERIOR = 'M6 5h2v14H6V5Zm3.5 7 9.5 7V5l-9.5 7Z';
const PROXIMA = 'M16 5h2v14h-2V5ZM5 19l9.5-7L5 5v14Z';

// Barra fixa no rodapé: aparece quando há uma fila e acompanha o usuário por todas as telas.
export function BarraPlayer() {
  const { atual, fila, indice, tocando, tempo, duracao, volume, erro, alternar, proxima, anterior, buscar, definirVolume, fechar } = usePlayer();
  if (!atual) return null;

  return (
    <section className="barra-player" aria-label="Player de música">
      <div className="player-faixa">
        <div className="player-capa">
          {atual.capaId ? <img src={urlCapaMusica(atual.bibliotecaId, atual.capaId, 300)} alt="" /> : <span aria-hidden="true">♪</span>}
        </div>
        <div className="player-textos">
          <strong title={atual.titulo}>{atual.titulo}</strong>
          <span title={atual.album}>{erro ?? atual.album}</span>
        </div>
      </div>

      <div className="player-centro">
        <div className="player-botoes">
          <button type="button" className="botao-icone" aria-label="Faixa anterior" title="Anterior" onClick={anterior}><Icone d={ANTERIOR} /></button>
          <button type="button" className="botao-icone botao-icone-principal" aria-label={tocando ? 'Pausar' : 'Tocar'} title={tocando ? 'Pausar' : 'Tocar'} onClick={alternar}>
            <Icone d={tocando ? PAUSA : PLAY} />
          </button>
          <button type="button" className="botao-icone" aria-label="Próxima faixa" title="Próxima" disabled={indice + 1 >= fila.length} onClick={proxima}><Icone d={PROXIMA} /></button>
        </div>
        <div className="player-progresso">
          <span>{formatarTempo(tempo)}</span>
          <input
            type="range"
            aria-label="Posição da faixa"
            min={0}
            max={duracao || 0}
            step={1}
            value={Math.min(tempo, duracao || 0)}
            disabled={!duracao}
            onChange={(e) => buscar(Number(e.target.value))}
          />
          <span>{formatarTempo(duracao)}</span>
        </div>
      </div>

      <div className="player-extras">
        <label className="player-volume">
          <span aria-hidden="true">🔊</span>
          <input type="range" aria-label="Volume" min={0} max={1} step={0.05} value={volume} onChange={(e) => definirVolume(Number(e.target.value))} />
        </label>
        <button type="button" className="botao-icone" aria-label="Fechar player" title="Fechar" onClick={fechar}>×</button>
      </div>
    </section>
  );
}
