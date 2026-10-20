import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useNavigationType, useParams } from 'react-router-dom';
import { api } from '../api';
import { ApresentacaoSlides } from '../componentes/ApresentacaoSlides';
import { BarraPesquisaTags } from '../componentes/BarraPesquisaTags';
import { BotoesAleatorioSlides } from '../componentes/BotoesAleatorioSlides';
import { Carregando } from '../componentes/Carregando';
import { CardAlbum, type ModoCard } from '../componentes/CardAlbum';
import { GradeFotos } from '../componentes/GradeFotos';
import { ResultadoVazio } from '../componentes/ResultadoVazio';
import { TagPicker } from '../componentes/TagPicker';
import { calcularAlteracoesMassa, tagsEmComum } from '../logica/edicaoMassa';
import { estadoPesquisaDaUrl, urlDaPesquisa, type EstadoPesquisa } from '../logica/pesquisa';
import { caminhoBiblioteca, caminhoFoto } from '../logica/rotas';
import { sortearIndice, type ModoSlides } from '../logica/slides';
import { chaveBusca } from '../logica/tags';
import { usePlataforma } from '../plataforma';
import type { FotoUI } from '../tipos';
import { useDados } from '../usarDados';
import { Visualizador } from '../componentes/Visualizador';

// Modo da grade de álbuns, lembrado neste navegador.
const CHAVE_MODO_CARD = 'croma:modo-albuns';
function lerModoCard(): ModoCard {
  try {
    return localStorage.getItem(CHAVE_MODO_CARD) === 'poster' ? 'poster' : 'miniatura';
  } catch {
    return 'miniatura';
  }
}

