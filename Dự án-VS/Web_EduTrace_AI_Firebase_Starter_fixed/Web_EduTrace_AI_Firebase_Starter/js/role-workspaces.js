/* ==========================================================================
   EDUTRACE AI - ROLE-SPECIFIC WORKSPACES & INTERACTION CONTROLLER
   Điều khiển hiển thị giao diện chuyên biệt cho Admin, Bác sĩ, Phòng khám
   Ẩn các thông tin bán hàng / nỗi đau thị trường của Phụ huynh khi vào vai trò chuyên môn.
   ========================================================================== */

import {
  subscribeAuth,
  loginWithEmail,
  logoutUser,
  DEMO_PRESET_ACCOUNTS,
  ROLE_LABELS,
  getAllLeadsAndBookings,
  updateActivityStatus,
  recordUserActivity,
  getAllUsersList
} from "./firebase-auth.js";
import { escapeHtml } from "./escape-html.js";
import { initTestTransfer, resetTestTransfer, submitTestTransfer } from "./test-transfer.js";

// Global Role State
let currentRoleUser = null;
let isParentPreviewActive = false;

// Preset Data for Doctor Cases & Evaluations
const INITIAL_DOCTOR_CASES = [
  {
    id: "case-01",
    childName: "Bé Bo (Lê Quốc Bảo)",
    dob: "04/2024 (2.5 tuổi)",
    parentName: "Lê Thị Mai",
    phone: "0909 123 456",
    syndromeKey: "speech",
    syndromeLabel: "Chậm nói & Giảm tương tác mắt",
    severity: "Mức 1 (Nhẹ - Cần can thiệp sớm)",
    mchatScore: "8/20 (Nguy cơ Trung bình)",
    status: "Đang can thiệp tại nhà + Âm ngữ",
    assignedDoctor: "ThS. Nguyễn Mai Anh",
    lastEval: "10/10/2026",
    priorityGoals: "Bật âm đơn /a/, /ba/; duy trì tương tác mắt >3 giây khi giao tiếp.",
    doctorNotes: "Bé rất nhạy bén với hiệu ứng bong bóng và đồ chơi nhiều màu sắc. Đã kê bài tập thổi bong bóng về nhà."
  },
  {
    id: "case-02",
    childName: "Bé Ken (Trần Hoàng Khang)",
    dob: "08/2022 (4 tuổi)",
    parentName: "Trần Văn Tuấn",
    phone: "0918 222 333",
    syndromeKey: "adhd",
    syndromeLabel: "Tăng động giảm chú ý (ADHD)",
    severity: "Mức 2 (Đáng kể - Cần hỗ trợ nhiều)",
    mchatScore: "4/20 (Nguy cơ Thấp về Tự kỷ, nổi trội ADHD)",
    status: "Trị liệu hành vi kết hợp Giác quan",
    assignedDoctor: "ThS. Nguyễn Mai Anh",
    lastEval: "08/10/2026",
    priorityGoals: "Ngồi yên hoàn thành nhiệm vụ 5 phút; kiểm soát xung động giật đồ chơi.",
    doctorNotes: "Bé tập trung hơn khi có âm nhạc êm dịu (nhịp 60bpm). Cần tránh cho bé tiếp xúc màn hình tivi/điện thoại."
  },
  {
    id: "case-03",
    childName: "Bé Minh (Nguyễn Hoàng Minh)",
    dob: "11/2023 (3 tuổi)",
    parentName: "Hoàng Thị Lan",
    phone: "0982 111 222",
    syndromeKey: "asd",
    syndromeLabel: "Nghi ngờ Rối loạn phổ Tự kỷ (ASD)",
    severity: "Mức 2 (Cần hỗ trợ đáng kể)",
    mchatScore: "11/20 (Nguy cơ Cao)",
    status: "Chờ hoàn thiện đánh giá CARS & Denver II",
    assignedDoctor: "ThS. Nguyễn Mai Anh",
    lastEval: "02/10/2026",
    priorityGoals: "Phản hồi quay đầu khi gọi tên; giảm hành vi đi kiễng chân và vẫy tay.",
    doctorNotes: "Bé có sở thích xếp đồ chơi thành hàng thẳng. Áp dụng phương pháp TEACCH tạo góc học tập có cấu trúc trực quan."
  },
  {
    id: "case-04",
    childName: "Bé Thảo (Phạm Phương Thảo)",
    dob: "03/2021 (5 tuổi)",
    parentName: "Phạm Minh Đức",
    phone: "0977 444 555",
    syndromeKey: "sensory",
    syndromeLabel: "Rối loạn Điều hòa Giác quan (SI)",
    severity: "Mức 1 (Cần hỗ trợ giác quan)",
    mchatScore: "2/20 (Nguy cơ Thấp)",
    status: "Can thiệp phòng Sensory",
    assignedDoctor: "ThS. Nguyễn Mai Anh",
    lastEval: "28/09/2026",
    priorityGoals: "Dung nạp xúc giác với cát và nước; chấp nhận cắt tóc và chải tóc.",
    doctorNotes: "Thực hiện chế độ ăn giác quan (Sensory Diet) 2 lần/ngày với thảm gai mềm và bóng xúc giác."
  }
];

// Prescriptions Data Store
const INITIAL_PRESCRIPTIONS = [
  {
    id: "rx-01",
    childName: "Bé Bo (2.5 tuổi)",
    exerciseTitle: "Kỹ thuật Thổi bong bóng xà phòng & Kích thích Bật âm đơn",
    category: "Chậm nói & Tương tác mắt",
    prescribedDate: "10/10/2026",
    frequency: "2 lần/ngày (Mỗi lần 3 - 5 phút)",
    durationWeeks: "4 tuần",
    status: "Đang rèn luyện (Đã tập 6/7 ngày)",
    doctorNotes: "Thổi bong bóng ngang tầm mắt con, dừng lại đợi con phát âm /a/ mới thưởng bóng tiếp.",
    feedback: "Mẹ phản hồi: Bé rất thích thú và đã tự chu môi đòi 'bóng'!"
  },
  {
    id: "rx-02",
    childName: "Bé Ken (4 tuổi)",
    exerciseTitle: "Trò chơi Đập tay theo nhịp & Duy trì tập trung 5 phút",
    category: "Tăng động giảm chú ý (ADHD)",
    prescribedDate: "08/10/2026",
    frequency: "3 lần/ngày (3 phút/lần)",
    durationWeeks: "3 tuần",
    status: "Đang rèn luyện",
    doctorNotes: "Dùng khen ngợi tích cực và bảng sao điểm thưởng ngay sau mỗi hiệp tập.",
    feedback: "Bé đã chịu ngồi đập tay đủ 3 lượt mà không bỏ chạy."
  }
];

// Enrolled Students at Clinic
const INITIAL_CLINIC_STUDENTS = [
  {
    id: "std-01",
    name: "Nguyễn Gia Bảo",
    age: "3 tuổi (SN: 15/06/2023)",
    parent: "Chị Mai (0909 123 456)",
    program: "Can thiệp cá nhân 1-1 chuyên sâu",
    therapist: "ThS. Nguyễn Mai Anh",
    schedule: "Thứ 2, 4, 6 (15:00 - 16:00)",
    progress: "Tiến bộ tốt (Đã bật âm đôi)",
    status: "active"
  },
  {
    id: "std-02",
    name: "Trần Hoàng Khang",
    age: "4.5 tuổi (SN: 10/02/2022)",
    parent: "Anh Tuấn (0918 222 333)",
    program: "Bán trú hòa nhập mầm non",
    therapist: "CN. Hoàng Long",
    schedule: "Thứ 2 - Thứ 6 (07:30 - 16:30)",
    progress: "Ổn định (Tập trung tốt hơn)",
    status: "active"
  },
  {
    id: "std-03",
    name: "Lê Minh Triết",
    age: "2 tuổi (SN: 22/09/2024)",
    parent: "Chị Hạnh (0939 555 777)",
    program: "Trị liệu Âm ngữ phục hồi",
    therapist: "ThS. Trần Thu Hà",
    schedule: "Thứ 3, 5, 7 (09:00 - 10:00)",
    progress: "Mới tiếp nhận (Tuần thứ 2)",
    status: "active"
  },
  {
    id: "std-04",
    name: "Phạm Bảo An",
    age: "3.5 tuổi (SN: 05/12/2022)",
    parent: "Anh Đức (0977 444 555)",
    program: "Trị liệu Điều hòa Cảm giác (SI)",
    therapist: "CN. Lê Thanh Trúc",
    schedule: "Thứ 2, 4, 6 (16:30 - 17:30)",
    progress: "Tiến bộ (Giảm sợ âm thanh)",
    status: "active"
  }
];

// M-CHAT-R/F 20 Screening Questions
const MCHAT_QUESTIONS = [
  { id: 1, text: "Nếu bạn chỉ vào cái gì đó ở phía bên kia phòng, con bạn có nhìn vào nó không? (Ví dụ: Bạn chỉ vào con gấu bông hoặc đồ chơi)", riskAnswer: "no" },
  { id: 2, text: "Bạn có bao giờ tự hỏi liệu con bạn có bị khiếm thính hoặc điếc không?", riskAnswer: "yes" },
  { id: 3, text: "Con bạn có chơi trò chơi giả vờ không? (Ví dụ: Giả vờ uống nước từ cốc rỗng, giả vờ cho búp bê ăn)", riskAnswer: "no" },
  { id: 4, text: "Con bạn có thích leo trèo lên các đồ vật không? (Ví dụ: Cầu thang, đồ đạc trong nhà)", riskAnswer: "no" },
  { id: 5, text: "Con bạn có thực hiện những cử động ngón tay bất thường gần mắt của bé không?", riskAnswer: "yes" },
  { id: 6, text: "Con bạn có dùng ngón tay trỏ để yêu cầu hoặc xin sự giúp đỡ không? (Ví dụ: Chỉ vào đồ ăn trên kệ cao)", riskAnswer: "no" },
  { id: 7, text: "Con bạn có dùng ngón tay trỏ để chỉ cho bạn thấy thứ gì đó thú vị không? (Ví dụ: Chỉ máy bay trên trời)", riskAnswer: "no" },
  { id: 8, text: "Con bạn có quan tâm đến những đứa trẻ khác không? (Ví dụ: Nhìn, cười hoặc đi lại gần bé khác)", riskAnswer: "no" },
  { id: 9, text: "Con bạn có mang đồ vật đến khoe với bạn không? (Ví dụ: Mang cho bạn xem một bức tranh hay món đồ chơi vừa nhặt)", riskAnswer: "no" },
  { id: 10, text: "Con bạn có đáp lại khi bạn gọi tên của bé không? (Ví dụ: Quay đầu lại nhìn, phát âm trả lời)", riskAnswer: "no" },
  { id: 11, text: "Khi bạn mỉm cười với con bạn, bé có mỉm cười đáp lại không?", riskAnswer: "no" },
  { id: 12, text: "Con bạn có khó chịu hoặc cáu gắt quá mức với những tiếng ồn hàng ngày không? (Ví dụ: Máy sấy tóc, máy hút bụi)", riskAnswer: "yes" },
  { id: 13, text: "Con bạn có biết đi bộ không?", riskAnswer: "no" },
  { id: 14, text: "Con bạn có nhìn thẳng vào mắt bạn khi bạn đang nói chuyện, chơi cùng hoặc mặc quần áo cho bé không?", riskAnswer: "no" },
  { id: 15, text: "Con bạn có bắt chước những hành động bạn làm không? (Ví dụ: Vẫy tay chào, vỗ tay hoan hô)", riskAnswer: "no" },
  { id: 16, text: "Nếu bạn quay đầu để nhìn vào thứ gì đó, con bạn có quay đầu nhìn theo để xem bạn đang nhìn gì không?", riskAnswer: "no" },
  { id: 17, text: "Con bạn có cố gắng thu hút sự chú ý của bạn để bạn nhìn vào bé không?", riskAnswer: "no" },
  { id: 18, text: "Con bạn có hiểu lời nói của bạn khi bạn bảo bé làm việc gì đó không? (Ví dụ: 'Đặt cuốn sách lên bàn', 'Đưa mẹ quả bóng')", riskAnswer: "no" },
  { id: 19, text: "Nếu có điều gì mới xảy ra, con bạn có nhìn vào mặt bạn để xem bạn phản ứng thế nào không?", riskAnswer: "no" },
  { id: 20, text: "Con bạn có thích các hoạt động vận động chuyển động không? (Ví dụ: Đung đưa, tung hứng trên đầu gối)", riskAnswer: "no" }
];

document.addEventListener("DOMContentLoaded", () => {
  initRoleWorkspaces();
});

export function initRoleWorkspaces() {
  // Initialize local data stores
  initLocalData();

  // Initialize Parent Clinical Test Modal & Responder Dialogs
  initClinicalAssessmentModal();
  initTestTransfer();
  initRespondModalEvents();

  // Listen to Auth State
  subscribeAuth((user) => {
    currentRoleUser = user;
    applyRoleWorkspace(user);
    checkAndShowParentNotification();
  });

  // Setup Event Listeners for Role Switcher and Actions
  setupRoleSwitcherEvents();
}

