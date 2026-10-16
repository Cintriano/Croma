import type { FastifyInstance } from 'fastify';
import {
  atualizarColecaoDoAlbum,
  listarFotosDoAlbum,
  obterAlbum,
  obterFoto,
  substituirTagsFoto,
  type Album,
  type Foto,
} from '../db/repositorio';
import { atualizarColecao, lerColecao } from '../metadados/colecao';
import { aplicarTagsFotos, gravarFotosJson, lerFotosJson } from '../metadados/fotosJson';
import { normalizarTags } from '../metadados/tags';
import { lerBooleano, lerId, lerListaDeIds, lerListaDeTexto, naoEncontrado, pedidoInvalido } from './erros';

interface Falha {
  id: number;
  mensagem: string;
}

export async function rotasColecoes(api: FastifyInstance) {
  const { db } = api;

  // Álbum oculto só é encontrado quando o pedido diz incluirOcultos (desktop com "Mostrar ocultos" ou link direto no desktop).
  const album = (id: unknown, incluirOcultos: boolean): Album => {
    const encontrado = obterAlbum(db, lerId(id));
    if (!encontrado || (encontrado.oculto && !incluirOcultos)) throw naoEncontrado('Álbum');
    return encontrado;
  };

  api.get<{ Params: { id: string }; Querystring: Record<string, string> }>('/collections/:id', async (req) =>
    album(req.params.id, lerBooleano(req.query.incluirOcultos)),
  );

  api.get<{ Params: { id: string }; Querystring: Record<string, string> }>('/collections/:id/photos', async (req) => {
    const a = album(req.params.id, lerBooleano(req.query.incluirOcultos));
    return { fotos: listarFotosDoAlbum(db, a.id) };
  });

  // Edição do álbum: grava no colecao.json (preservando campos desconhecidos) e atualiza o banco.
  api.put<{ Params: { id: string }; Body: Record<string, unknown> }>('/collections/:id', async (req) => {
    const a = album(req.params.id, true);
    const alteracoes = req.body;
    if (!alteracoes || typeof alteracoes !== 'object' || Array.isArray(alteracoes)) throw pedidoInvalido('Envie um objeto com os campos a alterar.');
    if ('tags' in alteracoes) lerListaDeTexto(alteracoes.tags, 'tags');
    if ('oculto' in alteracoes && typeof alteracoes.oculto !== 'boolean') throw pedidoInvalido('"oculto" deve ser verdadeiro ou falso.');

    const colecao = await atualizarColecao(a.caminho, alteracoes);
    atualizarColecaoDoAlbum(db, a.id, colecao);
    return obterAlbum(db, a.id);
  });

  // Tags em massa: cada álbum é gravado separadamente; os que falharem são listados sem impedir os outros.
  api.patch<{ Body: { colecoes?: unknown; adicionar?: unknown; remover?: unknown } }>('/collections/tags', async (req) => {
    const ids = lerListaDeIds(req.body?.colecoes, 'colecoes');
    const adicionar = lerListaDeTexto(req.body?.adicionar, 'adicionar');
    const remover = new Set(normalizarTags(lerListaDeTexto(req.body?.remover, 'remover')));

    const alteradas: number[] = [];
    const falhas: Falha[] = [];
    for (const id of ids) {
      const a = obterAlbum(db, id);
      if (!a) {
        falhas.push({ id, mensagem: 'Álbum não encontrado.' });
        continue;
      }
      try {
        const { dados, aviso } = await lerColecao(a.caminho);
        if (aviso) throw new Error(aviso.mensagem);
        const tags = normalizarTags([...(dados?.tags ?? []), ...adicionar]).filter((t) => !remover.has(t));
        const colecao = await atualizarColecao(a.caminho, { tags });
        atualizarColecaoDoAlbum(db, a.id, colecao);
        alteradas.push(id);
      } catch (erro: any) {
        falhas.push({ id, mensagem: `Não foi possível gravar o colecao.json de "${a.titulo}": ${erro.message}` });
      }
    }
    return { alteradas, falhas };
  });

  // Tags de uma ou várias fotos: agrupa por álbum e grava cada fotos.json uma vez.
  api.patch<{ Body: { fotos?: unknown; adicionar?: unknown; remover?: unknown } }>('/photos/tags', async (req) => {
    const ids = lerListaDeIds(req.body?.fotos, 'fotos');
    const adicionar = lerListaDeTexto(req.body?.adicionar, 'adicionar');
    const remover = lerListaDeTexto(req.body?.remover, 'remover');

    const falhas: Falha[] = [];
    const porAlbum = new Map<number, Foto[]>();
    for (const id of ids) {
      const foto = obterFoto(db, id);
      if (!foto) falhas.push({ id, mensagem: 'Foto não encontrada.' });
      else porAlbum.set(foto.albumId, [...(porAlbum.get(foto.albumId) ?? []), foto]);
    }

    const alteradas: number[] = [];
    for (const [albumId, fotos] of porAlbum) {
      const a = obterAlbum(db, albumId)!;
      try {
        const { fotosJson, aviso } = await lerFotosJson(a.caminho);
        // Nunca sobrescreve um fotos.json que não conseguiu ler: as tags dele se perderiam.
        if (aviso) throw new Error(aviso.mensagem);
        const novo = aplicarTagsFotos(fotosJson, { fotos, adicionar, remover });
        await gravarFotosJson(a.caminho, novo);
        for (const foto of fotos) substituirTagsFoto(db, foto.id, novo.fotos[foto.caminhoRelativo]?.tags ?? []);
        alteradas.push(...fotos.map((f) => f.id));
      } catch (erro: any) {
        for (const foto of fotos) falhas.push({ id: foto.id, mensagem: `Não foi possível gravar o fotos.json de "${a.titulo}": ${erro.message}` });
      }
    }
    return { alteradas, falhas };
  });
}
