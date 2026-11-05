import { chaveBusca } from './tags';

// Tags presentes em todas as listas, na ordem da primeira.
export function tagsEmComum(listas: string[][]): string[] {
  if (listas.length === 0) return [];
  const demais = listas.slice(1).map((l) => new Set(l.map(chaveBusca)));
  return listas[0].filter((tag) => demais.every((s) => s.has(chaveBusca(tag))));
}

// O painel mostra as tags em comum; o que o usuário deixou nele vira adicionar/remover para todos os itens.
export function calcularAlteracoesMassa({ emComum, resultado }: { emComum: string[]; resultado: string[] }) {
  const antes = new Set(emComum.map(chaveBusca));
  const depois = new Set(resultado.map(chaveBusca));
  return {
    adicionar: resultado.filter((t) => !antes.has(chaveBusca(t))),
    remover: emComum.filter((t) => !depois.has(chaveBusca(t))),
  };
}
