import { normalizarTags } from './tags';

export interface EstadoPesquisa {
  tags: string[];
  modo: 'todas' | 'qualquer';
  busca: 'albuns' | 'fotos';
}

export const PESQUISA_PADRAO: EstadoPesquisa = { tags: [], modo: 'todas', busca: 'albuns' };

// Lê a pesquisa da URL (ex.: ?tags=praia,familia&busca=fotos); valores inválidos viram o padrão.
export function estadoPesquisaDaUrl(search: string): EstadoPesquisa {
  const p = new URLSearchParams(search);
  const modo = p.get('modo');
  const busca = p.get('busca');
  return {
    tags: normalizarTags((p.get('tags') ?? '').split(',')),
    modo: modo === 'qualquer' ? 'qualquer' : 'todas',
    busca: busca === 'fotos' ? 'fotos' : 'albuns',
  };
}

// Monta a parte "?..." da URL, omitindo os valores padrão; sem pesquisa, devolve ''.
export function urlDaPesquisa(estado: EstadoPesquisa): string {
  const partes: string[] = [];
  if (estado.tags.length) partes.push(`tags=${estado.tags.map(encodeURIComponent).join(',')}`);
  if (estado.modo !== 'todas') partes.push(`modo=${estado.modo}`);
  if (estado.busca !== 'albuns') partes.push(`busca=${estado.busca}`);
  return partes.length ? `?${partes.join('&')}` : '';
}
