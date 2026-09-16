/* Impress, Utena. Tik GSAP: viršelio įžanga (raidės, rubrikos, įrankiai nusipiešia linija), įrankių gestai
   (žirklės kerpa, pipetė lašina, lakas išsitraukia), žingsnių numeriai nusidažo slenkant. Be GSAP viską rodo CSS. */
(function () {
  'use strict';
  var root = document.documentElement;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!window.gsap || reduce) { root.classList.add('nogs'); return; }
  var gsap = window.gsap;
  if (window.ScrollTrigger) gsap.registerPlugin(window.ScrollTrigger);
  root.classList.add('gs');
  var qa = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var hoverable = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* ---------- gestai ---------- */
  function gesture(svg) {
    var kind = svg.getAttribute('data-tool') || svg.getAttribute('data-stage');
    var tl = gsap.timeline({ paused: true });
    if (kind === 'scissors') {
      var a = svg.querySelector('.sc-a'), b = svg.querySelector('.sc-b');
      tl.to(a, { rotation: 13, svgOrigin: '100 132', duration: .3, ease: 'power2.out' })
        .to(b, { rotation: -13, svgOrigin: '100 132', duration: .3, ease: 'power2.out' }, '<')
        .to([a, b], { rotation: 0, duration: .22, ease: 'power2.in' })
        .to(a, { rotation: 9, duration: .24, ease: 'power2.out' })
        .to(b, { rotation: -9, duration: .24, ease: 'power2.out' }, '<')
        .to([a, b], { rotation: 0, duration: .2, ease: 'power2.in' });
    } else if (kind === 'dropper') {
      var pip = svg.querySelector('.dp-pip'), drop = svg.querySelector('.dp-drop');
      tl.to(pip, { y: -6, duration: .22, ease: 'power2.out' })
        .fromTo(drop, { y: 0, autoAlpha: 1 }, { y: 58, duration: .5, ease: 'power2.in' }, .1)
        .to(drop, { autoAlpha: 0, duration: .1 }, '-=.06')
        .to(pip, { y: 0, duration: .4, ease: 'power2.inOut' }, .35)
        .set(drop, { y: 0 })
        .to(drop, { autoAlpha: 1, duration: .35, ease: 'power1.out' });
    } else if (kind === 'polish') {
      var cap = svg.querySelector('.pl-cap');
      tl.to(cap, { y: -64, rotation: -18, svgOrigin: '100 74', duration: .5, ease: 'power3.out' })
        .to(cap, { x: 6, duration: .18, ease: 'sine.inOut' })
        .to(cap, { x: -4, duration: .18, ease: 'sine.inOut' })
        .to(cap, { x: 0, y: 0, rotation: 0, duration: .5, ease: 'power2.inOut' });
    }
    svg._gesture = tl;
    return tl;
  }
  var coverTools = qa('.col .tool');
  coverTools.forEach(gesture);
  qa('#stage .tool').forEach(gesture);

  function play(svg) { if (svg && svg._gesture) svg._gesture.restart(); }
  qa('.col').forEach(function (col) {
    var t = col.querySelector('.tool');
    if (hoverable) col.addEventListener('pointerenter', function () { if (introDone) play(t); });
    else if (window.ScrollTrigger) window.ScrollTrigger.create({ trigger: col, start: 'top 78%', onEnter: function () { if (introDone) play(t); }, onEnterBack: function () { if (introDone) play(t); } });
  });
  document.addEventListener('impress:dir', function (e) {
    var t = document.querySelector('#stage .tool[data-stage="' + e.detail.tool + '"]');
    if (t) gsap.delayedCall(.08, function () { play(t); });
  });

  /* ---------- įžanga (tik jei GSAP atėjo laiku, kitaip viską rodo CSS-draudimas) ---------- */
  var introDone = false;
  var introEls = qa('.intro'), letters = qa('.mast .ch'), cols = qa('.col'), dekEls = qa('.dek, .addr');
  if (performance.now() > 1200) {
    gsap.set(introEls, { autoAlpha: 1, y: 0 });
    introDone = true;
  } else {
    var shapes = [];
    coverTools.forEach(function (t, i) {
      qa('path, circle, rect, ellipse', t).forEach(function (s) {
        var L = 0; try { L = s.getTotalLength(); } catch (e) { L = 0; }
        if (L) { gsap.set(s, { strokeDasharray: L, strokeDashoffset: L }); shapes.push({ el: s, tool: i }); }
      });
    });
    var tl = gsap.timeline({ defaults: { ease: 'expo.out' }, onComplete: function () {
      introDone = true;
      gsap.set(shapes.map(function (s) { return s.el; }), { clearProps: 'strokeDasharray,strokeDashoffset' });
    } });
    tl.to(letters, { autoAlpha: 1, y: 0, duration: 1, stagger: .055 }, 0)
      .to(dekEls, { autoAlpha: 1, y: 0, duration: .9, stagger: .1 }, .35)
      .to(cols, { autoAlpha: 1, y: 0, duration: .9, stagger: .12 }, .5);
    [0, 1, 2].forEach(function (i) {
      var els = shapes.filter(function (s) { return s.tool === i; }).map(function (s) { return s.el; });
      tl.to(els, { strokeDashoffset: 0, duration: 1.1, stagger: .05, ease: 'power2.inOut' }, .6 + i * .18);
    });
    coverTools.forEach(function (t, i) { tl.add(function () { play(t); }, 1.9 + i * .38); });
  }

  /* ---------- žingsnių numeriai nusidažo slenkant ---------- */
  if (window.ScrollTrigger) {
    qa('.step').forEach(function (st) {
      var ink = st.querySelector('.num-ink');
      gsap.fromTo(ink, { opacity: 0 }, { opacity: 1, ease: 'none', immediateRender: true,
        scrollTrigger: { trigger: st, start: 'top 82%', end: 'top 48%', scrub: .4 } });
    });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { window.ScrollTrigger.refresh(); });
  }
})();
