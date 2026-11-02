// Chỉ thêm sau khi đã xác minh danh tính, tên hiển thị và quyền chuyên môn.
import { applicationDefault, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
const [projectId, uid, ...parts] = process.argv.slice(2);
const name = parts.join(' ').trim();
if (!['edutrace-ai', 'demo-edutrace'].includes(projectId) || !/^[A-Za-z0-9_-]{1,128}$/.test(uid || '') || !name || name.length > 120) throw new Error('Dùng: node scripts/link-clinician-directory.js <project> <UID> "Tên bác sĩ đã xác minh"');
if ((projectId === 'demo-edutrace') !== Boolean(process.env.FIRESTORE_EMULATOR_HOST && process.env.FIREBASE_AUTH_EMULATOR_HOST)) throw new Error('Cấu hình emulator không khớp dự án.');
const app = initializeApp({projectId, credential: applicationDefault()});
const user = await getAuth(app).getUser(uid);
if (user.disabled || user.customClaims?.clinician !== true) throw new Error('Tài khoản chưa có quyền chuyên môn hoặc đã bị khóa.');
await getFirestore(app).collection('clinicianDirectory').doc(uid).create({name, active:true});
console.log('Đã thêm bác sĩ đã xác minh; mục có sẵn sẽ không bị ghi đè.');
