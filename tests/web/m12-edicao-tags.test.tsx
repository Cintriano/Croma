// M12 — Edição de tags: lista de tags existentes para selecionar, edição em massa e tags por foto.
import { describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { sugestoesTags, type TagExistente } from '../../web/src/logica/tagPicker';
import { calcularAlteracoesMassa, tagsEmComum } from '../../web/src/logica/edicaoMassa';
import { TagPicker } from '../../web/src/componentes/TagPicker';
import { PainelTagsFoto } from '../../web/src/componentes/PainelTagsFoto';

const EXISTENTES: TagExistente[] = [
  { tag: 'mar', usos: 6 },
  { tag: 'família', usos: 5 },
  { tag: 'nordeste', usos: 4 },
  { tag: 'aniversário', usos: 3 },
  { tag: 'neve', usos: 2 },
  { tag: 'cachoeira', usos: 2 },
  { tag: 'campo', usos: 1 },
  { tag: 'natal', usos: 1 },
  { tag: 'festa', usos: 1 },
  { tag: 'bolo', usos: 1 },
  { tag: 'praia', usos: 1 },
  { tag: 'verão', usos: 1 },
];

describe('M12 · sugestões de tags', () => {
  it('sem texto: até 10 mais usadas e todas em ordem alfabética', () => {
    const s = sugestoesTags({ existentes: EXISTENTES, aplicadas: [], texto: '' });
    expect(s.maisUsadas).toHaveLength(10);
    expect(s.maisUsadas.slice(0, 3).map((t) => t.tag)).toEqual(['mar', 'família', 'nordeste']);
    expect(s.todas.map((t) => t.tag)).toEqual([...EXISTENTES.map((t) => t.tag)].sort((a, b) => a.localeCompare(b, 'pt-BR')));
    expect(s.criar).toBeNull();
  });

  it('tags já aplicadas somem da lista', () => {
    const s = sugestoesTags({ existentes: EXISTENTES, aplicadas: ['mar'], texto: '' });
    expect(s.todas.some((t) => t.tag === 'mar')).toBe(false);
    expect(s.maisUsadas.some((t) => t.tag === 'mar')).toBe(false);
  });

  it('digitar filtra sem diferença de acento e maiúsculas', () => {
    const s = sugestoesTags({ existentes: EXISTENTES, aplicadas: [], texto: 'FAM' });
    expect(s.todas.map((t) => t.tag)).toEqual(['família']);
    expect(s.maisUsadas).toEqual([]);
  });

  it('texto igual a uma existente não oferece criar', () => {
    expect(sugestoesTags({ existentes: EXISTENTES, aplicadas: [], texto: 'Familia' }).criar).toBeNull();
  });

  it('texto novo oferece criar a tag normalizada', () => {
    expect(sugestoesTags({ existentes: EXISTENTES, aplicadas: [], texto: '  Cachorro ' }).criar).toBe('cachorro');
  });

  it('texto quase igual destaca a existente parecida', () => {
    const s = sugestoesTags({ existentes: EXISTENTES, aplicadas: [], texto: 'famila' });
    expect(s.parecida).toBe('família');
    expect(s.criar).toBe('famila');
  });

  it('tags prioritárias (do álbum atual) vêm primeiro', () => {
    const s = sugestoesTags({ existentes: EXISTENTES, aplicadas: [], texto: '', prioritarias: ['natal', 'bolo'] });
    expect(s.maisUsadas.slice(0, 2).map((t) => t.tag)).toEqual(['natal', 'bolo']);
  });
});

describe('M12 · campo de tags (TagPicker)', () => {
  function montar(valor: string[] = ['praia']) {
    const onChange = vi.fn();
    render(<TagPicker valor={valor} existentes={EXISTENTES} onChange={onChange} />);
    return { onChange, campo: screen.getByRole('combobox', { name: /tags/i }) };
  }

  it('ao focar, a lista abre antes de digitar', async () => {
    const { campo } = montar();
    await userEvent.click(campo);
    const lista = screen.getByRole('listbox');
    expect(within(lista).getByText('Mais usadas')).toBeInTheDocument();
    expect(within(lista).getByText('Todas (A–Z)')).toBeInTheDocument();
    expect(within(lista).getAllByRole('option', { name: /^mar 6$/ }).length).toBeGreaterThan(0);
  });

  it('clicar numa tag adiciona e a lista continua aberta', async () => {
    const { campo, onChange } = montar();
    await userEvent.click(campo);
    await userEvent.click(screen.getAllByRole('option', { name: /^mar 6$/ })[0]);
    expect(onChange).toHaveBeenLastCalledWith(['praia', 'mar']);
    expect(screen.getByRole('listbox')).toBeInTheDocument();
  });

  it('Enter com texto novo cria a tag; vírgula também', async () => {
    const { campo, onChange } = montar([]);
    await userEvent.type(campo, 'Cachorro{Enter}');
    expect(onChange).toHaveBeenLastCalledWith(['cachorro']);
    await userEvent.type(campo, 'gato,');
    expect(onChange).toHaveBeenLastCalledWith(['gato']);
  });

  it('↓ e Enter escolhem a primeira tag filtrada', async () => {
    const { campo, onChange } = montar([]);
    await userEvent.type(campo, 'nor{ArrowDown}{Enter}');
    expect(onChange).toHaveBeenLastCalledWith(['nordeste']);
  });

  it('mostra a opção Criar quando não existe', async () => {
    const { campo } = montar([]);
    await userEvent.type(campo, 'cachorro');
    expect(screen.getByRole('option', { name: 'Criar "cachorro"' })).toBeInTheDocument();
  });

  it('× remove a etiqueta', async () => {
    const { onChange } = montar(['praia', 'mar']);
    await userEvent.click(screen.getByRole('button', { name: 'Remover praia' }));
    expect(onChange).toHaveBeenLastCalledWith(['mar']);
  });
});

describe('M12 · edição em massa', () => {
  it('tags em comum são as presentes em todas', () => {
    expect(tagsEmComum([['família', 'praia', 'nordeste'], ['família', 'nordeste'], ['nordeste', 'família', 'festa']])).toEqual(['família', 'nordeste']);
    expect(tagsEmComum([])).toEqual([]);
  });

  it('calcula o que adicionar e remover a partir das pendências', () => {
    expect(calcularAlteracoesMassa({ emComum: ['família', 'nordeste'], resultado: ['família', 'praia'] }))
      .toEqual({ adicionar: ['praia'], remover: ['nordeste'] });
  });
});

describe('M12 · tags da foto no visualizador', () => {
  it('herdadas aparecem separadas, com rótulo "do álbum" e sem ×', () => {
    render(<PainelTagsFoto proprias={['mar']} herdadas={['praia', 'família']} existentes={EXISTENTES} onChange={() => {}} editavel />);
    const herdadas = screen.getByRole('group', { name: 'Tags do álbum' });
    expect(within(herdadas).getByText('praia')).toBeInTheDocument();
    expect(within(herdadas).getByText('do álbum')).toBeInTheDocument();
    expect(within(herdadas).queryByRole('button', { name: /remover/i })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Remover mar' })).toBeInTheDocument();
  });

  it('fora do desktop as tags são só leitura', () => {
    render(<PainelTagsFoto proprias={['mar']} herdadas={[]} existentes={EXISTENTES} onChange={() => {}} editavel={false} />);
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /remover/i })).not.toBeInTheDocument();
  });
});
