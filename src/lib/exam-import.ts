import * as mammoth from "mammoth";
import * as XLSX from "xlsx";
import { z } from "zod";
import pdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";

import type { AnswerKey, ExamQuestion } from "@/data/ctfl-sample-a";

export const IMPORTED_EXAMS_KEY = "ctfl-imported-exams-v1";

export type ImportedExam = {
  id: string;
  title: string;
  sourceName: string;
  sourceLanguage: "en" | "vi" | "mixed";
  syllabus: string;
  durationMinutes: number;
  passingPercentage: number;
  createdAt: string;
  questions: ExamQuestion[];
};

const optionSchema = z.object({
  a: z.string().min(1),
  b: z.string().min(1),
  c: z.string().min(1),
  d: z.string().min(1),
  e: z.string().min(1).optional(),
});

const jsonQuestionSchema = z.object({
  question: z.string().min(1),
  options: optionSchema,
  answer: z.union([z.string(), z.array(z.string())]),
  explanation: z.string().optional().default(""),
  learningObjective: z.string().optional().default("Imported"),
  knowledgeLevel: z.string().optional().default("K2"),
});

const jsonExamSchema = z.object({
  title: z.string().optional(),
  durationMinutes: z.number().positive().optional(),
  passingPercentage: z.number().min(1).max(100).optional(),
  questions: z.array(jsonQuestionSchema).min(1),
});

export function readImportedExams(storage: Pick<Storage, "getItem">): ImportedExam[] {
  const value = storage.getItem(IMPORTED_EXAMS_KEY);
  if (!value) return [];
  try {
    const exams = JSON.parse(value) as ImportedExam[];
    return Array.isArray(exams) ? exams : [];
  } catch {
    return [];
  }
}

export function saveImportedExams(storage: Pick<Storage, "setItem">, exams: ImportedExam[]) {
  storage.setItem(IMPORTED_EXAMS_KEY, JSON.stringify(exams));
}

