// M1 — Metadados e tags: normalização, leitura e gravação do colecao.json, gravação atômica.
import { beforeEach, describe, expect, it } from 'vitest';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { chaveBusca, normalizarTag, normalizarTags } from '../../server/src/metadados/tags';
import { atualizarColecao, gravarColecao, lerColecao } from '../../server/src/metadados/colecao';
import { gravarJsonAtomico } from '../../server/src/metadados/gravacaoAtomica';
import { criarPastaTemp } from '../ajuda/fixtures';

describe('M1 · normalização de tags', () => {
  it('deixa em minúsculas e tira espaços das pontas', () => {
    expect(normalizarTag('  Praia ')).toBe('praia');
  });

  it('mantém acentos e espaços internos', () => {
    expect(normalizarTag('Pôr do Sol')).toBe('pôr do sol');
  });

  it('junta espaços internos repetidos', () => {
    expect(normalizarTag('pôr   do  sol')).toBe('pôr do sol');
  });

  it('descarta tag vazia', () => {
    expect(normalizarTag('   ')).toBeNull();
  });

  it('remove repetições mantendo a ordem da primeira aparição', () => {
    expect(normalizarTags(['Praia', 'família', 'praia ', 'FAMÍLIA', ''])).toEqual(['praia', 'família']);
  });

  it('chave de busca ignora maiúsculas e acentos', () => {
    expect(chaveBusca('Família')).toBe('familia');
    expect(chaveBusca('Pôr do Sol')).toBe(chaveBusca('por do sol'));
  });
});

describe('M1 · colecao.json', () => {
  let pastaAlbum: string;
  beforeEach(async () => {
    pastaAlbum = path.join(await criarPastaTemp(), 'Viagem');
    await mkdir(pastaAlbum);
  });

  const arquivoColecao = () => path.join(pastaAlbum, 'metadados', 'colecao.json');

  it('álbum sem metadados retorna dados nulos e sem aviso', async () => {
    expect(await lerColecao(pastaAlbum)).toEqual({ dados: null, aviso: null });
  });

  it('JSON inválido retorna aviso json-invalido', async () => {
    await mkdir(path.dirname(arquivoColecao()));
    await writeFile(arquivoColecao(), '{ "titulo": ');
    const { dados, aviso } = await lerColecao(pastaAlbum);
    expect(dados).toBeNull();
    expect(aviso?.tipo).toBe('json-invalido');
  });

  it('normaliza tags e assume oculto = false na leitura', async () => {
    await mkdir(path.dirname(arquivoColecao()));
    await writeFile(arquivoColecao(), JSON.stringify({ titulo: 'Viagem', tags: ['Praia', 'praia'] }));
    const { dados } = await lerColecao(pastaAlbum);
    expect(dados).toMatchObject({ titulo: 'Viagem', tags: ['praia'], oculto: false });
  });

  it('aceita JSON com BOM (salvo pelo Bloco de Notas)', async () => {
    await mkdir(path.dirname(arquivoColecao()));
    await writeFile(arquivoColecao(), '﻿' + JSON.stringify({ titulo: 'Com BOM' }));
    const { dados } = await lerColecao(pastaAlbum);
    expect(dados?.titulo).toBe('Com BOM');
  });

  it('gravar cria a pasta metadados e normaliza as tags', async () => {
    await gravarColecao(pastaAlbum, { titulo: 'Viagem', tags: ['Mar', 'mar '] });
    const salvo = JSON.parse(await readFile(arquivoColecao(), 'utf8'));
    expect(salvo).toMatchObject({ titulo: 'Viagem', tags: ['mar'] });
  });

  it('atualizar mescla e preserva campos desconhecidos', async () => {
    await mkdir(path.dirname(arquivoColecao()));
    await writeFile(arquivoColecao(), JSON.stringify({ titulo: 'Viagem', nome: 'Ana', cabelo: 'cacheado', tags: ['praia'] }));
    await atualizarColecao(pastaAlbum, { oculto: true, tags: ['praia', 'verão'] });
    const salvo = JSON.parse(await readFile(arquivoColecao(), 'utf8'));
    expect(salvo).toEqual({ titulo: 'Viagem', nome: 'Ana', cabelo: 'cacheado', tags: ['praia', 'verão'], oculto: true });
  });

  it('não grava oculto = false quando o campo não existia', async () => {
    await gravarColecao(pastaAlbum, { titulo: 'Viagem', tags: [] });
    await atualizarColecao(pastaAlbum, { titulo: 'Viagem 2' });
    const salvo = JSON.parse(await readFile(arquivoColecao(), 'utf8'));
    expect(salvo).not.toHaveProperty('oculto');
  });
});

describe('M1 · gravação atômica', () => {
  it('grava JSON formatado em UTF-8 sem BOM e sem deixar temporários', async () => {
    const pasta = await criarPastaTemp();
    const arquivo = path.join(pasta, 'dados.json');
    await gravarJsonAtomico(arquivo, { tag: 'família' });
    const bruto = await readFile(arquivo);
    expect(bruto[0]).not.toBe(0xef);
    expect(bruto.toString('utf8')).toBe('{\n  "tag": "família"\n}\n');
    expect(await readdir(pasta)).toEqual(['dados.json']);
  });

  it('se a serialização falhar, o arquivo original fica intacto', async () => {
    const pasta = await criarPastaTemp();
    const arquivo = path.join(pasta, 'dados.json');
    await writeFile(arquivo, '{"original":true}');
    const circular: any = {};
    circular.eu = circular;
    await expect(gravarJsonAtomico(arquivo, circular)).rejects.toThrow();
    expect(await readFile(arquivo, 'utf8')).toBe('{"original":true}');
    expect(await readdir(pasta)).toEqual(['dados.json']);
  });
});
