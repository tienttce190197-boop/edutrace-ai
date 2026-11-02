import { test } from 'node:test';
import assert from 'node:assert/strict';
import { suggestScreening } from '../js/screening-suggestions.js';

test('gợi ý theo nhóm và độ tuổi, không tự chọn khi thiếu hoặc ngoài độ tuổi', () => {
  assert.deepEqual(suggestScreening('trẻ 2 tuổi rưỡi tự kỷ'), {mode:'mchat_external',ageMonths:30});
  assert.deepEqual(suggestScreening('trẻ 2 tuổi chậm nói'), {mode:'milestones',ageMonths:24});
  assert.deepEqual(suggestScreening('trẻ 7 tuổi tăng động'), {mode:'vanderbilt_external',ageMonths:84});
  assert.equal(suggestScreening('trẻ 4 tuổi tự kỷ').mode,null);
  assert.equal(suggestScreening('trẻ tự kỷ').mode,null);
  assert.equal(suggestScreening('trẻ 2 tuổi tự kỷ và chậm nói').mode,null);
  assert.equal(suggestScreening('mẹ 30 tuổi con 2 tuổi chậm nói').mode,null);
});
