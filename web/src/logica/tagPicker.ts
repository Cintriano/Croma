import { chaveBusca, compararTags, normalizarTag } from './tags';

export interface TagExistente {
  tag: string;
  usos: number;
}

export interface Sugestoes {
  /** Até 10, com as prioritárias (do álbum atual) primeiro; vazio enquanto há texto digitado. */
  maisUsadas: TagExistente[];
  /** Todas as disponíveis (ou as que combinam com o texto), de A a Z. */
  todas: TagExistente[];
  /** Tag nova a criar, já normalizada, quando o texto não corresponde a nenhuma existente. */
  criar: string | null;
  /** Existente quase igual ao texto (provável erro de digitação), para destacar. */
  parecida: string | null;
}

const LIMITE_MAIS_USADAS = 10;

export function sugestoesTags({
  existentes,
  aplicadas,
  texto,
  prioritarias = [],
}: {
  existentes: TagExistente[];
  aplicadas: string[];
  texto: string;
  prioritarias?: string[];
}): Sugestoes {
  const aplicadasChaves = new Set(aplicadas.map(chaveBusca));
  const disponiveis = existentes.filter((t) => !aplicadasChaves.has(chaveBusca(t.tag)));
  const procurada = chaveBusca(texto);

  if (!procurada) {
    const prioridade = new Map(prioritarias.map((t, i) => [chaveBusca(t), i]));
    const maisUsadas = [...disponiveis]
      .sort((a, b) => {
        const pa = prioridade.get(chaveBusca(a.tag)) ?? Infinity;
        const pb = prioridade.get(chaveBusca(b.tag)) ?? Infinity;
        return pa - pb || b.usos - a.usos || compararTags(a.tag, b.tag);
      })
      .slice(0, LIMITE_MAIS_USADAS);
    return { maisUsadas, todas: [...disponiveis].sort((a, b) => compararTags(a.tag, b.tag)), criar: null, parecida: null };
  }

  const todas = disponiveis.filter((t) => chaveBusca(t.tag).includes(procurada)).sort((a, b) => compararTags(a.tag, b.tag));
  const existe = existentes.some((t) => chaveBusca(t.tag) === procurada) || aplicadasChaves.has(procurada);
  const criar = existe ? null : normalizarTag(texto);
  const parecida =
    criar && procurada.length >= 4 && todas.length === 0
      ? (disponiveis.find((t) => distancia(chaveBusca(t.tag), procurada) <= 1)?.tag ?? null)
      : null;
  return { maisUsadas: [], todas, criar, parecida };
}

// Distância de edição (Levenshtein), usada só para detectar erros de digitação.
function distancia(a: string, b: string): number {
  if (Math.abs(a.length - b.length) > 1) return 2;
  let anterior = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const atual = [i];
    for (let j = 1; j <= b.length; j++) {
      atual[j] = Math.min(anterior[j] + 1, atual[j - 1] + 1, anterior[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    anterior = atual;
  }
  return anterior[b.length];
}
