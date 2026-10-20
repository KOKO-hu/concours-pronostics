import { timingSafeEqual } from 'node:crypto';

export function secretEgal(fourni: string, attendu: string): boolean {
  const gauche = Buffer.from(fourni);
  const droite = Buffer.from(attendu);
  if (gauche.length !== droite.length) {
    return false;
  }
  return timingSafeEqual(gauche, droite);
}
