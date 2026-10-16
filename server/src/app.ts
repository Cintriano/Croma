import Fastify, { type FastifyInstance } from 'fastify';
import { abrirBanco, type Banco } from './db/banco';

export interface OpcoesApp {
  caminhoBanco: string;
  caminhoCache: string;
  logger?: boolean;
}

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

  await app.register(
    async (api) => {
      api.get('/saude', async () => ({ status: 'ok' }));
    },
    { prefix: '/api' },
  );

  app.setNotFoundHandler((requisicao, resposta) => {
    resposta.code(404).send({ erro: 'nao-encontrado', mensagem: `Rota não encontrada: ${requisicao.method} ${requisicao.url}` });
  });

  return app;
}
