export type Grade = 'AGAIN' | 'GOOD' | 'EASY';

export interface Sm2State {
  easeFactor: number;
  intervalDays: number;
  repetitions: number;
}

export interface Sm2Result extends Sm2State {
  dueDate: Date;
}

const MIN_EASE = 1.3;
const MAX_INTERVAL_DAYS = 365;
const EASY_BONUS = 1.3;

export function sm2(
  state: Sm2State,
  grade: Grade,
  now: Date = new Date(),
): Sm2Result {
  let { easeFactor, intervalDays, repetitions } = state;

  if (grade === 'AGAIN') {
    easeFactor = Math.max(MIN_EASE, easeFactor - 0.2);
    repetitions = 0;
    intervalDays = 0;
  } else {
    repetitions += 1;
    if (grade === 'EASY') {
      easeFactor += 0.15;
    }

    if (repetitions === 1) {
      intervalDays = grade === 'EASY' ? 3 : 1;
    } else if (repetitions === 2) {
      intervalDays = grade === 'EASY' ? 7 : 3;
    } else {
      const multiplier =
        grade === 'EASY' ? easeFactor * EASY_BONUS : easeFactor;
      intervalDays = Math.round(intervalDays * multiplier);
    }
    intervalDays = Math.min(intervalDays, MAX_INTERVAL_DAYS);
  }

  const dueDate = new Date(now.getTime() + intervalDays * 24 * 60 * 60 * 1000);

  return { easeFactor, intervalDays, repetitions, dueDate };
}
