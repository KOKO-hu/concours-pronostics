import { attribuerRangs } from './attribuer-rangs.js';

describe('attribuerRangs', () => {
  it('classe par points et partage le rang en cas d’égalité', () => {
    const lignes = attribuerRangs([
      { userId: 'b', email: 'bob@example.com', points: 3 },
      { userId: 'a', email: 'alice@example.com', points: 3 },
      { userId: 'c', email: 'chloe@example.com', points: 0 },
    ]);

    expect(lignes.map((ligne) => [ligne.email, ligne.rang, ligne.points])).toEqual([
      ['alice@example.com', 1, 3],
      ['bob@example.com', 1, 3],
      ['chloe@example.com', 3, 0],
    ]);
  });
});
