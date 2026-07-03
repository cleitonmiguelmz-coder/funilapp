// lib/planLimits.ts

// Estes valores devem ser SEMPRE iguais aos anunciados na página de Planos (/dashboard/profile)
export const LIMITES_PLANO = {
  free: 3,
  pro: Infinity, // Pro = funis ilimitados
} as const;

export type PlanoTipo = keyof typeof LIMITES_PLANO;

export function getLimiteFunis(plano: string): number {
  const chave = (plano || "free").toLowerCase() as PlanoTipo;
  return LIMITES_PLANO[chave] ?? LIMITES_PLANO.free;
}