// M2 — Varredura de Fotos: álbuns, níveis, contagens, avisos, EXIF e varredura incremental.
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { rm, utimes } from 'node:fs/promises';
import path from 'node:path';
import { classificarSubpasta } from '../../server/src/fotos/niveis';
import { previaBibliotecaFotos, varrerBibliotecaFotos, type ResultadoVarredura } from '../../server/src/fotos/varredura';
import { lerExif } from '../../server/src/imagens/exif';
import { criarBibliotecaFotos, criarBibliotecaPadrao, criarJpeg, criarPastaTemp, type BibliotecaFixture } from '../ajuda/fixtures';

describe('M2 · subpastas do álbum', () => {
  it.each([
    ['Nivel_1', { tipo: 'nivel', nivel: 1 }],
    ['Nivel_2', { tipo: 'nivel', nivel: 2 }],
    ['Nivel_3', { tipo: 'nivel', nivel: 3 }],
    ['nivel_2', { tipo: 'nivel', nivel: 2 }],
    ['metadados', { tipo: 'metadados' }],
    ['Nivel_4', { tipo: 'ignorada' }],
    ['Nivel_0', { tipo: 'ignorada' }],
    ['Extras', { tipo: 'ignorada' }],
  ])('%s → %o', (nome, esperado) => {
    expect(classificarSubpasta(nome)).toEqual(esperado);
  });
});

describe('M2 · varredura da biblioteca padrão', () => {
  let biblioteca: BibliotecaFixture;
  let resultado: ResultadoVarredura;
  const album = (nome: string) => resultado.albuns.find((a) => a.nome === nome)!;

  beforeAll(async () => {
    biblioteca = await criarBibliotecaPadrao();
    resultado = await varrerBibliotecaFotos(biblioteca.raiz);
  });
  afterAll(() => biblioteca.limpar());

  it('cada subpasta direta é um álbum, em ordem alfabética', () => {
    expect(resultado.albuns.map((a) => a.nome)).toEqual(['Aniversario 2025', 'Neve', 'Sem Metadados', 'Viagem Nordeste']);
  });

  it('título vem do colecao.json ou, se faltar, do nome da pasta', () => {
    expect(album('Aniversario 2025').titulo).toBe('Aniversário 2025');
    expect(album('Sem Metadados').titulo).toBe('Sem Metadados');
  });

  it('conta as fotos por nível, com as soltas como sem nível', () => {
    expect(album('Viagem Nordeste').contagem).toEqual({ total: 5, nivel1: 2, nivel2: 1, nivel3: 1, semNivel: 1 });
    expect(album('Aniversario 2025').contagem).toEqual({ total: 3, nivel1: 1, nivel2: 2, nivel3: 0, semNivel: 0 });
  });

  it('atribui o nível pelo nome da pasta e usa caminho relativo com barras normais', () => {
    const fotos = album('Viagem Nordeste').fotos;
    expect(fotos.find((f) => f.caminhoRelativo === 'Nivel_2/IMG_0042.jpg')?.nivel).toBe(2);
    expect(fotos.find((f) => f.caminhoRelativo === 'solta.jpg')?.nivel).toBeNull();
  });

  it('aceita extensões em maiúsculas', () => {
    expect(album('Viagem Nordeste').fotos.map((f) => f.caminhoRelativo)).toContain('Nivel_1/IMG_0002.JPG');
  });

  it('ignora arquivos que não são foto (txt, ts)', () => {
    const caminhos = album('Viagem Nordeste').fotos.map((f) => f.caminhoRelativo);
    expect(caminhos.some((c) => c.endsWith('.txt') || c.endsWith('.ts'))).toBe(false);
  });

  it('ignora Nivel_4 e Extras e gera um aviso para cada', () => {
    const caminhos = album('Viagem Nordeste').fotos.map((f) => f.caminhoRelativo);
    expect(caminhos.some((c) => c.startsWith('Nivel_4/') || c.startsWith('Extras/'))).toBe(false);
    const ignoradas = resultado.avisos.filter((a) => a.tipo === 'pasta-ignorada').map((a) => path.basename(a.caminho));
    expect(ignoradas.sort()).toEqual(['Extras', 'Nivel_4']);
  });

  it('não trata a pasta metadados como fotos e avisa álbum sem metadados', () => {
    expect(album('Viagem Nordeste').fotos.some((f) => f.caminhoRelativo.startsWith('metadados'))).toBe(false);
    expect(resultado.avisos.some((a) => a.tipo === 'sem-metadados' && a.caminho.endsWith('Sem Metadados'))).toBe(true);
  });

  it('lê o oculto do colecao.json', () => {
    expect(album('Neve').colecao?.oculto).toBe(true);
    expect(album('Viagem Nordeste').colecao?.oculto).toBe(false);
  });

  it('carrega o fotos.json do álbum', () => {
    expect(album('Viagem Nordeste').fotosJson.fotos['Nivel_1/IMG_0001.jpg'].tags).toEqual(['mar', 'pôr do sol']);
    expect(album('Sem Metadados').fotosJson).toEqual({ versao: 1, fotos: {} });
  });

  it('guarda tamanho e data de modificação de cada foto', () => {
    const foto = album('Aniversario 2025').fotos[0];
    expect(foto.tamanho).toBeGreaterThan(0);
    expect(foto.modificadoEm).toBeGreaterThan(0);
  });
});

