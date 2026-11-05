// Ordem natural em português: "foto2" antes de "foto10", sem diferença de maiúsculas e acentos.
const comparador = new Intl.Collator('pt-BR', { numeric: true, sensitivity: 'base' });

export const compararNomes = (a: string, b: string) => comparador.compare(a, b);
