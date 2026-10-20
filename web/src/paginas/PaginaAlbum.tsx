import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { api, ErroApi } from '../api';
import { ArtesFoto } from '../componentes/ArtesFoto';
import { ApresentacaoSlides } from '../componentes/ApresentacaoSlides';
import { BotoesAleatorioSlides } from '../componentes/BotoesAleatorioSlides';
import { Carregando } from '../componentes/Carregando';
import { ContagemNiveis } from '../componentes/ContagemNiveis';
import { FiltroNivel } from '../componentes/FiltroNivel';
import { GradeFotos } from '../componentes/GradeFotos';
import { PainelAlbum } from '../componentes/PainelAlbum';
import { PainelTagsFoto } from '../componentes/PainelTagsFoto';
import { Visualizador } from '../componentes/Visualizador';
import { filtrarPorNivel, ORDEM_PADRAO, ordenarFotos, type FiltroDeNivel, type Ordem } from '../logica/fotos';
import { urlImagem } from '../logica/imagens';
import { urlDaPesquisa } from '../logica/pesquisa';
import { caminhoAlbum, caminhoBiblioteca, caminhoFoto } from '../logica/rotas';
import { sortearIndice, type ModoSlides } from '../logica/slides';
import type { CampoArte } from '../componentes/ArtesAlbum';
import { calcularAlteracoesMassa } from '../logica/edicaoMassa';
import { usePlataforma } from '../plataforma';
import type { AlbumUI, FotoUI } from '../tipos';
import { useDados } from '../usarDados';

const CAMPOS_EXIBIDOS = new Set(['titulo', 'tags', 'oculto', 'descricao', 'ano']);