describe('M2 · prévia e erros', () => {
  it('prévia lista os álbuns e avisos sem ler as fotos', async () => {
    const biblioteca = await criarBibliotecaPadrao();
    const previa = await previaBibliotecaFotos(biblioteca.raiz);
    expect(previa.albuns).toEqual(['Aniversario 2025', 'Neve', 'Sem Metadados', 'Viagem Nordeste']);
    expect(previa.avisos.length).toBeGreaterThan(0);
    await biblioteca.limpar();
  });

  it('caminho inexistente gera erro de caminho inválido', async () => {
    await expect(varrerBibliotecaFotos('Z:/nao/existe')).rejects.toMatchObject({ codigo: 'caminho-invalido' });
  });

  it('caminho vazio resulta em biblioteca sem álbuns', async () => {
    const resultado = await varrerBibliotecaFotos(await criarPastaTemp());
    expect(resultado.albuns).toEqual([]);
  });
});

describe('M2 · varredura incremental', () => {
  it('compara com a anterior e lista novas, alteradas e removidas', async () => {
    const biblioteca = await criarBibliotecaFotos([{ nome: 'A', fotos: { Nivel_1: ['1.jpg', '2.jpg', '3.jpg'] } }]);
    const pasta = path.join(biblioteca.raiz, 'A', 'Nivel_1');
    const anterior = await varrerBibliotecaFotos(biblioteca.raiz);

    const semMudanca = await varrerBibliotecaFotos(biblioteca.raiz, { anterior });
    expect(semMudanca.alteracoes).toEqual({ novas: [], alteradas: [], removidas: [] });

    await criarJpeg(path.join(pasta, '4.jpg'));
    await rm(path.join(pasta, '2.jpg'));
    const futuro = new Date(Date.now() + 60_000);
    await utimes(path.join(pasta, '3.jpg'), futuro, futuro);

    const depois = await varrerBibliotecaFotos(biblioteca.raiz, { anterior });
    expect(depois.alteracoes).toEqual({
      novas: ['A/Nivel_1/4.jpg'],
      alteradas: ['A/Nivel_1/3.jpg'],
      removidas: ['A/Nivel_1/2.jpg'],
    });
    await biblioteca.limpar();
  });
});

describe('M2 · EXIF', () => {
  it('lê câmera sem repetir a marca e a orientação', async () => {
    const arquivo = path.join(await criarPastaTemp(), 'f.jpg');
    await criarJpeg(arquivo, { camera: { marca: 'Canon', modelo: 'Canon EOS R6' }, orientacao: 6 });
    const exif = await lerExif(arquivo);
    expect(exif.camera).toBe('Canon EOS R6');
    expect(exif.orientacao).toBe(6);
  });

  it('junta marca e modelo quando o modelo não traz a marca', async () => {
    const arquivo = path.join(await criarPastaTemp(), 'f.jpg');
    await criarJpeg(arquivo, { camera: { marca: 'SONY', modelo: 'ILCE-7M3' } });
    expect((await lerExif(arquivo)).camera).toBe('SONY ILCE-7M3');
  });

  it('foto sem EXIF retorna campos nulos em vez de erro', async () => {
    const arquivo = path.join(await criarPastaTemp(), 'f.jpg');
    await criarJpeg(arquivo);
    expect(await lerExif(arquivo)).toEqual({ camera: null, orientacao: null, dataCaptura: null });
  });
});
