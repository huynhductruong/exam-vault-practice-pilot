import type { AnswerKey, ExamQuestion } from "@/data/ctfl-sample-a";
import { answerIsCorrect, gradeQuiz } from "@/lib/quiz-engine";

export const PROGRESS_STORAGE_KEY = "ctfl-practice-progress-v1";
export const ACTIVE_SESSION_STORAGE_KEY = "ctfl-practice-active-session-v1";

export type AttemptMode = "random" | "official" | "practice";

export type AttemptRecord = {
  id: string;
  mode: AttemptMode;
  startedAt: string;
  completedAt: string;
  durationSeconds: number;
  questionIds: number[];
  answers: Record<number, AnswerKey[]>;
  flagged: number[];
  correctCount: number;
  wrongCount: number;
  unansweredCount: number;
  total: number;
  percentage: number;
  passed: boolean;
  passingPercentage?: number;
  title?: string;
};

export type WrongQuestionProgress = {
  questionId: number;
  wrongCount: number;
  lastWrongAt: string;
  nextReviewAt: string;
  history: Array<{ attemptId: string; answeredAt: string; selected: AnswerKey[] }>;
  correctStreak?: number;
  lastCorrectAt?: string;
};

export type ProgressData = {
  version: 1;
  attempts: AttemptRecord[];
  wrongQuestions: Record<number, WrongQuestionProgress>;
};

export const emptyProgress = (): ProgressData => ({ version: 1, attempts: [], wrongQuestions: {} });

export function readProgress(storage: Pick<Storage, "getItem">): ProgressData {
  const raw = storage.getItem(PROGRESS_STORAGE_KEY);
  if (!raw) return emptyProgress();
  try {
    const parsed = JSON.parse(raw) as Partial<ProgressData>;
    if (parsed.version !== 1 || !Array.isArray(parsed.attempts) || !parsed.wrongQuestions) {
      return emptyProgress();
    }
    return parsed as ProgressData;
  } catch {
    return emptyProgress();
  }
}

export function saveAttempt(
  storage: Pick<Storage, "getItem" | "setItem">,
  input: {
    id: string;
    mode: AttemptMode;
    startedAt: number;
    completedAt: number;
    questions: readonly ExamQuestion[];
    answers: Record<number, AnswerKey[]>;
    flagged: number[];
    passingPercentage?: number;
    title?: string;
  },
): ProgressData {
  const current = readProgress(storage);
  if (current.attempts.some((attempt) => attempt.id === input.id)) return current;

  const grade = gradeQuiz(input.questions, input.answers, (input.passingPercentage ?? 65) / 100);
  const unansweredCount = input.questions.filter(
    (question) => (input.answers[question.n]?.length ?? 0) === 0,
  ).length;
  const completedAt = new Date(input.completedAt).toISOString();
  const record: AttemptRecord = {
    id: input.id,
    mode: input.mode,
    startedAt: new Date(input.startedAt).toISOString(),
    completedAt,
    durationSeconds: Math.max(0, Math.round((input.completedAt - input.startedAt) / 1000)),
    questionIds: input.questions.map((question) => question.n),
    answers: input.answers,
    flagged: input.flagged,
    correctCount: grade.correctCount,
    wrongCount: grade.total - grade.correctCount - unansweredCount,
    unansweredCount,
    total: grade.total,
    percentage: grade.percentage,
    passed: grade.passed,
    passingPercentage: input.passingPercentage ?? 65,
    ...(input.title ? { title: input.title } : {}),
  };

  const next: ProgressData = {
    ...current,
    attempts: [record, ...current.attempts],
    wrongQuestions: { ...current.wrongQuestions },
  };

  for (const question of input.questions) {
    const selected = input.answers[question.n] ?? [];
    const previous = next.wrongQuestions[question.n];
    if (answerIsCorrect(question, selected)) {
      if (previous) {
        next.wrongQuestions[question.n] = {
          ...previous,
          correctStreak: (previous.correctStreak ?? 0) + 1,
          lastCorrectAt: completedAt,
        };
      }
      continue;
    }
    const wrongCount = (previous?.wrongCount ?? 0) + 1;
    const delayDays = Math.min(7, 2 ** Math.min(wrongCount - 1, 3));
    const nextReviewAt = new Date(input.completedAt + delayDays * 86_400_000).toISOString();
    next.wrongQuestions[question.n] = {
      questionId: question.n,
      wrongCount,
      lastWrongAt: completedAt,
      nextReviewAt,
      history: [
        ...(previous?.history ?? []),
        { attemptId: input.id, answeredAt: completedAt, selected: [...selected] },
      ],
      correctStreak: 0,
    };
  }

  storage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(next));
  return next;
}

export function getProgressSummary(progress: ProgressData) {
  const completedExamIds = new Set(
    progress.attempts
      .filter((attempt) => attempt.mode === "official" && attempt.questionIds.length === 40)
      .map((attempt) => Math.floor((attempt.questionIds[0] ?? 0) / 100)),
  );
  const uniqueQuestionIds = new Set(progress.attempts.flatMap((attempt) => attempt.questionIds));
  const examAttempts = progress.attempts.filter((attempt) => attempt.mode !== "practice");
  return {
    totalAttempts: progress.attempts.length,
    completedExamCount: completedExamIds.size,
    uniqueQuestionCount: uniqueQuestionIds.size,
    wrongQuestionCount: Object.keys(progress.wrongQuestions).length,
    passRate:
      examAttempts.length === 0
        ? null
        : Math.round(
            (examAttempts.filter((attempt) => attempt.passed).length / examAttempts.length) * 100,
          ),
  };
}
