import { describe, expect, it } from "vitest";

import { sampleAQuestions } from "@/data/ctfl-sample-a";
import {
  answerIsCorrect,
  createRandomSet,
  gradeQuiz,
  OFFICIAL_SET_SIZE,
  RANDOM_SET_SIZE,
} from "@/lib/quiz-engine";

const officialAnswerKey = [
  "c", "a", "a", "b", "b", "a,e", "b", "d", "d", "c",
  "d", "c", "a", "b", "a", "d", "b", "d", "c", "b",
  "a", "d", "d", "a", "d", "a", "c", "b", "a", "c",
  "c,e", "d", "a", "a", "c", "d", "c", "c", "c", "b",
];

function fillCorrectAnswers(
  questionCount: number,
  correctCount: number,
): Record<number, (typeof sampleAQuestions)[number]["ans"]> {
  return Object.fromEntries(
    questionCount === OFFICIAL_SET_SIZE ? sampleAQuestions.map((question, index) => [
      question.n,
      index < correctCount ? question.ans : [],
    ]) : sampleAQuestions.slice(0, questionCount).map((question, index) => [
      question.n,
      index < correctCount ? question.ans : [],
    ]),
  );
}

describe("official CTFL Sample Set A bank", () => {
  it("contains the 40 questions and matches the official answer PDF key", () => {
    expect(sampleAQuestions).toHaveLength(OFFICIAL_SET_SIZE);
    expect(sampleAQuestions.map((question) => question.ans.join(","))).toEqual(officialAnswerKey);

    for (const question of sampleAQuestions) {
      expect(question.ans.every((answer) => answer in question.opt)).toBe(true);
    }
  });
});

describe("quiz scoring", () => {
  it("requires all selected answers for a two-answer question", () => {
    const question = sampleAQuestions.find((item) => item.n === 6);
    expect(question).toBeDefined();

    if (!question) return;

    expect(answerIsCorrect(question, ["a", "e"])).toBe(true);
    expect(answerIsCorrect(question, ["a"])).toBe(false);
  });

  it("sets the full Set A passing mark to 26 out of 40", () => {
    const gradeAt26 = gradeQuiz(sampleAQuestions, fillCorrectAnswers(OFFICIAL_SET_SIZE, 26));
    const gradeAt25 = gradeQuiz(sampleAQuestions, fillCorrectAnswers(OFFICIAL_SET_SIZE, 25));

    expect(gradeAt26).toMatchObject({ correctCount: 26, total: 40, passMark: 26, passed: true });
    expect(gradeAt25).toMatchObject({ correctCount: 25, passMark: 26, passed: false });
  });

  it("sets a 20-question random practice exam passing mark to 13", () => {
    const questions = sampleAQuestions.slice(0, RANDOM_SET_SIZE);
    const answersAt13 = fillCorrectAnswers(RANDOM_SET_SIZE, 13);
    const answersAt12 = fillCorrectAnswers(RANDOM_SET_SIZE, 12);

    expect(gradeQuiz(questions, answersAt13)).toMatchObject({
      correctCount: 13,
      total: 20,
      passMark: 13,
      passed: true,
    });
    expect(gradeQuiz(questions, answersAt12)).toMatchObject({ passMark: 13, passed: false });
  });
});

describe("random question sets", () => {
  it("selects 20 unique questions and can produce a different set on another run", () => {
    const firstRun = createRandomSet(sampleAQuestions, RANDOM_SET_SIZE, () => 0);
    const secondRun = createRandomSet(sampleAQuestions, RANDOM_SET_SIZE, () => 0.99);

    expect(firstRun).toHaveLength(RANDOM_SET_SIZE);
    expect(new Set(firstRun.map((question) => question.n)).size).toBe(RANDOM_SET_SIZE);
    expect(secondRun.map((question) => question.n)).not.toEqual(
      firstRun.map((question) => question.n),
    );
  });
});