export async function extractFileText(file: File): Promise<string> {
  const extension = file.name.split(".").pop()?.toLowerCase();
  if (file.size > 20 * 1024 * 1024) throw new Error("File vượt quá giới hạn 20 MB.");

  if (extension === "txt" || extension === "json") return file.text();
  if (extension === "docx") {
    const result = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
    if (!result.value.trim()) throw new Error("Không đọc được nội dung Word.");
    return result.value;
  }
  if (extension === "pdf") {
    const pdfjs = await import("pdfjs-dist");
    pdfjs.GlobalWorkerOptions.workerSrc = pdfWorker;
    const data = new Uint8Array(await file.arrayBuffer());
    const pdf = await pdfjs.getDocument({ data, useWorkerFetch: false }).promise;
    const pages: string[] = [];
    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      const page = await pdf.getPage(pageNumber);
      const content = await page.getTextContent();
      pages.push(
        content.items
          .map((item) =>
            "str" in item ? `${item.str}${"hasEOL" in item && item.hasEOL ? "\n" : " "}` : "",
          )
          .join(""),
      );
    }
    const text = pages.join("\n");
    if (!text.trim()) throw new Error("PDF không có lớp văn bản. File scan cần OCR phía máy chủ.");
    return text;
  }
  if (extension === "xlsx" || extension === "csv") {
    const workbook = XLSX.read(await file.arrayBuffer());
    const firstSheet = workbook.Sheets[workbook.SheetNames[0] ?? ""];
    if (!firstSheet) throw new Error("Bảng tính không có worksheet.");
    return JSON.stringify(XLSX.utils.sheet_to_json(firstSheet, { defval: "" }));
  }
  if (extension === "doc") {
    const bytes = new Uint8Array(await file.arrayBuffer());
    const singleByte = new TextDecoder("windows-1252", { fatal: false }).decode(bytes);
    const unicode = new TextDecoder("utf-16le", { fatal: false }).decode(bytes);
    const extractReadable = (value: string) =>
      (value.match(/[\p{L}\p{N}\p{P}\p{Zs}\r\n]{4,}/gu) ?? []).join("\n");
    const candidates = [extractReadable(singleByte), extractReadable(unicode)];
    const text =
      candidates.sort((first, second) => {
        const score = (value: string) =>
          (value.match(/(?:Question|Câu)\s*#?\s*\d+/gi) ?? []).length;
        return score(second) - score(first);
      })[0] ?? "";
    if (!/(?:Question|Câu)\s*#?\s*\d+/i.test(text)) {
      throw new Error(
        "Không trích xuất được nội dung từ file .doc này. Hãy lưu lại dưới dạng DOCX.",
      );
    }
    return text;
  }
  throw new Error("Định dạng được hỗ trợ: PDF, DOC, DOCX, TXT, JSON, XLSX và CSV.");
}

const aiQuestionSchema = z.object({
  n: z.number().int().positive(),
  lo: z.string().default("Imported"),
  k: z.string().default("K2"),
  ans: z.array(z.enum(["a", "b", "c", "d", "e"])).min(1),
  stem: z.string().min(1),
  opt: optionSchema,
  ex: z.partialRecord(z.enum(["a", "b", "c", "d", "e"]), z.string()).default({}),
});

const aiExamSchema = z.object({
  title: z.string().min(1),
  durationMinutes: z.number().int().positive().default(60),
  passingPercentage: z.number().min(1).max(100).default(65),
  questions: z.array(aiQuestionSchema).min(1),
  warnings: z.array(z.string()).default([]),
});

const AI_PROMPT = `Bạn là chuyên gia ISTQB CTFL và biên tập viên Việt-Anh. Trước khi dịch, phải đọc toàn bộ đề thi và toàn bộ file đáp án để hiểu ngữ cảnh xuyên suốt, quan hệ giữa các câu, thuật ngữ và tình huống nghiệp vụ. Sau đó trích xuất và dịch sang tiếng Việt tự nhiên, chính xác theo cùng một hệ thuật ngữ.

QUY TẮC BẮT BUỘC:
1. Không sáng tác, không bỏ hoặc gộp câu. Giữ nguyên số câu, số lựa chọn, thứ tự và đáp án chính thức.
2. Dịch phần văn xuôi của câu hỏi, lựa chọn và giải thích sang tiếng Việt. Giữ nguyên mã FL-x.x.x, K-level, số liệu, công thức, bảng và mọi từ phủ định NOT/EXCEPT/LEAST/MOST.
3. Nếu thuật ngữ chuyên ngành ISTQB trong tài liệu nguồn đang viết bằng tiếng Anh thì BẮT BUỘC chỉ giữ nguyên chính xác CỤM THUẬT NGỮ đó, không được vin vào quy tắc này để giữ nguyên cả câu tiếng Anh. Ví dụ phải giữ nguyên: testing, test case, test basis, test object, defect, failure, equivalence partitioning, boundary value analysis, regression testing, confirmation testing, test condition, test coverage, test execution, test analysis, test design. Mọi động từ, tính từ, liên từ và phần ngữ pháp bao quanh vẫn phải dịch sang tiếng Việt tự nhiên. Ví dụ: "Which test case detects this defect?" phải thành "test case nào phát hiện defect này?", không được giữ nguyên câu tiếng Anh.
4. Mỗi ans chỉ chứa mã lựa chọn đúng từ tài liệu đáp án. Nếu có mâu thuẫn, ưu tiên file đáp án và ghi vào warnings.
5. ex bắt buộc có một lời giải riêng, đầy đủ cho TỪNG lựa chọn xuất hiện trong opt. Nếu tài liệu có lời giải chính thức, phải dịch chính xác lời giải đó. Nếu tài liệu chỉ có đáp án mà không có lời giải, phải tự phân tích theo CTFL v4.0 và viết rõ vì sao lựa chọn đúng là đúng, vì sao từng lựa chọn còn lại là sai; không được chỉ ghi "Đúng", "Sai" hoặc diễn đạt chung chung. Nội dung tự phân tích không được mâu thuẫn với đáp án chính thức. Không dùng Markdown.
6. Chỉ trả một JSON hợp lệ đúng cấu trúc: {title, durationMinutes, passingPercentage, questions:[{n,lo,k,ans,stem,opt:{a,b,c,d,e?},ex:{a?,b?,c?,d?,e?}}],warnings}.
7. Không giữ ngắt dòng do bố cục cột hoặc cuối dòng của PDF. Nếu một câu đang tiếp tục về mặt ngữ pháp thì phải nối thành một dòng, có đúng một dấu cách.
8. Trong stem, opt và ex, không dùng ký tự xuống dòng \\n. Chỉ dùng <br> khi thực sự bắt đầu một mục danh sách, tiêu chí chấp nhận, quy tắc bảng quyết định, bước kiểm thử, công thức hoặc đoạn văn mới.
9. Danh sách phải có dạng "Nội dung dẫn:<br>1. Mục một<br>2. Mục hai<br>Câu hỏi kết luận". Không chèn <br> giữa chủ ngữ và vị ngữ hoặc giữa các phần của cùng một câu.
10. Giữ nguyên mã và tên biến như BY, CY, D, TC1, AC1; không dịch mã thành từ tiếng Việt. Loại bỏ ký tự rác do PDF/OCR như ký hiệu điều hướng, bullet lỗi, ký tự vô hình hoặc chuỗi vô nghĩa.
11. Với bảng bị mất đường kẻ, chuyển mỗi quy tắc hoặc mỗi hàng thành một dòng <br> rõ nghĩa; không dồn toàn bộ bảng thành một câu dài.
12. BẮT BUỘC dịch riêng field stem và TỪNG giá trị trong opt sang câu tiếng Việt hoàn chỉnh. stem và opt không được giữ các mẫu câu tiếng Anh như "Which of the following", "What is", "How can", "Given the following", "Consider the following", "is correct", "is an example", "most likely". Chỉ các cụm thuật ngữ ISTQB được liệt kê ở quy tắc 3 mới được giữ tiếng Anh.
13. Ví dụ bắt buộc: "Which of the following is a typical test objective?" phải thành "Điều nào sau đây là một test objective điển hình?"; "Causing failures and identifying defects" phải thành "Gây ra failure và xác định defect". Không được sao chép nguyên văn stem hoặc opt từ nguồn.
14. Trước khi trả JSON, kiểm tra từng question: stem, mọi opt và mọi ex đều phải có ngữ pháp tiếng Việt; thuật ngữ ISTQB tiếng Anh chỉ là các cụm từ nằm bên trong câu tiếng Việt.
15. Tự kiểm tra lần cuối: đủ số câu, mọi ans tồn tại trong opt, nội dung đã là tiếng Việt, không làm mất từ phủ định, không còn ngắt dòng PDF sai và không còn ký tự OCR rác.`;

const AI_FORMAT_PROMPT = `QUY TẮC NHẬN DIỆN TÀI LIỆU KHÔNG PHỤ THUỘC MẪU:
1. Không giả định tài liệu có tên ISTQB, CTFL, Sample Exam, PDF hoặc có cấu trúc giống bất kỳ bộ đề mẫu nào. Phải suy luận cấu trúc từ nội dung. Nguồn có thể đến từ PDF, DOC/DOCX, TXT, JSON, CSV hoặc XLSX; có thể là đoạn văn, nhiều cột, bảng, danh sách hoặc mỗi dòng là một bản ghi.
2. Nhận diện ranh giới câu hỏi bằng tổng hợp tín hiệu: số thứ tự; nhãn Question/Q/Câu/Item; câu nghi vấn; phần dẫn tình huống; cụm lựa chọn gần nhau; mã A-E, a-e, 1-5, chữ số La Mã; và đáp án tương ứng. Không bắt buộc phải có chữ Question hoặc Câu. Không coi số trang, số mục syllabus, số dòng bảng, mã learning objective hoặc mục lục là số câu hỏi.
3. Loại header, footer, số trang, watermark, copyright, mục lục, hướng dẫn chung bị lặp và metadata không thuộc câu hỏi. Phải giữ hướng dẫn ảnh hưởng đến đáp án như “chọn HAI”, “chọn BA”, NOT, EXCEPT, LEAST, MOST, BEST, TRUE/FALSE và số điểm.
4. Nếu text bị trích theo nhiều cột hoặc sai thứ tự đọc, tái lập từng câu bằng quan hệ ngữ nghĩa: phần dẫn + yêu cầu + các lựa chọn của chính câu đó. Không ghép lựa chọn của câu sau vào câu trước. Nếu một câu xuất hiện ở mục lục và phần nội dung, chỉ lấy bản đầy đủ có stem và lựa chọn.
5. Nhận diện lựa chọn dù dùng A), A., (A), a:, 1), checkbox, bullet hoặc cột bảng. Chuẩn hóa theo thứ tự xuất hiện thành a-e nhưng không đổi nội dung hay thứ tự. Không biến mục con, bước quy trình, hàng decision table hoặc mệnh đề đánh số trong stem thành lựa chọn.
6. File câu hỏi và file đáp án có thể dùng kiểu đánh số, thứ tự, tiêu đề và bố cục khác nhau. Ghép theo ưu tiên: mã/số câu rõ ràng; nội dung stem hoặc cụm định danh; cuối cùng mới theo thứ tự nếu số lượng và trình tự khớp hoàn toàn. Không đoán ghép khi có nhiều khả năng; ghi cụ thể vào warnings.
7. Đáp án có thể là chữ cái, số thứ tự, nội dung đầy đủ, dấu tick, hoặc bảng answer key. Chuẩn hóa về a-e. Với câu nhiều đáp án, giữ đủ tất cả đáp án đúng. Phân biệt answer key với explanation; không suy ra answer key từ lời giải do mô hình tự viết.
8. Nếu file câu hỏi và file đáp án mâu thuẫn, ưu tiên answer key trong file đáp án bổ sung, giữ nguyên lựa chọn từ file câu hỏi và ghi mâu thuẫn vào warnings.
9. learning objective và knowledge level chỉ lấy khi nguồn ghi rõ; nếu không có dùng “Imported” và “K2”. title, durationMinutes và passingPercentage lấy từ nguồn nếu có; nếu không dùng tên file đã làm sạch, 60 phút và 65%.
10. Bảo toàn đoạn mã, biểu thức, toán tử, công thức, khoảng giá trị, đơn vị, URL, tên riêng, mã yêu cầu, mã test case, ký hiệu đồ thị, trạng thái và giá trị bảng. Chỉ dịch ngôn ngữ tự nhiên bao quanh. Không sửa dữ kiện dù có vẻ bất thường.
11. Với bảng, decision table, state transition, control-flow graph hoặc hình đã được chuyển thành mô tả text, giữ đủ nhãn và quan hệ rồi trình bày bằng <br>. Nếu dữ kiện thiết yếu chỉ có trong hình và không tồn tại trong text đầu vào, không bịa; ghi câu tương ứng vào warnings.
12. Với OCR lỗi, chỉ sửa lỗi hiển nhiên khi ngữ cảnh xác nhận chắc chắn. Không tự thay số, dấu phủ định, mã đáp án, công thức hoặc thuật ngữ khi không chắc chắn; ghi cảnh báo kèm số câu.
13. Nguồn có thể là tiếng Việt, tiếng Anh hoặc trộn hai ngôn ngữ. Giữ và biên tập phần tiếng Việt; dịch toàn bộ văn xuôi tiếng Anh; chỉ giữ cụm thuật ngữ ISTQB tiếng Anh. Không để nguyên câu tiếng Anh chỉ vì câu chứa thuật ngữ chuyên ngành.
14. Không tạo câu hỏi từ ví dụ trong explanation, syllabus, glossary hoặc hướng dẫn. Không âm thầm đoán đáp án chính thức. Nếu dữ liệu không đủ để xác minh câu hoặc đáp án, ghi rõ số câu và phần thiếu vào warnings.
15. Mỗi stem và mỗi opt phải là câu/cụm từ tiếng Việt có nghĩa độc lập. Không được giữ nguyên toàn bộ một opt tiếng Anh, kể cả khi opt là tên một nguyên lý, hoạt động hoặc khái niệm ISTQB. Chỉ giữ đúng cụm thuật ngữ cốt lõi và dịch phần mô tả còn lại. Ví dụ: “Early testing saves time and money” thành “Early testing giúp tiết kiệm thời gian và chi phí”; “Finding defects without executing code” thành “Tìm defect mà không cần thực thi code”; “Testing is context dependent” thành “Testing phụ thuộc vào ngữ cảnh”.
16. Trước khi xuất JSON, kiểm tra chéo từng câu: ranh giới, số lựa chọn, ánh xạ đáp án, từ phủ định, dữ liệu số/kỹ thuật, tiếng Việt, explanation cho từng lựa chọn và sự nhất quán với file đáp án. Nếu stem hoặc opt còn là một câu hoàn toàn bằng tiếng Anh, phải dịch lại trước khi trả kết quả.`;

function normalizeImportedLayout(value: string): string {
  const parts = value
    .replace(/\r?\n+/g, " ")
    .replace(/\s*<br\s*\/?>\s*/gi, "¦")
    .replace(/[ \t]{2,}/g, " ")
    .split("¦")
    .map((part) => part.trim());
  const isStructural = (part: string) =>
    /^(?:[-–•]|\d+[.)]|[A-E][.)]|[ivx]+[.)]|AC\d+\s*:|REQ\s*\d|TC\s*\d|IF\b|ELSE\b|THEN\b|INPUT\b|Kết quả (?:mong đợi|dự kiến)\s*:)/i.test(
      part,
    );
  let output = parts[0] ?? "";
  let paragraphBreak = false;
  for (let index = 1; index < parts.length; index += 1) {
    const current = parts[index] ?? "";
    if (!current) {
      paragraphBreak = true;
      continue;
    }
    const previous = parts[index - 1] ?? "";
    const keepBreak =
      paragraphBreak ||
      isStructural(current) ||
      /(?:sau|sau đây|như sau|tiêu chí chấp nhận)\s*:\s*$/i.test(previous) ||
      /<\/?(?:div|table|tr|td|ul|ol|li|blockquote)\b/i.test(previous + current);
    output += `${keepBreak ? "<br>" : " "}${current}`;
    paragraphBreak = false;
  }
  return output
    .replace(/(?:\s*<br>\s*){3,}/g, "<br><br>")
    .replace(/\s+([,.;:!?])/g, "$1")
    .trim();
}

