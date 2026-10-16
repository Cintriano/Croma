import { access, readdir } from 'node:fs/promises';
import path from 'node:path';
import type { FastifyInstance } from 'fastify';
import { buscarFotos, contarTags, filtrarAlbuns, type AlbumBusca } from '../busca/tags';
import { criarBiblioteca, listarAlbuns, listarBibliotecas, listarFotosDoAlbum, obterBiblioteca, type Foto } from '../db/repositorio';
import { sincronizarBiblioteca } from '../fotos/sincronizar';
import { previaBibliotecaFotos } from '../fotos/varredura';
import { compararNomes } from '../ordenacao';
import { lerBooleano, lerId, lerListaTags, lerModo, naoEncontrado, pedidoInvalido } from './erros';

const TIPOS_ACEITOS = new Set(['fotos']);

export async function rotasBibliotecas(api: FastifyInstance) {
  const { db } = api;
  const biblioteca = (id: unknown) => obterBiblioteca(db, lerId(id)) ?? (() => { throw naoEncontrado('Biblioteca'); })();

  api.get('/libraries', async () => ({ bibliotecas: listarBibliotecas(db) }));

  api.post<{ Body: { nome?: unknown; tipo?: unknown; caminho?: unknown } }>('/libraries', async (req, res) => {
    const { nome, tipo, caminho } = req.body ?? {};
    if (typeof nome !== 'string' || !nome.trim()) throw pedidoInvalido('Informe o nome da biblioteca.');
    if (typeof tipo !== 'string' || !TIPOS_ACEITOS.has(tipo)) throw pedidoInvalido('Tipo de biblioteca não suportado.', 'tipo-invalido');
    if (typeof caminho !== 'string' || !caminho.trim()) throw pedidoInvalido('Informe o caminho.', 'caminho-invalido');

    await previaBibliotecaFotos(caminho); // lança caminho-invalido antes de criar o registro
    const criada = criarBiblioteca(db, { nome: nome.trim(), tipo: 'fotos', caminho });
    const { avisos } = await sincronizarBiblioteca(db, criada);
    res.code(201);
    return { ...obterBiblioteca(db, criada.id), avisos };
  });

  api.post<{ Body: { caminho?: unknown } }>('/libraries/previa', async (req) => {
    const caminho = req.body?.caminho;
    if (typeof caminho !== 'string' || !caminho.trim()) throw pedidoInvalido('Informe o caminho.', 'caminho-invalido');
    return previaBibliotecaFotos(caminho);
  });

  api.get<{ Params: { id: string }; Querystring: Record<string, string> }>('/libraries/:id/collections', async (req) => {
    const b = biblioteca(req.params.id);
    const incluirOcultos = lerBooleano(req.query.incluirOcultos);
    const filtro = { tags: lerListaTags(req.query.tags), modo: lerModo(req.query.modo), incluirOcultos };
    return { colecoes: filtrarAlbuns(listarAlbuns(db, b.id, { incluirOcultos }), filtro) };
  });

  api.get<{ Params: { id: string }; Querystring: Record<string, string> }>('/libraries/:id/photos', async (req) => {
    const b = biblioteca(req.params.id);
    const nivel = req.query.nivel === undefined || req.query.nivel === '' ? undefined : Number(req.query.nivel);
    if (nivel !== undefined && ![1, 2, 3].includes(nivel)) throw pedidoInvalido('O nível deve ser 1, 2 ou 3.');
    const filtro = { tags: lerListaTags(req.query.tags), modo: lerModo(req.query.modo), nivel };
    return { fotos: buscarFotos(albunsComFotos(b.id), filtro) };
  });

  api.get<{ Params: { id: string } }>('/libraries/:id/tags', async (req) => {
    const b = biblioteca(req.params.id);
    return { tags: contarTags(albunsComFotos(b.id)) };
  });

  api.post<{ Body: { bibliotecaId?: unknown } }>('/scan', async (req) => {
    const id = req.body?.bibliotecaId;
    const alvos = id === undefined ? listarBibliotecas(db) : [biblioteca(id)];
    const resultados = [];
    for (const alvo of alvos) resultados.push(await sincronizarBiblioteca(db, alvo));
    return {
      bibliotecas: resultados,
      avisos: resultados.flatMap((r) => r.avisos),
      alteracoes: {
        novas: resultados.flatMap((r) => r.alteracoes.novas),
        alteradas: resultados.flatMap((r) => r.alteracoes.alteradas),
        removidas: resultados.flatMap((r) => r.alteracoes.removidas),
      },
    };
  });

  // Navegador de pastas do servidor, usado ao escolher o caminho da biblioteca.
  api.get<{ Querystring: { path?: string } }>('/fs', async (req) => {
    const caminho = req.query.path;
    if (!caminho) return { caminho: null, pai: null, pastas: await raizes() };
    let entradas;
    try {
      entradas = await readdir(caminho, { withFileTypes: true });
    } catch {
      throw pedidoInvalido(`Não foi possível abrir a pasta ${caminho}.`, 'caminho-invalido');
    }
    const absoluto = path.resolve(caminho);
    const pai = path.dirname(absoluto);
    return {
      caminho: absoluto,
      pai: pai === absoluto ? null : pai,
      pastas: entradas
        .filter((e) => e.isDirectory() && !e.name.startsWith('.') && !e.name.startsWith('$'))
        .map((e) => ({ nome: e.name, caminho: path.join(absoluto, e.name) }))
        .sort((a, b) => compararNomes(a.nome, b.nome)),
    };
  });

  function albunsComFotos(bibliotecaId: number): AlbumBusca<Foto>[] {
    return listarAlbuns(db, bibliotecaId).map((album) => ({ ...album, fotos: listarFotosDoAlbum(db, album.id) }));
  }
}

async function raizes(): Promise<{ nome: string; caminho: string }[]> {
  if (process.platform !== 'win32') return [{ nome: '/', caminho: '/' }];
  const unidades = [];
  for (const letra of 'CDEFGHIJKLMNOPQRSTUVWXYZAB') {
    const caminho = `${letra}:\\`;
    if (await access(caminho).then(() => true, () => false)) unidades.push({ nome: `${letra}:`, caminho });
  }
  return unidades;
}
