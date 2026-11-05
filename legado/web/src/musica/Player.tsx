import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { indiceAnterior, LIMITE_REINICIAR_S, proximoIndice, type FaixaFila } from '../logica/fila';
import { urlCapaMusica, urlFaixa } from '../logica/imagens';

interface EstadoPlayer {
  fila: FaixaFila[];
  indice: number;
  atual: FaixaFila | null;
  tocando: boolean;
  tempo: number;
  duracao: number;
  volume: number;
  erro: string | null;
  tocar: (fila: FaixaFila[], indice: number) => void;
  alternar: () => void;
  proxima: () => void;
  anterior: () => void;
  buscar: (segundos: number) => void;
  definirVolume: (volume: number) => void;
  fechar: () => void;
}

const Contexto = createContext<EstadoPlayer | null>(null);

export const usePlayer = () => {
  const contexto = useContext(Contexto);
  if (!contexto) throw new Error('usePlayer fora do PlayerProvider');
  return contexto;
};

const CHAVE_VOLUME = 'croma-volume';

function lerVolume(): number {
  try {
    const valor = Number(localStorage.getItem(CHAVE_VOLUME));
    return Number.isFinite(valor) && valor > 0 && valor <= 1 ? valor : 1;
  } catch {
    return 1;
  }
}

// O <audio> mora aqui, acima das rotas: a música continua tocando quando a tela muda.
export function PlayerProvider({ children }: { children: ReactNode }) {
  const audio = useRef<HTMLAudioElement>(null);
  const [fila, setFila] = useState<FaixaFila[]>([]);
  const [indice, setIndice] = useState(0);
  const [tocando, setTocando] = useState(false);
  const [tempo, setTempo] = useState(0);
  const [duracao, setDuracao] = useState(0);
  const [volume, setVolume] = useState(lerVolume);
  const [erro, setErro] = useState<string | null>(null);

  const atual = fila[indice] ?? null;

  // Troca a faixa quando a fila ou o índice mudam; o play vem de um clique do usuário, então o navegador permite.
  useEffect(() => {
    const el = audio.current;
    if (!el || !atual) return;
    setErro(null);
    setTempo(0);
    setDuracao(0);
    el.src = urlFaixa(atual.bibliotecaId, atual.id);
    el.play().catch(() => undefined);
  }, [atual?.id, atual?.bibliotecaId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (audio.current) audio.current.volume = volume;
  }, [volume]);

  const tocar = useCallback((nova: FaixaFila[], inicio: number) => {
    // Mesma faixa de novo: o efeito acima não reage, então recomeça na mão.
    if (nova[inicio] && audio.current && nova[inicio].id === audio.current.dataset.id) {
      audio.current.currentTime = 0;
      audio.current.play().catch(() => undefined);
    }
    setFila(nova);
    setIndice(inicio);
  }, []);

  const proxima = useCallback(() => {
    const seguinte = proximoIndice(fila.length, indice);
    if (seguinte !== null) setIndice(seguinte);
    else audio.current?.pause();
  }, [fila.length, indice]);

  const anterior = useCallback(() => {
    const el = audio.current;
    const anteriorIndice = indiceAnterior(indice);
    if (el && (el.currentTime > LIMITE_REINICIAR_S || anteriorIndice === null)) el.currentTime = 0;
    else if (anteriorIndice !== null) setIndice(anteriorIndice);
  }, [indice]);

  const alternar = useCallback(() => {
    const el = audio.current;
    if (!el || !atual) return;
    if (el.paused) el.play().catch(() => undefined);
    else el.pause();
  }, [atual]);

  const buscar = useCallback((segundos: number) => {
    if (audio.current) audio.current.currentTime = segundos;
    setTempo(segundos);
  }, []);

  const definirVolume = useCallback((novo: number) => {
    setVolume(novo);
    try {
      localStorage.setItem(CHAVE_VOLUME, String(novo));
    } catch {
      // Sem armazenamento: o volume vale só até recarregar.
    }
  }, []);

  const fechar = useCallback(() => {
    audio.current?.pause();
    audio.current?.removeAttribute('src');
    setFila([]);
    setIndice(0);
    setTocando(false);
  }, []);

  // Botões de mídia do sistema (teclado, fone, tela de bloqueio).
  useEffect(() => {
    if (!('mediaSession' in navigator) || !atual) return;
    navigator.mediaSession.metadata = new MediaMetadata({
      title: atual.titulo,
      album: atual.album,
      artwork: atual.capaId ? [{ src: urlCapaMusica(atual.bibliotecaId, atual.capaId, 600), sizes: '600x600', type: 'image/jpeg' }] : [],
    });
    navigator.mediaSession.setActionHandler('play', alternar);
    navigator.mediaSession.setActionHandler('pause', alternar);
    navigator.mediaSession.setActionHandler('nexttrack', proxima);
    navigator.mediaSession.setActionHandler('previoustrack', anterior);
  }, [atual, alternar, proxima, anterior]);

  const valor = useMemo<EstadoPlayer>(
    () => ({ fila, indice, atual, tocando, tempo, duracao, volume, erro, tocar, alternar, proxima, anterior, buscar, definirVolume, fechar }),
    [fila, indice, atual, tocando, tempo, duracao, volume, erro, tocar, alternar, proxima, anterior, buscar, definirVolume, fechar],
  );

  return (
    <Contexto.Provider value={valor}>
      {children}
      <audio
        ref={audio}
        data-id={atual?.id}
        preload="metadata"
        onPlay={() => setTocando(true)}
        onPause={() => setTocando(false)}
        onTimeUpdate={(e) => setTempo(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => setDuracao(e.currentTarget.duration)}
        onEnded={proxima}
        onError={() => setErro('Não foi possível tocar esta faixa.')}
      />
    </Contexto.Provider>
  );
}
