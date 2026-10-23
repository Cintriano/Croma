// Fase 1 no desktop: do caminho no disco até ver, pesquisar, editar e ocultar.
import { expect, test } from '@playwright/test';
import { garantirBiblioteca, raizFotos } from './apoio';

let bibliotecaId: number;
test.beforeAll(async ({ request }) => {
  bibliotecaId = await garantirBiblioteca(request);
});

test('criar biblioteca de Fotos pela interface, com prévia dos álbuns', async ({ page }) => {
  await page.goto('/configuracoes/bibliotecas');
  await page.getByRole('button', { name: 'Nova biblioteca' }).click();
  await page.getByLabel('Tipo').selectOption('fotos');
  await page.getByLabel('Nome').fill('Fotos pela interface');
  await page.getByLabel('Caminho').fill(raizFotos());
  await expect(page.getByRole('list', { name: 'Álbuns encontrados' }).getByRole('listitem')).toHaveCount(4);
  await expect(page.getByText(/Nivel_4/)).toBeVisible();
  await page.getByRole('button', { name: 'Salvar' }).click();
  await page.goto('/');
  await expect(page.getByRole('link', { name: /Fotos pela interface/ })).toBeVisible();
});

test('página do álbum mostra contagem por nível e filtra ao clicar', async ({ page }) => {
  await page.goto(`/biblioteca/${bibliotecaId}`);
  await page.getByRole('link', { name: /Viagem Nordeste/ }).click();
  await expect(page.getByRole('button', { name: /nível 1: 2 fotos/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /sem nível 1/i })).toBeVisible();
  await page.getByRole('button', { name: /nível 1: 2 fotos/i }).click();
  await expect(page.getByRole('list', { name: 'Fotos' }).getByRole('listitem')).toHaveCount(2);
});

test('clicar na foto expande, setas navegam, Voltar e Esc fecham', async ({ page }) => {
  await page.goto(`/biblioteca/${bibliotecaId}`);
  await page.getByRole('link', { name: /Viagem Nordeste/ }).click();
  const urlAlbum = page.url();
  await page.getByRole('list', { name: 'Fotos' }).getByRole('listitem').first().click();
  const dialogo = page.getByRole('dialog');
  await expect(dialogo).toBeVisible();
  await expect(page).toHaveURL(/\/foto\/\d+$/);
  await page.keyboard.press('ArrowRight');
  await expect(dialogo.getByText('2 / 5')).toBeVisible();
  await page.goBack();
  await expect(dialogo).toBeHidden();
  await expect(page).toHaveURL(urlAlbum);
  await page.getByRole('list', { name: 'Fotos' }).getByRole('listitem').first().click();
  await page.keyboard.press('Escape');
  await expect(dialogo).toBeHidden();
});

test('link direto para uma foto abre o visualizador nela', async ({ page, request }) => {
  const { colecoes } = await (await request.get(`/api/libraries/${bibliotecaId}/collections`)).json();
  const album = colecoes.find((c: any) => c.nome === 'Viagem Nordeste');
  const { fotos } = await (await request.get(`/api/collections/${album.id}/photos`)).json();
  await page.goto(`/album/${album.id}/viagem-nordeste/foto/${fotos[2].id}`);
  await expect(page.getByRole('dialog', { name: fotos[2].nome })).toBeVisible();
});

test('pesquisa por tags de álbuns e de fotos com herança', async ({ page }) => {
  await page.goto(`/biblioteca/${bibliotecaId}`);
  const campo = page.getByRole('combobox', { name: /tags/i });
  await campo.click();
  await page.getByRole('option', { name: /^família/ }).first().click();
  await expect(page.getByRole('list', { name: 'Álbuns' }).getByRole('listitem')).toHaveCount(2);
  await expect(page).toHaveURL(/tags=fam/);

  await page.getByRole('radio', { name: 'Fotos' }).click();
  await campo.fill('mar');
  await page.keyboard.press('Enter');
  await campo.fill('nordeste');
  await page.keyboard.press('Enter');
  await page.getByRole('button', { name: /remover família/i }).click();
  await expect(page.getByRole('list', { name: 'Fotos' }).getByRole('listitem')).toHaveCount(1);
});

