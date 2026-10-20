const CLES_REQUISES = ['DATABASE_URL', 'JWT_SECRET', 'ADMIN_KEY'] as const;

export function validerEnvironnement(config: Record<string, unknown>) {
  for (const cle of CLES_REQUISES) {
    const valeur = config[cle];
    if (typeof valeur !== 'string' || valeur.trim().length === 0) {
      throw new Error(`Variable d'environnement manquante : ${cle}`);
    }
  }
  return config;
}
