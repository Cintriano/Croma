// M13 — Pesquisa por tags: estado na URL, seletor Álbuns | Fotos, modo e resultado vazio.
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { estadoPesquisaDaUrl, urlDaPesquisa } from '../../web/src/logica/pesquisa';
import { BarraPesquisaTags } from '../../web/src/componentes/BarraPesquisaTags';
import { ResultadoVazio } from '../../web/src/componentes/ResultadoVazio';

describe('M13 · estado da pesquisa na URL', () => {
  it('lê tags, modo e tipo de busca', () => {
    expect(estadoPesquisaDaUrl('?tags=praia,fam%C3%ADlia&modo=qualquer&busca=fotos')).toEqual({
      tags: ['praia', 'família'], modo: 'qualquer', busca: 'fotos',
    });
  });

  it('usa padrões: modo todas e busca de álbuns', () => {
    expect(estadoPesquisaDaUrl('')).toEqual({ tags: [], modo: 'todas', busca: 'albuns' });
  });

  it('ignora valores inválidos', () => {
    expect(estadoPesquisaDaUrl('?modo=talvez&busca=x&tags=,,')).toEqual({ tags: [], modo: 'todas', busca: 'albuns' });
  });

  it('ida e volta preserva o estado e omite padrões', () => {
    const estado = { tags: ['praia', 'família'], modo: 'todas' as const, busca: 'fotos' as const };
    const url = urlDaPesquisa(estado);
    expect(url).not.toContain('modo=');
    expect(estadoPesquisaDaUrl(url)).toEqual(estado);
    expect(urlDaPesquisa({ tags: [], modo: 'todas', busca: 'albuns' })).toBe('');
  });
});

describe('M13 · barra de pesquisa', () => {
  const base = { tags: [], modo: 'todas' as const, busca: 'albuns' as const };

  it('alterna entre Álbuns e Fotos', async () => {
    const onChange = vi.fn();
    render(<BarraPesquisaTags estado={base} existentes={[]} sugestoes={[]} onChange={onChange} />);
    expect(screen.getByRole('radio', { name: 'Álbuns' })).toBeChecked();
    await userEvent.click(screen.getByRole('radio', { name: 'Fotos' }));
    expect(onChange).toHaveBeenLastCalledWith({ ...base, busca: 'fotos' });
  });

  it('alterna o modo de combinação', async () => {
    const onChange = vi.fn();
    render(<BarraPesquisaTags estado={base} existentes={[]} sugestoes={[]} onChange={onChange} />);
    await userEvent.click(screen.getByRole('radio', { name: 'Qualquer tag' }));
    expect(onChange).toHaveBeenLastCalledWith({ ...base, modo: 'qualquer' });
  });

  it('sugestão adiciona a tag com um clique', async () => {
    const onChange = vi.fn();
    render(<BarraPesquisaTags estado={base} existentes={[]} sugestoes={[{ tag: 'nordeste', usos: 4 }]} onChange={onChange} />);
    await userEvent.click(screen.getByRole('button', { name: 'nordeste (4)' }));
    expect(onChange).toHaveBeenLastCalledWith({ ...base, tags: ['nordeste'] });
  });
});

describe('M13 · resultado vazio', () => {
  it('mostra a mensagem e limpa a pesquisa', async () => {
    const onLimpar = vi.fn();
    render(<ResultadoVazio busca="albuns" onLimpar={onLimpar} />);
    expect(screen.getByText('Nenhum álbum com essas tags')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Limpar pesquisa' }));
    expect(onLimpar).toHaveBeenCalled();
  });

  it('na busca de fotos, a mensagem fala de fotos', () => {
    render(<ResultadoVazio busca="fotos" onLimpar={() => {}} />);
    expect(screen.getByText('Nenhuma foto com essas tags')).toBeInTheDocument();
  });
});
