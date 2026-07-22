// ==========================================
// QURAN DASHBOARD - ADMIN LOGIC
// ==========================================

let isAuthenticated = false;

// --- Authentication ---
async function attemptLogin() {
  const pwd = document.getElementById('admin-password').value;
  const errorMsg = document.getElementById('login-error');
  
  if (await window.db.login(pwd)) {
    isAuthenticated = true;
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('admin-panel').style.display = 'block';
    
    // Store token in session storage so refresh doesn't logout immediately
    sessionStorage.setItem('admin_auth', 'true');
    loadData();
  } else {
    errorMsg.style.display = 'block';
  }
}

function checkSession() {
  if (sessionStorage.getItem('admin_auth') === 'true') {
    isAuthenticated = true;
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('admin-panel').style.display = 'block';
    loadData();
  }
}

function logout() {
  isAuthenticated = false;
  sessionStorage.removeItem('admin_auth');
  document.getElementById('login-screen').style.display = 'flex';
  document.getElementById('admin-panel').style.display = 'none';
  document.getElementById('admin-password').value = '';
}

async function changePassword() {
  const pwd = document.getElementById('new-password').value;
  if (!pwd) return alert('يرجى إدخال كلمة مرور جديدة');
  await window.db.changePassword(pwd);
  alert('تم تغيير كلمة المرور بنجاح');
  document.getElementById('new-password').value = '';
}

// --- Data Loading ---
async function loadData() {
  if (!isAuthenticated) return;
  
  // Student
  const student = await window.db.getStudentOfWeek();
  document.getElementById('student-name').value = student.name;
  document.getElementById('student-ach').value = student.achievement;
  document.getElementById('student-image').value = student.image;
  document.getElementById('preview-img').src = student.image;
  
  if(student.image === 'boy.png' || student.image === 'girl.png') {
    document.querySelector(`input[name="student_img_type"][value="${student.image.split('.')[0]}"]`).checked = true;
    document.getElementById('student-upload').style.display = 'none';
  } else {
    document.querySelector('input[name="student_img_type"][value="upload"]').checked = true;
    document.getElementById('student-upload').style.display = 'block';
  }

  // Teacher
  const teacher = await window.db.getBestTeacher();
  if (teacher) {
    document.getElementById('teacher-name').value = teacher.name;
    document.getElementById('teacher-ach').value = teacher.achievement;
    document.getElementById('teacher-image').value = teacher.image;
    document.getElementById('teacher-preview-img').src = teacher.image;
    
    if(teacher.image === 'girl.png' || teacher.image === 'boy.png') {
      document.querySelector(`input[name="teacher_img_type"][value="${teacher.image.split('.')[0]}"]`).checked = true;
      document.getElementById('teacher-upload').style.display = 'none';
    } else {
      document.querySelector('input[name="teacher_img_type"][value="upload"]').checked = true;
      document.getElementById('teacher-upload').style.display = 'block';
    }
  }
  
  // Announcements
  const announcements = await window.db.getAnnouncements();
  renderAnnouncements(announcements);
  
  // Schedule
  const schedule = await window.db.getSchedule();
  renderSchedule(schedule);
}

// --- Student ---
function handleImageSelection(radio) {
  const fileInput = document.getElementById('student-upload');
  const preview = document.getElementById('preview-img');
  const hiddenData = document.getElementById('student-image');

  if(radio.value === 'boy') {
    fileInput.style.display = 'none';
    preview.src = 'boy.png';
    hiddenData.value = 'boy.png';
  } else if(radio.value === 'girl') {
    fileInput.style.display = 'none';
    preview.src = 'girl.png';
    hiddenData.value = 'girl.png';
  } else {
    fileInput.style.display = 'block';
  }
}

function handleImageUpload(event) {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function(evt) {
      const base64 = evt.target.result;
      document.getElementById('preview-img').src = base64;
      document.getElementById('student-image').value = base64;
    };
    reader.readAsDataURL(file);
  }
}

async function saveStudent() {
  const student = {
    name: document.getElementById('student-name').value,
    achievement: document.getElementById('student-ach').value,
    image: document.getElementById('student-image').value || 'student.png'
  };
  await window.db.updateStudentOfWeek(student);
  alert('تم حفظ بيانات نجم الأسبوع بنجاح!');
}

// --- Best Teacher ---
function handleTeacherImageSelection(radio) {
  const fileInput = document.getElementById('teacher-upload');
  const preview = document.getElementById('teacher-preview-img');
  const hiddenData = document.getElementById('teacher-image');

  if(radio.value === 'girl') {
    fileInput.style.display = 'none';
    preview.src = 'girl.png';
    hiddenData.value = 'girl.png';
  } else if (radio.value === 'boy') {
    fileInput.style.display = 'none';
    preview.src = 'boy.png';
    hiddenData.value = 'boy.png';
  } else {
    fileInput.style.display = 'block';
  }
}