// Clinical Test Questions Banks for 4 Branches (M-CHAT/CARS/DSM-5, Denver II, Vanderbilt, Sensory Profile)
const ASD_TEST_QUESTIONS = [
  { id: 1, text: "Khi bạn gọi tên con, bé có quay đầu lại nhìn bạn không?", riskAnswer: "no", desc: "Chỉ dấu thính lực & chú ý xã hội (M-CHAT #10)" },
  { id: 2, text: "Bé có dùng ngón trỏ để chỉ vào đồ vật nhằm thể hiện điều bé thích hoặc muốn chia sẻ không?", riskAnswer: "no", desc: "Chia sẻ chú ý Joint Attention (M-CHAT #7)" },
  { id: 3, text: "Bé có nhìn thẳng vào mắt bạn khi bạn đang nói chuyện, cười đùa hoặc cho ăn không?", riskAnswer: "no", desc: "Tương tác mắt phi ngôn ngữ (DSM-5 Criterion A)" },
  { id: 4, text: "Bé có chơi trò chơi giả vờ không? (Ví dụ: Giả vờ cho búp bê ăn, giả vờ uống nước từ cốc rỗng)", riskAnswer: "no", desc: "Trò chơi biểu tượng & trí tưởng tượng (M-CHAT #3)" },
  { id: 5, text: "Bé có mang đồ vật, đồ chơi đến để khoe hoặc đưa cho ba mẹ xem không?", riskAnswer: "no", desc: "Giao tiếp xã hội chủ động (M-CHAT #9)" },
  { id: 6, text: "Bé có các hành vi vận động lặp đi lặp lại như vỗ tay, lắc lư người, đi kiễng chân hoặc xoay vòng không?", riskAnswer: "yes", desc: "Hành vi rập khuôn Stimming (CARS & DSM-5 Criterion B)" },
  { id: 7, text: "Bé có khăng khăng vào thói quen/lịch trình cố định và bùng nổ dữ dội khi có sự thay đổi nhỏ không?", riskAnswer: "yes", desc: "Tính bất biến & kháng cự thay đổi (DSM-5 Criterion B)" },
  { id: 8, text: "Bé có phản ứng quá mức với tiếng ồn hàng ngày (bịt tai, khóc thét trước tiếng máy xay, máy sấy) không?", riskAnswer: "yes", desc: "Quá tải giác quan thính giác (M-CHAT #12)" },
  { id: 9, text: "Bé có sở thích khác thường như nhìn chăm chú vào bánh xe quay, quạt quay hoặc xếp đồ vật thẳng hàng không?", riskAnswer: "yes", desc: "Sở thích cố định bất thường (CARS Mục 5)" },
  { id: 10, text: "Nếu bạn quay đầu nhìn hoặc chỉ vào một đồ vật ở xa, bé có quay đầu nhìn theo hướng đó không?", riskAnswer: "no", desc: "Theo dõi hướng chú ý người lớn (M-CHAT #16)" }
];

const SPEECH_TEST_QUESTIONS = [
  { id: 1, text: "Bé có biết quay đầu hoặc mỉm cười khi nghe thấy giọng nói quen thuộc của cha mẹ không?", riskAnswer: "no", desc: "Phản xạ thính giác & định vị âm thanh (Denver II)" },
  { id: 2, text: "Bé có biết bập bẹ hoặc phát ra các âm ba-ba, ma-ma, da-da để thu hút sự chú ý không?", riskAnswer: "no", desc: "Bật âm sơ khai (Denver II 12-18 tháng)" },
  { id: 3, text: "Bé có nói được ít nhất 3 – 6 từ đơn có nghĩa rõ ràng (ba, mẹ, măm, đi, bóng) không?", riskAnswer: "no", desc: "Mốc từ vựng cốt lõi (Denver II 18 tháng)" },
  { id: 4, text: "Bé có nói được câu ghép 2 từ có nghĩa (ví dụ: 'uống sữa', 'đi chơi', 'mẹ bế') không?", riskAnswer: "no", desc: "Mốc câu ghép 2 từ (Denver II 24 tháng)" },
  { id: 5, text: "Bé có biết chỉ đúng ít nhất 3 bộ phận trên cơ thể khi được hỏi ('Mắt đâu?', 'Tai đâu?') không?", riskAnswer: "no", desc: "Hiểu ngôn ngữ tiếp nhận (Denver II 24 tháng)" },
  { id: 6, text: "Bé có hiểu và làm theo mệnh lệnh đơn giản gồm 1 – 2 bước ('Lấy quả bóng đưa cho mẹ') không?", riskAnswer: "no", desc: "Tuân thủ chỉ dẫn chức năng (Denver II)" },
  { id: 7, text: "Bé có biết lắc đầu khi không thích và gật đầu khi đồng ý không?", riskAnswer: "no", desc: "Giao tiếp biểu cảm phi ngôn ngữ (Denver II)" },
  { id: 8, text: "Khi muốn thứ gì đó, bé có dùng lời nói hoặc chỉ tay thay vì chỉ khóc hoặc kéo tay người lớn không?", riskAnswer: "no", desc: "Kỹ năng khởi xướng giao tiếp nhu cầu (Denver II)" }
];

const ADHD_TEST_QUESTIONS = [
  { id: 1, text: "Bé có thường xuyên ngọ nguậy tay chân, vặn vẹo trên ghế hoặc khó ngồi yên một chỗ quá 3-5 phút không?", riskAnswer: "yes", desc: "Bồn chồn vận động (Vanderbilt Tiêu chí 1)" },
  { id: 2, text: "Bé có thường rời khỏi chỗ ngồi trong những tình huống cần ngồi yên (giờ ăn cơm, giờ học) không?", riskAnswer: "yes", desc: "Khó duy trì vị trí (DSM-5 ADHD)" },
  { id: 3, text: "Bé có chạy nhảy, leo trèo liên tục ở những nơi không phù hợp mà không ý thức được nguy hiểm không?", riskAnswer: "yes", desc: "Tăng động vận động thô (Vanderbilt Tiêu chí 3)" },
  { id: 4, text: "Bé có nói quá nhiều, nói liên tục hoặc thường buột miệng nói chen ngang người khác không?", riskAnswer: "yes", desc: "Xung động ngôn ngữ (Vanderbilt Tiêu chí 6)" },
  { id: 5, text: "Bé có gặp khó khăn lớn trong việc chờ đợi đến lượt khi chơi trò chơi hoặc xếp hàng không?", riskAnswer: "yes", desc: "Kém ức chế xung động (DSM-5 ADHD)" },
  { id: 6, text: "Bé có rất dễ bị xao nhãng bởi bất kỳ tiếng động hay kích thích nhỏ nào xung quanh không?", riskAnswer: "yes", desc: "Giảm chú ý chọn lọc (Vanderbilt Tiêu chí 7)" },
  { id: 7, text: "Bé có hay quên các hoạt động hàng ngày hoặc thường xuyên làm thất lạc đồ chơi, đồ dùng cá nhân không?", riskAnswer: "yes", desc: "Trí nhớ làm việc ngắn hạn (DSM-5 ADHD)" },
  { id: 8, text: "Bé có khó khăn trong việc hoàn thành nhiệm vụ theo tuần tự (bỏ dở việc này nhảy sang việc khác) không?", riskAnswer: "yes", desc: "Chức năng điều hành Executive Function (Vanderbilt)" }
];

const SENSORY_TEST_QUESTIONS = [
  { id: 1, text: "Bé có cực kỳ khó chịu, la hét hoặc hoảng sợ khi cắt móng tay, cắt tóc hoặc gội đầu không?", riskAnswer: "yes", desc: "Nhạy cảm xúc giác quá mức Tactile Defensiveness" },
  { id: 2, text: "Bé có từ chối mặc một số loại quần áo nhất định (áo có mác cọ xát, vải thô ráp, tất bó chân) không?", riskAnswer: "yes", desc: "Kém dung nạp kết cấu vải (Sensory Profile)" },
  { id: 3, text: "Bé có phản ứng quá mức với âm thanh bình thường (bịt tai, khóc thét trước tiếng máy xay, máy sấy, chuông cửa) không?", riskAnswer: "yes", desc: "Quá tải thính giác Auditory Over-responsivity" },
  { id: 4, text: "Bé có rất sợ các hoạt động nhấc chân khỏi mặt đất (xích đu, cầu trượt, bế tung lên cao) không?", riskAnswer: "yes", desc: "Bất an trọng lực Gravitational Insecurity" },
  { id: 5, text: "Bé có liên tục tìm kiếm cảm giác mạnh: thích xoay vòng tròn không biết chóng mặt, thích đập mạnh người vào đệm không?", riskAnswer: "yes", desc: "Tìm kiếm cảm giác tiền đình Vestibular Seeking" },
  { id: 6, text: "Bé có cực kỳ kén ăn do nhạy cảm với kết cấu thức ăn (chỉ ăn đồ xay nhuyễn, từ chối đồ lợn cợn) không?", riskAnswer: "yes", desc: "Xúc giác khoang miệng Oral Sensitivity" },
  { id: 7, text: "Bé có né tránh việc để tay hoặc chân dính bẩn (không dám chạm vào bùn, cát, keo dán, màu nước) không?", riskAnswer: "yes", desc: "Phòng vệ xúc giác Tactile Avoidance" },
  { id: 8, text: "Bé có dễ bị bùng nổ cảm xúc (Meltdown) khi ở trong môi trường đông người, nhiều ánh đèn và tiếng ồn không?", riskAnswer: "yes", desc: "Quá tải đa giác quan Sensory Overload" }
];

const INITIAL_CLINICAL_TEST_CASES = [
  {
    id: "case-test-101",
    childName: "Bé Bo (Lê Gia Bảo)",
    childAge: "28 tháng",
    parentName: "Chị Lan",
    parentPhone: "0912 345 678",
    branch: "asd",
    branchTitle: "Lượng Giá Phổ Tự Kỷ (M-CHAT-R/F, CARS & DSM-5)",
    score: 8,
    maxScore: 10,
    riskLevel: "Nguy cơ Cao (High Risk)",
    createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    createdTimeFormatted: "15 phút trước",
    status: "pending_review",
    respondedBy: null,
    answers: { 1: "no", 2: "no", 3: "no", 4: "no", 5: "no", 6: "yes", 7: "yes", 8: "yes", 9: "yes", 10: "no" }
  }
];

function initLocalData() {
  if (!localStorage.getItem("edutrace_doctor_cases")) {
    localStorage.setItem("edutrace_doctor_cases", JSON.stringify(INITIAL_DOCTOR_CASES));
  }
  if (!localStorage.getItem("edutrace_doctor_prescriptions")) {
    localStorage.setItem("edutrace_doctor_prescriptions", JSON.stringify(INITIAL_PRESCRIPTIONS));
  }
  if (!localStorage.getItem("edutrace_clinic_students")) {
    localStorage.setItem("edutrace_clinic_students", JSON.stringify(INITIAL_CLINIC_STUDENTS));
  }
  if (!localStorage.getItem("edutrace_clinical_test_cases")) {
    localStorage.setItem("edutrace_clinical_test_cases", JSON.stringify(INITIAL_CLINICAL_TEST_CASES));
  }
}

// ==========================================================================
// APPLY ROLE WORKSPACE (THE CORE UI SWITCHER)
// ==========================================================================
export function applyRoleWorkspace(user) {
  const role = user ? user.role : "parent";
  const parentContainer = document.getElementById("parentViewSection");
  const doctorWorkspace = document.getElementById("doctorRoleWorkspace");
  const clinicWorkspace = document.getElementById("clinicRoleWorkspace");
  const adminWorkspace = document.getElementById("adminRoleWorkspace");
  const investorWorkspace = document.getElementById("investorRoleWorkspace");
  const roleIndicatorBar = document.getElementById("roleIndicatorBar");
  const parentPreviewAlert = document.getElementById("parentPreviewStickyAlert");

  // Update Top Role Indicator Bar
  updateRoleIndicatorBar(user, role);

  // If Parent Preview Mode is on, show parent landing regardless
  if (isParentPreviewActive) {
    if (parentContainer) parentContainer.style.display = "block";
    if (doctorWorkspace) doctorWorkspace.style.display = "none";
    if (clinicWorkspace) clinicWorkspace.style.display = "none";
    if (adminWorkspace) adminWorkspace.style.display = "none";
    if (parentPreviewAlert) parentPreviewAlert.style.display = "flex";
    updateNavbarForRole("parent");
    return;
  }

  if (parentPreviewAlert) parentPreviewAlert.style.display = "none";

  // Hide or Show based on Role
  if (!user || role === "parent") {
    // 1. Phụ huynh (Hoặc khách vãng lai) -> Hiện giao diện landing page, phễu trao giá trị trước, bài tập, giá cả
    if (parentContainer) parentContainer.style.display = "block";
    if (doctorWorkspace) doctorWorkspace.style.display = "none";
    if (clinicWorkspace) clinicWorkspace.style.display = "none";
    if (adminWorkspace) adminWorkspace.style.display = "none";
    updateNavbarForRole("parent");
  } else if (role === "doctor") {
    // 2. Bác sĩ / Chuyên viên -> ẨN hoàn toàn các thông tin phụ huynh, HIỆN Bàn làm việc Bác sĩ
    if (parentContainer) parentContainer.style.display = "none";
    if (doctorWorkspace) doctorWorkspace.style.display = "block";
    if (clinicWorkspace) clinicWorkspace.style.display = "none";
    if (adminWorkspace) adminWorkspace.style.display = "none";
    if (investorWorkspace) investorWorkspace.style.display = "none";
    updateNavbarForRole("doctor");
    renderDoctorWorkspace();
  } else if (role === "center") {
    // 3. Phòng khám / Trung tâm can thiệp -> ẨN thông tin phụ huynh, HIỆN Cổng Tiếp nhận & Quản lý Phòng khám
    if (parentContainer) parentContainer.style.display = "none";
    if (doctorWorkspace) doctorWorkspace.style.display = "none";
    if (clinicWorkspace) clinicWorkspace.style.display = "block";
    if (adminWorkspace) adminWorkspace.style.display = "none";
    if (investorWorkspace) investorWorkspace.style.display = "none";
    updateNavbarForRole("clinic");
    renderClinicWorkspace();
  } else if (role === "admin") {
    // 4. Admin -> ẨN thông tin phụ huynh, HIỆN Cổng Quản trị Hệ Thống
    if (parentContainer) parentContainer.style.display = "none";
    if (doctorWorkspace) doctorWorkspace.style.display = "none";
    if (clinicWorkspace) clinicWorkspace.style.display = "none";
    if (adminWorkspace) adminWorkspace.style.display = "block";
    if (investorWorkspace) investorWorkspace.style.display = "none";
    updateNavbarForRole("admin");
    renderAdminWorkspace();
  } else if (role === "investor") {
    // 5. Investor -> Hien khong gian bao cao cho Nha Dau Tu
    if (parentContainer) parentContainer.style.display = "none";
    if (doctorWorkspace) doctorWorkspace.style.display = "none";
    if (clinicWorkspace) clinicWorkspace.style.display = "none";
    if (adminWorkspace) adminWorkspace.style.display = "none";
    if (investorWorkspace) investorWorkspace.style.display = "block";
    updateNavbarForRole("center");
    import("./investor-workspace.js").catch(e => console.warn("Investor workspace import:", e));
  }
}

