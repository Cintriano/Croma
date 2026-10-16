import type { ReactNode } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { caminhoConfiguracoes, caminhoInicio } from '../logica/rotas';
import { usePlataforma } from '../plataforma';

// Barra lateral no desktop e barra inferior no mobile. Também faz a navegação interna dos <a> comuns
// (cards e outros componentes que não dependem do roteador), sem recarregar a página.
export function Layout({ children }: { children: ReactNode }) {
  const navegar = useNavigate();
  const plataforma = usePlataforma();

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
      <nav className="navegacao" aria-label="Principal">
        <span className="marca" aria-hidden="true">Croma</span>
        {itens.map((item) => (
          <NavLink key={item.para} to={item.para} end={item.para === '/'} className="item-navegacao">
            <span className="icone" aria-hidden="true">{item.icone}</span>
            <span>{item.rotulo}</span>
          </NavLink>
        ))}
      </nav>
      <main className="conteudo">{children}</main>
    </div>
  );
}
