import { getApp } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js';
import { getFirestore, collection, query, where, getDocs, addDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js';
import { buildTestTransfer } from './test-transfer-core.js';

let busy = false;
let sent = false;

export function resetTestTransfer() {
  sent = false;
  const button = document.getElementById('btnSubmitClinicalTest');
  const consent = document.getElementById('testShareConsent');
  const status = document.getElementById('testTransferStatus');
  if (button) button.disabled = false;
  if (consent) consent.checked = false;
  if (status) status.textContent = 'Chọn bác sĩ bạn đồng ý chia sẻ.';
}

export function initTestTransfer() {
  const select = document.getElementById('testClinician');
  const status = document.getElementById('testTransferStatus');
  if (!select || !status) return;
  const auth = getAuth(getApp()), db = getFirestore(getApp());
  let epoch = 0;
  onAuthStateChanged(auth, async user => {
    const current = ++epoch;
    select.replaceChildren(new Option('Chọn bác sĩ', ''));
    if (!user) { status.textContent = 'Đăng nhập tài khoản phụ huynh để gửi.'; return; }
    status.textContent = 'Đang tải danh sách bác sĩ...';
    try {
      const snapshot = await getDocs(query(collection(db, 'clinicianDirectory'), where('active', '==', true)));
      if (current !== epoch) return;
      for (const item of snapshot.docs) select.add(new Option(item.data().name, item.id));
      status.textContent = snapshot.empty ? 'Chưa có bác sĩ được liên kết.' : 'Chọn bác sĩ bạn đồng ý chia sẻ.';
    } catch { if (current === epoch) status.textContent = 'Không tải được danh sách bác sĩ.'; }
  });
}

export async function submitTestTransfer({ user, branch, questions, answers }) {
  const status = document.getElementById('testTransferStatus');
  const select = document.getElementById('testClinician');
  const consent = document.getElementById('testShareConsent');
  const button = document.getElementById('btnSubmitClinicalTest');
  if (!status || !select || !consent || !button || busy || sent) return;
  const auth = getAuth(getApp());
  if (!auth.currentUser || user?.role !== 'parent') { status.textContent = 'Hãy đăng nhập bằng tài khoản phụ huynh.'; return; }
  if (!select.value || !consent.checked) { status.textContent = 'Hãy chọn bác sĩ và đồng ý chia sẻ.'; return; }
  const fields = [['testChildName', 'Tên trẻ'], ['testChildAge', 'Tuổi'], ['testParentName', 'Người liên hệ'], ['testParentPhone', 'Điện thoại']];
  const values = fields.map(([id, label]) => [label, document.getElementById(id)?.value.trim() || '']);
  let draft;
  try { draft = buildTestTransfer({branch, questions, answers, values}); }
  catch (error) { status.textContent = error.message; return; }
  busy = true; button.disabled = true; status.textContent = 'Đang gửi...';
  try {
    await addDoc(collection(getFirestore(getApp()), 'screeningSubmissions'), {
      parentUid: auth.currentUser.uid, clinicianUid: select.value, ...draft,
      consent: true, status: 'new', createdAt: serverTimestamp()
    });
    sent = true;
    consent.checked = false;
    status.textContent = 'Đã gửi câu trả lời cho bác sĩ đã chọn. Đây không phải chẩn đoán.';
  } catch { status.textContent = 'Không gửi được. Hãy kiểm tra kết nối và thử lại.'; }
  finally { busy = false; button.disabled = sent; }
}
