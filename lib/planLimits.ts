// lib/planLimits.ts

export const LIMITES_PLANO = {
  free: 1,
  pro: 10, // ajusta esse número conforme fizer sentido pro teu negócio
} as const;

export type PlanoTipo = keyof typeof LIMITES_PLANO;

export function getLimiteFunis(plano: string): number {
  return LIMITES_PLANO[plano as PlanoTipo] ?? LIMITES_PLANO.free;
}