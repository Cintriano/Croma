import { useEffect, useState } from 'react';
import { api, ErroApi, type Pasta } from '../api';
import { caminhoBiblioteca } from '../logica/rotas';
import { usePlataforma } from '../plataforma';
import type { Aviso } from '../tipos';
import { useDados } from '../usarDados';

const ROTULO_AVISO: Record<Aviso['tipo'], string> = {
  'pasta-ignorada': 'Pasta fora do padrão',
  'sem-metadados': 'Álbum sem metadados',
  'json-invalido': 'JSON inválido',
  'tag-orfa': 'Tag sem foto',
};

export function PaginaConfiguracoes() {
  const plataforma = usePlataforma();
  const { dados: bibliotecas, recarregar } = useDados(() => api.bibliotecas(), []);
  const [criando, setCriando] = useState(false);
  const [mensagem, setMensagem] = useState<string | null>(null);
  const [varrendo, setVarrendo] = useState<number | null>(null);

  if (plataforma !== 'desktop') return <p className="pagina-vazia">As configurações só existem no desktop.</p>;

  return (
    <div className="pagina">
      <h1 className="titulo-pagina">Configurações</h1>
      <section className="secao" aria-labelledby="titulo-bibliotecas">
        <div className="secao-topo">
          <h2 id="titulo-bibliotecas">Bibliotecas</h2>
          {!criando && (
            <button type="button" className="botao botao-principal" onClick={() => setCriando(true)}>
              Nova biblioteca
            </button>
          )}
        </div>
        {mensagem && <p className="mensagem-sucesso" role="status">{mensagem}</p>}
        {criando && (
          <FormularioBiblioteca
            onCancelar={() => setCriando(false)}
            onCriada={(nome, avisos) => {
              setCriando(false);
              setMensagem(`Biblioteca "${nome}" criada${avisos ? ` com ${avisos} aviso(s)` : ''}.`);
              recarregar();
            }}
          />
        )}
        <ul className="lista-bibliotecas">
          {bibliotecas?.map((b) => (
            <li key={b.id}>
              <div>
                <a href={caminhoBiblioteca(b.id)}><strong>{b.nome}</strong></a>
                <span className="texto-suave"> · {b.totalColecoes} álbuns · <code>{b.caminho}</code></span>
              </div>
              <button
                type="button"
                className="botao"
                disabled={varrendo === b.id}
                onClick={async () => {
                  setVarrendo(b.id);
                  const r = await api.varrer(b.id).finally(() => setVarrendo(null));
                  setMensagem(`Varredura de "${b.nome}" concluída${r.avisos.length ? ` com ${r.avisos.length} aviso(s)` : ''}.`);
                  recarregar();
                }}
              >
                {varrendo === b.id ? 'Varrendo…' : 'Varrer agora'}
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function FormularioBiblioteca({ onCancelar, onCriada }: { onCancelar: () => void; onCriada: (nome: string, avisos: number) => void }) {
  const [tipo, setTipo] = useState('fotos');
  const [nome, setNome] = useState('');
  const [caminho, setCaminho] = useState('');
  const [previa, setPrevia] = useState<{ albuns: string[]; avisos: Aviso[] } | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [navegando, setNavegando] = useState(false);

  // Prévia dos álbuns e avisos enquanto o caminho é digitado ou escolhido.
  useEffect(() => {
    setPrevia(null);
    setErro(null);
    if (!caminho.trim()) return;
    let ativo = true;
    const espera = setTimeout(() => {
      api.previa(caminho).then(
        (p) => ativo && setPrevia(p),
        (e: ErroApi) => ativo && setErro(e.message),
      );
    }, 300);
    return () => {
      ativo = false;
      clearTimeout(espera);
    };
  }, [caminho]);

  const salvar = async (e: React.FormEvent) => {
    e.preventDefault();
    setSalvando(true);
    try {
      const criada = await api.criarBiblioteca({ nome: nome.trim(), tipo: 'fotos', caminho });
      onCriada(criada.nome, criada.avisos.length);
    } catch (falha) {
      setErro((falha as Error).message);
    } finally {
      setSalvando(false);
    }
  };

  return (
    <form className="formulario painel" onSubmit={salvar}>
      <label>
        Tipo
        <select value={tipo} onChange={(e) => setTipo(e.target.value)}>
          <option value="fotos">Fotos</option>
          <option value="musicas" disabled>Músicas (em breve)</option>
        </select>
      </label>
      <label>
        Nome
        <input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Fotos da família" required />
      </label>
      <div className="campo-caminho">
        <label>
          Caminho
          <input value={caminho} onChange={(e) => setCaminho(e.target.value)} placeholder="F:\Fotos" required />
        </label>
        <button type="button" className="botao" onClick={() => setNavegando((n) => !n)}>Procurar pasta…</button>
      </div>
      {navegando && <NavegadorPastas inicial={caminho || undefined} onEscolher={(c) => { setCaminho(c); setNavegando(false); }} />}

      {erro && <p className="mensagem-erro" role="alert">{erro}</p>}
      {previa && (
        <div className="previa">
          <h3>{previa.albuns.length === 1 ? '1 álbum encontrado' : `${previa.albuns.length} álbuns encontrados`}</h3>
          <ul aria-label="Álbuns encontrados" className="lista-simples">
            {previa.albuns.map((a) => <li key={a}>{a}</li>)}
          </ul>
          {previa.avisos.length > 0 && (
            <>
              <h3>Avisos</h3>
              <ul aria-label="Avisos" className="lista-avisos">
                {previa.avisos.map((a, i) => (
                  <li key={i}>
                    <strong>{ROTULO_AVISO[a.tipo]}</strong>: <code>{a.caminho}</code>
                    <span className="texto-suave"> — {a.mensagem}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}
      <div className="acoes-formulario">
        <button type="button" className="botao" onClick={onCancelar}>Cancelar</button>
        <button type="submit" className="botao botao-principal" disabled={salvando || !previa || !nome.trim()}>
          {salvando ? 'Salvando…' : 'Salvar'}
        </button>
      </div>
    </form>
  );
}

function NavegadorPastas({ inicial, onEscolher }: { inicial?: string; onEscolher: (caminho: string) => void }) {
  const [atual, setAtual] = useState<string | undefined>(inicial);
  const { dados, erro } = useDados(() => api.pastas(atual), [atual]);
  return (
    <div className="navegador-pastas painel">
      <div className="navegador-topo">
        <code>{dados?.caminho ?? 'Unidades'}</code>
        {dados?.caminho && <button type="button" className="botao" onClick={() => onEscolher(dados.caminho!)}>Usar esta pasta</button>}
      </div>
      {erro && <p className="mensagem-erro">{erro.message}</p>}
      <ul className="lista-simples">
        {dados?.caminho && (
          <li><button type="button" className="botao-texto" onClick={() => setAtual(dados.pai ?? undefined)}>↑ Voltar</button></li>
        )}
        {dados?.pastas.map((p: Pasta) => (
          <li key={p.caminho}>
            <button type="button" className="botao-texto" onClick={() => setAtual(p.caminho)}>📁 {p.nome}</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
