// lib/planLimits.ts

// Estes valores devem ser SEMPRE iguais aos anunciados na página de Planos (/dashboard/profile)
export const LIMITES_PLANO = {
  free: 3,
  pro: Infinity, // Pro = funis ilimitados
} as const;

export type PlanoTipo = keyof typeof LIMITES_PLANO;

export function getLimiteFunis(plano: string): number {
  return LIMITES_PLANO[plano as PlanoTipo] ?? LIMITES_PLANO.free;
}