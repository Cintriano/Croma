// Mesmas regras do servidor: minúsculas, espaços únicos, acentos mantidos; a chave ignora acentos.

export function normalizarTag(texto: string): string | null {
  const tag = texto.trim().replace(/\s+/g, ' ').toLocaleLowerCase('pt-BR');
  return tag === '' ? null : tag;
}

export function chaveBusca(tag: string): string {
  return (normalizarTag(tag) ?? '').normalize('NFD').replace(/\p{Diacritic}/gu, '');
}

export function normalizarTags(lista: string[]): string[] {
  const vistas = new Map<string, string>();
  for (const texto of lista) {
    const tag = normalizarTag(texto);
    if (tag !== null && !vistas.has(tag)) vistas.set(tag, tag);
  }
  return [...vistas.values()];
}

export const compararTags = (a: string, b: string) => a.localeCompare(b, 'pt-BR');
