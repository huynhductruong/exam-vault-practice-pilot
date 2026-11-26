export type ExamSourceCatalogEntry = {
  id: string;
  title: string;
  syllabus: string;
  version: string;
  released: string;
  questionCount: number;
  questionsUrl: string;
  answersUrl: string;
  authority: "ISTQB_OFFICIAL";
  localContentStatus: "ACTIVE_USER_PROVIDED";
  verificationNote: string;
};

/**
 * Official-source inventory checked on 2026-11-26. B–D use the PDF pairs supplied by the user.
 */
export const examSourceCatalog: ExamSourceCatalogEntry[] = [
  {
    id: "ctfl-v4-set-a",
    title: "ISTQB CTFL v4.0 Sample Exam Set A",
    syllabus: "4.0.1",
    version: "1.7",
    released: "2025-04-01",
    questionCount: 40,
    questionsUrl:
      "https://istqb.org/wp-content/uploads/sdm-uploads/ISTQB_CTFL_v4.0_Sample-Exam-A-Questions_v1.7.pdf",
    answersUrl:
      "https://istqb.org/wp-content/uploads/sdm-uploads/ISTQB_CTFL_v4.0_Sample-Exam-A-Answers_v1.7.pdf",
    authority: "ISTQB_OFFICIAL",
    localContentStatus: "ACTIVE_USER_PROVIDED",
    verificationNote: "All 40 local answer keys match the official v1.7 answer key.",
  },
  {
    id: "ctfl-v4-set-b",
    title: "ISTQB CTFL v4.0 Sample Exam Set B",
    syllabus: "4.0.1",
    version: "1.7",
    released: "2025-04-01",
    questionCount: 40,
    questionsUrl:
      "https://istqb.org/wp-content/uploads/sdm-uploads/ISTQB_CTFL_v4.0_Sample-Exam-B-Questions_v1.7.pdf",
    answersUrl:
      "https://istqb.org/wp-content/uploads/sdm-uploads/ISTQB_CTFL_v4.0_Sample-Exam-B-Answers_v1.7.pdf",
    authority: "ISTQB_OFFICIAL",
    localContentStatus: "ACTIVE_USER_PROVIDED",
    verificationNote:
      "Imported from the supplied English question and answer PDFs.",
  },
  {
    id: "ctfl-v4-set-c",
    title: "ISTQB CTFL v4.0 Sample Exam Set C",
    syllabus: "4.0.1",
    version: "1.6",
    released: "2025-04-01",
    questionCount: 40,
    questionsUrl: "https://istqb.org/?download_id=3369&sdm_process_download=1",
    answersUrl: "https://istqb.org/?download_id=3372&sdm_process_download=1",
    authority: "ISTQB_OFFICIAL",
    localContentStatus: "ACTIVE_USER_PROVIDED",
    verificationNote:
      "Imported from the supplied English question and answer PDFs.",
  },
  {
    id: "ctfl-v4-set-d",
    title: "ISTQB CTFL v4.0 Sample Exam Set D",
    syllabus: "4.0.1",
    version: "1.5",
    released: "2025-05-02",
    questionCount: 40,
    questionsUrl: "https://istqb.org/?download_id=3376&sdm_process_download=1",
    answersUrl: "https://istqb.org/?download_id=3380&sdm_process_download=1",
    authority: "ISTQB_OFFICIAL",
    localContentStatus: "ACTIVE_USER_PROVIDED",
    verificationNote:
      "Use v1.5 only: its revision history records corrections to answers #3, #8, #16 and #19.",
  },
];