export function PaginaAlbum() {
  const params = useParams();
  const id = Number(params.id);
  const fotoId = params.fotoId ? Number(params.fotoId) : null;
  const navegar = useNavigate();
  const local = useLocation();
  const plataforma = usePlataforma();
  // No desktop um álbum oculto abre com aviso; no mobile e na TV aparece como não encontrado.
  const verOcultos = plataforma === 'desktop';

  const album = useDados(() => api.album(id, verOcultos), [id, verOcultos]);
  const fotos = useDados(() => api.fotosDoAlbum(id, verOcultos), [id, verOcultos]);
  const bibliotecaId = album.dados?.bibliotecaId;
  const tags = useDados(() => (bibliotecaId ? api.tags(bibliotecaId) : Promise.resolve([])), [bibliotecaId]);

  const [filtro, setFiltro] = useState<FiltroDeNivel>('todos');
  const [ordem, setOrdem] = useState<Ordem>(ORDEM_PADRAO);
  const [configurando, setConfigurando] = useState(false);
  const [slides, setSlides] = useState<{ modo: ModoSlides; inicio?: number } | null>(null);

  const todas = fotos.dados ?? [];
  // A grade, o visualizador, o Aleatório e os Slides seguem o filtro e a ordenação ativos.
  const visiveis = useMemo(() => ordenarFotos(filtrarPorNivel(todas, filtro), ordem), [todas, filtro, ordem]);
  const existentes = useMemo(() => (tags.dados ?? []).map((t) => ({ tag: t.tag, usos: t.usos })), [tags.dados]);

  // Fecha a foto voltando no histórico quando ela foi aberta pela grade (Voltar e Esc fazem o mesmo).
  const fecharRef = useRef<() => void>(() => {});
  fecharRef.current = () => {
    if ((window.history.state as { usr?: { doAlbum?: boolean } } | null)?.usr?.doAlbum) navegar(-1);
    else if (album.dados) navegar(caminhoAlbum(album.dados), { replace: true });
  };
  // A troca de tela é adiada pelo roteador: um Esc logo após o clique chega antes do visualizador montar.
  // Se ninguém tratou a tecla e a URL já é de uma foto, fecha por aqui.
  useEffect(() => {
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      setTimeout(() => {
        if (!e.defaultPrevented && /\/foto\/\d+$/.test(window.location.pathname)) fecharRef.current();
      }, 0);
    };
    window.addEventListener('keydown', aoTeclar);
    return () => window.removeEventListener('keydown', aoTeclar);
  }, []);

  if (album.erro) {
    return <p className="pagina-vazia">{album.erro instanceof ErroApi && album.erro.status === 404 ? 'Álbum não encontrado.' : album.erro.message}</p>;
  }
  const a = album.dados;
  if (!a) return <Carregando />;

  // Foto aberta pela URL; se o filtro atual a esconde, o visualizador usa todas as fotos.
  const listaVisualizador = fotoId !== null && !visiveis.some((f) => f.id === fotoId) ? ordenarFotos(todas, ordem) : visiveis;
  const indiceAberto = fotoId !== null ? listaVisualizador.findIndex((f) => f.id === fotoId) : -1;

  const abrirFoto = (foto: FotoUI) => navegar(caminhoFoto(a, foto.id), { state: { doAlbum: true } });
  const fecharFoto = () => fecharRef.current();

  const aleatorio = () => {
    const atual = indiceAberto >= 0 ? indiceAberto : null;
    const indice = sortearIndice(visiveis.length, Math.random, atual);
    if (indice === null) return;
    if (indiceAberto >= 0) navegar(caminhoFoto(a, visiveis[indice].id), { replace: true, state: local.state });
    else abrirFoto(visiveis[indice]);
  };

  const salvarTagsFoto = async (foto: FotoUI, novas: string[]) => {
    const { adicionar, remover } = calcularAlteracoesMassa({ emComum: foto.tags, resultado: novas });
    const r = await api.tagsDeFotos([foto.id], adicionar, remover);
    if (r.falhas.length) return alert(r.falhas[0].mensagem);
    fotos.definir(todas.map((f) => (f.id === foto.id ? { ...f, tags: novas } : f)));
    tags.recarregar();
  };

  const definirArte = async (foto: FotoUI, campo: CampoArte) => {
    try {
      album.definir(await api.editarAlbum(a.id, { artes: { [campo]: foto.id } }));
    } catch (falha) {
      alert((falha as Error).message);
    }
  };

  const colecao = a.colecao ?? {};
  const outrosCampos = Object.entries(colecao).filter(([campo, valor]) => !CAMPOS_EXIBIDOS.has(campo) && ['string', 'number'].includes(typeof valor));
  const total = a.contagem.total;

  return (
    <div className="pagina pagina-album">
      <header className="cabecalho-album">
        {a.capaFotoId && <div className="capa-fundo" style={{ backgroundImage: `url(${urlImagem(a.capaFotoId, 1200)})` }} aria-hidden="true" />}
        <div className="cabecalho-conteudo">
          <div className="poster">
            {(a.posterFotoId ?? a.capaFotoId) ? <img src={urlImagem((a.posterFotoId ?? a.capaFotoId)!, 600)} alt="" /> : <div className="card-sem-imagem">▣</div>}
          </div>
          <div className="informacoes">
            {a.oculto && <p className="aviso-oculto">Este álbum está oculto</p>}
            <h1>{a.titulo}</h1>
            <p className="texto-suave">{[colecao.ano, total === 1 ? '1 foto' : `${total} fotos`].filter(Boolean).join(' · ')}</p>
            <ContagemNiveis contagem={a.contagem} onSelecionarNivel={setFiltro} />
            {a.tags.length > 0 && (
              <ul className="tags-album" aria-label="Tags do álbum">
                {a.tags.map((tag) => (
                  <li key={tag}>
                    <a href={`${caminhoBiblioteca(a.bibliotecaId!)}${urlDaPesquisa({ tags: [tag], modo: 'todas', busca: 'albuns' })}`}>{tag}</a>
                  </li>
                ))}
              </ul>
            )}
            {typeof colecao.descricao === 'string' && colecao.descricao && <p className="descricao">{colecao.descricao}</p>}
            {outrosCampos.length > 0 && (
              <dl className="campos-extra">
                {outrosCampos.map(([campo, valor]) => (
                  <div key={campo}><dt>{campo}</dt><dd>{String(valor)}</dd></div>
                ))}
              </dl>
            )}
            <BotoesAleatorioSlides desativado={visiveis.length === 0} onAleatorio={aleatorio} onSlides={(modo) => setSlides({ modo })} />
          </div>
        </div>
        {plataforma === 'desktop' && (
          <button type="button" className="botao-icone botao-config" aria-label="Configurar álbum" onClick={() => setConfigurando(true)}>⚙</button>
        )}
      </header>

      <div className="barra-ferramentas">
        <FiltroNivel contagem={a.contagem} valor={filtro} onChange={setFiltro} />
        <label className="ordenacao">
          Ordenar
          <select
            value={`${ordem.campo}-${ordem.direcao}`}
            onChange={(e) => {
              const [campo, direcao] = e.target.value.split('-') as [Ordem['campo'], Ordem['direcao']];
              setOrdem({ campo, direcao });
            }}
          >
            <option value="nivel-asc">Nível (1 → 3)</option>
            <option value="nivel-desc">Nível (3 → 1)</option>
            <option value="data-asc">Data (mais antigas)</option>
            <option value="data-desc">Data (mais recentes)</option>
            <option value="nome-asc">Nome (A–Z)</option>
            <option value="nome-desc">Nome (Z–A)</option>
          </select>
        </label>
      </div>

      <GradeFotos fotos={visiveis} onAbrir={(i) => abrirFoto(visiveis[i])} />

      {indiceAberto >= 0 && (
        <Visualizador
          fotos={listaVisualizador}
          indiceInicial={indiceAberto}
          plataforma={plataforma}
          onFechar={fecharFoto}
          onMudarFoto={(f) => navegar(caminhoFoto(a, f.id), { replace: true, state: local.state })}
          onSortear={aleatorio}
          onIniciarSlides={(inicio) => {
            fecharFoto();
            setSlides({ modo: 'sequencia', inicio });
          }}
          informacoesExtras={(f) => (
            <>
            <PainelTagsFoto
              proprias={f.tags}
              herdadas={a.tags.filter((t) => !f.tags.includes(t))}
              existentes={existentes}
              editavel={plataforma === 'desktop'}
              prioritarias={a.tags}
              onChange={(novas) => salvarTagsFoto(f, novas)}
            />
            {plataforma === 'desktop' && (
              <ArtesFoto
                atuais={{ poster: a.posterFotoId === f.id, capa: a.capaFotoId === f.id, miniatura: a.miniaturaFotoId === f.id }}
                onEscolher={(campo) => definirArte(f, campo)}
              />
            )}
            </>
          )}
        />
      )}
      {slides && <ApresentacaoSlides fotos={listaVisualizador} modo={slides.modo} inicio={slides.inicio} onFechar={() => setSlides(null)} />}
      {configurando && (
        <PainelAlbum
          album={a}
          fotos={todas}
          existentes={existentes}
          onFechar={() => setConfigurando(false)}
          onSalvo={(novo: AlbumUI) => {
            album.definir(novo);
            setConfigurando(false);
            tags.recarregar();
          }}
        />
      )}
    </div>
  );
}