export function PaginaBiblioteca() {
  const id = Number(useParams().id);
  const { search } = useLocation();
  const tipoNavegacao = useNavigationType();
  const navegar = useNavigate();
  const plataforma = usePlataforma();
  // A pesquisa vive no estado (atualiza na hora) e é espelhada na URL. A URL só manda de volta
  // em Voltar/Avançar: a troca de URL é adiada pelo roteador e não pode desfazer mudanças mais novas.
  const [pesquisa, setPesquisa] = useState(() => estadoPesquisaDaUrl(search));
  useEffect(() => {
    if (tipoNavegacao === 'POP') setPesquisa(estadoPesquisaDaUrl(search));
  }, [search, tipoNavegacao]);
  const chavePesquisa = urlDaPesquisa(pesquisa);
  // "Mostrar ocultos" não é salvo: ao recarregar, os ocultos voltam a ficar escondidos.
  const [mostrarOcultos, setMostrarOcultos] = useState(false);
  const incluirOcultos = plataforma === 'desktop' && mostrarOcultos;

  const bibliotecas = useDados(() => api.bibliotecas(), []);
  const biblioteca = bibliotecas.dados?.find((b) => b.id === id);
  const tags = useDados(() => api.tags(id), [id]);
  const albuns = useDados(
    () => api.albuns(id, { tags: pesquisa.tags, modo: pesquisa.modo, incluirOcultos }),
    [id, chavePesquisa, incluirOcultos],
  );
  // Fotos da pesquisa (busca=fotos) ou de todos os álbuns filtrados (para Aleatório e Slides da biblioteca).
  const fotos = useDados(() => api.buscarFotos(id, { tags: pesquisa.tags, modo: pesquisa.modo }), [id, chavePesquisa]);

  const [visualizando, setVisualizando] = useState<number | null>(null);
  const [slides, setSlides] = useState<{ modo: ModoSlides; inicio?: number } | null>(null);
  const [modoCard, setModoCard] = useState<ModoCard>(lerModoCard);
  const mudarModoCard = (modo: ModoCard) => {
    setModoCard(modo);
    try {
      localStorage.setItem(CHAVE_MODO_CARD, modo);
    } catch {
      // Sem armazenamento (aba anônima etc.): a escolha vale só até recarregar.
    }
  };
  const [selecionando, setSelecionando] = useState(false);
  const [selecionados, setSelecionados] = useState<number[]>([]);

  const existentes = useMemo(() => (tags.dados ?? []).map((t) => ({ tag: t.tag, usos: t.usos })), [tags.dados]);
  const listaAlbuns = albuns.dados ?? [];

  // Fotos usadas por Aleatório e Slides: na busca de álbuns, só as dos álbuns do resultado.
  const fotosDoResultado: FotoUI[] = useMemo(() => {
    const todas = fotos.dados ?? [];
    if (pesquisa.busca === 'fotos') return todas;
    const visiveis = new Set(listaAlbuns.filter((a) => !a.oculto).map((a) => a.id));
    return todas.filter((f) => f.albumId !== undefined && visiveis.has(f.albumId));
  }, [fotos.dados, listaAlbuns, pesquisa.busca]);

  // Sugestões: tags mais frequentes entre os álbuns do resultado, menos as já escolhidas.
  const sugestoes = useMemo(() => {
    const escolhidas = new Set(pesquisa.tags.map(chaveBusca));
    const contagem = new Map<string, number>();
    for (const album of listaAlbuns) for (const tag of album.tags) if (!escolhidas.has(chaveBusca(tag))) contagem.set(tag, (contagem.get(tag) ?? 0) + 1);
    return [...contagem].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'pt-BR')).slice(0, 5).map(([tag, usos]) => ({ tag, usos }));
  }, [listaAlbuns, pesquisa.tags]);

  const mudarPesquisa = (estado: EstadoPesquisa) => {
    setPesquisa(estado);
    navegar(`${caminhoBiblioteca(id)}${urlDaPesquisa(estado)}`, { replace: true });
  };

  const aleatorio = () => {
    const indice = sortearIndice(fotosDoResultado.length);
    if (indice === null) return;
    const foto = fotosDoResultado[indice];
    if (pesquisa.busca === 'fotos') setVisualizando(indice);
    else navegar(caminhoFoto({ id: foto.albumId!, titulo: foto.albumTitulo ?? '' }, foto.id));
  };

  const alternarSelecao = (albumId: number) =>
    setSelecionados((s) => (s.includes(albumId) ? s.filter((x) => x !== albumId) : [...s, albumId]));

  return (
    <div className="pagina">
      <div className="cabecalho-biblioteca">
        <h1 className="titulo-pagina">{biblioteca?.nome ?? 'Biblioteca'}</h1>
        <BotoesAleatorioSlides desativado={fotosDoResultado.length === 0} onAleatorio={aleatorio} onSlides={(modo) => setSlides({ modo })} />
      </div>

      {plataforma !== 'tv' && (
        <BarraPesquisaTags estado={pesquisa} existentes={existentes} sugestoes={sugestoes} onChange={mudarPesquisa} />
      )}

      {pesquisa.busca === 'albuns' ? (
        <>
          <div className="barra-ferramentas">
            <span className="texto-suave">{listaAlbuns.length === 1 ? '1 álbum' : `${listaAlbuns.length} álbuns`}</span>
            <div className="alternar-modo" role="group" aria-label="Exibir álbuns como">
              {(['miniatura', 'poster'] as const).map((modo) => (
                <button key={modo} type="button" className="botao" aria-pressed={modoCard === modo} onClick={() => mudarModoCard(modo)}>
                  {modo === 'poster' ? 'Poster' : 'Miniatura'}
                </button>
              ))}
            </div>
            {plataforma === 'desktop' && (
              <>
                <button type="button" className="botao" aria-pressed={mostrarOcultos} onClick={() => setMostrarOcultos((m) => !m)}>
                  {mostrarOcultos ? 'Esconder ocultos' : 'Mostrar ocultos'}
                </button>
                <button type="button" className="botao" aria-pressed={selecionando} onClick={() => { setSelecionando((s) => !s); setSelecionados([]); }}>
                  {selecionando ? 'Cancelar seleção' : 'Selecionar'}
                </button>
              </>
            )}
          </div>
          {selecionando && (
            <EdicaoEmMassa
              albuns={listaAlbuns.filter((a) => selecionados.includes(a.id))}
              existentes={existentes}
              onTodos={() => setSelecionados(listaAlbuns.map((a) => a.id))}
              onConcluido={() => { setSelecionando(false); setSelecionados([]); albuns.recarregar(); tags.recarregar(); }}
            />
          )}
          {albuns.dados === undefined && albuns.carregando ? (
            <Carregando />
          ) : !albuns.carregando && listaAlbuns.length === 0 && pesquisa.tags.length > 0 ? (
            <ResultadoVazio busca="albuns" onLimpar={() => mudarPesquisa({ ...pesquisa, tags: [] })} />
          ) : (
            <ul className={`grade-albuns modo-${modoCard}`} aria-label="Álbuns">
              {listaAlbuns.map((album) => (
                <li key={album.id}>
                  <CardAlbum
                    album={album}
                    modo={modoCard}
                    selecionado={selecionando && selecionados.includes(album.id)}
                    onSelecionar={selecionando ? () => alternarSelecao(album.id) : undefined}
                  />
                </li>
              ))}
            </ul>
          )}
        </>
      ) : (
        <>
          <div className="barra-ferramentas">
            <span className="texto-suave">{fotosDoResultado.length === 1 ? '1 foto' : `${fotosDoResultado.length} fotos`}</span>
          </div>
          {fotos.dados === undefined && fotos.carregando ? (
            <Carregando />
          ) : !fotos.carregando && fotosDoResultado.length === 0 && pesquisa.tags.length > 0 ? (
            <ResultadoVazio busca="fotos" onLimpar={() => mudarPesquisa({ ...pesquisa, tags: [] })} />
          ) : (
            <GradeFotos fotos={fotosDoResultado} onAbrir={setVisualizando} mostrarAlbum />
          )}
        </>
      )}

      {visualizando !== null && (
        <Visualizador
          fotos={fotosDoResultado}
          indiceInicial={visualizando}
          plataforma={plataforma}
          onFechar={() => setVisualizando(null)}
          onIniciarSlides={(inicio) => { setVisualizando(null); setSlides({ modo: 'sequencia', inicio }); }}
        />
      )}
      {slides && <ApresentacaoSlides fotos={fotosDoResultado} modo={slides.modo} inicio={slides.inicio} onFechar={() => setSlides(null)} />}
    </div>
  );
}