// Update Top Role Indicator Bar
function updateRoleIndicatorBar(user, role) {
  const roleBar = document.getElementById("roleIndicatorBar");
  if (!roleBar) return;

  const rolePill = document.getElementById("roleBadgePill");
  const roleTitle = document.getElementById("roleIndicatorTitle");
  const btnTogglePreview = document.getElementById("btnToggleParentPreview");

  if (!user || role === "parent") {
    if (rolePill) {
      rolePill.className = "role-badge-pill parent";
      rolePill.textContent = "👨‍👩‍👧 Phụ Huynh";
    }
    if (roleTitle) {
      roleTitle.innerHTML = user 
        ? `Tài khoản: <strong>${user.displayName || "Phụ huynh"}</strong> • Giao diện Tham vấn & Kho bài tập cho gia đình`
        : `Chế độ khách: <strong>Phụ Huynh & Gia Đình</strong> • Trợ lý AI Tham vấn 24/7`;
    }
    if (btnTogglePreview) btnTogglePreview.style.display = "none";
  } else if (role === "doctor") {
    if (rolePill) {
      rolePill.className = "role-badge-pill doctor";
      rolePill.textContent = "🩺 Bác Sĩ / Chuyên Viên";
    }
    if (roleTitle) {
      roleTitle.innerHTML = `Đang đăng nhập: <strong>${user.displayName || "ThS. Nguyễn Mai Anh"}</strong> • Bàn làm việc Chuyên môn & Đánh giá ca can thiệp`;
    }
    if (btnTogglePreview) {
      btnTogglePreview.style.display = "inline-flex";
      btnTogglePreview.className = isParentPreviewActive ? "btn-role-action active-preview" : "btn-role-action";
      btnTogglePreview.innerHTML = isParentPreviewActive 
        ? `<span>⬅ Quay lại Bàn làm việc Bác sĩ</span>` 
        : `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg> <span>Xem giao diện Phụ huynh</span>`;
    }
  } else if (role === "center") {
    if (rolePill) {
      rolePill.className = "role-badge-pill center";
      rolePill.textContent = "🏥 Phòng Khám / Trung Tâm";
    }
    if (roleTitle) {
      roleTitle.innerHTML = `Đang điều phối: <strong>${user.displayName || "Trung tâm Ánh Sao Ninh Kiều"}</strong> • Quản lý Tiếp nhận lịch hẹn 1-1`;
    }
    if (btnTogglePreview) {
      btnTogglePreview.style.display = "inline-flex";
      btnTogglePreview.className = isParentPreviewActive ? "btn-role-action active-preview" : "btn-role-action";
      btnTogglePreview.innerHTML = isParentPreviewActive 
        ? `<span>⬅ Quay lại Cổng Phòng khám</span>` 
        : `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg> <span>Xem giao diện Phụ huynh</span>`;
    }
  } else if (role === "investor") {
    if (rolePill) {
      rolePill.className = "role-badge-pill center";
      rolePill.textContent = "📈 Nhà Đầu Tư & Đối Tác";
    }
    if (roleTitle) {
      roleTitle.innerHTML = `Cổng thông tin: <strong>${user?.displayName || "Đối Tác & Nhà Đầu Tư"}</strong> – Báo cáo số liệu tăng trưởng và mạng lưới can thiệp`;
    }
    if (btnTogglePreview) btnTogglePreview.style.display = "none";
  } else if (role === "admin") {
    if (rolePill) {
      rolePill.className = "role-badge-pill admin";
      rolePill.textContent = "🛡️ Quản Trị Viên (Admin)";
    }
    if (roleTitle) {
      roleTitle.innerHTML = `Đang điều hành: <strong>${user.displayName || "Ban Quản Trị"}</strong> • Toàn quyền giám sát & Phân quyền hệ thống`;
    }
    if (btnTogglePreview) {
      btnTogglePreview.style.display = "inline-flex";
      btnTogglePreview.className = isParentPreviewActive ? "btn-role-action active-preview" : "btn-role-action";
      btnTogglePreview.innerHTML = isParentPreviewActive 
        ? `<span>⬅ Quay lại Cổng Quản trị</span>` 
        : `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg> <span>Xem giao diện Phụ huynh</span>`;
    }
  }

  // Update Active Chip Highlight
  document.querySelectorAll(".role-chip-btn").forEach((chip) => {
    chip.classList.toggle("active", chip.dataset.role === role);
  });
}

// Dynamically Update Navbar Links based on Role
function updateNavbarForRole(role) {
  const navMenu = document.querySelector(".nav-menu");
  if (!navMenu) return;

  // Find all standard nav-link list items (preserve the auth items at the end)
  const navItems = navMenu.querySelectorAll("li:not(.mobile-auth-divider):not(.mobile-auth-guest):not(.mobile-auth-user)");

  if (role === "parent") {
    navItems[0]?.querySelector("a")?.setAttribute("href", "#home");
    if (navItems[0]?.querySelector("a")) navItems[0].querySelector("a").textContent = "Trang chủ";

    navItems[1]?.querySelector("a")?.setAttribute("href", "#overview-process");
    if (navItems[1]?.querySelector("a")) navItems[1].querySelector("a").textContent = "Quy trình 4 bước";

    navItems[2]?.querySelector("a")?.setAttribute("href", "#market-pain");
    if (navItems[2]?.querySelector("a")) navItems[2].querySelector("a").textContent = "Nỗi đau thị trường";

    navItems[3]?.querySelector("a")?.setAttribute("href", "#ai-assistant-demo");
    if (navItems[3]?.querySelector("a")) navItems[3].querySelector("a").textContent = "Trợ lý AI 24/7";

    navItems[4]?.querySelector("a")?.setAttribute("href", "#exercise-hub");
    if (navItems[4]?.querySelector("a")) navItems[4].querySelector("a").textContent = "Kho bài tập 3-5m";

    navItems[5]?.querySelector("a")?.setAttribute("href", "#pricing");
    if (navItems[5]?.querySelector("a")) navItems[5].querySelector("a").textContent = "Bảng giá";
  } else if (role === "doctor") {
    navItems[0]?.querySelector("a")?.setAttribute("href", "#doctorRoleWorkspace");
    if (navItems[0]?.querySelector("a")) navItems[0].querySelector("a").textContent = "🩺 Bàn làm việc";

    navItems[1]?.querySelector("a")?.setAttribute("href", "#doctorCasesSection");
    if (navItems[1]?.querySelector("a")) navItems[1].querySelector("a").textContent = "📋 Ca can thiệp & Đánh giá";

    navItems[2]?.querySelector("a")?.setAttribute("href", "#doctorPrescriptionsSection");
    if (navItems[2]?.querySelector("a")) navItems[2].querySelector("a").textContent = "🎯 Kê đơn bài tập";

    navItems[3]?.querySelector("a")?.setAttribute("href", "#doctorScalesSection");
    if (navItems[3]?.querySelector("a")) navItems[3].querySelector("a").textContent = "📖 Thang đo M-CHAT & DSM-5";

    navItems[4]?.querySelector("a")?.setAttribute("href", "#doctorAISection");
    if (navItems[4]?.querySelector("a")) navItems[4].querySelector("a").textContent = "🤖 AI Lâm sàng";

    navItems[5]?.querySelector("a")?.setAttribute("href", "#doctorOverviewSection");
    if (navItems[5]?.querySelector("a")) navItems[5].querySelector("a").textContent = "Thống kê ca";
  } else if (role === "clinic") {
    navItems[0]?.querySelector("a")?.setAttribute("href", "#clinicRoleWorkspace");
    if (navItems[0]?.querySelector("a")) navItems[0].querySelector("a").textContent = "🏥 Bảng điều phối";

    navItems[1]?.querySelector("a")?.setAttribute("href", "#clinicBookingsSection");
    if (navItems[1]?.querySelector("a")) navItems[1].querySelector("a").textContent = "📅 Lịch hẹn 1-1";

    navItems[2]?.querySelector("a")?.setAttribute("href", "#clinicStudentsSection");
    if (navItems[2]?.querySelector("a")) navItems[2].querySelector("a").textContent = "👶 Học viên can thiệp";

    navItems[3]?.querySelector("a")?.setAttribute("href", "#clinicProfileSection");
    if (navItems[3]?.querySelector("a")) navItems[3].querySelector("a").textContent = "🏢 Hồ sơ cơ sở";

    navItems[4]?.querySelector("a")?.setAttribute("href", "#clinicAnalyticsSection");
    if (navItems[4]?.querySelector("a")) navItems[4].querySelector("a").textContent = "📊 Báo cáo phễu";

    navItems[5]?.querySelector("a")?.setAttribute("href", "#clinicOverviewSection");
    if (navItems[5]?.querySelector("a")) navItems[5].querySelector("a").textContent = "Tiếp nhận";
  } else if (role === "admin") {
    navItems[0]?.querySelector("a")?.setAttribute("href", "#adminRoleWorkspace");
    if (navItems[0]?.querySelector("a")) navItems[0].querySelector("a").textContent = "🛡️ Tổng quan Admin";

    navItems[1]?.querySelector("a")?.setAttribute("href", "#adminUsersSection");
    if (navItems[1]?.querySelector("a")) navItems[1].querySelector("a").textContent = "👥 Quản lý Người dùng";

    navItems[2]?.querySelector("a")?.setAttribute("href", "#adminBookingsSection");
    if (navItems[2]?.querySelector("a")) navItems[2].querySelector("a").textContent = "📅 Toàn bộ Lịch hẹn";

    navItems[3]?.querySelector("a")?.setAttribute("href", "#adminAISection");
    if (navItems[3]?.querySelector("a")) navItems[3].querySelector("a").textContent = "🧠 Tri thức AI";

    navItems[4]?.querySelector("a")?.setAttribute("href", "admin.html");
    if (navItems[4]?.querySelector("a")) navItems[4].querySelector("a").innerHTML = `<span style="color: #38bdf8;">⚙️ Cổng Admin ↗</span>`;

    navItems[5]?.querySelector("a")?.setAttribute("href", "#adminSystemSection");
    if (navItems[5]?.querySelector("a")) navItems[5].querySelector("a").textContent = "Bảo mật 2 lớp";
  }
}

// Setup Event Listeners
function setupRoleSwitcherEvents() {
  // Toggle Parent Preview
  const btnTogglePreview = document.getElementById("btnToggleParentPreview");
  btnTogglePreview?.addEventListener("click", () => {
    isParentPreviewActive = !isParentPreviewActive;
    applyRoleWorkspace(currentRoleUser);
  });

  const btnReturnWorkspace = document.getElementById("btnReturnWorkspace");
  btnReturnWorkspace?.addEventListener("click", () => {
    isParentPreviewActive = false;
    applyRoleWorkspace(currentRoleUser);
  });

  // Quick Chips Role Switcher (Instant Fast Switching for Evaluation)
  document.querySelectorAll(".role-chip-btn").forEach((chip) => {
    chip.addEventListener("click", async () => {
      const targetRole = chip.dataset.role;
      isParentPreviewActive = false;

      let email = "demo.parent@edutrace.vn";
      if (targetRole === "admin") email = "admin@edutrace.vn";
      else if (targetRole === "doctor") email = "demo.doctor@edutrace.vn";
      else if (targetRole === "center") email = "demo.center@edutrace.vn";
      else if (targetRole === "parent") email = "demo.parent@edutrace.vn";
      else if (targetRole === "investor") {
        currentRoleUser = { email: "investor@edutrace.vn", displayName: "Đối Tác Chiến Lược", role: "investor" };
        applyRoleWorkspace(currentRoleUser);
        return;
      }

      try {
        await loginWithEmail({ email, password: "EduTrace@2026" });
        if (typeof window.showToast === "function") {
          window.showToast(`Đã chuyển đổi sang giao diện: ${ROLE_LABELS[targetRole] || targetRole}`);
        }
      } catch (err) {
        console.error("Switch role error:", err);
      }
    });
  });
}

// ==========================================================================
// 1. DOCTOR WORKSPACE CONTROLLER
// ==========================================================================
function renderDoctorWorkspace() {
  renderDoctorCasesTable();
  renderDoctorPrescriptions();
  initMChatScreener();
  initDoctorAIAssistant();
  renderClinicalTestQueues();
  setupDoctorTabs();
}

