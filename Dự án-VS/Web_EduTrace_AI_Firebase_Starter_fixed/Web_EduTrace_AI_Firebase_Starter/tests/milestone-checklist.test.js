import { test } from 'node:test';
import assert from 'node:assert/strict';
import { milestones, formatChecklist } from '../js/milestone-checklist.js';

test('bảng theo dõi cần đủ câu trả lời và không tự đưa ra mức nguy cơ', () => {
  assert.equal(milestones.length, 13);
  assert.throws(() => formatChecklist(['Đã thấy']));
  assert.throws(() => formatChecklist(milestones.map(() => 'khác')));
  const result = formatChecklist(milestones.map(() => 'Không chắc'), 'Cần trao đổi');
  assert.match(result, /cdc\.gov/);
  assert.match(result, /không phải chẩn đoán/);
  assert.match(result, /13\./);
  assert.match(result, /Cần trao đổi/);
  assert.doesNotMatch(result, /nguy cơ cao|nguy cơ thấp/i);
});
