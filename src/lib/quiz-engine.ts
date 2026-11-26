import type { AnswerKey, ExamQuestion } from "@/data/ctfl-sample-a";

export const RANDOM_SET_SIZE = 20;
export const OFFICIAL_SET_SIZE = 40;
export const PASS_RATE = 0.65;

export function getPassMark(total: number, passRate = PASS_RATE): number {
  return Math.ceil(total * passRate);
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
  passRate = PASS_RATE,
): QuizGrade {
  const correctCount = questions.filter((question) =>
    answerIsCorrect(question, answers[question.n] ?? []),
  ).length;
  const total = questions.length;
  const passMark = getPassMark(total, passRate);

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
  return shuffled.slice(0, safeCount).map((question) => {
    const entries = Object.entries(question.opt) as Array<[AnswerKey, string]>;
    const displayKeys = entries.map(([key]) => key).sort();
    for (let index = entries.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(random() * (index + 1));
      [entries[index], entries[swapIndex]] = [entries[swapIndex], entries[index]];
    }
    const remappedOptions: Partial<Record<AnswerKey, string>> = {};
    const remappedExplanations: Partial<Record<AnswerKey, string>> = {};
    const remappedAnswers: AnswerKey[] = [];
    entries.forEach(([originalKey, value], index) => {
      const displayKey = displayKeys[index];
      if (!displayKey) return;
      remappedOptions[displayKey] = value;
      if (question.ex[originalKey]) remappedExplanations[displayKey] = question.ex[originalKey];
      if (question.ans.includes(originalKey)) remappedAnswers.push(displayKey);
    });
    return {
      ...question,
      ans: remappedAnswers,
      opt: remappedOptions as ExamQuestion["opt"],
      ex: remappedExplanations as ExamQuestion["ex"],
    };
  });
}
