import { useRef, useState } from "react";
import { Check, FileUp, LoaderCircle, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { AnswerKey, ExamQuestion } from "@/data/ctfl-sample-a";
import { extractFileText, parseExamWithGemini, type ImportedExam } from "@/lib/exam-import";

// Dán khóa của bạn vào đây. Khóa này sẽ xuất hiện trong bundle frontend sau khi build.
const EMBEDDED_TRANSLATION_KEY = "AQ.Ab8RN6JtkwGFVV42O0OlUamj02FrMFWOM-h1dmCbYS7Aq_b_lQ";
const isAnswerFile = (selectedFile: File) => /(?:answer|đáp[ -]?án)/i.test(selectedFile.name);
const isQuestionFile = (selectedFile: File) =>
  /(?:question|câu[ -]?hỏi|đề[ -]?thi)/i.test(selectedFile.name);

export function ImportExam({
  onImport,
  existingQuestions,
}: {
  onImport: (exam: ImportedExam) => void;
  existingQuestions: ExamQuestion[];
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [answerFile, setAnswerFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ImportedExam | null>(null);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const apiKey = EMBEDDED_TRANSLATION_KEY.trim();
  const [aiWarnings, setAiWarnings] = useState<string[]>([]);

  const updateQuestion = (
    questionIndex: number,
    update: (question: ExamQuestion) => ExamQuestion,
  ) => {
    if (!preview) return;
    setPreview({
      ...preview,
      questions: preview.questions.map((question, index) =>
        index === questionIndex ? update(question) : question,
      ),
    });
  };

  const analyze = async () => {
    if (!file) return;
    setError("");
    setStatus("Đang upload…");
    try {
      const questionText = await extractFileText(file);
      const answerText = answerFile ? await extractFileText(answerFile) : "";
      if (!apiKey || apiKey === "DAN_GEMINI_API_KEY_VAO_DAY") {
        throw new Error("Chưa cấu hình khóa dịch thuật trong source.");
      }
      const parsed = await parseExamWithGemini({
        questionText,
        answerText,
        sourceName: file.name,
        apiKey,
      });
      setAiWarnings(parsed.warnings);
      setPreview(parsed);
      setStatus("Hoàn tất kiểm tra dữ liệu — hãy xác nhận preview trước khi lưu");
    } catch (reason) {
      setPreview(null);
      setError(reason instanceof Error ? reason.message : "Không thể import file.");
      setStatus("");
    }
  };

  const publish = () => {
    if (!preview || !preview.title.trim() || preview.questions.length === 0) {
      setError("Bộ đề cần có tên và ít nhất một câu hỏi.");
      return;
    }
    const invalidIndex = preview.questions.findIndex(
      (question) =>
        question.ans.length === 0 || question.ans.some((answer) => !question.opt[answer]),
    );
    if (invalidIndex >= 0) {
      setError(`Câu ${invalidIndex + 1} chưa có đáp án đúng hợp lệ.`);
      return;
    }
    const existing = new Set(
      existingQuestions.map((question) => question.stem.toLowerCase().replace(/<[^>]*>|\W/g, "")),
    );
    const duplicates = preview.questions.filter((question) =>
      existing.has(question.stem.toLowerCase().replace(/<[^>]*>|\W/g, "")),
    ).length;
    if (
      duplicates > 0 &&
      !window.confirm(`Phát hiện ${duplicates} câu trùng với ngân hàng hiện tại. Vẫn lưu bộ đề?`)
    )
      return;
    onImport(preview);
  };

  return (
    <section className="import-workspace">
      <div className="section-heading">
        <div>
          <p className="eyebrow">IMPORT ĐỀ THI</p>
          <h2>Đọc và kiểm tra file trước khi lưu</h2>
        </div>
      </div>
      <div className="import-dropzone" onClick={() => inputRef.current?.click()}>
        <FileUp aria-hidden="true" />
        <strong>{file?.name ?? "Chọn file đề thi"}</strong>
        <span>PDF, DOC, DOCX, TXT, JSON, XLSX hoặc CSV · tối đa 20 MB</span>
        <Input
          ref={inputRef}
          className="sr-only"
          type="file"
          accept=".pdf,.doc,.docx,.txt,.json,.xlsx,.csv"
          onChange={(event) => {
            const selectedFile = event.target.files?.[0] ?? null;
            if (selectedFile && isAnswerFile(selectedFile)) {
              setAnswerFile(selectedFile);
              setFile(null);
              setStatus("Đã nhận file đáp án — hãy chọn thêm file câu hỏi");
            } else {
              setFile(selectedFile);
              setStatus("");
            }
            setPreview(null);
            setError("");
          }}
        />
      </div>
      <div className="import-actions">
        <Button onClick={analyze} disabled={!file || Boolean(status && !preview)}>
          {status && !preview ? <LoaderCircle className="animate-spin" /> : <FileUp />} Phân tích
          file
        </Button>
        {file && (
          <Button
            variant="outline"
            onClick={() => {
              setFile(null);
              setPreview(null);
              setStatus("");
              setError("");
            }}
          >
            <Trash2 /> Chọn lại
          </Button>
        )}
      </div>
      <label className="import-field">
        File đáp án bổ sung (nếu tách riêng)
        <Input
          type="file"
          accept=".pdf,.doc,.docx,.txt,.json,.xlsx,.csv"
          onChange={(event) => {
            const selectedFile = event.target.files?.[0] ?? null;
            if (selectedFile && isQuestionFile(selectedFile)) {
              setFile(selectedFile);
              setAnswerFile(null);
              setStatus("");
            } else {
              setAnswerFile(selectedFile);
              setStatus("");
            }
            setPreview(null);
            setError("");
          }}
        />
        {answerFile && <small>Đã chọn: {answerFile.name}</small>}
      </label>
      {status && (
        <p className="import-status">
          <Check /> {status}
        </p>
      )}
      {error && <p className="import-error">{error}</p>}
      {aiWarnings.length > 0 && (
        <div className="import-error">
          {aiWarnings.map((warning) => (
            <div key={warning}>{warning}</div>
          ))}
        </div>
      )}
      {preview && (
        <div className="import-preview">
          <div className="section-heading">
            <div>
              <p className="eyebrow">PREVIEW</p>
              <h2>{preview.title}</h2>
            </div>
            <span>{preview.questions.length} câu</span>
          </div>
          <div className="progress-grid">
            <div>
              <strong>{preview.questions.length}</strong>
              <span>Tổng câu hỏi</span>
            </div>
            <div>
              <strong>{preview.questions.filter((q) => q.ans.length > 0).length}</strong>
              <span>Có đáp án</span>
            </div>
            <div>
              <strong>
                {preview.questions.filter((q) => Object.keys(q.ex).length > 0).length}
              </strong>
              <span>Có lời giải</span>
            </div>
            <div>
              <strong>{preview.durationMinutes}</strong>
              <span>Phút làm bài</span>
            </div>
            <div>
              <strong>
                {
                  preview.questions.filter((question) =>
                    existingQuestions.some(
                      (existing) =>
                        existing.stem.toLowerCase().replace(/<[^>]*>|\W/g, "") ===
                        question.stem.toLowerCase().replace(/<[^>]*>|\W/g, ""),
                    ),
                  ).length
                }
              </strong>
              <span>Câu trùng ngân hàng</span>
            </div>
          </div>
          <label className="import-field">
            Tên bộ đề
            <Input
              value={preview.title}
              onChange={(event) => setPreview({ ...preview, title: event.target.value })}
            />
          </label>
          <div className="import-settings">
            <label className="import-field">
              Thời gian (phút)
              <Input
                type="number"
                min={1}
                value={preview.durationMinutes}
                onChange={(event) =>
                  setPreview({
                    ...preview,
                    durationMinutes: Math.max(1, Number(event.target.value)),
                  })
                }
              />
            </label>
            <label className="import-field">
              Điểm đạt (%)
              <Input
                type="number"
                min={1}
                max={100}
                value={preview.passingPercentage}
                onChange={(event) =>
                  setPreview({
                    ...preview,
                    passingPercentage: Math.min(100, Math.max(1, Number(event.target.value))),
                  })
                }
              />
            </label>
          </div>
          <p className="import-notice">
            Dữ liệu đã được dịch và chuẩn hóa một lần. Hãy kiểm tra câu hỏi, lựa chọn và đáp án
            trong preview; sau khi lưu, ứng dụng chỉ dùng dữ liệu local và không cần file PDF nữa.
          </p>
          <div className="preview-questions">
            {preview.questions.map((question, index) => (
              <details key={`${question.n}-${index}`}>
                <summary>
                  <strong>Câu {index + 1}.</strong> {question.stem}
                </summary>
                <label className="import-field">
                  Nội dung câu hỏi
                  <Textarea
                    value={question.stem}
                    onChange={(event) =>
                      updateQuestion(index, (current) => ({ ...current, stem: event.target.value }))
                    }
                  />
                </label>
                {Object.entries(question.opt).map(([key, value]) => (
                  <label className="import-field" key={key}>
                    Lựa chọn {key.toUpperCase()}
                    <Input
                      value={value}
                      onChange={(event) =>
                        updateQuestion(index, (current) => ({
                          ...current,
                          opt: { ...current.opt, [key]: event.target.value },
                        }))
                      }
                    />
                  </label>
                ))}
                <label className="import-field">
                  Đáp án đúng (A–E, phân cách bằng dấu phẩy)
                  <Input
                    value={question.ans.join(", ").toUpperCase()}
                    onChange={(event) =>
                      updateQuestion(index, (current) => ({
                        ...current,
                        ans: [
                          ...new Set(
                            (event.target.value.toLowerCase().match(/[a-e]/g) ?? []) as AnswerKey[],
                          ),
                        ],
                      }))
                    }
                  />
                </label>
                <label className="import-field">
                  Lời giải
                  <Textarea
                    value={question.ex[question.ans[0] ?? "a"] ?? ""}
                    onChange={(event) =>
                      updateQuestion(index, (current) => ({
                        ...current,
                        ex: Object.fromEntries(
                          current.ans.map((answer) => [answer, event.target.value]),
                        ),
                      }))
                    }
                  />
                </label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setPreview({
                      ...preview,
                      questions: preview.questions.filter((_, itemIndex) => itemIndex !== index),
                    })
                  }
                >
                  <Trash2 /> Loại câu này
                </Button>
              </details>
            ))}
          </div>
          <Button onClick={publish}>
            <Check /> Lưu vào ngân hàng đề
          </Button>
        </div>
      )}
    </section>
  );
}
