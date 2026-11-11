(() => {
const $ = id => document.getElementById(id);

// تفعيل أزرار الواجهة العامة فوراً بغض النظر عن حالة الفايربيس
if ($('accountOpen')) {
    $('accountOpen').onclick = () => {
        const modal = $('loginModal');
        if (modal) modal.classList.remove('hidden');
    };
}

if ($('closeModal')) {
    $('closeModal').onclick = () => {
        const modal = $('loginModal');
        if (modal) modal.classList.add('hidden');
    };
}

if ($('switchAdmin')) {
    $('switchAdmin').onclick = () => { 
        $('customerAuth').classList.toggle('hidden'); 
        $('adminAuth').classList.toggle('hidden'); 
        $('switchAdmin').textContent = $('adminAuth').classList.contains('hidden') ? 'دخول صاحب المحل' : 'العودة لدخول الزبائن'; 
    };
}

document.querySelectorAll('.service').forEach(btn => btn.addEventListener('click', () => {
    document.querySelectorAll('.service').forEach(x => x.classList.remove('selected')); 
    btn.classList.add('selected'); 
    if ($('serviceSelect')) $('serviceSelect').value = btn.dataset.service;
}));

// التحقق من جاهزية Firebase للعمليات السحابية
const ready = !!window.auth && !!window.db;
let currentUser = null, isAdmin = false;
let unsub = [], publicUnsub = [];

const ADMIN_UID = "sRzxHot4wdPZPIV5qX5jHrVaddE2"; 
const feedback = (id, msg) => { if($(id)) $(id).textContent = msg || ''; };
const stopListeners = () => { unsub.forEach(fn => fn && fn()); unsub = []; };

const localDate = new Date(Date.now() - new Date().getTimezoneOffset()*60000).toISOString().slice(0,10);
if ($('bookingDate')) $('bookingDate').min = localDate;

if (!ready) {
    if ($('shopState')) $('shopState').textContent = 'يرجى إكمال إعداد Firebase'; 
    if ($('shopDot')) $('shopDot').classList.add('off');
    if ($('bookingForm')) $('bookingForm').onsubmit = e => { e.preventDefault(); feedback('bookingFeedback','التطبيق يحتاج ربط Firebase أولاً.'); };
    if ($('joinQueue')) $('joinQueue').onclick = () => feedback('queueFeedback','التطبيق يحتاج ربط Firebase أولاً.');
    return;
}

const { auth, db } = window;
  const d = s.exists ? s.data() : { open: false }; 
  $('shopState').textContent = d.open ? 'المحل مفتوح الآن' : 'المحل مغلق الآن'; 
  $('shopDot').classList.toggle('off', !d.open); 
  if ($('shopNotice')) $('shopNotice').textContent = d.message || 'أهلاً بك في M.H Barber';
 }, error => console.error("Error reading shop status:", error)));

 publicUnsub.push(db.doc('public/stats').onSnapshot(s => { 
  if ($('queueCount')) $('queueCount').textContent = s.exists ? (s.data().waitingCount || 0) : 0; 
 }, error => console.error("Error reading stats:", error)));
};
listenPublic();

// تسجيل دخول الزبون تلقائياً (Anonymous Auth) أو تسجيل المدير بالبريد
if ($('customerLogin')) {
 $('customerLogin').onclick = async () => {
  try {
   if (!auth.currentUser) {
    await auth.signInAnonymously();
   }
   $('loginModal').classList.add('hidden');
   feedback('authFeedback', 'تم تسجيل الدخول بنجاح كزبون!');
  } catch (e) {
   feedback('authFeedback', 'خطأ في تسجيل الدخول: ' + e.message);
  }
 };
}

if ($('adminLogin')) {
 $('adminLogin').onclick = async () => {
  try {
   await auth.signInWithEmailAndPassword($('adminEmail').value, $('adminPassword').value);
   $('loginModal').classList.add('hidden');
  } catch (e) {
   feedback('authFeedback', 'تعذر تسجيل الدخول كمدير: ' + e.message);
  }
 };
}

// مراقبة حالة المصادقة
auth.onAuthStateChanged(async user => {
 stopListeners(); 
 listenPublic(); 
 currentUser = user; 
 isAdmin = false;
 
 if ($('accountPanel')) $('accountPanel').classList.add('hidden');
 if ($('adminPanel')) $('adminPanel').classList.add('hidden');
 
 if (!user) return;

 // التحقق هل المستخدم هو المدير عبر الـ UID مباشرة (مجاني وآمن)
 isAdmin = (user.uid === ADMIN_UID);

 if (isAdmin) {
  if ($('adminPanel')) $('adminPanel').classList.remove('hidden');
  startAdmin();
 } else {
  if ($('accountPanel')) $('accountPanel').classList.remove('hidden');
  if ($('signedInAs')) $('signedInAs').textContent = 'حالة الزبون: متصل (حجز فوري)';
  startCustomer();
 }
});

