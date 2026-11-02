// Phỏng theo bảng theo dõi 2 tuổi của CDC; không phải công cụ chẩn đoán.
export const source = 'https://www.cdc.gov/act-early/media/pdfs/2025/11/cdc-milestone-checklists-ltsae-vietnamese.pdf';
export const milestones = [
  'Nhận thấy khi người khác bị đau hoặc buồn',
  'Nhìn mặt người chăm sóc để xem phản ứng trong tình huống mới',
  'Chỉ vào hình trong sách khi được hỏi',
  'Nói được ít nhất hai từ liền nhau',
  'Chỉ được ít nhất hai bộ phận cơ thể khi được hỏi',
  'Dùng cử chỉ khác ngoài vẫy và chỉ tay',
  'Giữ đồ bằng một tay trong khi dùng tay còn lại',
  'Dùng công tắc, núm xoay hoặc nút trên đồ chơi',
  'Chơi với nhiều đồ chơi cùng lúc',
  'Đá bóng',
  'Chạy',
  'Đi lên vài bậc thang, có hoặc không cần giúp đỡ',
  'Dùng thìa xúc ăn'
];
export function formatChecklist(answers, note = '') {
  if (!Array.isArray(answers) || answers.length !== milestones.length || answers.some(answer => !['Đã thấy', 'Chưa thấy', 'Không chắc'].includes(answer))) throw new Error('Vui lòng trả lời tất cả các mục.');
  return ['Bảng theo dõi phát triển 2 tuổi, phỏng theo CDC (không phải chẩn đoán).', `Nguồn: ${source}`, ...milestones.map((item, i) => `${i + 1}. ${item}: ${answers[i]}`), note.trim() ? `Ghi chú của phụ huynh: ${note.trim()}` : ''].filter(Boolean).join('\n');
}