function EdicaoEmMassa({ albuns, existentes, onTodos, onConcluido }: {
  albuns: { id: number; tags: string[]; titulo: string }[];
  existentes: { tag: string; usos: number }[];
  onTodos: () => void;
  onConcluido: () => void;
}) {
  const emComum = useMemo(() => tagsEmComum(albuns.map((a) => a.tags)), [albuns]);
  const [resultado, setResultado] = useState<string[] | null>(null);
  const [falhas, setFalhas] = useState<string[]>([]);
  const atuais = resultado ?? emComum;

  const aplicar = async () => {
    const { adicionar, remover } = calcularAlteracoesMassa({ emComum, resultado: atuais });
    const r = await api.tagsEmMassa(albuns.map((a) => a.id), adicionar, remover);
    if (r.falhas.length) setFalhas(r.falhas.map((f) => f.mensagem));
    else onConcluido();
  };

  return (
    <section className="painel edicao-massa" aria-label="Editar tags em massa">
      <div className="secao-topo">
        <strong>{albuns.length === 1 ? '1 álbum selecionado' : `${albuns.length} álbuns selecionados`}</strong>
        <button type="button" className="botao-texto" onClick={onTodos}>Selecionar todos</button>
      </div>
      {albuns.length > 0 && (
        <>
          <p className="texto-suave">Tags em comum. O que você adicionar ou remover vale para todos os selecionados.</p>
          <TagPicker valor={atuais} existentes={existentes} onChange={setResultado} rotulo="Tags em comum" />
          {falhas.length > 0 && <ul className="mensagem-erro">{falhas.map((f) => <li key={f}>{f}</li>)}</ul>}
          <div className="acoes-formulario">
            <button type="button" className="botao botao-principal" onClick={aplicar}>Aplicar</button>
          </div>
        </>
      )}
    </section>
  );
}
