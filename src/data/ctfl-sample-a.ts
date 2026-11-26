export type AnswerKey = "a" | "b" | "c" | "d" | "e";

export type ExamQuestion = {
  n: number;
  lo: string;
  k: string;
  ans: AnswerKey[];
  stem: string;
  opt: Partial<Record<AnswerKey, string>>;
  sourceSet?: string;
  sourceNumber?: number;
  sourcePage?: number;
  ex: Partial<Record<AnswerKey, string>>;
  pre?: string;
  img?: "std";
};

export const sampleASource = {
  title: "ISTQB CTFL v4.0 Sample Exam Set A — Questions and Answers",
  version: "1.7",
  released: "2025-04-01",
  syllabus: "4.0.1",
  questionsUrl: "https://istqb.org/wp-content/uploads/sdm-uploads/ISTQB_CTFL_v4.0_Sample-Exam-A-Questions_v1.7.pdf",
  answersUrl: "https://istqb.org/wp-content/uploads/sdm-uploads/ISTQB_CTFL_v4.0_Sample-Exam-A-Answers_v1.7.pdf",
  usage: "Official public sample exam; source and copyright credited. For personal, non-commercial study."
} as const;

export const sampleAQuestions: ExamQuestion[] = [
  {
    "n": 1,
    "lo": "FL-1.1.1",
    "k": "K1",
    "ans": [
      "c"
    ],
    "stem": "Phát biểu nào sau đây mô tả một <b>mục tiêu kiểm thử</b> (test objective) hợp lệ?",
    "opt": {
      "a": "Chứng minh rằng không còn khiếm khuyết (defect) nào chưa được sửa trong hệ thống đang được kiểm thử",
      "b": "Chứng minh rằng sẽ không có thất bại (failure) nào sau khi triển khai hệ thống lên môi trường production",
      "c": "Giảm mức độ rủi ro của đối tượng kiểm thử (test object) và xây dựng sự tin tưởng vào mức chất lượng",
      "d": "Xác minh rằng không còn tổ hợp đầu vào nào chưa được kiểm thử"
    },
    "ex": {
      "a": "Sai. Không thể chứng minh hệ thống không còn khiếm khuyết. Xem nguyên tắc kiểm thử 1 (kiểm thử cho thấy sự hiện diện của khiếm khuyết, không chứng minh sự vắng mặt của chúng).",
      "b": "Sai. Xem nguyên tắc kiểm thử 7 (ngụy biện về sự vắng mặt của khiếm khuyết).",
      "c": "<b>Đúng.</b> Kiểm thử tìm ra khiếm khuyết và thất bại, nhờ đó giảm mức rủi ro, đồng thời tăng sự tin tưởng vào mức chất lượng của đối tượng kiểm thử.",
      "d": "Sai. Không thể kiểm thử mọi tổ hợp đầu vào (nguyên tắc 2: kiểm thử toàn diện là không thể)."
    }
  },
  {
    "n": 2,
    "lo": "FL-1.2.1",
    "k": "K2",
    "ans": [
      "a"
    ],
    "stem": "Phương án nào sau đây là ví dụ về các hoạt động kiểm thử góp phần vào sự thành công?",
    "opt": {
      "a": "Để tester tham gia vào nhiều hoạt động khác nhau của vòng đời phát triển phần mềm (SDLC) sẽ giúp phát hiện khiếm khuyết trong các sản phẩm công việc (work product)",
      "b": "Tester cố gắng không làm phiền developer khi đang lập trình để developer viết code tốt hơn",
      "c": "Tester cộng tác với người dùng cuối giúp nâng cao chất lượng báo cáo khiếm khuyết trong kiểm thử tích hợp thành phần và kiểm thử hệ thống",
      "d": "Tester có chứng chỉ sẽ thiết kế ca kiểm thử tốt hơn nhiều so với tester không có chứng chỉ"
    },
    "ex": {
      "a": "<b>Đúng.</b> Tester cần tham gia ngay từ đầu SDLC. Điều này giúp hiểu rõ hơn các quyết định thiết kế và phát hiện khiếm khuyết sớm.",
      "b": "Sai. Sự tương tác giúp cả developer và tester hiểu rõ hơn sản phẩm công việc của nhau và cách kiểm thử code.",
      "c": "Sai. Người dùng cuối không giúp tester nâng cao chất lượng báo cáo khiếm khuyết; ngoài ra họ thường không tham gia các mức kiểm thử thấp như kiểm thử tích hợp.",
      "d": "Sai. Có chứng chỉ không tự động có nghĩa là tester sẽ thiết kế kiểm thử giỏi hơn."
    }
  },
  {
    "n": 3,
    "lo": "FL-1.3.1",
    "k": "K2",
    "ans": [
      "a"
    ],
    "stem": "Bạn được phân công làm tester cho một nhóm phát triển hệ thống mới theo mô hình tăng dần (incremental). Bạn nhận thấy trong nhiều vòng lặp liên tiếp, bộ ca kiểm thử hồi quy hiện có không hề được thay đổi và cũng không phát hiện thêm khiếm khuyết hồi quy nào. Quản lý của bạn hài lòng, nhưng bạn thì không. <b>Nguyên tắc kiểm thử</b> nào giải thích sự hoài nghi của bạn?",
    "opt": {
      "a": "Kiểm thử bị mòn (Tests wear out)",
      "b": "Ngụy biện về sự vắng mặt của khiếm khuyết (Absence-of-defects fallacy)",
      "c": "Khiếm khuyết tập trung thành cụm (Defects cluster together)",
      "d": "Kiểm thử toàn diện là không thể (Exhaustive testing is impossible)"
    },
    "ex": {
      "a": "<b>Đúng.</b> Nguyên tắc này nói rằng nếu cùng một bộ kiểm thử được lặp đi lặp lại, cuối cùng chúng sẽ không còn tìm ra khiếm khuyết mới. Đây có thể là lý do mọi kiểm thử đều pass trong bản phát hành này.",
      "b": "Sai. Nguyên tắc này nói về niềm tin sai lầm rằng chỉ cần tìm và sửa thật nhiều khiếm khuyết là đảm bảo hệ thống thành công.",
      "c": "Sai. Nguyên tắc này nói rằng một số ít thành phần thường chứa phần lớn khiếm khuyết.",
      "d": "Sai. Nguyên tắc này nói rằng kiểm thử mọi tổ hợp đầu vào và điều kiện tiên quyết là không khả thi."
    }
  },
  {
    "n": 4,
    "lo": "FL-1.4.1",
    "k": "K2",
    "ans": [
      "b"
    ],
    "stem": "Bạn làm việc trong một nhóm phát triển ứng dụng di động đặt đồ ăn. Trong vòng lặp hiện tại, nhóm quyết định triển khai chức năng thanh toán.<br><br>Hoạt động nào sau đây là một phần của <b>phân tích kiểm thử</b> (test analysis)?",
    "opt": {
      "a": "Ước lượng rằng việc kiểm thử tích hợp với dịch vụ thanh toán sẽ mất 8 ngày công",
      "b": "Quyết định rằng nhóm nên kiểm thử xem có thể chia sẻ khoản thanh toán giữa nhiều người dùng một cách đúng đắn hay không",
      "c": "Sử dụng phân tích giá trị biên (BVA) để tạo dữ liệu kiểm thử cho các ca kiểm thử kiểm tra việc xử lý thanh toán đúng với số tiền thanh toán tối thiểu cho phép",
      "d": "Phân tích sự khác biệt giữa kết quả thực tế và kết quả mong đợi sau khi thực thi ca kiểm thử thanh toán bằng thẻ tín dụng, và báo cáo khiếm khuyết"
    },
    "ex": {
      "a": "Sai. Ước lượng nỗ lực kiểm thử là một phần của lập kế hoạch kiểm thử (test planning).",
      "b": "<b>Đúng.</b> Đây là ví dụ về xác định điều kiện kiểm thử (test condition) – một phần của phân tích kiểm thử.",
      "c": "Sai. Sử dụng kỹ thuật kiểm thử để tạo các mục bao phủ (coverage item) là một phần của thiết kế kiểm thử (test design).",
      "d": "Sai. Báo cáo khiếm khuyết được tìm thấy trong kiểm thử động là một phần của thực thi kiểm thử (test execution)."
    }
  },
  {
    "n": 5,
    "lo": "FL-1.4.2",
    "k": "K2",
    "ans": [
      "b"
    ],
    "stem": "Những yếu tố nào sau đây có ảnh hưởng <b>ĐÁNG KỂ</b> đến cách tiếp cận kiểm thử (test approach)?<ol class='roman'><li>SDLC</li><li>Số lượng khiếm khuyết phát hiện được trong các dự án trước</li><li>Các rủi ro sản phẩm (product risk) đã được xác định</li><li>Quy định pháp lý mới bắt buộc kiểm thử hộp trắng chính thức</li><li>Việc thiết lập môi trường kiểm thử</li></ol>",
    "opt": {
      "a": "i, ii có ảnh hưởng đáng kể",
      "b": "i, iii, iv có ảnh hưởng đáng kể",
      "c": "ii, iv, v có ảnh hưởng đáng kể",
      "d": "iii, v có ảnh hưởng đáng kể"
    },
    "pre": "<ul><li>i. Đúng. SDLC ảnh hưởng đến cách tiếp cận kiểm thử.</li><li>ii. Sai. Số khiếm khuyết trong các dự án trước có thể có chút ảnh hưởng, nhưng không đáng kể bằng i, iii và iv.</li><li>iii. Đúng. Rủi ro sản phẩm đã xác định là một trong những yếu tố quan trọng nhất ảnh hưởng đến cách tiếp cận kiểm thử.</li><li>iv. Đúng. Yêu cầu pháp lý là yếu tố quan trọng ảnh hưởng đến cách tiếp cận kiểm thử.</li><li>v. Sai. Môi trường kiểm thử không có ảnh hưởng đáng kể đến cách tiếp cận kiểm thử.</li></ul>Vì vậy đáp án đúng là <b>b</b>.",
    "ex": {}
  },
  {
    "n": 6,
    "lo": "FL-1.4.5",
    "k": "K2",
    "ans": [
      "a",
      "e"
    ],
    "stem": "<b>HAI</b> nhiệm vụ nào sau đây CHỦ YẾU thuộc về <b>vai trò kiểm thử</b> (testing role)?",
    "opt": {
      "a": "Cấu hình môi trường kiểm thử",
      "b": "Duy trì product backlog",
      "c": "Thiết kế giải pháp cho các yêu cầu mới",
      "d": "Lập kế hoạch kiểm thử (test plan)",
      "e": "Phân tích cơ sở kiểm thử (test basis)"
    },
    "ex": {
      "a": "<b>Đúng.</b> Việc này do tester thực hiện.",
      "b": "Sai. Product backlog do product owner xây dựng và duy trì.",
      "c": "Sai. Việc này do nhóm phát triển thực hiện.",
      "d": "Sai. Đây là nhiệm vụ của vai trò quản lý kiểm thử (test management role).",
      "e": "<b>Đúng.</b> Việc này do tester thực hiện vì đây là nhiệm vụ kỹ thuật thuộc phân tích kiểm thử."
    }
  },
  {
    "n": 7,
    "lo": "FL-1.5.1",
    "k": "K2",
    "ans": [
      "b"
    ],
    "stem": "Những kỹ năng nào (i–v) sau đây là kỹ năng QUAN TRỌNG NHẤT của một tester?<ol class='roman'><li>Có kiến thức nghiệp vụ (domain knowledge)</li><li>Xây dựng tầm nhìn sản phẩm</li><li>Có tinh thần làm việc nhóm tốt</li><li>Lập kế hoạch và tổ chức công việc của nhóm</li><li>Tư duy phản biện (critical thinking)</li></ol>",
    "opt": {
      "a": "ii và iv là quan trọng",
      "b": "i, iii và v là quan trọng",
      "c": "i, ii và v là quan trọng",
      "d": "iii và iv là quan trọng"
    },
    "pre": "<ul><li>i. Đúng. Kiến thức nghiệp vụ là kỹ năng quan trọng của tester.</li><li>ii. Sai. Đây là nhiệm vụ của business analyst cùng đại diện nghiệp vụ.</li><li>iii. Đúng. Làm việc nhóm tốt là kỹ năng quan trọng.</li><li>iv. Sai. Lập kế hoạch và tổ chức công việc nhóm là nhiệm vụ của test manager, hoặc – chủ yếu trong dự án Agile – của cả nhóm chứ không riêng tester.</li><li>v. Đúng. Tư duy phản biện là một trong những kỹ năng quan trọng nhất của tester.</li></ul>Vì vậy đáp án đúng là <b>b</b>.",
    "ex": {}
  },
  {
    "n": 8,
    "lo": "FL-1.5.2",
    "k": "K1",
    "ans": [
      "d"
    ],
    "stem": "<b>Cách tiếp cận toàn đội</b> (whole team approach) thể hiện như thế nào trong tương tác giữa tester và đại diện nghiệp vụ (business representative)?",
    "opt": {
      "a": "Đại diện nghiệp vụ quyết định cách tiếp cận tự động hóa kiểm thử",
      "b": "Tester giúp đại diện nghiệp vụ xác định chiến lược kiểm thử",
      "c": "Đại diện nghiệp vụ không thuộc cách tiếp cận toàn đội",
      "d": "Tester giúp đại diện nghiệp vụ tạo ra các kiểm thử chấp nhận phù hợp"
    },
    "ex": {
      "a": "Sai. Cách tiếp cận tự động hóa kiểm thử do tester xác định với sự hỗ trợ của developer và đại diện nghiệp vụ.",
      "b": "Sai. Chiến lược kiểm thử được quyết định với sự cộng tác của developer.",
      "c": "Sai. Tester, developer và đại diện nghiệp vụ đều là một phần của cách tiếp cận toàn đội.",
      "d": "<b>Đúng.</b> Tester làm việc chặt chẽ với đại diện nghiệp vụ để đảm bảo đạt mức chất lượng mong muốn, bao gồm hỗ trợ và cộng tác giúp họ tạo các kiểm thử chấp nhận phù hợp."
    }
  },
  {
    "n": 9,
    "lo": "FL-2.1.2",
    "k": "K1",
    "ans": [
      "d"
    ],
    "stem": "Xét quy tắc sau: “với mỗi hoạt động trong SDLC đều có một hoạt động kiểm thử tương ứng”. Quy tắc này đúng trong những mô hình SDLC nào?",
    "opt": {
      "a": "Chỉ trong các mô hình phát triển tuần tự (sequential)",
      "b": "Chỉ trong các mô hình phát triển lặp (iterative)",
      "c": "Chỉ trong các mô hình phát triển lặp và tăng dần (iterative and incremental)",
      "d": "Trong các mô hình phát triển tuần tự, tăng dần và lặp"
    },
    "ex": {
      "a": "Sai.",
      "b": "Sai.",
      "c": "Sai.",
      "d": "<b>Đúng.</b> Đây là một trong các thực hành kiểm thử tốt, áp dụng cho mọi mô hình SDLC."
    }
  },
  {
    "n": 10,
    "lo": "FL-2.1.3",
    "k": "K1",
    "ans": [
      "c"
    ],
    "stem": "Phát biểu nào sau đây mô tả TỐT NHẤT cách tiếp cận <b>phát triển hướng kiểm thử chấp nhận</b> (ATDD)?",
    "opt": {
      "a": "Trong ATDD, tiêu chí chấp nhận thường được tạo theo định dạng given/when/then",
      "b": "Trong ATDD, ca kiểm thử chủ yếu được tạo ở mức kiểm thử thành phần và hướng mã nguồn",
      "c": "Trong ATDD, kiểm thử được tạo dựa trên tiêu chí chấp nhận để dẫn dắt việc phát triển phần mềm liên quan",
      "d": "Trong ATDD, kiểm thử dựa trên hành vi mong muốn của phần mềm, giúp các thành viên trong nhóm dễ hiểu hơn"
    },
    "ex": {
      "a": "Sai. Định dạng này thường được dùng trong phát triển hướng hành vi (BDD).",
      "b": "Sai. Đây là mô tả của phát triển hướng kiểm thử (TDD).",
      "c": "<b>Đúng.</b> Trong ATDD, kiểm thử được viết từ tiêu chí chấp nhận như một phần của quá trình thiết kế.",
      "d": "Sai. Đây là đặc điểm của BDD."
    }
  },
  {
    "n": 11,
    "lo": "FL-2.1.5",
    "k": "K2",
    "ans": [
      "d"
    ],
    "stem": "Phương án nào sau đây <b>KHÔNG</b> phải là ví dụ của cách tiếp cận <b>dịch chuyển sang trái</b> (shift-left)?",
    "opt": {
      "a": "Rà soát yêu cầu người dùng trước khi chúng được các bên liên quan chính thức chấp thuận",
      "b": "Viết kiểm thử thành phần trước khi viết code tương ứng",
      "c": "Thực thi kiểm thử hiệu năng (performance efficiency) cho một thành phần trong giai đoạn kiểm thử thành phần",
      "d": "Viết test script trước khi thiết lập quy trình quản lý cấu hình"
    },
    "ex": {
      "a": "Sai. Rà soát sớm là một ví dụ của shift-left.",
      "b": "Sai. TDD là một ví dụ của shift-left.",
      "c": "Sai. Kiểm thử phi chức năng sớm là một ví dụ của shift-left.",
      "d": "<b>Đúng.</b> Test script cần được đặt dưới sự quản lý cấu hình, vì vậy việc tạo test script trước khi thiết lập quy trình này là không hợp lý."
    }
  },
  {
    "n": 12,
    "lo": "FL-2.1.6",
    "k": "K2",
    "ans": [
      "c"
    ],
    "stem": "Bạn sẽ dùng lập luận nào dưới đây để thuyết phục quản lý tổ chức các buổi <b>họp cải tiến</b> (retrospective) vào cuối mỗi chu kỳ phát hành?",
    "opt": {
      "a": "Retrospective hiện đang rất phổ biến và khách hàng sẽ đánh giá cao nếu chúng ta bổ sung chúng vào quy trình",
      "b": "Tổ chức retrospective sẽ giúp tổ chức tiết kiệm chi phí, vì nếu không có chúng thì đại diện người dùng cuối sẽ không đưa ra phản hồi ngay về sản phẩm",
      "c": "Các điểm yếu của quy trình được xác định trong retrospective có thể được phân tích và dùng làm danh sách việc cần làm cho chương trình cải tiến quy trình liên tục của tổ chức",
      "d": "Retrospective đề cao năm giá trị, bao gồm sự dũng cảm và tôn trọng, vốn rất quan trọng để duy trì cải tiến liên tục trong tổ chức"
    },
    "ex": {
      "a": "Sai. Retrospective hữu ích hơn cho việc xác định cơ hội cải tiến và ít có ý nghĩa với khách hàng.",
      "b": "Sai. Retrospective không nhằm thu thập phản hồi về sản phẩm mà về quy trình. Hơn nữa, đây là hoạt động nội bộ của nhóm và không nên có đại diện người dùng cuối.",
      "c": "<b>Đúng.</b> Retrospective được tổ chức đều đặn, cùng với các hoạt động theo dõi phù hợp, là yếu tố then chốt cho việc cải tiến liên tục hoạt động phát triển và kiểm thử.",
      "d": "Sai. Dũng cảm và tôn trọng là các giá trị của Extreme Programming (XP) và không liên quan chặt chẽ đến retrospective."
    }
  },
  {
    "n": 13,
    "lo": "FL-2.2.1",
    "k": "K2",
    "ans": [
      "a"
    ],
    "stem": "Loại thất bại nào (1–4) phù hợp NHẤT với mức kiểm thử nào (A–D)?<ol class='plain'><li>1. Thất bại khi hành vi hệ thống sai lệch so với nhu cầu nghiệp vụ của người dùng</li><li>2. Thất bại trong giao tiếp giữa các thành phần</li><li>3. Thất bại trong logic của code</li><li>4. Thất bại do quy tắc nghiệp vụ (business rule) không được triển khai đúng</li></ol><ol class='plain'><li>A. Kiểm thử thành phần (component testing)</li><li>B. Kiểm thử tích hợp thành phần (component integration testing)</li><li>C. Kiểm thử hệ thống (system testing)</li><li>D. Kiểm thử chấp nhận (acceptance testing)</li></ol>",
    "opt": {
      "a": "1D, 2B, 3A, 4C",
      "b": "1D, 2B, 3C, 4A",
      "c": "1B, 2A, 3D, 4C",
      "d": "1C, 2B, 3A, 4D"
    },
    "pre": "<ul><li>Cơ sở kiểm thử của kiểm thử chấp nhận là nhu cầu nghiệp vụ của người dùng (1D)</li><li>Giao tiếp giữa các thành phần được kiểm thử trong kiểm thử tích hợp thành phần (2B)</li><li>Thất bại về logic có thể được tìm thấy trong kiểm thử thành phần (3A)</li><li>Quy tắc nghiệp vụ là cơ sở kiểm thử của kiểm thử hệ thống (4C)</li></ul>Vì vậy đáp án đúng là <b>a</b>.",
    "ex": {}
  },
  {
    "n": 14,
    "lo": "FL-2.2.3",
    "k": "K2",
    "ans": [
      "b"
    ],
    "stem": "Bạn đang kiểm thử một user story có ba tiêu chí chấp nhận: AC1, AC2 và AC3. AC1 được bao phủ bởi ca kiểm thử TC1, AC2 bởi TC2 và AC3 bởi TC3. Lịch sử thực thi gồm ba lần chạy trên ba phiên bản phần mềm liên tiếp như sau:<table class='t'><tr><th></th><th>Lần thực thi 1</th><th>Lần thực thi 2</th><th>Lần thực thi 3</th></tr><tr><td>TC1</td><td>(1) Failed</td><td>(4) Passed</td><td>(7) Passed</td></tr><tr><td>TC2</td><td>(2) Passed</td><td>(5) Failed</td><td>(8) Passed</td></tr><tr><td>TC3</td><td>(3) Failed</td><td>(6) Failed</td><td>(9) Passed</td></tr></table>Các kiểm thử được lặp lại khi bạn được thông báo rằng mọi khiếm khuyết tìm thấy trong lần chạy trước đã được sửa và có phiên bản phần mềm mới.<br><br>Những kiểm thử nào ở trên được thực thi như <b>kiểm thử hồi quy</b> (regression test)?",
    "opt": {
      "a": "Chỉ 4, 7, 8, 9",
      "b": "Chỉ 5, 7",
      "c": "Chỉ 4, 6, 8, 9",
      "d": "Chỉ 5, 6"
    },
    "pre": "Vì TC1 và TC3 thất bại ở Lần thực thi 1 (kiểm thử (1) và (3)), nên kiểm thử (4) và (6) là <b>kiểm thử xác nhận</b> (confirmation test).<br>Vì TC2 và TC3 thất bại ở Lần thực thi 2 (kiểm thử (5) và (6)), nên kiểm thử (8) và (9) cũng là kiểm thử xác nhận.<br>TC2 đã pass ở Lần thực thi 1 (kiểm thử (2)), nên kiểm thử (5) là <b>kiểm thử hồi quy</b>.<br>TC1 đã pass ở Lần thực thi 2 (kiểm thử (4)), nên kiểm thử (7) cũng là kiểm thử hồi quy.<br><br>Vì vậy đáp án đúng là <b>b</b>.",
    "ex": {}
  },
  {
    "n": 15,
    "lo": "FL-3.1.2",
    "k": "K2",
    "ans": [
      "a"
    ],
    "stem": "Phương án nào sau đây <b>KHÔNG</b> phải là lợi ích của <b>kiểm thử tĩnh</b> (static testing)?",
    "opt": {
      "a": "Quản lý khiếm khuyết ít tốn kém hơn nhờ dễ dàng phát hiện khiếm khuyết ở giai đoạn sau của SDLC",
      "b": "Sửa các khiếm khuyết tìm thấy trong kiểm thử tĩnh thường ít tốn kém hơn nhiều so với sửa khiếm khuyết tìm thấy trong kiểm thử động",
      "c": "Tìm ra các khiếm khuyết về code mà có thể sẽ không được phát hiện nếu chỉ thực hiện kiểm thử động",
      "d": "Phát hiện các lỗ hổng và sự không nhất quán trong yêu cầu"
    },
    "ex": {
      "a": "<b>Đúng.</b> Quản lý khiếm khuyết không hề rẻ hơn. Tìm và sửa khiếm khuyết ở giai đoạn sau của SDLC tốn kém hơn.",
      "b": "Sai. Đây là một lợi ích của kiểm thử tĩnh.",
      "c": "Sai. Đây là một lợi ích của kiểm thử tĩnh.",
      "d": "Sai. Đây là một lợi ích của kiểm thử tĩnh."
    }
  },
  {
    "n": 16,
    "lo": "FL-3.2.1",
    "k": "K1",
    "ans": [
      "d"
    ],
    "stem": "Đâu là lợi ích của <b>phản hồi sớm và thường xuyên</b> (early and frequent feedback)?",
    "opt": {
      "a": "Nó cải tiến quy trình kiểm thử cho các dự án tương lai",
      "b": "Nó buộc khách hàng phải sắp xếp độ ưu tiên yêu cầu dựa trên các rủi ro đã thống nhất",
      "c": "Nó cung cấp thước đo cho chất lượng của các thay đổi",
      "d": "Nó giúp tránh hiểu sai yêu cầu"
    },
    "ex": {
      "a": "Sai. Phản hồi có thể cải tiến quy trình kiểm thử, nhưng nếu chỉ muốn cải tiến cho các dự án tương lai thì phản hồi không cần phải sớm hay thường xuyên.",
      "b": "Sai. Phản hồi không được dùng để sắp xếp độ ưu tiên yêu cầu.",
      "c": "Sai. Không có cách đo chất lượng thay đổi nào được khuyến nghị duy nhất; đây cũng không phải là lợi ích được nêu trong mục 3.2.1 của syllabus.",
      "d": "<b>Đúng.</b> Phản hồi sớm và thường xuyên có thể ngăn ngừa hiểu lầm về yêu cầu."
    }
  },
  {
    "n": 17,
    "lo": "FL-3.2.4",
    "k": "K2",
    "ans": [
      "b"
    ],
    "stem": "Các buổi rà soát (review) trong tổ chức của bạn có những đặc điểm sau:<ul><li>Có vai trò thư ký (scribe)</li><li>Mục đích chính là đánh giá chất lượng</li><li>Cuộc họp do tác giả của sản phẩm công việc chủ trì</li><li>Có chuẩn bị cá nhân (individual preparation)</li><li>Có lập báo cáo rà soát</li></ul>Loại rà soát nào CÓ KHẢ NĂNG NHẤT đang được sử dụng?",
    "opt": {
      "a": "Rà soát không chính thức (informal review)",
      "b": "Duyệt qua (walkthrough)",
      "c": "Rà soát kỹ thuật (technical review)",
      "d": "Thanh tra (inspection)"
    },
    "pre": "Xét từng đặc điểm:<ul><li>Vai trò thư ký được quy định cho walkthrough, technical review và inspection; do đó không thể là rà soát không chính thức.</li><li>Đánh giá chất lượng là một trong những mục tiêu quan trọng nhất của walkthrough.</li><li>Tác giả chủ trì cuộc họp: điều này không được phép trong inspection và thường không áp dụng trong technical review (cần người điều phối – moderator); nhưng là đặc trưng của walkthrough.</li><li>Mọi loại rà soát đều có thể có chuẩn bị cá nhân (kể cả rà soát không chính thức).</li><li>Mọi loại rà soát đều có thể lập báo cáo rà soát, mặc dù rà soát không chính thức không bắt buộc tài liệu.</li></ul>Vì vậy đáp án đúng là <b>b</b>.",
    "ex": {}
  },
  {
    "n": 18,
    "lo": "FL-3.2.5",
    "k": "K1",
    "ans": [
      "d"
    ],
    "stem": "Phát biểu nào sau đây <b>KHÔNG</b> phải là yếu tố góp phần làm rà soát thành công?",
    "opt": {
      "a": "Người tham gia nên dành đủ thời gian cho việc rà soát",
      "b": "Chia nhỏ các sản phẩm công việc lớn thành các phần nhỏ để giảm cường độ nỗ lực cần thiết",
      "c": "Người tham gia nên tránh các hành vi có thể thể hiện sự chán nản, bực bội hoặc thù địch với người khác",
      "d": "Các thất bại (failure) được tìm thấy cần được ghi nhận, đánh giá cao và xử lý một cách khách quan"
    },
    "ex": {
      "a": "Sai. Dành đủ thời gian cho từng cá nhân là một yếu tố thành công.",
      "b": "Sai. Chia sản phẩm công việc thành các phần nhỏ phù hợp là một yếu tố thành công.",
      "c": "Sai. Tránh các hành vi thể hiện sự chán nản, bực bội… là một yếu tố thành công.",
      "d": "<b>Đúng.</b> Trong rà soát, người ta tìm ra <i>khiếm khuyết</i> (defect), không phải <i>thất bại</i> (failure)."
    }
  },
  {
    "n": 19,
    "lo": "FL-4.1.1",
    "k": "K2",
    "ans": [
      "c"
    ],
    "stem": "Đâu là đặc điểm của các <b>kỹ thuật kiểm thử dựa trên kinh nghiệm</b> (experience-based test techniques)?",
    "opt": {
      "a": "Ca kiểm thử được tạo dựa trên thông tin thiết kế chi tiết",
      "b": "Các mục được kiểm thử trong phần code giao diện được dùng để đo độ bao phủ",
      "c": "Các kỹ thuật kiểm thử phụ thuộc nhiều vào kiến thức của tester về phần mềm và lĩnh vực nghiệp vụ",
      "d": "Các ca kiểm thử được dùng để xác định sự sai lệch so với yêu cầu"
    },
    "ex": {
      "a": "Sai. Đây là đặc điểm chung của kỹ thuật kiểm thử hộp trắng: điều kiện kiểm thử, ca kiểm thử và dữ liệu kiểm thử được tạo từ cơ sở kiểm thử có thể gồm code, kiến trúc phần mềm, thiết kế chi tiết hoặc thông tin khác về cấu trúc phần mềm.",
      "b": "Sai. Đây là đặc điểm chung của kỹ thuật kiểm thử hộp trắng: độ bao phủ được đo dựa trên các mục đã kiểm thử trong một cấu trúc được chọn.",
      "c": "<b>Đúng.</b> Đây là đặc điểm chung của kỹ thuật dựa trên kinh nghiệm. Kiến thức và kinh nghiệm (cách sử dụng phần mềm dự kiến, môi trường, các khiếm khuyết có thể có và sự phân bố của chúng) được dùng để xác định kiểm thử.",
      "d": "Sai. Đây là đặc điểm chung của kỹ thuật kiểm thử hộp đen: ca kiểm thử có thể dùng để phát hiện lỗ hổng giữa yêu cầu và việc triển khai yêu cầu, cũng như sai lệch so với yêu cầu."
    }
  },
  {
    "n": 20,
    "lo": "FL-4.2.1",
    "k": "K3",
    "ans": [
      "b"
    ],
    "stem": "Bạn đang kiểm thử một form tìm kiếm căn hộ đơn giản chỉ có hai tiêu chí tìm kiếm:<ul><li>tầng (ba lựa chọn: tầng trệt; tầng một; tầng hai trở lên)</li><li>loại vườn (ba lựa chọn: không có vườn; vườn nhỏ; vườn lớn)</li></ul>Mọi căn hộ ở tầng trệt đều có vườn, các căn hộ ở tầng cao hơn thì không. Form có cơ chế kiểm tra hợp lệ không cho phép sử dụng tiêu chí tìm kiếm vi phạm quy tắc này.<br><br>Mỗi kiểm thử có hai giá trị đầu vào: tầng và loại vườn. Bạn muốn áp dụng <b>phân vùng tương đương</b> (EP) để bao phủ từng tầng và từng loại vườn trong các kiểm thử.<br><br>Số ca kiểm thử TỐI THIỂU để đạt 100% độ bao phủ EP cho các phân vùng hợp lệ là bao nhiêu?",
    "opt": {
      "a": "3",
      "b": "4",
      "c": "5",
      "d": "6"
    },
    "pre": "Tình huống này được syllabus mô tả là độ bao phủ “each choice” (mỗi lựa chọn).<br>“Vườn nhỏ” và “vườn lớn” chỉ đi được với “tầng trệt”, nên cần hai ca kiểm thử với “tầng trệt” để bao phủ hai phân vùng loại vườn này. Cần thêm hai ca kiểm thử nữa để bao phủ hai phân vùng “tầng” còn lại; phân vùng “không có vườn” được bao phủ bởi chính các ca này. Tổng cộng 4 ca kiểm thử:<ul><li>TC1 (tầng trệt, vườn nhỏ)</li><li>TC2 (tầng trệt, vườn lớn)</li><li>TC3 (tầng một, không có vườn)</li><li>TC4 (tầng hai trở lên, không có vườn)</li></ul>Vì vậy đáp án đúng là <b>b</b>.",
    "ex": {}
  },
  {
    "n": 21,
    "lo": "FL-4.2.2",
    "k": "K3",
    "ans": [
      "a"
    ],
    "stem": "Bạn đang kiểm thử một hệ thống tính điểm tổng kết môn học cho sinh viên.<br><br>Xếp loại cuối cùng dựa trên điểm tổng kết theo các quy tắc sau:<ul><li>0 – 50 điểm: trượt (failed)</li><li>51 – 60 điểm: trung bình (fair)</li><li>61 – 70 điểm: khá (satisfactory)</li><li>71 – 80 điểm: tốt (good)</li><li>81 – 90 điểm: rất tốt (very good)</li><li>91 – 100 điểm: xuất sắc (excellent)</li></ul>Bạn đã chuẩn bị các ca kiểm thử sau:<table class='t'><tr><th></th><th>Điểm tổng kết</th><th>Xếp loại</th></tr><tr><td>TC1</td><td>91</td><td>excellent</td></tr><tr><td>TC2</td><td>50</td><td>failed</td></tr><tr><td>TC3</td><td>81</td><td>very good</td></tr><tr><td>TC4</td><td>60</td><td>fair</td></tr><tr><td>TC5</td><td>70</td><td>satisfactory</td></tr><tr><td>TC6</td><td>80</td><td>good</td></tr></table>Độ bao phủ <b>phân tích giá trị biên 2 giá trị</b> (2-value BVA) cho điểm tổng kết mà các ca kiểm thử hiện có đạt được là bao nhiêu?",
    "opt": {
      "a": "50%",
      "b": "60%",
      "c": "33.3%",
      "d": "100%"
    },
    "pre": "Có 12 giá trị biên cho điểm tổng kết: 0, 50, 51, 60, 61, 70, 71, 80, 81, 90, 91 và 100.<br>Các ca kiểm thử bao phủ 6 giá trị trong số đó (TC1 – 91, TC2 – 50, TC3 – 81, TC4 – 60, TC5 – 70, TC6 – 80).<br>Do đó độ bao phủ = 6/12 = <b>50%</b>.<br><br>Vì vậy đáp án đúng là <b>a</b>.",
    "ex": {}
  },
  {
    "n": 22,
    "lo": "FL-4.2.3",
    "k": "K3",
    "ans": [
      "d"
    ],
    "stem": "Cửa hàng cho thuê xe đạp theo ngày mà bạn yêu thích vừa đưa vào sử dụng hệ thống Quản lý Quan hệ Khách hàng (CRM) mới và nhờ bạn – một trong những hội viên trung thành nhất – kiểm thử nó.<br><br>Các tính năng đã được triển khai như sau:<ul><li>Ai cũng có thể thuê xe đạp, nhưng hội viên được giảm giá 20%</li><li>Tuy nhiên, nếu trả xe trễ hạn thì không còn được giảm giá</li><li>Sau 15 lần thuê, hội viên được tặng một món quà: áo phông (T-Shirt)</li></ul>Bảng quyết định (decision table) mô tả các tính năng đã triển khai như sau:<table class='t dt'><tr><th>Điều kiện</th><th>R1</th><th>R2</th><th>R3</th><th>R4</th><th>R5</th><th>R6</th><th>R7</th><th>R8</th></tr><tr><td>Là hội viên</td><td>T</td><td>T</td><td>T</td><td>T</td><td>F</td><td>F</td><td>F</td><td>F</td></tr><tr><td>Trễ hạn trả xe</td><td>T</td><td>F</td><td>T</td><td>F</td><td>T</td><td>F</td><td>F</td><td>T</td></tr><tr><td>Lần thuê thứ 15</td><td>F</td><td>F</td><td>T</td><td>T</td><td>F</td><td>F</td><td>T</td><td>T</td></tr><tr><th>Hành động</th><th></th><th></th><th></th><th></th><th></th><th></th><th></th><th></th></tr><tr><td>Giảm giá 20%</td><td></td><td>X</td><td></td><td>X</td><td></td><td></td><td></td><td></td></tr><tr><td>Tặng áo phông</td><td></td><td></td><td>X</td><td>X</td><td></td><td></td><td></td><td>X</td></tr></table>CHỈ dựa trên mô tả tính năng của hệ thống CRM, quy tắc nào ở trên mô tả một tình huống không thể xảy ra?",
    "opt": {
      "a": "R4",
      "b": "R2",
      "c": "R6",
      "d": "R8"
    },
    "ex": {
      "a": "Sai. Một hội viên không trễ hạn có thể được giảm giá và được tặng áo phông sau 15 lần thuê xe.",
      "b": "Sai. Một hội viên không trễ hạn có thể được giảm giá nhưng chưa được tặng áo phông cho đến khi thuê đủ 15 lần.",
      "c": "Sai. Người không phải hội viên không được giảm giá, kể cả khi họ chưa trễ hạn.",
      "d": "<b>Đúng.</b> Người không phải hội viên và đã trễ hạn thì không được giảm giá – điều này đúng, nhưng chỉ hội viên mới được tặng áo phông. Vì vậy hành động “tặng áo phông” ở R8 là không đúng."
    }
  },
  {
    "n": 23,
    "lo": "FL-4.2.4",
    "k": "K3",
    "ans": [
      "d"
    ],
    "img": "std",
    "stem": "Bạn kiểm thử một hệ thống có vòng đời được mô hình hóa bằng <b>sơ đồ chuyển đổi trạng thái</b> (state transition diagram) bên dưới. Hệ thống bắt đầu ở trạng thái INIT và kết thúc hoạt động ở trạng thái OFF.<br>[[STD]]Số ca kiểm thử TỐI THIỂU để đạt <b>độ bao phủ các chuyển đổi hợp lệ</b> (valid transitions coverage) là bao nhiêu?",
    "opt": {
      "a": "4",
      "b": "2",
      "c": "7",
      "d": "3"
    },
    "pre": "Hai chuyển đổi “test” và “error” không thể cùng xuất hiện trong một ca kiểm thử. Hai chuyển đổi “done” cũng vậy.<br>Điều này có nghĩa cần ít nhất ba ca kiểm thử để đạt độ bao phủ chuyển đổi. Ví dụ:<ul><li>TC1: test, done</li><li>TC2: run, error, done</li><li>TC3: run, pause, resume, pause, done</li></ul>Vì vậy đáp án đúng là <b>d</b>.",
    "ex": {}
  },
  {
    "n": 24,
    "lo": "FL-4.3.1",
    "k": "K2",
    "ans": [
      "a"
    ],
    "stem": "Bộ kiểm thử của bạn đã đạt 100% <b>độ bao phủ câu lệnh</b> (statement coverage). Hệ quả của điều này là gì?",
    "opt": {
      "a": "Mỗi câu lệnh trong code có chứa khiếm khuyết đều đã được thực thi ít nhất một lần",
      "b": "Bất kỳ bộ kiểm thử nào có nhiều ca kiểm thử hơn bộ kiểm thử của bạn cũng sẽ đạt 100% độ bao phủ câu lệnh",
      "c": "Mỗi đường đi (path) trong code đã được thực thi ít nhất một lần",
      "d": "Mọi tổ hợp giá trị đầu vào đã được kiểm thử ít nhất một lần"
    },
    "ex": {
      "a": "<b>Đúng.</b> Vì đạt 100% độ bao phủ câu lệnh, mọi câu lệnh – kể cả những câu lệnh chứa khiếm khuyết – chắc chắn đã được thực thi và đánh giá ít nhất một lần.",
      "b": "Sai. Độ bao phủ phụ thuộc vào cái gì được kiểm thử, không phụ thuộc số lượng ca kiểm thử. Ví dụ với code “if (x==0) y=1”, một ca kiểm thử (x=0) đạt 100% độ bao phủ câu lệnh, nhưng hai ca (x=1) và (x=2) cộng lại chỉ đạt 50%.",
      "c": "Sai. Nếu code có vòng lặp thì số đường đi có thể là vô hạn, nên không thể thực thi hết mọi đường đi.",
      "d": "Sai. Kiểm thử toàn diện là không thể (xem bảy nguyên tắc kiểm thử). Ví dụ với code “input x; print x”, một kiểm thử bất kỳ với x tùy ý đã đạt 100% độ bao phủ câu lệnh nhưng chỉ bao phủ một giá trị đầu vào."
    }
  },
  {
    "n": 25,
    "lo": "FL-4.3.3",
    "k": "K2",
    "ans": [
      "d"
    ],
    "stem": "Điều nào sau đây <b>KHÔNG</b> đúng với <b>kiểm thử hộp trắng</b> (white-box testing)?",
    "opt": {
      "a": "Trong kiểm thử hộp trắng, toàn bộ phần triển khai phần mềm được xem xét",
      "b": "Các chỉ số độ bao phủ hộp trắng có thể giúp xác định thêm kiểm thử để tăng độ bao phủ code",
      "c": "Các kỹ thuật kiểm thử hộp trắng có thể được dùng trong kiểm thử tĩnh",
      "d": "Kiểm thử hộp trắng có thể giúp xác định những lỗ hổng trong việc triển khai yêu cầu"
    },
    "ex": {
      "a": "Sai. Điểm mạnh cơ bản của kỹ thuật hộp trắng là toàn bộ phần triển khai phần mềm được tính đến khi kiểm thử.",
      "b": "Sai. Các thước đo độ bao phủ hộp trắng cung cấp thước đo khách quan và thông tin cần thiết để tạo thêm kiểm thử nhằm tăng độ bao phủ.",
      "c": "Sai. Kỹ thuật hộp trắng có thể được dùng khi thực hiện rà soát (kiểm thử tĩnh).",
      "d": "<b>Đúng.</b> Đây là điểm yếu của kỹ thuật hộp trắng: chúng không thể phát hiện phần triển khai bị thiếu, vì chỉ dựa trên cấu trúc của đối tượng kiểm thử chứ không dựa trên đặc tả yêu cầu."
    }
  },
  {
    "n": 26,
    "lo": "FL-4.4.1",
    "k": "K2",
    "ans": [
      "a"
    ],
    "stem": "Phương án nào sau đây mô tả TỐT NHẤT khái niệm đằng sau kỹ thuật <b>đoán lỗi</b> (error guessing)?",
    "opt": {
      "a": "Đoán lỗi là sử dụng kiến thức và kinh nghiệm của bạn về các khiếm khuyết đã gặp trong quá khứ và những lỗi điển hình mà developer hay mắc phải",
      "b": "Đoán lỗi là sử dụng kinh nghiệm cá nhân của bạn về phát triển phần mềm và những lỗi bạn từng mắc phải khi còn là developer",
      "c": "Đoán lỗi yêu cầu bạn tưởng tượng mình là người dùng của đối tượng kiểm thử và đoán những lỗi người dùng có thể mắc phải khi tương tác với nó",
      "d": "Đoán lỗi yêu cầu bạn nhanh chóng lặp lại công việc phát triển để xác định các loại lỗi mà developer có thể mắc phải"
    },
    "ex": {
      "a": "<b>Đúng.</b> Ý tưởng cơ bản của đoán lỗi là tester cố đoán những lỗi (error) developer có thể đã mắc phải và những khiếm khuyết có thể tồn tại trong đối tượng kiểm thử, dựa trên kinh nghiệm quá khứ (và đôi khi dựa trên danh sách kiểm tra).",
      "b": "Sai. Tester từng là developer có thể dùng kinh nghiệm cá nhân khi đoán lỗi, nhưng kỹ thuật này không dựa trên kiến thức phát triển trước đó.",
      "c": "Sai. Đoán lỗi không phải là kỹ thuật kiểm thử khả năng sử dụng để đoán cách người dùng thao tác sai với đối tượng kiểm thử.",
      "d": "Sai. Lặp lại công việc phát triển có nhiều nhược điểm khiến nó không thực tế (tester phải có kỹ năng tương đương developer, tốn thời gian phát triển…). Đó không phải là đoán lỗi."
    }
  },
  {
    "n": 27,
    "lo": "FL-4.4.2",
    "k": "K2",
    "ans": [
      "c"
    ],
    "stem": "Trong dự án của bạn, việc phát hành một ứng dụng hoàn toàn mới bị chậm trễ và việc thực thi kiểm thử bắt đầu muộn, nhưng bạn có kiến thức nghiệp vụ rất chi tiết và kỹ năng phân tích tốt. Danh sách yêu cầu đầy đủ chưa được chia sẻ với nhóm, nhưng ban quản lý đang yêu cầu trình bày một số kết quả kiểm thử.<br><br>Kỹ thuật kiểm thử nào phù hợp NHẤT trong tình huống này?",
    "opt": {
      "a": "Kiểm thử dựa trên danh sách kiểm tra (checklist-based testing)",
      "b": "Đoán lỗi (error guessing)",
      "c": "Kiểm thử thăm dò (exploratory testing)",
      "d": "Kiểm thử nhánh (branch testing)"
    },
    "ex": {
      "a": "Sai. Đây là sản phẩm mới. Có lẽ bạn chưa có danh sách kiểm tra, và các điều kiện kiểm thử có thể chưa được biết vì thiếu yêu cầu.",
      "b": "Sai. Đây là sản phẩm mới. Có lẽ bạn chưa có đủ thông tin để đoán lỗi chính xác.",
      "c": "<b>Đúng.</b> Kiểm thử thăm dò hữu ích nhất khi có ít đặc tả và/hoặc thời gian kiểm thử gấp rút.",
      "d": "Sai. Kiểm thử nhánh tốn thời gian, trong khi ban quản lý đang cần kết quả ngay. Ngoài ra, kiểm thử nhánh không cần đến kiến thức nghiệp vụ."
    }
  },
  {
    "n": 28,
    "lo": "FL-4.5.2",
    "k": "K2",
    "ans": [
      "b"
    ],
    "stem": "Phương án nào sau đây mô tả TỐT NHẤT cách có thể viết tài liệu cho <b>tiêu chí chấp nhận</b> (acceptance criteria)?",
    "opt": {
      "a": "Tổ chức các buổi retrospective để xác định nhu cầu thực tế của các bên liên quan đối với một user story",
      "b": "Sử dụng định dạng given/when/then để mô tả một điều kiện kiểm thử mẫu liên quan đến một user story",
      "c": "Sử dụng giao tiếp bằng lời để giảm rủi ro người khác hiểu sai tiêu chí chấp nhận",
      "d": "Ghi lại các rủi ro liên quan đến một user story trong kế hoạch kiểm thử để hỗ trợ kiểm thử dựa trên rủi ro cho user story đó"
    },
    "ex": {
      "a": "Sai. Retrospective dùng để rút ra bài học kinh nghiệm và cải tiến quy trình phát triển, kiểm thử – không phải để viết tiêu chí chấp nhận.",
      "b": "<b>Đúng.</b> Đây là cách tiêu chuẩn để viết tiêu chí chấp nhận.",
      "c": "Sai. Giao tiếp bằng lời không cho phép ghi lại tiêu chí chấp nhận một cách vật lý như một phần của user story (khía cạnh “Card” trong mô hình 3C).",
      "d": "Sai. Tiêu chí chấp nhận gắn với user story, không phải kế hoạch kiểm thử. Hơn nữa, tiêu chí chấp nhận là các điều kiện phải thỏa mãn để quyết định user story đã hoàn thành; rủi ro không phải là các điều kiện như vậy."
    }
  },
  {
    "n": 29,
    "lo": "FL-4.5.3",
    "k": "K3",
    "ans": [
      "a"
    ],
    "stem": "Xét user story sau:<div class='quote'>Là một Biên tập viên (Editor)<br>Tôi muốn rà soát nội dung trước khi xuất bản<br>để tôi có thể đảm bảo ngữ pháp chính xác</div>và các tiêu chí chấp nhận của nó:<ul><li>Người dùng có thể đăng nhập vào hệ thống quản lý nội dung với vai trò \"Editor\"</li><li>Biên tập viên có thể xem các trang nội dung hiện có</li><li>Biên tập viên có thể chỉnh sửa nội dung trang</li><li>Biên tập viên có thể thêm bình luận đánh dấu (markup comment)</li><li>Biên tập viên có thể lưu thay đổi</li><li>Biên tập viên có thể chuyển giao cho vai trò \"content owner\" để cập nhật</li></ul>Phương án nào sau đây là ví dụ TỐT NHẤT về một <b>kiểm thử ATDD</b> cho user story này?",
    "opt": {
      "a": "Kiểm thử xem biên tập viên có thể lưu tài liệu sau khi chỉnh sửa nội dung trang hay không",
      "b": "Kiểm thử xem content owner có thể đăng nhập và cập nhật nội dung hay không",
      "c": "Kiểm thử xem biên tập viên có thể lên lịch xuất bản nội dung đã chỉnh sửa hay không",
      "d": "Kiểm thử xem biên tập viên có thể chuyển giao cho một biên tập viên khác để cập nhật hay không"
    },
    "ex": {
      "a": "<b>Đúng.</b> Kiểm thử này bao phủ hai tiêu chí chấp nhận: một về chỉnh sửa nội dung và một về lưu thay đổi.",
      "b": "Sai. Tiêu chí chấp nhận bao phủ các hoạt động của biên tập viên, không phải của content owner.",
      "c": "Sai. Lên lịch xuất bản có thể là một tính năng hay, nhưng không nằm trong tiêu chí chấp nhận.",
      "d": "Sai. Tiêu chí chấp nhận nói về việc chuyển giao từ biên tập viên sang content owner, không phải sang biên tập viên khác."
    }
  },
  {
    "n": 30,
    "lo": "FL-5.1.2",
    "k": "K1",
    "ans": [
      "c"
    ],
    "stem": "Tester mang lại giá trị như thế nào cho <b>lập kế hoạch vòng lặp và lập kế hoạch phát hành</b> (iteration and release planning)?",
    "opt": {
      "a": "Tester xác định độ ưu tiên của các user story sẽ được phát triển",
      "b": "Tester chỉ tập trung vào các khía cạnh chức năng của hệ thống cần kiểm thử",
      "c": "Tester tham gia vào việc nhận diện rủi ro và đánh giá rủi ro chi tiết của các user story",
      "d": "Tester đảm bảo phát hành phần mềm chất lượng cao thông qua thiết kế kiểm thử sớm trong quá trình lập kế hoạch phát hành"
    },
    "ex": {
      "a": "Sai. Độ ưu tiên của user story do đại diện nghiệp vụ cùng nhóm phát triển quyết định.",
      "b": "Sai. Tester tập trung vào cả khía cạnh chức năng và phi chức năng của hệ thống.",
      "c": "<b>Đúng.</b> Theo syllabus, đây là một trong những cách tester mang lại giá trị cho lập kế hoạch vòng lặp và phát hành.",
      "d": "Sai. Thiết kế kiểm thử sớm không phải là một phần của lập kế hoạch phát hành, và cũng không tự động đảm bảo phát hành phần mềm chất lượng."
    }
  },
  {
    "n": 31,
    "lo": "FL-5.1.3",
    "k": "K2",
    "ans": [
      "c",
      "e"
    ],
    "stem": "<b>HAI</b> phương án nào sau đây là <b>tiêu chí đầu ra</b> (exit criteria) cho việc kiểm thử một hệ thống?",
    "opt": {
      "a": "Môi trường kiểm thử đã sẵn sàng",
      "b": "Tester có thể đăng nhập vào đối tượng kiểm thử",
      "c": "Đạt được mật độ khiếm khuyết (defect density) ước tính",
      "d": "Các yêu cầu đã được chuyển sang định dạng given/when/then",
      "e": "Các kiểm thử hồi quy đã được tự động hóa"
    },
    "ex": {
      "a": "Sai. Sự sẵn sàng của môi trường kiểm thử là tiêu chí về tính sẵn có của nguồn lực, nên thuộc tiêu chí đầu vào (entry criteria).",
      "b": "Sai. Đây là tiêu chí về tính sẵn có của nguồn lực, nên thuộc tiêu chí đầu vào.",
      "c": "<b>Đúng.</b> Mật độ khiếm khuyết ước tính là thước đo mức độ kỹ lưỡng (diligence), nên thuộc tiêu chí đầu ra.",
      "d": "Sai. Yêu cầu được chuyển sang một định dạng nhất định tạo ra các yêu cầu có thể kiểm thử được, nên thuộc tiêu chí đầu vào.",
      "e": "<b>Đúng.</b> Tự động hóa kiểm thử hồi quy là một tiêu chí hoàn thành (completion criterion), nên thuộc tiêu chí đầu ra."
    }
  },
  {
    "n": 32,
    "lo": "FL-5.1.4",
    "k": "K3",
    "ans": [
      "d"
    ],
    "stem": "Nhóm của bạn sử dụng kỹ thuật <b>ước lượng ba điểm</b> (three-point estimation) để ước lượng nỗ lực kiểm thử cho một tính năng mới có rủi ro cao. Các ước lượng như sau:<ul><li>Ước lượng lạc quan nhất: 2 giờ công</li><li>Ước lượng khả dĩ nhất: 11 giờ công</li><li>Ước lượng bi quan nhất: 14 giờ công</li></ul>Ước lượng cuối cùng là bao nhiêu?",
    "opt": {
      "a": "9 giờ công",
      "b": "14 giờ công",
      "c": "11 giờ công",
      "d": "10 giờ công"
    },
    "pre": "Trong kỹ thuật ước lượng ba điểm:<div class='quote'>E = (lạc quan + 4 × khả dĩ nhất + bi quan) / 6<br>E = (2 + 4×11 + 14) / 6 = 60 / 6 = <b>10</b></div>Vì vậy đáp án đúng là <b>d</b>.",
    "ex": {}
  },
  {
    "n": 33,
    "lo": "FL-5.1.5",
    "k": "K3",
    "ans": [
      "a"
    ],
    "stem": "Bạn đang kiểm thử một ứng dụng di động cho phép người dùng tìm nhà hàng gần đó theo loại món ăn họ muốn. Xét danh sách các ca kiểm thử, độ ưu tiên (số càng nhỏ thì ưu tiên càng cao) và các phụ thuộc sau:<table class='t'><tr><th>Mã ca kiểm thử</th><th>Điều kiện kiểm thử được bao phủ</th><th>Độ ưu tiên</th><th>Phụ thuộc logic</th></tr><tr><td>TC 001</td><td>Chọn loại món ăn</td><td>3</td><td>không có</td></tr><tr><td>TC 002</td><td>Chọn nhà hàng</td><td>2</td><td>TC 001</td></tr><tr><td>TC 003</td><td>Xem chỉ đường</td><td>1</td><td>TC 002</td></tr><tr><td>TC 004</td><td>Gọi điện cho nhà hàng</td><td>2</td><td>TC 002</td></tr><tr><td>TC 005</td><td>Đặt bàn</td><td>3</td><td>TC 002</td></tr></table>Ca kiểm thử nào nên được thực thi <b>thứ ba</b>?",
    "opt": {
      "a": "TC 003",
      "b": "TC 005",
      "c": "TC 002",
      "d": "TC 001"
    },
    "pre": "TC 001 phải chạy đầu tiên, tiếp theo là TC 002 để thỏa mãn các phụ thuộc. Sau đó là TC 003 (theo độ ưu tiên), rồi TC 004, cuối cùng là TC 005.<br><br>Vì vậy đáp án đúng là <b>a</b>.",
    "ex": {}
  },
  {
    "n": 34,
    "lo": "FL-5.1.7",
    "k": "K2",
    "ans": [
      "a"
    ],
    "stem": "Xét các loại kiểm thử (1–4) và các <b>góc phần tư kiểm thử Agile</b> (agile testing quadrants) (A–D) sau:<ol class='plain'><li>1. Kiểm thử khả năng sử dụng (usability testing)</li><li>2. Kiểm thử thành phần (component testing)</li><li>3. Kiểm thử chức năng (functional testing)</li><li>4. Kiểm thử độ tin cậy (reliability testing)</li></ol><ol class='plain'><li>A. Góc phần tư Q1: hướng công nghệ, hỗ trợ nhóm phát triển</li><li>B. Góc phần tư Q2: hướng nghiệp vụ, hỗ trợ nhóm phát triển</li><li>C. Góc phần tư Q3: hướng nghiệp vụ, đánh giá (phê bình) sản phẩm</li><li>D. Góc phần tư Q4: hướng công nghệ, đánh giá (phê bình) sản phẩm</li></ol>Các loại kiểm thử trên được ánh xạ vào các góc phần tư kiểm thử Agile như thế nào?",
    "opt": {
      "a": "1C, 2A, 3B, 4D",
      "b": "1D, 2A, 3C, 4B",
      "c": "1C, 2B, 3D, 4A",
      "d": "1D, 2B, 3C, 4A"
    },
    "pre": "<ul><li>Kiểm thử khả năng sử dụng thuộc Q3 (1 – C)</li><li>Kiểm thử thành phần thuộc Q1 (2 – A)</li><li>Kiểm thử chức năng thuộc Q2 (3 – B)</li><li>Kiểm thử độ tin cậy thuộc Q4 (4 – D)</li></ul>Vì vậy đáp án đúng là <b>a</b>.",
    "ex": {}
  },
  {
    "n": 35,
    "lo": "FL-5.2.4",
    "k": "K2",
    "ans": [
      "c"
    ],
    "stem": "Trong quá trình phân tích rủi ro, rủi ro sau đã được nhận diện và đánh giá:<ul><li>Rủi ro: Thời gian phản hồi khi tạo báo cáo quá lâu</li><li>Khả năng xảy ra rủi ro: trung bình; tác động của rủi ro: cao</li><li>Ứng phó rủi ro:<ul><li>Một nhóm kiểm thử độc lập thực hiện kiểm thử hiệu năng (performance efficiency) trong giai đoạn kiểm thử hệ thống</li><li>Một nhóm người dùng cuối được chọn thực hiện kiểm thử alpha và beta trước khi phát hành</li></ul></li></ul>Biện pháp nào được đề xuất để ứng phó với rủi ro đã phân tích này?",
    "opt": {
      "a": "Chấp nhận rủi ro (risk acceptance)",
      "b": "Kế hoạch dự phòng (contingency plan)",
      "c": "Giảm thiểu rủi ro (risk mitigation)",
      "d": "Chuyển giao rủi ro (risk transfer)"
    },
    "ex": {
      "a": "Sai. Chúng ta không chấp nhận rủi ro; các hành động cụ thể đã được đề xuất.",
      "b": "Sai. Không có kế hoạch dự phòng nào được đề xuất.",
      "c": "<b>Đúng.</b> Các hành động được đề xuất đều liên quan đến kiểm thử – đây là một hình thức giảm thiểu rủi ro.",
      "d": "Sai. Rủi ro không được chuyển giao mà được giảm thiểu."
    }
  },
  {
    "n": 36,
    "lo": "FL-5.3.3",
    "k": "K2",
    "ans": [
      "d"
    ],
    "stem": "Sản phẩm công việc nào có thể được nhóm Agile sử dụng để thể hiện khối lượng công việc đã hoàn thành và tổng khối lượng công việc còn lại trong một vòng lặp (iteration)?",
    "opt": {
      "a": "Tiêu chí chấp nhận (acceptance criteria)",
      "b": "Báo cáo khiếm khuyết (defect report)",
      "c": "Báo cáo hoàn thành kiểm thử (test completion report)",
      "d": "Biểu đồ burndown (burndown chart)"
    },
    "ex": {
      "a": "Sai. Tiêu chí chấp nhận là các điều kiện dùng để quyết định user story đã sẵn sàng hay chưa; chúng không thể hiện tiến độ công việc.",
      "b": "Sai. Báo cáo khiếm khuyết cung cấp thông tin về khiếm khuyết, không thể hiện tiến độ công việc.",
      "c": "Sai. Báo cáo hoàn thành kiểm thử được tạo sau khi vòng lặp kết thúc, nên không thể hiện tiến độ liên tục trong vòng lặp.",
      "d": "<b>Đúng.</b> Biểu đồ burndown biểu diễn công việc còn lại so với thời gian còn lại. Chúng được cập nhật hằng ngày nên thể hiện tiến độ công việc một cách liên tục."
    }
  },
  {
    "n": 37,
    "lo": "FL-5.4.1",
    "k": "K2",
    "ans": [
      "c"
    ],
    "stem": "Bạn cần cập nhật một test script tự động để phù hợp với yêu cầu mới. Quy trình nào chỉ ra rằng bạn tạo một phiên bản mới của test script trong kho lưu trữ kiểm thử (test repository)?",
    "opt": {
      "a": "Quản lý truy vết (traceability management)",
      "b": "Kiểm thử bảo trì (maintenance testing)",
      "c": "Quản lý cấu hình (configuration management)",
      "d": "Kỹ nghệ yêu cầu (requirements engineering)"
    },
    "ex": {
      "a": "Sai. Truy vết là mối quan hệ giữa hai hay nhiều sản phẩm công việc, không phải giữa các phiên bản khác nhau của cùng một sản phẩm công việc.",
      "b": "Sai. Kiểm thử bảo trì là kiểm thử các thay đổi; nó không liên quan chặt chẽ đến việc quản lý phiên bản.",
      "c": "<b>Đúng.</b> Để hỗ trợ kiểm thử, quản lý cấu hình có thể bao gồm kiểm soát phiên bản của tất cả các hạng mục kiểm thử (test item).",
      "d": "Sai. Kỹ nghệ yêu cầu là việc thu thập, viết tài liệu và quản lý yêu cầu; nó không liên quan chặt chẽ đến quản lý phiên bản test script."
    }
  },
  {
    "n": 38,
    "lo": "FL-5.5.1",
    "k": "K3",
    "ans": [
      "c"
    ],
    "stem": "Bạn nhận được phản hồi từ developer về báo cáo khiếm khuyết dưới đây, cho biết bất thường (anomaly) mô tả trong báo cáo này không thể tái hiện.<div class='quote'><b>Application hangs up</b><br><br>2022-May-03 – John Doe – Rejected<br><br>Ứng dụng bị treo sau khi nhập “Test input: $ä” vào trường Name trên màn hình tạo người dùng mới. Đã thử đăng xuất, đăng nhập bằng tài khoản test_admin01 – vẫn lỗi tương tự. Đã thử với các tài khoản test admin khác – vẫn lỗi tương tự. Không nhận được thông báo lỗi; log (xem tệp đính kèm) có thông báo fatal error. Theo ca kiểm thử TC-1305, ứng dụng phải chấp nhận đầu vào đã cung cấp và tạo người dùng. Vui lòng sửa với độ ưu tiên cao, tính năng này liên quan đến REQ-0012 – một yêu cầu nghiệp vụ mới quan trọng.</div>Thông tin quan trọng nào bị <b>THIẾU</b> trong báo cáo này mà lẽ ra sẽ hữu ích cho developer?",
    "opt": {
      "a": "Kết quả mong đợi và kết quả thực tế",
      "b": "Tham chiếu và trạng thái khiếm khuyết",
      "c": "Môi trường kiểm thử và hạng mục kiểm thử (test item)",
      "d": "Độ ưu tiên (priority) và mức độ nghiêm trọng (severity)"
    },
    "ex": {
      "a": "Sai. Kết quả mong đợi là “ứng dụng phải chấp nhận đầu vào đã cung cấp và tạo người dùng”. Kết quả thực tế là “ứng dụng bị treo sau khi nhập ‘Test input: $ä’”.",
      "b": "Sai. Báo cáo có tham chiếu đến ca kiểm thử và yêu cầu liên quan, và có ghi trạng thái khiếm khuyết là Rejected. Hơn nữa, trạng thái khiếm khuyết cũng không thực sự hữu ích cho developer.",
      "c": "<b>Đúng.</b> Chúng ta không biết bất thường được phát hiện trong môi trường kiểm thử nào, và cũng không biết ứng dụng nào (và phiên bản nào) bị ảnh hưởng.",
      "d": "Sai. Báo cáo cho biết bất thường là khẩn cấp, là vấn đề diện rộng (nhiều, nếu không phải tất cả, tài khoản test admin đều bị ảnh hưởng) và có tác động lớn đến các bên liên quan nghiệp vụ."
    }
  },
  {
    "n": 39,
    "lo": "FL-6.1.1",
    "k": "K2",
    "ans": [
      "c"
    ],
    "stem": "<b>Công cụ chuẩn bị dữ liệu</b> (data preparation tool) hỗ trợ hoạt động kiểm thử nào?",
    "opt": {
      "a": "Giám sát kiểm thử và kiểm soát kiểm thử (test monitoring and test control)",
      "b": "Phân tích kiểm thử (test analysis)",
      "c": "Thiết kế kiểm thử và triển khai kiểm thử (test design and test implementation)",
      "d": "Hoàn thành kiểm thử (test completion)"
    },
    "ex": {
      "a": "Sai. Giám sát kiểm thử là việc kiểm tra liên tục mọi hoạt động và so sánh tiến độ thực tế với kế hoạch kiểm thử. Kiểm soát kiểm thử là thực hiện các hành động cần thiết để đạt mục tiêu kiểm thử. Không có dữ liệu kiểm thử nào được chuẩn bị trong các hoạt động này.",
      "b": "Sai. Phân tích kiểm thử bao gồm phân tích cơ sở kiểm thử để xác định và sắp xếp ưu tiên các điều kiện kiểm thử. Dữ liệu kiểm thử không được chuẩn bị trong hoạt động này.",
      "c": "<b>Đúng.</b> Thiết kế và triển khai kiểm thử đều có thể bao gồm việc xác định, tạo hoặc thu thập các testware cần thiết cho thực thi kiểm thử (ví dụ: dữ liệu kiểm thử).",
      "d": "Sai. Hoạt động hoàn thành kiểm thử diễn ra tại các mốc dự án (ví dụ: phát hành, kết thúc vòng lặp, hoàn thành một mức kiểm thử), nên đã quá muộn để chuẩn bị dữ liệu kiểm thử."
    }
  },
  {
    "n": 40,
    "lo": "FL-6.2.1",
    "k": "K1",
    "ans": [
      "b"
    ],
    "stem": "Phương án nào xác định đúng một <b>rủi ro tiềm ẩn</b> khi thực hiện <b>tự động hóa kiểm thử</b>?",
    "opt": {
      "a": "Nó có thể gây ra các lỗi hồi quy chưa biết trên môi trường production",
      "b": "Nỗ lực đủ để bảo trì testware có thể không được phân bổ hợp lý",
      "c": "Các công cụ kiểm thử và testware đi kèm có thể không được tin cậy đầy đủ",
      "d": "Nó có thể làm giảm thời gian dành cho kiểm thử thủ công"
    },
    "ex": {
      "a": "Sai. Tự động hóa kiểm thử không gây ra các lỗi hồi quy chưa biết trên production.",
      "b": "<b>Đúng.</b> Phân bổ sai nỗ lực bảo trì testware là một rủi ro.",
      "c": "Sai. Công cụ kiểm thử phải được lựa chọn sao cho bản thân chúng và testware của chúng có thể được tin cậy.",
      "d": "Sai. Mục tiêu chính của tự động hóa kiểm thử là giảm kiểm thử thủ công. Vì vậy đây là lợi ích, không phải rủi ro."
    }
  }
];
