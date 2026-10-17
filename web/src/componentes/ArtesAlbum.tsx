import { useState } from 'react';
import { urlImagem } from '../logica/imagens';
import type { FotoUI } from '../tipos';

export type CampoArte = 'poster' | 'capa' | 'miniatura';
/** Escolha por arte: id da foto, null = automático (primeira foto); ausente = sem mudança. */
export type EscolhaArtes = Partial<Record<CampoArte, number | null>>;

export const ROTULOS_ARTE: Record<CampoArte, string> = { poster: 'Poster', capa: 'Capa de fundo', miniatura: 'Miniatura' };
const CAMPOS: CampoArte[] = ['poster', 'capa', 'miniatura'];

interface Props {
  fotos: FotoUI[];
  /** Foto atual de cada arte, já com a escolha pendente aplicada. */
  atuais: Record<CampoArte, number | null>;
  onEscolher: (campo: CampoArte, fotoId: number | null) => void;
}

// Seção do painel ⚙: mostra a foto de cada arte e deixa trocar por outra foto do próprio álbum.
export function ArtesAlbum({ fotos, atuais, onEscolher }: Props) {
  const [aberta, setAberta] = useState<CampoArte | null>(null);

  return (
    <div className="campo artes-album">
      <span className="rotulo">Imagens do álbum</span>
      {CAMPOS.map((campo) => (
        <div key={campo} className="arte-linha">
          <div className={`arte-previa arte-${campo}`}>
            {atuais[campo] ? <img src={urlImagem(atuais[campo]!, 300)} alt="" /> : <span aria-hidden="true">▣</span>}
          </div>
          <span className="arte-nome">{ROTULOS_ARTE[campo]}</span>
          <button type="button" className="botao" aria-expanded={aberta === campo} onClick={() => setAberta(aberta === campo ? null : campo)}>
            Trocar
          </button>
          <button type="button" className="botao" onClick={() => onEscolher(campo, null)}>Automático</button>
        </div>
      ))}
      {aberta && (
        <div role="group" aria-label={`Escolher foto para ${ROTULOS_ARTE[aberta].toLowerCase()}`} className="arte-escolha">
          {fotos.length === 0 && <p className="texto-apagado">Este álbum não tem fotos.</p>}
          {fotos.map((foto) => (
            <button
              key={foto.id}
              type="button"
              className="arte-foto"
              data-atual={atuais[aberta] === foto.id ? 'true' : undefined}
              aria-label={`Usar ${foto.nome} como ${ROTULOS_ARTE[aberta].toLowerCase()}`}
              onClick={() => {
                onEscolher(aberta, foto.id);
                setAberta(null);
              }}
            >
              <img src={urlImagem(foto.id, 300)} alt="" loading="lazy" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
