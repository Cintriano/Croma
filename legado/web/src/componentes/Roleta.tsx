import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { urlImagem } from '../logica/imagens';
import { anguloFinal, anguloInicial, easeEnter, montarOrbita, poseNaOrbita } from '../logica/roleta';

export interface ItemRoleta {
  chave: number;
  /** Foto usada como imagem da vaga; null mostra um espaço reservado. */
  fotoId: number | null;
  legenda: string;
}

export interface EtapaRoleta {
  rotulo: string;
  itens: ItemRoleta[];
  /** Posição, em `itens`, do que a roleta deve sortear. */
  vencedor: number;
}

/** Token `motion-orbit` (proposta CAPRA): duas voltas do carregamento orbital. */
export const GIRO_MS = 2400;
/** Tempo de leitura do vencedor antes da etapa seguinte. */
export const PAUSA_MS = 900;

const reduzirMovimento = () => {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
};

// Raios da órbita a partir da largura do palco: elipse achatada, como a órbita do carregamento; menos achatada no celular.
const raios = (largura: number) => {
  const estreito = largura < 600;
  const rx = Math.min(largura * (estreito ? 0.38 : 0.36), 340);
  return { rx, ry: rx * (estreito ? 0.45 : 0.3) };
};

interface PropsOrbita {
  etapa: EtapaRoleta;
  /** Muda para true quando o usuário pede para parar já. */
  interromper: boolean;
  aoParar: () => void;
}

function Orbita({ etapa, interromper, aoParar }: PropsOrbita) {
  const { celulas, indiceVencedor } = useMemo(() => montarOrbita(etapa.itens, etapa.vencedor), [etapa]);
  const vagas = celulas.length;
  const passo = (2 * Math.PI) / vagas;
  const duracao = useMemo(() => (reduzirMovimento() ? 0 : GIRO_MS), []);
  const [parou, setParou] = useState(false);
  const palco = useRef<HTMLDivElement>(null);
  const trilha = useRef<HTMLDivElement>(null);
  const cartoes = useRef<(HTMLDivElement | null)[]>([]);
  const angulo = useRef(duracao ? anguloInicial(indiceVencedor, vagas) : anguloFinal(indiceVencedor, vagas));
  const aoPararRef = useRef(aoParar);
  aoPararRef.current = aoParar;

  // Escreve as poses direto no DOM: o giro roda a cada quadro sem renderizar o React.
  const posicionar = () => {
    const { rx, ry } = raios(palco.current?.clientWidth ?? 0);
    if (trilha.current) {
      trilha.current.style.width = `${rx * 2}px`;
      trilha.current.style.height = `${ry * 2}px`;
    }
    cartoes.current.forEach((el, i) => {
      if (!el) return;
      const p = poseNaOrbita(angulo.current + i * passo, rx, ry);
      el.style.transform = `translate(-50%, -50%) translate(${p.x}px, ${p.y}px) scale(${p.escala})`;
      el.style.zIndex = String(Math.round(p.profundidade * 100));
      el.style.setProperty('--profundidade', p.opacidade.toFixed(3));
    });
  };

  const terminou = useRef(false);
  const parar = () => {
    if (terminou.current) return;
    terminou.current = true;
    angulo.current = anguloFinal(indiceVencedor, vagas);
    posicionar();
    setParou(true);
    aoPararRef.current();
  };
  const pararRef = useRef(parar);
  pararRef.current = parar;

  useLayoutEffect(posicionar);

  useEffect(() => {
    const inicio = anguloInicial(indiceVencedor, vagas);
    const fim = anguloFinal(indiceVencedor, vagas);
    let quadro = 0;
    let comeco: number | null = null;
    const girar = (agora: number) => {
      if (terminou.current) return;
      comeco ??= agora;
      const t = Math.min((agora - comeco) / GIRO_MS, 1);
      angulo.current = inicio + (fim - inicio) * easeEnter(t);
      posicionar();
      if (t < 1) quadro = requestAnimationFrame(girar);
    };
    if (duracao) quadro = requestAnimationFrame(girar);
    // O relógio decide a parada; os quadros só desenham o caminho até ela.
    const relogio = setTimeout(() => pararRef.current(), duracao);
    const aoRedimensionar = () => posicionar();
    window.addEventListener('resize', aoRedimensionar);
    return () => {
      cancelAnimationFrame(quadro);
      clearTimeout(relogio);
      window.removeEventListener('resize', aoRedimensionar);
    };
  }, [duracao, indiceVencedor, vagas]);

  // Nenhuma ação espera a animação: um toque ou tecla durante o giro leva direto ao resultado.
  useEffect(() => {
    if (interromper) pararRef.current();
  }, [interromper]);

  return (
    <div ref={palco} className="orbita" data-parou={parou ? 'true' : undefined}>
      <div ref={trilha} className="orbita-trilha" aria-hidden="true" />
      <div className="orbita-nucleo" aria-hidden="true" />
      {celulas.map((item, posicao) => (
        <div
          key={posicao}
          ref={(el) => { cartoes.current[posicao] = el; }}
          className="orbita-cartao"
          data-vencedor={posicao === indiceVencedor ? 'true' : undefined}
        >
          {item.fotoId !== null ? <img src={urlImagem(item.fotoId, 300)} alt="" draggable={false} /> : <span aria-hidden="true">▣</span>}
        </div>
      ))}
    </div>
  );
}

