// M18 — Poster, capa de fundo e miniatura do álbum, escolhidos entre as fotos do próprio álbum.
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ArtesAlbum } from '../../web/src/componentes/ArtesAlbum';
import { ArtesFoto } from '../../web/src/componentes/ArtesFoto';
import { CardAlbum } from '../../web/src/componentes/CardAlbum';
import { FOTOS } from './dados';

const contagem = { total: 5, nivel1: 2, nivel2: 1, nivel3: 1, semNivel: 1 };

describe('M18 · artes do álbum', () => {
  it('escolher uma foto na grade chama onEscolher com o campo e o id', async () => {
    const onEscolher = vi.fn();
    render(<ArtesAlbum fotos={FOTOS} atuais={{ poster: 1, capa: 1, miniatura: 1 }} onEscolher={onEscolher} />);
    await userEvent.click(screen.getAllByRole('button', { name: 'Trocar' })[0]);
    await userEvent.click(screen.getByRole('button', { name: 'Usar IMG_0042.jpg como poster' }));
    expect(onEscolher).toHaveBeenCalledWith('poster', 2);
  });

  it('"Automático" devolve null', async () => {
    const onEscolher = vi.fn();
    render(<ArtesAlbum fotos={FOTOS} atuais={{ poster: 1, capa: 1, miniatura: 1 }} onEscolher={onEscolher} />);
    await userEvent.click(screen.getAllByRole('button', { name: 'Automático' })[2]);
    expect(onEscolher).toHaveBeenCalledWith('miniatura', null);
  });

  it('no visualizador, "Usar como" marca a arte que já usa a foto', async () => {
    const onEscolher = vi.fn();
    render(<ArtesFoto atuais={{ poster: true, capa: false, miniatura: false }} onEscolher={onEscolher} />);
    expect(screen.getByRole('button', { name: 'Poster (atual)' })).toBeDisabled();
    await userEvent.click(screen.getByRole('button', { name: 'Capa de fundo' }));
    expect(onEscolher).toHaveBeenCalledWith('capa');
  });

  it('o card usa a miniatura no modo miniatura e o poster no modo poster', () => {
    const album = { id: 1, titulo: 'A', contagem, tags: [], oculto: false, posterFotoId: 10, capaFotoId: 11, miniaturaFotoId: 12 };
    const { container, rerender } = render(<CardAlbum album={album} modo="miniatura" />);
    expect(container.querySelector('img')?.getAttribute('src')).toContain('/photos/12/');
    rerender(<CardAlbum album={album} modo="poster" />);
    expect(container.querySelector('img')?.getAttribute('src')).toContain('/photos/10/');
  });
});