function setupDoctorTabs() {
  const tabs = document.querySelectorAll("#doctorTabsBar .role-tab-btn");
  tabs.forEach((tab) => {
    tab.onclick = () => {
      tabs.forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");
      const target = tab.dataset.tab;

      document.querySelectorAll(".doctor-tab-panel").forEach((p) => (p.style.display = "none"));
      const panel = document.getElementById(target);
      if (panel) panel.style.display = "block";
      if (target === "doctorTabTestQueue") renderClinicalTestQueues();
    };
  });
}

function getDoctorCases() {
  try {
    const raw = localStorage.getItem("edutrace_doctor_cases");
    return raw ? JSON.parse(raw) : INITIAL_DOCTOR_CASES;
  } catch {
    return INITIAL_DOCTOR_CASES;
  }
}

function renderDoctorCasesTable() {
  const tbody = document.getElementById("doctorCasesTableBody");
  if (!tbody) return;

  const cases = getDoctorCases();
  const searchInput = document.getElementById("doctorCaseSearch");
  const query = (searchInput?.value || "").toLowerCase().trim();
  const filterSyndrome = document.getElementById("doctorSyndromeFilter")?.value || "all";
  if (searchInput && !searchInput.dataset.listening) {
    searchInput.dataset.listening = "true";
    searchInput.addEventListener("input", renderDoctorCasesTable);
    document.getElementById("doctorSyndromeFilter")?.addEventListener("change", renderDoctorCasesTable);
  }

  const filtered = cases.filter((c) => {
    const matchQuery =
      !query ||
      c.childName.toLowerCase().includes(query) ||
      c.parentName.toLowerCase().includes(query) ||
      c.phone.includes(query);
    const matchSyndrome = filterSyndrome === "all" || c.syndromeKey === filterSyndrome;
    return matchQuery && matchSyndrome;
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr data-empty-demo><td colspan="6" style="text-align: center; color: #94a3b8; padding: 24px;">Không tìm thấy hồ sơ ca mẫu phù hợp.</td></tr>`;
    window.dispatchEvent(new Event('doctor-cases-rendered'));
    return;
  }

  tbody.innerHTML = filtered
    .map(
      (c) => `
    <tr>
      <td>
        <strong style="font-size: 0.9rem; color: #0f172a; display: block;">${c.childName}</strong>
        <span style="font-size: 0.76rem; color: #64748b;">Độ tuổi: ${c.dob}</span>
      </td>
      <td>
        <div>${c.parentName}</div>
        <a href="tel:${c.phone}" style="font-size: 0.78rem; color: #2563eb; font-weight: 600;">📞 ${c.phone}</a>
      </td>
      <td>
        <span class="role-tag-badge ${c.syndromeKey}">${c.syndromeLabel}</span>
        <div style="font-size: 0.74rem; color: #64748b; margin-top: 3px;">M-CHAT: ${c.mchatScore}</div>
      </td>
      <td>
        <div style="font-size: 0.8rem; font-weight: 600; color: #0f172a;">${c.severity}</div>
        <div style="font-size: 0.74rem; color: #10b981; font-weight: 600;">● ${c.status}</div>
      </td>
      <td>
        <div style="font-size: 0.76rem; color: #475569; max-width: 220px; line-height: 1.35;">
          ${c.priorityGoals}
        </div>
      </td>
      <td style="text-align: right; white-space: nowrap;">
        <button type="button" class="btn btn-sm btn-outline-light btn-eval-case" data-id="${c.id}" style="padding: 4px 8px; font-size: 0.75rem; margin-right: 4px;" title="Nhập kết quả đánh giá lâm sàng">
          🩺 Đánh Giá
        </button>
        <button type="button" class="btn btn-sm btn-primary btn-rx-case" data-id="${c.id}" style="padding: 4px 8px; font-size: 0.75rem; background: #059669;" title="Chỉ định đơn bài tập">
          🎯 Kê Đơn
        </button>
      </td>
    </tr>
  `
    )
    .join("");

  // Setup button handlers
  tbody.querySelectorAll(".btn-eval-case").forEach((btn) => {
    btn.onclick = () => openDoctorEvaluationModal(btn.dataset.id);
  });

  tbody.querySelectorAll(".btn-rx-case").forEach((btn) => {
    btn.onclick = () => openPrescribeModal(btn.dataset.id);
  });

  window.dispatchEvent(new Event('doctor-cases-rendered'));
}

// Modal: Đánh Giá Lâm Sàng Bác Sĩ
function openDoctorEvaluationModal(caseId) {
  const cases = getDoctorCases();
  const c = cases.find((item) => item.id === caseId);
  if (!c) return;

  const modal = document.getElementById("doctorEvalModal");
  if (!modal) return;

  document.getElementById("evalModalChildName").textContent = `${c.childName} • ${c.dob}`;
  document.getElementById("evalModalParent").textContent = `Phụ huynh: ${c.parentName} (${c.phone})`;
  document.getElementById("evalSeveritySelect").value = c.severity;
  document.getElementById("evalPriorityGoals").value = c.priorityGoals;
  document.getElementById("evalDoctorNotes").value = c.doctorNotes || "";

  modal.classList.add("active");

  const saveBtn = document.getElementById("btnSaveEvaluation");
  saveBtn.onclick = () => {
    c.severity = document.getElementById("evalSeveritySelect").value;
    c.priorityGoals = document.getElementById("evalPriorityGoals").value.trim();
    c.doctorNotes = document.getElementById("evalDoctorNotes").value.trim();
    c.lastEval = new Date().toLocaleDateString("vi-VN");

    localStorage.setItem("edutrace_doctor_cases", JSON.stringify(cases));
    modal.classList.remove("active");
    renderDoctorCasesTable();
    if (typeof window.showToast === "function") {
      window.showToast(`Đã lưu kết quả đánh giá lâm sàng cho ${c.childName}!`);
    }
  };
}

// Modal: Kê Đơn Bài Tập
function openPrescribeModal(caseId) {
  const cases = getDoctorCases();
  const c = cases.find((item) => item.id === caseId);
  if (!c) return;

  const modal = document.getElementById("doctorPrescribeModal");
  if (!modal) return;

  document.getElementById("rxModalChildName").textContent = `${c.childName} (${c.dob})`;

  modal.classList.add("active");

  const saveBtn = document.getElementById("btnConfirmPrescription");
  saveBtn.onclick = () => {
    const exSelect = document.getElementById("rxExerciseSelect");
    const exTitle = exSelect.options[exSelect.selectedIndex].text;
    const freq = document.getElementById("rxFrequencySelect").value;
    const notes = document.getElementById("rxNotes").value.trim();

    const rxList = JSON.parse(localStorage.getItem("edutrace_doctor_prescriptions") || "[]");
    rxList.unshift({
      id: "rx-" + Date.now(),
      childName: c.childName,
      exerciseTitle: exTitle,
      category: c.syndromeLabel,
      prescribedDate: new Date().toLocaleDateString("vi-VN"),
      frequency: freq,
      durationWeeks: "4 tuần",
      status: "Mới chỉ định (Chờ phụ huynh bắt đầu)",
      doctorNotes: notes || "Tập đúng theo hướng dẫn video 3-5 phút.",
      feedback: "Đã gửi thông báo đơn bài tập đến phụ huynh qua EduTrace AI."
    });

    localStorage.setItem("edutrace_doctor_prescriptions", JSON.stringify(rxList));
    modal.classList.remove("active");
    renderDoctorPrescriptions();
    if (typeof window.showToast === "function") {
      window.showToast(`Đã kê đơn bài tập thành công cho ${c.childName}!`);
    }
  };
}

function renderDoctorPrescriptions() {
  const container = document.getElementById("doctorPrescriptionsList");
  if (!container) return;

  const rxList = JSON.parse(localStorage.getItem("edutrace_doctor_prescriptions") || "[]");

  if (rxList.length === 0) {
    container.innerHTML = `<p style="color: #94a3b8; text-align: center; padding: 20px;">Chưa có đơn bài tập nào được kê.</p>`;
    return;
  }

  container.innerHTML = rxList
    .map(
      (rx) => `
    <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin-bottom: 12px; box-shadow: 0 2px 6px rgba(15,23,42,0.03);">
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 6px;">
        <div>
          <strong style="font-size: 0.95rem; color: #0f172a;">${rx.exerciseTitle}</strong>
          <span style="font-size: 0.78rem; color: #2563eb; font-weight: 700; margin-left: 8px;">Dành cho: ${rx.childName}</span>
        </div>
        <span class="status-chip confirmed" style="font-size: 0.72rem;">${rx.status}</span>
      </div>
      <div style="font-size: 0.8rem; color: #64748b; margin-bottom: 6px;">
        📅 Kê ngày: <strong>${rx.prescribedDate}</strong> • Tần suất: <strong>${rx.frequency}</strong> • Thời hạn: <strong>${rx.durationWeeks}</strong>
      </div>
      <div style="background: #f8fafc; border-left: 3px solid #059669; padding: 8px 12px; border-radius: 4px; font-size: 0.8rem; color: #334155; margin-bottom: 6px;">
        <strong>Chỉ dẫn y khoa:</strong> ${rx.doctorNotes}
      </div>
      <div style="font-size: 0.76rem; color: #10b981; font-weight: 600;">
        💬 ${rx.feedback}
      </div>
    </div>
  `
    )
    .join("");
}

// Interactive M-CHAT-R/F Screener
function initMChatScreener() {
  const grid = document.getElementById("mchatQuestionsGrid");
  if (!grid || grid.dataset.initialized) return;
  grid.dataset.initialized = "true";

  let userAnswers = {};

  grid.innerHTML = MCHAT_QUESTIONS.map(
    (q) => `
    <div class="mchat-q-card" id="mchatCard_${q.id}">
      <span class="mchat-q-text"><strong>#${q.id}.</strong> ${q.text}</span>
      <div class="mchat-options">
        <button type="button" class="mchat-btn-opt" data-qid="${q.id}" data-ans="yes">Có</button>
        <button type="button" class="mchat-btn-opt" data-qid="${q.id}" data-ans="no">Không</button>
      </div>
    </div>
  `
  ).join("");

  function recalcMChat() {
    let score = 0;
    MCHAT_QUESTIONS.forEach((q) => {
      const ans = userAnswers[q.id];
      const card = document.getElementById(`mchatCard_${q.id}`);
      if (ans && ans === q.riskAnswer) {
        score++;
        card?.classList.add("risk-flagged");
      } else {
        card?.classList.remove("risk-flagged");
      }
    });

    const scoreVal = document.getElementById("mchatScoreValue");
    const riskPill = document.getElementById("mchatRiskBadge");
    const adviceText = document.getElementById("mchatAdviceText");

    if (scoreVal) scoreVal.textContent = `${score}/20`;

    if (riskPill && adviceText) {
      if (score <= 2) {
        riskPill.className = "mchat-risk-pill low";
        riskPill.textContent = "Nguy Cơ Thấp (0 - 2)";
        adviceText.textContent = "Trẻ phát triển trong giới hạn bình thường. Tiếp tục theo dõi các mốc phát triển tự nhiên tại nhà.";
      } else if (score <= 7) {
        riskPill.className = "mchat-risk-pill medium";
        riskPill.textContent = "Nguy Cơ Trung Bình (3 - 7)";
        adviceText.textContent = "Cần tiến hành Phỏng vấn theo dõi (Follow-Up M-CHAT) và chỉ định bài tập can thiệp sớm tại nhà.";
      } else {
        riskPill.className = "mchat-risk-pill high";
        riskPill.textContent = "Nguy Cơ Cao (8 - 20)";
        adviceText.textContent = "Cần chuyển khám chuyên khoa Nhi / Giáo dục đặc biệt ngay lập tức để lập kế hoạch can thiệp 1-1 chuyên sâu.";
      }
    }
  }

  grid.querySelectorAll(".mchat-btn-opt").forEach((btn) => {
    btn.onclick = () => {
      const qid = btn.dataset.qid;
      const ans = btn.dataset.ans;
      userAnswers[qid] = ans;

      const parent = btn.parentElement;
      parent.querySelectorAll(".mchat-btn-opt").forEach((b) => {
        b.classList.remove("active-yes", "active-no");
      });

      if (ans === "yes") btn.classList.add("active-yes");
      else btn.classList.add("active-no");

      recalcMChat();
    };
  });

  document.getElementById("btnResetMChat")?.addEventListener("click", () => {
    userAnswers = {};
    grid.querySelectorAll(".mchat-btn-opt").forEach((b) => b.classList.remove("active-yes", "active-no"));
    grid.querySelectorAll(".mchat-q-card").forEach((c) => c.classList.remove("risk-flagged"));
    recalcMChat();
  });
}

// Doctor AI Clinical Assistant
function initDoctorAIAssistant() {
  const sendBtn = document.getElementById("btnDoctorAISend");
  const input = document.getElementById("doctorAIInput");
  const messagesBox = document.getElementById("doctorAIMessages");
  if (!sendBtn || sendBtn.dataset.initialized) return;
  sendBtn.dataset.initialized = "true";

  async function sendDoctorAIMessage(promptText) {
    const text = promptText || input?.value.trim();
    if (!text || !messagesBox) return;

    if (input) input.value = "";

    // Append user message
    const userMsg = document.createElement("div");
    userMsg.className = "doctor-ai-msg user";
    userMsg.textContent = text;
    messagesBox.appendChild(userMsg);
    messagesBox.scrollTop = messagesBox.scrollHeight;

    // Append loading AI msg
    const aiMsg = document.createElement("div");
    aiMsg.className = "doctor-ai-msg ai";
    aiMsg.textContent = "Đang tra cứu cơ sở tri thức lâm sàng & tổng hợp phác đồ y khoa...";
    messagesBox.appendChild(aiMsg);
    messagesBox.scrollTop = messagesBox.scrollHeight;

    try {
      if (window.GeminiService && typeof window.GeminiService.generateResponse === "function") {
        const specializedPrompt = `Bạn là Trợ lý AI Chuyên gia Giáo dục Đặc biệt & Bác sĩ Nhi khoa trên nền tảng EduTrace AI. Hãy hỗ trợ câu hỏi chuyên môn sau với góc nhìn lâm sàng, khoa học, dựa trên M-CHAT, DSM-5, ABA, TEACCH, Denver II: "${text}"`;
        const res = await window.GeminiService.generateResponse(specializedPrompt);
        aiMsg.innerHTML = formatMarkdownText(res);
      } else {
        // Fallback clinical answers
        await new Promise((r) => setTimeout(r, 800));
        aiMsg.innerHTML = generateFallbackClinicalResponse(text);
      }
    } catch (e) {
      aiMsg.innerHTML = generateFallbackClinicalResponse(text);
    }
    messagesBox.scrollTop = messagesBox.scrollHeight;
  }

  sendBtn.onclick = () => sendDoctorAIMessage();
  input?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") sendDoctorAIMessage();
  });

  // Prompt chips
  document.querySelectorAll(".doctor-ai-prompt-chip").forEach((chip) => {
    chip.onclick = () => sendDoctorAIMessage(chip.dataset.prompt);
  });
}

function generateFallbackClinicalResponse(prompt) {
  const p = prompt.toLowerCase();
  if (p.includes("iep") || p.includes("kế hoạch")) {
    return `<strong>📋 Đề xuất Mục tiêu Giáo dục Cá nhân (IEP 3 tháng) cho Trẻ Chậm nói 2.5 tuổi:</strong><br><br>
    <strong>1. Mục tiêu Giao tiếp & Ngôn ngữ:</strong><br>
    • Bật được tối thiểu 3 phụ âm môi (/b/, /m/, /p/) và phát âm từ đơn theo nhu cầu: "ba", "mẹ", "bóng".<br>
    • Duy trì tương tác mắt >3 giây khi người lớn đưa ra phần thưởng đồ chơi.<br><br>
    <strong>2. Hoạt động Can thiệp Ưu tiên:</strong><br>
    • Bài tập video 3-5 phút: Thổi bong bóng kích thích khẩu hình kết hợp trò chơi ú òa.<br>
    • Tần suất: 3 hiệp/ngày, mỗi hiệp 5 phút trước bữa ăn hoặc giờ chơi tự do.`;
  }
  if (p.includes("meltdown") || p.includes("bùng nổ") || p.includes("aba")) {
    return `<strong>⚡ Chiến lược Điều chỉnh Hành vi Bùng nổ (Tantrum / Meltdown) theo Nguyên tắc ABC (ABA):</strong><br><br>
    • <strong>Tiền đề (Antecedent):</strong> Ghi nhận tác nhân kích hoạt (quá tải cảm giác tiếng ồn, bị giật đồ chơi, hoặc bị chuyển đổi hoạt động đột ngột).<br>
    • <strong>Hành vi (Behavior):</strong> Trẻ khóc, nằm lăn, ăn vạ.<br>
    • <strong>Hậu quả (Consequence):</strong> Giữ an toàn vật lý, không nhượng bộ món đồ trẻ đòi, giảm kích thích giác quan (đưa về góc yên tĩnh), khen ngợi ngay khi trẻ lấy lại bình tĩnh.`;
  }
  if (p.includes("sensory") || p.includes("xúc giác") || p.includes("giác quan")) {
    return `<strong>🎨 Phác đồ Điều hòa Cảm giác Xúc giác (Tactile Sensory Diet) tại nhà:</strong><br><br>
    • <strong>Hoạt động chuẩn bị:</strong> Massage ấn sâu (Deep Pressure) bàn chân và lưng trước khi tiếp xúc chất liệu lạ.<br>
    • <strong>Tiếp xúc bậc thang:</strong> Bắt đầu từ đồ khô (hạt đậu, gạo khô) -> khăn bông êm -> thảm gai mềm -> bọt xà phòng -> cát ẩm.<br>
    • <strong>Lưu ý:</strong> Tuyệt đối không ép buộc trẻ nhúng tay khi trẻ đang co rúm sợ hãi.`;
  }
  return `<strong>🩺 Hướng dẫn Lâm sàng EduTrace AI:</strong><br>
  Dựa trên phác đồ sàng lọc M-CHAT-R/F và hướng dẫn can thiệp sớm của Bộ Y tế, đối với các trường hợp nghi ngờ rối loạn phát triển, nguyên tắc quan trọng nhất là <strong>Can thiệp càng sớm càng tốt (giai đoạn vàng 1.5 - 5 tuổi)</strong>. Kết hợp hướng dẫn phụ huynh đồng hành tại nhà bằng các bài tập 3-5 phút không gây áp lực.`;
}

function formatMarkdownText(text) {
  if (!text) return "";
  return text
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/\n\n/g, "<br><br>")
    .replace(/\n/g, "<br>");
}

// ==========================================================================
// 2. CLINIC / CENTER WORKSPACE CONTROLLER
// ==========================================================================
function renderClinicWorkspace() {
  renderClinicBookingsPipeline();
  renderClinicStudentsTable();
  initClinicProfileForm();
  renderClinicalTestQueues();
  setupClinicTabs();
}

function setupClinicTabs() {
  const tabs = document.querySelectorAll("#clinicTabsBar .role-tab-btn");
  tabs.forEach((tab) => {
    tab.onclick = () => {
      tabs.forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");
      const target = tab.dataset.tab;

      document.querySelectorAll(".clinic-tab-panel").forEach((p) => (p.style.display = "none"));
      const panel = document.getElementById(target);
      if (panel) panel.style.display = "block";
      if (target === "clinicTabTestQueue") renderClinicalTestQueues();
    };
  });
}

function renderClinicBookingsPipeline() {
  const bookings = getAllLeadsAndBookings();
  const tbody = document.getElementById("clinicBookingsTableBody");
  if (!tbody) return;

  const filterStatus = document.getElementById("clinicBookingStatusFilter")?.value || "all";

  const filtered = bookings.filter((b) => filterStatus === "all" || (b.status || "pending") === filterStatus);

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: #94a3b8; padding: 24px;">Không có lịch hẹn nào phù hợp.</td></tr>`;
    return;
  }

  tbody.innerHTML = filtered
    .map((b) => {
      const data = b.data || {};
      const parentName = data.parentName || data.name || data.fullname || b.userName || "Phụ huynh";
      const phone = data.parentPhone || data.phone || "Chưa có SĐT";
      const child = data.childInfo || "Bé cần can thiệp sớm";
      const schedule = data.preferredSchedule || "Giờ hành chính";
      const status = b.status || "pending";

      let statusBadge = `<span class="status-chip pending">Chờ tiếp nhận</span>`;
      if (status === "contacted") statusBadge = `<span class="status-chip contacted">Đã gọi điện</span>`;
      else if (status === "confirmed") statusBadge = `<span class="status-chip confirmed">Đã xếp lịch hẹn</span>`;
      else if (status === "completed") statusBadge = `<span class="status-chip completed">Đã hoàn thành</span>`;

      return `
      <tr>
        <td>
          <strong style="color: #0f172a; font-size: 0.88rem; display: block;">${parentName}</strong>
          <a href="tel:${phone}" style="font-size: 0.78rem; color: #2563eb; font-weight: 600;">📞 ${phone}</a>
        </td>
        <td>
          <div style="font-size: 0.82rem; font-weight: 600; color: #1e293b;">${child}</div>
          <div style="font-size: 0.74rem; color: #64748b;">Hẹn: ${schedule}</div>
        </td>
        <td>
          <div style="font-size: 0.76rem; color: #475569;">${b.createdAt || "Hôm nay"}</div>
        </td>
        <td>${statusBadge}</td>
        <td>
          <select class="role-select clinic-status-changer" data-id="${b.id}" style="padding: 4px 8px; font-size: 0.76rem;">
            <option value="pending" ${status === "pending" ? "selected" : ""}>Chờ tiếp nhận</option>
            <option value="contacted" ${status === "contacted" ? "selected" : ""}>Đã gọi điện</option>
            <option value="confirmed" ${status === "confirmed" ? "selected" : ""}>Đã hẹn ngày khám</option>
            <option value="completed" ${status === "completed" ? "selected" : ""}>Đã hoàn thành</option>
          </select>
        </td>
        <td style="text-align: right;">
          <button type="button" class="btn btn-sm btn-outline-light btn-assign-doc" data-id="${b.id}" style="padding: 4px 8px; font-size: 0.75rem;">
            👨‍⚕️ Phân công
          </button>
        </td>
      </tr>
    `;
    })
    .join("");

  // Status changer listener
  tbody.querySelectorAll(".clinic-status-changer").forEach((select) => {
    select.onchange = () => {
      const actId = select.dataset.id;
      const newStatus = select.value;
      updateActivityStatus(actId, newStatus);
      if (typeof window.showToast === "function") {
        window.showToast("Đã cập nhật trạng thái lịch hẹn tiếp nhận!");
      }
      renderClinicBookingsPipeline();
    };
  });

  tbody.querySelectorAll(".btn-assign-doc").forEach((btn) => {
    btn.onclick = () => {
      if (typeof window.showToast === "function") {
        window.showToast("Đã phân công ThS. Nguyễn Mai Anh phụ trách ca này!");
      }
    };
  });

  document.getElementById("clinicBookingStatusFilter")?.addEventListener("change", renderClinicBookingsPipeline);
}

function renderClinicStudentsTable() {
  const tbody = document.getElementById("clinicStudentsTableBody");
  if (!tbody) return;

  const raw = localStorage.getItem("edutrace_clinic_students");
  const students = raw ? JSON.parse(raw) : INITIAL_CLINIC_STUDENTS;

  tbody.innerHTML = students
    .map(
      (s) => `
    <tr>
      <td>
        <strong style="font-size: 0.88rem; color: #0f172a; display: block;">${s.name}</strong>
        <span style="font-size: 0.75rem; color: #64748b;">${s.age}</span>
      </td>
      <td>
        <div>${s.parent}</div>
      </td>
      <td>
        <span class="role-tag-badge speech">${s.program}</span>
        <div style="font-size: 0.74rem; color: #64748b; margin-top: 3px;">Lịch: ${s.schedule}</div>
      </td>
      <td>
        <strong style="font-size: 0.8rem; color: #0f172a;">${s.therapist}</strong>
      </td>
      <td>
        <span class="status-chip confirmed" style="font-size: 0.74rem;">${s.progress}</span>
      </td>
      <td style="text-align: right;">
        <button type="button" class="btn btn-sm btn-outline-light" style="padding: 4px 8px; font-size: 0.75rem;" onclick="alert('Đã mở sổ theo dõi tiến trình của ${s.name}')">
          📝 Sổ theo dõi
        </button>
      </td>
    </tr>
  `
    )
    .join("");

  // Setup Add Student Modal
  const btnOpenModal = document.getElementById("btnOpenAddStudentModal");
  const modal = document.getElementById("addStudentModal");
  if (btnOpenModal && modal) {
    btnOpenModal.onclick = () => modal.classList.add("active");
  }

  const form = document.getElementById("formAddStudent");
  form?.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = document.getElementById("stdName")?.value.trim();
    const age = document.getElementById("stdAge")?.value.trim();
    const parent = document.getElementById("stdParent")?.value.trim();
    const program = document.getElementById("stdProgram")?.value;
    const therapist = document.getElementById("stdTherapist")?.value;

    if (!name || !parent) return;

    students.unshift({
      id: "std-" + Date.now(),
      name,
      age: age || "3 tuổi",
      parent,
      program: program || "Can thiệp cá nhân 1-1",
      therapist: therapist || "ThS. Nguyễn Mai Anh",
      schedule: "Thứ 2, 4, 6",
      progress: "Mới nhập học",
      status: "active"
    });

    localStorage.setItem("edutrace_clinic_students", JSON.stringify(students));
    modal?.classList.remove("active");
    form.reset();
    renderClinicStudentsTable();
    if (typeof window.showToast === "function") {
      window.showToast(`Đã tiếp nhận học viên ${name} vào trung tâm!`);
    }
  });
}

