import type { ReactNode } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { caminhoConfiguracoes, caminhoInicio } from '../logica/rotas';
import { usePlataforma } from '../plataforma';

// Barra no topo (desktop e mobile) com voltar, nome do site, Início e Configurações. Também faz a navegação interna dos <a> comuns
// (cards e outros componentes que não dependem do roteador), sem recarregar a página.
export function Layout({ children }: { children: ReactNode }) {
  const navegar = useNavigate();
  const plataforma = usePlataforma();
  const { pathname } = useLocation();
  // O roteador guarda em history.state.idx quantas entradas do próprio site há antes desta.
  const temAnterior = ((window.history.state as { idx?: number } | null)?.idx ?? 0) > 0;
  const voltar = () => (temAnterior ? navegar(-1) : navegar(caminhoInicio()));

  const aoClicar = (e: React.MouseEvent) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const link = (e.target as HTMLElement).closest('a');
    if (!link || link.target || link.hasAttribute('download')) return;
    const url = new URL(link.href, window.location.href);
    if (url.origin !== window.location.origin || url.pathname.startsWith('/api/')) return;
    e.preventDefault();
    navegar(url.pathname + url.search);
  };

  const itens = [
    { para: caminhoInicio(), rotulo: 'Início', icone: '⌂' },
    ...(plataforma === 'desktop' ? [{ para: caminhoConfiguracoes(), rotulo: 'Configurações', icone: '⚙' }] : []),
  ];

  return (
    <div className={`layout plataforma-${plataforma}`} onClick={aoClicar}>
      <header className="barra-topo">
        <button type="button" className="item-navegacao" aria-label="Voltar" title="Voltar" disabled={!temAnterior && pathname === caminhoInicio()} onClick={voltar}>
          <span className="icone" aria-hidden="true">←</span>
        </button>
        <NavLink to={caminhoInicio()} className="marca" aria-label="Croma, página inicial">
          <img src="/marca/croma-marca.svg" alt="" width={27} height={27} />
          <span>Croma</span>
        </NavLink>
        <nav className="navegacao" aria-label="Navegação principal">
          {itens.map((item) => (
            <NavLink key={item.para} to={item.para} end={item.para === '/'} className="item-navegacao" aria-label={item.rotulo} title={item.rotulo}>
              <span className="icone" aria-hidden="true">{item.icone}</span>
            </NavLink>
          ))}
        </nav>
      </header>
      <main className="conteudo">{children}</main>
      {/* Assinatura com endosso: marca + nome, fio, "por" e o logotipo CAPRA (arquivo, nunca texto). */}
      <footer className="rodape">
        <span className="marca">
          <img src="/marca/croma-marca.svg" alt="" width={27} height={27} />
          <span>Croma</span>
        </span>
        <span className="rodape-fio" aria-hidden="true" />
        <span className="rodape-endosso">
          por <img src="/marca/capra-logotipo.svg" alt="CAPRA" width={52} height={7} />
        </span>
      </footer>
    </div>
  );
}
