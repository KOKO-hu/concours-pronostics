export type Score = {
  butsDomicile: number;
  butsExterieur: number;
};

function issue(score: Score): -1 | 0 | 1 {
  if (score.butsDomicile > score.butsExterieur) {
    return 1;
  }
  if (score.butsDomicile < score.butsExterieur) {
    return -1;
  }
  return 0;
}

export function calculerPoints(pronostic: Score, resultat: Score): 0 | 1 | 3 {
  if (
    pronostic.butsDomicile === resultat.butsDomicile &&
    pronostic.butsExterieur === resultat.butsExterieur
  ) {
    return 3;
  }
  if (issue(pronostic) === issue(resultat)) {
    return 1;
  }
  return 0;
}
