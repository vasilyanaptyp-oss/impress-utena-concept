/* Grožio salonas „Impress“, Utena. VIENINTELĖ vieta, kur surašytos kryptys ir meistrai.
   Naujas meistras = vienas objektas MASTERS masyve. Po pakeitimo paleisti `node build.js`,
   kad atsinaujintų ir be JavaScript matoma versija (index.html tarp žymų <!-- masters --> ).

   Laukai: dir – krypties id (kirpykla | kosmetologija | manikiuras); role – kaip vadinti kortelėje;
   name – vardas (be pavardės), nameAcc – vardas galininku SMS žinutei („pas Viktoriją“);
   phone – tel: formatu be tarpų, phoneText – kaip rodyti; tuščias phone = kortelė-užpildas
   „Kontaktus paskelbsime netrukus“ su bendru salono numeriu; services – ką daro; photo/photoSet – nebūtina;
   roleDat/nameDat – naudininkas („Žinutė bus išsiųsta kosmetologei Viktorijai“). */
(function (root) {
  'use strict';

  var SALON = {
    name: 'Impress',
    /* bendras salono numeris (16.09.2026 Viktorija: „telefono nr. nurodykit mano“) */
    phone: '+37061261703', phoneText: '+370 612 61703',
    address: 'J. Basanavičiaus g. 49A, Utena',
    facebook: 'https://www.facebook.com/salonasimpress/',
    maps: 'https://www.google.com/maps/search/?api=1&query=J.+Basanavi%C4%8Diaus+g.+49A%2C+Utena',
    /* darbo laikas pagal savaitės dieną (0 = sekmadienis): [nuo, iki] valandomis */
    hours: { 1: [9, 19], 2: [9, 19], 3: [9, 19], 4: [9, 19], 5: [9, 19], 6: [9, 16], 0: [9, 16] }
  };

  var DIRECTIONS = [
    { id: 'kosmetologija', title: 'Kosmetologija', who: 'Kosmetologė', whoGen: 'Kosmetologės', whoPas: 'pas kosmetologę', tool: 'dropper',
      services: ['HIFU', 'Lazerinė epiliacija', 'Veido hidrodermabrazija', 'Procedūros su spikulėmis', 'Pigmentacija ir kapiliarai'], sms: 'kosmetologinei procedūrai' },
    { id: 'kirpykla', title: 'Kirpykla', who: 'Kirpėjai', whoGen: 'Kirpėjų', whoPas: 'pas kirpėjus', tool: 'scissors',
      services: ['Kirpimai', 'Plaukų dažymas', 'Šukuosenos'], sms: 'kirpimui ar dažymui' },
    { id: 'manikiuras', title: 'Manikiūras', who: 'Manikiūro meistrai', whoGen: 'Manikiūro meistrų', whoPas: 'pas manikiūro meistrus', tool: 'polish',
      services: ['Manikiūras', 'Gelinis lakavimas'], sms: 'manikiūrui' }
  ];

  var MASTERS = [
    { id: 'kirpejai', dir: 'kirpykla', role: 'Kirpėjai', name: '', nameAcc: '', phone: '', phoneText: '',
      services: ['Kirpimai', 'Plaukų dažymas', 'Šukuosenos'] },
    { id: 'viktorija', dir: 'kosmetologija', role: 'Kosmetologė', roleDat: 'kosmetologei', name: 'Viktorija', nameAcc: 'Viktoriją', nameDat: 'Viktorijai',
      phone: '+37061261703', phoneText: '+370 612 61703',
      photo: 'img/viktorija-kabinetas-720.webp', photoAlt: 'Kosmetologė Viktorija savo kabinete',
      photoSet: ['img/viktorija-kabinetas-480.webp 480w', 'img/viktorija-kabinetas-720.webp 720w', 'img/viktorija-kabinetas-1000.webp 1000w'],
      /* paslaugų sąrašas suderintas su Viktorija 2026-09 */
      services: ['HIFU', 'Lazerinė epiliacija (diodinis lazeris)', 'Veido hidrodermabrazija', 'Procedūros su spikulėmis',
        'Kompleksinės veido odos atjauninimo procedūros', 'Pigmentacijos procedūros', 'Kapiliarų šalinimas lazeriu',
        'Odos valymas', 'Limfodrenažas', 'IPL'] },
    { id: 'manikiuro-meistrai', dir: 'manikiuras', role: 'Manikiūro meistrai', name: '', nameAcc: '', phone: '', phoneText: '',
      services: ['Manikiūras', 'Gelinis lakavimas'] }
  ];

  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function dirOf(id) { for (var i = 0; i < DIRECTIONS.length; i++) if (DIRECTIONS[i].id === id) return DIRECTIONS[i]; return null; }
  function mastersOf(dirId) { return MASTERS.filter(function (m) { return m.dir === dirId; }); }
  function bookable(dirId) { return mastersOf(dirId).filter(function (m) { return !!m.phone; }); }

  /* SMS žinutės tekstas iš pasirinkimų */
  function buildText(o) {
    var d = dirOf(o.dir), m = o.master;
    var s = 'Sveiki! Norėčiau registruotis „Impress“ salone';
    if (d) s += ' ' + d.sms;
    if (m && m.nameAcc) s += ' pas ' + m.nameAcc;
    s += '.';
    var when = [];
    if (o.when) when.push(o.when);
    if (o.time) when.push(o.time);
    if (when.length) s += ' Man tiktų ' + when.join(' ') + '.';
    else s += ' Kada turėtumėte laisvo laiko?';
    var nm = (o.name || '').trim();
    s += nm ? ' Ačiū! ' + nm : ' Ačiū!';
    return s;
  }
  function smsHref(phone, text) { return 'sms:' + phone + '?&body=' + encodeURIComponent(text); }

  /* Meistro kortelė (naudojama ir build.js, ir naršyklėje) */
  function renderCard(m) {
    var d = dirOf(m.dir) || {};
    var svc = '<ul class="svc">' + m.services.map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('') + '</ul>';
    if (!m.phone) {
      return '<article class="mcard mcard-soon" id="m-' + esc(m.id) + '" data-master="' + esc(m.id) + '">' +
        '<div class="mcard-glyph" aria-hidden="true"><svg viewBox="0 0 200 260" width="72" height="94"><use href="#t-' + esc(d.tool || 'scissors') + '"></use></svg></div>' +
        '<div class="mcard-body"><p class="role">' + esc(m.role) + '</p>' +
        '<h4 class="mname soon">Kontaktus paskelbsime netrukus</h4>' + svc +
        '<p class="soon-note">Kol kas registracija telefonu ' + esc(SALON.phoneText) + '.</p>' +
        '<div class="acts"><a class="btn btn-primary" href="tel:' + esc(SALON.phone) + '"><svg class="i" aria-hidden="true" viewBox="0 0 24 24"><path d="M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 6.392 6.384"/></svg>Skambinti <span class="num">' + esc(SALON.phoneText) + '</span></a></div>' +
        '</div></article>';
    }
    var text = buildText({ dir: m.dir, master: m, when: '', time: '', name: '' });
    var srcset = m.photoSet && m.photoSet.length ? ' srcset="' + esc(m.photoSet.join(', ')) + '" sizes="(min-width: 900px) 440px, calc(100vw - 32px)"' : '';
    var photo = m.photo ? '<div class="mcard-photo"><img src="' + esc(m.photo) + '"' + srcset + ' width="720" height="720" alt="' + esc(m.photoAlt || '') + '" loading="lazy" decoding="async"></div>' : '';
    return '<article class="mcard' + (m.photo ? ' has-photo' : '') + '" id="m-' + esc(m.id) + '" data-master="' + esc(m.id) + '">' + photo +
      '<div class="mcard-body"><p class="role">' + esc(m.role) + '</p>' +
      '<h4 class="mname">' + esc(m.name) + '</h4>' + svc +
      '<div class="acts">' +
      '<a class="btn btn-primary" href="tel:' + esc(m.phone) + '"><svg class="i" aria-hidden="true" viewBox="0 0 24 24"><path d="M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 6.392 6.384"/></svg>Skambinti <span class="num">' + esc(m.phoneText) + '</span></a>' +
      '<a class="btn btn-ghost js-sms" data-master="' + esc(m.id) + '" href="' + smsHref(m.phone, text) + '"><svg class="i" aria-hidden="true" viewBox="0 0 24 24"><path d="M2.992 16.342a2 2 0 0 1 .094 1.167l-1.065 3.29a1 1 0 0 0 1.236 1.168l3.413-.998a2 2 0 0 1 1.099.092 10 10 0 1 0-4.777-4.719"/></svg>SMS</a>' +
      '</div></div></article>';
  }
  function renderGroup(dirId) { return mastersOf(dirId).map(renderCard).join('\n'); }

  root.IMPRESS = { SALON: SALON, DIRECTIONS: DIRECTIONS, MASTERS: MASTERS, dirOf: dirOf, mastersOf: mastersOf, bookable: bookable,
    buildText: buildText, smsHref: smsHref, renderCard: renderCard, renderGroup: renderGroup, esc: esc };
})(typeof window !== 'undefined' ? window : module.exports);
