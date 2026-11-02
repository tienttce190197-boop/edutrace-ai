// Gợi ý tài liệu, không suy luận bệnh hoặc chẩn đoán từ văn bản.
export function suggestScreening(text) {
  const value = String(text || '').toLocaleLowerCase('vi-VN');
  const mentions = [];
  if (/tự kỷ|tự ki|\basd\b|m.chat/.test(value)) mentions.push('mchat_external');
  if (/tăng động|giảm chú ý|\badhd\b|vanderbilt/.test(value)) mentions.push('vanderbilt_external');
  if (/chậm nói|chưa nói|ít nói|ngôn ngữ|giao tiếp|nói chậm/.test(value)) mentions.push('milestones');
  const matches = [...value.matchAll(/(\d{1,3}(?:[.,]\d+)?)\s*(tháng|tuổi)(\s*rưỡi)?/g)];
  if (matches.length !== 1) return { mode:null, reason:'Vui lòng cho biết tuổi của trẻ bằng tháng hoặc tuổi và trao đổi với bác sĩ để chọn công cụ phù hợp.' };
  const n = Number(matches[0][1].replace(',', '.'));
  const age = matches[0][2] === 'tuổi' ? (n + (matches[0][3] ? 0.5 : 0)) * 12 : n;
  if (!Number.isInteger(age) || age < 0 || age > 216) return { mode:null, reason:'Chưa xác định được tuổi phù hợp; hãy xác nhận tuổi với bác sĩ.' };
  if (mentions.length !== 1) return { mode:null, reason:'Hãy chọn một vấn đề cần trao đổi và hỏi bác sĩ để chọn công cụ phù hợp.' };
  const mode = mentions[0];
  const ranges = {mchat_external:[16,30],vanderbilt_external:[72,155],milestones:[24,29]};
  const [min,max] = ranges[mode];
  if (age < min || age > max) return { mode:null, reason:'Công cụ tương ứng chưa phù hợp với tuổi đã nhập. Hãy hỏi bác sĩ về công cụ phù hợp.' };
  return { mode, ageMonths:age };
}
