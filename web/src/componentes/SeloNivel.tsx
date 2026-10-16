import type { Nivel } from '../tipos';

export function SeloNivel({ nivel, className = '' }: { nivel: Nivel | null; className?: string }) {
  if (nivel === null) return null;
  return (
    <span className={`selo-nivel ${className}`} aria-label={`Nível ${nivel}`}>
      <span className="estrela" aria-hidden="true">★</span> {nivel}
    </span>
  );
}