test('editar tags pelo ⚙ escolhendo uma tag existente', async ({ page }) => {
  await page.goto(`/biblioteca/${bibliotecaId}`);
  await page.getByRole('link', { name: /Aniversário 2025/ }).click();
  await page.getByRole('button', { name: 'Configurar álbum' }).click();
  await page.getByRole('combobox', { name: /tags/i }).click();
  await expect(page.getByRole('listbox').getByText('Mais usadas')).toBeVisible();
  await page.getByRole('option', { name: /^praia/ }).first().click();
  await page.getByRole('button', { name: 'Salvar' }).click();
  await expect(page.getByText('praia')).toBeVisible();
});

test('ocultar álbum e vê-lo com "Mostrar ocultos"', async ({ page }) => {
  await page.goto(`/biblioteca/${bibliotecaId}`);
  await page.getByRole('link', { name: /Sem Metadados/ }).click();
  await page.getByRole('button', { name: 'Configurar álbum' }).click();
  await page.getByLabel('Ocultar este álbum').check();
  await page.getByRole('button', { name: 'Salvar' }).click();
  await page.goto(`/biblioteca/${bibliotecaId}`);
  await expect(page.getByRole('link', { name: /Sem Metadados/ })).toHaveCount(0);
  await page.getByRole('button', { name: 'Mostrar ocultos' }).click();
  await expect(page.getByRole('article', { name: /Sem Metadados/ })).toHaveAttribute('data-oculto', 'true');
  await page.reload();
  await expect(page.getByRole('link', { name: /Sem Metadados/ })).toHaveCount(0);
});

test('trocar o poster pelo ⚙ escolhendo outra foto do álbum', async ({ page }) => {
  await page.goto(`/biblioteca/${bibliotecaId}`);
  await page.getByRole('link', { name: /Viagem Nordeste/ }).click();
  const poster = page.locator('.cabecalho-album .poster img');
  const antes = await poster.getAttribute('src');
  await page.getByRole('button', { name: 'Configurar álbum' }).click();
  await page.getByRole('button', { name: 'Trocar' }).first().click();
  await page.getByRole('button', { name: 'Usar IMG_0042.jpg como poster' }).click();
  await page.getByRole('button', { name: 'Salvar' }).click();
  await expect(poster).not.toHaveAttribute('src', antes!);
  await page.reload();
  await expect(poster).not.toHaveAttribute('src', antes!);
});

test('exibir álbuns como poster ou miniatura, lembrando a escolha', async ({ page }) => {
  await page.goto(`/biblioteca/${bibliotecaId}`);
  const card = page.getByRole('article', { name: /Viagem Nordeste/ });
  await expect(card).toHaveClass(/card-miniatura/);
  await page.getByRole('group', { name: 'Exibir álbuns como' }).getByRole('button', { name: 'Poster' }).click();
  await expect(card).toHaveClass(/card-poster/);
  await page.reload();
  await expect(card).toHaveClass(/card-poster/);
  await page.getByRole('group', { name: 'Exibir álbuns como' }).getByRole('button', { name: 'Miniatura' }).click();
  await expect(card).toHaveClass(/card-miniatura/);
});

test('Slides abre em tela cheia e Aleatório sorteia uma foto', async ({ page }) => {
  await page.goto(`/biblioteca/${bibliotecaId}`);
  await page.getByRole('link', { name: /Viagem Nordeste/ }).click();
  await page.getByRole('button', { name: 'Aleatório' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: /Slides/ }).click();
  await page.getByRole('menuitem', { name: 'Sequência' }).click();
  await expect(page.getByRole('dialog', { name: /apresentação/i })).toBeVisible();
});

test('barra no topo: Voltar volta, Início e Configurações navegam', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Voltar' })).toBeDisabled();
  await page.getByRole('link', { name: 'Configurações' }).click();
  await expect(page).toHaveURL(/\/configuracoes/);
  await page.getByRole('button', { name: 'Voltar' }).click();
  await expect(page).toHaveURL(/\/$/);
  await page.goto(`/biblioteca/${bibliotecaId}`);
  await page.getByRole('link', { name: 'Início' }).click();
  await expect(page).toHaveURL(/\/$/);
  await page.goto(`/biblioteca/${bibliotecaId}`);
  await page.getByRole('button', { name: 'Voltar' }).click();
  await expect(page).toHaveURL(/\/$/);
});
