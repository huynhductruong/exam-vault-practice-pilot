import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowLeft,
  ArrowRight,
  BookOpenCheck,
  Check,
  ChevronDown,
  ClipboardList,
  Clock3,
  Database,
  ExternalLink,
  Flag,
  History,
  LineChart,
  RotateCcw,
  Timer,
  Upload,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { ImportExam } from "@/components/import-exam";
import { examSourceCatalog } from "@/data/exam-source-catalog";
import {
  sampleAQuestions,
  sampleASource,
  type AnswerKey,
  type ExamQuestion,
} from "@/data/ctfl-sample-a";
import { sampleBQuestions } from "@/data/ctfl-sample-b";
import { sampleCQuestions } from "@/data/ctfl-sample-c";
import { sampleDQuestions } from "@/data/ctfl-sample-d";
import { answerIsCorrect, createRandomSet, gradeQuiz, OFFICIAL_SET_SIZE } from "@/lib/quiz-engine";
import {
  ACTIVE_SESSION_STORAGE_KEY,
  emptyProgress,
  getProgressSummary,
  readProgress,
  saveAttempt,
  type ProgressData,
} from "@/lib/progress-store";
import { readImportedExams, saveImportedExams, type ImportedExam } from "@/lib/exam-import";

type QuizMode = "random" | "official" | "practice";
type ReviewFilter = "all" | "wrong" | "flagged";
type AppView = "dashboard" | "bank" | "import" | "history" | "mistakes" | "bookmarks" | "analytics";

type QuizSession = {
  id: string;
  startedAt: number;
  mode: QuizMode;
  questions: ExamQuestion[];
  answers: Record<number, AnswerKey[]>;
  flagged: number[];
  checked: number[];
  current: number;
  endsAt: number | null;
  submitted: boolean;
  passingPercentage: number;
  title?: string;
  durationMinutes?: number | null;
};

const chapters = [
  "Nền tảng kiểm thử",
  "Kiểm thử trong SDLC",
  "Kiểm thử tĩnh",
  "Phân tích & thiết kế kiểm thử",
  "Quản lý hoạt động kiểm thử",
  "Công cụ kiểm thử",
];

const officialImportedQuestions: ExamQuestion[] = [
  ...sampleBQuestions,
  ...sampleCQuestions,
  ...sampleDQuestions,
];
const allQuestions: ExamQuestion[] = [sampleAQuestions, officialImportedQuestions].flat();

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CTFL Practice | Luyện thi ISTQB CTFL v4.0" },
      {
        name: "description",
        content:
          "Luyện tập ISTQB CTFL v4.0 với đề mẫu công khai, chấm điểm và lời giải tiếng Việt.",
      },
      { property: "og:title", content: "CTFL Practice | Luyện thi ISTQB CTFL v4.0" },
      {
        property: "og:description",
        content: "Luyện đề CTFL v4.0 bằng tiếng Việt với bộ câu hỏi mẫu ISTQB đã đối chiếu đáp án.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Index,
});

