// Biblioteca de músicas: varredura das pastas, capas, descrição e rotas com streaming.
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { construirApp } from '../../server/src/app';
import { varrerMusicas } from '../../server/src/musicas/varredura';
import { criarJpeg, criarPastaTemp } from '../ajuda/fixtures';

type App = Awaited<ReturnType<typeof construirApp>>;

let raiz: string;
let app: App;
let bibliotecaId: number;

const audio = Buffer.from('0123456789'.repeat(10)); // 100 bytes: o conteúdo não importa, só o Range

beforeAll(async () => {
  raiz = await criarPastaTemp('musicas-');
  const faz = async (...partes: string[]) => mkdir(path.join(raiz, ...partes), { recursive: true });
  const arquivo = (partes: string[], conteudo: Buffer | string) => writeFile(path.join(raiz, ...partes), conteudo);
  const imagem = (...partes: string[]) => criarJpeg(path.join(raiz, ...partes), { largura: 40, altura: 40 });

  await faz('Rock', 'metadados');
  await arquivo(['Rock', 'Faixa 10.mp3'], audio);
  await arquivo(['Rock', 'Faixa 2.mp3'], audio);
  await imagem(...['Rock', 'metadados', 'Capa.jpg']);
  await arquivo(['Rock', 'metadados', 'descricao.txt'], 'Rock pesado.');

  await faz('Artistas', 'Avicii', 'Metadados'); // outra capitalização
  await arquivo(['Artistas', 'Avicii', 'Levels.mp3'], audio);
  await arquivo(['Artistas', 'Avicii', 'Metadados', 'detalhes.json'], '{}');

  await faz('Solto');
  await arquivo(['Solto', 'Musica.mp3'], audio);
  await imagem(...['Solto', 'IMG_1.jpg']); // imagem solta vira capa

  await faz('SoImagem');
  await imagem(...['SoImagem', 'IMG_2.jpg']); // sem áudio: não é álbum
  await arquivo(['SoImagem', 'leia.txt'], 'x');
  await arquivo(['Raiz.mp3'], audio); // áudio solto na raiz: sem álbum para ficar

  app = await construirApp({ caminhoBanco: ':memory:', caminhoCache: await criarPastaTemp('cache-') });
  const r = await app.inject({ method: 'POST', url: '/api/libraries', payload: { nome: 'Músicas', tipo: 'musicas', caminho: raiz } });
  expect(r.statusCode).toBe(201);
  bibliotecaId = r.json().id;
});
afterAll(async () => {
  await app.close();
});

describe('duração das músicas', () => {
  it('faixa que não é áudio de verdade fica sem duração e o álbum soma 0', async () => {
    const { albuns } = await varrerMusicas(raiz);
    const rock = albuns.find((a) => a.titulo === 'Rock')!;
    expect(rock.faixas.every((f) => f.duracao === null)).toBe(true);
    expect(rock.duracaoTotal).toBe(0);
  });
});

describe('varredura de músicas', () => {
  it('cada pasta com áudio vira um álbum; pasta só com imagem e áudio na raiz não', async () => {
    const { albuns } = await varrerMusicas(raiz);
    expect(albuns.map((a) => a.titulo).sort()).toEqual(['Avicii', 'Rock', 'Solto']);
  });

  it('subpastas formam o grupo do álbum e a pasta metadados é ignorada em qualquer capitalização', async () => {
    const { albuns } = await varrerMusicas(raiz);
    const avicii = albuns.find((a) => a.titulo === 'Avicii')!;
    expect(avicii.grupo).toBe('Artistas');
    expect(avicii.faixas.map((f) => f.titulo)).toEqual(['Levels']);
    expect(albuns.find((a) => a.titulo === 'Rock')!.grupo).toBeNull();
  });

  it('faixas em ordem natural, com capa e descrição de metadados', async () => {
    const { albuns, arquivos } = await varrerMusicas(raiz);
    const rock = albuns.find((a) => a.titulo === 'Rock')!;
    expect(rock.faixas.map((f) => f.titulo)).toEqual(['Faixa 2', 'Faixa 10']);
    expect(rock.descricao).toBe('Rock pesado.');
    expect(arquivos.get(rock.capaId!)?.caminho).toContain('Capa.jpg');
  });

  it('sem metadados, a primeira imagem da pasta é a capa; sem imagem, não há capa', async () => {
    const { albuns } = await varrerMusicas(raiz);
    expect(albuns.find((a) => a.titulo === 'Solto')!.capaId).not.toBeNull();
    expect(albuns.find((a) => a.titulo === 'Avicii')!.capaId).toBeNull();
  });
});

