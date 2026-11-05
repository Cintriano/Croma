import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import type { FastifyInstance } from 'fastify';
import { obterBiblioteca } from '../db/repositorio';
import { gerarVersoes, LARGURAS_PADRAO } from '../imagens/cache';
import { musicasDaBiblioteca } from '../musicas/varredura';
import { enviarComRange } from './arquivos';
import { ErroHttp, lerId, naoEncontrado, pedidoInvalido } from './erros';

export async function rotasMusicas(api: FastifyInstance) {
  const { db } = api;

  const musicas = async (id: unknown) => {
    const biblioteca = obterBiblioteca(db, lerId(id));
    if (!biblioteca || biblioteca.tipo !== 'musicas') throw naoEncontrado('Biblioteca de músicas');
    return { biblioteca, ...(await musicasDaBiblioteca(biblioteca.caminho)) };
  };

  api.get<{ Params: { id: string } }>('/libraries/:id/music', async (req) => {
    const { albuns } = await musicas(req.params.id);
    return {
      albuns: albuns.map(({ faixas, ...album }) => ({ ...album, totalFaixas: faixas.length })),
    };
  });

  api.get<{ Params: { id: string; albumId: string } }>('/libraries/:id/music/albums/:albumId', async (req) => {
    const { albuns } = await musicas(req.params.id);
    const album = albuns.find((a) => a.id === req.params.albumId);
    if (!album) throw naoEncontrado('Álbum');
    return { album: { ...album, totalFaixas: album.faixas.length } };
  });

  // Faixa de áudio, com HTTP Range para o player poder avançar e voltar.
  api.get<{ Params: { id: string; arquivoId: string } }>('/libraries/:id/music/files/:arquivoId', async (req, res) => {
    const { arquivos } = await musicas(req.params.id);
    const arquivo = arquivos.get(req.params.arquivoId);
    if (!arquivo || arquivo.tipo === 'image') throw naoEncontrado('Faixa');
    const info = await stat(arquivo.caminho).catch(() => {
      throw new ErroHttp(404, 'indisponivel', 'O arquivo não está acessível (disco desconectado?).');
    });
    return enviarComRange(res, arquivo.caminho, info.size, arquivo.tipo, req.headers.range);
  });

  // Capa do álbum redimensionada (as originais podem ter vários MB).
  api.get<{ Params: { id: string; arquivoId: string }; Querystring: { w?: string } }>('/libraries/:id/music/capas/:arquivoId', async (req, res) => {
    const largura = req.query.w === undefined ? 600 : Number(req.query.w);
    if (!(LARGURAS_PADRAO as readonly number[]).includes(largura)) throw pedidoInvalido(`Largura inválida. Use ${LARGURAS_PADRAO.join(', ')}.`);
    const { biblioteca, arquivos } = await musicas(req.params.id);
    const capa = arquivos.get(req.params.arquivoId);
    if (!capa || capa.tipo !== 'image') throw naoEncontrado('Capa');
    const info = await stat(capa.caminho).catch(() => {
      throw new ErroHttp(404, 'indisponivel', 'O arquivo não está acessível (disco desconectado?).');
    });
    const chave = `musica-${biblioteca.id}-${req.params.arquivoId}-${info.size.toString(36)}-${Math.floor(info.mtimeMs).toString(36)}`;
    const { versoes } = await gerarVersoes(capa.caminho, api.caminhoCache, chave);
    res.header('content-type', 'image/jpeg').header('cache-control', 'public, max-age=86400');
    return res.send(createReadStream(versoes[largura]));
  });
}
