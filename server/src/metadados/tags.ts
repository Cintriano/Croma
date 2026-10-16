// Tags são gravadas em minúsculas, sem espaços sobrando e com os acentos mantidos.
// Para comparar e pesquisar, usa-se a chave de busca, que também ignora os acentos.

export function normalizarTag(texto: string): string | null {
  const tag = texto.trim().replace(/\s+/g, ' ').toLocaleLowerCase('pt-BR');
  return tag === '' ? null : tag;
}

export function normalizarTags(lista: readonly string[]): string[] {
  const vistas = new Set<string>();
  for (const texto of lista) {
    if (typeof texto !== 'string') continue;
    const tag = normalizarTag(texto);
    if (tag !== null) vistas.add(tag);
  }
  return [...vistas];
}

export function chaveBusca(tag: string): string {
  return (normalizarTag(tag) ?? '').normalize('NFD').replace(/\p{Diacritic}/gu, '');
}