describe('rotas de músicas', () => {
  it('a biblioteca aparece na lista com a contagem de álbuns', async () => {
    const r = await app.inject('/api/libraries');
    const b = r.json().bibliotecas.find((x: any) => x.id === bibliotecaId);
    expect(b).toMatchObject({ tipo: 'musicas', totalColecoes: 3 });
  });

  it('prévia de músicas lista os álbuns com o grupo', async () => {
    const r = await app.inject({ method: 'POST', url: '/api/libraries/previa', payload: { caminho: raiz, tipo: 'musicas' } });
    expect(r.json().albuns).toContain('Artistas / Avicii');
  });

  it('lista os álbuns e abre um com as faixas', async () => {
    const lista = (await app.inject(`/api/libraries/${bibliotecaId}/music`)).json().albuns;
    expect(lista).toHaveLength(3);
    expect(lista[0].faixas).toBeUndefined();
    const rock = lista.find((a: any) => a.titulo === 'Rock');
    const aberto = (await app.inject(`/api/libraries/${bibliotecaId}/music/albums/${rock.id}`)).json().album;
    expect(aberto.faixas).toHaveLength(2);
    expect(aberto.totalFaixas).toBe(2);
  });

  it('serve a faixa inteira e com Range', async () => {
    const lista = (await app.inject(`/api/libraries/${bibliotecaId}/music`)).json().albuns;
    const rock = (await app.inject(`/api/libraries/${bibliotecaId}/music/albums/${lista.find((a: any) => a.titulo === 'Rock').id}`)).json().album;
    const url = `/api/libraries/${bibliotecaId}/music/files/${rock.faixas[0].id}`;
    const inteira = await app.inject(url);
    expect(inteira.statusCode).toBe(200);
    expect(inteira.headers['content-type']).toBe('audio/mpeg');
    expect(inteira.rawPayload).toHaveLength(100);
    const parte = await app.inject({ url, headers: { range: 'bytes=10-19' } });
    expect(parte.statusCode).toBe(206);
    expect(parte.headers['content-range']).toBe('bytes 10-19/100');
    expect(parte.body).toBe('0123456789');
  });

  it('serve a capa redimensionada em JPEG', async () => {
    const lista = (await app.inject(`/api/libraries/${bibliotecaId}/music`)).json().albuns;
    const rock = lista.find((a: any) => a.titulo === 'Rock');
    const r = await app.inject(`/api/libraries/${bibliotecaId}/music/capas/${rock.capaId}?w=300`);
    expect(r.statusCode).toBe(200);
    expect(r.headers['content-type']).toBe('image/jpeg');
  });

  it('id desconhecido, capa pedida como faixa e biblioteca de fotos respondem 404', async () => {
    expect((await app.inject(`/api/libraries/${bibliotecaId}/music/files/naoexiste`)).statusCode).toBe(404);
    const lista = (await app.inject(`/api/libraries/${bibliotecaId}/music`)).json().albuns;
    const capaId = lista.find((a: any) => a.titulo === 'Rock').capaId;
    expect((await app.inject(`/api/libraries/${bibliotecaId}/music/files/${capaId}`)).statusCode).toBe(404);
    expect((await app.inject('/api/libraries/999/music')).statusCode).toBe(404);
  });

  it('varredura geral não quebra com biblioteca de músicas', async () => {
    const r = await app.inject({ method: 'POST', url: '/api/scan', payload: {} });
    expect(r.statusCode).toBe(200);
  });
});
