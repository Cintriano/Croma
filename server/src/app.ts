import { existsSync } from 'node:fs';
import path from 'node:path';
import fastifyStatic from '@fastify/static';
import Fastify, { type FastifyInstance } from 'fastify';
import { abrirBanco, type Banco } from './db/banco';
import { rotasArquivos } from './rotas/arquivos';
import { rotasBibliotecas } from './rotas/bibliotecas';
import { rotasColecoes } from './rotas/colecoes';
import { ErroHttp, STATUS_POR_CODIGO } from './rotas/erros';

export interface OpcoesApp {
  caminhoBanco: string;
  caminhoCache: string;
  logger?: boolean;
  /** Pasta do front-end compilado (npm run build:web); sem ela, o servidor responde só a API. */
  pastaWeb?: string;
}

const PASTA_WEB_PADRAO = path.resolve('dist/web');

declare module 'fastify' {
  interface FastifyInstance {
    db: Banco;
    caminhoCache: string;
  }
}

export async function construirApp(opcoes: OpcoesApp): Promise<FastifyInstance> {
  const app = Fastify({ logger: opcoes.logger ?? false });
  const db = abrirBanco(opcoes.caminhoBanco);

  app.decorate('db', db);
  app.decorate('caminhoCache', opcoes.caminhoCache);
  app.addHook('onClose', async () => db.close());

  app.setErrorHandler((erro: any, requisicao, resposta) => {
    if (erro instanceof ErroHttp) {
      return resposta.code(erro.status).send({ codigo: erro.codigo, mensagem: erro.message });
    }
    if (typeof erro.codigo === 'string' && STATUS_POR_CODIGO[erro.codigo]) {
      return resposta.code(STATUS_POR_CODIGO[erro.codigo]).send({ codigo: erro.codigo, mensagem: erro.message });
    }
    if (erro.validation || (erro.statusCode && erro.statusCode < 500)) {
      return resposta.code(erro.statusCode ?? 400).send({ codigo: 'pedido-invalido', mensagem: erro.message });
    }
    requisicao.log.error(erro);
    return resposta.code(500).send({ codigo: 'erro-interno', mensagem: 'Erro interno do servidor.' });
  });

  await app.register(
    async (api) => {
      api.get('/saude', async () => ({ status: 'ok' }));
      await api.register(rotasBibliotecas);
      await api.register(rotasColecoes);
      await api.register(rotasArquivos);
    },
    { prefix: '/api' },
  );

  const pastaWeb = opcoes.pastaWeb ?? PASTA_WEB_PADRAO;
  const temWeb = existsSync(path.join(pastaWeb, 'index.html'));
  if (temWeb) await app.register(fastifyStatic, { root: pastaWeb, wildcard: false });

  // /api desconhecida responde 404 em JSON; as demais rotas GET são telas do site (o React Router decide).
  app.setNotFoundHandler((requisicao, resposta) => {
    if (temWeb && requisicao.method === 'GET' && !requisicao.url.startsWith('/api/')) return resposta.sendFile('index.html');
    return resposta.code(404).send({ codigo: 'nao-encontrado', mensagem: `Rota não encontrada: ${requisicao.method} ${requisicao.url}` });
  });

  return app;
}
