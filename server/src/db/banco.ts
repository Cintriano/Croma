import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';

export type Banco = DatabaseSync;

// Cada migração roda uma única vez; a versão aplicada fica em PRAGMA user_version.
// Nunca altere uma migração já publicada: acrescente uma nova ao fim da lista.
const MIGRACOES: string[] = [
  `
  CREATE TABLE bibliotecas (
    id         INTEGER PRIMARY KEY,
    nome       TEXT NOT NULL,
    tipo       TEXT NOT NULL,
    caminho    TEXT NOT NULL,
    criada_em  INTEGER NOT NULL
  );

  CREATE TABLE albuns (
    id             INTEGER PRIMARY KEY,
    biblioteca_id  INTEGER NOT NULL REFERENCES bibliotecas(id) ON DELETE CASCADE,
    nome           TEXT NOT NULL,
    caminho        TEXT NOT NULL,
    titulo         TEXT NOT NULL,
    colecao        TEXT NOT NULL DEFAULT '{}',
    oculto         INTEGER NOT NULL DEFAULT 0,
    disponivel     INTEGER NOT NULL DEFAULT 1,
    total          INTEGER NOT NULL DEFAULT 0,
    nivel1         INTEGER NOT NULL DEFAULT 0,
    nivel2         INTEGER NOT NULL DEFAULT 0,
    nivel3         INTEGER NOT NULL DEFAULT 0,
    sem_nivel      INTEGER NOT NULL DEFAULT 0,
    UNIQUE (biblioteca_id, nome)
  );

  CREATE TABLE fotos (
    id                INTEGER PRIMARY KEY,
    album_id          INTEGER NOT NULL REFERENCES albuns(id) ON DELETE CASCADE,
    caminho_relativo  TEXT NOT NULL,
    nivel             INTEGER,
    tamanho           INTEGER NOT NULL,
    modificado_em     INTEGER NOT NULL,
    camera            TEXT,
    orientacao        INTEGER,
    data_captura      TEXT,
    UNIQUE (album_id, caminho_relativo)
  );

  CREATE TABLE album_tags (
    album_id  INTEGER NOT NULL REFERENCES albuns(id) ON DELETE CASCADE,
    tag       TEXT NOT NULL,
    chave     TEXT NOT NULL,
    PRIMARY KEY (album_id, tag)
  );
  CREATE INDEX album_tags_chave ON album_tags (chave);

  CREATE TABLE foto_tags (
    foto_id  INTEGER NOT NULL REFERENCES fotos(id) ON DELETE CASCADE,
    tag      TEXT NOT NULL,
    chave    TEXT NOT NULL,
    PRIMARY KEY (foto_id, tag)
  );
  CREATE INDEX foto_tags_chave ON foto_tags (chave);
  `,
  // Posição da tag no JSON, para devolver as tags na mesma ordem em que foram gravadas.
  `
  ALTER TABLE album_tags ADD COLUMN posicao INTEGER NOT NULL DEFAULT 0;
  ALTER TABLE foto_tags ADD COLUMN posicao INTEGER NOT NULL DEFAULT 0;
  `,
];

export function abrirBanco(caminho: string): Banco {
  if (caminho !== ':memory:') mkdirSync(path.dirname(path.resolve(caminho)), { recursive: true });
  const db = new DatabaseSync(caminho);
  db.exec('PRAGMA foreign_keys = ON');
  if (caminho !== ':memory:') db.exec('PRAGMA journal_mode = WAL');
  migrar(db);
  return db;
}

export function versaoDoBanco(db: Banco): number {
  const linha = db.prepare('PRAGMA user_version').get() as { user_version: number };
  return linha.user_version;
}

export function emTransacao<T>(db: Banco, fn: () => T): T {
  db.exec('BEGIN');
  try {
    const resultado = fn();
    db.exec('COMMIT');
    return resultado;
  } catch (erro) {
    db.exec('ROLLBACK');
    throw erro;
  }
}

function migrar(db: Banco) {
  for (let versao = versaoDoBanco(db); versao < MIGRACOES.length; versao++) {
    emTransacao(db, () => {
      db.exec(MIGRACOES[versao]);
      db.exec(`PRAGMA user_version = ${versao + 1}`);
    });
  }
}
