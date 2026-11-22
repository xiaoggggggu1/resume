/* =========================================================
   张小可 · 个人求职主页 — interactions
   ========================================================= */
(function () {
  'use strict';

  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------------------------------------------------
     1. 首屏视频：待机打字  →  互动问候
     --------------------------------------------------------- */
  const hero = {
    media: $('#heroMedia'),
    loop: $('#videoLoop'),
    intro: $('#videoIntro'),
    greet: $('#videoGreet'),
    hit: $('#heroHit'),
    explore: $('#exploreBtn'),
    state: 'idle'
  };

  function safePlay(v) {
    if (!v) return;
    const p = v.play();
    if (p && p.catch) p.catch(() => {});
  }

  function markReady(v) {
    if (v) v.classList.add('ready');
  }

  // 首段（打字机）播完 → 切到尾部无缝循环层
  function toLoopState() {
    if (!hero.intro || !hero.loop) return;
    hero.intro.classList.add('done');
    markReady(hero.loop);
    if (hero.state === 'idle') safePlay(hero.loop);
  }

  function playGreeting() {
    if (!hero.greet || hero.state !== 'idle') return;
    hero.state = 'greeting';
    if (hero.loop) { try { hero.loop.pause(); } catch (e) {} }
    if (hero.intro) { try { hero.intro.pause(); } catch (e) {} }
    hero.media.classList.add('playing');
    hero.explore.classList.remove('show');
    try { hero.greet.currentTime = 0; } catch (e) {}
    hero.greet.classList.add('show');
    const p = hero.greet.play();
    if (p && p.catch) p.catch(() => endGreeting());
  }

  function endGreeting() {
    hero.state = 'idle';
    hero.media.classList.remove('playing');
    hero.greet.classList.remove('show');
    try { hero.greet.pause(); } catch (e) {}
    // 回到待机：直接继续循环层，不重新打字
    if (hero.intro && hero.intro.classList.contains('done')) {
      safePlay(hero.loop);
    } else {
      safePlay(hero.intro);
    }
    setTimeout(() => hero.explore.classList.add('show'), 260);
  }

  if (hero.intro) {
    ['loadeddata', 'canplay'].forEach(ev => hero.intro.addEventListener(ev, () => markReady(hero.intro)));
    hero.intro.addEventListener('ended', toLoopState);
    if (!reduceMotion) {
      safePlay(hero.intro);
      document.addEventListener('visibilitychange', () => {
        if (!document.hidden && hero.state === 'idle') {
          if (hero.intro.classList.contains('done')) safePlay(hero.loop);
          else safePlay(hero.intro);
        }
      });
    } else {
      // 减少动态：直接展示静态首帧
      hero.intro.classList.add('done');
    }
  }

  if (hero.greet) {
    hero.greet.addEventListener('ended', endGreeting);
    hero.greet.addEventListener('timeupdate', () => {
      if (hero.state !== 'greeting') return;
      const d = hero.greet.duration || 1;
      if (hero.greet.currentTime / d > 0.58) hero.explore.classList.add('show');
    });
  }

  [hero.hit, $('#sayHi'), $('#sayHiTop')].forEach(el => {
    if (el) el.addEventListener('click', playGreeting);
  });

  if (hero.explore) {
    hero.explore.addEventListener('click', () => {
      const target = $('#about');
      if (target) target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
    });
  }

  // 键盘：H 打招呼
  document.addEventListener('keydown', e => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const tag = (e.target.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'textarea') return;
    if (e.key === 'h' || e.key === 'H') { e.preventDefault(); playGreeting(); }
  });

  /* ---------------------------------------------------------
     2. 滚动进度 / 顶栏状态 / 导航高亮
     --------------------------------------------------------- */
  const bar = $('#progressBar');
  const topbar = $('#topbar');

  function onScroll() {
    const h = document.documentElement;
    const max = h.scrollHeight - h.clientHeight;
    const p = max > 0 ? (h.scrollTop || document.body.scrollTop) / max : 0;
    if (bar) bar.style.width = (p * 100).toFixed(2) + '%';
    if (topbar) topbar.classList.toggle('solid', (window.scrollY || h.scrollTop) > 60);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // 深色板块内顶栏反色
  const contactSec = $('#contact');
  if (contactSec && topbar && 'IntersectionObserver' in window) {
    const cIO = new IntersectionObserver(entries => {
      entries.forEach(en => topbar.classList.toggle('inverse', en.isIntersecting));
    }, { rootMargin: '-1px 0px -85% 0px', threshold: 0 });
    cIO.observe(contactSec);
  }

  const navLinks = $$('.nav a[data-nav]');
  const sections = navLinks.map(a => $(a.getAttribute('href'))).filter(Boolean);
  if ('IntersectionObserver' in window && sections.length) {
    const navIO = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (!en.isIntersecting) return;
        navLinks.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + en.target.id));
      });
    }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });
    sections.forEach(s => navIO.observe(s));
  }

  /* ---------------------------------------------------------
     3. 滚动出现 / 数字滚动
     --------------------------------------------------------- */
  const revealEls = $$('.reveal');
  if ('IntersectionObserver' in window && !reduceMotion) {
    const io = new IntersectionObserver((entries, obs) => {
      entries.forEach(en => {
        if (!en.isIntersecting) return;
        const el = en.target;
        const siblings = Array.from(el.parentElement.children).filter(c => c.classList.contains('reveal'));
        const i = Math.max(0, siblings.indexOf(el));
        el.style.transitionDelay = Math.min(i * 70, 280) + 'ms';
        el.classList.add('in');
        obs.unobserve(el);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
    revealEls.forEach(el => io.observe(el));
  } else {
    revealEls.forEach(el => el.classList.add('in'));
  }

  // 计数动画
  const counters = $$('[data-count]');
  function runCount(el) {
    const target = parseFloat(el.dataset.count);
    const dec = parseInt(el.dataset.dec || '0', 10);
    if (reduceMotion || isNaN(target)) { el.textContent = target.toFixed(dec); return; }
    const dur = 1100, t0 = performance.now();
    function tick(t) {
      const k = Math.min(1, (t - t0) / dur);
      const e = 1 - Math.pow(1 - k, 3);
      el.textContent = (target * e).toFixed(dec);
      if (k < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }
  if ('IntersectionObserver' in window) {
    const cio = new IntersectionObserver((entries, obs) => {
      entries.forEach(en => { if (en.isIntersecting) { runCount(en.target); obs.unobserve(en.target); } });
    }, { threshold: 0.6 });
    counters.forEach(el => cio.observe(el));
  }

  /* ---------------------------------------------------------
     4. 跑马灯：复制一份实现无缝滚动
     --------------------------------------------------------- */
  const track = $('#marqueeTrack');
  if (track) track.innerHTML += track.innerHTML;

  /* ---------------------------------------------------------
     5. 复制联系方式
     --------------------------------------------------------- */
  const toast = $('#toast');
  let toastTimer = null;
  function showToast(msg) {
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 1900);
  }
  $$('.copy').forEach(btn => {
    btn.addEventListener('click', async () => {
      const text = btn.dataset.copy || btn.textContent.trim();
      try {
        if (navigator.clipboard && window.isSecureContext) {
          await navigator.clipboard.writeText(text);
        } else {
          const ta = document.createElement('textarea');
          ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
          document.body.appendChild(ta); ta.select(); document.execCommand('copy');
          document.body.removeChild(ta);
        }
        showToast(currentLang === 'en' ? 'Copied · ' + text : '已复制 · ' + text);
      } catch (e) {
        showToast(text);
      }
    });
  });

  /* ---------------------------------------------------------
     6. 移动端菜单
     --------------------------------------------------------- */
  const menuBtn = $('#menuBtn');
  const nav = $('#nav');
  if (menuBtn && nav) {
    menuBtn.addEventListener('click', () => {
      const open = nav.classList.toggle('open');
      menuBtn.setAttribute('aria-expanded', String(open));
      menuBtn.textContent = open ? (currentLang === 'en' ? 'Close' : '关闭') : (currentLang === 'en' ? 'Menu' : '菜单');
    });
    nav.addEventListener('click', e => {
      if (e.target.closest('a')) {
        nav.classList.remove('open');
        menuBtn.setAttribute('aria-expanded', 'false');
        menuBtn.textContent = currentLang === 'en' ? 'Menu' : '菜单';
      }
    });
  }

  /* ---------------------------------------------------------
     7. 中英切换
     --------------------------------------------------------- */
  const EN = {
    'nav.about': 'About', 'nav.skills': 'Skills', 'nav.works': 'Practice',
    'nav.resume': 'Resume', 'nav.contact': 'Contact', 'nav.hi': 'Say hi', 'nav.menu': 'Menu',

    'hero.hit': 'Tap the image to say hi to Zhang Xiaoke',
    'hero.tag': 'Tap the frame · Say hi',
    'hero.explore': 'Scroll down',
    'hero.eyebrow': 'Class of 2026 · Applied Mathematics · Kewha Normal University',
    'hero.roleLabel': 'Seeking',
    'hero.role': 'Middle School Math Teacher',
    'hero.tip': 'Tap me in the frame, or press',
    'hero.hi': 'Say hi',
    'hero.browse': 'Scroll down',

    'about.eyebrow': 'About',
    'about.caption': 'Zhang Xiaoke / Mar. 2004 / Shenzhen, Guangdong',
    'about.h1a': 'Turning abstract math',
    'about.h1b': ' into stories students can follow.',
    'about.lead': 'I am Zhang Xiaoke, a 2026 graduate in Applied Mathematics at Kewha Normal University. Most of my four years went into two things: getting math solid, and rehearsing how to teach it.',
    'about.p': 'During my internship at Kehua No.2 Middle School I independently taught high-school mathematics for 60 lessons — from lesson prep and board work to homework review, running the whole teaching loop end to end. I always start by asking where students will get stuck, then design the lesson around that.',
    'about.t1': 'Full teaching loop',
    'about.t1d': 'Lesson prep, delivery and follow-up — handled independently, no one covering for me.',
    'about.t2': 'Rigorous logic',
    'about.t2d': 'A math-trained mind: clear steps when explaining, no detail left unchecked.',
    'about.t3': 'Warm & patient',
    'about.t3d': 'Friendly by nature, willing to spend time finding where a student is truly stuck.',

    'stat1u': 'lessons', 'stat1': 'High-school math taught',
    'stat2': 'Major GPA', 'stat3u': 'roles', 'stat3': 'Student union & campus media',
    'stat4u': 'items', 'stat4': 'Certificates & languages',

    'about.quote': 'Quiet and steady, sincere with people. I keep a high level of enthusiasm for teaching and class management, with a clear career plan.',
    'about.quoteSrc': 'SELF-ASSESSMENT',

    'skills.eyebrow': 'Skills & Interests',
    'skills.t1': 'Teaching & office skills',
    'skills.tag1': 'High-school math teaching', 'skills.tag2': 'Lesson & slide design',
    'skills.tag3': 'Learning analytics', 'skills.tag4': 'Class management',
    'skills.tag5': 'Class meeting organising', 'skills.tag6': 'Teaching-research teamwork',
    'skills.tag7': 'Excel data handling', 'skills.tag8': 'WeChat writing',
    'skills.t2': 'Certificates',
    'cert1': 'Teacher Qualification', 'cert2': 'Mandarin Level 1-B',
    'cert3': 'CET-6', 'cert4': 'CET-4', 'cert5': 'Computer Level 2',
    'skills.t3': 'Interests',
    'skills.note': 'Ratios as stated in the original résumé',
    'hobby1': 'Dance', 'hobby2': 'Singing', 'hobby3': 'English', 'hobby4': 'Basketball',
    'skills.quote': 'I dance, I sing, and I will happily run up and down a court for a whole lesson. Like teaching, all of it is about rhythm.',

    'works.eyebrow': 'Work & Results',
    'works.intro': 'Everything below comes from my internship and campus experience — the work I actually did, and what came out of it.',

    'w1.kicker': 'Internship · Kehua No.2 Middle School', 'w1.unit': 'lessons',
    'w1.t': 'High-school math · 60 lessons, start to finish',
    'w1.d': 'Independently delivered high-school mathematics for 60 lessons: lesson prep, board work, homework review and progress feedback, week by week.',
    'w1.g1': 'Solo teaching', 'w1.g2': 'Lesson prep', 'w1.g3': 'Homework review',

    'w2.kicker': 'Teaching group · Collaboration',
    'w2.t': 'Turning a term plan into weekly steps',
    'w2.d': 'Worked with the teaching-research group to build and execute the term plan — aligned pacing, unified key points and difficulties, so every week had a clear landing point.',
    'w2.g1': 'Collaboration', 'w2.g2': 'Execution',

    'w3.kicker': 'Homeroom · Support',
    'w3.t': 'Class management and themed class meetings',
    'w3.d': 'Supported the homeroom teacher with daily class affairs and organised regular class meetings, keeping both study rhythm and mood in view.',
    'w3.g1': 'Class management', 'w3.g2': 'Class meetings',

    'w4.kicker': 'Campus media · Head of reporting',
    'w4.t': 'One article passed 10,000 reads',
    'w4.d': 'Wrote repeatedly for the university’s official WeChat account, with a single article passing 10,000 reads; awarded “Outstanding Worker” by the campus media centre.',
    'w4.g1': 'Writing', 'w4.g2': 'New media',

    'w5.kicker': 'Student union · President',
    'w5.t': 'Defining department scope, coordinating across teams',
    'w5.d': 'Ran member training and exchange meetings, clarified each department’s remit and collaboration flow to raise overall efficiency; awarded “Outstanding Youth” by the campus media centre.',
    'w5.g1': 'Team management', 'w5.g2': 'Process design', 'w5.g3': 'Cross-team work',

    'resume.eyebrow': 'Résumé',
    'cv.edu': 'EDUCATION',
    'cv.school': 'Kewha Normal University', 'cv.major': 'Applied Mathematics · BA',
    'cv.coursesLabel': 'Core courses: ', 'cv.courses': 'Analysis, Algebra, Geometry, Probability',
    'cv.gpaLabel': 'GPA: ',
    'cv.intern': 'INTERNSHIP',
    'cv.school2': 'Kehua No.2 Middle School', 'cv.role': 'Math Teacher Intern',
    'cv.i1': 'Delivered high-school mathematics lessons, 60 in total',
    'cv.i2': 'Worked with the teaching-research group on term planning and delivery',
    'cv.i3': 'Supported homeroom management and organised regular class meetings',
    'cv.campus': 'CAMPUS',
    'cv.school3': 'Kewha Normal University', 'cv.p1': 'President, Student Union',
    'cv.c1': 'Trained members and organised exchange meetings',
    'cv.c2': 'Defined department scope, coordinated development across teams, improved efficiency',
    'cv.c3': 'Awarded “Outstanding Youth” by the campus media centre',
    'cv.school4': 'Kewha Normal University', 'cv.p2': 'Head of Reporting, Campus Media',
    'cv.c4': 'Repeatedly published on the official account; single article passed 10,000 reads',
    'cv.c5': 'Awarded “Outstanding Worker” by the campus media centre',
    'cv.honor': 'HONOURS',
    'cv.card': 'Teacher profile',
    'cv.card1': 'Seeking', 'cv.card1v': 'Middle school math teacher',
    'cv.card2': 'Teacher certificate', 'cv.card2v': 'Obtained',
    'cv.card3': 'Mandarin', 'cv.card3v': 'Level 1-B',
    'cv.card4': 'English', 'cv.card5': 'Major GPA', 'cv.card6': 'Graduating',
    'h1': 'Outstanding Student Cadre Scholarship', 'h2': 'Outstanding Individual in Social Practice',
    'h3': 'Outstanding Student Scholarship',

    'contact.eyebrow': 'Contact',
    'contact.h1': 'If your school is looking for',
    'contact.h2': 'a young math teacher who cares about the lesson',
    'contact.h3': ', let’s talk.',
    'contact.phone': 'PHONE', 'contact.email': 'EMAIL', 'contact.city': 'BASED IN',
    'contact.cityV': 'Shenzhen, Guangdong', 'contact.status': 'STATUS',
    'contact.statusV': 'Class of 2026 · Open to work',
    'contact.note': 'Tap the phone or email to copy — I reply quickly.',
    'contact.back': 'Back to top',

    'footer.note': 'Personal job-seeking page',
    'footer.made': 'Built with WorkBuddy · Imagery licensed by the owner'
  };

  const zhCache = new Map();   // 记录中文原文
  const zhAttrCache = new Map();
  let currentLang = 'zh';

  function cacheZh() {
    $$('[data-i18n]').forEach(el => {
      if (!zhCache.has(el)) zhCache.set(el, el.textContent);
    });
  }

  function setLang(lang) {
    currentLang = lang;
    document.documentElement.lang = lang === 'en' ? 'en' : 'zh-CN';
    const btn = $('#langBtn');
    if (btn) {
      btn.textContent = lang === 'en' ? '中' : 'EN';
      btn.setAttribute('aria-label', lang === 'en' ? '切换到中文' : 'Switch to English');
    }
    $$('[data-i18n]').forEach(el => {
      const key = el.dataset.i18n;
      if (lang === 'en') {
        if (EN[key] != null) el.textContent = EN[key];
      } else if (zhCache.has(el)) {
        el.textContent = zhCache.get(el);
      }
    });
    if (menuBtn) menuBtn.textContent = nav && nav.classList.contains('open')
      ? (lang === 'en' ? 'Close' : '关闭')
      : (lang === 'en' ? 'Menu' : '菜单');

    document.title = lang === 'en'
      ? 'Zhang Xiaoke · Portfolio | Middle School Math Teacher'
      : '张小可 · 个人求职主页｜中学数学教师';

    try { localStorage.setItem('zxk-lang', lang); } catch (e) {}
  }

  const langBtn = $('#langBtn');
  if (langBtn) {
    langBtn.addEventListener('click', () => setLang(currentLang === 'zh' ? 'en' : 'zh'));
  }
  cacheZh();
  let saved = null;
  try { saved = localStorage.getItem('zxk-lang'); } catch (e) {}
  if (saved === 'en') setLang('en');

  /* ---------------------------------------------------------
     8. 平滑滚动（考虑固定顶栏高度）
     --------------------------------------------------------- */
  $$('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const id = a.getAttribute('href');
      if (!id || id === '#') return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      const top = target.getBoundingClientRect().top + window.scrollY - (id === '#top' ? 0 : 56);
      window.scrollTo({ top, behavior: reduceMotion ? 'auto' : 'smooth' });
    });
  });
})();
