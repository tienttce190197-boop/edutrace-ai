import './firebase-auth.js';
import { getApp } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js';
import { getFirestore, collection, query, where, onSnapshot } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js';

const status = document.getElementById('parentSentStatus'), list = document.getElementById('parentSentList');
const labels = {new:'Chờ bác sĩ xem', read:'Bác sĩ đã xem', accepted:'Bác sĩ đã tiếp nhận'};
if (status && list) {
  const auth = getAuth(getApp()), db = getFirestore(getApp());
  let unsubscribe = null, epoch = 0;
  onAuthStateChanged(auth, user => {
    const current = ++epoch;
    unsubscribe?.(); unsubscribe = null; list.replaceChildren();
    if (!user) { status.textContent = 'Đăng nhập để xem thông tin đã gửi.'; return; }
    status.textContent = 'Đang tải...';
    unsubscribe = onSnapshot(query(collection(db,'screeningSubmissions'), where('parentUid','==',user.uid)), snapshot => {
      if (current !== epoch) return;
      list.replaceChildren();
      const entries = snapshot.docs.map(item => item.data()).sort((a,b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
      status.textContent = entries.length ? `${entries.length} thông tin đã gửi` : 'Chưa có thông tin nào được gửi.';
      for (const entry of entries) {
        const row = document.createElement('p');
        row.textContent = `${entry.topic} · ${labels[entry.status] || 'Đang xử lý'}`;
        list.append(row);
      }
    }, () => { if (current === epoch) status.textContent = 'Không tải được thông tin đã gửi.'; });
  });
}
