import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildTestTransfer } from '../js/test-transfer-core.js';

const values = [['Tên trẻ','DEMO'],['Tuổi','28 tháng'],['Người liên hệ','Demo'],['Điện thoại','0900000000']];
const questions = [{id:1,text:'Câu hỏi một?'},{id:2,text:'Câu hỏi hai?'}];
test('chỉ gửi câu trả lời, không tự suy luận điểm hoặc chẩn đoán', () => {
  const result = buildTestTransfer({branch:'adhd', questions, answers:{1:'yes',2:'no'}, values});
  assert.equal(result.topic, 'Chú ý và hành vi');
  assert.match(result.content, /Câu hỏi một\? — Có/);
  assert.match(result.content, /Câu hỏi hai\? — Không/);
  assert.doesNotMatch(result.content, /Nguy cơ cao|Điểm nguy cơ/);
});
test('không chấp nhận thiếu câu trả lời hoặc thông tin liên hệ', () => {
  assert.throws(() => buildTestTransfer({branch:'adhd',questions,answers:{1:'yes'},values}), /trả lời tất cả/);
  assert.throws(() => buildTestTransfer({branch:'adhd',questions,answers:{1:'yes',2:'no'},values:values.map(([k,v],i)=>[k,i===3?'':v])}), /điền thông tin/);
});
