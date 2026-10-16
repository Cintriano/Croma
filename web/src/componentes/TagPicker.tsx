import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { sugestoesTags, type TagExistente } from '../logica/tagPicker';
import { chaveBusca, normalizarTag } from '../logica/tags';

interface Props {
  valor: string[];
  existentes: TagExistente[];
  onChange: (tags: string[]) => void;
  /** Tags do álbum atual, mostradas primeiro em "Mais usadas". */
  prioritarias?: string[];
  rotulo?: string;
}

type Opcao = { tipo: 'existente'; tag: string; usos: number } | { tipo: 'criar'; tag: string } | { tipo: 'parecida'; tag: string };

// Campo de tags com a lista das existentes aberta desde o foco, para só selecionar.
export function TagPicker({ valor, existentes, onChange, prioritarias, rotulo = 'Tags' }: Props) {
  const [texto, setTexto] = useState('');
  const [aberto, setAberto] = useState(false);
  const [ativo, setAtivo] = useState(-1);
  const campo = useRef<HTMLInputElement>(null);
  const fechamento = useRef<ReturnType<typeof setTimeout> | null>(null);
  const idLista = useId();
  useEffect(() => () => {
    if (fechamento.current) clearTimeout(fechamento.current);
  }, []);

  const s = useMemo(() => sugestoesTags({ existentes, aplicadas: valor, texto, prioritarias }), [existentes, valor, texto, prioritarias]);

  // Ordem da navegação por ↓ ↑: com texto, as filtradas, depois a parecida e o Criar; sem texto, mais usadas e todas.
  const opcoes: Opcao[] = texto.trim()
    ? [
        ...s.todas.map((t) => ({ tipo: 'existente' as const, ...t })),
        ...(s.parecida ? [{ tipo: 'parecida' as const, tag: s.parecida }] : []),
        ...(s.criar ? [{ tipo: 'criar' as const, tag: s.criar }] : []),
      ]
    : [...s.maisUsadas, ...s.todas].map((t) => ({ tipo: 'existente' as const, ...t }));

  const adicionar = (tag: string) => {
    const normalizada = normalizarTag(tag);
    if (!normalizada || valor.some((v) => chaveBusca(v) === chaveBusca(normalizada))) return;
    onChange([...valor, normalizada]);
    setTexto('');
    setAtivo(-1);
  };

  const confirmarTexto = () => {
    if (ativo >= 0 && opcoes[ativo]) return adicionar(opcoes[ativo].tag);
    if (!texto.trim()) return;
    // Texto igual a uma existente (ex.: "Familia") usa a forma existente ("família").
    const igual = existentes.find((t) => chaveBusca(t.tag) === chaveBusca(texto));
    adicionar(igual?.tag ?? texto);
  };

  const aoTeclar = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      confirmarTexto();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setAberto(true);
      setAtivo((a) => Math.min(a + 1, opcoes.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setAtivo((a) => Math.max(a - 1, -1));
    } else if (e.key === 'Escape') {
      setAberto(false);
    } else if (e.key === 'Backspace' && texto === '' && valor.length > 0) {
      onChange(valor.slice(0, -1));
    }
  };

  let posicao = 0;
  const renderOpcao = (opcao: Opcao, chave: string) => {
    const indice = posicao++;
    const rotuloOpcao =
      opcao.tipo === 'existente' ? `${opcao.tag} ${opcao.usos}` : opcao.tipo === 'criar' ? `Criar "${opcao.tag}"` : `Você quis dizer "${opcao.tag}"?`;
    return (
      <li
        key={chave}
        id={`${idLista}-${indice}`}
        role="option"
        aria-label={rotuloOpcao}
        aria-selected={indice === ativo}
        className={`opcao-tag opcao-${opcao.tipo}`}
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => adicionar(opcao.tag)}
      >
        {opcao.tipo === 'existente' && (
          <>
            <span>{opcao.tag}</span> <span className="usos">{opcao.usos}</span>
          </>
        )}
        {opcao.tipo === 'criar' && <>Criar <strong>"{opcao.tag}"</strong></>}
        {opcao.tipo === 'parecida' && <>Você quis dizer <strong>{opcao.tag}</strong>?</>}
      </li>
    );
  };

  return (
    <div className="tag-picker">
      <div className="tag-picker-campo" onClick={() => campo.current?.focus()}>
        {valor.map((tag) => (
          <span key={tag} className="chip-tag">
            {tag}
            <button type="button" aria-label={`Remover ${tag}`} onClick={() => onChange(valor.filter((t) => t !== tag))}>×</button>
          </span>
        ))}
        <input
          ref={campo}
          role="combobox"
          aria-label={rotulo}
          aria-expanded={aberto}
          aria-controls={idLista}
          aria-autocomplete="list"
          aria-activedescendant={ativo >= 0 ? `${idLista}-${ativo}` : undefined}
          placeholder="digite uma tag..."
          value={texto}
          onFocus={() => {
            if (fechamento.current) clearTimeout(fechamento.current);
            setAberto(true);
          }}
          // A lista fica no fluxo da página; fechar só depois do clique evita que o conteúdo
          // suba no meio dele e o clique caia em outro elemento.
          onBlur={() => {
            fechamento.current = setTimeout(() => setAberto(false), 200);
          }}
          onChange={(e) => {
            setTexto(e.target.value.replace(',', ''));
            setAtivo(-1);
            setAberto(true);
          }}
          onKeyDown={aoTeclar}
        />
      </div>
      {aberto && (
        <ul className="tag-picker-lista" role="listbox" id={idLista} aria-label={`Sugestões de ${rotulo.toLowerCase()}`}>
          {texto.trim() ? (
            <>
              {s.todas.map((t) => renderOpcao({ tipo: 'existente', ...t }, `f-${t.tag}`))}
              {s.parecida && renderOpcao({ tipo: 'parecida', tag: s.parecida }, 'parecida')}
              {s.criar && renderOpcao({ tipo: 'criar', tag: s.criar }, 'criar')}
              {opcoes.length === 0 && <li className="tag-picker-vazio">Tag já aplicada</li>}
            </>
          ) : (
            <>
              {s.maisUsadas.length > 0 && <li role="presentation" className="tag-picker-grupo">Mais usadas</li>}
              {s.maisUsadas.map((t) => renderOpcao({ tipo: 'existente', ...t }, `m-${t.tag}`))}
              <li role="presentation" className="tag-picker-grupo">Todas (A–Z)</li>
              {s.todas.map((t) => renderOpcao({ tipo: 'existente', ...t }, `t-${t.tag}`))}
            </>
          )}
        </ul>
      )}
    </div>
  );
}
