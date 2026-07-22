// ============================================================
// دار ابن الجزري — DASHBOARD APP v5
// Prayer Events: Warning → Adhan → Between → Adhkar → Normal
// Prayer Times: LIVE from Aladhan API (Egyptian method)
// ============================================================

// ===== PRAYER TIMES CONFIG =====
const PRAYER_API = {
  // Using coordinates for precise calculation
  url: 'https://api.aladhan.com/v1/timings',
  lat: 30.0444,
  lng: 31.2357,
  timezone: 'Africa/Cairo',
  method: 5,  // Egyptian General Authority of Survey
  cityAr: 'القاهرة',
};

// Timing config (seconds) — independent of prayer times
const TIMING_CONFIG = {
  warningBefore: 300,   // 5 min before adhan
  adhanDuration: 300,   // 5 min for adhan display
  betweenDuration: 600, // 10 min between adhan & iqamah
  adhkarStart: 900,     // 15 min after adhan → adhkar begin
  adhkarDuration: 900,  // 15 min of adhkar display
};

// Prayer metadata (static — times are filled from API)
const PRAYER_META = [
  { nameAr: 'الفجر',   key: 'fajr',    apiKey: 'Fajr',    icon: '🌙', hasAdhan: true  },
  { nameAr: 'الشروق',  key: 'sunrise', apiKey: 'Sunrise',  icon: '🌅', hasAdhan: false },
  { nameAr: 'الظهر',   key: 'dhuhr',   apiKey: 'Dhuhr',   icon: '☀️', hasAdhan: true  },
  { nameAr: 'العصر',   key: 'asr',     apiKey: 'Asr',     icon: '🌤', hasAdhan: true  },
  { nameAr: 'المغرب',  key: 'maghrib', apiKey: 'Maghrib',  icon: '🌇', hasAdhan: true  },
  { nameAr: 'العشاء',  key: 'isha',    apiKey: 'Isha',    icon: '🌑', hasAdhan: true  },
];

// Fallback data in case API fails
const FALLBACK_TIMES = { Fajr:'04:18', Sunrise:'06:02', Dhuhr:'13:02', Asr:'16:37', Maghrib:'19:59', Isha:'21:31' };
const FALLBACK_HIJRI = '';

// Parse "HH:MM" or "HH:MM (EET)" → [hour, minute]
function parseApiTime(str) {
  const clean = str.replace(/\s*\(.*\)/, '').trim();
  const [h, m] = clean.split(':').map(Number);
  return [h, m];
}

// Build prayers array from API timings object
function buildPrayers(timings) {
  return PRAYER_META.map(meta => ({
    ...meta,
    time: parseApiTime(timings[meta.apiKey] || FALLBACK_TIMES[meta.apiKey]),
  }));
}

// Build Hijri date string from API response
function buildHijriDate(hijriData) {
  if (!hijriData) return FALLBACK_HIJRI;
  const day = hijriData.day;
  const month = hijriData.month ? hijriData.month.ar : '';
  const year = hijriData.year;
  const weekday = hijriData.weekday ? hijriData.weekday.ar : '';
  return `${day} ${month} ${year} هـ`;
}

