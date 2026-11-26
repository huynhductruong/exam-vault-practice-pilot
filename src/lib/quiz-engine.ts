import type { AnswerKey, ExamQuestion } from "@/data/ctfl-sample-a";

export const RANDOM_SET_SIZE = 20;
export const OFFICIAL_SET_SIZE = 40;
export const PASS_RATE = 0.65;

export function getPassMark(total: number): number {
  return Math.ceil(total * PASS_RATE);
}

export function answerIsCorrect(question: ExamQuestion, selected: readonly AnswerKey[]): boolean {
  return (
    selected.length === question.ans.length &&
    question.ans.every((answer) => selected.includes(answer))
  );
}

export type QuizGrade = {
  correctCount: number;
  total: number;
  passMark: number;
  percentage: number;
  passed: boolean;
};

export function gradeQuiz(
  questions: readonly ExamQuestion[],
  answers: Readonly<Record<number, readonly AnswerKey[]>>,
): QuizGrade {
  const correctCount = questions.filter((question) =>
    answerIsCorrect(question, answers[question.n] ?? []),
  ).length;
  const total = questions.length;
  const passMark = getPassMark(total);

  return {
    correctCount,
    total,
    passMark,
    percentage: total === 0 ? 0 : Math.round((correctCount / total) * 100),
    passed: total > 0 && correctCount >= passMark,
  };
}

export function createRandomSet(
  questions: readonly ExamQuestion[],
  count: number,
  random: () => number = Math.random,
): ExamQuestion[] {
  const shuffled = [...questions];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const requestedIndex = Math.floor(random() * (index + 1));
    const swapIndex = Math.min(index, Math.max(0, requestedIndex));
    const current = shuffled[index];
    const target = shuffled[swapIndex];

    if (current && target) {
      shuffled[index] = target;
      shuffled[swapIndex] = current;
    }
  }

  const safeCount = Math.max(0, Math.min(Math.floor(count), shuffled.length));
  return shuffled.slice(0, safeCount);
}