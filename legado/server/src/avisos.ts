// Avisos que a leitura e a varredura devolvem para a interface, sem interromper o processo.
export type TipoAviso = 'pasta-ignorada' | 'sem-metadados' | 'json-invalido' | 'tag-orfa';

export interface Aviso {
  tipo: TipoAviso;
  caminho: string;
  mensagem: string;
}
