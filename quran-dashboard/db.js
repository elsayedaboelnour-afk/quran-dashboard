// ==========================================
// QURAN DASHBOARD - DATABASE LAYER
// ==========================================
// This layer currently uses LocalStorage for zero-setup local testing.
// Because the methods return Promises (async), it will be very easy
// to replace the internals with Firebase/Supabase later when hosting.

const DEFAULT_DATA = {
  studentOfWeek: {
    name: 'عمر عبد الرحمن',
    achievement: 'إتمام حفظ جزء عم وتبارك بتقدير ممتاز',
    image: 'student.png' // Local image fallback
  },
  bestTeacher: {
    name: 'أ. فاطمة الزهراء',
    achievement: 'أفضل محفظة لشهر ربيع الأول - تقديراً لجهودها المتميزة',
    image: 'girl.png' 
  },
  announcements: [
    { id: 1, title: 'مسابقة الماهر بالقرآن', desc: 'التسجيل مفتوح حتى نهاية الأسبوع الحالي عبر الإدارة', icon: '🏆' },
    { id: 2, title: 'دورة التجويد المكثفة', desc: 'تبدأ يوم السبت القادم بعد صلاة العصر مباشرة', icon: '📚' }
  ],
  schedule: [
    { id: 1, time:'9:00 ص - 4:00 م', name:'حلقات التحفيظ والمراجعة', badge:'memorization', badgeText:'للرجال' },
    { id: 2, time:'4:00 م - 8:00 م', name:'حلقات التحفيظ والمراجعة', badge:'tajweed', badgeText:'للنساء والفتيات' },
  ],
  tickerMessages: [
    '📖 مرحباً بكم في دار ابن الجزري لتحفيظ القرآن الكريم',
    'نسعد بانضمامكم إلى حلقات التحفيظ والتجويد',
    '﴿ إِنَّا نَحْنُ نَزَّلْنَا الذِّكْرَ وَإِنَّا لَهُ لَحَافِظُونَ ﴾',
    'التسجيل مفتوح للفصل الدراسي الجديد',
    '﴿ وَرَتِّلِ الْقُرْآنَ تَرْتِيلًا ﴾',
    'حلقات التحفيظ يومياً بعد صلاة الفجر والعصر والمغرب'
  ]
};

const DB_KEY = 'quran_dashboard_db';

class DatabaseAPI {
  constructor() {
    this._initDB();
  }

  _initDB() {
    const raw = localStorage.getItem(DB_KEY);
    if (!raw) {
      localStorage.setItem(DB_KEY, JSON.stringify(DEFAULT_DATA));
    }
  }

  async _getData() {
    return JSON.parse(localStorage.getItem(DB_KEY));
  }

  async _saveData(data) {
    localStorage.setItem(DB_KEY, JSON.stringify(data));
  }

  // === STUDENT OF THE WEEK ===
  async getStudentOfWeek() {
    const data = await this._getData();
    return data.studentOfWeek;
  }

  async updateStudentOfWeek(student) {
    const data = await this._getData();
    data.studentOfWeek = student;
    await this._saveData(data);
  }

  // === BEST TEACHER ===
  async getBestTeacher() {
    const data = await this._getData();
    return data.bestTeacher;
  }

  async updateBestTeacher(teacher) {
    const data = await this._getData();
    data.bestTeacher = teacher;
    await this._saveData(data);
  }

  // === ANNOUNCEMENTS ===
  async getAnnouncements() {
    const data = await this._getData();
    return data.announcements || [];
  }

  async addAnnouncement(announcement) {
    const data = await this._getData();
    announcement.id = Date.now(); // Simple ID generation
    data.announcements.push(announcement);
    await this._saveData(data);
  }

  async deleteAnnouncement(id) {
    const data = await this._getData();
    data.announcements = data.announcements.filter(a => a.id !== id);
    await this._saveData(data);
  }

  // === SCHEDULE ===
  async getSchedule() {
    const data = await this._getData();
    return data.schedule || [];
  }
  
  async saveSchedule(scheduleArray) {
    const data = await this._getData();
    data.schedule = scheduleArray;
    await this._saveData(data);
  }
  
  // Admin Login (Simple local password protection)
  // Default password is 'admin123'
  async login(password) {
    const storedHash = localStorage.getItem('admin_pwd') || 'admin123';
    return password === storedHash;
  }
  
  async changePassword(newPassword) {
    localStorage.setItem('admin_pwd', newPassword);
  }
  // === TICKER MESSAGES ===
  async getTickerMessages() {
    const data = await this._getData();
    return data.tickerMessages || [];
  }

  async updateTickerMessages(messages) {
    const data = await this._getData();
    data.tickerMessages = messages;
    await this._saveData(data);
  }
}

// Global instance
window.db = new DatabaseAPI();
