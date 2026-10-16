import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import path from 'node:path';
import type { FastifyInstance, FastifyReply } from 'fastify';
import { obterAlbum, obterFoto, type Foto } from '../db/repositorio';
import { gerarVersoes, LARGURAS_PADRAO } from '../imagens/cache';
import { ErroHttp, lerId, naoEncontrado, pedidoInvalido } from './erros';

const TIPOS: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
};

export async function rotasArquivos(api: FastifyInstance) {
  const { db } = api;

  const foto = (id: unknown): { foto: Foto; arquivo: string } => {
    const f = obterFoto(db, lerId(id));
    const album = f && obterAlbum(db, f.albumId);
    if (!f || !album) throw naoEncontrado('Foto');
    return { foto: f, arquivo: path.join(album.caminho, ...f.caminhoRelativo.split('/')) };
  };

  // Original, como está no disco, com suporte a HTTP Range.
  api.get<{ Params: { id: string } }>('/items/:id/file', async (req, res) => {
    const { arquivo } = foto(req.params.id);
    const info = await stat(arquivo).catch(() => {
      throw new ErroHttp(404, 'indisponivel', 'O arquivo não está acessível (disco desconectado?).');
    });
    const tipo = TIPOS[path.extname(arquivo).toLowerCase()] ?? 'application/octet-stream';
    return enviarComRange(res, arquivo, info.size, tipo, req.headers.range);
  });

  // Versão redimensionada do cache (gerada na primeira vez que é pedida).
  api.get<{ Params: { id: string }; Querystring: { w?: string } }>('/photos/:id/imagem', async (req, res) => {
    const largura = req.query.w === undefined ? 1200 : Number(req.query.w);
    if (!(LARGURAS_PADRAO as readonly number[]).includes(largura)) {
      throw pedidoInvalido(`Largura inválida. Use ${LARGURAS_PADRAO.join(', ')}.`);
    }
    const { foto: f, arquivo } = foto(req.params.id);
    // A chave muda quando o original muda, para o cache não servir uma versão antiga.
    const chave = `foto-${f.id}-${f.tamanho.toString(36)}-${f.modificadoEm.toString(36)}`;
    const { versoes } = await gerarVersoes(arquivo, api.caminhoCache, chave);
    res.header('content-type', 'image/jpeg').header('cache-control', 'public, max-age=86400');
    return res.send(createReadStream(versoes[largura]));
  });
}

function enviarComRange(res: FastifyReply, arquivo: string, tamanho: number, tipo: string, range?: string) {
  res.header('accept-ranges', 'bytes').header('content-type', tipo);
  const pedido = range && /^bytes=(\d*)-(\d*)$/.exec(range.trim());
  if (!pedido) {
    res.header('content-length', tamanho);
    return res.send(createReadStream(arquivo));
  }

  let inicio = pedido[1] === '' ? tamanho - Number(pedido[2]) : Number(pedido[1]);
  let fim = pedido[1] === '' || pedido[2] === '' ? tamanho - 1 : Math.min(Number(pedido[2]), tamanho - 1);
  inicio = Math.max(0, inicio);
  if (inicio > fim || inicio >= tamanho) {
    return res.code(416).header('content-range', `bytes */${tamanho}`).send();
  }
  res.code(206).header('content-range', `bytes ${inicio}-${fim}/${tamanho}`).header('content-length', fim - inicio + 1);
  return res.send(createReadStream(arquivo, { start: inicio, end: fim }));
}
