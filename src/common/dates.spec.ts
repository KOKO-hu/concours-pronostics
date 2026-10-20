import { estDateCalendrier } from './dates.js';

describe('estDateCalendrier', () => {
  it('accepte une date réelle', () => {
    expect(estDateCalendrier('2026-10-24')).toBe(true);
  });

  it('refuse un calendrier impossible et un mauvais format', () => {
    expect(estDateCalendrier('2026-02-31')).toBe(false);
    expect(estDateCalendrier('2026-13-01')).toBe(false);
    expect(estDateCalendrier('24-10-2026')).toBe(false);
  });
});
