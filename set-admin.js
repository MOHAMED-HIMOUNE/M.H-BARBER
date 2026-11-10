// شغّل هذا الملف محلياً بعد تثبيت firebase-admin وإعداد حساب خدمة آمن.
// لا ترفع ملف service-account.json إلى GitHub مطلقاً.
const admin = require('firebase-admin');
const serviceAccount = require('./service-account.json');
const email = process.argv[2];
if (!email) throw new Error('Usage: node set-admin.js owner@example.com');
admin.initializeApp({credential:admin.credential.cert(serviceAccount)});
(async()=>{const user=await admin.auth().getUserByEmail(email);await admin.auth().setCustomUserClaims(user.uid,{admin:true});console.log('Admin claim assigned to UID:',user.uid);process.exit(0);})().catch(e=>{console.error(e);process.exit(1)});
