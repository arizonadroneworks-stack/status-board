/* Board renderer. Called as renderBoard(rootEl, data, imgDataUri). */
(function () {
  var S = {
    FMC: { color: '#3DDC84', glow: 'rgba(61,220,132,0.35)', label: 'Fully Mission Capable', short: 'Capable', fx: 'none', tint: 'rgba(0,0,0,0)' },
    PMC: { color: '#FFB020', glow: 'rgba(255,176,32,0.35)', label: 'Partially Capable', short: 'Partial', fx: 'saturate(0.85)', tint: 'rgba(255,176,32,0.14)' },
    NMC: { color: '#FF5A5A', glow: 'rgba(255,90,90,0.35)', label: 'Not Mission Capable', short: 'Down', fx: 'grayscale(0.85) brightness(0.55)', tint: 'rgba(255,50,50,0.2)' },
    FLYING: { color: '#5EC8FF', glow: 'rgba(94,200,255,0.35)', label: 'Airborne', short: 'Airborne', fx: 'blur(5px) grayscale(1) brightness(0.3)', tint: 'rgba(30,90,160,0.2)' },
    SPARE: { color: '#9AA4B2', glow: 'rgba(154,164,178,0.3)', label: 'Spare', short: 'Spare', fx: 'grayscale(0.5) brightness(0.8)', tint: 'rgba(0,0,0,0)' }
  };
  var G = [{ l: 46, r: 471, c: 255 }, { l: 522, r: 939, c: 733 }, { l: 990, r: 1407, c: 1197 }, { l: 1456, r: 1874, c: 1665 }];
  var pilotX = [146, 341], crewX = [1163, 1364, 1569, 1768];
  var NB = '&nbsp;', DASH = '—';
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function fmt(d, tz) { try { return d.toLocaleTimeString('en-GB', { timeZone: tz, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }); } catch (e) { return '--:--:--'; } }
  var PLANE = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#5EC8FF" stroke-width="1.8" stroke-linejoin="round"><path d="M12 2 L13.5 9 L21 13 L21 15 L13.5 13 L13 19 L15.5 21 L15.5 22 L12 21 L8.5 22 L8.5 21 L11 19 L10.5 13 L3 15 L3 13 L10.5 9 Z"/></svg>';
  var WRENCH = '<path fill-rule="evenodd" d="M84,52 C68,44 68,14 86,8 L91,26 L109,26 L114,8 C132,14 132,44 116,52 L108,56 L108,146 C120,150 124,160 122,170 C118,184 82,184 78,170 C76,160 80,150 92,146 L92,56 Z M100,158 A8,8 0 1 0 100.01,158 Z" fill="#F2F5F8" stroke="#7E1612" stroke-width="2.5" stroke-linejoin="round"/>';
  var FLAGS = '<svg viewBox="0 0 38 20" width="46" height="24"><rect width="38" height="20" fill="#F2F2F2"/><path d="M0,0 H38 V1.54 H0 Z M0,3.08 H38 V4.62 H0 Z M0,6.15 H38 V7.69 H0 Z M0,9.23 H38 V10.77 H0 Z M0,12.31 H38 V13.85 H0 Z M0,15.38 H38 V16.92 H0 Z M0,18.46 H38 V20 H0 Z" fill="#B22234"/><rect width="15.2" height="10.77" fill="#3C3B6E"/></svg>' +
    '<svg viewBox="0 0 36 24" width="36" height="24"><rect width="36" height="24" fill="#C8352B"/><path d="M18,12 L0,0 L4,0 Z M18,12 L8,0 L12,0 Z M18,12 L16,0 L20,0 Z M18,12 L24,0 L28,0 Z M18,12 L32,0 L36,0 Z M18,12 L0,4 L0,8 Z M18,12 L36,4 L36,8 Z" fill="#E8B64A"/><rect y="12" width="36" height="12" fill="#1F4E9C"/><path d="M18,6.5 L19.5,10.6 L23.8,10.7 L20.4,13.3 L21.6,17.5 L18,15 L14.4,17.5 L15.6,13.3 L12.2,10.7 L16.5,10.6 Z" fill="#C8662B"/></svg>';

  function build(B, img) {
    var bays = B.bays.map(function (b, i) {
      var code = String(b.status || 'SPARE').toUpperCase(); var s = S[code] || S.SPARE; var g = G[i];
      return { n: i + 1, tail: b.tail || '', code: code, s: s, g: g, a: b.aMan || '', b: b.bMan || '', pilot: b.pilot || '', remark: (b.remark || '').trim() };
    });
    var h = [];
    h.push('<img class="abs" src="' + img + '" style="left:0;top:0;width:1920px;height:1080px;object-fit:cover" alt="">');
    bays.forEach(function (j) {
      var c = j.g.c, s = j.s;
      h.push('<div class="abs" style="left:' + (c - 210) + 'px;top:132px;width:420px;height:330px;border-radius:46%;backdrop-filter:' + s.fx + ';-webkit-backdrop-filter:' + s.fx + ';background:' + s.tint + ';-webkit-mask-image:radial-gradient(ellipse 50% 50% at 50% 50%,#000 55%,transparent 100%);mask-image:radial-gradient(ellipse 50% 50% at 50% 50%,#000 55%,transparent 100%)"></div>');
      h.push('<div class="abs fl-pulse" style="left:' + (c - 200) + 'px;top:426px;width:400px;height:44px;border-radius:50%;border:2px solid ' + s.color + ';box-shadow:0 0 22px ' + s.color + ',inset 0 0 18px ' + s.glow + '"></div>');
      h.push('<div class="abs ' + (j.code === 'NMC' ? 'fl-blink' : '') + '" style="left:' + (c - 6) + 'px;top:146px;width:12px;height:12px;border-radius:50%;background:' + s.color + ';box-shadow:0 0 14px 4px ' + s.color + '"></div>');
      if (j.code === 'NMC') {
        h.push('<svg class="abs" viewBox="0 0 200 200" width="200" height="200" style="left:' + (c - 100) + 'px;top:190px;filter:drop-shadow(0 0 14px rgba(255,90,90,.7)) drop-shadow(0 4px 6px rgba(0,0,0,.7))"><circle cx="100" cy="100" r="86" fill="rgba(7,9,13,0.55)" stroke="#FF5A5A" stroke-width="4"/><circle cx="100" cy="100" r="76" fill="none" stroke="#FF5A5A" stroke-width="1.5" stroke-dasharray="6 6" opacity=".7"/><g transform="rotate(45 100 100)">' + WRENCH + '</g><g transform="rotate(-45 100 100)">' + WRENCH + '</g></svg>');
      }
    });
    // top bar
    h.push('<div class="abs" style="left:0;top:0;width:1920px;height:66px;display:flex;align-items:center;justify-content:space-between;padding:0 36px;background:linear-gradient(180deg,rgba(7,9,13,.92),rgba(7,9,13,.6));border-bottom:1px solid rgba(94,200,255,.35)">' +
      '<div style="display:flex;align-items:center;gap:14px">' + FLAGS + '<div style="width:2px;height:36px;background:rgba(94,200,255,.4)"></div>' +
      '<div style="line-height:1"><div style="font-size:30px;font-weight:700;letter-spacing:3px;white-space:nowrap">' + esc(B.title || '') + (B.unit ? ' <span style="color:#5EC8FF">//</span> ' + esc(B.unit) : '') + '</div><div style="font-size:14px;font-weight:600;letter-spacing:7px;color:#5EC8FF;margin-top:3px">FLIGHT LINE · DAILY STATUS</div></div></div>' +
      '<div style="display:flex;align-items:center;gap:28px">' +
      '<div style="display:flex;align-items:baseline;gap:8px"><span class="lbl" style="font-size:14px;letter-spacing:3px">MST</span><span class="mono" id="clkL" style="font-size:26px;font-weight:700"></span></div>' +
      '<div style="display:flex;align-items:baseline;gap:8px"><span class="lbl" style="font-size:14px;letter-spacing:3px">ZULU</span><span class="mono" id="clkZ" style="font-size:26px;font-weight:700;color:#5EC8FF"></span></div>' +
      '<div style="width:2px;height:36px;background:rgba(94,200,255,.4)"></div>' +
      '<div style="display:flex;align-items:baseline;gap:8px"><span class="lbl" style="font-size:14px;letter-spacing:3px">BRIEF</span><span class="mono" style="font-size:26px;font-weight:700">' + esc(B.briefDate) + '</span></div>' +
      '<div style="width:2px;height:36px;background:rgba(94,200,255,.4)"></div>' +
      '<div style="display:flex;align-items:center;gap:10px;padding:4px 12px;background:rgba(61,220,132,.12);border:1px solid rgba(61,220,132,.55)"><span class="fl-pulse" style="width:10px;height:10px;border-radius:50%;background:#3DDC84;box-shadow:0 0 10px #3DDC84"></span><span class="lbl" style="font-size:14px;letter-spacing:3px">LAST UPDATED</span><span class="mono" style="font-size:24px;font-weight:700;color:#3DDC84">' + esc(B.lastUpdate) + '</span></div>' +
      '</div></div>');
    // per-bay HUD
    bays.forEach(function (j) {
      var g = j.g, s = j.s;
      h.push('<div class="abs blur4" style="left:' + (g.l + 12) + 'px;top:84px;width:168px;padding:6px 12px;background:rgba(7,9,13,.74);border-left:3px solid ' + s.color + '"><div class="lbl" style="font-size:14px;letter-spacing:4px">BAY 0' + j.n + ' · F-16</div><div class="mono" style="font-size:30px;font-weight:700;line-height:1.1">' + esc(j.tail) + '</div></div>');
      h.push('<div class="abs" style="left:' + (g.r - 12) + 'px;top:84px;transform:translateX(-100%);display:flex;flex-direction:column;align-items:flex-end;gap:4px">' +
        '<div style="padding:6px 14px;background:' + s.color + ';color:#07090D;font-size:30px;font-weight:700;letter-spacing:3px;line-height:1;box-shadow:0 0 18px ' + s.glow + ';clip-path:polygon(10px 0,100% 0,100% calc(100% - 10px),calc(100% - 10px) 100%,0 100%,0 10px)">' + esc(j.code) + '</div>' +
        '<div style="padding:2px 8px;background:rgba(7,9,13,.78);font-size:15px;font-weight:700;letter-spacing:2px;color:' + s.color + ';text-transform:uppercase;white-space:nowrap">' + s.label + '</div>' +
        (j.remark ? '<div style="padding:2px 8px;background:rgba(7,9,13,.78);font-size:15px;font-weight:600;letter-spacing:1px;text-transform:uppercase;white-space:nowrap">' + esc(j.remark) + '</div>' : '') + '</div>');
      if (j.code === 'FLYING') {
        h.push('<div class="abs" style="left:' + (g.c - 210) + 'px;top:190px;width:420px;display:flex;flex-direction:column;align-items:center;gap:8px"><div style="position:relative;width:120px;height:120px;border-radius:50%;border:2px solid rgba(94,200,255,.8);box-shadow:inset 0 0 0 28px rgba(94,200,255,.08),0 0 24px rgba(94,200,255,.4)"><div class="fl-sweep" style="position:absolute;inset:0;border-radius:50%;background:conic-gradient(from 0deg,rgba(94,200,255,.6),rgba(94,200,255,0) 25%)"></div></div><div style="padding:4px 14px;background:rgba(7,9,13,.8);font-size:34px;font-weight:700;letter-spacing:10px">AIRBORNE</div></div>');
      }
      h.push('<div class="abs blur4" style="left:' + g.l + 'px;top:474px;width:' + (g.r - g.l) + 'px;height:40px;display:flex;align-items:center;justify-content:space-between;gap:10px;padding:0 12px;background:rgba(7,9,13,.8);border-top:2px solid ' + s.color + '">' +
        '<div class="ell" style="display:flex;align-items:center;gap:6px;min-width:0"><span style="font-size:14px;font-weight:700;color:#F2B33D">A</span><span style="font-size:19px;font-weight:700;text-transform:uppercase">' + esc(j.a || DASH) + '</span><span style="font-size:14px;font-weight:700;color:#F2B33D;margin-left:8px">B</span><span style="font-size:19px;font-weight:700;text-transform:uppercase">' + esc(j.b || DASH) + '</span></div>' +
        '<div style="display:flex;align-items:center;gap:6px;white-space:nowrap;flex-shrink:0">' + PLANE + '<span style="font-size:19px;font-weight:700;text-transform:uppercase;color:#9BDDFF">' + esc(j.pilot || DASH) + '</span></div></div>');
    });
    // pilots
    h.push('<div class="abs" style="left:70px;top:524px;display:flex;align-items:center;gap:10px"><span style="width:22px;height:3px;background:#5EC8FF"></span><span style="font-size:17px;font-weight:700;letter-spacing:6px;color:#5EC8FF;text-shadow:0 1px 6px rgba(0,0,0,.9)">PILOTS</span></div>');
    (B.pilots || []).slice(0, 2).forEach(function (nm, i) {
      var bi = -1; bays.forEach(function (j, k) { if (nm && j.pilot && j.pilot.toUpperCase() === String(nm).toUpperCase()) bi = k; });
      var x = pilotX[i];
      h.push('<div class="abs" style="left:' + x + 'px;top:550px;width:180px;transform:translateX(-50%);display:flex;flex-direction:column;align-items:center"><div class="plate blur4" style="border:1px solid rgba(94,200,255,.4);border-top:3px solid #5EC8FF"><div class="lbl ell" style="font-size:13px;letter-spacing:3px">PILOT 0' + (i + 1) + (bi >= 0 ? '<span style="color:#9BDDFF"> · ' + esc(bays[bi].tail) + '</span>' : '') + '</div><div class="nm">' + (nm ? esc(nm) : NB) + '</div></div><div style="width:0;height:0;border-left:9px solid transparent;border-right:9px solid transparent;border-top:9px solid #5EC8FF"></div></div>');
      h.push('<div class="abs fl-pulse" style="left:' + (x - 75) + 'px;top:918px;width:150px;height:30px;border-radius:50%;border:2px solid rgba(94,200,255,.8);box-shadow:0 0 16px rgba(94,200,255,.6)"></div>');
    });
    // crew
    h.push('<div class="abs" style="right:70px;top:524px;display:flex;align-items:center;gap:10px"><span style="font-size:17px;font-weight:700;letter-spacing:6px;color:#F2B33D;text-shadow:0 1px 6px rgba(0,0,0,.9)">CREW CHIEFS</span><span style="width:22px;height:3px;background:#F2B33D"></span></div>');
    var crew = [];
    bays.forEach(function (j) { if (j.a) crew.push({ name: j.a, role: 'A MAN', tail: j.tail }); if (j.b) crew.push({ name: j.b, role: 'B MAN', tail: j.tail }); });
    crew = crew.slice(0, 4); while (crew.length < 4) crew.push({ name: '', role: 'CREW CHIEF', tail: '' });
    crew.forEach(function (c, i) {
      var x = crewX[i];
      h.push('<div class="abs" style="left:' + x + 'px;top:550px;width:186px;transform:translateX(-50%);display:flex;flex-direction:column;align-items:center"><div class="plate blur4" style="border:1px solid rgba(242,179,61,.4);border-top:3px solid #F2B33D"><div class="lbl ell" style="font-size:13px;letter-spacing:3px"><span style="color:#F2B33D">' + c.role + '</span>' + (c.tail ? ' · ' + esc(c.tail) : '') + '</div><div class="nm">' + (c.name ? esc(c.name) : NB) + '</div></div><div style="width:0;height:0;border-left:9px solid transparent;border-right:9px solid transparent;border-top:9px solid #F2B33D"></div></div>');
      h.push('<div class="abs fl-pulse" style="left:' + (x - 75) + 'px;top:918px;width:150px;height:30px;border-radius:50%;border:2px solid rgba(242,179,61,.85);box-shadow:0 0 16px rgba(242,179,61,.6)"></div>');
    });
    // readiness
    var down = bays.filter(function (j) { return j.code === 'NMC'; }).length;
    var mc = Math.round(((bays.length - down) / bays.length) * 100);
    var circ = 2 * Math.PI * 50, mcColor = mc >= 75 ? '#3DDC84' : (mc >= 50 ? '#FFB020' : '#FF5A5A');
    var legend = ['FMC', 'PMC', 'NMC', 'FLYING', 'SPARE'].map(function (k) {
      var n = bays.filter(function (j) { return j.code === k; }).length;
      return '<div style="display:flex;flex-direction:column;align-items:center;gap:2px;padding:6px 2px;background:rgba(255,255,255,.04);border-bottom:3px solid ' + S[k].color + '"><span class="mono" style="font-size:26px;font-weight:700;line-height:1">' + n + '</span><span style="font-size:16px;font-weight:700;color:' + S[k].color + '">' + k + '</span><span class="lbl" style="font-size:12px;font-weight:600;text-transform:uppercase;line-height:1">' + S[k].short + '</span></div>';
    }).join('');
    h.push('<div class="abs blur6" style="left:520px;top:640px;width:520px;padding:18px 22px;background:rgba(7,9,13,.8);border:1px solid rgba(94,200,255,.3)">' +
      '<div class="corner" style="left:-1px;top:-1px;border-left-width:3px;border-top-width:3px"></div><div class="corner" style="right:-1px;top:-1px;border-right-width:3px;border-top-width:3px"></div><div class="corner" style="left:-1px;bottom:-1px;border-left-width:3px;border-bottom-width:3px"></div><div class="corner" style="right:-1px;bottom:-1px;border-right-width:3px;border-bottom-width:3px"></div>' +
      '<div style="font-size:17px;font-weight:700;letter-spacing:6px;color:#5EC8FF">SQUADRON READINESS</div>' +
      '<div style="display:flex;align-items:center;gap:22px;margin-top:10px"><div style="position:relative;width:120px;height:120px;flex-shrink:0"><svg viewBox="0 0 120 120" width="120" height="120"><circle cx="60" cy="60" r="50" fill="none" stroke="#1C2530" stroke-width="10"/><circle cx="60" cy="60" r="50" fill="none" stroke="' + mcColor + '" stroke-width="10" stroke-dasharray="' + ((mc / 100) * circ).toFixed(1) + ' ' + circ.toFixed(1) + '" transform="rotate(-90 60 60)"/></svg><div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;line-height:1"><div class="mono" style="font-size:30px;font-weight:700">' + mc + '%</div><div class="lbl" style="font-size:14px;letter-spacing:3px;margin-top:4px">MC RATE</div></div></div>' +
      '<div style="flex-grow:1;display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:6px">' + legend + '</div></div>' +
      '<div class="lbl" style="display:flex;justify-content:space-between;margin-top:12px;padding-top:10px;border-top:1px solid rgba(94,200,255,.2);font-size:16px;font-weight:600;letter-spacing:3px"><span>AIRCRAFT <span style="color:#E8EEF4">04</span></span><span>AIRCREW <span style="color:#E8EEF4">02</span></span><span>CREW CHIEFS <span style="color:#E8EEF4">04</span></span></div></div>');
    // loading bar
    h.push('<div class="abs blur6" style="left:0;top:1016px;width:1920px;height:64px;padding:8px 44px 0;background:rgba(7,9,13,.86);border-top:1px solid rgba(94,200,255,.3)"><div style="display:flex;align-items:center;gap:18px"><div style="font-size:17px;font-weight:700;letter-spacing:5px;color:#5EC8FF;white-space:nowrap">SYNCING MORNING BRIEF</div><div style="position:relative;flex-grow:1;height:8px;background:#141B24;overflow:hidden"><div style="position:absolute;inset:0;background:linear-gradient(90deg,#2B7FBF,#5EC8FF)"></div><div class="fl-shimmer" style="position:absolute;top:0;bottom:0;width:25%;background:linear-gradient(90deg,rgba(255,255,255,0),rgba(255,255,255,.55),rgba(255,255,255,0))"></div></div><div class="mono" style="font-size:17px;font-weight:700;white-space:nowrap">LAST UPDATED · ' + esc(B.lastUpdate) + '</div></div>' +
      '<div class="ell" style="margin-top:6px;font-size:18px;font-weight:600;letter-spacing:1px;color:#B4BFCC"><span style="color:#F2B33D;font-weight:700;letter-spacing:3px">TIP //</span> ' + esc(B.tip) + '</div></div>');
    return h.join('');
  }

  var clockTimer = null;
  window.renderBoard = function (root, data, img) {
    root.innerHTML = build(data, img);
    function tick() {
      var d = new Date(), l = document.getElementById('clkL'), z = document.getElementById('clkZ');
      if (l) l.textContent = fmt(d, 'America/Phoenix');
      if (z) z.textContent = fmt(d, 'UTC').slice(0, 5).replace(':', '') + 'Z';
    }
    tick(); if (clockTimer) clearInterval(clockTimer); clockTimer = setInterval(tick, 1000);
  };
})();
