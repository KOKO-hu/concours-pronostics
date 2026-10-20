const FORMAT_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function estDateCalendrier(valeur: string): boolean {
  if (!FORMAT_DATE.test(valeur)) {
    return false;
  }

  const [annee, mois, jour] = valeur.split('-').map(Number);
  const date = new Date(Date.UTC(annee, mois - 1, jour));
  return (
    date.getUTCFullYear() === annee &&
    date.getUTCMonth() === mois - 1 &&
    date.getUTCDate() === jour
  );
}
