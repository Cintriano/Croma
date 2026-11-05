import { construirApp } from './app';
import { carregarConfig } from './config';

const config = carregarConfig(process.env);
const app = await construirApp({ caminhoBanco: config.caminhoBanco, caminhoCache: config.caminhoCache, logger: true });

try {
  await app.listen({ port: config.porta, host: '0.0.0.0' });
} catch (erro) {
  app.log.error(erro);
  process.exit(1);
}
