M.H BARBER PREMIUM — دليل التشغيل (عربي)
========================================

محتويات الحزمة
--------------
index.html            واجهة التطبيق
style.css             التصميم
app.js                منطق الواجهة
firebase-config.js    إعدادات مشروع Firebase (تحتاج تعبئة)
firestore.rules       قواعد حماية قاعدة البيانات
functions/            وظائف الخلفية الموثوقة
logo.png              ضع شعارك هنا (غير مرفق عمداً)
background.jpg        ضع صورة الخلفية هنا (غير مرفقة عمداً)
set-admin.js           أداة منح صلاحية الإدارة

مهم جداً قبل الاستخدام
----------------------
هذه حزمة مصدر جاهزة للتخصيص والنشر، لكنها ليست منشورة أو مربوطة بحساب Firebase الخاص بك. يلزم إنشاء مشروع Firebase وإدخال بياناته. لا يمكن تجهيز مفاتيح مشروعك أو إنشاء حساب المالك نيابة عنك.

أولاً: إنشاء Firebase
---------------------
1) افتح https://console.firebase.google.com/ وأنشئ مشروعاً باسم mh-barber.
2) أضف تطبيق Web من إعدادات المشروع (أيقونة </>).
3) انسخ firebaseConfig وضع القيم في firebase-config.js.
4) من Authentication > Sign-in method فعّل Phone و Email/Password.
5) من Authentication > Settings أضف نطاق موقع GitHub Pages ضمن Authorized domains.
6) أنشئ Firestore Database.
7) من Firestore > Rules انسخ محتوى firestore.rules ثم Publish.

ثانياً: نشر وظائف الخلفية
-------------------------
تحتاج Node.js 20 و Firebase CLI، وخطة Firebase التي تسمح بنشر Cloud Functions (قد تتطلب ربط حساب فوترة/Blaze؛ راجع شروط Firebase الحالية قبل التفعيل).

من مجلد المشروع:
  npm install -g firebase-tools
  firebase login
  firebase use --add
  cd functions
  npm install
  cd ..
  firebase deploy --only firestore:rules,functions

أنشئ ملف .firebaserc من .firebaserc.example وضع معرّف مشروعك.

ثالثاً: منح صلاحية صاحب المحل
-----------------------------
1) أنشئ مستخدماً لصاحب المحل في Authentication باستخدام Email/Password.
2) أنشئ Service Account من إعدادات Firebase/Google Cloud واحفظه محلياً باسم service-account.json بجانب set-admin.js.
3) لا ترفع service-account.json إلى GitHub أو ترسله لأي شخص.
4) ثبّت firebase-admin محلياً: npm install firebase-admin
5) شغّل: node set-admin.js بريد-المالك@example.com
6) سجّل خروجاً ثم دخولاً مجدداً في الموقع حتى تُحدّث صلاحيات الحساب.

رابعاً: نشر GitHub Pages
-----------------------
1) أنشئ مستودع GitHub جديداً.
2) ارفع index.html وstyle.css وapp.js وfirebase-config.js.
3) أضف logo.png وbackground.jpg (ضع ملفات صورك الفعلية بهذه الأسماء).
4) Settings > Pages > Deploy from a branch > main > /root > Save.

ملاحظات تشغيلية وحدود النسخة
----------------------------
- واجهة الإدارة لا تظهر إلا للحساب الذي يحمل custom claim باسم admin=true، وقواعد Firestore تمنع القراءة/الكتابة غير المصرح بها.
- إنشاء الحجوزات وإدارة الطابور وتسجيل الإيراد تتم عبر Cloud Functions، وليس من جهاز الزبون مباشرة.
- لكل زبون حجز نشط أو دخول نشط للطابور واحد. يمكنه الحجز مجدداً بعد إتمام الخدمة أو إلغاء الحجز/تسجيل عدم الحضور.
- الموعد نفسه لا يمكن حجزه مرتين.
- الإيراد يُسجل فقط عند تأكيد المالك إتمام الخدمة وإدخال المبلغ المدفوع.
- العداد العام يعرض المنتظرين؛ ينقص عند بدء الخدمة. عند اكتمال الخدمة ينتهي دخول الزبون للطابور.
- لا يوجد دفع إلكتروني داخل التطبيق؛ المبلغ يسجله صاحب المحل بعد استلامه.
- لا يوجد تأكيد تلقائي لوجود الزبون؛ المالك يحدّث حالات الحضور من لوحة الإدارة.
- هذه نسخة أولية قابلة للتطوير. اختبرها في مشروع Firebase تجريبي أولاً، خصوصاً تسجيل الدخول برقم الهاتف، حدود الحجز، قواعد البيانات، وإجراءات الإدارة قبل استخدامها مع زبائن حقيقيين.

استكشاف الأخطاء
----------------
- إذا ظهر إعداد Firebase غير مكتمل: راجع firebase-config.js.
- إذا لم يعمل SMS: تأكد من Phone provider، النطاق المصرح به، إعداد reCAPTCHA، وحصة الرسائل.
- إذا لم تظهر لوحة الإدارة: تأكد من منح custom claim عبر set-admin.js ثم تسجيل الخروج والدخول.
- إذا لم تعمل الأزرار الخلفية: تأكد من نشر Cloud Functions وأن التطبيق يستخدم نفس مشروع Firebase.