const AI_RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    title: { type: "string" },
    durationMinutes: { type: "integer" },
    passingPercentage: { type: "number" },
    warnings: { type: "array", items: { type: "string" } },
    questions: {
      type: "array",
      items: {
        type: "object",
        properties: {
          n: { type: "integer" },
          lo: { type: "string" },
          k: { type: "string" },
          ans: { type: "array", items: { type: "string", enum: ["a", "b", "c", "d", "e"] } },
          stem: { type: "string" },
          opt: {
            type: "object",
            properties: Object.fromEntries(
              ["a", "b", "c", "d", "e"].map((id) => [id, { type: "string" }]),
            ),
            required: ["a", "b", "c", "d"],
          },
          ex: {
            type: "object",
            properties: Object.fromEntries(
              ["a", "b", "c", "d", "e"].map((id) => [id, { type: "string" }]),
            ),
            required: ["a", "b", "c", "d"],
          },
        },
        required: ["n", "lo", "k", "ans", "stem", "opt", "ex"],
      },
    },
  },
  required: ["title", "durationMinutes", "passingPercentage", "questions", "warnings"],
};

const BATCH_SIZE = 5;
const MAX_CONCURRENT_REQUESTS = 1;
const MAX_RETRIES = 3;
const RETRY_BASE_DELAY = 1_500;
const REQUEST_TIMEOUT = 90_000;
const FALLBACK_MODEL = "gemini-3.5-flash-lite";
const batchCache = new Map<string, z.infer<typeof aiExamSchema>>();

