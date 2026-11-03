import { test } from 'node:test';
import assert from 'node:assert/strict';
import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, connectAuthEmulator, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator, doc, collection, addDoc, getDoc, serverTimestamp, runTransaction } from 'firebase/firestore';
import { initializeApp as initAdmin, deleteApp as deleteAdmin } from 'firebase-admin/app';
import { getAuth as getAdminAuth } from 'firebase-admin/auth';
import { getFirestore as getAdminDb } from 'firebase-admin/firestore';
import { buildTestTransfer } from '../../js/test-transfer-core.js';

test('phụ huynh gửi và bác sĩ nhận tạo một ca riêng trên emulator', async () => {
  if (process.env.FIREBASE_AUTH_EMULATOR_HOST !== '127.0.0.1:19099' || process.env.FIRESTORE_EMULATOR_HOST !== '127.0.0.1:18080') throw Error('Chỉ chạy trên emulator cục bộ.');
  const config = { projectId:'demo-edutrace', apiKey:'demo-key' };
  const makeClient = name => {
    const app = initializeApp(config, name), auth = getAuth(app), db = getFirestore(app);
    connectAuthEmulator(auth, 'http://127.0.0.1:19099', {disableWarnings:true});
    connectFirestoreEmulator(db, '127.0.0.1', 18080);
    return {app,auth,db};
  };
  const suffix = Date.now().toString();
  const parent=makeClient('parent-'+suffix), doctor=makeClient('doctor-'+suffix), other=makeClient('other-'+suffix);
  const admin=initAdmin({projectId:'demo-edutrace'}, 'admin-'+suffix);
  try {
    const p=(await createUserWithEmailAndPassword(parent.auth, 'p'+suffix+'@example.test', 'Demo123456')).user;
    const d=(await createUserWithEmailAndPassword(doctor.auth, 'd'+suffix+'@example.test', 'Demo123456')).user;
    const o=(await createUserWithEmailAndPassword(other.auth, 'o'+suffix+'@example.test', 'Demo123456')).user;
    await getAdminAuth(admin).setCustomUserClaims(d.uid, {clinician:true});
    await getAdminAuth(admin).setCustomUserClaims(o.uid, {clinician:true});
    await d.getIdToken(true); await o.getIdToken(true);
    await getAdminDb(admin).collection('clinicianDirectory').doc(d.uid).set({name:'Bac si demo',active:true});
    const draft=buildTestTransfer({branch:'speech',questions:[{id:1,text:'Câu hỏi thử?'}],answers:{1:'yes'},values:[['Tên trẻ','DEMO'],['Tuổi','28 tháng'],['Người liên hệ','Demo'],['Điện thoại','0900000000']]});
    const submission=await addDoc(collection(parent.db,'screeningSubmissions'), {parentUid:p.uid,clinicianUid:d.uid,...draft,consent:true,status:'new',createdAt:serverTimestamp()});
    await assert.rejects(getDoc(doc(other.db,'screeningSubmissions',submission.id)), {code:'permission-denied'});
    const source=doc(doctor.db,'screeningSubmissions',submission.id), target=doc(doctor.db,'clinicalCases',submission.id);
    await runTransaction(doctor.db, async tx => {
      const snap=await tx.get(source); assert.equal(snap.data().status,'new');
      const entry={code:submission.id,assessment:'',exercise:'',progress:'',status:'active'};
      tx.set(target,{...entry,ownerUid:d.uid,createdAt:serverTimestamp(),updatedAt:serverTimestamp(),lastHistoryId:'initial'});
      tx.set(doc(target,'history','initial'),{...entry,createdAt:serverTimestamp()});
      tx.update(source,{status:'accepted'});
    });
    assert.equal((await getDoc(doc(parent.db,'screeningSubmissions',submission.id))).data().status,'accepted');
    assert.equal((await getDoc(target)).data().ownerUid,d.uid);
    await assert.rejects(getDoc(doc(other.db,'clinicalCases',submission.id)), {code:'permission-denied'});
    await assert.rejects(runTransaction(doctor.db, async tx => {
      const snap=await tx.get(source);
      if (snap.data().status==='accepted') throw Error('already-accepted');
    }), /already-accepted/);
  } finally {
    await Promise.all([deleteApp(parent.app),deleteApp(doctor.app),deleteApp(other.app),deleteAdmin(admin)]);
  }
});
