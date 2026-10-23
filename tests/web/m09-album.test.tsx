// M9 — Biblioteca e álbum: filtro e ordenação por nível, selo, contagem por nível e álbuns ocultos.
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { filtrarPorNivel, ordenarFotos } from '../../web/src/logica/fotos';
import { SeloNivel } from '../../web/src/componentes/SeloNivel';
import { ContagemNiveis } from '../../web/src/componentes/ContagemNiveis';
import { FiltroNivel } from '../../web/src/componentes/FiltroNivel';
import { CardAlbum } from '../../web/src/componentes/CardAlbum';
import { FOTOS } from './dados';

const ids = (fotos: { id: number }[]) => fotos.map((f) => f.id);

describe('M9 · filtro e ordenação', () => {
  it('filtra por nível', () => {
    expect(ids(filtrarPorNivel(FOTOS, 1))).toEqual([1, 5]);
    expect(ids(filtrarPorNivel(FOTOS, 'todos'))).toEqual([1, 2, 3, 4, 5]);
  });

  it('ordena por nível crescente com as sem nível no fim, desempate por nome', () => {
    expect(ids(ordenarFotos(FOTOS, { campo: 'nivel', direcao: 'asc' }))).toEqual([1, 5, 2, 3, 4]);
  });

  it('ordena por nível decrescente mantendo as sem nível no fim', () => {
    expect(ids(ordenarFotos(FOTOS, { campo: 'nivel', direcao: 'desc' }))).toEqual([3, 2, 1, 5, 4]);
  });

  it('ordena por data de captura com as sem data no fim', () => {
    expect(ids(ordenarFotos(FOTOS, { campo: 'data', direcao: 'asc' }))).toEqual([2, 4, 1, 5, 3]);
  });

  it('ordena por nome em ordem natural', () => {
    expect(ids(ordenarFotos(FOTOS, { campo: 'nome', direcao: 'asc' }))).toEqual([1, 5, 2, 3, 4]);
  });

  it('não altera a lista original', () => {
    const copia = [...FOTOS];
    ordenarFotos(FOTOS, { campo: 'nome', direcao: 'desc' });
    expect(FOTOS).toEqual(copia);
  });
});

describe('M9 · selo de nível', () => {
  it('mostra estrela e número', () => {
    render(<SeloNivel nivel={2} />);
    expect(screen.getByLabelText('Nível 2')).toHaveTextContent('★ 2');
  });

  it('não aparece para foto sem nível', () => {
    const { container } = render(<SeloNivel nivel={null} />);
    expect(container).toBeEmptyDOMElement();
  });
});

describe('M9 · contagem por nível', () => {
  const contagem = { total: 128, nivel1: 40, nivel2: 60, nivel3: 28, semNivel: 0 };

  it('mostra a quantidade de cada nível', () => {
    render(<ContagemNiveis contagem={contagem} onSelecionarNivel={() => {}} />);
    expect(screen.getByRole('button', { name: /nível 1: 40 fotos/i })).toHaveTextContent('★1 40');
    expect(screen.getByRole('button', { name: /nível 2: 60 fotos/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /nível 3: 28 fotos/i })).toBeInTheDocument();
  });

  it('só mostra "sem nível" quando existem fotos soltas', () => {
    const { rerender } = render(<ContagemNiveis contagem={contagem} onSelecionarNivel={() => {}} />);
    expect(screen.queryByText(/sem nível/i)).not.toBeInTheDocument();
    rerender(<ContagemNiveis contagem={{ ...contagem, semNivel: 5 }} onSelecionarNivel={() => {}} />);
    expect(screen.getByRole('button', { name: /sem nível 5/i })).toBeInTheDocument();
  });

  it('clicar num nível aplica o filtro', async () => {
    const onSelecionarNivel = vi.fn();
    render(<ContagemNiveis contagem={contagem} onSelecionarNivel={onSelecionarNivel} />);
    await userEvent.click(screen.getByRole('button', { name: /nível 2/i }));
    expect(onSelecionarNivel).toHaveBeenCalledWith(2);
  });
});

describe('M9 · filtro por nível', () => {
  it('mostra contagens nos botões e desativa nível sem fotos', () => {
    render(<FiltroNivel contagem={{ total: 3, nivel1: 1, nivel2: 2, nivel3: 0, semNivel: 0 }} valor="todos" onChange={() => {}} />);
    expect(screen.getByRole('button', { name: /todos/i })).toHaveTextContent('3');
    expect(screen.getByRole('button', { name: /nível 3/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /todos/i })).toHaveAttribute('aria-pressed', 'true');
  });

  it('avisa a troca de filtro', async () => {
    const onChange = vi.fn();
    render(<FiltroNivel contagem={{ total: 3, nivel1: 1, nivel2: 2, nivel3: 0, semNivel: 0 }} valor="todos" onChange={onChange} />);
    await userEvent.click(screen.getByRole('button', { name: /nível 2/i }));
    expect(onChange).toHaveBeenCalledWith(2);
  });
});

describe('M9 · card de álbum oculto', () => {
  const album = { id: 1, titulo: 'Neve', contagem: { total: 1, nivel1: 1, nivel2: 0, nivel3: 0, semNivel: 0 }, tags: ['neve'], oculto: true };

  it('álbum oculto aparece esmaecido e com selo', () => {
    render(<CardAlbum album={album} modo="miniatura" />);
    expect(screen.getByRole('article')).toHaveAttribute('data-oculto', 'true');
    expect(screen.getByLabelText('Álbum oculto')).toBeInTheDocument();
  });

  it('álbum visível não tem selo de oculto', () => {
    render(<CardAlbum album={{ ...album, oculto: false }} modo="miniatura" />);
    expect(screen.queryByLabelText('Álbum oculto')).not.toBeInTheDocument();
  });
});
