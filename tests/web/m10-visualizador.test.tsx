// M10 — Foto expandida (visualizador): abrir, navegar, fechar, informações, pré-carregamento e controles.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Visualizador } from '../../web/src/componentes/Visualizador';
import { urlImagem } from '../../web/src/logica/imagens';
import { FOTOS } from './dados';

function abrir(indiceInicial = 1, extra: Partial<React.ComponentProps<typeof Visualizador>> = {}) {
  const props = { fotos: FOTOS.slice(0, 3), indiceInicial, onFechar: vi.fn(), onMudarFoto: vi.fn(), onIniciarSlides: vi.fn(), ...extra };
  render(<Visualizador {...props} />);
  return props;
}

afterEach(() => vi.useRealTimers());

describe('M10 · URLs de imagem', () => {
  it('usa a versão do cache e só pede o original quando não há largura', () => {
    expect(urlImagem(7, 1200)).toBe('/api/photos/7/imagem?w=1200');
    expect(urlImagem(7)).toBe('/api/items/7/file');
  });
});

describe('M10 · abrir e navegar', () => {
  it('mostra a foto inicial, o contador e o selo de nível', () => {
    abrir(1);
    expect(screen.getByRole('dialog', { name: /IMG_0042\.jpg/ })).toBeInTheDocument();
    expect(screen.getByText('2 / 3')).toBeInTheDocument();
    expect(screen.getByLabelText('Nível 2')).toBeInTheDocument();
  });

  it('a imagem principal começa pela versão de 1200 px', () => {
    abrir(1);
    expect(screen.getByRole('img', { name: 'IMG_0042.jpg' })).toHaveAttribute('src', '/api/photos/2/imagem?w=1200');
  });

  it('→ e ← trocam a foto e avisam a mudança', async () => {
    const props = abrir(1);
    await userEvent.keyboard('{ArrowRight}');
    expect(screen.getByText('3 / 3')).toBeInTheDocument();
    expect(props.onMudarFoto).toHaveBeenLastCalledWith(FOTOS[2]);
    await userEvent.keyboard('{ArrowLeft}{ArrowLeft}');
    expect(screen.getByText('1 / 3')).toBeInTheDocument();
  });

  it('para na última e na primeira foto (não dá a volta)', async () => {
    abrir(2);
    await userEvent.keyboard('{ArrowRight}');
    expect(screen.getByText('3 / 3')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Próxima foto' })).toBeDisabled();
  });

  it('botões ‹ › também navegam', async () => {
    abrir(0);
    await userEvent.click(screen.getByRole('button', { name: 'Próxima foto' }));
    expect(screen.getByText('2 / 3')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Foto anterior' }));
    expect(screen.getByText('1 / 3')).toBeInTheDocument();
  });

  it('pré-carrega a anterior e a próxima', () => {
    const { container } = render(<Visualizador fotos={FOTOS.slice(0, 3)} indiceInicial={1} onFechar={() => {}} />);
    const preload = [...container.querySelectorAll('[data-preload]')].map((el) => el.getAttribute('src'));
    expect(preload.sort()).toEqual(['/api/photos/1/imagem?w=1200', '/api/photos/3/imagem?w=1200']);
  });
});

describe('M10 · fechar', () => {
  it('Esc fecha', async () => {
    const props = abrir();
    await userEvent.keyboard('{Escape}');
    expect(props.onFechar).toHaveBeenCalledOnce();
  });

  it('botão × fecha', async () => {
    const props = abrir();
    await userEvent.click(screen.getByRole('button', { name: 'Fechar' }));
    expect(props.onFechar).toHaveBeenCalledOnce();
  });

  it('clique fora da foto fecha, clique na foto não', async () => {
    const props = abrir();
    await userEvent.click(screen.getByRole('img', { name: 'IMG_0042.jpg' }));
    expect(props.onFechar).not.toHaveBeenCalled();
    await userEvent.click(screen.getByTestId('visualizador-fundo'));
    expect(props.onFechar).toHaveBeenCalledOnce();
  });
});

describe('M10 · informações e ações', () => {
  it('rodapé mostra nome, data e câmera', () => {
    abrir(0);
    expect(screen.getByText(/IMG_0001\.jpg · 14\/07\/2025 · Canon EOS R6/)).toBeInTheDocument();
  });

  it('botão ⓘ abre o painel de informações', async () => {
    abrir(0);
    await userEvent.click(screen.getByRole('button', { name: 'Informações' }));
    expect(screen.getByRole('region', { name: 'Informações da foto' })).toBeInTheDocument();
  });

  it('botão ▶ inicia slides a partir da foto aberta', async () => {
    const props = abrir(1);
    await userEvent.click(screen.getByRole('button', { name: 'Iniciar slides' }));
    expect(props.onIniciarSlides).toHaveBeenCalledWith(1);
  });

  it('modo TV não tem zoom', () => {
    abrir(0, { plataforma: 'tv' });
    expect(screen.queryByRole('button', { name: /zoom/i })).not.toBeInTheDocument();
  });
});

describe('M10 · controles somem sem movimento', () => {
  it('após 3 s ocultam, e voltam ao mexer o mouse', () => {
    vi.useFakeTimers();
    render(<Visualizador fotos={FOTOS.slice(0, 3)} indiceInicial={0} onFechar={() => {}} />);
    const dialogo = screen.getByRole('dialog');
    expect(dialogo).toHaveAttribute('data-controles', 'visiveis');
    act(() => vi.advanceTimersByTime(3000));
    expect(dialogo).toHaveAttribute('data-controles', 'ocultos');
    fireEvent.mouseMove(dialogo);
    expect(dialogo).toHaveAttribute('data-controles', 'visiveis');
  });
});
