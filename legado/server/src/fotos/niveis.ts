// Subpastas reconhecidas dentro de um álbum. Qualquer outra é ignorada (e gera aviso).
export type Subpasta = { tipo: 'nivel'; nivel: 1 | 2 | 3 } | { tipo: 'metadados' } | { tipo: 'ignorada' };

export function classificarSubpasta(nome: string): Subpasta {
  if (nome.toLowerCase() === 'metadados') return { tipo: 'metadados' };
  const nivel = /^nivel_([123])$/i.exec(nome);
  if (nivel) return { tipo: 'nivel', nivel: Number(nivel[1]) as 1 | 2 | 3 };
  return { tipo: 'ignorada' };
}