interface Props {
  etapas: EtapaRoleta[];
  /** Chamada depois da última etapa parar (ou ao pular). */
  onConcluir: () => void;
  onFechar: () => void;
}

// Sorteio orbital em etapas (ex.: álbum → foto): cada uma gira em volta do núcleo, para no sorteado, espera e passa à seguinte.
export function Roleta({ etapas: etapasRecebidas, onConcluir, onFechar }: Props) {
  // Cópia fixa: o pai pode recriar a lista a cada render sem reembaralhar a órbita em pleno giro.
  const [etapas] = useState(etapasRecebidas);
  const [indice, setIndice] = useState(0);
  const [parada, setParada] = useState(false);
  const [interromper, setInterromper] = useState(false);
  const etapa = etapas[indice];
  const concluirRef = useRef(onConcluir);
  concluirRef.current = onConcluir;
  const fecharRef = useRef(onFechar);
  fecharRef.current = onFechar;

  const avancar = () => {
    if (indice < etapas.length - 1) {
      setIndice(indice + 1);
      setParada(false);
      setInterromper(false);
    } else {
      concluirRef.current();
    }
  };
  const avancarRef = useRef(avancar);
  avancarRef.current = avancar;

  useEffect(() => {
    if (!parada) return;
    const relogio = setTimeout(() => avancarRef.current(), PAUSA_MS);
    return () => clearTimeout(relogio);
  }, [parada, indice]);

  // Toque no palco: girando, para já; parado, segue sem esperar a pausa.
  const apressar = () => (parada ? avancarRef.current() : setInterromper(true));
  const apressarRef = useRef(apressar);
  apressarRef.current = apressar;

  useEffect(() => {
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        fecharRef.current();
      } else if ((e.key === 'Enter' || e.key === ' ') && !(e.target instanceof HTMLButtonElement)) {
        e.preventDefault();
        apressarRef.current();
      }
    };
    window.addEventListener('keydown', aoTeclar);
    return () => window.removeEventListener('keydown', aoTeclar);
  }, []);

  return (
    <div className="roleta" role="dialog" aria-modal="true" aria-label="Sorteio aleatório">
      <div className="roleta-topo">
        <button type="button" className="botao" onClick={() => concluirRef.current()}>Pular</button>
        <button type="button" className="botao-icone" aria-label="Fechar" autoFocus onClick={onFechar}>×</button>
      </div>
      <p className="roleta-rotulo" aria-live="polite">{etapa.rotulo}</p>
      <div className="roleta-palco" key={indice} onClick={() => apressar()}>
        <Orbita etapa={etapa} interromper={interromper} aoParar={() => setParada(true)} />
      </div>
      <p className="roleta-legenda" data-visivel={parada ? 'true' : undefined} aria-live="polite">
        {parada ? etapa.itens[etapa.vencedor].legenda : ' '}
      </p>
    </div>
  );
}
