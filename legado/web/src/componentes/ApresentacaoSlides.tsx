import { useEffect, useRef, useState } from 'react';
import { urlImagem } from '../logica/imagens';
import { Apresentacao, type ModoSlides } from '../logica/slides';
import type { FotoUI } from '../tipos';
import { SeloNivel } from './SeloNivel';

interface Props {
  fotos: FotoUI[];
  modo: ModoSlides;
  inicio?: number;
  intervaloMs?: number;
  onFechar: () => void;
}

// Slides em tela cheia: ← → avançam ou voltam, Espaço/OK pausa, Esc fecha.
export function ApresentacaoSlides({ fotos, modo, inicio, intervaloMs = 5000, onFechar }: Props) {
  const apresentacao = useRef<Apresentacao | null>(null);
  const [atual, setAtual] = useState<number | null>(null);
  const [pausada, setPausada] = useState(false);

  useEffect(() => {
    const a = new Apresentacao({ total: fotos.length, modo, inicio, intervaloMs, aoTrocar: setAtual });
    apresentacao.current = a;
    setAtual(a.atual);
    a.iniciar();
    document.documentElement.requestFullscreen?.().catch(() => {});
    return () => {
      a.parar();
      if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
    };
  }, [fotos, modo, inicio, intervaloMs]);

  useEffect(() => {
    const aoTeclar = (e: KeyboardEvent) => {
      const a = apresentacao.current;
      if (!a) return;
      if (e.key === 'Escape') onFechar();
      else if (e.key === 'ArrowRight') trocar(a.proxima());
      else if (e.key === 'ArrowLeft') trocar(a.anterior());
      else if (e.key === ' ' || e.key === 'Enter') alternarPausa();
      else return;
      e.preventDefault();
    };
    window.addEventListener('keydown', aoTeclar);
    return () => window.removeEventListener('keydown', aoTeclar);
  });

  const trocar = (indice: number | null) => {
    if (indice === null) return;
    setAtual(indice);
    if (!pausada) apresentacao.current?.iniciar(); // reinicia a contagem do intervalo
  };

  const alternarPausa = () => {
    const a = apresentacao.current;
    if (!a) return;
    if (pausada) a.continuar();
    else a.pausar();
    setPausada(!pausada);
  };

  const foto = atual !== null ? fotos[atual] : undefined;
  const proxima = atual !== null ? fotos[atual + 1] : undefined;

  return (
    <div className="apresentacao" role="dialog" aria-modal="true" aria-label="Apresentação de slides">
      {foto && <img key={foto.id} className="apresentacao-imagem" src={urlImagem(foto.id, 1200)} alt={foto.nome} />}
      {proxima && <img data-preload src={urlImagem(proxima.id, 1200)} alt="" hidden />}
      <div className="apresentacao-controles">
        {foto && <SeloNivel nivel={foto.nivel} />}
        <span className="contador">{atual !== null ? `${atual + 1} / ${fotos.length}` : ''}</span>
        <button type="button" className="botao-icone" aria-label="Foto anterior" onClick={() => trocar(apresentacao.current?.anterior() ?? null)}>‹</button>
        <button type="button" className="botao-icone" aria-label={pausada ? 'Continuar' : 'Pausar'} onClick={alternarPausa}>{pausada ? '▶' : '❚❚'}</button>
        <button type="button" className="botao-icone" aria-label="Próxima foto" onClick={() => trocar(apresentacao.current?.proxima() ?? null)}>›</button>
        <button type="button" className="botao-icone" aria-label="Fechar apresentação" onClick={onFechar}>×</button>
      </div>
    </div>
  );
}
