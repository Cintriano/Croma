import type { Banco } from '../db/banco';
import { salvarVarredura, varreduraAnterior, type Biblioteca } from '../db/repositorio';
import type { Aviso } from '../avisos';
import { gravarFotosJson } from '../metadados/fotosJson';
import { varrerBibliotecaFotos, type AlteracoesVarredura } from './varredura';

export interface ResultadoSincronizacao {
  bibliotecaId: number;
  avisos: Aviso[];
  alteracoes: AlteracoesVarredura;
}

// Uma varredura por biblioteca de cada vez; pedidos repetidos esperam a que já está rodando.
const emAndamento = new Map<number, Promise<ResultadoSincronizacao>>();

export function sincronizarBiblioteca(db: Banco, biblioteca: Biblioteca): Promise<ResultadoSincronizacao> {
  let tarefa = emAndamento.get(biblioteca.id);
  if (!tarefa) {
    tarefa = sincronizar(db, biblioteca).finally(() => emAndamento.delete(biblioteca.id));
    emAndamento.set(biblioteca.id, tarefa);
  }
  return tarefa;
}

async function sincronizar(db: Banco, biblioteca: Biblioteca): Promise<ResultadoSincronizacao> {
  const resultado = await varrerBibliotecaFotos(biblioteca.caminho, { anterior: varreduraAnterior(db, biblioteca.id) });

  // Grava no disco as correções de fotos movidas ou renomeadas encontradas pela reconciliação.
  for (const album of resultado.albuns) {
    if (!album.fotosJsonAlterado) continue;
    try {
      await gravarFotosJson(album.caminho, album.fotosJson);
    } catch (erro: any) {
      resultado.avisos.push({ tipo: 'json-invalido', caminho: album.caminho, mensagem: `Não foi possível gravar as correções do fotos.json: ${erro.message}` });
    }
  }

  salvarVarredura(db, biblioteca.id, resultado);
  return { bibliotecaId: biblioteca.id, avisos: resultado.avisos, alteracoes: resultado.alteracoes };
}
