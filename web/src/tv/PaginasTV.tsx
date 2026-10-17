import { useMemo, useState } from 'react';
import { flushSync } from 'react-dom';
import { useParams } from 'react-router-dom';
import { api } from '../api';
import { ApresentacaoSlides } from '../componentes/ApresentacaoSlides';
import { SeloNivel } from '../componentes/SeloNivel';
import { Visualizador } from '../componentes/Visualizador';
import { ORDEM_PADRAO, ordenarFotos } from '../logica/fotos';
import { urlImagem } from '../logica/imagens';
import { caminhoAlbum } from '../logica/rotas';
import { sortearIndice, type ModoSlides } from '../logica/slides';
import { useDados } from '../usarDados';
import { focarPorId, useNavegacaoTV } from './usarNavegacaoTV';

// Telas da TV: tudo por setas, OK e Voltar; sem campos de texto, configurações nem ⚙.
// Os botões nunca ficam desativados, porque botão desativado não recebe foco.
const caminhoAlbumTV = (album: { id: number; titulo: string }) => `/tv${caminhoAlbum(album)}`;

export function PaginaTVBiblioteca() {
  const id = Number(useParams().id);
  const [tagsEscolhidas, setTagsEscolhidas] = useState<string[]>([]);
  const [gradeTags, setGradeTags] = useState(false);
  const [slides, setSlides] = useState<ModoSlides | null>(null);
  const [visualizando, setVisualizando] = useState<number | null>(null);

  const bibliotecas = useDados(() => api.bibliotecas(), []);
  const albuns = useDados(() => api.albuns(id, { tags: tagsEscolhidas }), [id, tagsEscolhidas.join(',')]);
  const fotos = useDados(() => api.buscarFotos(id, { tags: tagsEscolhidas }), [id, tagsEscolhidas.join(',')]);
  const tags = useDados(() => api.tags(id), [id]);

  useNavegacaoTV({
    focoInicial: 'slides',
    pronto: !albuns.carregando && albuns.dados !== undefined,
    aoVoltar: gradeTags ? () => fecharGrade() : undefined,
  });

  const fecharGrade = () => {
    setGradeTags(false);
    setTimeout(() => focarPorId('tags'), 0);
  };
  const alternarTag = (tag: string) =>
    setTagsEscolhidas((atuais) => (atuais.includes(tag) ? atuais.filter((t) => t !== tag) : [...atuais, tag]));

  const listaFotos = fotos.dados ?? [];
  const nome = bibliotecas.dados?.find((b) => b.id === id)?.nome ?? 'Biblioteca';

  return (
    <div className="pagina tv">
      <h1 className="titulo-pagina">{nome}</h1>
      <div className="fileira-botoes">
        <button type="button" className="botao botao-principal" data-foco="slides" onClick={() => listaFotos.length && setSlides('sequencia')}>Slides</button>
        <button
          type="button"
          className="botao botao-principal"
          data-foco="aleatorio"
          onClick={() => setVisualizando(sortearIndice(listaFotos.length))}
        >
          Aleatório
        </button>
        <button type="button" className="botao" data-foco="tags" onClick={() => {
            // Monta a grade na hora para o foco já estar nela na próxima tecla.
            flushSync(() => setGradeTags(true));
            focarPorId('tag-0');
          }}>
          Tags{tagsEscolhidas.length ? ` (${tagsEscolhidas.length})` : ''}
        </button>
      </div>

      <ul className="fileira-cards" aria-label="Álbuns">
        {(albuns.dados ?? []).map((album) => (
          <li key={album.id}>
            <a className="card-tv" href={caminhoAlbumTV(album)} data-foco={`album-${album.id}`} aria-label={album.titulo}>
              <div className="card-imagem">
                {(album.miniaturaFotoId ?? album.capaFotoId) ? <img src={urlImagem((album.miniaturaFotoId ?? album.capaFotoId)!, 600)} alt="" /> : <div className="card-sem-imagem">▣</div>}
              </div>
              <span className="titulo-card">{album.titulo}</span>
            </a>
          </li>
        ))}
      </ul>
      {albuns.dados?.length === 0 && <p className="texto-suave">Nenhum álbum com essas tags.</p>}

      {gradeTags && (
        <div className="grade-tags-tv" data-escopo-foco>
          <h2>Tags</h2>
          <div role="grid" aria-label="Tags" aria-multiselectable="true">
            {linhas(tags.dados ?? [], 5).map((linha, i) => (
              <div role="row" key={i}>
                {linha.map((t, j) => {
                  const indice = i * 5 + j;
                  const marcada = tagsEscolhidas.includes(t.tag);
                  return (
                    <div
                      key={t.tag}
                      role="gridcell"
                      tabIndex={-1}
                      data-foco={`tag-${indice}`}
                      aria-selected={marcada}
                      className="celula-tag"
                      onClick={() => alternarTag(t.tag)}
                    >
                      {t.tag} <span className="usos">{t.usos}</span>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
          <p className="texto-suave">OK marca ou desmarca · Voltar fecha</p>
        </div>
      )}

      {visualizando !== null && (
        <Visualizador fotos={listaFotos} indiceInicial={visualizando} plataforma="tv" onFechar={() => { setVisualizando(null); setTimeout(() => focarPorId('aleatorio'), 0); }} />
      )}
      {slides && <ApresentacaoSlides fotos={listaFotos} modo={slides} onFechar={() => { setSlides(null); setTimeout(() => focarPorId('slides'), 0); }} />}
    </div>
  );
}

export function PaginaTVAlbum() {
  const id = Number(useParams().id);
  const album = useDados(() => api.album(id), [id]);
  const fotos = useDados(() => api.fotosDoAlbum(id), [id]);
  const [visualizando, setVisualizando] = useState<number | null>(null);
  const [slides, setSlides] = useState<ModoSlides | null>(null);
  const lista = useMemo(() => ordenarFotos(fotos.dados ?? [], ORDEM_PADRAO), [fotos.dados]);

  // O primeiro foco da página do álbum é o botão Slides.
  useNavegacaoTV({ focoInicial: 'slides', pronto: !!album.dados && !fotos.carregando });

  if (album.erro) return <p className="pagina-vazia">Álbum não encontrado.</p>;
  const a = album.dados;
  if (!a) return <p className="pagina-vazia">Carregando…</p>;

  const fechar = (foco: string) => () => {
    setVisualizando(null);
    setSlides(null);
    setTimeout(() => focarPorId(foco), 0);
  };

  return (
    <div className="pagina tv">
      <header className="cabecalho-album">
        {a.capaFotoId && <div className="capa-fundo" style={{ backgroundImage: `url(${urlImagem(a.capaFotoId, 1200)})` }} aria-hidden="true" />}
        <div className="cabecalho-conteudo">
          <div className="informacoes">
            <h1>{a.titulo}</h1>
            <p className="texto-suave">
              {a.contagem.total} fotos · ★1 {a.contagem.nivel1} · ★2 {a.contagem.nivel2} · ★3 {a.contagem.nivel3}
            </p>
            <div className="fileira-botoes">
              <button type="button" className="botao botao-principal" data-foco="slides" onClick={() => lista.length && setSlides('sequencia')}>Slides</button>
              <button type="button" className="botao botao-principal" data-foco="aleatorio" onClick={() => setVisualizando(sortearIndice(lista.length))}>Aleatório</button>
            </div>
          </div>
        </div>
      </header>
      <ul className="grade-fotos tv" aria-label="Fotos">
        {lista.map((foto, indice) => (
          <li
            key={foto.id}
            className="card-foto"
            tabIndex={-1}
            data-foco={`foto-${foto.id}`}
            aria-label={foto.nome}
            onClick={() => setVisualizando(indice)}
          >
            <img src={urlImagem(foto.id, 300)} alt="" loading="lazy" />
            <SeloNivel nivel={foto.nivel} className="no-canto" />
          </li>
        ))}
      </ul>
      {visualizando !== null && (
        <Visualizador fotos={lista} indiceInicial={visualizando} plataforma="tv" onFechar={fechar(`foto-${lista[visualizando]?.id}`)} />
      )}
      {slides && <ApresentacaoSlides fotos={lista} modo={slides} onFechar={fechar('slides')} />}
    </div>
  );
}

function linhas<T>(itens: T[], porLinha: number): T[][] {
  const resultado: T[][] = [];
  for (let i = 0; i < itens.length; i += porLinha) resultado.push(itens.slice(i, i + porLinha));
  return resultado;
}
