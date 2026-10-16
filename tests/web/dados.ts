// Dados de exemplo compartilhados pelos testes do front-end.
import type { FotoUI } from '../../web/src/tipos';

export const FOTOS: FotoUI[] = [
  { id: 1, nome: 'IMG_0001.jpg', caminhoRelativo: 'Nivel_1/IMG_0001.jpg', nivel: 1, dataCaptura: '2025-07-14T10:00:00Z', camera: 'Canon EOS R6', tags: ['mar'] },
  { id: 2, nome: 'IMG_0042.jpg', caminhoRelativo: 'Nivel_2/IMG_0042.jpg', nivel: 2, dataCaptura: '2025-07-12T09:00:00Z', camera: null, tags: [] },
  { id: 3, nome: 'IMG_0107.jpg', caminhoRelativo: 'Nivel_3/IMG_0107.jpg', nivel: 3, dataCaptura: null, camera: null, tags: [] },
  { id: 4, nome: 'solta.jpg', caminhoRelativo: 'solta.jpg', nivel: null, dataCaptura: '2025-07-13T09:00:00Z', camera: null, tags: [] },
  { id: 5, nome: 'IMG_0002.jpg', caminhoRelativo: 'Nivel_1/IMG_0002.jpg', nivel: 1, dataCaptura: '2025-07-15T10:00:00Z', camera: null, tags: [] },
];
