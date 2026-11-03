import { getApp } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js';
import { getFirestore, collection, query, where, onSnapshot, doc, updateDoc, runTransaction, serverTimestamp } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js';
const auth = getAuth(getApp()), db = getFirestore(getApp());
const list = document.getElementById('screeningInbox'), status = document.getElementById('screeningInboxStatus');
let unsubscribe = null, epoch = 0;
onAuthStateChanged(auth, async user => {
  const current = ++epoch;
  unsubscribe?.(); unsubscribe = null; list.replaceChildren();
  status.textContent = 'Đang kiểm tra quyền...';
  if (!user) return;
  try {
    const token = await user.getIdTokenResult();
    if (current !== epoch) return;
    if (token.claims.clinician !== true) { status.textContent = 'Tài khoản chưa có quyền chuyên môn.'; return; }
    status.textContent = 'Đang tải kết quả...';
    unsubscribe = onSnapshot(query(collection(db, 'screeningSubmissions'), where('clinicianUid', '==', user.uid)), snapshot => {
      if (current !== epoch) return;
      list.replaceChildren();
      const rows = snapshot.docs.map(item => ({id:item.id, ...item.data()})).sort((a,b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
      status.textContent = rows.length ? `${rows.filter(row => row.status === 'new').length} kết quả mới · ${rows.length} tổng số` : 'Chưa có kết quả nào.';
      for (const row of rows) {
        const article = document.createElement('article'); article.className = 'clinical-history-entry';
        const title = document.createElement('strong'); title.textContent = `${row.status === 'new' ? 'Mới' : row.status === 'accepted' ? 'Đã tiếp nhận' : 'Đã xem'} · ${row.topic}`;
        const date = document.createElement('p'); date.textContent = row.createdAt?.toDate().toLocaleString('vi-VN') || 'Đang đồng bộ';
        const content = document.createElement('p'); content.style.whiteSpace = 'pre-wrap'; content.textContent = row.content;
        const caseCode = document.createElement('p'); caseCode.textContent = `Mã ca: ${row.id}`;
        article.append(title, date, caseCode, content);
        if (row.status === 'new') {
          const button = document.createElement('button'); button.type = 'button'; button.textContent = 'Đánh dấu đã xem';
          button.addEventListener('click', async () => { button.disabled = true; try { await updateDoc(doc(db, 'screeningSubmissions', row.id), {status:'read'}); } catch { status.textContent = 'Không cập nhật được trạng thái. Vui lòng thử lại.'; button.disabled = false; } });
          article.append(button);
        }
        if (row.status === 'new' || row.status === 'read') {
          const accept = document.createElement('button'); accept.type = 'button'; accept.textContent = 'Tiếp nhận và tạo hồ sơ ca';
          accept.addEventListener('click', async () => {
            accept.disabled = true;
            try {
              await runTransaction(db, async transaction => {
                const submission = doc(db, 'screeningSubmissions', row.id);
                const caseRef = doc(db, 'clinicalCases', row.id);
                const snapshot = await transaction.get(submission);
                if (!snapshot.exists() || !['new', 'read'].includes(snapshot.data().status)) throw new Error('already-accepted');
                const entry = { code: row.id, assessment: '', exercise: '', progress: '', status: 'active' };
                transaction.set(caseRef, { ...entry, ownerUid: user.uid, createdAt: serverTimestamp(), updatedAt: serverTimestamp(), lastHistoryId: 'initial' });
                transaction.set(doc(caseRef, 'history', 'initial'), { ...entry, createdAt: serverTimestamp() });
                transaction.update(submission, { status: 'accepted' });
              });
              window.dispatchEvent(new Event('clinical-case-accepted'));
              status.textContent = 'Đã tiếp nhận và tạo hồ sơ ca.';
            } catch { status.textContent = 'Không thể tiếp nhận. Ca có thể đã được tiếp nhận hoặc bạn chưa có quyền.'; accept.disabled = false; }
          });
          article.append(accept);
        }
        list.append(article);
      }
    }, () => { if (current === epoch) status.textContent = 'Không tải được kết quả. Hãy kiểm tra quyền và kết nối.'; });
  } catch { if (current === epoch) status.textContent = 'Không kiểm tra được quyền truy cập.'; }
});
