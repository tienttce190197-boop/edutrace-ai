const branchNames = { speech: 'Giao tiếp và vận động', asd: 'Tương tác xã hội', adhd: 'Chú ý và hành vi', sensory: 'Cảm giác' };

export function buildTestTransfer({ branch, questions, answers, values }) {
  if (!Array.isArray(questions) || !questions.length || questions.some(q => !['yes', 'no'].includes(answers[q.id]))) {
    throw new Error('Vui lòng trả lời tất cả câu hỏi.');
  }
  if (!Array.isArray(values) || values.length !== 4 || values.some(([, value]) => !value || value.length > 120)) {
    throw new Error('Vui lòng điền thông tin liên hệ và tuổi; mỗi ô tối đa 120 ký tự.');
  }
  const content = ['Bài hỏi tham khảo do phụ huynh tự điền; không phải chẩn đoán hay kết quả thang chuẩn.',
    ...values.map(([label, value]) => `${label}: ${value}`),
    ...questions.map(q => `${q.text} — ${answers[q.id] === 'yes' ? 'Có' : 'Không'}`)].join('\n');
  if (content.length > 5000) throw new Error('Nội dung quá dài, không gửi được.');
  return { topic: branchNames[branch] || 'Thông tin phát triển', content };
}
