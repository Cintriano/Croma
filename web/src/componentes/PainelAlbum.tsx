import { useState } from 'react';
import { api } from '../api';
import type { TagExistente } from '../logica/tagPicker';
import type { AlbumUI } from '../tipos';
import { TagPicker } from './TagPicker';

interface Props {
  album: AlbumUI;
  existentes: TagExistente[];
  onSalvo: (album: AlbumUI) => void;
  onFechar: () => void;
}

// Painel ⚙ do álbum (só desktop): informações do colecao.json, tags e ocultar.
export function PainelAlbum({ album, existentes, onSalvo, onFechar }: Props) {
  const colecao = album.colecao ?? {};
  const [titulo, setTitulo] = useState(typeof colecao.titulo === 'string' ? colecao.titulo : album.titulo);
  const [descricao, setDescricao] = useState(typeof colecao.descricao === 'string' ? colecao.descricao : '');
  const [ano, setAno] = useState(colecao.ano !== undefined && colecao.ano !== null ? String(colecao.ano) : '');
  const [tags, setTags] = useState(album.tags);
  const [oculto, setOculto] = useState(album.oculto);
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  const salvar = async (e: React.FormEvent) => {
    e.preventDefault();
    setSalvando(true);
    setErro(null);
    // Só envia o que mudou, para não criar campos que o JSON não tinha.
    const alteracoes: Record<string, unknown> = {};
    if (titulo.trim() !== album.titulo) alteracoes.titulo = titulo.trim();
    if (descricao !== (colecao.descricao ?? '')) alteracoes.descricao = descricao;
    if (ano !== (colecao.ano !== undefined && colecao.ano !== null ? String(colecao.ano) : '')) alteracoes.ano = ano === '' ? null : Number(ano);
    if (tags.join('\n') !== album.tags.join('\n')) alteracoes.tags = tags;
    if (oculto !== album.oculto) alteracoes.oculto = oculto;
    try {
      onSalvo(Object.keys(alteracoes).length ? await api.editarAlbum(album.id, alteracoes) : album);
    } catch (falha) {
      setErro((falha as Error).message);
    } finally {
      setSalvando(false);
    }
  };

  return (
    <aside className="painel-lateral" role="dialog" aria-label="Configurar álbum">
      <form className="formulario" onSubmit={salvar}>
        <div className="painel-topo">
          <h2>Configurar álbum</h2>
          <button type="button" className="botao-icone" aria-label="Fechar painel" onClick={onFechar}>×</button>
        </div>
        <label>
          Título
          <input value={titulo} onChange={(e) => setTitulo(e.target.value)} />
        </label>
        <label>
          Ano
          <input value={ano} inputMode="numeric" onChange={(e) => setAno(e.target.value.replace(/\D/g, '').slice(0, 4))} />
        </label>
        <label>
          Descrição
          <textarea value={descricao} rows={3} onChange={(e) => setDescricao(e.target.value)} />
        </label>
        <div className="campo">
          <span className="rotulo">Tags do álbum</span>
          <TagPicker valor={tags} existentes={existentes} onChange={setTags} prioritarias={album.tags} rotulo="Tags do álbum" />
        </div>
        <label className="caixa-marcar">
          <input type="checkbox" checked={oculto} onChange={(e) => setOculto(e.target.checked)} />
          Ocultar este álbum
        </label>
        {erro && <p className="mensagem-erro" role="alert">{erro}</p>}
        <div className="acoes-formulario">
          <button type="button" className="botao" onClick={onFechar}>Cancelar</button>
          <button type="submit" className="botao botao-principal" disabled={salvando}>{salvando ? 'Salvando…' : 'Salvar'}</button>
        </div>
      </form>
    </aside>
  );
}
