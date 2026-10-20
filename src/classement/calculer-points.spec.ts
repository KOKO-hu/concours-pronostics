import { calculerPoints } from './calculer-points.js';

describe('calculerPoints', () => {
  const resultat = { butsDomicile: 2, butsExterieur: 0 };

  it('donne 3 points pour le score exact', () => {
    expect(calculerPoints({ butsDomicile: 2, butsExterieur: 0 }, resultat)).toBe(
      3,
    );
    expect(
      calculerPoints(
        { butsDomicile: 0, butsExterieur: 0 },
        { butsDomicile: 0, butsExterieur: 0 },
      ),
    ).toBe(3);
  });

  it('donne 1 point pour le bon vainqueur sans le score exact', () => {
    expect(calculerPoints({ butsDomicile: 1, butsExterieur: 0 }, resultat)).toBe(
      1,
    );
    expect(
      calculerPoints(
        { butsDomicile: 0, butsExterieur: 1 },
        { butsDomicile: 1, butsExterieur: 3 },
      ),
    ).toBe(1);
  });

  it('donne 1 point pour le bon match nul sans le score exact', () => {
    expect(
      calculerPoints(
        { butsDomicile: 1, butsExterieur: 1 },
        { butsDomicile: 0, butsExterieur: 0 },
      ),
    ).toBe(1);
  });

  it('donne 0 point sinon', () => {
    expect(calculerPoints({ butsDomicile: 0, butsExterieur: 1 }, resultat)).toBe(
      0,
    );
    expect(calculerPoints({ butsDomicile: 1, butsExterieur: 1 }, resultat)).toBe(
      0,
    );
  });
});
