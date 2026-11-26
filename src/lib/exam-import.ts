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
  ex: z.record(z.enum(["a", "b", "c", "d", "e"]), z.string()).default({}),
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
2. Dịch câu hỏi, lựa chọn và giải thích. Giữ nguyên mã FL-x.x.x, K-level, số liệu, công thức, bảng và mọi từ phủ định NOT/EXCEPT/LEAST/MOST.
3. Dùng thuật ngữ ISTQB nhất quán: testing=kiểm thử; test case=ca kiểm thử; defect=khiếm khuyết; failure=sự cố; test basis=cơ sở kiểm thử; test object=đối tượng kiểm thử; equivalence partitioning=phân vùng tương đương; boundary value analysis=phân tích giá trị biên; regression testing=kiểm thử hồi quy; confirmation testing=kiểm thử xác nhận.
4. Mỗi ans chỉ chứa mã lựa chọn đúng từ tài liệu đáp án. Nếu có mâu thuẫn, ưu tiên file đáp án và ghi vào warnings.
5. ex bắt buộc có một lời giải riêng, đầy đủ cho TỪNG lựa chọn xuất hiện trong opt. Nếu tài liệu có lời giải chính thức, phải dịch chính xác lời giải đó. Nếu tài liệu chỉ có đáp án mà không có lời giải, phải tự phân tích theo CTFL v4.0 và viết rõ vì sao lựa chọn đúng là đúng, vì sao từng lựa chọn còn lại là sai; không được chỉ ghi "Đúng", "Sai" hoặc diễn đạt chung chung. Nội dung tự phân tích không được mâu thuẫn với đáp án chính thức. Không dùng Markdown.
6. Chỉ trả một JSON hợp lệ đúng cấu trúc: {title, durationMinutes, passingPercentage, questions:[{n,lo,k,ans,stem,opt:{a,b,c,d,e?},ex:{a?,b?,c?,d?,e?}}],warnings}.
7. Không giữ ngắt dòng do bố cục cột hoặc cuối dòng của PDF. Nếu một câu đang tiếp tục về mặt ngữ pháp thì phải nối thành một dòng, có đúng một dấu cách.
8. Trong stem, opt và ex, không dùng ký tự xuống dòng \\n. Chỉ dùng <br> khi thực sự bắt đầu một mục danh sách, tiêu chí chấp nhận, quy tắc bảng quyết định, bước kiểm thử, công thức hoặc đoạn văn mới.
9. Danh sách phải có dạng "Nội dung dẫn:<br>1. Mục một<br>2. Mục hai<br>Câu hỏi kết luận". Không chèn <br> giữa chủ ngữ và vị ngữ hoặc giữa các phần của cùng một câu.
10. Giữ nguyên mã và tên biến như BY, CY, D, TC1, AC1; không dịch mã thành từ tiếng Việt. Loại bỏ ký tự rác do PDF/OCR như ký hiệu điều hướng, bullet lỗi, ký tự vô hình hoặc chuỗi vô nghĩa.
11. Với bảng bị mất đường kẻ, chuyển mỗi quy tắc hoặc mỗi hàng thành một dòng <br> rõ nghĩa; không dồn toàn bộ bảng thành một câu dài.
12. Tự kiểm tra lần cuối: đủ số câu, mọi ans tồn tại trong opt, nội dung đã là tiếng Việt, không làm mất từ phủ định, không còn ngắt dòng PDF sai và không còn ký tự OCR rác.`;

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

export async function parseExamWithGemini({
  questionText,
  answerText,
  sourceName,
  apiKey,
  model = "gemini-flash-lite-latest",
}: {
  questionText: string;
  answerText?: string;
  sourceName: string;
  apiKey: string;
  model?: string;
}): Promise<ImportedExam & { warnings: string[] }> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: AI_PROMPT }] },
        contents: [
          {
            role: "user",
            parts: [
              {
                text: `TÊN FILE: ${sourceName}\n\n=== ĐỀ THI ===\n${questionText}\n\n=== ĐÁP ÁN CHÍNH THỨC ===\n${answerText || "Đáp án nằm trong cùng file đề."}`,
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
    throw new Error(`Dịch vụ dịch thuật trả lỗi ${response.status}: ${detail}`);
  }
  const payload = await response.json();
  const raw = payload?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (typeof raw !== "string") throw new Error("Dịch vụ không trả về dữ liệu đề thi.");
  const parsed = aiExamSchema.parse(JSON.parse(raw.replace(/^```json\s*|\s*```$/g, "")));
  const questions: ExamQuestion[] = parsed.questions.map((question) => ({
    ...question,
    ans: question.ans as AnswerKey[],
    stem: normalizeImportedLayout(question.stem),
    opt: Object.fromEntries(
      Object.entries(question.opt).map(([key, value]) => [key, normalizeImportedLayout(value)]),
    ) as ExamQuestion["opt"],
    ex: Object.fromEntries(
      Object.entries(question.ex).map(([key, value]) => [key, normalizeImportedLayout(value)]),
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
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(`${sourceName}\n${questionText}\n${answerText ?? ""}`),
  );
  const fingerprint = [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
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
