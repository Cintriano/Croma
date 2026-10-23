import { useEffect, useMemo, useRef, useState } from 'react';
import { urlImagem } from '../logica/imagens';
import { montarFaixa } from '../logica/roleta';

export interface ItemRoleta {
  chave: number;
  /** Foto usada como imagem da célula; null mostra um espaço reservado. */
  fotoId: number | null;
  legenda: string;
}

export interface EtapaRoleta {
  rotulo: string;
  itens: ItemRoleta[];
  /** Posição, em `itens`, do que a roleta deve sortear. */
  vencedor: number;
}

const CELULA = 140;
const FOLGA = 12;
const PASSO = CELULA + FOLGA;
const DURACAO_MS = 4200;
const PAUSA_MS = 1100;

const reduzirMovimento = () => {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
};

function Faixa({ etapa, aoParar }: { etapa: EtapaRoleta; aoParar: () => void }) {
  const { celulas, indiceVencedor } = useMemo(() => montarFaixa(etapa.itens, etapa.vencedor), [etapa]);
  const [girando, setGirando] = useState(false);
  const [parou, setParou] = useState(false);
  const faixa = useRef<HTMLDivElement>(null);
  const duracao = useMemo(() => (reduzirMovimento() ? 0 : DURACAO_MS), []);
  const aoPararRef = useRef(aoParar);
  aoPararRef.current = aoParar;

  useEffect(() => {
    faixa.current?.getBoundingClientRect(); // fixa a posição inicial antes de ligar a transição
    setGirando(true);
    const relogio = setTimeout(() => {
      setParou(true);
      aoPararRef.current();
    }, duracao + 60);
    return () => clearTimeout(relogio);
  }, [duracao]);

  const deslocamento = -(indiceVencedor * PASSO + CELULA / 2);
  return (
    <div className="roleta-janela">
      <div
        ref={faixa}
        className="roleta-faixa"
        style={{ transform: `translateX(${girando ? deslocamento : 0}px)`, transitionDuration: `${duracao}ms` }}
      >
        {celulas.map((item, posicao) => (
          <div
            key={posicao}
            className="roleta-celula"
            style={{ width: CELULA }}
            data-vencedor={parou && posicao === indiceVencedor ? 'true' : undefined}
          >
            {item.fotoId !== null ? <img src={urlImagem(item.fotoId, 300)} alt="" /> : <span aria-hidden="true">▣</span>}
          </div>
        ))}
      </div>
      <div className="roleta-marcador" aria-hidden="true" />
    </div>
  );
}

interface Props {
  etapas: EtapaRoleta[];
  /** Chamada depois da última etapa parar (ou ao pular). */
  onConcluir: () => void;
  onFechar: () => void;
}

// Roleta em etapas (ex.: álbum → foto): cada uma gira, para no sorteado, espera um pouco e passa à seguinte.
export function Roleta({ etapas: etapasRecebidas, onConcluir, onFechar }: Props) {
  // Cópia fixa: o pai pode recriar a lista a cada render sem reembaralhar a faixa em pleno giro.
  const [etapas] = useState(etapasRecebidas);
  const [indice, setIndice] = useState(0);
  const [parada, setParada] = useState(false);
  const etapa = etapas[indice];
  const concluirRef = useRef(onConcluir);
  concluirRef.current = onConcluir;
  const fecharRef = useRef(onFechar);
  fecharRef.current = onFechar;

  useEffect(() => {
    if (!parada) return;
    const relogio = setTimeout(() => {
      if (indice < etapas.length - 1) {
        setIndice(indice + 1);
        setParada(false);
      } else {
        concluirRef.current();
      }
    }, PAUSA_MS);
    return () => clearTimeout(relogio);
  }, [parada, indice, etapas.length]);

  useEffect(() => {
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      e.preventDefault();
      fecharRef.current();
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
      <Faixa key={indice} etapa={etapa} aoParar={() => setParada(true)} />
      <p className="roleta-legenda">{parada ? etapa.itens[etapa.vencedor].legenda : ' '}</p>
    </div>
  );
}
