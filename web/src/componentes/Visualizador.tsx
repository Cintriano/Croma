import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { formatarData } from '../logica/fotos';
import { urlImagem } from '../logica/imagens';
import type { FotoUI, Plataforma } from '../tipos';
import { SeloNivel } from './SeloNivel';

const TEMPO_CONTROLES_MS = 3000;

interface Props {
  fotos: FotoUI[];
  indiceInicial: number;
  onFechar: () => void;
  onMudarFoto?: (foto: FotoUI) => void;
  onIniciarSlides?: (indice: number) => void;
  /** Botão de sorteio dentro do visualizador (Aleatório). */
  onSortear?: () => void;
  plataforma?: Plataforma;
  /** Conteúdo extra do painel ⓘ (ex.: tags da foto). */
  informacoesExtras?: (foto: FotoUI) => ReactNode;
}

// Foto expandida em tela cheia. As setas param na primeira e na última foto (não dão a volta).
export function Visualizador({ fotos, indiceInicial, onFechar, onMudarFoto, onIniciarSlides, onSortear, plataforma = 'desktop', informacoesExtras }: Props) {
  const [indice, setIndice] = useState(() => limitar(indiceInicial, fotos.length));
  const [painel, setPainel] = useState(false);
  const [zoom, setZoom] = useState(false);
  const [controlesVisiveis, setControlesVisiveis] = useState(true);
  const relogio = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toque = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => setIndice(limitar(indiceInicial, fotos.length)), [indiceInicial, fotos.length]);

  const foto = fotos[indice];

  const irPara = useCallback(
    (novo: number) => {
      if (novo < 0 || novo >= fotos.length || novo === indice) return;
      setIndice(novo);
      setZoom(false);
      onMudarFoto?.(fotos[novo]);
    },
    [fotos, indice, onMudarFoto],
  );

  const mostrarControles = useCallback(() => {
    setControlesVisiveis(true);
    if (relogio.current) clearTimeout(relogio.current);
    relogio.current = setTimeout(() => setControlesVisiveis(false), TEMPO_CONTROLES_MS);
  }, []);

  useEffect(() => {
    mostrarControles();
    return () => {
      if (relogio.current) clearTimeout(relogio.current);
    };
  }, [mostrarControles]);

  useEffect(() => {
    const aoTeclar = (e: KeyboardEvent) => {
      mostrarControles();
      if (e.key === 'ArrowRight') irPara(indice + 1);
      else if (e.key === 'ArrowLeft') irPara(indice - 1);
      else if (e.key === 'Escape') onFechar();
      else return;
      e.preventDefault();
    };
    window.addEventListener('keydown', aoTeclar);
    return () => window.removeEventListener('keydown', aoTeclar);
  }, [indice, irPara, onFechar, mostrarControles]);

  if (!foto) return null;
  const anterior = fotos[indice - 1];
  const proxima = fotos[indice + 1];
  const legenda = [foto.nome, formatarData(foto.dataCaptura), foto.camera].filter(Boolean).join(' · ');

  return (
    <div
      className="visualizador"
      role="dialog"
      aria-modal="true"
      aria-label={foto.nome}
      data-controles={controlesVisiveis ? 'visiveis' : 'ocultos'}
      onMouseMove={mostrarControles}
      onTouchStart={(e) => {
        mostrarControles();
        toque.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }}
      onTouchEnd={(e) => {
        const inicio = toque.current;
        toque.current = null;
        if (!inicio) return;
        const dx = e.changedTouches[0].clientX - inicio.x;
        const dy = e.changedTouches[0].clientY - inicio.y;
        if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) irPara(indice + (dx < 0 ? 1 : -1));
        else if (dy > 80 && Math.abs(dy) > Math.abs(dx)) onFechar();
      }}
    >
      <div
        className="visualizador-fundo"
        data-testid="visualizador-fundo"
        onClick={(e) => {
          if (e.target === e.currentTarget) onFechar();
        }}
      >
        <img
          key={foto.id}
          className={`visualizador-imagem${zoom ? ' com-zoom' : ''}`}
          src={zoom ? urlImagem(foto.id) : urlImagem(foto.id, 1200)}
          alt={foto.nome}
          onDoubleClick={() => plataforma !== 'tv' && setZoom((z) => !z)}
        />
      </div>

      {anterior && <img data-preload src={urlImagem(anterior.id, 1200)} alt="" hidden />}
      {proxima && <img data-preload src={urlImagem(proxima.id, 1200)} alt="" hidden />}

      <div className="visualizador-topo controles">
        <span className="contador">{indice + 1} / {fotos.length}</span>
        <div className="acoes">
          <SeloNivel nivel={foto.nivel} />
          <button type="button" className="botao-icone" aria-label="Fechar" onClick={onFechar}>×</button>
        </div>
      </div>

      <button type="button" className="visualizador-seta esquerda controles" aria-label="Foto anterior" disabled={!anterior} onClick={() => irPara(indice - 1)}>‹</button>
      <button type="button" className="visualizador-seta direita controles" aria-label="Próxima foto" disabled={!proxima} onClick={() => irPara(indice + 1)}>›</button>

      <div className="visualizador-rodape controles">
        <span className="legenda">{legenda}</span>
        <div className="acoes">
          {plataforma !== 'tv' && (
            <button type="button" className="botao-icone" aria-label={zoom ? 'Sair do zoom' : 'Zoom'} aria-pressed={zoom} onClick={() => setZoom((z) => !z)}>⤢</button>
          )}
          {onSortear && <button type="button" className="botao-icone" aria-label="Sortear outra foto" onClick={onSortear}>⚄</button>}
          <button type="button" className="botao-icone" aria-label="Informações" aria-expanded={painel} onClick={() => setPainel((p) => !p)}>ⓘ</button>
          <button type="button" className="botao-icone" aria-label="Iniciar slides" onClick={() => onIniciarSlides?.(indice)}>▶</button>
        </div>
      </div>

      {painel && (
        <section className="visualizador-painel" role="region" aria-label="Informações da foto">
          <h2>{foto.nome}</h2>
          <dl>
            <dt>Arquivo</dt>
            <dd>{foto.caminhoRelativo}</dd>
            <dt>Data de captura</dt>
            <dd>{formatarData(foto.dataCaptura) ?? '—'}</dd>
            <dt>Câmera</dt>
            <dd>{foto.camera ?? '—'}</dd>
            <dt>Nível</dt>
            <dd>{foto.nivel ?? 'sem nível'}</dd>
            {foto.albumTitulo && (
              <>
                <dt>Álbum</dt>
                <dd>{foto.albumTitulo}</dd>
              </>
            )}
          </dl>
          {informacoesExtras?.(foto)}
        </section>
      )}
    </div>
  );
}

const limitar = (indice: number, total: number) => Math.min(Math.max(0, indice), Math.max(0, total - 1));
