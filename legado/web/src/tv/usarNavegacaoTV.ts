import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { acaoDaTecla, MemoriaFoco, proximoFoco, type Acao, type Direcao, type Retangulo } from './navegacao';

// Uma memória para o site todo: ao voltar para uma tela, o foco retorna de onde o usuário saiu.
const memoria = new MemoriaFoco();

// Teclas apertadas durante a troca de tela (antes da nova estar pronta) são aplicadas quando ela fica pronta.
const pendentes: Acao[] = [];

const ATRIBUTO = 'data-foco';

// Na troca de tela, a que sai e a que entra escutam a mesma tecla; ela só pode ser tratada uma vez.
const tratados = new WeakSet<Event>();

// Um painel aberto (ex.: grade de tags) restringe o foco aos elementos dele.
const escopoAtual = (): ParentNode => [...document.querySelectorAll<HTMLElement>('[data-escopo-foco]')].pop() ?? document;

function focaveis(): HTMLElement[] {
  return [...escopoAtual().querySelectorAll<HTMLElement>(`[${ATRIBUTO}]`)].filter((el) => el.offsetParent !== null || el === document.activeElement);
}

export function focarPorId(id: string): boolean {
  const el = document.querySelector<HTMLElement>(`[${ATRIBUTO}="${CSS.escape(id)}"]`);
  if (!el) return false;
  el.focus();
  el.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  return true;
}

interface Opcoes {
  /** Id focado ao abrir a tela, se não houver um guardado na memória. */
  focoInicial: string;
  /** Quando a tela está pronta para receber o foco (dados carregados). */
  pronto: boolean;
  /** Ação do Voltar; por padrão, volta no histórico. */
  aoVoltar?: () => void;
}

// Setas movem o foco entre os elementos com data-foco; OK aciona; Voltar sobe um nível.
// Com um diálogo aberto (visualizador, slides), as teclas ficam com ele.
export function useNavegacaoTV({ focoInicial, pronto, aoVoltar }: Opcoes) {
  const { pathname } = useLocation();
  const voltar = useRef(aoVoltar);
  voltar.current = aoVoltar;
  const estaPronta = useRef(pronto);
  estaPronta.current = pronto;

  useEffect(() => {
    if (!pronto) return;
    const guardado = memoria.recuperar(pathname);
    if (!(guardado && focarPorId(guardado))) focarPorId(focoInicial);
    while (pendentes.length) executar(pendentes.shift()!, true);
  }, [pronto, pathname, focoInicial]);

  useEffect(() => {
    const aoFocar = (e: FocusEvent) => {
      const id = (e.target as HTMLElement | null)?.getAttribute?.(ATRIBUTO);
      if (id && !(e.target as HTMLElement).closest('[data-escopo-foco]')) memoria.lembrar(pathname, id);
    };
    const aoTeclar = (e: KeyboardEvent) => {
      if (tratados.has(e) || document.querySelector('[role="dialog"]')) return;
      const acao = acaoDaTecla(e);
      if (!acao || acao === 'playPause') return;
      tratados.add(e);
      // A URL já mudou mas esta tela ainda não saiu, ou a tela carrega sem nada em foco: guarda para depois.
      const semFoco = !(document.activeElement as HTMLElement | null)?.hasAttribute(ATRIBUTO);
      if (window.location.pathname !== pathname || (!estaPronta.current && semFoco)) {
        if (acao !== 'voltar') {
          e.preventDefault();
          pendentes.push(acao);
        }
        return;
      }
      if (executarAcao(acao, false, voltar.current)) e.preventDefault();
    };
    document.addEventListener('focusin', aoFocar);
    window.addEventListener('keydown', aoTeclar);
    return () => {
      document.removeEventListener('focusin', aoFocar);
      window.removeEventListener('keydown', aoTeclar);
    };
  }, [pathname]);
}

// Aplica uma ação; devolve true quando ela foi tratada aqui (para impedir o comportamento padrão da tecla).
function executarAcao(acao: Acao, repetida: boolean, aoVoltar?: () => void): boolean {
  const atual = document.activeElement as HTMLElement | null;
  if (acao === 'voltar') {
    if (aoVoltar) aoVoltar();
    else window.history.back();
    return true;
  }
  // Painel recém-aberto com o foco ainda fora dele: a tecla vai para o primeiro elemento do painel.
  const escopo = escopoAtual();
  if (acao !== 'playPause' && escopo !== document && !(atual && (escopo as HTMLElement).contains(atual))) {
    const primeiro = focaveis()[0];
    if (!primeiro) return true;
    primeiro.focus();
    if (acao === 'ok') primeiro.click();
    return true;
  }
  if (acao === 'ok') {
    // Botões e links já respondem ao Enter sozinhos; os demais (ex.: células da grade) são acionados aqui.
    // Uma tecla guardada da troca de tela não teve esse efeito, então aciona qualquer elemento.
    if (atual && atual.hasAttribute(ATRIBUTO) && (repetida || !atual.matches('a, button'))) {
      atual.click();
      return true;
    }
    return false;
  }
  if (acao === 'playPause') return false;

  const elementos = focaveis();
  const idAtual = atual?.getAttribute(ATRIBUTO);
  if (!idAtual || !elementos.includes(atual!)) {
    elementos[0]?.focus();
    return true;
  }
  const retangulos: Retangulo[] = elementos.map((el) => {
    const r = el.getBoundingClientRect();
    return { id: el.getAttribute(ATRIBUTO)!, x: r.left + window.scrollX, y: r.top + window.scrollY, largura: r.width, altura: r.height };
  });
  const proximo = proximoFoco(idAtual, acao as Direcao, retangulos);
  if (proximo) focarPorId(proximo);
  return true;
}

function executar(acao: Acao, repetida: boolean) {
  executarAcao(acao, repetida);
}