export type ImportProgress = {
  phase: "extracting" | "translating" | "retrying" | "validating";
  completed: number;
  total: number;
  message: string;
};

type SourceBlock = { number: number; text: string };

function splitNumberedBlocks(text: string): SourceBlock[] {
  const markers = [...text.matchAll(/(?:^|\n)\s*(?:Question|Câu)\s*#?\s*(\d+)\s*[:.)-]?/gi)];
  const longestBlockByNumber = new Map<number, SourceBlock>();
  markers.forEach((marker, index) => {
    const block = {
      number: Number(marker[1]),
      text: text.slice(marker.index ?? 0, markers[index + 1]?.index ?? text.length).trim(),
    };
    const current = longestBlockByNumber.get(block.number);
    if (!current || block.text.length > current.text.length) {
      longestBlockByNumber.set(block.number, block);
    }
  });
  return [...longestBlockByNumber.values()].sort((first, second) => first.number - second.number);
}

async function sha256(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function wait(delay: number, signal?: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    const timer = window.setTimeout(resolve, delay);
    signal?.addEventListener(
      "abort",
      () => {
        window.clearTimeout(timer);
        reject(new DOMException("Đã hủy import.", "AbortError"));
      },
      { once: true },
    );
  });
}

function isRetryable(status: number) {
  return status === 429 || status === 500 || status === 502 || status === 503 || status === 504;
}

function hasVietnameseProse(exam: z.infer<typeof aiExamSchema>) {
  const vietnamesePattern =
    /[ăâđêôơưáàảãạấầẩẫậắằẳẵặéèẻẽẹếềểễệíìỉĩịóòỏõọốồổỗộớờởỡợúùủũụứừửữựýỳỷỹỵ]|\b(?:không|nào|sau đây|được|của|một|các|trong|và|là)\b/i;
  const isTranslated = (value: string) => {
    if (vietnamesePattern.test(value)) return true;
    const words = value.match(/[A-Za-z]+(?:[-'][A-Za-z]+)*/g) ?? [];
    // Allow codes, formulas and short canonical terms, but reject an English phrase/sentence.
    return words.length <= 2;
  };
  return exam.questions.every((question) =>
    [question.stem, ...Object.values(question.opt), ...Object.values(question.ex)]
      .filter((value): value is string => Boolean(value))
      .every(isTranslated),
  );
}

async function requestGeminiBatch({
  questionText,
  answerText,
  sourceName,
  apiKey,
  model,
  signal,
  onRetry,
}: {
  questionText: string;
  answerText: string;
  sourceName: string;
  apiKey: string;
  model: string;
  signal?: AbortSignal;
  onRetry?: (message: string) => void;
}) {
  const cacheKey = await sha256(
    `${model}\n${AI_PROMPT}\n${AI_FORMAT_PROMPT}\n${questionText}\n${answerText}`,
  );
  const cached = batchCache.get(cacheKey);
  if (cached && hasVietnameseProse(cached)) return cached;
  if (cached) batchCache.delete(cacheKey);

  let lastError: Error | undefined;
  for (const candidateModel of [model, FALLBACK_MODEL]) {
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
      signal?.throwIfAborted();
      const timeout = new AbortController();
      const timer = window.setTimeout(() => timeout.abort(), REQUEST_TIMEOUT);
      const abort = () => timeout.abort();
      signal?.addEventListener("abort", abort, { once: true });
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(candidateModel)}:generateContent`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
            signal: timeout.signal,
            body: JSON.stringify({
              system_instruction: {
                parts: [
                  {
                    text: `${AI_PROMPT}\n\n${AI_FORMAT_PROMPT}\n\nĐây là một nhóm câu thuộc cùng bộ đề. Chỉ trả đúng các câu được cung cấp, giữ nguyên số câu gốc và không tạo thêm câu. Phần văn xuôi trong stem, opt và ex BẮT BUỘC phải được dịch sang tiếng Việt đầy đủ, tự nhiên. Chỉ giữ nguyên đúng các cụm thuật ngữ chuyên ngành ISTQB bằng tiếng Anh; tuyệt đối không giữ nguyên cả câu, mệnh đề hoặc phần giải thích bằng tiếng Anh.`,
                  },
                ],
              },
              contents: [
                {
                  role: "user",
                  parts: [
                    {
                      text: `TÊN FILE: ${sourceName}\n\n=== NHÓM CÂU HỎI ===\n${questionText}\n\n=== ĐÁP ÁN/GIẢI THÍCH TƯƠNG ỨNG ===\n${answerText || "Đáp án nằm trong cùng nội dung câu hỏi."}\n\nKIỂM TRA BẮT BUỘC TRƯỚC KHI TRẢ KẾT QUẢ: từng stem, từng opt và từng ex phải có ngữ pháp tiếng Việt. Mọi cụm tiếng Anh dài hơn một thuật ngữ ISTQB phải được dịch; không được sao chép nguyên một câu hoặc một lựa chọn tiếng Anh từ nguồn.`,
                    },
                  ],
                },
              ],
              generationConfig: {
                temperature: 0,
                responseMimeType: "application/json",
                responseJsonSchema: AI_RESPONSE_SCHEMA,
              },
            }),
          },
        );
        if (!response.ok) {
          const detail = (await response.text()).slice(0, 500);
          const error = new Error(`Dịch vụ dịch thuật trả lỗi ${response.status}: ${detail}`);
          if (!isRetryable(response.status)) throw error;
          lastError = error;
          const retryAfter = Number(response.headers.get("retry-after"));
          onRetry?.(
            `Gemini đang bận (mã ${response.status}). Đang thử lại lần ${attempt + 1}/${MAX_RETRIES}…`,
          );
          await wait(
            Number.isFinite(retryAfter) && retryAfter > 0
              ? retryAfter * 1_000
              : RETRY_BASE_DELAY * 2 ** attempt + Math.random() * 500,
            signal,
          );
          continue;
        }
        const payload = await response.json();
        const raw = payload?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (typeof raw !== "string") throw new Error("Dịch vụ không trả về dữ liệu đề thi.");
        let json: unknown;
        try {
          json = JSON.parse(raw.replace(/^```json\s*|\s*```$/g, ""));
        } catch {
          throw new Error("Gemini trả về JSON không hợp lệ cho nhóm câu hỏi này.");
        }
        const result = aiExamSchema.safeParse(json);
        if (!result.success) {
          const returnedQuestionCount =
            json &&
            typeof json === "object" &&
            Array.isArray((json as { questions?: unknown }).questions)
              ? (json as { questions: unknown[] }).questions.length
              : 0;
          throw new Error(
            returnedQuestionCount === 0
              ? "Gemini không trích xuất được câu hỏi nào trong nhóm này. Hãy kiểm tra đúng file đề và file đáp án."
              : "Gemini trả về nhóm câu hỏi thiếu dữ liệu bắt buộc.",
          );
        }
        const parsed = result.data;
        if (!hasVietnameseProse(parsed) && candidateModel !== FALLBACK_MODEL) {
          const error = new Error("Kết quả còn nguyên tiếng Anh.");
          error.name = "NeedsTranslationFallback";
          throw error;
        }
        if (!hasVietnameseProse(parsed)) {
          parsed.warnings.push(
            "Model dự phòng vẫn còn trường văn xuôi tiếng Anh; hãy kiểm tra preview trước khi lưu.",
          );
        }
        batchCache.set(cacheKey, parsed);
        return parsed;
      } catch (reason) {
        if (signal?.aborted) throw new DOMException("Đã hủy import.", "AbortError");
        if (reason instanceof Error && reason.name === "NeedsTranslationFallback") {
          lastError = reason;
          onRetry?.("Model chính chưa dịch nội dung. Đang chuyển sang model dự phòng…");
          break;
        }
        if (reason instanceof Error && reason.name === "AbortError") {
          lastError = new Error("Request Gemini quá thời gian cho phép.");
        } else {
          lastError = reason instanceof Error ? reason : new Error("Không thể gọi Gemini.");
          if (/trả lỗi (?:400|401|403|404)/.test(lastError.message)) throw lastError;
        }
        if (attempt < MAX_RETRIES) {
          onRetry?.(`Request chưa hoàn tất. Đang thử lại lần ${attempt + 1}/${MAX_RETRIES}…`);
          await wait(RETRY_BASE_DELAY * 2 ** attempt + Math.random() * 500, signal);
        }
      } finally {
        window.clearTimeout(timer);
        signal?.removeEventListener("abort", abort);
      }
    }
  }
  throw lastError ?? new Error("Không thể xử lý nhóm câu hỏi.");
}

export async function parseExamWithGemini({
  questionText,
  answerText,
  sourceName,
  apiKey,
  model = "gemini-flash-lite-latest",
  onProgress,
  signal,
}: {
  questionText: string;
  answerText?: string;
  sourceName: string;
  apiKey: string;
  model?: string;
  onProgress?: (progress: ImportProgress) => void;
  signal?: AbortSignal;
}): Promise<ImportedExam & { warnings: string[] }> {
  const questionBlocks = splitNumberedBlocks(questionText);
  const answerBlocks = new Map(
    splitNumberedBlocks(answerText ?? "").map((block) => [block.number, block]),
  );
  const matchedAnswerCount = questionBlocks.filter((block) =>
    answerBlocks.has(block.number),
  ).length;
  const answersCanBeSplit =
    !answerText?.trim() || matchedAnswerCount >= Math.ceil(questionBlocks.length * 0.8);
  const useBatches = questionBlocks.length >= BATCH_SIZE * 2 && answersCanBeSplit;
  const batches = useBatches
    ? Array.from({ length: Math.ceil(questionBlocks.length / BATCH_SIZE) }, (_, index) =>
        questionBlocks.slice(index * BATCH_SIZE, (index + 1) * BATCH_SIZE),
      )
    : [[{ number: 0, text: questionText }]];
  const results: Array<z.infer<typeof aiExamSchema> | undefined> = new Array(batches.length);
  let nextBatch = 0;
  let completedQuestions = 0;
  const totalQuestions = useBatches ? questionBlocks.length : 1;
  onProgress?.({
    phase: "extracting",
    completed: 0,
    total: totalQuestions,
    message: useBatches
      ? `Đã nhận diện ${questionBlocks.length} câu hỏi. Đang chia thành ${batches.length} nhóm…`
      : !answersCanBeSplit
        ? "File đáp án không có ranh giới an toàn theo từng câu. Đang xử lý toàn bộ nội dung…"
        : "Không tìm thấy đủ ranh giới câu hỏi an toàn. Đang xử lý toàn bộ nội dung…",
  });

  const worker = async () => {
    while (true) {
      const batchIndex = nextBatch++;
      if (batchIndex >= batches.length) return;
      const batch = batches[batchIndex]!;
      const relatedAnswers = batch
        .map((block) => answerBlocks.get(block.number)?.text ?? "")
        .filter(Boolean)
        .join("\n\n");
      results[batchIndex] = await requestGeminiBatch({
        questionText: batch.map((block) => block.text).join("\n\n"),
        answerText: relatedAnswers || (!useBatches ? (answerText ?? "") : ""),
        sourceName,
        apiKey,
        model,
        ...(signal ? { signal } : {}),
        onRetry: (message) =>
          onProgress?.({
            phase: "retrying",
            completed: completedQuestions,
            total: totalQuestions,
            message: `Nhóm ${batchIndex + 1}: ${message}`,
          }),
      });
      completedQuestions += useBatches ? batch.length : 1;
      onProgress?.({
        phase: "translating",
        completed: completedQuestions,
        total: totalQuestions,
        message: useBatches
          ? `Đang dịch ${completedQuestions}/${totalQuestions} câu hỏi…`
          : "Đang dịch và chuẩn hóa dữ liệu…",
      });
    }
  };
  await Promise.all(
    Array.from({ length: Math.min(MAX_CONCURRENT_REQUESTS, batches.length) }, () => worker()),
  );
  onProgress?.({
    phase: "validating",
    completed: totalQuestions,
    total: totalQuestions,
    message: "Đang kiểm tra và gộp dữ liệu…",
  });
  const parsedResults = results.filter((result): result is z.infer<typeof aiExamSchema> =>
    Boolean(result),
  );
  const first = parsedResults[0];
  if (!first) throw new Error("Gemini không trả về nhóm câu hỏi hợp lệ.");
  const parsed = {
    ...first,
    questions: parsedResults.flatMap((result) => result.questions),
    warnings: parsedResults.flatMap((result) => result.warnings),
  };
  if (useBatches && parsed.questions.length !== questionBlocks.length) {
    throw new Error(
      `Gemini trả về ${parsed.questions.length}/${questionBlocks.length} câu. Dữ liệu chưa được chấp nhận.`,
    );
  }
  const numbers = parsed.questions.map((question) => question.n);
  if (new Set(numbers).size !== numbers.length) {
    throw new Error("Gemini trả về câu hỏi trùng số. Dữ liệu chưa được chấp nhận.");
  }
  if (useBatches) {
    const returnedNumbers = new Set(numbers);
    const missingNumbers = questionBlocks
      .map((block) => block.number)
      .filter((number) => !returnedNumbers.has(number));
    if (missingNumbers.length > 0) {
      throw new Error(
        `Gemini làm thiếu hoặc đổi số câu: ${missingNumbers.join(", ")}. Dữ liệu chưa được chấp nhận.`,
      );
    }
  }
  parsed.questions.sort((firstQuestion, secondQuestion) => firstQuestion.n - secondQuestion.n);
  const questions: ExamQuestion[] = parsed.questions.map((question) => ({
    ...question,
    ans: question.ans as AnswerKey[],
    stem: normalizeImportedLayout(question.stem),
    opt: Object.fromEntries(
      Object.entries(question.opt)
        .filter((entry): entry is [string, string] => typeof entry[1] === "string")
        .map(([key, value]) => [key, normalizeImportedLayout(value)]),
    ) as ExamQuestion["opt"],
    ex: Object.fromEntries(
      Object.entries(question.ex)
        .filter((entry): entry is [string, string] => typeof entry[1] === "string")
        .map(([key, value]) => [key, normalizeImportedLayout(value)]),
    ) as ExamQuestion["ex"],
  }));
  questions.forEach((question, index) => {
    const optionIds = new Set(Object.keys(question.opt));
    if (question.ans.some((answer) => !optionIds.has(answer))) {
      throw new Error(`Dữ liệu trả về có đáp án không tồn tại tại câu ${index + 1}.`);
    }
    const missingExplanation = [...optionIds].find(
      (optionId) => !question.ex[optionId as AnswerKey]?.trim(),
    );
    if (missingExplanation) {
      throw new Error(
        `Câu ${index + 1} chưa có giải thích cho phương án ${missingExplanation.toUpperCase()}.`,
      );
    }
  });
  const fingerprint = await sha256(`${sourceName}\n${questionText}\n${answerText ?? ""}`);
  return {
    id: `import-${fingerprint}`,
    title: parsed.title,
    sourceName,
    sourceLanguage: "vi",
    syllabus: "CTFL v4.0",
    durationMinutes: parsed.durationMinutes,
    passingPercentage: parsed.passingPercentage,
    createdAt: new Date().toISOString(),
    questions,
    warnings: parsed.warnings,
  };
}

function clean(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function escapeHtml(value: string) {
  const entities: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  };
  return value.replace(/[&<>"']/g, (character) => entities[character] ?? character);
}

function answerKeys(value: string | string[]): AnswerKey[] {
  const raw = Array.isArray(value) ? value.join(",") : value;
  return [...new Set((raw.toLowerCase().match(/[a-e]/g) ?? []) as AnswerKey[])];
}

function makeQuestion(
  index: number,
  question: string,
  options: Partial<Record<AnswerKey, string>>,
  answer: string | string[],
  explanation = "",
  learningObjective = "Imported",
  knowledgeLevel = "K2",
): ExamQuestion {
  const keys = answerKeys(answer);
  if (!question || Object.keys(options).length < 2 || keys.length === 0) {
    throw new Error(`Câu ${index + 1} thiếu nội dung, lựa chọn hoặc đáp án đúng.`);
  }
  if (keys.some((key) => !options[key]))
    throw new Error(`Câu ${index + 1} có đáp án không hợp lệ.`);
  return {
    n: 10_000 + index,
    lo: learningObjective,
    k: knowledgeLevel,
    ans: keys,
    stem: escapeHtml(question),
    opt: Object.fromEntries(
      Object.entries(options).map(([key, value]) => [key, escapeHtml(value ?? "")]),
    ),
    ex: explanation ? Object.fromEntries(keys.map((key) => [key, escapeHtml(explanation)])) : {},
  };
}

function parseRows(
  raw: unknown[],
  title: string,
): Omit<ImportedExam, "id" | "createdAt" | "sourceName"> {
  const questions = raw.map((entry, index) => {
    const row = entry as Record<string, unknown>;
    const get = (...keys: string[]) =>
      clean(String(keys.map((key) => row[key]).find(Boolean) ?? ""));
    return makeQuestion(
      index,
      get("question", "Question", "content", "Câu hỏi"),
      {
        a: get("a", "A"),
        b: get("b", "B"),
        c: get("c", "C"),
        d: get("d", "D"),
        ...(get("e", "E") ? { e: get("e", "E") } : {}),
      },
      get("answer", "Answer", "correctAnswer", "Đáp án"),
      get("explanation", "Explanation", "Giải thích"),
    );
  });
  return {
    title,
    sourceLanguage: "mixed",
    syllabus: "4.0",
    durationMinutes: questions.length === 40 ? 60 : Math.max(15, questions.length * 2),
    passingPercentage: 65,
    questions,
  };
}

export function parseExamContent(
  text: string,
  fileName: string,
): Omit<ImportedExam, "id" | "createdAt" | "sourceName"> {
  const title = fileName.replace(/\.[^.]+$/, "");
  const trimmed = text.trim();
  if (trimmed.startsWith("[") || trimmed.startsWith("{")) {
    let value = JSON.parse(trimmed) as unknown;
    if (Array.isArray(value)) return parseRows(value, title);
    if (
      value &&
      typeof value === "object" &&
      Array.isArray((value as { questions?: unknown }).questions)
    ) {
      const document = value as {
        exam?: Record<string, unknown>;
        questions: Array<Record<string, unknown>>;
      };
      const normalizedQuestions = document.questions.map((item) => ({
        question: String(item["contentVi"] ?? item["contentEn"] ?? item["content"] ?? ""),
        options: Object.fromEntries(
          (Array.isArray(item["options"]) ? item["options"] : []).map((option) => {
            const entry = option as Record<string, unknown>;
            return [
              String(entry["id"] ?? "").toLowerCase(),
              String(entry["contentVi"] ?? entry["contentEn"] ?? entry["content"] ?? ""),
            ];
          }),
        ),
        answer: Array.isArray(item["correctOptionIds"])
          ? item["correctOptionIds"].map(String)
          : String(item["answer"] ?? ""),
        explanation: String(
          item["explanationVi"] ?? item["explanationEn"] ?? item["explanation"] ?? "",
        ),
        learningObjective: String(item["learningObjective"] ?? "Imported"),
        knowledgeLevel: String(item["knowledgeLevel"] ?? "K2"),
      }));
      const parsedNormalized = jsonExamSchema.safeParse({
        title: document.exam?.["title"] ?? title,
        durationMinutes: document.exam?.["durationMinutes"],
        passingPercentage: document.exam?.["passingPercentage"],
        questions: normalizedQuestions,
      });
      if (parsedNormalized.success) value = parsedNormalized.data;
    }
    const parsed = jsonExamSchema.safeParse(value);
    if (!parsed.success) throw new Error("JSON không đúng schema đề thi.");
    const questions = parsed.data.questions.map((item, index) => {
      const options: Partial<Record<AnswerKey, string>> = {
        a: item.options.a,
        b: item.options.b,
        c: item.options.c,
        d: item.options.d,
      };
      if (item.options.e) options.e = item.options.e;
      return makeQuestion(
        index,
        item.question,
        options,
        item.answer,
        item.explanation,
        item.learningObjective,
        item.knowledgeLevel,
      );
    });
    return {
      title: parsed.data.title ?? title,
      sourceLanguage: "mixed",
      syllabus: "4.0",
      durationMinutes:
        parsed.data.durationMinutes ?? (questions.length === 40 ? 60 : questions.length * 2),
      passingPercentage: parsed.data.passingPercentage ?? 65,
      questions,
    };
  }

  const questionsText = trimmed.split(/(?:Answer\s*Key|Đáp\s*án)\s*[:\n]/i)[0] ?? trimmed;
  const markers = [
    ...questionsText.matchAll(/(?:^|\n)\s*(?:Question|Câu)\s*#?\s*(\d+)\s*[:.)-]?/gi),
  ];
  if (markers.length === 0)
    throw new Error("Không nhận diện được câu hỏi. Dùng tiêu đề dạng 'Question 1' hoặc 'Câu 1'.");
  const answerSection = trimmed.match(/(?:Answer\s*Key|Đáp\s*án)\s*[:\n]([\s\S]+)$/i)?.[1] ?? "";
  const answerMap = new Map<number, string>();
  for (const match of answerSection.matchAll(
    /(?:^|\s)(\d+)\s*[-:.]?\s*([A-E](?:\s*[,/&]\s*[A-E])*)/gi,
  ))
    answerMap.set(Number(match[1]), match[2] ?? "");

  const questions = markers.map((marker, index) => {
    const number = Number(marker[1]);
    const block =
      questionsText
        .slice(
          (marker.index ?? 0) + marker[0].length,
          markers[index + 1]?.index ?? questionsText.length,
        )
        .split(/Answer\s*Key|Đáp\s*án/i)[0] ?? "";
    const optionMatches = [...block.matchAll(/(?:^|\n|\s{2,})([A-E])\s*[).:-]\s*/gi)];
    if (optionMatches.length < 2)
      throw new Error(`Không nhận diện được lựa chọn của câu ${number}.`);
    const options: Partial<Record<AnswerKey, string>> = {};
    for (let optionIndex = 0; optionIndex < optionMatches.length; optionIndex += 1) {
      const match = optionMatches[optionIndex]!;
      const key = match[1]!.toLowerCase() as AnswerKey;
      options[key] = clean(
        block
          .slice(
            (match.index ?? 0) + match[0].length,
            optionMatches[optionIndex + 1]?.index ?? block.length,
          )
          .replace(/\bSelect\s+(?:ONE|TWO)\s+options?[\s\S]*$/i, ""),
      );
    }
    const inlineAnswer = block.match(
      /(?:Correct\s*Answer|Đáp\s*án(?:\s*đúng)?)\s*[:.-]\s*([A-E](?:\s*[,/&]\s*[A-E])*)/i,
    )?.[1];
    const questionText = clean(
      block.slice(0, optionMatches[0]?.index ?? 0).replace(/^\s*\(\s*1\s+Point\s*\)\s*/i, ""),
    );
    return makeQuestion(index, questionText, options, inlineAnswer ?? answerMap.get(number) ?? "");
  });
  return {
    title,
    sourceLanguage: /[ăâđêôơư]/i.test(trimmed) ? "vi" : "en",
    syllabus: "4.0",
    durationMinutes: questions.length === 40 ? 60 : Math.max(15, questions.length * 2),
    passingPercentage: 65,
    questions,
  };
}
