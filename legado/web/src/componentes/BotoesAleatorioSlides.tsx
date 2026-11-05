import { useEffect, useRef, useState } from 'react';
import type { ModoSlides } from '../logica/slides';

const IconeDado = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round">
    <rect x="3.5" y="3.5" width="17" height="17" rx="4" />
    <g fill="currentColor" stroke="none">
      <circle cx="8.5" cy="8.5" r="1.4" />
      <circle cx="15.5" cy="8.5" r="1.4" />
      <circle cx="12" cy="12" r="1.4" />
      <circle cx="8.5" cy="15.5" r="1.4" />
      <circle cx="15.5" cy="15.5" r="1.4" />
    </g>
  </svg>
);

const IconeSlides = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" fill="currentColor">
    <path d="M8 5.5v13a1 1 0 0 0 1.52.85l10.4-6.5a1 1 0 0 0 0-1.7L9.52 4.65A1 1 0 0 0 8 5.5Z" />
  </svg>
);

// Botões Aleatório (dado) e Slides (play, abre o menu com Sequência e Aleatório).
export function BotoesAleatorioSlides({ desativado, onAleatorio, onSlides }: { desativado?: boolean; onAleatorio: () => void; onSlides: (modo: ModoSlides) => void }) {
  const [menu, setMenu] = useState(false);
  const raiz = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menu) return;
    const fora = (e: MouseEvent) => !raiz.current?.contains(e.target as Node) && setMenu(false);
    document.addEventListener('mousedown', fora);
    return () => document.removeEventListener('mousedown', fora);
  }, [menu]);

  const escolher = (modo: ModoSlides) => {
    setMenu(false);
    onSlides(modo);
  };

  return (
    <div className="botoes-acao" ref={raiz}>
      <button type="button" className="botao-icone botao-icone-principal" aria-label="Aleatório" title="Aleatório" disabled={desativado} onClick={onAleatorio}>
        <IconeDado />
      </button>
      <div className="menu-suspenso">
        <button type="button" className="botao-icone botao-icone-principal" aria-label="Slides" title="Slides" disabled={desativado} aria-haspopup="menu" aria-expanded={menu} onClick={() => setMenu((m) => !m)}>
          <IconeSlides />
        </button>
        {menu && (
          <div role="menu" className="menu">
            <button type="button" role="menuitem" onClick={() => escolher('sequencia')}>Sequência</button>
            <button type="button" role="menuitem" onClick={() => escolher('aleatorio')}>Aleatório</button>
          </div>
        )}
      </div>
    </div>
  );
}
