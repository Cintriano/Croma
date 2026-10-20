// Carregamento orbital CAPRA (arquivo do kit): um ponto no acento em volta do núcleo. Com movimento reduzido, a página troca
// para a versão parada (a media query de dentro do SVG não vale quando ele é um <img>). Só aparece depois de 300 ms (CSS),
// para não piscar em respostas rápidas.
export function Carregando() {
  return (
    <div className="carregando" role="status">
      <picture>
        <source media="(prefers-reduced-motion: reduce)" srcSet="/marca/capra-carregamento-parado.svg" />
        <img src="/marca/capra-carregamento.svg" alt="" width={48} height={38} />
      </picture>
      <span className="visualmente-oculto">Carregando…</span>
    </div>
  );
}
