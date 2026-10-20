export type LigneClassee = {
  utilisateur_id: string;
  email: string;
  points: number;
  rang: number;
};

export function attribuerRangs(
  lignes: { userId: string; email: string; points: number }[],
): LigneClassee[] {
  const tries = [...lignes].sort(
    (a, b) => b.points - a.points || a.email.localeCompare(b.email),
  );
  let rang = 0;
  let pointsPrecedents: number | undefined;

  return tries.map((ligne, index) => {
    if (pointsPrecedents !== ligne.points) {
      rang = index + 1;
      pointsPrecedents = ligne.points;
    }
    return {
      utilisateur_id: ligne.userId,
      email: ligne.email,
      points: ligne.points,
      rang,
    };
  });
}
