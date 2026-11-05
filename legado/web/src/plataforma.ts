import { createContext, useContext, useEffect, useState } from 'react';
import type { Plataforma } from './tipos';

export type ModoGrade = 'poster' | 'miniatura';

const LARGURA_MOBILE = 768;

// TV = navegador Tizen ou endereço /tv; abaixo de 768 px é mobile; o resto é desktop (inclusive monitores grandes).
export function detectarPlataforma({ largura, userAgent, caminho }: { largura: number; userAgent: string; caminho: string }): Plataforma {
  if (/tizen/i.test(userAgent) || caminho === '/tv' || caminho.startsWith('/tv/')) return 'tv';
  if (largura < LARGURA_MOBILE) return 'mobile';
  return 'desktop';
}

// Colunas da grade (tabela "Layout responsivo" da documentação).
export function colunasDaGrade(plataforma: Plataforma, modo: ModoGrade, largura: number): number {
  if (plataforma === 'mobile') return modo === 'poster' ? 3 : 2;
  if (plataforma === 'tv') return modo === 'poster' ? 6 : 4;
  const fracao = Math.min(1, Math.max(0, (largura - LARGURA_MOBILE) / (1920 - 1 - LARGURA_MOBILE)));
  return modo === 'poster' ? Math.round(5 + fracao * 3) : Math.round(3 + fracao * 2);
}

export const ContextoPlataforma = createContext<Plataforma>('desktop');
export const usePlataforma = () => useContext(ContextoPlataforma);

export function usePlataformaDetectada(caminho: string): Plataforma {
  const medir = () =>
    detectarPlataforma({ largura: window.innerWidth, userAgent: navigator.userAgent, caminho });
  const [plataforma, setPlataforma] = useState(medir);
  useEffect(() => {
    setPlataforma(medir());
    const aoRedimensionar = () => setPlataforma(medir());
    window.addEventListener('resize', aoRedimensionar);
    return () => window.removeEventListener('resize', aoRedimensionar);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caminho]);
  return plataforma;
}