function handleTeacherImageUpload(event) {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function(evt) {
      const base64 = evt.target.result;
      document.getElementById('teacher-preview-img').src = base64;
      document.getElementById('teacher-image').value = base64;
    };
    reader.readAsDataURL(file);
  }
}

async function saveTeacher() {
  const teacher = {
    name: document.getElementById('teacher-name').value,
    achievement: document.getElementById('teacher-ach').value,
    image: document.getElementById('teacher-image').value || 'girl.png'
  };
  await window.db.updateBestTeacher(teacher);
  alert('تم حفظ بيانات أفضل محفظ/ة بنجاح!');
}

// --- Announcements ---
function compressImage(file, callback) {
  const reader = new FileReader();
  reader.onload = function(e) {
    const img = new Image();
    img.onload = function() {
      const canvas = document.createElement('canvas');
      const MAX_WIDTH = 1200;
      const MAX_HEIGHT = 1200;
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
      } else {
        if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; }
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);
      callback(canvas.toDataURL('image/webp', 0.7)); // Compress to WebP
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

function handleAnnImageUpload(event) {
  const file = event.target.files[0];
  if (file) {
    compressImage(file, (base64) => {
      document.getElementById('ann-preview-img').src = base64;
      document.getElementById('ann-preview-img').style.display = 'block';
      document.getElementById('ann-image-data').value = base64;
    });
  }
}

function renderAnnouncements(announcements) {
  const container = document.getElementById('announcements-list');
  container.innerHTML = '';
  announcements.forEach(a => {
    const div = document.createElement('div');
    div.className = 'item-card';
    div.innerHTML = `
      <div>
        <strong>${a.icon} ${a.title}</strong>
        ${a.image ? '<span style="color:var(--gold); font-size:0.8rem; margin-right:10px;">[يحتوي على بوستر]</span>' : ''}
        <p style="font-size: 0.8rem; color: var(--text-muted); margin-top: 4px;">${a.desc}</p>
      </div>
      <div class="item-actions">
        <button class="btn-danger" onclick="deleteAnnouncement(${a.id})">حذف</button>
      </div>
    `;
    container.appendChild(div);
  });
}

async function addAnnouncement() {
  const title = document.getElementById('ann-title').value;
  const desc = document.getElementById('ann-desc').value;
  const icon = document.getElementById('ann-icon').value;
  const image = document.getElementById('ann-image-data').value;
  
  if(!title || !desc) return alert('يرجى تعبئة كافة الحقول');
  
  await window.db.addAnnouncement({ title, desc, icon, image });
  
  // Clear forms
  document.getElementById('ann-title').value = '';
  document.getElementById('ann-desc').value = '';
  document.getElementById('ann-image-data').value = '';
  document.getElementById('ann-upload').value = '';
  document.getElementById('ann-preview-img').style.display = 'none';
  
  const announcements = await window.db.getAnnouncements();
  renderAnnouncements(announcements);
}

async function deleteAnnouncement(id) {
  if(!confirm('هل أنت متأكد من الحذف؟')) return;
  await window.db.deleteAnnouncement(id);
  const announcements = await window.db.getAnnouncements();
  renderAnnouncements(announcements);
}

// --- Schedule ---
function renderSchedule(schedule) {
  const container = document.getElementById('schedule-list');
  container.innerHTML = '';
  schedule.forEach((s, i) => {
    const div = document.createElement('div');
    div.className = 'item-card';
    div.innerHTML = `
      <div>
        <strong style="color:var(--gold);">${s.time}</strong> - ${s.name}
        <span style="background:var(--gold-pale); color:#000; padding:2px 6px; border-radius:4px; font-size:0.7rem;">${s.badgeText}</span>
      </div>
      <div class="item-actions">
        <button class="btn-danger" onclick="deleteSchedule(${i})">حذف</button>
      </div>
    `;
    container.appendChild(div);
  });
}

async function addSchedule() {
  const time = document.getElementById('sch-time').value;
  const name = document.getElementById('sch-name').value;
  const badgeText = document.getElementById('sch-badgeText').value;
  const badge = document.getElementById('sch-badge').value;
  
  if(!time || !name) return alert('يرجى إدخال الوقت والوصف');
  
  const schedule = await window.db.getSchedule();
  schedule.push({ id: Date.now(), time, name, badgeText, badge });
  await window.db.saveSchedule(schedule);
  
  // Clear forms
  document.getElementById('sch-time').value = '';
  document.getElementById('sch-name').value = '';
  
  renderSchedule(await window.db.getSchedule());
}

async function deleteSchedule(index) {
  if(!confirm('هل أنت متأكد من الحذف؟')) return;
  const schedule = await window.db.getSchedule();
  schedule.splice(index, 1);
  await window.db.saveSchedule(schedule);
  renderSchedule(await window.db.getSchedule());
}

// Init
checkSession();
