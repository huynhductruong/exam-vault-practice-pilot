import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowLeft,
  ArrowRight,
  BookOpenCheck,
  Check,
  ChevronDown,
  ClipboardList,
  Clock3,
  ExternalLink,
  Flag,
  RotateCcw,
  Timer,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { sampleAQuestions, sampleASource, type AnswerKey, type ExamQuestion } from "@/data/ctfl-sample-a";
import {
  answerIsCorrect,
  createRandomSet,
  gradeQuiz,
  OFFICIAL_SET_SIZE,
  RANDOM_SET_SIZE,
} from "@/lib/quiz-engine";

type QuizMode = "random" | "official" | "practice";
type ReviewFilter = "all" | "wrong" | "flagged";

type QuizSession = {
  mode: QuizMode;
  questions: ExamQuestion[];
  answers: Record<number, AnswerKey[]>;
  flagged: number[];
  checked: number[];
  current: number;
  endsAt: number | null;
  submitted: boolean;
};

const chapters = [
  "Nền tảng kiểm thử",
  "Kiểm thử trong SDLC",
  "Kiểm thử tĩnh",
  "Phân tích & thiết kế kiểm thử",
  "Quản lý hoạt động kiểm thử",
  "Công cụ kiểm thử",
];

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CTFL Practice | Luyện thi ISTQB CTFL v4.0" },
      {
        name: "description",
        content: "Luyện tập ISTQB CTFL v4.0 với đề mẫu công khai, chấm điểm và lời giải tiếng Việt.",
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
  const [extendedTime, setExtendedTime] = useState(false);
  const [reviewFilter, setReviewFilter] = useState<ReviewFilter>("all");
  const [now, setNow] = useState(0);

  useEffect(() => {
    if (!session || session.endsAt === null || session.submitted) return;

    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, [session]);

  useEffect(() => {
    if (!session || session.endsAt === null || session.submitted || now < session.endsAt) return;
    setSession((current) => (current ? { ...current, submitted: true } : current));
  }, [now, session]);

  const startQuiz = (mode: QuizMode) => {
    const questionCount = mode === "random" ? RANDOM_SET_SIZE : OFFICIAL_SET_SIZE;
    const minutes = mode === "official" ? (extendedTime ? 75 : 60) : mode === "random" ? 30 : null;

    setNow(Date.now());
    setReviewFilter("all");
    setSession({
      mode,
      questions: createRandomSet(sampleAQuestions, questionCount),
      answers: {},
      flagged: [],
      checked: [],
      current: 0,
      endsAt: minutes === null ? null : Date.now() + minutes * 60_000,
      submitted: false,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const closeQuiz = () => {
    setSession(null);
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
    if (!question || !(session.answers[question.n]?.length)) return;
    setSession({ ...session, checked: [...session.checked, question.n] });
  };

  const submitQuiz = () => {
    if (!session) return;
    setSession({ ...session, submitted: true });
  };

  if (!session) {
    return (
      <HomeScreen
        extendedTime={extendedTime}
        onExtendedTimeChange={setExtendedTime}
        onStart={startQuiz}
      />
    );
  }

  if (session.submitted) {
    return (
      <ResultsScreen
        session={session}
        filter={reviewFilter}
        onFilterChange={setReviewFilter}
        onRestart={() => startQuiz(session.mode)}
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
    session.mode === "official"
      ? "Thi thử Set A"
      : session.mode === "random"
        ? "Đề ngẫu nhiên"
        : "Luyện tập";

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
              <p className="eyebrow">Câu {session.current + 1} / {session.questions.length}</p>
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

          {isPracticeChecked && <AnswerExplanation question={currentQuestion} selected={selected} />}

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
              <h2>{answeredCount} / {session.questions.length}</h2>
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
            <span><i className="legend-dot legend-answered" /> Đã trả lời</span>
            <span><i className="legend-dot legend-flagged" /> Đánh dấu</span>
            {session.mode === "practice" && <span><i className="legend-dot legend-correct" /> Đúng</span>}
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
  extendedTime,
  onExtendedTimeChange,
  onStart,
}: {
  extendedTime: boolean;
  onExtendedTimeChange: (value: boolean) => void;
  onStart: (mode: QuizMode) => void;
}) {
  return (
    <AppFrame>
      <section className="welcome-band">
        <div className="welcome-copy">
          <p className="eyebrow">ISTQB® · FOUNDATION LEVEL · V4.0.1</p>
          <h1>CTFL Practice</h1>
          <p>Luyện đề tiếng Việt từ bộ câu hỏi mẫu chính thức, có đáp án và giải thích theo từng câu.</p>
        </div>
        <div className="question-count-mark" aria-label="40 câu hỏi">
          <BookOpenCheck aria-hidden="true" />
          <strong>40</strong>
          <span>câu mẫu</span>
        </div>
      </section>

      <section className="exam-facts" aria-label="Thông tin đề thi">
        <div className="fact-item"><strong>40</strong><span>câu trong đề mẫu</span></div>
        <div className="fact-item"><strong>60 phút</strong><span>thời gian chuẩn</span></div>
        <div className="fact-item"><strong>26 / 40</strong><span>điểm đạt · 65%</span></div>
        <div className="fact-item"><strong>6</strong><span>chương kiến thức</span></div>
      </section>

      <section className="mode-section" aria-labelledby="mode-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">BẮT ĐẦU</p>
            <h2 id="mode-title">Chọn cách luyện</h2>
          </div>
          <span className="pool-count">40 câu đã đối chiếu đáp án</span>
        </div>

        <div className="mode-grid">
          <article className="mode-card mode-random">
            <div className="mode-icon"><RotateCcw aria-hidden="true" /></div>
            <p className="mode-kicker">20 CÂU · 30 PHÚT</p>
            <h3>Đề ngẫu nhiên</h3>
            <p>Mỗi lượt lấy 20 câu khác nhau từ bộ mẫu. Đạt khi đúng ít nhất 13 câu.</p>
            <Button onClick={() => onStart("random")} className="mode-action">
              Tạo đề ngẫu nhiên <ArrowRight aria-hidden="true" />
            </Button>
          </article>

          <article className="mode-card mode-official">
            <div className="mode-icon"><ClipboardList aria-hidden="true" /></div>
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
            <div className="mode-icon"><BookOpenCheck aria-hidden="true" /></div>
            <p className="mode-kicker">KHÔNG GIỚI HẠN THỜI GIAN</p>
            <h3>Luyện từng câu</h3>
            <p>Chọn câu bất kỳ, kiểm tra ngay và đọc lời giải trước khi sang câu tiếp theo.</p>
            <Button onClick={() => onStart("practice")} className="mode-action">
              Bắt đầu luyện <ArrowRight aria-hidden="true" />
            </Button>
          </article>
        </div>
      </section>

      <SourcePanel />
    </AppFrame>
  );
}

function AppFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-frame min-h-screen bg-background text-foreground">
      <header className="topbar">
        <div className="topbar-inner">
          <div className="brand-lockup">
            <span className="brand-symbol"><BookOpenCheck aria-hidden="true" /></span>
            <span className="brand-copy">
              <strong>CTFL Practice</strong>
              <small>ISTQB® · Foundation Level</small>
            </span>
          </div>
          <span className="verified-label"><Check aria-hidden="true" /> Đáp án đã đối chiếu nguồn chính thức</span>
        </div>
      </header>
      <main className="page-content">{children}</main>
      <footer className="site-footer">
        Nội dung được ghi nguồn từ ISTQB® Sample Exam Set A, v1.7. Bản dịch tiếng Việt do tài liệu bạn cung cấp.
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
          Phát hành {formatDate(sampleASource.released)} · Syllabus {sampleASource.syllabus} · Đáp án cả 40 câu đã được so khớp với PDF chính thức.
        </p>
        <p className="source-limit">
          Ngân hàng hiện gồm một đề mẫu công khai Set A; đây không phải kho lưu trữ đề thi thật của 10 năm.
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

function QuestionContent({ question }: { question: ExamQuestion }) {
  const parts = question.stem.split("[[STD]]");

  return (
    <div className="question-content rich-copy">
      <div dangerouslySetInnerHTML={{ __html: parts[0] ?? "" }} />
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
      <svg viewBox="0 0 560 190" role="img" aria-label="INIT, DEBUG MODE, IN OPERATION, ON HOLD và OFF; các chuyển đổi test, run, done, error, pause, resume">
        <defs>
          <marker id="state-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto">
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
          <text x="58" y="101">INIT</text>
          <text x="240" y="29">DEBUG</text><text x="240" y="44">MODE</text>
          <text x="475" y="37">OFF</text>
          <text x="240" y="157">IN</text><text x="240" y="172">OPERATION</text>
          <text x="475" y="165">ON HOLD</text>
        </g>
        <g className="diagram-transition-labels">
          <text x="118" y="27">test</text><text x="112" y="177">run</text>
          <text x="340" y="25">done</text><text x="248" y="100">error</text>
          <text x="340" y="146">pause</text><text x="335" y="184">resume</text>
          <text x="483" y="100">done</text>
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
    <section className={`answer-explanation${correct ? " explanation-correct" : " explanation-wrong"}`}>
      <p className="explanation-verdict">
        {correct ? "Chính xác" : selected.length === 0 ? "Chưa trả lời" : "Chưa đúng"}
        <span>Đáp án: {question.ans.join(", ").toUpperCase()}</span>
      </p>
      {question.pre && <div className="rich-copy" dangerouslySetInnerHTML={{ __html: question.pre }} />}
      {Object.entries(question.ex).map(([key, text]) => (
        <p key={key} className="explanation-option">
          <strong>{key.toUpperCase()})</strong> <span dangerouslySetInnerHTML={{ __html: text }} />
        </p>
      ))}
      <p className="learning-objective">Mục tiêu học tập: {question.lo} · {question.k}</p>
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
  const grade = gradeQuiz(session.questions, session.answers);
  const chapterScores = chapters.map((name, index) => {
    const number = String(index + 1);
    const questions = session.questions.filter((question) => question.lo.split("-")[1]?.startsWith(`${number}.`));
    const correct = questions.filter((question) =>
      answerIsCorrect(question, session.answers[question.n] ?? []),
    ).length;
    return { name, questions, correct };
  }).filter((chapter) => chapter.questions.length > 0);

  const reviewQuestions = session.questions.filter((question) => {
    if (filter === "flagged") return session.flagged.includes(question.n);
    if (filter === "wrong") return !answerIsCorrect(question, session.answers[question.n] ?? []);
    return true;
  });

  return (
    <AppFrame>
      <section className="results-heading">
        <p className="eyebrow">{session.mode === "official" ? "ĐỀ MẪU SET A" : session.mode === "random" ? "ĐỀ NGẪU NHIÊN" : "LUYỆN TẬP"}</p>
        <h1>Kết quả của bạn</h1>
        <div className="score-summary">
          <div className="score-number">
            <strong>{grade.correctCount}</strong><span> / {grade.total}</span>
          </div>
          <div className={`score-outcome${grade.passed ? " outcome-pass" : " outcome-fail"}`}>
            <strong>{grade.passed ? "ĐẠT" : "CHƯA ĐẠT"}</strong>
            <span>{grade.percentage}% · Điểm đạt {grade.passMark}/{grade.total}</span>
          </div>
        </div>
        <div className="result-actions">
          <Button onClick={onRestart}><RotateCcw aria-hidden="true" /> Làm đề khác</Button>
          <Button variant="outline" onClick={onHome}>Về trang chính</Button>
        </div>
      </section>

      <section className="chapter-results" aria-labelledby="chapter-results-title">
        <div className="section-heading">
          <div><p className="eyebrow">TỔNG KẾT</p><h2 id="chapter-results-title">Kết quả theo chương</h2></div>
        </div>
        <div className="chapter-score-list">
          {chapterScores.map((chapter) => {
            const percent = chapter.questions.length === 0 ? 0 : Math.round((chapter.correct / chapter.questions.length) * 100);
            return (
              <div className="chapter-score" key={chapter.name}>
                <span>{chapter.name}</span>
                <div className="chapter-progress" role="progressbar" aria-label={chapter.name} aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}>
                  <span style={{ width: `${percent}%` }} />
                </div>
                <strong>{chapter.correct}/{chapter.questions.length}</strong>
              </div>
            );
          })}
        </div>
      </section>

      <section className="review-section" aria-labelledby="review-title">
        <div className="section-heading">
          <div><p className="eyebrow">ÔN LẠI</p><h2 id="review-title">Xem lại câu trả lời</h2></div>
          <span className="pool-count">{reviewQuestions.length} câu</span>
        </div>
        <div className="review-filters" role="group" aria-label="Lọc câu hỏi">
          <Button variant={filter === "all" ? "secondary" : "outline"} size="sm" onClick={() => onFilterChange("all")} aria-pressed={filter === "all"}>Tất cả</Button>
          <Button variant={filter === "wrong" ? "secondary" : "outline"} size="sm" onClick={() => onFilterChange("wrong")} aria-pressed={filter === "wrong"}>Sai / bỏ trống</Button>
          <Button variant={filter === "flagged" ? "secondary" : "outline"} size="sm" onClick={() => onFilterChange("flagged")} aria-pressed={filter === "flagged"}>Đã đánh dấu</Button>
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
                    <span className="review-number">Câu {session.questions.indexOf(question) + 1}</span>
                    <span className="review-outcome">{correct ? "Đúng" : selected.length > 0 ? "Sai" : "Bỏ trống"}</span>
                    <span className="review-objective">{question.lo} · {question.k}</span>
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