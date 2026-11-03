import { suggestScreening } from './screening-suggestions.js';
const input = document.getElementById('aiCustomInput');
const output = document.getElementById('screeningSuggestion');
const labels = {milestones:'Bảng theo dõi phát triển CDC 2 tuổi (làm trong website)',mchat_external:'M-CHAT-R/F (mở tài liệu gốc)',vanderbilt_external:'NICHQ Vanderbilt (mở tài liệu gốc)'};
document.getElementById('btnAIAnalyze')?.addEventListener('click', () => {
  const selection = suggestScreening(input.value);
  output.replaceChildren();
  const info = document.createElement('p');
  if (!selection.mode) { info.textContent = selection.reason; output.append(info); return; }
  info.textContent = `Gợi ý theo từ khóa và tuổi bạn nhập: ${labels[selection.mode]}. Đây không phải chẩn đoán; hãy xác nhận công cụ với bác sĩ.`;
  const button = document.createElement('button'); button.type = 'button'; button.textContent = 'Mở phần chia sẻ với bác sĩ'; button.className = 'role-workspace-profile';
  button.addEventListener('click', () => {
    const panel = document.getElementById('parentReferralPanel');
    if (!panel || panel.hidden || document.getElementById('roleWorkspace')?.hidden) { info.textContent = 'Vui lòng đăng nhập bằng tài khoản phụ huynh để mở biểu mẫu.'; return; }
    const form = document.getElementById('parentReferralForm');
    form.elements.mode.value = selection.mode; form.elements.mode.dispatchEvent(new Event('change', {bubbles:true}));
    if (selection.mode === 'milestones') form.elements.ageMonths.value = String(selection.ageMonths);
    else form.elements.externalAgeMonths.value = String(selection.ageMonths);
    panel.scrollIntoView({behavior:'smooth'});
  });
  output.append(info,button);
});
