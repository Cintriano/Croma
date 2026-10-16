import { useEffect, useRef, useState } from 'react';
import type { ModoSlides } from '../logica/slides';

// Botões Aleatório e Slides ▾ (com a escolha entre Sequência e Aleatório).
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
      <button type="button" className="botao botao-principal" disabled={desativado} onClick={onAleatorio}>Aleatório</button>
      <div className="menu-suspenso">
        <button type="button" className="botao botao-principal" disabled={desativado} aria-haspopup="menu" aria-expanded={menu} onClick={() => setMenu((m) => !m)}>
          Slides ▾
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