function initClinicProfileForm() {
  const form = document.getElementById("formClinicProfile");
  if (!form || form.dataset.initialized) return;
  form.dataset.initialized = "true";

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (typeof window.showToast === "function") {
      window.showToast("Cập nhật hồ sơ cơ sở phòng khám thành công! Thông tin đã đồng bộ lên bản đồ phụ huynh.");
    }
  });
}

// ==========================================================================
// 3. ADMIN WORKSPACE CONTROLLER
// ==========================================================================
function renderAdminWorkspace() {
  renderAdminUsersSummary();
  renderAdminBookingsSummary();
  setupAdminTabs();
}

function setupAdminTabs() {
  const tabs = document.querySelectorAll("#adminTabsBar .role-tab-btn");
  tabs.forEach((tab) => {
    tab.onclick = () => {
      tabs.forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");
      const target = tab.dataset.tab;

      document.querySelectorAll(".admin-embedded-panel").forEach((p) => (p.style.display = "none"));
      const panel = document.getElementById(target);
      if (panel) panel.style.display = "block";
    };
  });
}

function renderAdminUsersSummary() {
  const tbody = document.getElementById("adminEmbeddedUsersTableBody");
  if (!tbody) return;

  const users = getAllUsersList();
  const searchInput = document.getElementById("adminEmbeddedUserSearch");
  const query = (searchInput?.value || "").toLowerCase().trim();
  const filterRole = document.getElementById("adminEmbeddedRoleFilter")?.value || "all";

  const filtered = users.filter((u) => {
    const match =
      !query ||
      (u.displayName && u.displayName.toLowerCase().includes(query)) ||
      (u.email && u.email.toLowerCase().includes(query));
    const roleMatch = filterRole === "all" || u.role === filterRole;
    return match && roleMatch;
  });

  tbody.innerHTML = filtered
    .map(
      (u) => `
    <tr>
      <td>
        <strong style="font-size: 0.88rem; color: #0f172a; display: block;">${u.displayName || "Người dùng"}</strong>
        <span style="font-size: 0.76rem; color: #64748b;">${u.email}</span>
      </td>
      <td>
        <span class="role-badge-pill ${u.role}" style="font-size: 0.7rem; padding: 2px 8px;">
          ${ROLE_LABELS[u.role] || u.role}
        </span>
      </td>
      <td>${u.phone || "Chưa có"}</td>
      <td><span class="status-chip confirmed">${u.status || "active"}</span></td>
      <td style="text-align: right;">
        <a href="admin.html" class="btn btn-sm btn-outline-light" style="padding: 3px 8px; font-size: 0.72rem; color: #2563eb;">
          🛡️ Quản trị chi tiết
        </a>
      </td>
    </tr>
  `
    )
    .join("");

  if (searchInput && !searchInput.dataset.listening) {
    searchInput.dataset.listening = "true";
    searchInput.addEventListener("input", renderAdminUsersSummary);
    document.getElementById("adminEmbeddedRoleFilter")?.addEventListener("change", renderAdminUsersSummary);
  }
}

