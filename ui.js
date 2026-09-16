/* Impress, Utena. Viskas, kas turi veikti iš karto ir be GSAP: būsenos ženkliukas pagal Europe/Vilnius laiką,
   antraštės ženklas, pasirodymas slenkant, registracijos vedlys (kryptis → meistras → laikas → SMS/skambutis),
   telefono juosta. Įkeliama sinchroniškai po masters.js. */
(function () {
  'use strict';
  var I = window.IMPRESS;
  if (!I) return;
  var doc = document, root = doc.documentElement;
  var q = function (s, r) { return (r || doc).querySelector(s); };
  var qa = function (s, r) { return Array.prototype.slice.call((r || doc).querySelectorAll(s)); };
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- įrankių simboliai <use href="#t-…"> iš viršelio piešinių ---------- */
  (function defineSymbols() {
    var tools = qa('.col .tool');
    if (!tools.length) return;
    var NS = 'http://www.w3.org/2000/svg';
    var svg = doc.createElementNS(NS, 'svg');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('width', '0'); svg.setAttribute('height', '0');
    svg.style.position = 'absolute'; svg.style.width = '0'; svg.style.height = '0'; svg.style.overflow = 'hidden';
    var FILL = { 'f-1': '.1', 'f-2': '.12', 'f-3': '.18', 'f-9': '.85' };
    tools.forEach(function (t) {
      var sym = doc.createElementNS(NS, 'symbol');
      sym.setAttribute('id', 't-' + t.getAttribute('data-tool'));
      sym.setAttribute('viewBox', '0 0 200 260');
      sym.setAttribute('overflow', 'visible');
      Array.prototype.forEach.call(t.childNodes, function (n) { sym.appendChild(n.cloneNode(true)); });
      /* dokumento CSS nepasiekia <use> šešėlio, todėl klasės verčiamos į atributus */
      qa('[class]', sym).forEach(function (el) {
        var cls = el.getAttribute('class') || '';
        Object.keys(FILL).forEach(function (k) { if (cls.indexOf(k) > -1) { el.setAttribute('fill', 'currentColor'); el.setAttribute('fill-opacity', FILL[k]); } });
        if (/\bacc/.test(cls)) { el.setAttribute('fill', 'currentColor'); el.setAttribute('fill-opacity', '.45'); el.setAttribute('stroke', 'none'); }
        if (/\bthin\b/.test(cls)) { el.setAttribute('stroke-opacity', '.45'); el.setAttribute('stroke-width', '1.2'); }
        if (/\bheavy\b/.test(cls)) { el.setAttribute('stroke-width', '5'); }
        el.removeAttribute('class');
      });
      svg.appendChild(sym);
    });
    doc.body.appendChild(svg);
  })();

  /* ---------- Dabar atidaryta / Šiandien uždaryta (Europe/Vilnius) ---------- */
  var HOURS = I.SALON.hours;
  var DAYS = ['sekmadienį', 'pirmadienį', 'antradienį', 'trečiadienį', 'ketvirtadienį', 'penktadienį', 'šeštadienį'];
  function vilniusNow() {
    var forced = /[?&]now=([^&]+)/.exec(location.search);
    if (forced) {
      var m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(decodeURIComponent(forced[1]));
      if (m) return { day: new Date(+m[1], +m[2] - 1, +m[3]).getDay(), h: +m[4], min: +m[5] };
    }
    try {
      var parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Vilnius', weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(new Date());
      var o = {}; parts.forEach(function (p) { o[p.type] = p.value; });
      var day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(o.weekday);
      return { day: day < 0 ? new Date().getDay() : day, h: +o.hour % 24, min: +o.minute };
    } catch (e) {
      var d = new Date(); return { day: d.getDay(), h: d.getHours(), min: d.getMinutes() };
    }
  }
  function hh(h) { return h + ':00'; }
  function status() {
    var n = vilniusNow(), t = n.h + n.min / 60, today = HOURS[n.day], next = HOURS[(n.day + 1) % 7];
    if (today && t >= today[0] && t < today[1]) return { cls: 'open', text: 'Dabar atidaryta · iki ' + hh(today[1]), short: 'Atidaryta iki ' + hh(today[1]) };
    if (today && t < today[0]) return { cls: 'closed', text: 'Šiandien atidaroma ' + hh(today[0]), short: 'Atidaroma ' + hh(today[0]) };
    return { cls: 'closed', text: 'Šiandien uždaryta · rytoj nuo ' + hh(next[0]), short: 'Uždaryta · rytoj ' + hh(next[0]) };
  }
  function paintBadges() {
    var s = status(), narrow = window.innerWidth < 400;
    qa('.badge').forEach(function (b) {
      b.classList.remove('open', 'closed'); b.classList.add(s.cls);
      var t = q('[id^="badgeText"]', b); if (t) t.textContent = (narrow && b.closest('.hdr')) ? s.short : s.text;
    });
  }
  paintBadges();
  setInterval(paintBadges, 60000);
  var rsz; window.addEventListener('resize', function () { clearTimeout(rsz); rsz = setTimeout(paintBadges, 150); });

  /* ---------- antraštė: ženklas pasirodo, kai antraštinis užrašas išslenka ---------- */
  var hdr = q('#hdr'), mast = q('.mast');
  if ('IntersectionObserver' in window && hdr && mast) {
    new IntersectionObserver(function (es) {
      es.forEach(function (e) { hdr.classList.toggle('docked', !e.isIntersecting); hdr.classList.toggle('scrolled', !e.isIntersecting); });
    }, { threshold: 0, rootMargin: '-64px 0px 0px 0px' }).observe(mast);
  } else if (hdr) { hdr.classList.add('docked'); }

  /* ---------- pasirodymas slenkant ---------- */
  var rv = qa('.rv');
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: 0.08, rootMargin: '0px 0px -6% 0px' });
    rv.forEach(function (el) { io.observe(el); });
    setTimeout(function () { rv.forEach(function (el) { el.classList.add('in'); }); }, 2500);
  } else { rv.forEach(function (el) { el.classList.add('in'); }); }

  /* ---------- rubrikos viršelyje: visa kolonėlė veda į savo skyrių ---------- */
  qa('.col').forEach(function (col) {
    col.addEventListener('click', function (e) {
      if (e.target.closest('a')) return;
      var a = q('.more', col); if (a) a.click();
    });
  });

  /* ---------- registracija ---------- */
  var form = q('#regForm'), msgOut = q('#msgOut'), smsBtn = q('#smsBtn'), callBtn = q('#callBtn'), clearBtn = q('#clearBtn');
  var fsMaster = q('#fsMaster'), masterChips = q('#masterChips'), soonBox = q('#soonBox'), fsWhen = q('#fsWhen'), fieldName = q('#fieldName'), nm = q('#nm');
  var stage = q('#stage'), outNote = q('#outNote');
  var state = { dir: '', master: null, when: '', time: '', name: '' };
  var EMPTY = 'Pasirinkite kryptį, ir žinutė susidėlios čia.';

  /* scena: viršelio piešinių kopijos, matoma tik pasirinktos krypties */
  if (stage) qa('.col .tool').forEach(function (t) {
    var c = t.cloneNode(true); c.removeAttribute('data-tool'); c.setAttribute('data-stage', t.getAttribute('data-tool'));
    stage.appendChild(c);
  });
  function showStage(dir) {
    var d = I.dirOf(dir);
    qa('.tool', stage).forEach(function (t) { t.classList.toggle('on', !!d && t.getAttribute('data-stage') === d.tool); });
  }

  function renderMasterChips(dir) {
    var list = I.mastersOf(dir), able = I.bookable(dir), d = I.dirOf(dir);
    masterChips.innerHTML = able.map(function (m) {
      return '<label class="chip"><input type="radio" name="master" value="' + I.esc(m.id) + '">' + I.esc(m.role) + ' ' + I.esc(m.name) + '</label>';
    }).join('');
    if (able.length) {
      soonBox.hidden = true; soonBox.innerHTML = '';
    } else {
      var who = d ? d.whoGen : 'Meistrų';
      soonBox.innerHTML = '<p>' + I.esc(who) + ' kontaktus paskelbsime netrukus. Kol kas registracija telefonu ' + I.esc(I.SALON.phoneText) + '.</p>' +
        '<div class="acts"><a class="btn btn-primary" href="tel:' + I.esc(I.SALON.phone) + '">Skambinti <span class="num">' + I.esc(I.SALON.phoneText) + '</span></a></div>';
      soonBox.hidden = false;
    }
    fsMaster.hidden = !list.length && !d;
    /* vienintelis meistras pažymimas iš karto */
    if (able.length === 1) { q('input', masterChips).checked = true; state.master = able[0]; }
    else state.master = null;
  }

  function setLink(a, href) {
    if (href) { a.setAttribute('href', href); a.removeAttribute('aria-disabled'); a.removeAttribute('role'); }
    else { a.removeAttribute('href'); a.removeAttribute('aria-label'); a.setAttribute('aria-disabled', 'true'); a.setAttribute('role', 'link'); }
  }
  function render() {
    var m = state.master, has = !!(m && m.phone), soon = !!(state.dir && !has);
    fsWhen.hidden = !has; fieldName.hidden = !has;
    smsBtn.hidden = soon;
    if (!state.dir) {
      msgOut.textContent = EMPTY; msgOut.classList.add('empty');
      setLink(smsBtn, ''); setLink(callBtn, '');
      outNote.textContent = 'Žinutė atsidarys jūsų telefono SMS programoje. Prieš siųsdami galėsite ją pataisyti.';
    } else if (!has) {
      var d = I.dirOf(state.dir);
      msgOut.textContent = 'Registracija ' + (d ? d.whoPas : 'pas meistrus') + ' kol kas telefonu ' + I.SALON.phoneText + '.';
      msgOut.classList.add('empty');
      setLink(smsBtn, ''); setLink(callBtn, 'tel:' + I.SALON.phone);
      callBtn.setAttribute('aria-label', 'Skambinti ' + I.SALON.phoneText);
      outNote.textContent = 'Bendras salono numeris. ' + (d ? d.whoGen : 'Meistrų') + ' kontaktus paskelbsime netrukus.';
    } else {
      var text = I.buildText(state);
      if (msgOut.textContent !== text) msgOut.textContent = text;
      msgOut.classList.remove('empty');
      setLink(smsBtn, I.smsHref(m.phone, text)); setLink(callBtn, 'tel:' + m.phone);
      callBtn.setAttribute('aria-label', 'Skambinti ' + m.phoneText);
      outNote.textContent = 'Žinutė bus išsiųsta ' + (m.roleDat || m.role.toLowerCase()) + ' ' + (m.nameDat || m.name) + ' numeriu ' + m.phoneText + '. Prieš siųsdami galėsite ją pataisyti.';
    }
    clearBtn.hidden = !(state.dir || state.when || state.time || state.name);
  }
  function readWhen() {
    var w = q('input[name="when"]:checked', form), t = q('input[name="time"]:checked', form);
    state.when = w ? w.value : ''; state.time = t ? t.value : ''; state.name = nm.value;
  }
  if (form) {
    form.addEventListener('change', function (e) {
      var inp = e.target; if (inp.type !== 'radio') return;
      if (inp.name === 'dir') {
        state.dir = inp.value; renderMasterChips(state.dir); showStage(state.dir);
        try { doc.dispatchEvent(new CustomEvent('impress:dir', { detail: { dir: state.dir, tool: I.dirOf(state.dir).tool } })); } catch (x) {}
      } else if (inp.name === 'master') {
        state.master = I.MASTERS.filter(function (m) { return m.id === inp.value; })[0] || null;
      }
      readWhen(); render();
    });
    /* pakartotinis paspaudimas ant pažymėtos piliulės nuima pasirinkimą (klaviatūrai yra „Išvalyti“) */
    var was = null;
    form.addEventListener('pointerdown', function (e) { var l = e.target.closest('.chip'); was = l && q('input', l).checked ? q('input', l) : null; });
    form.addEventListener('click', function (e) {
      var l = e.target.closest('.chip'); if (!l) return;
      var inp = q('input', l);
      if (was === inp && inp.name !== 'dir' && inp.name !== 'master') { e.preventDefault(); inp.checked = false; was = null; readWhen(); render(); }
    });
    var nmTimer;
    nm.addEventListener('input', function () {
      msgOut.setAttribute('aria-live', 'off'); readWhen(); render();
      clearTimeout(nmTimer); nmTimer = setTimeout(function () { msgOut.setAttribute('aria-live', 'polite'); }, 900);
    });
    form.addEventListener('submit', function (e) { e.preventDefault(); });
    clearBtn.addEventListener('click', function () {
      qa('input[type="radio"]', form).forEach(function (i) { i.checked = false; });
      nm.value = ''; state = { dir: '', master: null, when: '', time: '', name: '' };
      fsMaster.hidden = true; soonBox.hidden = true; masterChips.innerHTML = ''; showStage('');
      render();
      var first = q('input[name="dir"]', form); if (first) { try { first.focus({ preventScroll: true }); } catch (x) { first.focus(); } }
    });
    /* nuoroda be href turi likti rami */
    [smsBtn, callBtn].forEach(function (a) { a.addEventListener('click', function (e) { if (a.getAttribute('aria-disabled') === 'true') e.preventDefault(); }); });
    /* meistrų kortelės iš masters.js (jei index.html dar nesugeneruotas) ir SMS nuorodos kortelėse */
    qa('.cards').forEach(function (c) {
      var g = c.parentNode.id; if (!q('.mcard', c) && g) c.innerHTML = I.renderGroup(g);
    });
    render();
  }

  /* ---------- telefono juosta: slepiasi, kai registracija matoma ---------- */
  var bar = q('#bar'), reg = q('#registracija');
  if (bar && reg && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (es) {
      es.forEach(function (e) { bar.classList.toggle('away', e.isIntersecting); });
    }, { threshold: 0.12 }).observe(reg);
  }
})();
