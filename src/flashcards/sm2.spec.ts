import { sm2, Sm2State } from './sm2';

const NOW = new Date('2026-07-15T12:00:00Z');

const newCard: Sm2State = { easeFactor: 2.5, intervalDays: 0, repetitions: 0 };

const utcMidnight = (isoDay: string) => new Date(`${isoDay}T00:00:00Z`);

describe('sm2', () => {
  it('schedules a new card answered GOOD for 1 day', () => {
    const result = sm2(newCard, 'GOOD', NOW);

    expect(result.repetitions).toBe(1);
    expect(result.intervalDays).toBe(1);
    expect(result.easeFactor).toBe(2.5);
    expect(result.dueDate).toEqual(utcMidnight('2026-07-16'));
  });

  it('schedules the second GOOD answer for 3 days', () => {
    const result = sm2(
      { easeFactor: 2.5, intervalDays: 1, repetitions: 1 },
      'GOOD',
      NOW,
    );

    expect(result.repetitions).toBe(2);
    expect(result.intervalDays).toBe(3);
  });

  it('multiplies the interval by the ease factor from the third GOOD answer on', () => {
    const result = sm2(
      { easeFactor: 2.5, intervalDays: 3, repetitions: 2 },
      'GOOD',
      NOW,
    );

    expect(result.repetitions).toBe(3);
    expect(result.intervalDays).toBe(8); // round(3 * 2.5)
    expect(result.dueDate).toEqual(utcMidnight('2026-07-23'));
  });

  it('schedules a new card answered EASY for 3 days and raises the ease factor', () => {
    const result = sm2(newCard, 'EASY', NOW);

    expect(result.repetitions).toBe(1);
    expect(result.intervalDays).toBe(3);
    expect(result.easeFactor).toBeCloseTo(2.65);
  });

  it('grows mature cards faster on EASY than on GOOD', () => {
    const state: Sm2State = {
      easeFactor: 2.5,
      intervalDays: 10,
      repetitions: 3,
    };

    const good = sm2(state, 'GOOD', NOW);
    const easy = sm2(state, 'EASY', NOW);

    expect(good.intervalDays).toBe(25); // round(10 * 2.5)
    expect(easy.intervalDays).toBe(34); // round(10 * 2.65 * 1.3)
  });

  it('resets repetitions and interval and lowers ease on AGAIN', () => {
    const result = sm2(
      { easeFactor: 2.5, intervalDays: 20, repetitions: 4 },
      'AGAIN',
      NOW,
    );

    expect(result.repetitions).toBe(0);
    expect(result.intervalDays).toBe(0);
    expect(result.easeFactor).toBeCloseTo(2.3);
    expect(result.dueDate).toEqual(utcMidnight('2026-07-15'));
  });

  it('makes a card graded late at night due the next morning', () => {
    const lateNight = new Date('2026-07-15T23:30:00Z');
    const result = sm2(newCard, 'GOOD', lateNight);

    expect(result.intervalDays).toBe(1);
    expect(result.dueDate).toEqual(utcMidnight('2026-07-16'));
  });

  it('never lowers the ease factor below 1.3', () => {
    const result = sm2(
      { easeFactor: 1.35, intervalDays: 5, repetitions: 2 },
      'AGAIN',
      NOW,
    );

    expect(result.easeFactor).toBe(1.3);
  });

  it('caps the interval at 365 days', () => {
    const result = sm2(
      { easeFactor: 2.5, intervalDays: 300, repetitions: 8 },
      'GOOD',
      NOW,
    );

    expect(result.intervalDays).toBe(365);
  });

  it('recovers a lapsed card through the learning steps again', () => {
    const lapsed = sm2(
      { easeFactor: 2.5, intervalDays: 20, repetitions: 4 },
      'AGAIN',
      NOW,
    );
    const relearned = sm2(lapsed, 'GOOD', NOW);

    expect(relearned.repetitions).toBe(1);
    expect(relearned.intervalDays).toBe(1);
    expect(relearned.easeFactor).toBeCloseTo(2.3);
  });
});