function renderAdminBookingsSummary() {
  const tbody = document.getElementById("adminEmbeddedBookingsTableBody");
  if (!tbody) return;

  const bookings = getAllLeadsAndBookings();
  tbody.innerHTML = bookings
    .map((b) => {
      const data = b.data || {};
      const name = data.parentName || data.name || data.fullname || b.userName || "Khách hàng";
      const type = b.type === "booking" ? "Đặt lịch 1-1" : "Đăng ký tư vấn";
      return `
      <tr>
        <td><strong>${name}</strong></td>
        <td><span class="role-tag-badge speech">${type}</span></td>
        <td>${data.targetCenter || "Trung tâm Ánh Sao Ninh Kiều"}</td>
        <td><span class="status-chip ${b.status === "confirmed" ? "confirmed" : "pending"}">${b.status || "pending"}</span></td>
        <td style="text-align: right;">
          <a href="admin.html" class="btn btn-sm btn-outline-light" style="padding: 3px 8px; font-size: 0.72rem;">
            Duyệt trên Admin ↗
          </a>
        </td>
      </tr>
    `;
    })
    .join("");
}

// ==========================================================================
// 4. MULTI-BRANCH CLINICAL ASSESSMENT TEST & FIRST-RESPONDER DISPATCH SYSTEM
// ==========================================================================

const STORAGE_KEY_CLINICAL_TESTS = "edutrace_clinical_test_cases";
let currentTestBranch = "speech";
let userTestAnswers = {};
let activeTestResultCaseId = null;

export function getClinicalTestCases() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CLINICAL_TESTS);
    return raw ? JSON.parse(raw) : INITIAL_CLINICAL_TEST_CASES;
  } catch {
    return INITIAL_CLINICAL_TEST_CASES;
  }
}

export function saveClinicalTestCases(cases) {
  localStorage.setItem(STORAGE_KEY_CLINICAL_TESTS, JSON.stringify(cases));
}

