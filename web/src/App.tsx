import { Route, Routes, useLocation } from 'react-router-dom';
import { Layout } from './componentes/Layout';
import { ContextoPlataforma, usePlataformaDetectada } from './plataforma';
import { PaginaAlbum } from './paginas/PaginaAlbum';
import { PaginaBiblioteca } from './paginas/PaginaBiblioteca';
import { PaginaConfiguracoes } from './paginas/PaginaConfiguracoes';
import { PaginaInicio } from './paginas/PaginaInicio';
import { PaginaMusicas } from './paginas/PaginaMusicas';

export function App() {
  const plataforma = usePlataformaDetectada(useLocation().pathname);
  return (
    <ContextoPlataforma.Provider value={plataforma}>
      <Layout>
        <Routes>
          <Route path="/" element={<PaginaInicio />} />
          <Route path="/biblioteca/:id" element={<PaginaBiblioteca />} />
          <Route path="/album/:id/:slug?" element={<PaginaAlbum />} />
          <Route path="/album/:id/:slug/foto/:fotoId" element={<PaginaAlbum />} />
          <Route path="/musicas" element={<PaginaMusicas />} />
          <Route path="/configuracoes/*" element={<PaginaConfiguracoes />} />
          <Route path="*" element={<p className="pagina-vazia">Página não encontrada.</p>} />
        </Routes>
      </Layout>
    </ContextoPlataforma.Provider>
  );
}