// نموذج الحجز المباشر للزبون (بدون Cloud Functions)
if ($('bookingForm')) {
 $('bookingForm').onsubmit = async e => {
  e.preventDefault(); 
  if (!currentUser) return feedback('bookingFeedback', 'يرجى تسجيل الدخول أولاً.'); 
  if (isAdmin) return feedback('bookingFeedback', 'حساب الإدارة لا يستخدم للحجز.');

  try {
   const service = $('serviceSelect') ? $('serviceSelect').value : 'حلاقة شعر';
   const date = $('bookingDate') ? $('bookingDate').value : localDate;
   const time = $('bookingTime') ? $('bookingTime').value : '12:00';

   // التحقق من عدم وجود حجز نشط مسبقاً لهذا الزبون
   const existing = await db.collection('bookings')
    .where('userId', '==', currentUser.uid)
    .where('status', 'in', ['new', 'confirmed'])
    .get();

   if (!existing.empty) {
    throw new Error('لديك حجز نشط بالفعل ولا يمكنك إنشاء حجز آخر حتى يكتمل أو يلغى.');
   }

   await db.collection('bookings').add({
    userId: currentUser.uid,
    service: service,
    date: date,
    time: time,
    status: 'new',
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
   });

   feedback('bookingFeedback', 'تم إرسال طلب الحجز بنجاح! انتظر موافقة المحل.');
  } catch (e) {
   feedback('bookingFeedback', e.message || 'تعذر إنشاء الحجز.');
  }
 };
}

// الانضمام المباشر للطابور
if ($('joinQueue')) {
 $('joinQueue').onclick = async () => {
  if (!currentUser) return feedback('queueFeedback', 'سجّل الدخول أولاً.'); 
  try {
   await db.collection('queue').doc(currentUser.uid).set({
    userId: currentUser.uid,
    status: 'waiting',
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
   }, { merge: true });
   
   // تحديث عداد الطابور العام
   const statsRef = db.doc('public/stats');
   const statsDoc = await statsRef.get();
   let currentCount = statsDoc.exists ? (statsDoc.data().waitingCount || 0) : 0;
   await statsRef.set({ waitingCount: currentCount + 1 }, { merge: true });

   feedback('queueFeedback', 'تم تسجيلك في الطابور بنجاح.');
  } catch (e) {
   feedback('queueFeedback', e.message || 'تعذر الانضمام للطابور.');
  }
 };
}

if ($('logoutBtn')) $('logoutBtn').onclick = () => auth.signOut();

// دوال الزبون
function startCustomer() {
 unsub.push(db.collection('bookings').where('userId', '==', currentUser.uid).onSnapshot(s => {
  const active = s.docs.map(x => ({ id: x.id, ...x.data() })).find(x => ['new', 'confirmed'].includes(x.status));
  if ($('myStatus')) {
   $('myStatus').textContent = active ? `حجزك: ${active.service} — ${active.date} ${active.time} — الحالة: ${statusAr(active.status)}` : 'لا يوجد لديك حجز نشط.';
  }
 }));
}

function statusAr(s) {
 return ({
  new: 'طلب جديد',
  confirmed: 'مؤكد',
  no_show: 'لم يحضر',
  cancelled: 'ملغى',
  completed: 'مكتمل ومدفوع',
  waiting: 'ينتظر',
  in_service: 'قيد الحلاقة',
  done: 'انتهى'
 })[s] || s;
}

// دوال المدير (Admin Panel)
function startAdmin() {
 unsub.push(db.collection('bookings').orderBy('createdAt', 'desc').onSnapshot(s => {
  const docs = s.docs.map(d => ({ id: d.id, ...d.data() })); 
  renderBookings(docs); 
  renderRevenue(docs);
 }));
 
 unsub.push(db.collection('queue').orderBy('createdAt', 'asc').onSnapshot(s => {
  renderQueue(s.docs.map(d => ({ id: d.id, ...d.data() })));
 }));
 
 db.doc('public/shop').get().then(s => {
  if ($('shopMessage')) $('shopMessage').value = s.exists ? (s.data().message || '') : '';
 });
}

function makeAction(text, cls, fn) {
 const b = document.createElement('button');
 b.textContent = text; 
 b.className = cls; 
 b.onclick = fn; 
 return b;
}

function renderBookings(items) {
 const root = $('adminBookings');
 if (!root) return;
 root.replaceChildren();
 
 if (!items.length) {
  root.textContent = 'لا توجد حجوزات بعد.'; 
  return;
 }
 
 items.forEach(b => {
  const row = document.createElement('div');
  row.className = 'booking-row';
  const info = document.createElement('div');
  info.textContent = `زبون — ${b.service} — ${b.date} ${b.time}`;
  const small = document.createElement('small');
  small.textContent = ' الحالة: ' + statusAr(b.status);
  info.append(small);
  
  const actions = document.createElement('div');
  actions.className = 'booking-actions';
  
  if (b.status === 'new') {
   actions.append(makeAction('تأكيد', 'green-btn', () => updateBookingStatus(b.id, 'confirmed')));
  }
  if (['new', 'confirmed'].includes(b.status)) {
   actions.append(makeAction('لم يحضر', 'red-btn', () => updateBookingStatus(b.id, 'no_show')));
   actions.append(makeAction('إلغاء', 'outline', () => updateBookingStatus(b.id, 'cancelled')));
  }
  if (b.status === 'confirmed') {
   actions.append(makeAction('إتمام + تسجيل الدفع', 'gold-btn', async () => {
    const amount = Number(prompt('المبلغ المدفوع بالدينار الجزائري:'));
    if (!Number.isFinite(amount) || amount <= 0) return alert('أدخل مبلغاً صحيحاً.');
    await completeBooking(b.id, amount);
   }));
  }
  row.append(info, actions); 
  root.append(row);
 });
}

