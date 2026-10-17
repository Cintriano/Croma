// Fase 2 no celular: mesma navegação, sem configurações e com gestos.
import { expect, test } from '@playwright/test';
import { garantirBiblioteca } from './apoio';

let bibliotecaId: number;
test.beforeAll(async ({ request }) => {
  bibliotecaId = await garantirBiblioteca(request);
});

test('barra no topo com voltar e Início, sem Configurações no celular', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('navigation', { name: 'Navegação principal' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Voltar' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Configurações' })).toHaveCount(0);
  await expect(page.getByRole('navigation', { name: 'Bibliotecas' })).toBeHidden();
});

test('álbum não tem botão ⚙ no celular', async ({ page }) => {
  await page.goto(`/biblioteca/${bibliotecaId}`);
  await page.getByRole('link', { name: /Viagem Nordeste/ }).tap();
  await expect(page.getByRole('button', { name: 'Configurar álbum' })).toHaveCount(0);
});

test('tocar na foto expande e deslizar troca de foto', async ({ page }) => {
  await page.goto(`/biblioteca/${bibliotecaId}`);
  await page.getByRole('link', { name: /Viagem Nordeste/ }).tap();
  await page.getByRole('list', { name: 'Fotos' }).getByRole('listitem').first().tap();
  const dialogo = page.getByRole('dialog');
  await expect(dialogo.getByText('1 / 5')).toBeVisible();
  const caixa = (await dialogo.boundingBox())!;
  await dialogo.dispatchEvent('touchstart', { touches: [{ identifier: 1, clientX: caixa.width * 0.8, clientY: caixa.height / 2 }] });
  await dialogo.dispatchEvent('touchend', { changedTouches: [{ identifier: 1, clientX: caixa.width * 0.2, clientY: caixa.height / 2 }] });
  await expect(dialogo.getByText('2 / 5')).toBeVisible();
});