// Fetch today's prayer times + Hijri date from Aladhan API
async function fetchPrayerTimes() {
  try {
    const url = `${PRAYER_API.url}?latitude=${PRAYER_API.lat}&longitude=${PRAYER_API.lng}&method=${PRAYER_API.method}&timezonestring=${PRAYER_API.timezone}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    if (json.code === 200 && json.data && json.data.timings) {
      const timings = json.data.timings;
      const hijri = json.data.date && json.data.date.hijri;
      console.log('[Aladhan API] ✅ Prayer times fetched:', timings);
      console.log('[Aladhan API] Date:', json.data.date.readable, '| Hijri:', hijri ? hijri.date : 'N/A');
      return {
        prayers: buildPrayers(timings),
        hijriDate: buildHijriDate(hijri),
      };
    }
    throw new Error('Invalid API response');
  } catch (err) {
    console.warn('[Aladhan API] ⚠️ Failed, using fallback times:', err.message);
    return {
      prayers: buildPrayers(FALLBACK_TIMES),
      hijriDate: FALLBACK_HIJRI,
    };
  }
}

// How many ms until next midnight
function msUntilMidnight() {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 5, 0); // 5 seconds after midnight for safety
  return midnight - now;
}

// Adhan audio URL (Makkah Haram style from IslamCan)
const ADHAN_AUDIO_URL = 'https://www.islamcan.com/audio/adhan/azan1.mp3';

// ===== HADITH COLLECTION =====
const GENERAL_HADITHS = [
  { text:'«\u200Fخَيْرُكُمْ مَنْ تَعَلَّمَ القُرْآنَ وَعَلَّمَهُ\u200F»', meta:'الراوي: عثمان بن عفان رضي الله عنه', source:'رواه البخاري' },
  { text:'«\u200Fمَنْ قَرَأَ حَرْفًا مِنْ كِتَابِ اللَّهِ فَلَهُ بِهِ حَسَنَةٌ، وَالحَسَنَةُ بِعَشْرِ أَمْثَالِهَا\u200F»', meta:'الراوي: عبد الله بن مسعود رضي الله عنه', source:'رواه الترمذي' },
  { text:'«\u200Fاقْرَءُوا القُرْآنَ فَإِنَّهُ يَأْتِي يَوْمَ القِيَامَةِ شَفِيعًا لِأَصْحَابِهِ\u200F»', meta:'الراوي: أبو أمامة الباهلي رضي الله عنه', source:'رواه مسلم' },
  { text:'«\u200Fيُقَالُ لِصَاحِبِ القُرْآنِ: اقْرَأْ، وَارْتَقِ، وَرَتِّلْ كَمَا كُنْتَ تُرَتِّلُ فِي الدُّنْيَا\u200F»', meta:'الراوي: عبد الله بن عمرو رضي الله عنهما', source:'رواه أبو داود والترمذي' }
];

// ===== AYAH COLLECTION =====
const AYAH_COLLECTION = [
  { text:'﴿ إِنَّ هَٰذَا الْقُرْآنَ يَهْدِي لِلَّتِي هِيَ أَقْوَمُ وَيُبَشِّرُ الْمُؤْمِنِينَ ﴾', surah:'سورة الإسراء', ayah:'الآية ٩' },
  { text:'﴿ وَلَقَدْ يَسَّرْنَا الْقُرْآنَ لِلذِّكْرِ فَهَلْ مِن مُّدَّكِرٍ ﴾', surah:'سورة القمر', ayah:'الآية ١٧' },
  { text:'﴿ اقْرَأْ بِاسْمِ رَبِّكَ الَّذِي خَلَقَ ۝ خَلَقَ الْإِنسَانَ مِنْ عَلَقٍ ۝ اقْرَأْ وَرَبُّكَ الْأَكْرَمُ ﴾', surah:'سورة العلق', ayah:'الآيات ١-٣' },
  { text:'﴿ وَرَتِّلِ الْقُرْآنَ تَرْتِيلًا ﴾', surah:'سورة المزمل', ayah:'الآية ٤' },
  { text:'﴿ إِنَّا نَحْنُ نَزَّلْنَا الذِّكْرَ وَإِنَّا لَهُ لَحَافِظُونَ ﴾', surah:'سورة الحجر', ayah:'الآية ٩' },
  { text:'﴿ كِتَابٌ أَنزَلْنَاهُ إِلَيْكَ مُبَارَكٌ لِّيَدَّبَّرُوا آيَاتِهِ ﴾', surah:'سورة ص', ayah:'الآية ٢٩' },
];

// ===== INTERLEAVED CONTENT =====
const INTERLEAVED_CONTENT = [];
const nawawi = typeof NAWAWI_HADITHS !== 'undefined' ? NAWAWI_HADITHS : [];
const ajurri = typeof AJURRI_QUOTES !== 'undefined' ? AJURRI_QUOTES : [];
const bukhari = typeof BUKHARI_HADITHS !== 'undefined' ? BUKHARI_HADITHS : [];
const bios = typeof BIOGRAPHIES !== 'undefined' ? BIOGRAPHIES : [];

if (nawawi.length > 0) {
  for (let i = 0; i < nawawi.length; i++) {
    INTERLEAVED_CONTENT.push({ type: 'nawawi', data: nawawi[i] });
    INTERLEAVED_CONTENT.push({ type: 'ayah', data: AYAH_COLLECTION[i % AYAH_COLLECTION.length] });
    if (bukhari.length > 0) {
      INTERLEAVED_CONTENT.push({ type: 'bukhari', data: bukhari[i % bukhari.length] });
    }
    INTERLEAVED_CONTENT.push({ type: 'general', data: GENERAL_HADITHS[i % GENERAL_HADITHS.length] });
    if (ajurri.length > 0) {
      INTERLEAVED_CONTENT.push({ type: 'ajurri', data: ajurri[i % ajurri.length] });
    }
    // Insert a biography every 3 cycles
    if (bios.length > 0 && i % 3 === 0) {
      INTERLEAVED_CONTENT.push({ type: 'biography', data: bios[Math.floor(i / 3) % bios.length] });
    }
  }
} else {
  AYAH_COLLECTION.forEach(a => INTERLEAVED_CONTENT.push({ type: 'ayah', data: a }));
  GENERAL_HADITHS.forEach(h => INTERLEAVED_CONTENT.push({ type: 'general', data: h }));
  if (bukhari.length > 0) bukhari.forEach(h => INTERLEAVED_CONTENT.push({ type: 'bukhari', data: h }));
  if (ajurri.length > 0) ajurri.forEach(q => INTERLEAVED_CONTENT.push({ type: 'ajurri', data: q }));
  if (bios.length > 0) bios.forEach(b => INTERLEAVED_CONTENT.push({ type: 'biography', data: b }));
}

// ===== BETWEEN ADHAN & IQAMAH — أحاديث فضل الدعاء =====
const BETWEEN_HADITHS = [
  { text:'«\u200Fالدُّعَاءُ لَا يُرَدُّ بَيْنَ الأَذَانِ وَالإِقَامَةِ\u200F»', meta:'رواه أحمد وأبو داود والترمذي' },
  { text:'«\u200Fإِذَا نُودِيَ بِالصَّلَاةِ فُتِحَتْ أَبْوَابُ السَّمَاءِ وَاسْتُجِيبَ الدُّعَاءُ\u200F»', meta:'رواه الطبراني' },
  { text:'«\u200Fإِذَا سَمِعْتُمُ المُؤَذِّنَ فَقُولُوا مِثْلَ مَا يَقُولُ ثُمَّ صَلُّوا عَلَيَّ\u200F»', meta:'رواه مسلم' },
  { text:'«\u200Fمَنْ قَالَ حِينَ يَسْمَعُ النِّدَاءَ: اللَّهُمَّ رَبَّ هَذِهِ الدَّعْوَةِ التَّامَّةِ وَالصَّلَاةِ القَائِمَةِ آتِ مُحَمَّدًا الوَسِيلَةَ وَالفَضِيلَةَ ... حَلَّتْ لَهُ شَفَاعَتِي يَوْمَ القِيَامَةِ\u200F»', meta:'رواه البخاري' },
  { text:'«\u200Fثِنْتَانِ لَا تُرَدَّانِ أَوْ قَلَّمَا تُرَدَّانِ: الدُّعَاءُ عِنْدَ النِّدَاءِ وَعِنْدَ البَأْسِ حِينَ يُلْحِمُ بَعْضُهُمْ بَعْضًا\u200F»', meta:'رواه أبو داود' },
  { text:'«\u200Fأَقْرَبُ مَا يَكُونُ العَبْدُ مِنْ رَبِّهِ وَهُوَ سَاجِدٌ فَأَكْثِرُوا الدُّعَاءَ\u200F»', meta:'رواه مسلم' },
];

// ===== POST-PRAYER ADHKAR =====
const POST_PRAYER_ADHKAR = [
  { text:'أَسْتَغْفِرُ اللَّهَ، أَسْتَغْفِرُ اللَّهَ، أَسْتَغْفِرُ اللَّهَ', count:'٣ مرات', instruction:'يُقال بعد السلام مباشرة' },
  { text:'اللَّهُمَّ أَنْتَ السَّلَامُ وَمِنْكَ السَّلَامُ تَبَارَكْتَ يَا ذَا الجَلَالِ وَالإِكْرَامِ', count:'مرة واحدة', instruction:'رواه مسلم' },
  { text:'لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ المُلْكُ وَلَهُ الحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ', count:'مرة واحدة', instruction:'متفق عليه' },
  { text:'لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ', count:'مرة واحدة', instruction:'رواه مسلم' },
  { text:'اللَّهُمَّ لَا مَانِعَ لِمَا أَعْطَيْتَ وَلَا مُعْطِيَ لِمَا مَنَعْتَ وَلَا يَنْفَعُ ذَا الجَدِّ مِنْكَ الجَدُّ', count:'مرة واحدة', instruction:'متفق عليه' },
  { text:'سُبْحَانَ اللَّهِ (٣٣) الحَمْدُ لِلَّهِ (٣٣) اللَّهُ أَكْبَرُ (٣٣)', count:'٣٣ مرة لكل', instruction:'رواه مسلم' },
  { text:'لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ المُلْكُ وَلَهُ الحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ', count:'تمام المائة', instruction:'رواه مسلم — يقال بعد التسبيح' },
  { text:'﴿ اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ ۚ لَا تَأْخُذُهُ سِنَةٌ وَلَا نَوْمٌ ﴾', count:'آية الكرسي', instruction:'يقرأها بعد كل صلاة مكتوبة' },
];

// Dynamic data is now fetched from db.js (DatabaseAPI)

const CENTER_STATS = [
  { icon:'👨‍🎓', label:'طالب مسجل', value:'٦٢٠' },
  { icon:'👨‍🏫', label:'محفظ ومحفظة', value:'١١' },
  { icon:'📖', label:'حلقات فردية لكل طالب', value:'يومياً' },
  { icon:'🕌', label:'درس الاستهداء بالقرآن', value:'كل جمعة' },
];

const CONTENT_INTERVAL = 12000;
const BETWEEN_INTERVAL = 8000;
const ADHKAR_INTERVAL = 10000;

// ===== ADHAN TEXT LINES =====
const ADHAN_LINES = [
  'اللَّهُ أَكْبَرُ اللَّهُ أَكْبَرُ',
  'اللَّهُ أَكْبَرُ اللَّهُ أَكْبَرُ',
  'أَشْهَدُ أَنْ لَا إِلَهَ إِلَّا اللَّهُ',
  'أَشْهَدُ أَنْ لَا إِلَهَ إِلَّا اللَّهُ',
  'أَشْهَدُ أَنَّ مُحَمَّدًا رَسُولُ اللَّهِ',
  'أَشْهَدُ أَنَّ مُحَمَّدًا رَسُولُ اللَّهِ',
  'حَيَّ عَلَى الصَّلَاةِ',
  'حَيَّ عَلَى الصَّلَاةِ',
  'حَيَّ عَلَى الفَلَاحِ',
  'حَيَّ عَلَى الفَلَاحِ',
  'اللَّهُ أَكْبَرُ اللَّهُ أَكْبَرُ',
  'لَا إِلَهَ إِلَّا اللَّهُ',
];

// ===== HELPERS =====
function getHijriDate(d) { try { return new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura',{day:'numeric',month:'long',year:'numeric'}).format(d); } catch{return '';} }
function getArabicDayName(d) { return ['الأحد','الإثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت'][d.getDay()]; }
function getGregorianDateAr(d) { return new Intl.DateTimeFormat('ar',{day:'numeric',month:'long',year:'numeric'}).format(d); }
function formatTime12(h,m) { return `${h%12||12}:${String(m).padStart(2,'0')} ${h>=12?'م':'ص'}`; }
function pad2(n) { return String(n).padStart(2,'0'); }
function toSec(h,m) { return h*3600+m*60; }

// Prayer status — now takes prayers array as parameter
function getPrayerStatus(now, prayers) {
  if (!prayers || prayers.length === 0) return { nextIdx:0, nextPrayer:{nameAr:'...',time:[0,0],icon:'',key:'',hasAdhan:false}, remaining:0, statuses:[] };
  const ts = now.getHours()*3600+now.getMinutes()*60+now.getSeconds();
  let ni=-1;
  for(let i=0;i<prayers.length;i++) { if(toSec(prayers[i].time[0],prayers[i].time[1])>ts){ni=i;break;} }
  if(ni===-1) ni=0;
  const np=prayers[ni], ns=toSec(np.time[0],np.time[1]);
  let rem=ns-ts; if(rem<0) rem+=86400;
  const statuses=prayers.map((_,i)=>{
    if(i===ni) return 'next';
    const ps=toSec(prayers[i].time[0],prayers[i].time[1]);
    if(ni===0) return 'upcoming';
    return ps<ns?'passed':'upcoming';
  });
  return {nextIdx:ni,nextPrayer:np,remaining:rem,statuses};
}

// Determine current display state — now takes prayers array as parameter
// States: 'normal' | 'warning' | 'adhan' | 'between' | 'adhkar'
function getDisplayState(now, prayers) {
  if (!prayers || prayers.length === 0) return { state: 'normal', prayer: null };
  const ts = now.getHours()*3600+now.getMinutes()*60+now.getSeconds();
  const C = TIMING_CONFIG;
  for (const p of prayers) {
    if (!p.hasAdhan) continue;
    const pt = toSec(p.time[0], p.time[1]);
    const diff = ts - pt;

    if (diff >= -C.warningBefore && diff < 0) {
      return { state: 'warning', prayer: p, countdown: -diff };
    }
    if (diff >= 0 && diff < C.adhanDuration) {
      return { state: 'adhan', prayer: p, elapsed: diff };
    }
    if (diff >= C.adhanDuration && diff < C.adhkarStart) {
      return { state: 'between', prayer: p, elapsed: diff - C.adhanDuration };
    }
    if (diff >= C.adhkarStart && diff < C.adhkarStart + C.adhkarDuration) {
      return { state: 'adhkar', prayer: p, elapsed: diff - C.adhkarStart };
    }
  }
  return { state: 'normal', prayer: null };
}

// ===== AUDIO MANAGER =====
let adhanAudio = null;
let audioEnabled = false;

function initAudio() {
  if (adhanAudio) return;
  adhanAudio = new Audio(ADHAN_AUDIO_URL);
  adhanAudio.preload = 'auto';
  adhanAudio.volume = 1.0;
  audioEnabled = true;
}

function playAdhan() {
  if (!adhanAudio || !audioEnabled) return;
  adhanAudio.currentTime = 0;
  adhanAudio.play().catch(() => {});
}

function stopAdhan() {
  if (!adhanAudio) return;
  adhanAudio.pause();
  adhanAudio.currentTime = 0;
}

// ===== REACT =====
const { useState, useEffect, useRef } = React;
const ce = React.createElement;

// --- Shared components ---
function CornerOrnament({className}) {
  return ce('div',{className:`corner-ornament ${className}`},
    ce('svg',{viewBox:'0 0 65 65',fill:'none'},
      ce('path',{d:'M2 2L2 22Q2 32 12 32L32 32Q42 32 42 22L42 2',stroke:'#c9a84c',strokeWidth:'1.8',fill:'none',opacity:'0.55'}),
      ce('path',{d:'M2 2L13 2Q17 2 17 6L17 17Q17 21 13 21L2 21',stroke:'#c9a84c',strokeWidth:'1.2',fill:'none',opacity:'0.3'}),
      ce('circle',{cx:'2',cy:'2',r:'2',fill:'#c9a84c',opacity:'0.65'})
    )
  );
}

function OrnamentDivider({pos}) {
  return ce('div',{className:`ornament-${pos}`},
    ce('span',{className:'ornament-line'}), ce('span',{className:'ornament-diamond small'}),
    ce('span',{className:'ornament-diamond'}), ce('span',{className:'ornament-diamond small'}),
    ce('span',{className:'ornament-line'})
  );
}

function AudioWave() {
  return ce('div',{className:'audio-wave'},
    ...Array.from({length:9},(_,i)=>ce('div',{key:i,className:'audio-wave-bar'}))
  );
}

// --- Header ---
function Header() {
  return ce('header',{className:'header',id:'main-header'},
    ce('img',{src:'image.png',alt:'شعار دار ابن الجزري',className:'header-logo'}),
    ce('div',{className:'header-text'},
      ce('h1',{className:'header-title'},'دار ابن الجزري لتحفيظ القرآن الكريم'),
      ce('p',{className:'header-subtitle'},'مركز تعليمي متميز في خدمة كتاب الله')
    )
  );
}

function StatsStrip() {
  return ce('div',{className:'stats-strip'},
    ...CENTER_STATS.flatMap((s,i)=>{
      const items=[ce('div',{className:'stat-item',key:`s${i}`},ce('span',{className:'stat-icon'},s.icon),ce('span',{className:'stat-value'},s.value),ce('span',null,s.label))];
      if(i<CENTER_STATS.length-1) items.push(ce('div',{className:'stat-divider',key:`d${i}`}));
      return items;
    })
  );
}

// --- NORMAL: Content Card (Interleaved Displays) ---
function NormalContentCard({studentOfWeek, bestTeacher, announcements}) {
  const imageAnns = (announcements || []).filter(a => a.image && a.image.length > 50);
  
  // Build flattened slides array
  const slides = [];
  if (studentOfWeek) slides.push({ type: 'student', data: studentOfWeek });
  if (bestTeacher) slides.push({ type: 'teacher', data: bestTeacher });
  imageAnns.forEach(ann => slides.push({ type: 'announcement', data: ann }));
  INTERLEAVED_CONTENT.forEach(item => slides.push(item));

  const total = slides.length;
  // Start at a random index so refreshing the page shows different content
  const [idx, setIdx] = useState(() => Math.floor(Math.random() * total));
  const [fading, setFading] = useState(false);

  // Safe boundary
  const currentSlide = slides[idx] || slides[0];
  
  // Calculate dynamic duration based on current slide's text length
  let textToRead = '';
  if (currentSlide.type === 'student' || currentSlide.type === 'teacher') textToRead = currentSlide.data.achievement || '';
  else if (currentSlide.type === 'announcement') textToRead = currentSlide.data.title || '';
  else if (currentSlide.type === 'biography') textToRead = currentSlide.data.bio.map(b => b.text).join(' ');
  else textToRead = currentSlide.data.text || '';

  // Base time: 10s. Add 0.4s per word. Cap at 90s max.
  const words = textToRead.split(/\s+/).length;
  const currentDuration = Math.min(90000, Math.max(12000, words * 400)); 

  useEffect(()=>{
    const t = setTimeout(()=>{
      setFading(true);
      setTimeout(()=>{
        setIdx(p=>(p+1)%total);
        setFading(false);
      }, 700);
    }, currentDuration);
    return () => clearTimeout(t);
  }, [idx, total, currentDuration]);
  
  const fc = fading?' fading':'';

  if (!currentSlide) return null;

  if (currentSlide.type === 'student') {
    const st = currentSlide.data;
    return ce('article',{className:'content-card student-main-card'},
      ce('span',{className:'content-type-badge student-badge'},'نجم الأسبوع'),
      ce(CornerOrnament,{className:'top-right'}),ce(CornerOrnament,{className:'top-left'}),
      ce(CornerOrnament,{className:'bottom-right'}),ce(CornerOrnament,{className:'bottom-left'}),
      ce('div',{className:`main-student-content${fc}`},
        ce('img',{src:st.image,alt:st.name,className:'main-student-img'}),
        ce('h2',{className:'main-student-name'},st.name),
        ce('p',{className:'main-student-ach'},st.achievement),
        ce('div',{className:'main-student-stars'},'🌟 🌟 🌟')
      ),
      ce('div',{className:'content-dots'},Array.from({length:Math.min(total, 50)},(_,i)=>ce('span',{key:i,className:`content-dot${i===idx?' active student-active':''}` })))
    );
  }

  if (currentSlide.type === 'teacher') {
    const bt = currentSlide.data;
    return ce('article',{className:'content-card student-main-card'},
      ce('span',{className:'content-type-badge student-badge'},'معلم/ة الشهر'),
      ce(CornerOrnament,{className:'top-right'}),ce(CornerOrnament,{className:'top-left'}),
      ce(CornerOrnament,{className:'bottom-right'}),ce(CornerOrnament,{className:'bottom-left'}),
      ce('div',{className:`main-student-content${fc}`},
        ce('img',{src:bt.image,alt:bt.name,className:'main-student-img'}),
        ce('h2',{className:'main-student-name'},bt.name),
        ce('p',{className:'main-student-ach'},bt.achievement),
        ce('div',{className:'main-student-stars'},'🌟 🌟 🌟')
      ),
      ce('div',{className:'content-dots'},Array.from({length:Math.min(total, 50)},(_,i)=>ce('span',{key:i,className:`content-dot${i===idx?' active student-active':''}` })))
    );
  }

  if (currentSlide.type === 'announcement') {
    const ann = currentSlide.data;
    return ce('article',{className:'content-card ann-image-card', style: {padding: 0, overflow: 'hidden', background: '#000'}},
      ce('div',{className:`ann-image-container${fc}`, style: {width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center'}},
         ce('img',{src:ann.image, alt:ann.title, style: {maxWidth: '100%', maxHeight: '100%', objectFit: 'contain'}})
      ),
      ce('div',{className:'content-dots', style: {position: 'absolute', bottom: '20px', left: '50%', transform: 'translateX(-50%)'}},
        Array.from({length:Math.min(total, 50)},(_,i)=>ce('span',{key:i,className:`content-dot${i===idx?' active':''}` }))
      )
    );
  }

  const isAyah = currentSlide.type === 'ayah';
  const isNawawi = currentSlide.type === 'nawawi';
  const isAjurri = currentSlide.type === 'ajurri';
  const isBukhari = currentSlide.type === 'bukhari';
  const isBio = currentSlide.type === 'biography';
  const item = currentSlide.data;

  let badgeText = isAyah ? 'آية قرآنية'
    : isNawawi ? 'الأربعون النووية'
    : isBukhari ? 'صحيح البخاري'
    : isAjurri ? 'آداب حامل القرآن'
    : isBio ? item.category
    : 'حديث شريف';

  let labelText = isAyah ? 'آية اليوم'
    : isNawawi ? (item.title || 'من كتاب الأربعين النووية')
    : isBukhari ? `${item.book} — ${item.chapter}`
    : isAjurri ? (item.source || 'من كتاب أخلاق حملة القرآن')
    : isBio ? item.name
    : 'فضل القرآن';

  const badgeClass = isAyah ? 'ayah' : isBukhari ? 'bukhari' : isBio ? 'bio-badge' : 'hadith';

  let contentText = item.text;
  if (isBio) {
    contentText = item.bio.map(b => b.text).join(' ');
  }

  // Dynamic font sizing based on text length
  const textLen = contentText ? contentText.length : 0;
  let textStyle = {};
  if (!isAyah) {
    if (textLen > 800) {
      textStyle = { fontSize: '1.8rem', lineHeight: '1.55', marginBottom: '0.4rem' };
    } else if (textLen > 500) {
      textStyle = { fontSize: '2.1rem', lineHeight: '1.65', marginBottom: '0.6rem' };
    } else if (textLen > 300) {
      textStyle = { fontSize: '2.4rem', lineHeight: '1.7', marginBottom: '0.8rem' };
    } else if (textLen > 180) {
      textStyle = { fontSize: '2.7rem', lineHeight: '1.75' };
    }
  }

  return ce('article', {className:'content-card'},
    ce('span', {className:`content-type-badge ${badgeClass}`}, badgeText),
    ce(CornerOrnament,{className:'top-right'}),ce(CornerOrnament,{className:'top-left'}),
    ce(CornerOrnament,{className:'bottom-right'}),ce(CornerOrnament,{className:'bottom-left'}),
    ce(OrnamentDivider,{pos:'top'}),
    ce('p', {className:`card-label${isAyah?' card-label-ayah':isBukhari?' card-label-bukhari':isBio?' card-label-bio':''}`}, labelText),
    ce('blockquote', {className:`card-arabic-text${isAyah?' ayah-style':''}${fc}`, style: textStyle}, contentText),
    ce(OrnamentDivider,{pos:'bottom'}),
    !isAyah ? ce('p', {className:`card-meta${fc}`}, isBio ? `${item.fullName} | ${item.born} - ${item.died} | ${item.birthplace}` : item.meta) : ce('div', {className:`surah-ref${fc}`}, `${item.surah} — ${item.ayah}`),
    (!isAyah && item.source && !isNawawi && !isBukhari && !isBio) ? ce('p', {className:`card-source${fc}`}, item.source) : null,
    ce('div', {className:'content-dots'}, Array.from({length:Math.min(total,50)},(_,i)=>ce('span',{key:i,className:`content-dot${i===idx?(isAyah?' active ayah-active':isBio?' active bio-active':' active'):''}`})))
  );
}

// --- WARNING: 5 min before prayer ---
function WarningCard({prayer, countdown}) {
  const m = Math.floor(countdown/60), s = countdown%60;
  return ce('article',{className:'warning-card'},
    ce('div',{className:'warning-icon'},'🔔'),
    ce('p',{className:'warning-title'},'استعدوا للصلاة'),
    ce('p',{className:'warning-prayer-name'},`صلاة ${prayer.nameAr}`),
    ce('p',{className:'warning-countdown'},`${pad2(m)}:${pad2(s)}`),
    ce('p',{className:'warning-subtitle'},`حان وقت الاستعداد — الأذان بعد ${m > 0 ? m + ' دقيقة' : s + ' ثانية'}`)
  );
}

// --- ADHAN: Playing ---
function AdhanCard({prayer, elapsed}) {
  // Highlight current adhan line based on elapsed time
  const lineIdx = Math.min(Math.floor(elapsed / 22), ADHAN_LINES.length - 1);
  return ce('article',{className:'adhan-card'},
    ce('div',{className:'adhan-mosque-icon'},'🕌'),
    ce('p',{className:'adhan-title'},'الأذان'),
    ce('p',{className:'adhan-prayer-name'},`صلاة ${prayer.nameAr}`),
    ce(OrnamentDivider,{pos:'top'}),
    ...ADHAN_LINES.map((line,i)=>
      ce('p',{key:i,className:`adhan-line${i===lineIdx?' active-line':''}${i<lineIdx?' dim':''}`},line)
    ),
    ce(OrnamentDivider,{pos:'bottom'}),
    ce(AudioWave,null)
  );
}

// --- BETWEEN: Dua hadiths ---
function BetweenCard() {
  const [idx,setIdx] = useState(0);
  const [fading,setFading] = useState(false);
  useEffect(()=>{
    const t=setInterval(()=>{setFading(true);setTimeout(()=>{setIdx(p=>(p+1)%BETWEEN_HADITHS.length);setFading(false);},700);},BETWEEN_INTERVAL);
    return()=>clearInterval(t);
  },[]);
  const h = BETWEEN_HADITHS[idx];
  const fc = fading?' fading':'';
  return ce('article',{className:'between-card'},
    ce(CornerOrnament,{className:'top-right'}),ce(CornerOrnament,{className:'top-left'}),
    ce(CornerOrnament,{className:'bottom-right'}),ce(CornerOrnament,{className:'bottom-left'}),
    ce('div',{className:'between-badge'},'🤲 بين الأذان والإقامة'),
    ce('p',{className:'between-title'},'فضل الدعاء بين الأذان والإقامة'),
    ce(OrnamentDivider,{pos:'top'}),
    ce('blockquote',{className:`between-hadith-text${fc}`},h.text),
    ce(OrnamentDivider,{pos:'bottom'}),
    ce('p',{className:`between-meta${fc}`},h.meta),
    ce('div',{className:'dua-reminder'},'🤲 ادعُ اللَّهَ فإنَّ الدعاءَ لا يُرَدُّ بين الأذان والإقامة'),
    ce('div',{className:'content-dots'},BETWEEN_HADITHS.map((_,i)=>ce('span',{key:i,className:`content-dot${i===idx?' active':''}`})))
  );
}

// --- ADHKAR: Post-prayer ---
function AdhkarCard() {
  const [idx,setIdx] = useState(0);
  const [fading,setFading] = useState(false);
  useEffect(()=>{
    const t=setInterval(()=>{setFading(true);setTimeout(()=>{setIdx(p=>(p+1)%POST_PRAYER_ADHKAR.length);setFading(false);},700);},ADHKAR_INTERVAL);
    return()=>clearInterval(t);
  },[]);
  const a = POST_PRAYER_ADHKAR[idx];
  const fc = fading?' fading':'';
  return ce('article',{className:'adhkar-card'},
    ce(CornerOrnament,{className:'top-right'}),ce(CornerOrnament,{className:'top-left'}),
    ce(CornerOrnament,{className:'bottom-right'}),ce(CornerOrnament,{className:'bottom-left'}),
    ce('div',{className:'adhkar-badge'},'📿 أذكار بعد الصلاة'),
    ce('p',{className:'adhkar-title'},'أذكار ما بعد الصلوات المفروضة'),
    ce(OrnamentDivider,{pos:'top'}),
    ce('blockquote',{className:`adhkar-text${fc}`},a.text),
    ce(OrnamentDivider,{pos:'bottom'}),
    ce('div',{className:'adhkar-count'},`🔁 ${a.count}`),
    ce('p',{className:`adhkar-instruction${fc}`},a.instruction),
    ce('div',{className:'adhkar-progress'},POST_PRAYER_ADHKAR.map((_,i)=>
      ce('span',{key:i,className:`adhkar-progress-dot${i<idx?' done':''}${i===idx?' current':''}`})
    ))
  );
}

// --- Central Display (state router) ---
function CentralDisplay({displayState, dbData}) {
  const {state, prayer, countdown, elapsed} = displayState;
  let card;
  switch(state) {
    case 'warning': card = ce(WarningCard, {prayer, countdown}); break;
    case 'adhan':   card = ce(AdhanCard, {prayer, elapsed}); break;
    case 'between': card = ce(BetweenCard, null); break;
    case 'adhkar':  card = ce(AdhkarCard, null); break;
    default:        card = ce(NormalContentCard, {
      studentOfWeek: dbData?.studentOfWeek, 
      bestTeacher: dbData?.bestTeacher, 
      announcements: dbData?.announcements
    });
  }
  return ce('div',{className:'central-content'}, card);
}

// --- Sidebar components ---
function TimeBlock({now, hijriDate}) {
  return ce('div',{className:'sidebar-block time-block'},
    ce('p',{className:'day-name'},getArabicDayName(now)),
    ce('div',{className:'time-display'},`${pad2(now.getHours())}:${pad2(now.getMinutes())}`,ce('span',{className:'time-seconds'},pad2(now.getSeconds()))),
    ce('p',{className:'date-gregorian'},getGregorianDateAr(now)),
    ce('p',{className:'date-hijri'}, hijriDate || getHijriDate(now))
  );
}

function NextPrayerBlock({now, prayers}) {
  const {nextPrayer,remaining} = getPrayerStatus(now, prayers);
  const h=Math.floor(remaining/3600), m=Math.floor((remaining%3600)/60), s=remaining%60;
  const urgent=remaining<=900;
  return ce('div',{className:'sidebar-block next-prayer-block'},
    ce('p',{className:'block-title'},'الباقي على الصلاة التالية'),
    ce('p',{className:'next-prayer-name'},`صلاة ${nextPrayer.nameAr}`),
    ce('p',{className:'next-prayer-time-actual'},formatTime12(nextPrayer.time[0],nextPrayer.time[1])),
    ce('div',{className:`countdown-container${urgent?' countdown-urgent':''}` },
      ce('div',{className:'countdown-unit'},ce('span',{className:'countdown-value'},pad2(h)),ce('span',{className:'countdown-label'},'ساعة')),
      ce('span',{className:'countdown-separator'},':'),
      ce('div',{className:'countdown-unit'},ce('span',{className:'countdown-value'},pad2(m)),ce('span',{className:'countdown-label'},'دقيقة')),
      ce('span',{className:'countdown-separator'},':'),
      ce('div',{className:'countdown-unit'},ce('span',{className:'countdown-value'},pad2(s)),ce('span',{className:'countdown-label'},'ثانية'))
    )
  );
}

function PrayerTimesList({now, prayers}) {
  const {statuses}=getPrayerStatus(now, prayers);
  return ce('div',{className:'sidebar-block prayer-times-block'},
    ce('p',{className:'block-title'},`مواقيت الصلاة — ${PRAYER_API.cityAr}`),
    ce('ul',{className:'prayer-list'},
      prayers.map((p,i)=>{
        const st=statuses[i];
        return ce('li',{key:p.key,className:`prayer-item ${st}`},
          ce('span',{className:`prayer-icon ${st==='next'?'next-icon':st}`},p.icon),
          ce('span',{className:'prayer-name'},p.nameAr,st==='passed'?ce('span',{className:'prayer-check'},' ✓'):null),
          ce('span',{className:'prayer-time-value'},formatTime12(p.time[0],p.time[1]))
        );
      })
    )
  );
}

function DailySchedule({schedule}) {
  if(!schedule) return null;
  return ce('div',{className:'sidebar-block schedule-block'},
    ce('p',{className:'block-title'},'الحلقات اليومية'),
    ce('ul',{className:'schedule-list'},
      schedule.map((s,i)=>ce('li',{key:i,className:'schedule-item'},
        ce('span',{className:'schedule-time'},s.time),
        ce('span',{className:'schedule-name'},s.name),
        ce('span',{className:`schedule-badge ${s.badge}`},s.badgeText)
      ))
    )
  );
}

function StudentOfWeekBlock({studentOfWeek}) {
  if(!studentOfWeek) return null;
  return ce('div',{className:'sidebar-block student-block'},
    ce('p',{className:'block-title'},'حافظ الأسبوع'),
    ce('div',{className:'student-card'},
      ce('img',{src:studentOfWeek.image,alt:studentOfWeek.name,className:'student-img'}),
      ce('div',{className:'student-info'},
        ce('p',{className:'student-name'},studentOfWeek.name),
        ce('p',{className:'student-ach'},studentOfWeek.achievement)
      )
    )
  );
}

function AnnouncementsBlock({announcements}) {
  if(!announcements) return null;
  return ce('div',{className:'sidebar-block announcements-block'},
    ce('p',{className:'block-title'},'إعلانات المركز'),
    ce('div',{className:'announcements-list'},
      announcements.map((a,i)=>ce('div',{key:i,className:'announcement-item'},
        ce('span',{className:'announcement-icon'},a.icon),
        ce('div',{className:'announcement-content'},
          ce('p',{className:'announcement-title'},a.title),
          ce('p',{className:'announcement-desc'},a.desc)
        )
      ))
    )
  );
}

function SidebarCarousel({dbData}) {
  const [idx, setIdx] = useState(0);
  const [fading, setFading] = useState(false);
  useEffect(() => {
    const t = setInterval(() => {
      setFading(true);
      setTimeout(() => {
        setIdx(p => (p + 1) % 3);
        setFading(false);
      }, 500);
    }, 15000); // Rotate every 15 seconds
    return () => clearInterval(t);
  }, []);

  const fc = fading ? ' fading' : '';
  if(!dbData) return null;
  return ce('div', {className: `sidebar-carousel-container${fc}`},
    idx === 0 ? ce(DailySchedule, {schedule: dbData.schedule}) :
    idx === 1 ? ce(StudentOfWeekBlock, {studentOfWeek: dbData.studentOfWeek}) :
    ce(AnnouncementsBlock, {announcements: dbData.announcements}),
    ce('div', {className: 'sidebar-dots'},
      Array.from({length:3}).map((_,i)=>ce('span',{key:i,className:`sidebar-dot${i===idx?' active':''}`}))
    )
  );
}

function Sidebar({now, prayers, hijriDate, dbData}) {
  return ce('aside',{className:'sidebar'},
    ce(TimeBlock,{now,hijriDate}),ce(NextPrayerBlock,{now,prayers}),ce(PrayerTimesList,{now,prayers}),ce(SidebarCarousel,{dbData})
  );
}

function StatusBar({tickerMessages = []}) {
  const fallback = [
    '📖 مرحباً بكم في دار ابن الجزري لتحفيظ القرآن الكريم',
    'نسعد بانضمامكم إلى حلقات التحفيظ والتجويد',
    '﴿ إِنَّا نَحْنُ نَزَّلْنَا الذِّكْرَ وَإِنَّا لَهُ لَحَافِظُونَ ﴾',
    'التسجيل مفتوح للفصل الدراسي الجديد',
    '﴿ وَرَتِّلِ الْقُرْآنَ تَرْتِيلًا ﴾',
    'حلقات التحفيظ يومياً بعد صلاة الفجر والعصر والمغرب'
  ];
  const messages = tickerMessages.length > 0 ? tickerMessages : fallback;

  return ce('footer',{className:'status-bar'},
    ce('div',{className:'ticker-wrap'},
      ce('div',{className:'ticker-text'},
        ...messages.flatMap((msg, i) => {
          const isVerse = msg.includes('﴿');
          return [
            ce('span',{className: isVerse ? 'verse' : null, key: `msg-${i}`}, msg),
            ce('span',{className:'gold', key: `sep-${i}`},' ✦ ')
          ];
        })
      )
    )
  );
}

// --- Audio Enable Button ---
function AudioOverlay() {
  const [show,setShow] = useState(true);
  const handleClick = () => { initAudio(); setShow(false); };
  if(!show) return null;
  return ce('div',{className:'audio-overlay',onClick:handleClick},
    '🔊', ' اضغط لتفعيل صوت الأذان'
  );
}
// --- Mutuns Interactive Viewer ---
function MutnToolbar({ setMutnView }) {
  const mutunKeys = typeof MUTUNS_DATA !== 'undefined' ? Object.keys(MUTUNS_DATA) : [];
  return ce('div',{className:'mutn-toolbar'},
    ce('button', { className: 'mutn-btn home-btn', onClick: () => setMutnView(null) }, 'الرئيسية'),
    mutunKeys.map(key => 
      ce('button', { 
        key, 
        className: 'mutn-btn', 
        onClick: () => setMutnView(key) 
      }, MUTUNS_DATA[key].title)
    ),
    ce('button', { className: 'mutn-btn pdf-btn', onClick: () => setMutnView('tajweed'), style: {background: '#e67e22'} }, 'مذكرة التجويد (تفاعلي)')
  );
}

function TajweedViewer({ onClose }) {
  const [lessonIdx, setLessonIdx] = useState(0);
  const [fontSize, setFontSize] = useState(20);

  useEffect(() => {
    const t = setTimeout(() => onClose(), 600000);
    return () => clearTimeout(t);
  }, [lessonIdx, fontSize, onClose]);

  const index = typeof TAJWEED_DATA !== 'undefined' ? TAJWEED_DATA : [];
  const currentLesson = index[lessonIdx] || null;

  const handleZoomIn = () => setFontSize(p => Math.min(p + 4, 40));
  const handleZoomOut = () => setFontSize(p => Math.max(p - 4, 14));

  return ce('div', {className:'tajweed-viewer'},
    ce('aside', {className:'tajweed-sidebar'},
      ce('div', {className: 'tajweed-sidebar-header'},
        ce('h3', null, 'فصول وأبواب المذكرة:'),
        ce('button', {className:'tajweed-close-btn', onClick: onClose}, '✖ إغلاق')
      ),
      ce('ul', {className: 'tajweed-chapter-list'},
        index.map((item, i) => 
          ce('li', {
              key: i, 
              className: `tajweed-chapter-item${i === lessonIdx ? ' active' : ''}`, 
              onClick: () => setLessonIdx(i)
            }, 
            ce('span', {className:'chapter-num'}, String(i+1).padStart(2, '0')),
            item.title
          )
        )
      )
    ),
    ce('main', {className: 'tajweed-main-content'},
      ce('div', {className: 'tajweed-content-header'},
        ce('div', {className: 'tajweed-zoom-controls'},
          ce('button', {onClick: handleZoomOut, className: 'zoom-btn'}, '➖'),
          ce('span', {className: 'zoom-level'}, `${fontSize}px`),
          ce('button', {onClick: handleZoomIn, className: 'zoom-btn'}, '➕')
        ),
        ce('div', {className: 'tajweed-category'}, currentLesson ? currentLesson.category : '')
      ),
      currentLesson ? ce('div', {className: 'tajweed-lesson-container', style: {fontSize: `${fontSize}px`}},
        ce('div', {className: 'tajweed-lesson-title-area'},
          ce('h4', {className: 'tajweed-subtitle'}, currentLesson.subtitle),
          ce('h2', {className: 'tajweed-title'}, currentLesson.title)
        ),
        currentLesson.blocks.map((block, i) => {
          if (block.type === 'definition') {
            return ce('div', {key: i, className: 'tajweed-def-card'},
              ce('h3', {className: 'tajweed-def-title'}, 
                ce('span', {className: 'tajweed-icon'}, block.icon), 
                block.title
              ),
              block.lines.map((line, j) => 
                ce('p', {key: j, className: 'tajweed-def-line'},
                  ce('strong', null, line.label), ' ', line.text
                )
              )
            );
          }
          if (block.type === 'callout') {
            return ce('div', {key: i, className: 'tajweed-callout-card'},
              ce('p', {className: 'tajweed-callout-sub'}, block.subtitle),
              ce('div', {className: 'tajweed-callout-oval'}, block.text),
              block.footer && block.footer.length > 0 ? ce('div', {className: 'tajweed-callout-footer'},
                block.footer.map((ft, j) => ce('span', {key: j, className: 'footer-item'}, ft))
              ) : null
            );
          }
          if (block.type === 'cards_row') {
            return ce('div', {key: i, className: 'tajweed-cards-row'},
              block.cards.map((card, j) => 
                ce('div', {key: j, className: 'tajweed-info-card'},
                  ce('h3', {className: 'tajweed-card-title'},
                    ce('span', {className: 'tajweed-icon'}, card.icon),
                    card.title
                  ),
                  card.content ? ce('p', null, card.content) : null,
                  card.examples ? ce('div', {className: 'tajweed-examples'},
                    card.examples.map((ex, k) => ce('span', {key: k, className: 'tajweed-example-item'}, ex))
                  ) : null
                )
              )
            );
          }
          return null;
        })
      ) : null
    )
  );
}

function MutnViewer({ mutnId, onClose }) {
  const [chapterIdx, setChapterIdx] = useState(0); // Default to first chapter
  const [fontSize, setFontSize] = useState(32); // Default font size
  const mutn = typeof MUTUNS_DATA !== 'undefined' ? MUTUNS_DATA[mutnId] : null;
  
  useEffect(() => {
    // Auto close after 5 minutes of inactivity
    const t = setTimeout(() => onClose(), 300000);
    return () => clearTimeout(t);
  }, [chapterIdx, fontSize, onClose]);

  if (!mutn) return null;
  
  const chapters = mutn.chapters || [];
  const currentChapter = chapters[chapterIdx] || { title: '', verses: [] };

  const handleZoomIn = () => setFontSize(p => Math.min(p + 4, 64));
  const handleZoomOut = () => setFontSize(p => Math.max(p - 4, 16));

  return ce('div', {className:'mutn-viewer'},
    
    // Sidebar (Right)
    ce('aside', {className:'mutn-sidebar'},
      ce('div', {className: 'mutn-sidebar-header'},
        ce('h3', null, 'فصول وأبواب المنظومة:'),
        ce('button', {className:'mutn-close-btn', onClick: onClose}, '✖ إغلاق')
      ),
      ce('ul', {className: 'mutn-chapter-list'},
        chapters.map((ch, i) => 
          ce('li', {
              key: i, 
              className: `mutn-chapter-item${i === chapterIdx ? ' active' : ''}`, 
              onClick: () => setChapterIdx(i)
            }, 
            i === chapterIdx ? ce('span', {className:'active-icon'}, '✔') : null,
            ch.title
          )
        )
      )
    ),

    // Main Content (Left)
    ce('main', {className: 'mutn-main-content'},
      
      // Top Toolbar inside main content
      ce('div', {className: 'mutn-content-header'},
        ce('div', {className: 'mutn-zoom-controls'},
          ce('span', {className: 'mutn-note'}, '✍ اضغط بالريموت أو الفأرة للاختيار'),
          ce('button', {onClick: handleZoomOut, className: 'zoom-btn'}, '➖'),
          ce('span', {className: 'zoom-level'}, `${fontSize}px`),
          ce('button', {onClick: handleZoomIn, className: 'zoom-btn'}, '➕')
        ),
        ce('div', {className: 'mutn-title-area'},
          ce('h4', {className: 'mutn-sub-title'}, mutn.title),
          ce('h2', {className: 'mutn-main-title'}, currentChapter.title)
        )
      ),

      // Verses Container
      ce('div', {className:'mutn-verses-container'},
        currentChapter.verses.map((verse, i) => 
          ce('div', {key: i, className:'mutn-verse-row', style: { fontSize: `${fontSize}px` }},
            ce('div', {className:'mutn-shatr shatr-1'}, verse[0]),
            ce('div', {className:'mutn-star'}, '✿'),
            ce('div', {className:'mutn-shatr shatr-2'}, verse[1])
          )
        )
      )
    )
  );
}

// --- App ---
function App() {
  const [now, setNow] = useState(new Date());
  const [prayers, setPrayers] = useState([]);
  const [hijriDate, setHijriDate] = useState('');
  const [apiStatus, setApiStatus] = useState('loading');
  const [dbData, setDbData] = useState(null);
  const [mutnView, setMutnView] = useState(null);
  const prevStateRef = useRef('normal');

  // Load Database Data
  useEffect(() => {
    async function loadDB() {
      const studentOfWeek = await window.db.getStudentOfWeek();
      const bestTeacher = await window.db.getBestTeacher();
      const announcements = await window.db.getAnnouncements();
      const schedule = await window.db.getSchedule();
      const tickerMessages = await window.db.getTickerMessages();
      setDbData({ studentOfWeek, bestTeacher, announcements, schedule, tickerMessages });
    }
    // Poll db every 10s to pick up admin changes seamlessly
    loadDB();
    const t = setInterval(loadDB, 10000);
    return () => clearInterval(t);
  }, []);

  // Clock tick every second
  useEffect(()=>{
    const t=setInterval(()=>setNow(new Date()),1000);
    return()=>clearInterval(t);
  },[]);

  // Fetch prayer times on mount + auto-refresh at midnight
  useEffect(()=>{
    let midnightTimer = null;

    async function loadTimes() {
      setApiStatus('loading');
      const result = await fetchPrayerTimes();
      setPrayers(result.prayers);
      setHijriDate(result.hijriDate);
      setApiStatus(result.prayers.length > 0 ? 'ok' : 'fallback');

      // Schedule next refresh at midnight
      if (midnightTimer) clearTimeout(midnightTimer);
      midnightTimer = setTimeout(() => {
        console.log('[Aladhan API] 🕛 Midnight refresh triggered');
        loadTimes();
      }, msUntilMidnight());
    }

    loadTimes();
    return () => { if (midnightTimer) clearTimeout(midnightTimer); };
  },[]);

  const displayState = getDisplayState(now, prayers);

  // Play/stop adhan audio on state transitions
  useEffect(()=>{
    const prev = prevStateRef.current;
    if(displayState.state === 'adhan' && prev !== 'adhan') {
      playAdhan();
    } else if(displayState.state !== 'adhan' && prev === 'adhan') {
      stopAdhan();
    }
    prevStateRef.current = displayState.state;
  },[displayState.state]);

  // Show loading state while prayers haven't loaded yet
  if (prayers.length === 0 || !dbData) {
    return ce('div',{className:'app-container'},
      ce('div',{className:'bg-pattern'}),
      ce(Header,null),
      ce('div',{style:{flex:1,display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',gap:'16px'}},
        ce('div',{style:{fontSize:'2rem'}}, '🕌'),
        ce('p',{style:{fontFamily:'var(--font-ui)',fontSize:'1.2rem',color:'var(--gold)',fontWeight:'700'}}, 'جاري تحميل مواقيت الصلاة...'),
        ce('p',{style:{fontFamily:'var(--font-ui)',fontSize:'0.8rem',color:'var(--text-muted)'}}, `المصدر: Aladhan API — ${PRAYER_API.cityAr}`)
      )
    );
  }

  return ce('div',{className:'app-container'},
    ce('div',{className:'bg-pattern'}),
    ce('div',{className:'header-area'},
      ce(Header,null),
      ce(MutnToolbar, { setMutnView })
    ),
    mutnView === 'tajweed' ?
      ce('div', {className: 'mutn-overlay-area'}, 
        ce(TajweedViewer, { onClose: () => setMutnView(null) })
      )
    : mutnView ? 
      ce('div', {className: 'mutn-overlay-area'}, 
        ce(MutnViewer, { mutnId: mutnView, onClose: () => setMutnView(null) })
      ) 
    : ce(React.Fragment, null,
        ce(StatsStrip,null),
        ce('div',{className:'main-grid'},
          ce(CentralDisplay,{displayState, dbData}),
          ce(Sidebar,{now, prayers, hijriDate, dbData})
        ),
        ce(StatusBar,{tickerMessages: dbData?.tickerMessages}),
        ce(AudioOverlay,null)
    )
  );
}

// ===== MOUNT =====
ReactDOM.createRoot(document.getElementById('root')).render(ce(App));
