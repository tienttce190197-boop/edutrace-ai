import { getApp } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js';
import { getFirestore, collection, query, where, onSnapshot, addDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js';
import { milestones, formatChecklist } from './milestone-checklist.js';
const auth = getAuth(getApp()), db = getFirestore(getApp());
const form = document.getElementById('parentReferralForm'), select = form.elements.clinicianUid, status = document.getElementById('parentReferralStatus');
let uid = null, unsubscribe = null, epoch = 0;
const questions = document.getElementById('milestoneQuestions');
const items = document.getElementById('milestoneItems');
const aiResult = document.getElementById('milestoneAiResult');
const aiText = document.getElementById('milestoneAiText');
const aiButton = document.getElementById('milestoneAiReview');
const externalAssessment = document.getElementById('externalAssessment');
const externalDescription = document.getElementById('externalAssessmentDescription');
const externalSource = document.getElementById('externalAssessmentSource');
const externalAge = form.elements.externalAgeMonths;
const externalModes = {
  mchat_external: { title:'M-CHAT-R/F', source:'https://www.mchatscreen.com/mchat-rf/translations/', min:16, max:30, description:'M-CHAT-R/F dành cho trẻ 16–30 tháng. Chọn bản tiếng Việt trên trang tác giả; bài có bước theo dõi khi cần.' },
  vanderbilt_external: { title:'NICHQ Vanderbilt, bản phụ huynh', source:'https://nichq.org/wp-content/uploads/2024/09/NICHQ-Vanderbilt-Assessment-Scales.pdf', min:72, max:155, description:'Tài liệu gốc bản tiếng Anh, bản phụ huynh bắt đầu ở trang 2. Thang hỗ trợ chuyên gia đánh giá trẻ 6–12 tuổi; thường cần thông tin từ phụ huynh và giáo viên.' }
};
let reviewVersion = 0;
function clearReview() { reviewVersion++; aiResult.hidden = true; aiText.textContent = ''; }
for (const [i, text] of milestones.entries()) {
  const label = document.createElement('label');
  label.textContent = `${i + 1}. ${text}`;
  const answer = document.createElement('select'); answer.name = `milestone${i}`; answer.className = 'form-control';
  for (const value of ['', 'Đã thấy', 'Chưa thấy', 'Không chắc']) answer.add(new Option(value || 'Chọn câu trả lời', value));
  label.append(answer); items.append(label);
}
function toggleMode() {
  const enabled = form.elements.mode.value === 'milestones';
  const external = externalModes[form.elements.mode.value];
  questions.hidden = !enabled;
  externalAssessment.hidden = !external;
  externalAge.disabled = !external;
  externalAge.required = Boolean(external);
  if (external) { externalAge.min = external.min; externalAge.max = external.max; externalDescription.textContent = external.description; externalSource.href = external.source; }
  form.elements.ageMonths.disabled = !enabled;
  form.elements.ageMonths.required = enabled;
  for (let i = 0; i < milestones.length; i++) {
    form.elements[`milestone${i}`].disabled = !enabled;
    form.elements[`milestone${i}`].required = enabled;
  }
  form.elements.content.required = !enabled;
}
form.elements.mode.addEventListener('change', toggleMode);
questions.addEventListener('change', clearReview);
form.elements.mode.addEventListener('change', clearReview);
aiButton.addEventListener('click', async () => {
  clearReview();
  if (!uid) { status.textContent = 'Hãy đăng nhập để nhận nhận xét.'; return; }
  if (!form.elements.aiConsent.checked) { status.textContent = 'Vui lòng đồng ý gửi câu trả lời đến Gemini trước khi nhận nhận xét.'; return; }
  const age = form.elements.ageMonths;
  if (!age.reportValidity()) return;
  for (let i = 0; i < milestones.length; i++) if (!form.elements[`milestone${i}`].reportValidity()) return;
  if (!window.geminiService?.isConfigured()) { status.textContent = 'Chưa cấu hình Gemini; bạn vẫn có thể gửi câu trả lời cho bác sĩ.'; return; }
  const current = epoch, version = reviewVersion;
  const data = formatChecklist(milestones.map((_, i) => form.elements[`milestone${i}`].value));
  aiButton.disabled = true; status.textContent = 'Đang nhận nhận xét từ AI...';
  try {
    const prompt = `Dựa duy nhất vào bảng theo dõi phát triển CDC 2 tuổi sau và câu trả lời của phụ huynh, hãy tóm tắt các mục phụ huynh chọn “Chưa thấy” hoặc “Không chắc”; không tự chẩn đoán, không chấm điểm hay phân loại nguy cơ, không khẳng định trẻ bình thường, không đưa điều trị. Khuyên trao đổi với bác sĩ về mọi lo ngại, nhất là nếu trẻ mất kỹ năng. Bảng này không thay thế sàng lọc. Tuổi: ${age.value} tháng.\n${data}`;
    const text = await window.geminiService.sendChatMessage(prompt, []);
    if (current !== epoch || version !== reviewVersion) return;
    if (typeof text !== 'string' || !text.trim()) throw new Error('empty');
    aiText.textContent = text.trim(); aiResult.hidden = false;
    status.textContent = 'Đã nhận phản hồi. Hãy xem lại và chọn bác sĩ để chia sẻ câu trả lời.';
  } catch { if (current === epoch && version === reviewVersion) status.textContent = 'Không nhận được phản hồi AI. Bạn vẫn có thể gửi câu trả lời cho bác sĩ.'; }
  finally { aiButton.disabled = false; }
});
toggleMode();
onAuthStateChanged(auth, user => {
  ++epoch; clearReview(); unsubscribe?.(); unsubscribe = null; uid = user?.uid || null; form.reset(); toggleMode();
  select.replaceChildren(new Option('Chọn bác sĩ', ''));
  if (!uid) { status.textContent = 'Hãy đăng nhập để gửi thông tin.'; return; }
  unsubscribe = onSnapshot(query(collection(db,'clinicianDirectory'),where('active','==',true)), snapshot => {
    const previous = select.value;
    select.replaceChildren(new Option('Chọn bác sĩ', ''));
    snapshot.docs.sort((a,b) => String(a.data().name).localeCompare(String(b.data().name),'vi')).forEach(item => select.add(new Option(item.data().name,item.id)));
    if ([...select.options].some(option => option.value === previous)) select.value = previous;
    status.textContent = snapshot.empty ? 'Chưa có bác sĩ được liên kết. Vui lòng liên hệ quản trị viên.' : 'Chọn bác sĩ và kiểm tra nội dung trước khi gửi.';
  }, () => { select.replaceChildren(new Option('Không tải được danh sách bác sĩ', '')); status.textContent = 'Không tải được danh sách bác sĩ. Vui lòng thử lại.'; });
});
form.addEventListener('submit', async event => {
  event.preventDefault(); if (!uid || !form.reportValidity()) return;
  const current = epoch, button = form.querySelector('[type=submit]'); button.disabled = true;
  try {
    const note = form.elements.content.value.trim();
    const external = externalModes[form.elements.mode.value];
    const content = form.elements.mode.value === 'milestones'
      ? `Tuổi do phụ huynh nhập: ${form.elements.ageMonths.value} tháng\n${formatChecklist(milestones.map((_, i) => form.elements[`milestone${i}`].value), note)}`
      : external ? `Phụ huynh chia sẻ thông tin từ: ${external.title}\nNguồn: ${external.source}\nTuổi do phụ huynh nhập: ${externalAge.value} tháng\nNội dung do phụ huynh tự nhập (chưa được hệ thống xác minh hay chấm điểm):\n${note}` : note;
    if (!content) { status.textContent = 'Vui lòng nhập nội dung.'; return; }
    await addDoc(collection(db,'screeningSubmissions'), {parentUid:uid,clinicianUid:select.value,topic:form.elements.topic.value,content,consent:form.elements.consent.checked,status:'new',createdAt:serverTimestamp()});
    if (current === epoch) { form.reset(); toggleMode(); clearReview(); status.textContent = 'Đã gửi thông tin cho bác sĩ. Bác sĩ sẽ thấy khi mở ứng dụng.'; }
  } catch { if (current === epoch) status.textContent = 'Không gửi được. Vui lòng kiểm tra danh sách bác sĩ và thử lại.'; }
  finally { button.disabled = false; }
});
