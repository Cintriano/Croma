import { useCallback, useEffect, useState } from 'react';

// Carrega dados da API e refaz quando as dependências mudam; `recarregar` força uma nova busca.
export function useDados<T>(buscar: () => Promise<T>, dependencias: unknown[]) {
  const [estado, setEstado] = useState<{ dados?: T; erro?: Error; carregando: boolean }>({ carregando: true });
  const [versao, setVersao] = useState(0);

  useEffect(() => {
    let ativo = true;
    setEstado((e) => ({ ...e, carregando: true }));
    buscar().then(
      (dados) => ativo && setEstado({ dados, carregando: false }),
      (erro) => ativo && setEstado({ erro, carregando: false }),
    );
    return () => {
      ativo = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...dependencias, versao]);

  const recarregar = useCallback(() => setVersao((v) => v + 1), []);
  return { ...estado, recarregar, definir: (dados: T) => setEstado({ dados, carregando: false }) };
}