export function getPartnerClinics() {
  try {
    const raw = localStorage.getItem("edutrace_partners_v1");
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Khởi tạo Modal Làm bài Test Sàng lọc Phụ huynh
 */
export function initClinicalAssessmentModal() {
  const modal = document.getElementById("clinicalAssessmentModal");
  if (!modal) return;

  // Nút đóng modal
  const btnClose = document.getElementById("btnCloseClinicalTestModal");
  const btnDone = document.getElementById("btnDoneTestView");
  const btnRetake = document.getElementById("btnRetakeTest");
  const btnSubmit = document.getElementById("btnSubmitClinicalTest");

  btnClose?.addEventListener("click", () => modal.classList.remove("active"));
  btnDone?.addEventListener("click", () => modal.classList.remove("active"));
  btnRetake?.addEventListener("click", () => {
    openClinicalTestModal(currentTestBranch);
  });

  // Nút Nộp Bài Test -> Phát sóng đồng thời đến Bác sĩ & Phòng khám
  btnSubmit?.addEventListener("click", handleClinicalTestSubmit);

  // Lắng nghe broadcast khi có bác sĩ hoặc phòng khám phản hồi ca trong cùng Tab
  window.addEventListener("edutrace:test-case-responded", (e) => {
    if (activeTestResultCaseId) {
      renderParentTestResultView(activeTestResultCaseId);
    }
    renderClinicalTestQueues();
    checkAndShowParentNotification();
    if (typeof window.renderUserBookingsList === "function") {
      window.renderUserBookingsList();
    }
  });

  window.addEventListener("edutrace:new-test-case-submitted", () => {
    renderClinicalTestQueues();
    if (typeof window.renderUserBookingsList === "function") {
      window.renderUserBookingsList();
    }
  });

  // Lắng nghe sự kiện storage xuyên suốt các Tab/Cửa sổ khác nhau (Cross-Tab Sync)
  window.addEventListener("storage", (e) => {
    if (e.key === STORAGE_KEY_CLINICAL_TESTS) {
      const activeCaseId = activeTestResultCaseId || localStorage.getItem("edutrace_last_submitted_test_id");
      const modal = document.getElementById("clinicalAssessmentModal");
      if (modal && modal.classList.contains("active") && activeCaseId) {
        renderParentTestResultView(activeCaseId);
      }
      renderClinicalTestQueues();
      checkAndShowParentNotification();
      if (typeof window.renderUserBookingsList === "function") {
        window.renderUserBookingsList();
      }
    }
  });

  // Cơ chế Polling tự động kiểm tra mỗi 2 giây để luôn đồng bộ tức thì cho phụ huynh
  setInterval(() => {
    const modal = document.getElementById("clinicalAssessmentModal");
    const activeCaseId = activeTestResultCaseId || localStorage.getItem("edutrace_last_submitted_test_id");
    if (modal && modal.classList.contains("active") && activeCaseId) {
      const cases = getClinicalTestCases();
      const currentCase = cases.find((c) => c.id === activeCaseId);
      if (currentCase && currentCase.status === "responded") {
        const pinned = document.getElementById("firstResponderPinnedContainer");
        // Nếu giao diện đang ở màn hình chờ mà dữ liệu đã được bác sĩ phản hồi
        if (pinned && pinned.textContent.includes("Đang Chờ Bác Sĩ")) {
          renderParentTestResultView(activeCaseId);
          if (typeof window.showToast === "function") {
            window.showToast(`🎉 Bác sĩ ${currentCase.respondedBy?.responderName} vừa gửi phản hồi cho bé ${currentCase.childName}!`);
          }
        }
      }
    }
    checkAndShowParentNotification();
  }, 2000);
}

/**
 * Mở modal làm bài test chuẩn y khoa theo đúng nhánh bệnh
 * @param {'asd' | 'speech' | 'adhd' | 'sensory'} branch Nhánh bệnh đã xác định
 * @param {Object} initialData Thông tin ban đầu (tên bé, tuổi)
 */
export function openClinicalTestModal(branch = "speech", initialData = {}) {
  const modal = document.getElementById("clinicalAssessmentModal");
  if (!modal) return;

  currentTestBranch = branch;
  userTestAnswers = {};
  resetTestTransfer();

  const badgeEl = document.getElementById("testModalBadge");
  const titleEl = document.getElementById("testModalTitle");
  const subtitleEl = document.getElementById("testModalSubtitle");
  const container = document.getElementById("testQuestionsContainer");

  let questions = SPEECH_TEST_QUESTIONS;
  let branchName = "Mốc Ngôn Ngữ & Vận Động Denver II (Chậm Nói)";
  let badgeColor = "#0284c7";
  let badgeBg = "rgba(2, 132, 199, 0.15)";
  let subtitle = "Dựa trên tài liệu Denver II • Đối soát vốn từ, phát âm và giao tiếp mắt";

  if (branch === "asd") {
    questions = ASD_TEST_QUESTIONS;
    branchName = "Lượng Giá Sàng Lọc Phổ Tự Kỷ (M-CHAT-R/F, CARS & DSM-5)";
    badgeColor = "#8b5cf6";
    badgeBg = "rgba(139, 92, 246, 0.15)";
    subtitle = "Dựa trên thang đo M-CHAT-R/F, tiêu chuẩn DSM-5 & CARS • Đánh giá tương tác mắt & stimming";
  } else if (branch === "adhd") {
    questions = ADHD_TEST_QUESTIONS;
    branchName = "Đánh Giá Hành Vi NICHQ Vanderbilt & DSM-5 ADHD";
    badgeColor = "#ea580c";
    badgeBg = "rgba(234, 88, 12, 0.15)";
    subtitle = "Dựa trên thang Vanderbilt & DSM-5 • Đánh giá giảm chú ý, tăng động & xung động";
  } else if (branch === "sensory") {
    questions = SENSORY_TEST_QUESTIONS;
    branchName = "Hồ Sơ Điều Hòa Giác Quan Dunn Sensory Profile";
    badgeColor = "#059669";
    badgeBg = "rgba(5, 150, 105, 0.15)";
    subtitle = "Dựa trên hồ sơ Dunn Sensory Profile • Đo lường quá tải xúc giác, thính giác & tiền đình";
  }

  branchName = ({speech:'Giao tiếp và vận động', asd:'Tương tác xã hội', adhd:'Chú ý và hành vi', sensory:'Cảm giác'})[branch] || 'Phát triển của trẻ';
  subtitle = 'Câu hỏi tham khảo để chia sẻ với bác sĩ; không phải thang chẩn đoán.';
  if (badgeEl) {
    badgeEl.textContent = `📋 ${branchName}`;
    badgeEl.style.color = badgeColor;
    badgeEl.style.background = badgeBg;
  }
  if (titleEl) titleEl.textContent = branchName;
  if (subtitleEl) subtitleEl.textContent = subtitle;

  // Prefill thông tin bệnh nhi
  const childInput = document.getElementById("testChildName");
  const ageInput = document.getElementById("testChildAge");
  if (childInput && initialData.childName) childInput.value = initialData.childName;
  if (ageInput && initialData.childAge) ageInput.value = initialData.childAge;

  // Render danh sách câu hỏi
  if (container) {
    container.innerHTML = questions
      .map(
        (q) => `
      <div class="test-q-card" id="testQCard_${q.id}">
        <div class="test-q-label">
          <strong>#${q.id}.</strong> ${q.text}
        </div>
        <div class="test-q-options">
          <button type="button" class="btn-test-opt" data-qid="${q.id}" data-ans="yes">Có</button>
          <button type="button" class="btn-test-opt" data-qid="${q.id}" data-ans="no">Không</button>
        </div>
      </div>
    `
      )
      .join("");

    // Setup click listener cho từng câu hỏi
    container.querySelectorAll(".btn-test-opt").forEach((btn) => {
      btn.onclick = () => {
        const qid = btn.dataset.qid;
        const ans = btn.dataset.ans;
        userTestAnswers[qid] = ans;

        const parent = btn.parentElement;
        parent.querySelectorAll(".btn-test-opt").forEach((b) => b.classList.remove("active-yes", "active-no"));

        if (ans === "yes") btn.classList.add("active-yes");
        else btn.classList.add("active-no");

        recalculateLiveTestScore(questions);
      };
    });
  }

  // Chuyển về màn hình điền câu hỏi
  document.getElementById("clinicalTestFormView").style.display = "block";
  document.getElementById("clinicalTestResultView").style.display = "none";

  recalculateLiveTestScore(questions);
  modal.classList.add("active");
}

/**
 * Tính điểm trực tiếp khi phụ huynh trả lời câu hỏi
 */
function recalculateLiveTestScore(questions) {
  let score = 0;
  questions.forEach((q) => {
    const ans = userTestAnswers[q.id];
    const card = document.getElementById(`testQCard_${q.id}`);
    if (ans && ans === q.riskAnswer) {
      score++;
      card?.classList.add("flagged-risk");
    } else {
      card?.classList.remove("flagged-risk");
    }
  });

  const scoreText = document.getElementById("testLiveScoreText");
  const riskBadge = document.getElementById("testRiskBadgeEl");
  const noteEl = document.getElementById("testScaleStandardNote");

  const total = questions.length;
  if (scoreText) scoreText.textContent = `${score}/${total}`;

  let riskLevel = "low";
  let riskLabel = "Nguy cơ Thấp (Phát triển phù hợp)";
  let noteText = "Điểm số nằm trong phạm vi phát triển an toàn. Gia đình tiếp tục theo dõi các mốc tiếp theo.";

  const ratio = score / total;
  if (ratio >= 0.6) {
    riskLevel = "high";
    riskLabel = "Nguy cơ Cao (Cần lượng giá chuyên khoa)";
    noteText = "Điểm số chạm ngưỡng chỉ dấu lâm sàng. Cần liên hệ ngay bác sĩ/trung tâm để khám trực tiếp 1-1.";
  } else if (ratio >= 0.3) {
    riskLevel = "medium";
    riskLabel = "Nguy cơ Trung Bình (Cần can thiệp sớm)";
    noteText = "Có một số chỉ dấu chậm phát triển. Khuyến nghị áp dụng bài tập 3-5 phút tại nhà và đặt lịch tham vấn.";
  }

  if (riskBadge) {
    riskBadge.className = `test-risk-badge ${riskLevel}`;
    riskBadge.textContent = riskLabel;
  }
  if (noteEl) noteEl.textContent = noteText;
}

/**
 * Xử lý khi phụ huynh bấm nút Gửi Kết Quả Cho Bác Sĩ & Phòng Khám
 */
function handleClinicalTestSubmit() {
  let questions = SPEECH_TEST_QUESTIONS;
  if (currentTestBranch === "asd") questions = ASD_TEST_QUESTIONS;
  else if (currentTestBranch === "adhd") questions = ADHD_TEST_QUESTIONS;
  else if (currentTestBranch === "sensory") questions = SENSORY_TEST_QUESTIONS;
  void submitTestTransfer({ user: currentRoleUser, branch: currentTestBranch, questions, answers: userTestAnswers });

}

/**
 * Hiển thị màn hình kết quả bài test của phụ huynh
 * Ưu tiên điều hướng: Ghim cơ sở của Bác sĩ / Phòng khám phản hồi sớm nhất lên ĐẦU TIÊN
 * Kèm danh sách các phòng khám lân cận nạp từ localStorage (nếu không có thì để "Chưa có", không bịa)
 */
export function renderParentTestResultView(caseId) {
  const cases = getClinicalTestCases();
  const c = cases.find((item) => item.id === caseId) || cases[0];
  if (!c) return;

  activeTestResultCaseId = c.id;

  // 1. Tóm tắt kết quả
  const summaryBox = document.getElementById("testResultSummaryBox");
  if (summaryBox) {
    let riskClass = "low";
    if (c.riskLevel.includes("Cao")) riskClass = "high";
    else if (c.riskLevel.includes("Trung Bình")) riskClass = "medium";

    summaryBox.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 10px; margin-bottom: 8px;">
        <div>
          <h4 style="margin: 0 0 4px; color: #0f172a; font-size: 1.05rem;">Kết Quả Sàng Lọc: ${c.childName} (${c.childAge})</h4>
          <span style="font-size: 0.8rem; color: #64748b;">${c.branchTitle} • Thời gian nộp: ${c.createdTimeFormatted}</span>
        </div>
        <div style="text-align: right;">
          <div style="font-size: 1.2rem; font-weight: 800; color: #0f172a;">${c.score}/${c.maxScore} điểm</div>
          <span class="test-risk-badge ${riskClass}">${c.riskLevel}</span>
        </div>
      </div>
      <div style="font-size: 0.82rem; color: #334155; line-height: 1.5; background: #ffffff; padding: 10px 14px; border-radius: 8px; border-left: 3px solid #2563eb;">
        <strong>Chỉ dẫn y khoa đối soát tài liệu:</strong> Dựa trên các tiêu chí chuẩn hóa, bé có ${c.score} dấu hiệu cần lưu ý. Mọi phân tích hoàn toàn bám sát tài liệu y khoa chính thức, không tự suy đoán.
      </div>
    `;
  }

  // 2. KHỐI ƯU TIÊN #1: BÁC SĨ / PHÒNG KHÁM TIẾP NHẬN & PHẢN HỒI SỚM NHẤT
  const pinnedContainer = document.getElementById("firstResponderPinnedContainer");
  if (pinnedContainer) {
    if (c.status === "responded" && c.respondedBy) {
      const resp = c.respondedBy;
      pinnedContainer.innerHTML = `
        <div class="first-responder-pinned-card">
          <div class="first-responder-badge-top">
            🏆 ĐÃ TIẾP NHẬN &amp; PHẢN HỒI SỚM NHẤT BỞI BÁC SĨ / PHÒNG KHÁM
          </div>
          <h4 class="first-responder-clinic-name">${resp.clinicName}</h4>
          <div class="first-responder-doctor-name">
            👨‍⚕️ ${resp.responderName} (${resp.responderRole === "doctor" ? "Bác Sĩ Chuyên Khoa Nhi" : "Đại Diện Cơ Sở Can Thiệp"}) • Tiếp nhận lúc: ${resp.respondedAt}
          </div>

          <div class="first-responder-feedback-box">
            <strong style="color: #0f172a; display: block; margin-bottom: 4px;">📋 Nhận xét lâm sàng &amp; Tư vấn từ Bác sĩ:</strong>
            ${resp.doctorFeedback.replace(/\n/g, "<br>")}
          </div>

          <div class="first-responder-meta-row">
            <div>📍 <strong>Địa chỉ đón tiếp bé:</strong> ${resp.clinicAddress}</div>
            <div>📞 <strong>Hotline đặt lịch khám:</strong> <a href="tel:${resp.clinicPhone}" style="color: #059669; font-weight: 700;">${resp.clinicPhone}</a></div>
          </div>

          <div class="first-responder-actions-row">
            <a href="tel:${resp.clinicPhone}" class="btn-responder-call">
              📞 Gọi Điện Ngay Cho Bác Sĩ / Cơ Sở
            </a>
            <button type="button" class="btn-responder-book" onclick="window.openCenterBooking?.('${resp.clinicName}', '${resp.clinicAddress}')">
              📅 Đặt Lịch Khám Trực Tiếp 1-1 Tại Đây
            </button>
          </div>
        </div>
      `;
    } else {
      // Đang chờ phản hồi
      pinnedContainer.innerHTML = `
        <div style="background: #fffbeb; border: 2px dashed #f59e0b; border-radius: 14px; padding: 22px; text-align: center; margin: 16px 0;">
          <div style="font-size: 2rem; margin-bottom: 6px; animation: spin-slow 4s infinite linear;">⏳</div>
          <strong style="color: #b45309; font-size: 1rem; display: block; margin-bottom: 6px;">
            Đang Chờ Bác Sĩ &amp; Phòng Khám Tiếp Nhận Sớm Nhất...
          </strong>
          <p style="font-size: 0.82rem; color: #78350f; max-width: 520px; margin: 0 auto 12px; line-height: 1.45;">
            Hệ thống đã phát sóng kết quả ca test này đến toàn bộ các Bác sĩ chuyên khoa và Cơ sở can thiệp. Bác sĩ hoặc Phòng khám nào tiếp nhận và gửi phản hồi đầu tiên sẽ được <strong>ghim ưu tiên số 1</strong> tại vị trí này để hướng dẫn gia đình bạn!
          </p>
          <div style="display: inline-flex; align-items: center; gap: 8px; font-size: 0.78rem; color: #b45309; background: #fef3c7; padding: 6px 14px; border-radius: 99px;">
            <span class="role-status-dot"></span> Đang chờ chuyên gia phản hồi (tự động cập nhật trực tiếp)...
          </div>
        </div>
      `;
    }
  }

  // 3. KHỐI CÁC PHÒNG KHÁM LÂN CẬN (DO NGƯỜI DÙNG / ADMIN NẠP VÀO)
  const neighboringContainer = document.getElementById("neighboringClinicsContainer");
  if (neighboringContainer) {
    const partners = getPartnerClinics();
    // Lọc bỏ phòng khám đã phản hồi sớm nhất (nếu có) để tránh trùng lặp
    const responderClinicName = c.respondedBy?.clinicName || "";
    const filteredPartners = partners.filter((p) => !responderClinicName || !p.name.includes(responderClinicName));

    if (filteredPartners.length === 0) {
      neighboringContainer.innerHTML = `
        <div class="neighboring-clinics-title">
          <span>🏥 Các Cơ Sở &amp; Phòng Khám Lân Cận Khác:</span>
        </div>
        <div class="neighboring-empty-state">
          Chưa có phòng khám lân cận nào được nạp vào hệ thống.
        </div>
      `;
    } else {
      const partnersHtml = filteredPartners
        .map(
          (p) => `
        <div class="neighboring-clinic-card">
          <div class="neighboring-clinic-info">
            <strong>${p.name}</strong>
            ${p.address ? `<span>📍 ${p.address}</span>` : ""}
            ${p.phone ? `<span>📞 ${p.phone}</span>` : ""}
            ${p.strengths ? `<span style="font-style: italic; color: #475569;">${p.strengths}</span>` : ""}
          </div>
          <div style="display: flex; gap: 6px;">
            ${p.phone ? `<a href="tel:${p.phone}" class="btn btn-sm btn-outline-light" style="font-size: 0.78rem;">Gọi Điện</a>` : ""}
            <button type="button" class="btn btn-sm btn-primary" onclick="window.openCenterBooking?.('${p.name}', '${p.address || ""}')" style="font-size: 0.78rem; background: #2563eb;">
              Đặt Hẹn
            </button>
          </div>
        </div>
      `
        )
        .join("");

      neighboringContainer.innerHTML = `
        <div class="neighboring-clinics-title">
          <span>🏥 Các Cơ Sở &amp; Phòng Khám Lân Cận Khác (Gia đình có thêm đa dạng lựa chọn):</span>
        </div>
        <div style="display: flex; flex-direction: column; gap: 8px;">
          ${partnersHtml}
        </div>
      `;
    }
  }
}

/**
 * Hiển thị Hàng đợi Ca test và Banner phát sóng đồng thời trong Bàn làm việc Bác sĩ & Phòng khám
 */
export function renderClinicalTestQueues() {
  const cases = getClinicalTestCases();
  const pendingCases = cases.filter((c) => c.status === "pending_review");
  const pendingCount = pendingCases.length;

  // 1. Cập nhật Badge số lượng chưa nhận trên Tabs Bar
  const docBadge = document.getElementById("doctorPendingTestCount");
  const clinicBadge = document.getElementById("clinicPendingTestCount");
  if (docBadge) {
    docBadge.textContent = pendingCount;
    docBadge.style.display = pendingCount > 0 ? "inline-block" : "none";
  }
  if (clinicBadge) {
    clinicBadge.textContent = pendingCount;
    clinicBadge.style.display = pendingCount > 0 ? "inline-block" : "none";
  }

  // 2. Cập nhật Banner Phát sóng Khẩn cấp (Broadcast Alert Banners)
  const docBanner = document.getElementById("doctorBroadcastAlert");
  const clinicBanner = document.getElementById("clinicBroadcastAlert");

  if (pendingCount > 0) {
    const latest = pendingCases[0];
    const alertHtml = `
      <div class="broadcast-alert-content">
        <span class="bell-icon">🔔</span>
        <div>
          <strong>CÓ ${pendingCount} CA TEST SÀNG LỌC MỚI CẦN TIẾP NHẬN!</strong>
          <div style="font-size: 0.82rem; opacity: 0.95;">
            Gần nhất: <strong>${latest.childName}</strong> (${latest.childAge}) • ${latest.branchTitle} • <span style="background: rgba(0,0,0,0.25); padding: 1px 6px; border-radius: 4px;">${latest.riskLevel}</span>
          </div>
        </div>
      </div>
      <button type="button" class="btn btn-sm btn-light btn-goto-queue" style="font-weight: 800; color: #c2410c; background: #ffffff; padding: 6px 14px; border-radius: 8px; cursor: pointer;">
        Tiếp Nhận Sớm Nhất ➔
      </button>
    `;

    if (docBanner) {
      docBanner.innerHTML = alertHtml;
      docBanner.style.display = "flex";
      docBanner.querySelector(".btn-goto-queue")?.addEventListener("click", () => {
        document.querySelector("#doctorTabsBar .role-tab-btn[data-tab='doctorTabTestQueue']")?.click();
      });
    }

    if (clinicBanner) {
      clinicBanner.innerHTML = alertHtml;
      clinicBanner.style.display = "flex";
      clinicBanner.querySelector(".btn-goto-queue")?.addEventListener("click", () => {
        document.querySelector("#clinicTabsBar .role-tab-btn[data-tab='clinicTabTestQueue']")?.click();
      });
    }
  } else {
    if (docBanner) docBanner.style.display = "none";
    if (clinicBanner) clinicBanner.style.display = "none";
  }

  // 3. Render danh sách thẻ ca trong Queue Container
  const renderQueueTo = (containerId) => {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (cases.length === 0) {
      container.innerHTML = `<p style="text-align: center; color: #94a3b8; padding: 24px;">Hiện chưa có ca test nào trong hệ thống.</p>`;
      return;
    }

    container.innerHTML = cases
      .map((c) => {
        const isPending = c.status === "pending_review";
        let riskClass = "low";
        if (c.riskLevel.includes("Cao")) riskClass = "high";
        else if (c.riskLevel.includes("Trung Bình")) riskClass = "medium";

        return `
        <div class="first-responder-queue-card ${isPending ? "pending-urgent" : "responded-done"}">
          <div style="flex: 1; min-width: 0;">
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
              <strong style="font-size: 1rem; color: #0f172a;">${c.childName}</strong>
              <span style="font-size: 0.78rem; color: #64748b;">(${c.childAge})</span>
              <span class="test-risk-badge ${riskClass}">${c.riskLevel} (${c.score}/${c.maxScore})</span>
            </div>
            <div style="font-size: 0.82rem; color: #475569; margin-bottom: 4px;">
              Nhánh: <strong>${c.branchTitle}</strong> • Phụ huynh: <strong>${c.parentName}</strong> (<a href="tel:${c.parentPhone}" style="color: #2563eb; font-weight: 600;">${c.parentPhone}</a>)
            </div>
            <div style="font-size: 0.76rem; color: #94a3b8;">
              ⏱️ Thời gian nộp: ${c.createdTimeFormatted}
            </div>

            ${
              !isPending && c.respondedBy
                ? `
              <div style="margin-top: 8px; font-size: 0.8rem; background: #ecfdf5; border-left: 3px solid #10b981; padding: 6px 10px; border-radius: 4px; color: #065f46;">
                <strong>✓ Đã được tiếp nhận bởi:</strong> ${c.respondedBy.responderName} (${c.respondedBy.clinicName}) lúc ${c.respondedBy.respondedAt}
              </div>
            `
                : ""
            }
          </div>

          <div style="flex-shrink: 0;">
            ${
              isPending
                ? `
              <button type="button" class="btn-fast-respond" data-caseid="${c.id}">
                ⚡ Tiếp Nhận &amp; Phản Hồi Ngay (Ưu Tiên #1)
              </button>
            `
                : `
              <button type="button" class="btn btn-sm btn-outline-light btn-view-responded-case" data-caseid="${c.id}" style="font-size: 0.78rem;">
                👁️ Xem Chi Tiết
              </button>
            `
            }
          </div>
        </div>
      `;
      })
      .join("");

    // Setup action click
    container.querySelectorAll(".btn-fast-respond").forEach((btn) => {
      btn.onclick = () => openDoctorRespondCaseModal(btn.dataset.caseid);
    });

    container.querySelectorAll(".btn-view-responded-case").forEach((btn) => {
      btn.onclick = () => {
        openDoctorRespondCaseModal(btn.dataset.caseid);
      };
    });
  };

  renderQueueTo("doctorTestQueueContainer");
  renderQueueTo("clinicTestQueueContainer");
  // The legacy queue is device-local sample data, not a new cloud notification.
  if (docBadge) docBadge.style.display = "none";
  if (docBanner) docBanner.style.display = "none";
}

let activeRespondingCaseId = null;

function initRespondModalEvents() {
  const modal = document.getElementById("doctorRespondCaseModal");
  if (!modal) return;

  document.getElementById("btnCloseRespondModal")?.addEventListener("click", () => modal.classList.remove("active"));
  document.getElementById("btnCancelRespond")?.addEventListener("click", () => modal.classList.remove("active"));

  document.getElementById("formDoctorRespond")?.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!activeRespondingCaseId) return;

    const cases = getClinicalTestCases();
    const c = cases.find((item) => item.id === activeRespondingCaseId);
    if (!c) return;

    const doctorName = document.getElementById("respondDoctorName")?.value.trim();
    const clinicName = document.getElementById("respondClinicName")?.value.trim();
    const clinicAddress = document.getElementById("respondClinicAddress")?.value.trim();
    const clinicPhone = document.getElementById("respondClinicPhone")?.value.trim();
    const feedback = document.getElementById("respondDoctorFeedback")?.value.trim();

    c.status = "responded";
    c.respondedBy = {
      responderName: doctorName || "Bác sĩ Chuyên Khoa",
      responderRole: currentRoleUser?.role || "doctor",
      clinicName: clinicName || "Phòng khám Nhi Đồng Cần Thơ",
      clinicAddress: clinicAddress || "Quận Ninh Kiều, TP. Cần Thơ",
      clinicPhone: clinicPhone || "0912 345 678",
      respondedAt: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }) + " hôm nay",
      doctorFeedback: feedback
    };

    saveClinicalTestCases(cases);
    modal.classList.remove("active");

    // Phát sóng sự kiện đã có người nhận phản hồi sớm nhất
    window.dispatchEvent(new CustomEvent("edutrace:test-case-responded", { detail: c }));

    if (typeof window.showToast === "function") {
      window.showToast("🎉 Bạn đã tiếp nhận ca này sớm nhất! Bệnh nhân sẽ được điều hướng đến cơ sở của bạn.");
    }

    renderClinicalTestQueues();
  });
}

/**
 * Mở modal để Bác sĩ hoặc Phòng khám phản hồi ca test
 */
export function openDoctorRespondCaseModal(caseId) {
  const cases = getClinicalTestCases();
  const c = cases.find((item) => item.id === caseId);
  if (!c) return;

  activeRespondingCaseId = caseId;
  const modal = document.getElementById("doctorRespondCaseModal");
  if (!modal) return;

  const childEl = document.getElementById("respondChildNameText");
  const riskEl = document.getElementById("respondRiskBadgeText");
  const metaEl = document.getElementById("respondCaseMetaText");

  if (childEl) childEl.textContent = `${c.childName} (${c.childAge})`;
  if (riskEl) {
    riskEl.textContent = `${c.riskLevel} (${c.score}/${c.maxScore} điểm)`;
    let riskClass = "low";
    if (c.riskLevel.includes("Cao")) riskClass = "high";
    else if (c.riskLevel.includes("Trung Bình")) riskClass = "medium";
    riskEl.className = `test-risk-badge ${riskClass}`;
  }
  if (metaEl) {
    metaEl.textContent = `Phụ huynh: ${c.parentName} (${c.parentPhone}) • Nhánh: ${c.branchTitle}`;
  }

  // Điền thông tin người trả lời (dựa theo profile bác sĩ hoặc phòng khám)
  const isClinic = currentRoleUser?.role === "center";
  const doctorNameInput = document.getElementById("respondDoctorName");
  const clinicNameInput = document.getElementById("respondClinicName");
  const addressInput = document.getElementById("respondClinicAddress");
  const phoneInput = document.getElementById("respondClinicPhone");
  const feedbackInput = document.getElementById("respondDoctorFeedback");

  if (isClinic) {
    if (doctorNameInput) doctorNameInput.value = "ThS. Nguyễn Mai Anh (Đại diện Chuyên môn)";
    if (clinicNameInput) clinicNameInput.value = currentRoleUser?.displayName || "Trung tâm Can thiệp Sớm Ánh Sao Ninh Kiều";
    if (addressInput) addressInput.value = "Đường Nguyễn Văn Cừ nối dài, P. An Bình, Q. Ninh Kiều, TP. Cần Thơ";
    if (phoneInput) phoneInput.value = "0292.389.1122";
    if (feedbackInput) {
      feedbackInput.value = c.respondedBy?.doctorFeedback || `Chào gia đình ${c.parentName}! Trung tâm đã nhận được kết quả bài test của bé ${c.childName}. Dựa trên chỉ số ${c.score}/${c.maxScore} điểm (${c.riskLevel}), trung tâm mời gia đình đưa bé đến kiểm tra lượng giá chuyên sâu 1-1 miễn phí tại cơ sở trong tuần này để các chuyên viên tâm lý - giáo dục đặc biệt lập lộ trình can thiệp cá nhân hóa cho con.`;
    }
  } else {
    // Bác sĩ
    if (doctorNameInput) doctorNameInput.value = currentRoleUser?.displayName || "ThS. Nguyễn Mai Anh";
    if (clinicNameInput) clinicNameInput.value = "Phòng khám Chuyên khoa Tâm lý Nhi Đồng Ninh Kiều";
    if (addressInput) addressInput.value = "Đường Trần Hưng Đạo, P. An Phú, Q. Ninh Kiều, TP. Cần Thơ";
    if (phoneInput) phoneInput.value = "0292.381.8899";
    if (feedbackInput) {
      feedbackInput.value = c.respondedBy?.doctorFeedback || `Chào ba mẹ bé ${c.childName}! Tôi là ThS. Nguyễn Mai Anh, đã xem qua toàn bộ kết quả bài test ${c.branchTitle} của con. Với mức độ ${c.riskLevel}, tôi khuyên ba mẹ trước mắt hãy áp dụng ngay các bài tập video 3-5 phút tại nhà để kích thích phản xạ cho con, đồng thời tôi đã ghi nhận lịch ưu tiên đón tiếp gia đình vào sáng Thứ 7 này tại phòng khám để lượng giá trực tiếp.`;
    }
  }

  modal.classList.add("active");
}

/**
 * Phụ huynh mở xem trực tiếp đánh giá và phản hồi của bác sĩ cho ca test
 * @param {string} caseId Mã định danh ca test
 */
export function viewClinicalTestResponse(caseId) {
  const modal = document.getElementById("clinicalAssessmentModal");
  if (!modal) return;

  const formView = document.getElementById("clinicalTestFormView");
  const resultView = document.getElementById("clinicalTestResultView");

  if (formView) formView.style.display = "none";
  if (resultView) resultView.style.display = "block";

  activeTestResultCaseId = caseId;
  renderParentTestResultView(caseId);

  modal.classList.add("active");
  document.body.style.overflow = "hidden";
}

/**
 * Hiển thị thẻ thông báo nổi bật cho phụ huynh trên trang chủ khi bác sĩ đã phản hồi
 * CHỈ HIỂN THỊ KHI ĐÃ ĐĂNG NHẬP VÀ VAI TRÒ LÀ PHỤ HUYNH ('parent')
 */
export function checkAndShowParentNotification() {
  const alertEl = document.getElementById("parentClinicalResponseAlert");

  // Chỉ hiển thị trên trang chủ phụ huynh (index.html), không hiện trên workspace
  const isWorkspace = window.location.pathname.includes("workspace.html");
  if (isWorkspace) {
    if (alertEl) alertEl.style.display = "none";
    return;
  }

  // BẮT BUỘC: Phải đăng nhập vào tài khoản PHỤ HUYNH mới thấy thông báo!
  // Khách chưa đăng nhập, người đã đăng xuất hoặc bác sĩ/admin tuyệt đối không hiện.
  if (!currentRoleUser || currentRoleUser.role !== "parent") {
    if (alertEl) alertEl.style.display = "none";
    return;
  }

  const cases = getClinicalTestCases();
  // Lọc chỉ những ca test đã phản hồi thuộc về tài khoản phụ huynh đang đăng nhập
  const respondedCases = cases.filter((c) => {
    if (c.status !== "responded" || !c.respondedBy) return false;
    // 1. Khớp theo email phụ huynh đã đăng ký/đăng nhập
    if (c.parentEmail && currentRoleUser.email) {
      return c.parentEmail.toLowerCase() === currentRoleUser.email.toLowerCase();
    }
    // 2. Khớp ca test vừa được phụ huynh này làm trong phiên
    const lastId = localStorage.getItem("edutrace_last_submitted_test_id");
    if (lastId && c.id === lastId) return true;
    // 3. Khớp theo số điện thoại hoặc họ tên
    if (currentRoleUser.phone && c.parentPhone && c.parentPhone.includes(currentRoleUser.phone)) {
      return true;
    }
    if (currentRoleUser.displayName && c.parentName && c.parentName.toLowerCase().includes(currentRoleUser.displayName.toLowerCase())) {
      return true;
    }
    // Nếu ca test không gắn email riêng và đây là phụ huynh
    return !c.parentEmail;
  });

  if (respondedCases.length === 0) {
    if (alertEl) alertEl.style.display = "none";
    return;
  }

  const latestResponded = respondedCases[0];
  const dismissedKey = "edutrace_dismissed_alert_" + latestResponded.id;
  if (sessionStorage.getItem(dismissedKey)) {
    if (alertEl) alertEl.style.display = "none";
    return;
  }

  if (!alertEl) {
    alertEl = document.createElement("div");
    alertEl.id = "parentClinicalResponseAlert";
    alertEl.className = "parent-response-floating-alert";
    document.body.appendChild(alertEl);
  }

  const resp = latestResponded.respondedBy;
  const childSafe = latestResponded.childName || "bé";
  const doctorSafe = resp.responderName || "Bác sĩ Chuyên khoa";
  const clinicSafe = resp.clinicName || "Cơ sở can thiệp";
  const timeSafe = resp.respondedAt || "Vừa xong";
  const feedbackSnippet = resp.doctorFeedback
    ? resp.doctorFeedback.length > 130
      ? resp.doctorFeedback.slice(0, 130) + "..."
      : resp.doctorFeedback
    : "Đã có nhận xét lâm sàng và chỉ dẫn lộ trình can thiệp.";

  alertEl.innerHTML = `
    <div class="alert-top-row">
      <div class="alert-icon">🩺</div>
      <div class="alert-body">
        <div class="alert-title">🎉 Bác Sĩ Đã Gửi Phản Hồi Cho ${childSafe}!</div>
        <div class="alert-meta">
          👨‍⚕️ ${doctorSafe} • ${clinicSafe} (${timeSafe})
        </div>
        <div class="alert-feedback-preview">
          "${feedbackSnippet}"
        </div>
      </div>
    </div>
    <div class="alert-actions-row">
      <button type="button" class="btn-view-feedback-full" id="btnParentViewFullFeedback">
        🔍 Xem Toàn Bộ Nhận Xét &amp; Phác Đồ ➔
      </button>
      <button type="button" class="btn-dismiss-alert" id="btnParentDismissAlert">
        Đóng
      </button>
    </div>
  `;

  alertEl.style.display = "flex";

  document.getElementById("btnParentViewFullFeedback")?.addEventListener("click", () => {
    alertEl.style.display = "none";
    viewClinicalTestResponse(latestResponded.id);
  });

  document.getElementById("btnParentDismissAlert")?.addEventListener("click", () => {
    alertEl.style.display = "none";
    sessionStorage.setItem(dismissedKey, "1");
  });
}

// Export toàn cục để các script khác và HTML đều có thể gọi trực tiếp
window.openClinicalTestModal = openClinicalTestModal;
window.renderParentTestResultView = renderParentTestResultView;
window.viewClinicalTestResponse = viewClinicalTestResponse;
window.checkAndShowParentNotification = checkAndShowParentNotification;
window.renderClinicalTestQueues = renderClinicalTestQueues;
window.refreshClinicalTestQueues = renderClinicalTestQueues;
window.openDoctorRespondCaseModal = openDoctorRespondCaseModal;
window.getPartnerClinics = getPartnerClinics;
