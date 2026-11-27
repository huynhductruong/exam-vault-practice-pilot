import { useRef, useState, useSyncExternalStore } from "react";
import { Check, FileUp, LoaderCircle, Sparkles, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { AnswerKey, ExamQuestion } from "@/data/ctfl-sample-a";
import {
  extractFileText,
  parseExamContent,
  parseExamWithGemini,
  type ImportedExam,
} from "@/lib/exam-import";

// Khóa được lưu dưới dạng Base64 và chỉ giải mã khi người dùng import đề.
const ENCODED_TRANSLATION_KEY =
  "QVEuQWI4Uk42THAxM2ZSTW1GV00xTXpydFhmcTk1VUNYTDVVSlZUNXg3QmNFZVMtcTdSQUE=";

type ImportSessionState = {
  file: File | null;
  answerFile: File | null;
  preview: ImportedExam | null;
  status: string;
  error: string;
  useAi: boolean;
  aiWarnings: string[];
};

let importSession: ImportSessionState = {
  file: null,
  answerFile: null,
  preview: null,
  status: "",
  error: "",
  useAi: true,
  aiWarnings: [],
};
let activeImportController: AbortController | null = null;
const importSessionListeners = new Set<() => void>();

function updateImportSession(update: Partial<ImportSessionState>) {
  importSession = { ...importSession, ...update };
  importSessionListeners.forEach((listener) => listener());
}

function subscribeImportSession(listener: () => void) {
  importSessionListeners.add(listener);
  return () => importSessionListeners.delete(listener);
}

function useImportSession() {
  return useSyncExternalStore(
    subscribeImportSession,
    () => importSession,
    () => importSession,
  );
}

function PreviewText({ value }: { value: string }) {
  return value.split(/<br\s*\/?>/gi).map((part, index) => (
    <span key={`${index}-${part.slice(0, 12)}`}>
      {index > 0 && <br />}
      {part}
    </span>
  ));
}

function toEditableText(value: string) {
  return value.replace(/<br\s*\/?>/gi, "\n");
}

function fromEditableText(value: string) {
  return value.replace(/\r?\n/g, "<br>");
}

export function ImportExam({
  onImport,
  existingQuestions,
}: {
  onImport: (exam: ImportedExam) => void;
  existingQuestions: ExamQuestion[];
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const answerInputRef = useRef<HTMLInputElement>(null);
  const [duplicateConfirmation, setDuplicateConfirmation] = useState(0);
  const { file, answerFile, preview, status, error, useAi, aiWarnings } = useImportSession();
  const apiKey = atob(ENCODED_TRANSLATION_KEY).trim();
  const setFile = (value: File | null) => updateImportSession({ file: value });
  const setAnswerFile = (value: File | null) => updateImportSession({ answerFile: value });
  const setPreview = (value: ImportedExam | null) => updateImportSession({ preview: value });
  const setStatus = (value: string) => updateImportSession({ status: value });
  const setError = (value: string) => updateImportSession({ error: value });
  const setUseAi = (value: boolean) => updateImportSession({ useAi: value });
  const setAiWarnings = (value: string[]) => updateImportSession({ aiWarnings: value });

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
    activeImportController?.abort();
    const controller = new AbortController();
    activeImportController = controller;
    setError("");
    setPreview(null);
    setStatus("Đang đọc nội dung file…");
    try {
      if (
        answerFile &&
        answerFile.name === file.name &&
        answerFile.size === file.size &&
        answerFile.lastModified === file.lastModified
      ) {
        throw new Error(
          "File đáp án đang trùng với file đề. Hãy chọn đúng file có tên Answers hoặc để trống nếu đáp án nằm chung trong file đề.",
        );
      }
      const questionText = await extractFileText(file);
      controller.signal.throwIfAborted();
      setStatus("Đang đọc file đáp án…");
      const answerText = answerFile ? await extractFileText(answerFile) : "";
      controller.signal.throwIfAborted();
      const text = answerText ? `${questionText}\nAnswer Key\n${answerText}` : questionText;
      const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
      const fingerprint = [...new Uint8Array(digest)]
        .map((byte) => byte.toString(16).padStart(2, "0"))
        .join("");
      if (useAi) {
        if (!apiKey || apiKey === "DAN_GEMINI_API_KEY_VAO_DAY") {
          throw new Error("Chưa cấu hình khóa dịch thuật trong source.");
        }
        setStatus("Đang nhận diện câu hỏi và đáp án…");
        const parsed = await parseExamWithGemini({
          questionText,
          answerText,
          sourceName: file.name,
          apiKey,
          signal: controller.signal,
          onProgress: (progress) => setStatus(progress.message),
        });
        setAiWarnings(parsed.warnings);
        setPreview(parsed);
      } else {
        const parsed = parseExamContent(text, file.name);
        setAiWarnings([]);
        setPreview({
          ...parsed,
          id: `import-${fingerprint}`,
          createdAt: new Date().toISOString(),
          sourceName: file.name,
        });
      }
      setStatus("Hoàn tất kiểm tra dữ liệu — hãy xác nhận preview trước khi lưu");
    } catch (reason) {
      controller.abort();
      setPreview(null);
      if (!(reason instanceof DOMException && reason.name === "AbortError")) {
        setError(reason instanceof Error ? reason.message : "Không thể import file.");
      }
      setStatus("");
    } finally {
      if (activeImportController === controller) activeImportController = null;
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
    if (duplicates > 0) {
      setDuplicateConfirmation(duplicates);
      return;
    }
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
            activeImportController?.abort();
            setFile(event.target.files?.[0] ?? null);
            setAnswerFile(null);
            if (answerInputRef.current) answerInputRef.current.value = "";
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
              activeImportController?.abort();
              setFile(null);
              setAnswerFile(null);
              if (answerInputRef.current) answerInputRef.current.value = "";
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
        <span className="answer-file-row">
          <Input
            ref={answerInputRef}
            type="file"
            accept=".pdf,.doc,.docx,.txt,.json,.xlsx,.csv"
            onChange={(event) => {
              activeImportController?.abort();
              setAnswerFile(event.target.files?.[0] ?? null);
              setPreview(null);
              setError("");
            }}
          />
          {answerFile && (
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label="Xóa file đáp án"
              title="Xóa file đáp án"
              onClick={() => {
                activeImportController?.abort();
                setAnswerFile(null);
                setPreview(null);
                setStatus("");
                setError("");
                if (answerInputRef.current) answerInputRef.current.value = "";
              }}
            >
              <Trash2 />
            </Button>
          )}
        </span>
      </label>
      <label className="import-field import-ai-toggle">
        <span>
          <input
            type="checkbox"
            checked={useAi}
            onChange={(event) => {
              setUseAi(event.target.checked);
              setPreview(null);
              setStatus("");
            }}
          />
          <Sparkles aria-hidden="true" /> Dịch tiếng Việt và tạo dữ liệu chuẩn Set A
        </span>
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
            <div className="import-preview-actions">
              <span>{preview.questions.length} câu</span>
              <Button onClick={publish}>
                <Check /> Lưu vào ngân hàng đề
              </Button>
            </div>
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
            {useAi
              ? "Dữ liệu đã được dịch và chuẩn hóa một lần. Hãy kiểm tra câu hỏi, lựa chọn và đáp án trong preview; sau khi lưu, ứng dụng chỉ dùng dữ liệu local và không cần file PDF nữa."
              : "Nội dung được đọc và phân tích hoàn toàn trên thiết bị này; chế độ này không tự dịch."}
          </p>
          <div className="preview-questions">
            {preview.questions.map((question, index) => (
              <details key={`${question.n}-${index}`}>
                <summary>
                  <strong>Câu {index + 1}.</strong> <PreviewText value={question.stem} />
                </summary>
                <label className="import-field">
                  Nội dung câu hỏi
                  <Textarea
                    value={toEditableText(question.stem)}
                    onChange={(event) =>
                      updateQuestion(index, (current) => ({
                        ...current,
                        stem: fromEditableText(event.target.value),
                      }))
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
                    value={toEditableText(question.ex[question.ans[0] ?? "a"] ?? "")}
                    onChange={(event) =>
                      updateQuestion(index, (current) => ({
                        ...current,
                        ex: Object.fromEntries(
                          current.ans.map((answer) => [
                            answer,
                            fromEditableText(event.target.value),
                          ]),
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
        </div>
      )}
      <AlertDialog
        open={duplicateConfirmation > 0}
        onOpenChange={(open) => {
          if (!open) setDuplicateConfirmation(0);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Phát hiện câu hỏi trùng</AlertDialogTitle>
            <AlertDialogDescription>
              Có {duplicateConfirmation} câu trùng với ngân hàng đề hiện tại. Bạn vẫn muốn lưu toàn
              bộ đề này?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Quay lại kiểm tra</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setDuplicateConfirmation(0);
                if (preview) onImport(preview);
              }}
            >
              Vẫn lưu bộ đề
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
