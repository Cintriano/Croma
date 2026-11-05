import exifr from 'exifr';

export interface Exif {
  camera: string | null;
  orientacao: number | null;
  /** Data de captura em ISO 8601. */
  dataCaptura: string | null;
}

const vazio = (): Exif => ({ camera: null, orientacao: null, dataCaptura: null });

export async function lerExif(arquivo: string): Promise<Exif> {
  let dados: any;
  try {
    dados = await exifr.parse(arquivo, {
      pick: ['Make', 'Model', 'Orientation', 'DateTimeOriginal', 'CreateDate'],
      translateValues: false,
    });
  } catch {
    return vazio();
  }
  if (!dados) return vazio();

  const data = dados.DateTimeOriginal ?? dados.CreateDate;
  return {
    camera: nomeDaCamera(dados.Make, dados.Model),
    orientacao: typeof dados.Orientation === 'number' ? dados.Orientation : null,
    dataCaptura: data instanceof Date && !Number.isNaN(data.getTime()) ? data.toISOString() : null,
  };
}

// "Canon" + "Canon EOS R6" → "Canon EOS R6"; "SONY" + "ILCE-7M3" → "SONY ILCE-7M3".
function nomeDaCamera(marca: unknown, modelo: unknown): string | null {
  const m = typeof marca === 'string' ? marca.trim() : '';
  const mod = typeof modelo === 'string' ? modelo.trim() : '';
  if (!m) return mod || null;
  if (!mod) return m;
  return mod.toLowerCase().startsWith(m.toLowerCase()) ? mod : `${m} ${mod}`;
}
