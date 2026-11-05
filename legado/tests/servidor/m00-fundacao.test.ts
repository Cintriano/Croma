// M0 — Fundação: servidor sobe, banco migra, configuração tem padrões.
import { afterEach, describe, expect, it } from 'vitest';
import { construirApp } from '../../server/src/app';
import { abrirBanco, versaoDoBanco } from '../../server/src/db/banco';
import { carregarConfig } from '../../server/src/config';
import { criarPastaTemp } from '../ajuda/fixtures';
import path from 'node:path';

describe('M0 · configuração', () => {
  it('usa padrões quando não há variáveis de ambiente', () => {
    const config = carregarConfig({});
    expect(config.porta).toBe(8001);
    expect(config.caminhoBanco).toMatch(/central-midia\.sqlite$/);
    expect(config.caminhoCache).toBeTruthy();
  });

  it('lê porta, banco e cache das variáveis de ambiente', () => {
    const config = carregarConfig({ PORTA: '9000', CAMINHO_BANCO: ':memory:', CAMINHO_CACHE: 'C:/cache' });
    expect(config).toMatchObject({ porta: 9000, caminhoBanco: ':memory:', caminhoCache: 'C:/cache' });
  });

  it('recusa porta inválida', () => {
    expect(() => carregarConfig({ PORTA: 'abc' })).toThrow(/porta/i);
  });
});

describe('M0 · banco', () => {
  it('aplica as migrações num banco novo', () => {
    const db = abrirBanco(':memory:');
    expect(versaoDoBanco(db)).toBeGreaterThan(0);
    const tabelas = db
      .prepare("SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name")
      .all()
      .map((linha: any) => linha.name);
    expect(tabelas).toEqual(expect.arrayContaining(['bibliotecas', 'albuns', 'fotos', 'album_tags', 'foto_tags']));
  });

  it('abrir o mesmo arquivo duas vezes não reaplica migrações', async () => {
    const arquivo = path.join(await criarPastaTemp(), 'teste.sqlite');
    const v1 = versaoDoBanco(abrirBanco(arquivo));
    const v2 = versaoDoBanco(abrirBanco(arquivo));
    expect(v2).toBe(v1);
  });
});

describe('M0 · servidor', () => {
  let app: Awaited<ReturnType<typeof construirApp>> | undefined;
  afterEach(async () => app?.close());

  it('GET /api/saude responde ok', async () => {
    app = await construirApp({ caminhoBanco: ':memory:', caminhoCache: await criarPastaTemp() });
    const resposta = await app.inject({ method: 'GET', url: '/api/saude' });
    expect(resposta.statusCode).toBe(200);
    expect(resposta.json()).toEqual({ status: 'ok' });
  });

  it('rota desconhecida da API responde 404 em JSON', async () => {
    app = await construirApp({ caminhoBanco: ':memory:', caminhoCache: await criarPastaTemp() });
    const resposta = await app.inject({ method: 'GET', url: '/api/nao-existe' });
    expect(resposta.statusCode).toBe(404);
    expect(resposta.headers['content-type']).toMatch(/json/);
  });
});