async function updateBookingStatus(bookingId, status) {
 try {
  await db.collection('bookings').doc(bookingId).update({ status });
 } catch (e) {
  alert('تعذر تحديث الحجز: ' + e.message);
 }
}

async function completeBooking(bookingId, amount) {
 try {
  await db.collection('bookings').doc(bookingId).update({
   status: 'completed',
   paid: true,
   amount: amount,
   completedAt: firebase.firestore.FieldValue.serverTimestamp()
  });

  // تسجيل الإيرادات في قاعدة البيانات بشكل مجاني
  await db.collection('revenue').add({
   amount: amount,
   bookingId: bookingId,
   createdAt: firebase.firestore.FieldValue.serverTimestamp()
  });

  alert('تم تسجيل الدفع وإتمام الحجز بنجاح!');
 } catch (e) {
  alert('تعذر إتمام العملية: ' + e.message);
 }
}

function renderQueue(items) {
 const root = $('adminQueue');
 if (!root) return;
 root.replaceChildren();
 
 const active = items.filter(x => ['waiting', 'in_service'].includes(x.status));
 if (!active.length) {
  root.textContent = 'لا يوجد أحد في الطابور.'; 
  return;
 }
 
 active.forEach(q => {
  const row = document.createElement('div');
  row.className = 'booking-row';
  const label = document.createElement('span');
  label.textContent = 'زبون ينتظر — ' + statusAr(q.status);
  const actions = document.createElement('div');
  actions.className = 'booking-actions';
  
  if (q.status === 'waiting') {
   actions.append(makeAction('بدء الحلاقة', 'green-btn', () => updateQueueStatus(q.id, 'in_service')));
  }
  if (q.status === 'in_service') {
   actions.append(makeAction('إنهاء', 'gold-btn', async () => {
    await updateQueueStatus(q.id, 'done');
    // خصم عدد المنتظرين في الطابور العام
    const statsRef = db.doc('public/stats');
    const statsDoc = await statsRef.get();
    let currentCount = statsDoc.exists ? (statsDoc.data().waitingCount || 1) : 1;
    await statsRef.set({ waitingCount: Math.max(0, currentCount - 1) }, { merge: true });
   }));
  }
  row.append(label, actions); 
  root.append(row);
 });
}

async function updateQueueStatus(uid, status) {
 try {
  await db.collection('queue').doc(uid).update({ status });
 } catch (e) {
  alert('تعذر تحديث الطابور: ' + e.message);
 }
}

// أزرار التحكم بالحالة العامة للمحل من لوحة الإدارة
if ($('openShop')) {
 $('openShop').onclick = () => updateShopState(true, $('shopMessage') ? $('shopMessage').value : '');
}
if ($('closeShop')) {
 $('closeShop').onclick = () => updateShopState(false, $('shopMessage') ? $('shopMessage').value : '');
}
if ($('saveMessage')) {
 $('saveMessage').onclick = async () => {
  const shopDoc = await db.doc('public/shop').get();
  const isOpen = shopDoc.exists ? shopDoc.data().open : false;
  updateShopState(isOpen, $('shopMessage') ? $('shopMessage').value : '');
 };
}

async function updateShopState(open, message) {
 try {
  await db.doc('public/shop').set({ open, message }, { merge: true });
  alert('تم تحديث حالة المحل بنجاح!');
 } catch (e) {
  alert('تعذر تحديث حالة المحل: ' + e.message);
 }
}

// حساب وعرض الإيرادات (يومي، شهري، سنوي)
function renderRevenue(items) {
 const paid = items.filter(x => x.status === 'completed' && x.paid && x.completedAt);
 const now = new Date();
 let d = 0, m = 0, y = 0;
 
 paid.forEach(x => {
  const dt = x.completedAt.toDate();
  const a = Number(x.amount) || 0;
  if (dt.toDateString() === now.toDateString()) d += a;
  if (dt.getMonth() === now.getMonth() && dt.getFullYear() === now.getFullYear()) m += a;
  if (dt.getFullYear() === now.getFullYear()) y += a;
 });
 
 if ($('revDay')) $('revDay').textContent = d.toLocaleString('fr-DZ') + ' دج';
 if ($('revMonth')) $('revMonth').textContent = m.toLocaleString('fr-DZ') + ' دج';
 if ($('revYear')) $('revYear').textContent = y.toLocaleString('fr-DZ') + ' دج';
}
})();