function Index() {
  const [session, setSession] = useState<QuizSession | null>(null);
  const [reviewFilter, setReviewFilter] = useState<ReviewFilter>("all");
  const [now, setNow] = useState(0);
  const [progress, setProgress] = useState<ProgressData>(emptyProgress);
  const [view, setView] = useState<AppView>("dashboard");
  const [importedExams, setImportedExams] = useState<ImportedExam[]>([]);

  useEffect(() => {
    setProgress(readProgress(window.localStorage));
    setImportedExams(readImportedExams(window.localStorage));
    const saved = window.localStorage.getItem(ACTIVE_SESSION_STORAGE_KEY);
    if (!saved) return;
    try {
      const restored = JSON.parse(saved) as QuizSession;
      if (
        !restored.submitted &&
        Array.isArray(restored.questions) &&
        restored.questions.length > 0
      ) {
        setSession(restored);
        setNow(Date.now());
      }
    } catch {
      window.localStorage.removeItem(ACTIVE_SESSION_STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    if (!session || session.submitted) return;
    window.localStorage.setItem(ACTIVE_SESSION_STORAGE_KEY, JSON.stringify(session));
  }, [session]);

  useEffect(() => {
    if (!session || session.endsAt === null || session.submitted) return;

    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, [session]);

  useEffect(() => {
    if (!session || session.endsAt === null || session.submitted || now < session.endsAt) return;
    const completedAt = Date.now();
    setSession((current) => (current ? { ...current, submitted: true } : current));
    window.localStorage.removeItem(ACTIVE_SESSION_STORAGE_KEY);
    setProgress(
      saveAttempt(window.localStorage, {
        id: session.id,
        mode: session.mode,
        startedAt: session.startedAt,
        completedAt,
        questions: session.questions,
        answers: session.answers,
        flagged: session.flagged,
        passingPercentage: session.passingPercentage ?? 65,
        ...(session.title ? { title: session.title } : {}),
      }),
    );
  }, [now, session]);

  const startQuiz = (mode: QuizMode, sourceSet?: string, durationOverride?: number | null) => {
    const pool =
      sourceSet === "A"
        ? sampleAQuestions
        : sourceSet
          ? officialImportedQuestions.filter((question) => question.sourceSet === sourceSet)
          : [...allQuestions, ...importedExams.flatMap((exam) => exam.questions)];
    if (pool.length === 0) return;
    const questionCount = OFFICIAL_SET_SIZE;
    const minutes =
      durationOverride !== undefined ? durationOverride : mode === "practice" ? null : 60;

    setNow(Date.now());
    setReviewFilter("all");
    setSession({
      id: crypto.randomUUID(),
      startedAt: Date.now(),
      mode,
      questions: sourceSet
        ? [...pool].sort((first, second) => first.n - second.n)
        : createRandomSet(pool, questionCount),
      answers: {},
      flagged: [],
      checked: [],
      current: 0,
      endsAt: minutes === null ? null : Date.now() + minutes * 60_000,
      submitted: false,
      passingPercentage: 65,
      title: sourceSet
        ? `ISTQB CTFL Sample Exam Set ${sourceSet}`
        : mode === "practice"
          ? "Luyện tập ngẫu nhiên"
          : "Đề thi ngẫu nhiên từ tất cả bộ đề",
      durationMinutes: minutes,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const startQuestions = (
    questions: ExamQuestion[],
    mode: QuizMode,
    minutes: number | null,
    passingPercentage = 65,
    title?: string,
    randomize = true,
  ) => {
    if (questions.length === 0) return;
    const startedAt = Date.now();
    setNow(startedAt);
    setReviewFilter("all");
    setSession({
      id: crypto.randomUUID(),
      startedAt,
      mode,
      questions: randomize
        ? createRandomSet(questions, questions.length)
        : [...questions].sort((first, second) => first.n - second.n),
      answers: {},
      flagged: [],
      checked: [],
      current: 0,
      endsAt: minutes === null ? null : startedAt + minutes * 60_000,
      submitted: false,
      passingPercentage,
      durationMinutes: minutes,
      ...(title ? { title } : {}),
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const saveImportedExam = (exam: ImportedExam) => {
    const duplicate = importedExams.some((item) => item.id === exam.id);
    const versionedExam = duplicate ? { ...exam, id: `${exam.id}-${crypto.randomUUID()}` } : exam;
    const base =
      Math.max(
        19_000,
        ...importedExams.flatMap((item) => item.questions.map((question) => question.n)),
      ) + 1_000;
    const normalized = {
      ...versionedExam,
      questions: versionedExam.questions.map((question, index) => ({
        ...question,
        n: base + index + 1,
      })),
    };
    const next = [normalized, ...importedExams];
    try {
      saveImportedExams(window.localStorage, next);
    } catch {
      window.alert("Không đủ dung lượng lưu trữ trên thiết bị. Hãy xóa bớt bộ đề đã import.");
      return;
    }
    setImportedExams(next);
    setView("bank");
  };

  const deleteImportedExam = (id: string) => {
    if (!window.confirm("Xóa bộ đề đã import khỏi thiết bị này?")) return;
    const next = importedExams.filter((exam) => exam.id !== id);
    saveImportedExams(window.localStorage, next);
    setImportedExams(next);
  };

  const reviewWrongQuestions = () => {
    const wrongIds = new Set(
      Object.values(progress.wrongQuestions)
        .filter((item) => (item.correctStreak ?? 0) < 2)
        .sort((a, b) => new Date(a.nextReviewAt).getTime() - new Date(b.nextReviewAt).getTime())
        .map((item) => item.questionId),
    );
    const questions = createRandomSet(
      [...allQuestions, ...importedExams.flatMap((exam) => exam.questions)].filter((question) =>
        wrongIds.has(question.n),
      ),
      10,
    );
    startQuestions(questions, "practice", null, 65, "Ôn lại câu sai");
  };

  const openAttempt = (attemptId: string) => {
    const attempt = progress.attempts.find((item) => item.id === attemptId);
    if (!attempt) return;
    const questionMap = new Map(
      [...allQuestions, ...importedExams.flatMap((exam) => exam.questions)].map((question) => [
        question.n,
        question,
      ]),
    );
    const questions = attempt.questionIds
      .map((id) => questionMap.get(id))
      .filter((question): question is ExamQuestion => Boolean(question));
    if (questions.length === 0) return;
    setSession({
      id: attempt.id,
      startedAt: new Date(attempt.startedAt).getTime(),
      mode: attempt.mode,
      questions,
      answers: attempt.answers,
      flagged: attempt.flagged,
      checked: [],
      current: 0,
      endsAt: null,
      submitted: true,
      passingPercentage: attempt.passingPercentage ?? 65,
      title: attempt.title ?? "Xem lại lịch sử",
    });
  };

  const closeQuiz = () => {
    setSession(null);
    window.localStorage.removeItem(ACTIVE_SESSION_STORAGE_KEY);
    setReviewFilter("all");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const chooseAnswer = (key: AnswerKey) => {
    if (!session || session.submitted) return;
    const question = session.questions[session.current];
    if (!question || (session.mode === "practice" && session.checked.includes(question.n))) return;

    const selected = session.answers[question.n] ?? [];
    let next: AnswerKey[];

    if (question.ans.length > 1) {
      next = selected.includes(key)
        ? selected.filter((item) => item !== key)
        : selected.length < question.ans.length
          ? [...selected, key]
          : selected;
    } else {
      next = selected.includes(key) ? [] : [key];
    }

    setSession({ ...session, answers: { ...session.answers, [question.n]: next } });
  };

  const moveTo = (index: number) => {
    if (!session || index < 0 || index >= session.questions.length) return;
    setSession({ ...session, current: index });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const toggleFlag = () => {
    if (!session) return;
    const question = session.questions[session.current];
    if (!question) return;
    const flagged = session.flagged.includes(question.n)
      ? session.flagged.filter((number) => number !== question.n)
      : [...session.flagged, question.n];
    setSession({ ...session, flagged });
  };

  const checkCurrent = () => {
    if (!session) return;
    const question = session.questions[session.current];
    if (!question || !session.answers[question.n]?.length) return;
    setSession({ ...session, checked: [...session.checked, question.n] });
  };

  const submitQuiz = () => {
    if (!session) return;
    const submitted = { ...session, submitted: true };
    setSession(submitted);
    window.localStorage.removeItem(ACTIVE_SESSION_STORAGE_KEY);
    setProgress(
      saveAttempt(window.localStorage, {
        id: session.id,
        mode: session.mode,
        startedAt: session.startedAt,
        completedAt: Date.now(),
        questions: session.questions,
        answers: session.answers,
        flagged: session.flagged,
        passingPercentage: session.passingPercentage ?? 65,
        ...(session.title ? { title: session.title } : {}),
      }),
    );
  };

  if (!session) {
    const frame = (content: React.ReactNode) => (
      <AppFrame activeView={view} onNavigate={setView}>
        {content}
      </AppFrame>
    );
    if (view === "import")
      return frame(
        <ImportExam
          onImport={saveImportedExam}
          existingQuestions={[...allQuestions, ...importedExams.flatMap((exam) => exam.questions)]}
        />,
      );
    if (view === "bank")
      return frame(
        <ExamBank
          importedExams={importedExams}
          onStartOfficial={(set) => startQuiz("official", set)}
          onStartImported={(exam) =>
            startQuestions(
              exam.questions,
              "official",
              exam.durationMinutes,
              exam.passingPercentage,
              exam.title,
              false,
            )
          }
          onDelete={deleteImportedExam}
        />,
      );
    if (view === "history") return frame(<HistoryView progress={progress} onOpen={openAttempt} />);
    if (view === "mistakes")
      return frame(
        <MistakesView
          progress={progress}
          questions={[...allQuestions, ...importedExams.flatMap((exam) => exam.questions)]}
          onReview={reviewWrongQuestions}
        />,
      );
    if (view === "bookmarks")
      return frame(
        <BookmarksView
          progress={progress}
          questions={[...allQuestions, ...importedExams.flatMap((exam) => exam.questions)]}
        />,
      );
    if (view === "analytics")
      return frame(
        <AnalyticsView
          progress={progress}
          questions={[...allQuestions, ...importedExams.flatMap((exam) => exam.questions)]}
        />,
      );
    return (
      <HomeScreen
        progress={progress}
        onStart={startQuiz}
        onReviewWrong={reviewWrongQuestions}
        onNavigate={setView}
      />
    );
  }

  if (session.submitted) {
    return (
      <ResultsScreen
        session={session}
        filter={reviewFilter}
        onFilterChange={setReviewFilter}
        onRestart={() =>
          startQuestions(
            session.questions,
            session.mode,
            session.durationMinutes ?? null,
            session.passingPercentage ?? 65,
            session.title,
          )
        }
        onHome={closeQuiz}
      />
    );
  }

  const currentQuestion = session.questions[session.current];
  if (!currentQuestion) return null;

  const remainingSeconds =
    session.endsAt === null ? null : Math.max(0, Math.ceil((session.endsAt - now) / 1000));
  const answeredCount = session.questions.filter(
    (question) => (session.answers[question.n]?.length ?? 0) > 0,
  ).length;
  const isPracticeChecked =
    session.mode === "practice" && session.checked.includes(currentQuestion.n);
  const selected = session.answers[currentQuestion.n] ?? [];
  const questionModeLabel =
    session.title ??
    (session.mode === "official"
      ? `Thi thử Set ${currentQuestion.sourceSet ?? "A"}`
      : session.mode === "random"
        ? "Đề ngẫu nhiên"
        : "Luyện tập");

  return (
    <AppFrame>
      <div className="session-topbar">
        <div>
          <Button variant="ghost" size="sm" onClick={closeQuiz}>
            <ArrowLeft aria-hidden="true" /> Về trang chính
          </Button>
          <span className="session-title">{questionModeLabel}</span>
        </div>
        <div className="session-status">
          <span className="answered-counter">
            Đã trả lời <strong>{answeredCount}</strong>/{session.questions.length}
          </span>
          {remainingSeconds !== null && (
            <span className={`timer-readout${remainingSeconds < 300 ? " timer-low" : ""}`}>
              <Clock3 aria-hidden="true" /> {formatTime(remainingSeconds)}
            </span>
          )}
        </div>
      </div>

      <div className="quiz-layout">
        <section className="question-workspace" aria-label="Câu hỏi hiện tại">
          <div className="question-heading">
            <div>
              <p className="eyebrow">
                Câu {session.current + 1} / {session.questions.length}
              </p>
              <h1>{currentQuestion.lo}</h1>
            </div>
            <Button
              variant={session.flagged.includes(currentQuestion.n) ? "secondary" : "ghost"}
              size="sm"
              onClick={toggleFlag}
              aria-pressed={session.flagged.includes(currentQuestion.n)}
            >
              <Flag aria-hidden="true" />
              {session.flagged.includes(currentQuestion.n) ? "Bỏ đánh dấu" : "Đánh dấu"}
            </Button>
          </div>

          <QuestionContent question={currentQuestion} />

          <p className="answer-instruction">
            {currentQuestion.ans.length > 1
              ? `Chọn đủ ${currentQuestion.ans.length} phương án.`
              : "Chọn một phương án."}
          </p>
          <ChoiceList
            question={currentQuestion}
            selected={selected}
            onChoose={chooseAnswer}
            reveal={isPracticeChecked}
          />

          {isPracticeChecked && (
            <AnswerExplanation question={currentQuestion} selected={selected} />
          )}

          <div className="question-controls">
            <Button
              variant="outline"
              onClick={() => moveTo(session.current - 1)}
              disabled={session.current === 0}
            >
              <ArrowLeft aria-hidden="true" /> Câu trước
            </Button>
            {session.mode === "practice" && !isPracticeChecked && (
              <Button
                onClick={checkCurrent}
                disabled={selected.length === 0}
                className="control-primary"
              >
                <Check aria-hidden="true" /> Kiểm tra
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => moveTo(session.current + 1)}
              disabled={session.current === session.questions.length - 1}
            >
              Câu tiếp <ArrowRight aria-hidden="true" />
            </Button>
          </div>
        </section>

        <aside className="question-navigator" aria-label="Danh sách câu hỏi">
          <div className="navigator-heading">
            <div>
              <p className="eyebrow">Tiến độ</p>
              <h2>
                {answeredCount} / {session.questions.length}
              </h2>
            </div>
            <ClipboardList aria-hidden="true" />
          </div>
          <div className="question-grid">
            {session.questions.map((question, index) => {
              const wasAnswered = (session.answers[question.n]?.length ?? 0) > 0;
              const wasChecked = session.checked.includes(question.n);
              const isCorrect = answerIsCorrect(question, session.answers[question.n] ?? []);
              const status = wasChecked ? (isCorrect ? "question-correct" : "question-wrong") : "";

              return (
                <Button
                  key={question.n}
                  variant="outline"
                  size="icon"
                  className={`question-cell${index === session.current ? " question-current" : ""}${wasAnswered ? " question-answered" : ""}${status}${session.flagged.includes(question.n) ? " question-flagged" : ""}`}
                  onClick={() => moveTo(index)}
                  aria-label={`Câu ${index + 1}${wasAnswered ? ", đã trả lời" : ", chưa trả lời"}${session.flagged.includes(question.n) ? ", đã đánh dấu" : ""}`}
                  aria-current={index === session.current ? "step" : undefined}
                >
                  {index + 1}
                </Button>
              );
            })}
          </div>
          <div className="navigator-legend">
            <span>
              <i className="legend-dot legend-answered" /> Đã trả lời
            </span>
            <span>
              <i className="legend-dot legend-flagged" /> Đánh dấu
            </span>
            {session.mode === "practice" && (
              <span>
                <i className="legend-dot legend-correct" /> Đúng
              </span>
            )}
          </div>
          <Button className="submit-button" onClick={submitQuiz}>
            Nộp bài <ChevronDown aria-hidden="true" />
          </Button>
          <p className="submit-note">
            {session.questions.length - answeredCount > 0
              ? `Còn ${session.questions.length - answeredCount} câu chưa trả lời.`
              : "Bạn đã trả lời tất cả câu hỏi."}
          </p>
        </aside>
      </div>
    </AppFrame>
  );
}

function HomeScreen({
  progress,
  onStart,
  onNavigate,
}: {
  progress: ProgressData;
  onStart: (mode: QuizMode, sourceSet?: string, durationOverride?: number | null) => void;
  onReviewWrong: () => void;
  onNavigate: (view: AppView) => void;
}) {
  const completedExamCount = progress.attempts.filter(
    (attempt) => attempt.mode === "official" && attempt.total === 40,
  ).length;
  return (
    <AppFrame activeView="dashboard" onNavigate={onNavigate}>
      <section className="simple-exam-panel">
        <div className="simple-exam-heading">
          <h1>Đề thi mẫu ISTQB® CTFL v4.0</h1>
          <span>
            <strong>{completedExamCount}</strong> đề đã giải
          </span>
        </div>
        <p>
          Mỗi lượt tạo 40 câu ngẫu nhiên từ tất cả bộ đề, đồng thời đảo thứ tự câu hỏi và các phương
          án. Thời gian chuẩn: 60 phút; thời gian cộng thêm 25%: 75 phút. Điểm đạt:{" "}
          <strong>26/40 (65%)</strong>.
        </p>
        <div className="simple-mode-grid">
          <button type="button" onClick={() => onStart("official", undefined, 60)}>
            <strong>📝 Thi thử</strong>
            <span>Đồng hồ đếm ngược 60 phút, nộp bài để xem điểm và lời giải chi tiết.</span>
          </button>
          <button type="button" onClick={() => onStart("official", undefined, 75)}>
            <strong>⏱️ Thi thử 75 phút</strong>
            <span>Thời gian cộng thêm 25% dành cho thí sinh không thi bằng tiếng mẹ đẻ.</span>
          </button>
          <button type="button" onClick={() => onStart("practice", undefined, null)}>
            <strong>📖 Luyện tập</strong>
            <span>Không giới hạn thời gian. Kiểm tra ngay đúng, sai và đọc giải thích.</span>
          </button>
        </div>
        <small>Mẹo: dùng phím A–E để chọn đáp án, ←/→ để chuyển câu, Enter để kiểm tra.</small>
      </section>
    </AppFrame>
  );
}

function LegacyHomeScreen({
  progress,
  extendedTime,
  onExtendedTimeChange,
  onStart,
  onReviewWrong,
  onNavigate,
}: {
  progress: ProgressData;
  extendedTime: boolean;
  onExtendedTimeChange: (value: boolean) => void;
  onStart: (mode: QuizMode, sourceSet?: string) => void;
  onReviewWrong: () => void;
  onNavigate: (view: AppView) => void;
}) {
  const summary = getProgressSummary(progress);
  return (
    <AppFrame activeView="dashboard" onNavigate={onNavigate}>
      <section className="welcome-band">
        <div className="welcome-copy">
          <p className="eyebrow">ISTQB® · FOUNDATION LEVEL · V4.0.1</p>
          <h1>CTFL Practice</h1>
          <p>
            Luyện thi với bốn bộ đề mẫu chính thức Set A–D, có đáp án và giải thích từng lựa chọn.
          </p>
        </div>
        <div className="question-count-mark" aria-label="160 câu hỏi">
          <BookOpenCheck aria-hidden="true" />
          <strong>160</strong>
          <span>câu chính thức</span>
        </div>
      </section>

      <section className="exam-facts" aria-label="Thông tin đề thi">
        <div className="fact-item">
          <strong>40</strong>
          <span>câu trong đề mẫu</span>
        </div>
        <div className="fact-item">
          <strong>60 phút</strong>
          <span>thời gian chuẩn</span>
        </div>
        <div className="fact-item">
          <strong>26 / 40</strong>
          <span>điểm đạt · 65%</span>
        </div>
        <div className="fact-item">
          <strong>6</strong>
          <span>chương kiến thức</span>
        </div>
      </section>

      <section className="progress-summary" aria-labelledby="progress-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">TIẾN ĐỘ CỦA BẠN</p>
            <h2 id="progress-title">Dữ liệu luyện tập trên thiết bị này</h2>
          </div>
          <span className="pool-count">{summary.totalAttempts} lượt đã lưu</span>
        </div>
        {summary.totalAttempts === 0 ? (
          <p className="empty-review">Chưa có dữ liệu. Kết quả sẽ được lưu sau khi bạn nộp bài.</p>
        ) : (
          <div className="progress-grid">
            <div>
              <strong>{summary.totalAttempts}</strong>
              <span>Tổng lượt làm</span>
            </div>
            <div>
              <strong>{summary.completedExamCount}</strong>
              <span>Bộ đề đã hoàn thành</span>
            </div>
            <div>
              <strong>{summary.uniqueQuestionCount}</strong>
              <span>Câu khác nhau đã luyện</span>
            </div>
            <div>
              <strong>{summary.wrongQuestionCount}</strong>
              <span>Câu trong ngân hàng sai</span>
            </div>
            <div>
              <strong>{summary.passRate === null ? "—" : `${summary.passRate}%`}</strong>
              <span>Tỷ lệ đạt bài có chấm</span>
            </div>
          </div>
        )}
      </section>

      {progress.attempts.length > 0 && (
        <section className="history-section" aria-labelledby="history-title">
          <div className="section-heading">
            <div>
              <p className="eyebrow">LỊCH SỬ LÀM BÀI</p>
              <h2 id="history-title">Các lượt gần đây</h2>
            </div>
          </div>
          <div className="history-table" role="table">
            <div className="history-row history-head" role="row">
              <span>Ngày làm</span>
              <span>Chế độ</span>
              <span>Kết quả</span>
              <span>Điểm</span>
            </div>
            {progress.attempts.slice(0, 10).map((attempt) => (
              <div className="history-row" role="row" key={attempt.id}>
                <span>{new Date(attempt.completedAt).toLocaleString("vi-VN")}</span>
                <span>
                  {attempt.mode === "official"
                    ? "Thi thử"
                    : attempt.mode === "random"
                      ? "Ngẫu nhiên"
                      : "Luyện tập"}
                </span>
                <span className={attempt.passed ? "history-pass" : "history-fail"}>
                  {attempt.passed ? "ĐẠT" : "CHƯA ĐẠT"}
                </span>
                <strong>
                  {attempt.correctCount}/{attempt.total} · {attempt.percentage}%
                </strong>
              </div>
            ))}
          </div>
        </section>
      )}

      {summary.wrongQuestionCount > 0 && (
        <section className="mistake-section" aria-labelledby="mistake-title">
          <div>
            <p className="eyebrow">ÔN LẠI CÂU SAI</p>
            <h2 id="mistake-title">{summary.wrongQuestionCount} câu cần củng cố</h2>
            <p>Hệ thống giữ một bản ghi cho mỗi câu và vẫn lưu số lần trả lời sai.</p>
          </div>
          <Button onClick={onReviewWrong}>
            Ôn 10 câu sai <ArrowRight aria-hidden="true" />
          </Button>
        </section>
      )}

      <section className="mode-section" aria-labelledby="mode-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">BẮT ĐẦU</p>
            <h2 id="mode-title">Chọn cách luyện</h2>
          </div>
          <span className="pool-count">160 câu đã đối chiếu đáp án</span>
        </div>

        <div className="mode-grid">
          <article className="mode-card mode-random">
            <div className="mode-icon">
              <RotateCcw aria-hidden="true" />
            </div>
            <p className="mode-kicker">20 CÂU · 30 PHÚT</p>
            <h3>Đề ngẫu nhiên</h3>
            <p>Mỗi lượt lấy 20 câu khác nhau từ bộ mẫu. Đạt khi đúng ít nhất 13 câu.</p>
            <Button onClick={() => onStart("random")} className="mode-action">
              Tạo đề ngẫu nhiên <ArrowRight aria-hidden="true" />
            </Button>
          </article>

          <article className="mode-card mode-official">
            <div className="mode-icon">
              <ClipboardList aria-hidden="true" />
            </div>
            <p className="mode-kicker">40 CÂU · ĐỀ MẪU SET A</p>
            <h3>Thi thử đầy đủ</h3>
            <p>Giữ nguyên đủ 40 câu của đề mẫu, xáo trộn thứ tự câu hỏi mỗi lượt.</p>
            <div className="time-choice" role="group" aria-label="Thời gian thi">
              <Button
                variant={!extendedTime ? "secondary" : "ghost"}
                size="sm"
                aria-pressed={!extendedTime}
                onClick={() => onExtendedTimeChange(false)}
              >
                60 phút
              </Button>
              <Button
                variant={extendedTime ? "secondary" : "ghost"}
                size="sm"
                aria-pressed={extendedTime}
                onClick={() => onExtendedTimeChange(true)}
              >
                75 phút
              </Button>
            </div>
            <Button onClick={() => onStart("official")} className="mode-action">
              Bắt đầu thi thử <ArrowRight aria-hidden="true" />
            </Button>
          </article>

          <article className="mode-card mode-practice">
            <div className="mode-icon">
              <BookOpenCheck aria-hidden="true" />
            </div>
            <p className="mode-kicker">KHÔNG GIỚI HẠN THỜI GIAN</p>
            <h3>Luyện từng câu</h3>
            <p>Chọn câu bất kỳ, kiểm tra ngay và đọc lời giải trước khi sang câu tiếp theo.</p>
            <Button onClick={() => onStart("practice")} className="mode-action">
              Bắt đầu luyện <ArrowRight aria-hidden="true" />
            </Button>
          </article>
        </div>
      </section>

      <section className="mode-section" aria-label="Bộ đề mẫu tiếng Anh">
        <h2 className="mb-4 text-xl font-semibold">Bộ đề mẫu tiếng Anh</h2>
        <div className="mode-grid">
          {examSourceCatalog.slice(1).map((source) => {
            const letter = source.id.slice(-1).toUpperCase();
            return (
              <article className="mode-card" key={source.id}>
                <h3>
                  Set {letter} · v{source.version}
                </h3>
                <p>40 câu · {extendedTime ? 75 : 60} phút · Đạt từ 26/40</p>
                <div className="result-actions mb-4">
                  <a href={samplePdf(letter, "Questions")} target="_blank" rel="noreferrer">
                    Đề gốc (PDF)
                  </a>
                  <a href={samplePdf(letter, "Answers")} target="_blank" rel="noreferrer">
                    Đáp án và lời giải (PDF)
                  </a>
                </div>
                <Button className="mode-action" onClick={() => onStart("official", letter)}>
                  Thi thử Set {letter}
                </Button>
              </article>
            );
          })}
        </div>
      </section>
      <SourcePanel />
    </AppFrame>
  );
}

function AppFrame({
  children,
  activeView,
  onNavigate,
}: {
  children: React.ReactNode;
  activeView?: AppView;
  onNavigate?: (view: AppView) => void;
}) {
  const nav: Array<{ id: AppView; label: string; icon: React.ReactNode }> = [
    { id: "dashboard", label: "Dashboard", icon: <LineChart /> },
    { id: "bank", label: "Ngân hàng đề", icon: <Database /> },
    { id: "import", label: "Import", icon: <Upload /> },
    { id: "mistakes", label: "Câu sai", icon: <RotateCcw /> },
    { id: "bookmarks", label: "Đánh dấu", icon: <Flag /> },
    { id: "history", label: "Lịch sử", icon: <History /> },
    { id: "analytics", label: "Phân tích", icon: <ClipboardList /> },
  ];
  return (
    <div className="app-frame min-h-screen bg-background text-foreground">
      <header className="topbar">
        <div className="topbar-inner">
          <div className="brand-lockup">
            <span className="brand-symbol">
              <BookOpenCheck aria-hidden="true" />
            </span>
            <span className="brand-copy">
              <strong>CTFL Practice</strong>
              <small>ISTQB® · Foundation Level</small>
            </span>
          </div>
          <span className="verified-label">
            <Check aria-hidden="true" /> Đáp án đã đối chiếu nguồn chính thức
          </span>
        </div>
      </header>
      {onNavigate && (
        <nav className="app-nav" aria-label="Điều hướng chính">
          {nav.map((item) => (
            <Button
              key={item.id}
              size="sm"
              variant={activeView === item.id ? "secondary" : "ghost"}
              onClick={() => onNavigate(item.id)}
            >
              {item.icon}
              {item.label}
            </Button>
          ))}
        </nav>
      )}
      <main className="page-content">{children}</main>
      <footer className="site-footer">
        Nguồn ISTQB® CTFL v4.0 Sample Exam Set A–D. Set A hiển thị tiếng Việt; Set B–D giữ nguyên
        tiếng Anh từ tài liệu gốc.
      </footer>
    </div>
  );
}

function SourcePanel() {
  return (
    <section className="source-panel" aria-labelledby="source-title">
      <div className="source-copy">
        <p className="eyebrow">NGUỒN ĐỀ</p>
        <h2 id="source-title">{sampleASource.title}</h2>
        <p>
          Phát hành {formatDate(sampleASource.released)} · Syllabus {sampleASource.syllabus} · Đáp
          án cả 40 câu đã được so khớp với PDF chính thức.
        </p>
        <p className="source-limit">
          Ngân hàng có bốn bộ đề mẫu ISTQB Set A–D. Set A có bản tiếng Việt, Set B–D dùng bản tiếng
          Anh.
        </p>
      </div>
      <div className="source-links">
        <a href={sampleASource.questionsUrl} target="_blank" rel="noreferrer">
          Đề gốc (PDF) <ExternalLink aria-hidden="true" />
        </a>
        <a href={sampleASource.answersUrl} target="_blank" rel="noreferrer">
          Đáp án (PDF) <ExternalLink aria-hidden="true" />
        </a>
      </div>
    </section>
  );
}

function ExamBank({
  importedExams,
  onStartOfficial,
  onStartImported,
  onDelete,
}: {
  importedExams: ImportedExam[];
  onStartOfficial: (set?: string) => void;
  onStartImported: (exam: ImportedExam) => void;
  onDelete: (id: string) => void;
}) {
  const [search, setSearch] = useState("");
  const official = examSourceCatalog.filter((source) =>
    source.title.toLowerCase().includes(search.toLowerCase()),
  );
  const imported = importedExams.filter((exam) =>
    exam.title.toLowerCase().includes(search.toLowerCase()),
  );
  return (
    <section>
      <div className="section-heading">
        <div>
          <p className="eyebrow">NGÂN HÀNG ĐỀ THI</p>
          <h1>4 bộ chính thức · {importedExams.length} bộ đã import</h1>
        </div>
      </div>
      <input
        className="bank-search"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Tìm theo tên bộ đề…"
        aria-label="Tìm bộ đề"
      />
      <div className="bank-list">
        {official.map((source) => (
          <article className="bank-card" key={source.id}>
            <div>
              <p className="eyebrow">OFFICIAL · CTFL {source.syllabus}</p>
              <h2>Sample Exam Set {source.id.slice(-1).toUpperCase()}</h2>
              <p>40 câu · 60 phút · Đạt từ 26/40 · v{source.version}</p>
            </div>
            <Button onClick={() => onStartOfficial(source.id.slice(-1).toUpperCase())}>
              Bắt đầu thi <ArrowRight />
            </Button>
          </article>
        ))}
        {imported.map((exam) => (
          <article className="bank-card" key={exam.id}>
            <div>
              <p className="eyebrow">USER IMPORTED · {exam.sourceLanguage.toUpperCase()}</p>
              <h2>{exam.title}</h2>
              <p>
                {exam.questions.length} câu · {exam.durationMinutes} phút · Đạt{" "}
                {exam.passingPercentage}% · {exam.sourceName}
              </p>
            </div>
            <div className="result-actions">
              <Button onClick={() => onStartImported(exam)}>
                Bắt đầu thi <ArrowRight />
              </Button>
              <Button variant="outline" onClick={() => onDelete(exam.id)}>
                Xóa
              </Button>
            </div>
          </article>
        ))}
        {official.length + imported.length === 0 && (
          <p className="empty-review">Không tìm thấy bộ đề phù hợp.</p>
        )}
      </div>
    </section>
  );
}

function HistoryView({
  progress,
  onOpen,
}: {
  progress: ProgressData;
  onOpen: (attemptId: string) => void;
}) {
  return (
    <section>
      <div className="section-heading">
        <div>
          <p className="eyebrow">LỊCH SỬ LÀM BÀI</p>
          <h1>{progress.attempts.length} lượt đã lưu</h1>
        </div>
      </div>
      {progress.attempts.length === 0 ? (
        <p className="empty-review">Chưa có lượt làm bài.</p>
      ) : (
        <div className="history-table">
          <div className="history-row history-head">
            <span>Thời gian</span>
            <span>Chế độ</span>
            <span>Đúng / Sai / Trống</span>
            <span>Kết quả</span>
            <span></span>
          </div>
          {progress.attempts.map((attempt) => (
            <div className="history-row" key={attempt.id}>
              <span>
                {new Date(attempt.completedAt).toLocaleString("vi-VN")}
                <small>{formatTime(attempt.durationSeconds)}</small>
              </span>
              <span>
                {attempt.mode === "official"
                  ? "Thi thử"
                  : attempt.mode === "random"
                    ? "Ngẫu nhiên"
                    : "Luyện tập"}
              </span>
              <span>
                {attempt.correctCount} / {attempt.wrongCount} / {attempt.unansweredCount}
              </span>
              <strong className={attempt.passed ? "history-pass" : "history-fail"}>
                {attempt.percentage}% · {attempt.passed ? "ĐẠT" : "CHƯA ĐẠT"}
              </strong>
              <Button size="sm" variant="outline" onClick={() => onOpen(attempt.id)}>
                Xem lại
              </Button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function MistakesView({
  progress,
  questions,
  onReview,
}: {
  progress: ProgressData;
  questions: ExamQuestion[];
  onReview: () => void;
}) {
  const byId = new Map(questions.map((question) => [question.n, question]));
  const mistakes = Object.values(progress.wrongQuestions).sort(
    (a, b) => b.wrongCount - a.wrongCount,
  );
  return (
    <section>
      <div className="section-heading">
        <div>
          <p className="eyebrow">MISTAKE BANK</p>
          <h1>{mistakes.length} câu trả lời sai</h1>
        </div>
        {mistakes.length > 0 && (
          <Button onClick={onReview}>
            Ôn tối đa 10 câu <ArrowRight />
          </Button>
        )}
      </div>
      {mistakes.length === 0 ? (
        <p className="empty-review">Các câu trả lời sai sẽ xuất hiện tại đây.</p>
      ) : (
        <div className="compact-question-list">
          {mistakes.map((item) => {
            const question = byId.get(item.questionId);
            const mastered = (item.correctStreak ?? 0) >= 2;
            return (
              <article key={item.questionId}>
                <div>
                  <strong>{question?.lo ?? `#${item.questionId}`}</strong>
                  <span>
                    {mastered
                      ? "Đã nắm vững"
                      : `Sai ${item.wrongCount} lần · Đúng liên tiếp ${item.correctStreak ?? 0}/2 · Ôn ${new Date(item.nextReviewAt).toLocaleDateString("vi-VN")}`}
                  </span>
                </div>
                <p
                  dangerouslySetInnerHTML={{ __html: question?.stem ?? "Câu hỏi từ bộ đề đã xóa" }}
                />
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

function BookmarksView({
  progress,
  questions,
}: {
  progress: ProgressData;
  questions: ExamQuestion[];
}) {
  const ids = new Set(progress.attempts.flatMap((attempt) => attempt.flagged));
  const bookmarked = questions.filter((question) => ids.has(question.n));
  return (
    <section>
      <div className="section-heading">
        <div>
          <p className="eyebrow">CÂU HỎI ĐÃ ĐÁNH DẤU</p>
          <h1>{bookmarked.length} câu</h1>
        </div>
      </div>
      {bookmarked.length === 0 ? (
        <p className="empty-review">Đánh dấu câu trong khi làm bài để xem lại tại đây.</p>
      ) : (
        <div className="compact-question-list">
          {bookmarked.map((question) => (
            <article key={question.n}>
              <strong>
                {question.lo} · {question.k}
              </strong>
              <p dangerouslySetInnerHTML={{ __html: question.stem }} />
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function AnalyticsView({
  progress,
  questions,
}: {
  progress: ProgressData;
  questions: ExamQuestion[];
}) {
  const questionMap = useMemo(
    () => new Map(questions.map((question) => [question.n, question])),
    [questions],
  );
  const unique = new Set(progress.attempts.flatMap((attempt) => attempt.questionIds));
  const validAttempts = progress.attempts.filter(
    (attempt) => attempt.mode === "official" && attempt.total === 40,
  );
  const enoughData = validAttempts.length >= 5 && unique.size >= 150;
  const recent = validAttempts.slice(0, 5);
  const average = recent.length
    ? Math.round(recent.reduce((sum, attempt) => sum + attempt.percentage, 0) / recent.length)
    : 0;
  const passRate = validAttempts.length
    ? Math.round(
        (validAttempts.filter((attempt) => attempt.passed).length / validAttempts.length) * 100,
      )
    : 0;
  const timeScore = recent.length
    ? Math.round(
        recent.reduce(
          (sum, attempt) =>
            sum + Math.min(100, (3600 / Math.max(1, attempt.durationSeconds)) * 100),
          0,
        ) / recent.length,
      )
    : 0;
  let answered = 0;
  let correctAnswers = 0;
  let firstAnswers = 0;
  let correctFirstAnswers = 0;
  const previouslySeen = new Set<number>();
  for (const attempt of [...progress.attempts].reverse()) {
    for (const id of attempt.questionIds) {
      const question = questionMap.get(id);
      if (!question) continue;
      const correct = answerIsCorrect(question, attempt.answers[id] ?? []);
      answered += 1;
      if (correct) correctAnswers += 1;
      if (!previouslySeen.has(id)) {
        firstAnswers += 1;
        if (correct) correctFirstAnswers += 1;
        previouslySeen.add(id);
      }
    }
  }
  const chapterMastery = answered ? Math.round((correctAnswers / answered) * 100) : 0;
  const unseenScore = firstAnswers ? Math.round((correctFirstAnswers / firstAnswers) * 100) : 0;
  const wrongProgress = Object.values(progress.wrongQuestions);
  const correctionScore = wrongProgress.length
    ? Math.round(
        (wrongProgress.filter((item) => (item.correctStreak ?? 0) >= 2).length /
          wrongProgress.length) *
          100,
      )
    : 0;
  const readiness = Math.round(
    average * 0.3 +
      passRate * 0.2 +
      chapterMastery * 0.2 +
      unseenScore * 0.15 +
      correctionScore * 0.1 +
      timeScore * 0.05,
  );
  const chapterScores = chapters.map((name, index) => {
    let total = 0;
    let correct = 0;
    for (const attempt of progress.attempts)
      for (const id of attempt.questionIds) {
        const question = questionMap.get(id);
        if (question?.lo.startsWith(`FL-${index + 1}.`)) {
          total += 1;
          if (answerIsCorrect(question, attempt.answers[id] ?? [])) correct += 1;
        }
      }
    return { name, total, percent: total ? Math.round((correct / total) * 100) : 0 };
  });
  const weakest = chapterScores
    .filter((chapter) => chapter.total > 0)
    .sort((a, b) => a.percent - b.percent)[0];
  return (
    <section>
      <div className="section-heading">
        <div>
          <p className="eyebrow">PHÂN TÍCH HỌC TẬP</p>
          <h1>Mức độ sẵn sàng</h1>
        </div>
      </div>
      <div className="readiness-panel">
        <strong>{enoughData ? `${readiness}/100` : "Chưa đủ dữ liệu"}</strong>
        <p>
          {enoughData
            ? `Tính từ ${validAttempts.length} bài thi thử và ${unique.size} câu khác nhau.`
            : `Cần tối thiểu 5 bài thi thử và 150 câu khác nhau. Hiện có ${validAttempts.length} bài và ${unique.size} câu.`}
        </p>
      </div>
      <div className="chapter-results">
        <div className="section-heading">
          <h2>Kết quả theo chương</h2>
        </div>
        <div className="chapter-score-list">
          {chapterScores.map((chapter) => (
            <div className="chapter-score" key={chapter.name}>
              <span>{chapter.name}</span>
              <div className="chapter-progress">
                <span style={{ width: `${chapter.percent}%` }} />
              </div>
              <strong>{chapter.total ? `${chapter.percent}%` : "—"}</strong>
            </div>
          ))}
        </div>
      </div>
      <div className="recommendation">
        <h2>Đề xuất học tập</h2>
        <p>
          {weakest
            ? `Ưu tiên ôn ${weakest.name}. Tỷ lệ đúng hiện tại ${weakest.percent}% trên ${weakest.total} lượt trả lời.`
            : "Hãy hoàn thành một bài thi để nhận đề xuất dựa trên kết quả thực tế."}
        </p>
      </div>
    </section>
  );
}

function samplePdf(letter: string, kind: "Questions" | "Answers") {
  const source = examSourceCatalog.find(
    (item) => item.id === `ctfl-v4-set-${letter.toLowerCase()}`,
  );
  return `/istqb/ISTQB_CTFL_v4.0_Sample-Exam-${letter}-${kind}_v${source?.version}.pdf`;
}

function QuestionContent({ question }: { question: ExamQuestion }) {
  const parts = question.stem.split("[[STD]]");

  return (
    <div className="question-content rich-copy">
      <div dangerouslySetInnerHTML={{ __html: parts[0] ?? "" }} />
      {question.sourceSet && question.sourcePage && /^[BCD]$/.test(question.sourceSet) && (
        <a
          className="underline"
          href={`${samplePdf(question.sourceSet, "Questions")}#page=${question.sourcePage}`}
          target="_blank"
          rel="noreferrer"
        >
          Xem câu {question.sourceNumber} trong PDF gốc (bảng và hình minh họa)
        </a>
      )}
      {parts.length > 1 && (
        <>
          <StateDiagram />
          <div dangerouslySetInnerHTML={{ __html: parts.slice(1).join("[[STD]]") }} />
        </>
      )}
    </div>
  );
}

function StateDiagram() {
  return (
    <figure className="state-figure">
      <figcaption>Sơ đồ chuyển đổi trạng thái</figcaption>
      <svg
        viewBox="0 0 560 190"
        role="img"
        aria-label="INIT, DEBUG MODE, IN OPERATION, ON HOLD và OFF; các chuyển đổi test, run, done, error, pause, resume"
      >
        <defs>
          <marker
            id="state-arrow"
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="7"
            markerHeight="7"
            orient="auto"
          >
            <path d="M0 0L10 5L0 10z" className="diagram-arrowhead" />
          </marker>
        </defs>
        <g className="diagram-lines" markerEnd="url(#state-arrow)">
          <path d="M106 78V32H188" />
          <path d="M58 114V160H188" />
          <path d="M290 32H418" />
          <path d="M240 140V54" />
          <path d="M290 153H418" />
          <path d="M420 168H292" />
          <path d="M475 140V54" />
        </g>
        <g className="diagram-nodes">
          <rect x="10" y="78" width="96" height="36" rx="6" />
          <rect x="190" y="12" width="100" height="40" rx="6" />
          <rect x="420" y="12" width="110" height="40" rx="6" />
          <rect x="190" y="140" width="100" height="40" rx="6" />
          <rect x="420" y="140" width="110" height="40" rx="6" />
        </g>
        <g className="diagram-state-labels">
          <text x="58" y="101">
            INIT
          </text>
          <text x="240" y="29">
            DEBUG
          </text>
          <text x="240" y="44">
            MODE
          </text>
          <text x="475" y="37">
            OFF
          </text>
          <text x="240" y="157">
            IN
          </text>
          <text x="240" y="172">
            OPERATION
          </text>
          <text x="475" y="165">
            ON HOLD
          </text>
        </g>
        <g className="diagram-transition-labels">
          <text x="118" y="27">
            test
          </text>
          <text x="112" y="177">
            run
          </text>
          <text x="340" y="25">
            done
          </text>
          <text x="248" y="100">
            error
          </text>
          <text x="340" y="146">
            pause
          </text>
          <text x="335" y="184">
            resume
          </text>
          <text x="483" y="100">
            done
          </text>
        </g>
      </svg>
    </figure>
  );
}

function ChoiceList({
  question,
  selected,
  onChoose,
  reveal = false,
}: {
  question: ExamQuestion;
  selected: readonly AnswerKey[];
  onChoose?: (key: AnswerKey) => void;
  reveal?: boolean;
}) {
  return (
    <div className="choice-list">
      {Object.entries(question.opt).map(([rawKey, text]) => {
        const key = rawKey as AnswerKey;
        const isSelected = selected.includes(key);
        const isCorrect = question.ans.includes(key);
        const stateClass = reveal
          ? isCorrect
            ? "choice-correct"
            : isSelected
              ? "choice-wrong"
              : ""
          : isSelected
            ? "choice-selected"
            : "";

        return (
          <Button
            key={key}
            type="button"
            variant="outline"
            className={`answer-choice ${stateClass}`}
            onClick={() => onChoose?.(key)}
            disabled={reveal || !onChoose}
            aria-pressed={isSelected}
          >
            <span className="choice-letter">{key.toUpperCase()}</span>
            <span className="choice-text">{text}</span>
            {reveal && isCorrect && <Check className="choice-mark" aria-label="Đáp án đúng" />}
          </Button>
        );
      })}
    </div>
  );
}

function AnswerExplanation({
  question,
  selected,
}: {
  question: ExamQuestion;
  selected: readonly AnswerKey[];
}) {
  const correct = answerIsCorrect(question, selected);

  return (
    <section
      className={`answer-explanation${correct ? " explanation-correct" : " explanation-wrong"}`}
    >
      <p className="explanation-verdict">
        {correct ? "Chính xác" : selected.length === 0 ? "Chưa trả lời" : "Chưa đúng"}
        <span>Đáp án: {question.ans.join(", ").toUpperCase()}</span>
      </p>
      {question.pre && (
        <div className="rich-copy" dangerouslySetInnerHTML={{ __html: question.pre }} />
      )}
      {Object.entries(question.ex).map(([key, text]) => (
        <p key={key} className="explanation-option">
          <strong>{key.toUpperCase()})</strong> <span dangerouslySetInnerHTML={{ __html: text }} />
        </p>
      ))}
      <p className="learning-objective">
        Mục tiêu học tập: {question.lo} · {question.k}
      </p>
    </section>
  );
}

function ResultsScreen({
  session,
  filter,
  onFilterChange,
  onRestart,
  onHome,
}: {
  session: QuizSession;
  filter: ReviewFilter;
  onFilterChange: (filter: ReviewFilter) => void;
  onRestart: () => void;
  onHome: () => void;
}) {
  const grade = gradeQuiz(
    session.questions,
    session.answers,
    (session.passingPercentage ?? 65) / 100,
  );
  const chapterScores = chapters
    .map((name, index) => {
      const number = String(index + 1);
      const questions = session.questions.filter((question) =>
        question.lo.split("-")[1]?.startsWith(`${number}.`),
      );
      const correct = questions.filter((question) =>
        answerIsCorrect(question, session.answers[question.n] ?? []),
      ).length;
      return { name, questions, correct };
    })
    .filter((chapter) => chapter.questions.length > 0);

  const reviewQuestions = session.questions.filter((question) => {
    if (filter === "flagged") return session.flagged.includes(question.n);
    if (filter === "wrong") return !answerIsCorrect(question, session.answers[question.n] ?? []);
    return true;
  });

  return (
    <AppFrame>
      <section className="results-heading">
        <p className="eyebrow">
          {session.title ??
            (session.mode === "official"
              ? `ĐỀ MẪU SET ${session.questions[0]?.sourceSet ?? "A"}`
              : session.mode === "random"
                ? "ĐỀ NGẪU NHIÊN"
                : "LUYỆN TẬP")}
        </p>
        {session.questions[0]?.sourceSet && /^[BCD]$/.test(session.questions[0].sourceSet) && (
          <a
            className="underline"
            href={samplePdf(session.questions[0].sourceSet, "Answers")}
            target="_blank"
            rel="noreferrer"
          >
            Xem đáp án và lời giải chính thức (PDF)
          </a>
        )}
        <h1>Kết quả của bạn</h1>
        <div className="score-summary">
          <div className="score-number">
            <strong>{grade.correctCount}</strong>
            <span> / {grade.total}</span>
          </div>
          <div className={`score-outcome${grade.passed ? " outcome-pass" : " outcome-fail"}`}>
            <strong>{grade.passed ? "ĐẠT" : "CHƯA ĐẠT"}</strong>
            <span>
              {grade.percentage}% · Điểm đạt {grade.passMark}/{grade.total}
            </span>
          </div>
        </div>
        <div className="result-actions">
          <Button onClick={onRestart}>
            <RotateCcw aria-hidden="true" /> Làm đề khác
          </Button>
          <Button variant="outline" onClick={onHome}>
            Về trang chính
          </Button>
        </div>
      </section>

      <section className="chapter-results" aria-labelledby="chapter-results-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">TỔNG KẾT</p>
            <h2 id="chapter-results-title">Kết quả theo chương</h2>
          </div>
        </div>
        <div className="chapter-score-list">
          {chapterScores.map((chapter) => {
            const percent =
              chapter.questions.length === 0
                ? 0
                : Math.round((chapter.correct / chapter.questions.length) * 100);
            return (
              <div className="chapter-score" key={chapter.name}>
                <span>{chapter.name}</span>
                <div
                  className="chapter-progress"
                  role="progressbar"
                  aria-label={chapter.name}
                  aria-valuenow={percent}
                  aria-valuemin={0}
                  aria-valuemax={100}
                >
                  <span style={{ width: `${percent}%` }} />
                </div>
                <strong>
                  {chapter.correct}/{chapter.questions.length}
                </strong>
              </div>
            );
          })}
        </div>
      </section>

      <section className="review-section" aria-labelledby="review-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">ÔN LẠI</p>
            <h2 id="review-title">Xem lại câu trả lời</h2>
          </div>
          <span className="pool-count">{reviewQuestions.length} câu</span>
        </div>
        <div className="review-filters" role="group" aria-label="Lọc câu hỏi">
          <Button
            variant={filter === "all" ? "secondary" : "outline"}
            size="sm"
            onClick={() => onFilterChange("all")}
            aria-pressed={filter === "all"}
          >
            Tất cả
          </Button>
          <Button
            variant={filter === "wrong" ? "secondary" : "outline"}
            size="sm"
            onClick={() => onFilterChange("wrong")}
            aria-pressed={filter === "wrong"}
          >
            Sai / bỏ trống
          </Button>
          <Button
            variant={filter === "flagged" ? "secondary" : "outline"}
            size="sm"
            onClick={() => onFilterChange("flagged")}
            aria-pressed={filter === "flagged"}
          >
            Đã đánh dấu
          </Button>
        </div>
        {reviewQuestions.length === 0 ? (
          <p className="empty-review">Không có câu hỏi trong mục này.</p>
        ) : (
          <div className="review-list">
            {reviewQuestions.map((question) => {
              const selected = session.answers[question.n] ?? [];
              const correct = answerIsCorrect(question, selected);
              return (
                <article className="review-question" key={question.n}>
                  <div className="review-question-heading">
                    <span className="review-number">
                      Câu {session.questions.indexOf(question) + 1}
                    </span>
                    <span className="review-outcome">
                      {correct ? "Đúng" : selected.length > 0 ? "Sai" : "Bỏ trống"}
                    </span>
                    <span className="review-objective">
                      {question.lo} · {question.k}
                    </span>
                    {session.flagged.includes(question.n) && <Flag aria-label="Đã đánh dấu" />}
                  </div>
                  <QuestionContent question={question} />
                  <ChoiceList question={question} selected={selected} reveal />
                  <AnswerExplanation question={question} selected={selected} />
                </article>
              );
            })}
          </div>
        )}
      </section>
      <SourcePanel />
    </AppFrame>
  );
}

function formatTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function formatDate(date: string): string {
  const [year, month, day] = date.split("-");
  if (!year || !month || !day) return date;
  return `${day}/${month}/${year}`;
}
