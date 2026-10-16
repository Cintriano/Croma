// Fase 2 na TV (simulada com teclado no Chromium; validar depois na QN90B real).
import { expect, test } from '@playwright/test';
import { garantirBiblioteca } from './apoio';

let bibliotecaId: number;
test.beforeAll(async ({ request }) => {
  bibliotecaId = await garantirBiblioteca(request);
});

const focado = (page: import('@playwright/test').Page) => page.locator(':focus');

test('setas movem o foco e OK abre o álbum; Voltar devolve o foco', async ({ page }) => {
  await page.goto(`/tv/biblioteca/${bibliotecaId}`);
  await expect(focado(page)).toHaveAccessibleName(/Slides/);
  await page.keyboard.press('ArrowDown');
  await expect(focado(page)).toHaveAccessibleName(/Aniversário 2025/);
  await page.keyboard.press('ArrowRight');
  const nome = await focado(page).getAttribute('aria-label');
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/tv\/album\//);
  await expect(focado(page)).toHaveAccessibleName(/Slides/);
  await page.keyboard.press('Escape');
  await expect(focado(page)).toHaveAttribute('aria-label', nome!);
});

test('TV não mostra configurações, ⚙ nem campo de texto', async ({ page }) => {
  await page.goto(`/tv/biblioteca/${bibliotecaId}`);
  await expect(page.getByRole('button', { name: 'Configurar álbum' })).toHaveCount(0);
  await expect(page.getByRole('link', { name: /Configurações/ })).toHaveCount(0);
  await expect(page.locator('input[type="text"], input:not([type])')).toHaveCount(0);
});

test('pesquisa por tags na TV usa grade de tags', async ({ page }) => {
  await page.goto(`/tv/biblioteca/${bibliotecaId}`);
  await page.getByRole('button', { name: 'Tags' }).focus();
  await page.keyboard.press('Enter');
  const grade = page.getByRole('grid', { name: 'Tags' });
  await expect(grade).toBeVisible();
  await page.keyboard.press('Enter');
  await expect(grade.getByRole('gridcell', { selected: true })).toHaveCount(1);
});

test('no visualizador, ← → trocam a foto e Voltar fecha', async ({ page }) => {
  await page.goto(`/tv/biblioteca/${bibliotecaId}`);
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('Enter');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  const dialogo = page.getByRole('dialog');
  await expect(dialogo).toBeVisible();
  await page.keyboard.press('ArrowRight');
  await expect(dialogo.getByText(/^2 \//)).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(dialogo).toBeHidden();
});
