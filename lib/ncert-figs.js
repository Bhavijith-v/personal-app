/* Illustrations for the class notes. Each one is a small inline SVG drawn on
   its own dark "plate", so it reads the same in the light and dark themes and
   works offline. Notes place one with a line that says {{fig:name}}.
   Public study material only; nothing about you lives in this file. */
(function () {
  'use strict';
  var BG = '#0f1420', FG = '#e8eaed', DIM = '#9aa2ad', LINE = '#2b3345';
  var BLUE = '#4a90d9', GREEN = '#5fae7e', ORANGE = '#e39446', RED = '#d9654a', GOLD = '#d9b44a', SAND = '#c9a66b';

  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function svg(w, h, title, body) {
    return '<svg viewBox="0 0 ' + w + ' ' + h + '" role="img" aria-label="' + esc(title) + '" xmlns="http://www.w3.org/2000/svg" font-family="system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif">' +
      '<title>' + esc(title) + '</title><rect width="' + w + '" height="' + h + '" rx="10" fill="' + BG + '"/>' + body + '</svg>';
  }
  function T(x, y, s, o) {
    o = o || {};
    return '<text x="' + x + '" y="' + y + '" font-size="' + (o.s || 10) + '" fill="' + (o.c || FG) + '" text-anchor="' + (o.a || 'middle') + '"' +
      (o.b ? ' font-weight="700"' : '') + (o.i ? ' font-style="italic"' : '') + (o.h ? ' paint-order="stroke" stroke="#161d30" stroke-width="3" stroke-linejoin="round"' : '') + '>' + esc(s) + '</text>';
  }
  function lines(x, y, arr, o) {   // several short lines of text, one under the other
    o = o || {};
    return arr.map(function (s, i) { return T(x, y + i * (o.lh || 11), s, o); }).join('');
  }
  function C(x, y, r, fill, extra) { return '<circle cx="' + x + '" cy="' + y + '" r="' + r + '" fill="' + fill + '"' + (extra || '') + '/>'; }
  function R(x, y, w, h, fill, extra) { return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" fill="' + fill + '"' + (extra || '') + '/>'; }
  function L(x1, y1, x2, y2, stroke, extra) { return '<line x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '" stroke="' + stroke + '"' + (extra || '') + '/>'; }
  function P(d, fill, extra) { return '<path d="' + d + '" fill="' + fill + '"' + (extra || '') + '/>'; }
  function r1(n) { return Math.round(n * 10) / 10; }

  /* ---------- Moon phases ---------- */
  function moonLit(cx, cy, r, p) {
    var q = p <= 0.5 ? p : 1 - p, a = Math.cos(2 * Math.PI * q), rx = Math.abs(a) * r;
    var d = 'M' + cx + ' ' + (cy - r) + ' A' + r + ' ' + r + ' 0 0 1 ' + cx + ' ' + (cy + r) + ' A' + r1(rx) + ' ' + r + ' 0 0 ' + (a > 0 ? 0 : 1) + ' ' + cx + ' ' + (cy - r) + 'Z';
    var path = '<path d="' + d + '" fill="#f3ead0"' + (p > 0.5 ? ' transform="translate(' + (2 * cx) + ' 0) scale(-1 1)"' : '') + '/>';
    return C(cx, cy, r, '#2a3144') + (q > 0 ? path : '') + C(cx, cy, r, 'none', ' stroke="#4a5470" stroke-width="1"');
  }
  var phases = [['New', 0], ['Waxing crescent', 0.125], ['First quarter', 0.25], ['Waxing gibbous', 0.375],
    ['Full', 0.5], ['Waning gibbous', 0.625], ['Last quarter', 0.75], ['Waning crescent', 0.875]];
  function moon() {
    var b = T(180, 17, 'Phases of the Moon · one cycle = 29.5 days', { b: 1, s: 11 });
    b += T(10, 36, 'WAXING  (light grows on the right) →', { a: 'start', s: 8.5, c: GOLD, b: 1 });
    b += T(10, 132, 'WANING  (light shrinks, left side stays lit) →', { a: 'start', s: 8.5, c: GOLD, b: 1 });
    phases.forEach(function (ph, i) {
      var col = i % 4, row = i < 4 ? 0 : 1, cx = 45 + col * 90, cy = row ? 170 : 74;
      b += moonLit(cx, cy, 24, ph[1]);
      b += T(cx, cy + 40, ph[0], { s: 9.5, b: 1 });
      b += T(cx, cy + 51, 'day ~' + Math.round(ph[1] * 29.5), { s: 8, c: DIM });
    });
    b += C(24, 232, 4, '#f3ead0') + T(34, 235, 'Full Moon: lunar eclipse', { a: 'start', s: 8.8, c: DIM });
    b += C(190, 232, 4, '#2a3144', ' stroke="#4a5470"') + T(200, 235, 'New Moon: solar eclipse', { a: 'start', s: 8.8, c: DIM });
    return svg(360, 248, 'The eight phases of the Moon in order, from New Moon to Waning crescent', b);
  }

  /* ---------- Tides ---------- */
  function tides() {
    function panel(x0, title, sub, spring) {
      var cx = x0 + 85, cy = 96, g = T(x0 + 85, 16, title, { b: 1, s: 10.5, c: spring ? GOLD : '#7fc4ff' }) + T(x0 + 85, 28, sub, { s: 8.3, c: DIM });
      g += '<ellipse cx="' + cx + '" cy="' + cy + '" rx="' + (spring ? 40 : 28) + '" ry="' + (spring ? 22 : 28) + '" fill="' + BLUE + '" opacity=".35"/>';
      g += C(cx, cy, 17, '#3f7fd1') + C(cx - 4, cy - 3, 5, GREEN, ' opacity=".8"');
      g += C(x0 + 14, cy, 11, GOLD) + T(x0 + 14, cy + 24, 'Sun', { s: 8, c: DIM });
      if (spring) g += C(x0 + 140, cy, 6, '#cfd3da') + T(x0 + 140, cy + 17, 'Moon', { s: 8, c: DIM }) + L(x0 + 26, cy, x0 + 130, cy, DIM, ' stroke-dasharray="2 3"');
      else g += C(cx, cy - 52, 6, '#cfd3da') + T(cx + 12, cy - 49, 'Moon', { s: 8, c: DIM, a: 'start' }) + L(x0 + 26, cy, cx - 22, cy, DIM, ' stroke-dasharray="2 3"');
      return g;
    }
    var b = panel(5, 'SPRING tide', 'New & Full Moon: Sun, Earth, Moon in a line', true) + panel(185, 'NEAP tide', 'Quarter Moons: Sun and Moon at right angles', false);
    b += T(90, 152, 'Highest high tides, lowest low tides', { s: 8.8 }) + T(270, 152, 'Smallest difference between high and low', { s: 8.8 });
    return svg(360, 164, 'Spring tides at New and Full Moon, neap tides at the quarters', b);
  }

  /* ---------- Planets ---------- */
  function planets() {
    var P0 = [['Mercury', 62, 5, '#a8a29a', '0.39', 'smallest'], ['Venus', 91, 9, '#e8c47a', '0.72', 'hottest ↺'], ['Earth', 122, 9.5, '#4a90d9', '1', 'only life'],
      ['Mars', 150, 7, '#d9654a', '1.52', '2 moons'], ['Jupiter', 198, 24, '#d9a066', '5.2', 'largest'], ['Saturn', 255, 18, '#e3cf8e', '9.6', 'rings'],
      ['Uranus', 300, 13, '#8fd8e0', '19.2', 'tilted ↺'], ['Neptune', 337, 12.5, '#4a6fe0', '30', 'windiest']];
    var b = T(180, 15, 'The eight planets, in order from the Sun (sizes squeezed, not to scale)', { b: 1, s: 10 });
    b += C(-14, 90, 44, GOLD, ' opacity=".9"') + T(14, 52, 'Sun', { s: 8.5, c: GOLD, a: 'start' });
    b += '<path d="M44 33 H160" stroke="' + GREEN + '" stroke-width="2" fill="none"/>' + T(102, 28, 'Terrestrial · rocky · inner 4', { s: 8.5, c: GREEN, b: 1 });
    b += '<path d="M178 33 H358" stroke="' + ORANGE + '" stroke-width="2" fill="none"/>' + T(268, 28, 'Jovian · gas & ice giants · outer 4', { s: 8.5, c: ORANGE, b: 1 });
    P0.forEach(function (p, i) {
      var y = 90;
      b += C(p[1], y, p[2], p[3]);
      if (p[0] === 'Jupiter') b += '<path d="M' + (p[1] - 22) + ' ' + (y - 7) + ' H' + (p[1] + 22) + ' M' + (p[1] - 23) + ' ' + (y + 3) + ' H' + (p[1] + 23) + ' M' + (p[1] - 18) + ' ' + (y + 13) + ' H' + (p[1] + 18) + '" stroke="#a9733f" stroke-width="3" opacity=".6"/>';
      if (p[0] === 'Saturn') b += '<ellipse cx="' + p[1] + '" cy="' + y + '" rx="30" ry="7" fill="none" stroke="#d6c07a" stroke-width="2.2" transform="rotate(-18 ' + p[1] + ' ' + y + ')"/>';
      if (p[0] === 'Earth') b += C(p[1] - 3, y - 2, 3.5, GREEN, ' opacity=".85"');
      var ty = 132 + (i % 2) * 24;
      b += L(p[1], y + p[2] + 3, p[1], ty - 9, LINE);
      b += T(p[1], ty, p[0], { s: 9, b: 1 }) + T(p[1], ty + 10, p[4] + ' AU', { s: 7.8, c: DIM }) ;
    });
    b += T(180, 182, 'Mnemonic:  My Very Educated Mother Just Served Us Noodles', { s: 9.5, c: GOLD, b: 1 });
    b += T(180, 196, '↺ Venus and Uranus spin east → west · Jupiter has the shortest day (~10 h)', { s: 8.2, c: DIM });
    return svg(360, 208, 'The eight planets in order from the Sun, split into rocky and giant planets', b);
  }

  /* ---------- Asteroid, meteor, comet ---------- */
  function meteor() {
    var b = T(180, 15, 'Space rocks: where they are and what we call them', { b: 1, s: 10.5 });
    b += C(16, 48, 12, GOLD) + C(70, 48, 5, RED) + T(70, 66, 'Mars', { s: 8, c: DIM });
    var dots = [[104, 40], [111, 56], [119, 45], [126, 53], [133, 39], [140, 50], [147, 58], [154, 43], [161, 52], [168, 38], [175, 56], [182, 47], [189, 41]];
    dots.forEach(function (d) { b += C(d[0], d[1], 2, '#b9b2a5'); });
    b += T(146, 74, 'Asteroid belt', { s: 8.5, c: '#d3cbbb', b: 1 }) + C(222, 48, 11, '#d9a066') + T(222, 70, 'Jupiter', { s: 8, c: DIM });
    b += C(280, 46, 4.5, '#dfe6ee') + '<path d="M285 44 L340 36 L340 56 Z" fill="#8fd8e0" opacity=".35"/>' + T(312, 72, 'Comet: tail points', { s: 7.8, c: DIM }) + T(312, 82, 'away from the Sun', { s: 7.8, c: DIM });
    b += R(8, 126, 344, 46, '#2d6bb0', ' opacity=".28"') + T(14, 138, 'Atmosphere', { s: 8, c: '#7fc4ff', a: 'start' });
    b += R(8, 198, 344, 18, '#6b5236') + T(14, 210, 'Ground', { s: 8, c: '#e8d8bd', a: 'start' });
    b += T(10, 98, 'SPACE', { s: 8, c: DIM, a: 'start', b: 1 });
    b += C(58, 106, 5, '#b9b2a5') + L(60, 108, 100, 124, DIM, ' stroke-dasharray="2 3"');
    b += '<path d="M104 128 L172 170" stroke="' + ORANGE + '" stroke-width="3" stroke-linecap="round"/><path d="M104 128 L172 170" stroke="#fff3c4" stroke-width="1" stroke-linecap="round"/>' + C(176, 172, 3.5, '#ffd27a');
    b += L(176, 174, 196, 190, DIM, ' stroke-dasharray="2 3"') + C(199, 194, 4, '#7d7468');
    b += lines(228, 108, ['Meteoroid', 'small rock or dust', 'in space'], { a: 'start', s: 8.5, c: DIM, lh: 10 }).replace('<text x="228" y="108" font-size="8.5" fill="' + DIM + '"', '<text x="228" y="108" font-size="9.5" font-weight="700" fill="#cfd3da"');
    b += T(228, 143, 'Meteor', { a: 'start', s: 9.5, b: 1, c: ORANGE }) + T(228, 154, 'streak of light as it burns', { a: 'start', s: 8.2, c: DIM }) + T(228, 164, '("shooting star")', { a: 'start', s: 8.2, c: DIM });
    b += T(228, 178, 'Meteorite', { a: 'start', s: 9.5, b: 1, c: SAND }) + T(228, 189, 'the piece that reaches the ground', { a: 'start', s: 8.2, c: DIM });
    b += T(180, 234, 'Asteroid = big rocky body orbiting the Sun (Ceres ~940 km)', { s: 8.8, c: DIM });
    return svg(360, 244, 'Asteroid belt between Mars and Jupiter, a comet, and the path from meteoroid to meteor to meteorite', b);
  }

  /* ---------- Heat zones ---------- */
  function zones() {
    var X = 14, W = 200, Y0 = 36, y = function (lat) { return Y0 + (90 - lat); };
    var b = T(180, 17, 'Latitudes and the three heat zones', { b: 1, s: 11 });
    var bands = [[90, 66.5, 'FRIGID', '#5b9bd5'], [66.5, 23.5, 'TEMPERATE', '#5fae7e'], [23.5, -23.5, 'TORRID', '#d9654a'], [-23.5, -66.5, 'TEMPERATE', '#5fae7e'], [-66.5, -90, 'FRIGID', '#5b9bd5']];
    bands.forEach(function (bd) {
      b += R(X, y(bd[0]), W, y(bd[1]) - y(bd[0]), bd[3], ' opacity=".85"');
      b += T(X + W / 2, (y(bd[0]) + y(bd[1])) / 2 + 3.5, bd[2], { s: 10, b: 1, c: '#fff' });
    });
    var marks = [[90, '90°N', 'North Pole'], [66.5, '66½°N', 'Arctic Circle'], [23.5, '23½°N', 'Tropic of Cancer'], [0, '0°', 'Equator'], [-23.5, '23½°S', 'Tropic of Capricorn'], [-66.5, '66½°S', 'Antarctic Circle'], [-90, '90°S', 'South Pole']];
    marks.forEach(function (m) {
      var yy = y(m[0]);
      b += L(X, yy, X + W + 8, yy, '#ffffff', ' stroke-width="' + (m[0] === 0 ? 1.8 : 1) + '"' + (m[0] === 0 ? '' : ' stroke-dasharray="4 3"') + ' opacity=".85"');
      b += T(X + W + 14, yy + 3.2, m[1], { a: 'start', s: 8.8, b: 1, c: GOLD }) + T(X + W + 46, yy + 3.2, m[2], { a: 'start', s: 8.6 });
    });
    b += T(X + W / 2, 236, '1° of latitude ≈ 111 km', { s: 8.6, c: DIM });
    b += T(X + W / 2, 249, 'Torrid: the Sun is overhead at least once a year', { s: 8.6, c: DIM });
    return svg(360, 260, 'Latitude lines from pole to pole with frigid, temperate and torrid zones', b);
  }

  /* ---------- Time ---------- */
  function clock(cx, cy, h, m, label, sub, col) {
    var r = 27, g = C(cx, cy, r, '#182036', ' stroke="' + (col || DIM) + '" stroke-width="1.6"');
    for (var i = 0; i < 12; i++) {
      var a = i * Math.PI / 6;
      g += L(r1(cx + Math.sin(a) * (r - 4)), r1(cy - Math.cos(a) * (r - 4)), r1(cx + Math.sin(a) * (r - 1.5)), r1(cy - Math.cos(a) * (r - 1.5)), DIM);
    }
    var ha = ((h % 12) + m / 60) * Math.PI / 6, ma = m * Math.PI / 30;
    g += L(cx, cy, r1(cx + Math.sin(ha) * 13), r1(cy - Math.cos(ha) * 13), FG, ' stroke-width="2.6" stroke-linecap="round"');
    g += L(cx, cy, r1(cx + Math.sin(ma) * 20), r1(cy - Math.cos(ma) * 20), FG, ' stroke-width="1.5" stroke-linecap="round"') + C(cx, cy, 2, FG);
    return g + T(cx, cy + 43, label, { b: 1, s: 9.5 }) + T(cx, cy + 54, sub, { s: 8, c: DIM });
  }
  function time() {
    var b = T(180, 17, 'Time and longitude: when it is noon in London', { b: 1, s: 11 });
    b += clock(60, 70, 7, 0, 'New York', '7:00 AM · 75°W · GMT−5', '#7fc4ff') + clock(180, 70, 12, 0, 'London', '12:00 noon · 0° · GMT', GOLD) + clock(300, 70, 5, 30, 'India', '5:30 PM · 82½°E · GMT+5:30', ORANGE);
    b += L(100, 70, 142, 70, '#7fc4ff', ' stroke-width="1.5"') + '<path d="M104 66 L98 70 L104 74" fill="none" stroke="#7fc4ff" stroke-width="1.5"/>' + T(121, 62, 'West', { s: 8, c: '#7fc4ff' }) + T(121, 84, '−5 h', { s: 8.5, b: 1, c: '#7fc4ff' });
    b += L(220, 70, 260, 70, ORANGE, ' stroke-width="1.5"') + '<path d="M256 66 L262 70 L256 74" fill="none" stroke="' + ORANGE + '" stroke-width="1.5"/>' + T(240, 62, 'East', { s: 8, c: ORANGE }) + T(240, 84, '+5 h 30 m', { s: 8.5, b: 1, c: ORANGE });
    b += R(14, 140, 332, 96, '#161d30', ' rx="8"');
    b += T(180, 157, 'The rules', { b: 1, s: 9.5, c: GOLD });
    b += lines(26, 172, ['360° in 24 hours  →  15° = 1 hour  →  1° = 4 minutes', 'East is ahead (add time) · West is behind (subtract)', 'IST = 82½° × 4 min = 330 min = 5 h 30 min ahead of GMT',
      'India spans 68°E to 97°E (~2 h of sun-time), so one standard time is used', 'International Date Line (180°): cross going west → add a day,', 'going east → subtract a day · 24 time zones, each 15° wide'], { a: 'start', s: 8.8, lh: 12.6, c: FG });
    b += T(180, 252, 'Time difference = longitude difference × 4 minutes', { s: 9.5, b: 1, c: GOLD });
    return svg(360, 262, 'Three clocks showing New York, London and India at the same moment, with the time rules', b);
  }

  /* ---------- Seasons ---------- */
  function earth(cx, cy, label) {
    var dx = -0.399, dy = -0.917, g = '';
    g += L(r1(cx - dx * 17), r1(cy - dy * 17), r1(cx + dx * 17), r1(cy + dy * 17), '#cfd3da', ' stroke-width="1.4"');
    g += C(cx, cy, 10, '#3f7fd1') + C(cx - 2, cy + 1, 3.2, GREEN, ' opacity=".85"');
    g += T(r1(cx + dx * 22), r1(cy + dy * 22 + 3), 'N', { s: 7.5, c: '#cfd3da', b: 1 });
    return g;
  }
  function seasons() {
    var cx = 180, cy = 124, r = 62, b = T(180, 14, "Why we have seasons: Earth's tilt (23½°) stays fixed as it orbits", { b: 1, s: 10 });
    b += '<ellipse cx="' + cx + '" cy="' + cy + '" rx="' + r + '" ry="' + r + '" fill="none" stroke="' + LINE + '" stroke-width="1.5" stroke-dasharray="3 4"/>';
    b += C(cx, cy, 14, GOLD) + T(cx, cy + 3, 'Sun', { s: 7.5, c: '#3a2b00', b: 1 });
    b += earth(cx, cy + r) + earth(cx + r, cy) + earth(cx, cy - r) + earth(cx - r, cy);
    b += lines(cx, 205, ['21 Mar · Spring equinox', 'Sun over the Equator'], { s: 8.6, lh: 10.5, c: FG }).replace('<text', '<text font-weight="700"');
    b += lines(cx, 36, ['23 Sep · Autumn equinox', 'Sun over the Equator'], { s: 8.6, lh: 10.5, c: FG }).replace('<text', '<text font-weight="700"');
    b += lines(cx + r + 16, cy - 14, ['21 Jun', 'Summer solstice (N)', 'longest day in the N', 'Sun: Tropic of Cancer'], { a: 'start', s: 8.2, lh: 10.5, c: FG }).replace('>21 Jun<', ' font-weight="700">21 Jun<');
    b += lines(cx - r - 16, cy - 14, ['22 Dec', 'Winter solstice (N)', 'shortest day in the N', 'Sun: Tropic of Capricorn'], { a: 'end', s: 8.2, lh: 10.5, c: FG }).replace('>22 Dec<', ' font-weight="700">22 Dec<');
    b += T(cx - r - 16, cy + 44, 'Perihelion ~3 Jan · 147 m km', { a: 'end', s: 7.8, c: DIM }) + T(cx + r + 16, cy + 44, 'Aphelion ~4 Jul · 152 m km', { a: 'start', s: 7.8, c: DIM });
    b += T(180, 238, 'Southern Hemisphere has the opposite seasons', { s: 8.8, c: GOLD });
    b += T(180, 251, 'At an equinox, day = night everywhere (circle of illumination passes through the poles)', { s: 8, c: DIM });
    return svg(360, 262, 'Earth at the four points of its orbit with the dates of equinoxes and solstices', b);
  }

  /* ---------- Water ---------- */
  function bar(y, label, parts) {
    var x = 20, w = 320, g = T(x, y, label, { a: 'start', s: 9, c: DIM, b: 1 });
    parts.forEach(function (p) {
      var pw = Math.max(2, w * p[0] / 100);
      g += R(r1(x), y + 5, r1(pw), 18, p[2]);
      if (pw > 34) g += T(r1(x + pw / 2), y + 18, p[1], { s: 8.6, b: 1, c: '#fff' });
      x += pw;
    });
    return g;
  }
  function water() {
    var b = T(180, 15, 'Land and water on Earth', { b: 1, s: 11 });
    b += bar(36, 'EARTH', [[71, '71% water', BLUE], [29, '29% land', '#a67c52']]);
    b += bar(74, 'SOUTHERN HEMISPHERE', [[81, '81% water', BLUE], [19, '19% land', '#a67c52']]);
    b += bar(112, 'NORTHERN HEMISPHERE', [[61, '61% water', BLUE], [39, '39% land', '#a67c52']]);
    b += bar(150, 'ALL THE WATER', [[97, '97% ocean (salty)', '#2d6bb0'], [3, '', GREEN]]) + T(340, 168, '3% fresh', { a: 'end', s: 8.2, c: GREEN, b: 1 }).replace('y="168"', 'y="146"');
    b += bar(188, 'FRESH WATER', [[69, '69% ice', '#8fd8e0'], [30, '30% groundwater', '#5b9bd5'], [1, '', GOLD]]) + T(340, 206, '~0.3% on the surface', { a: 'end', s: 8.2, c: GOLD, b: 1 }).replace('y="206"', 'y="184"');
    b += T(180, 238, '4 domains: Lithosphere · Hydrosphere · Atmosphere · Biosphere', { s: 8.8, c: GOLD });
    return svg(360, 248, 'Bars showing how Earth divides into water and land and how fresh water is held', b);
  }

  /* ---------- Atmosphere ---------- */
  function atmos() {
    var X = 64, W = 120, b = T(180, 14, 'Layers of the atmosphere (heights squeezed to fit, not to scale)', { b: 1, s: 10 });
    var layers = [['Exosphere', 34, 70, '#18284a', 'Fades into space'], ['Thermosphere', 70, 150, '#1f3560', 'Ionosphere (radio waves) · aurora · very hot'], ['Mesosphere', 150, 200, '#27497d', 'Coldest, about −90°C · meteors burn here'],
      ['Stratosphere', 200, 255, '#2f5fa0', 'Ozone layer (15–35 km) · jets fly here'], ['Troposphere', 255, 285, '#3a78c2', 'Weather · temp falls 6.5°C per km']];
    layers.forEach(function (l) {
      b += R(X, l[1], W, l[2] - l[1], l[3], ' stroke="' + BG + '" stroke-width="1.5"');
      b += T(X + W / 2, l[1] + (l[0] === 'Troposphere' ? 24 : l[0] === 'Exosphere' ? 17 : 15), l[0], { b: 1, s: 10 });
      var words = l[4].split(' · ');
      b += lines(X + W + 14, (l[1] + l[2]) / 2 - (words.length - 1) * 5 + 3, words, { a: 'start', s: 8.3, lh: 10.5, c: DIM });
    });
    var kms = [[34, '(space)'], [70, '600 km'], [150, '80 km'], [200, '50 km'], [255, '13 km'], [285, '0']];
    kms.forEach(function (k) { b += T(X - 6, k[0] + 3, k[1], { a: 'end', s: 8, c: DIM }); });
    b += R(X + 14, 228, W - 28, 15, '#2fb7a6', ' opacity=".35"') + T(X + W / 2, 239, 'OZONE', { s: 7.5, c: '#6fe3d3', b: 1 });
    b += '<ellipse cx="' + (X + 100) + '" cy="264" rx="9" ry="3.4" fill="#fff" opacity=".55"/><ellipse cx="' + (X + 108) + '" cy="262" rx="7" ry="3.2" fill="#fff" opacity=".55"/>';
    b += '<path d="M' + (X + 96) + ' 222 l16 -3 l-4 4 l4 4 z" fill="#cfd3da"/>';
    b += '<path d="M' + (X + 82) + ' 168 L' + (X + 108) + ' 192" stroke="' + ORANGE + '" stroke-width="2.4" stroke-linecap="round"/>';
    b += '<path d="M' + (X + 12) + ' 124 q8 -10 16 0 t16 0 t16 0 t16 0" fill="none" stroke="#5fe09a" stroke-width="2.2" opacity=".85"/><path d="M' + (X + 12) + ' 134 q8 -8 16 0 t16 0 t16 0 t16 0" fill="none" stroke="#5fe09a" stroke-width="1.4" opacity=".5"/>';
    [[X + 14, 44], [X + 20, 60], [X + 104, 42], [X + 98, 62]].forEach(function (d) { b += C(d[0], d[1], 1.2, '#cfd3da'); });
    b += R(X, 285, W, 8, '#6b5236');
    b += T(X + 2, 308, 'Boundaries: Tropopause · Stratopause · Mesopause', { a: 'start', s: 8, c: DIM }).replace('x="' + (X + 2) + '"', 'x="20"');
    b += T(20, 322, 'Memory aid: TSMTE (Troposphere, Stratosphere, Mesosphere, Thermosphere, Exosphere)', { a: 'start', s: 8, c: GOLD });
    b += R(20, 332, 249.6, 12, BLUE) + R(269.6, 332, 67.2, 12, GREEN) + R(336.8, 332, 3.2, 12, ORANGE);
    b += T(145, 342, 'Nitrogen 78%', { s: 8, b: 1, c: '#fff' }) + T(303, 342, 'O₂ 21%', { s: 8, b: 1, c: '#fff' }) + T(340, 357, 'Argon 0.93% · CO₂ ~0.04%', { a: 'end', s: 7.8, c: DIM });
    return svg(360, 364, 'Five layers of the atmosphere from the ground to space, with the share of gases in air', b);
  }

  /* ---------- Mountain types ---------- */
  function mtns() {
    var b = T(180, 14, 'Four kinds of mountains', { b: 1, s: 11 });
    var cells = [['FOLD', ['Himalaya, Alps,', 'Rockies, Andes', '(young)'], GREEN], ['BLOCK', ['Vosges, Black Forest,', 'Sierra Nevada,', 'Satpura'], ORANGE], ['VOLCANIC', ['Fuji, Kilimanjaro,', 'Etna, Vesuvius,', 'Mauna Loa'], RED], ['RESIDUAL', ['Nilgiri, W. Ghats,', 'Vindhya', '(worn down)'], SAND]];
    cells.forEach(function (c, i) {
      var x = 5 + i * 88, g = '';
      g += R(x, 24, 82, 76, '#161d30', ' rx="7"');
      if (i === 0) {
        g += '<path d="M' + (x + 6) + ' 80 q14 -34 28 0 t28 0 t20 0" fill="none" stroke="' + GREEN + '" stroke-width="3"/><path d="M' + (x + 6) + ' 88 q14 -30 28 0 t28 0 t20 0" fill="none" stroke="#3f8a5f" stroke-width="3"/><path d="M' + (x + 6) + ' 96 q14 -26 28 0 t28 0 t20 0" fill="none" stroke="#2d6a47" stroke-width="3"/>';
      } else if (i === 1) {
        g += P('M' + (x + 4) + ' 94 V76 H' + (x + 22) + ' L' + (x + 28) + ' 50 H' + (x + 54) + ' L' + (x + 60) + ' 76 H' + (x + 78) + ' V94 Z', ORANGE, ' opacity=".85"') + L(x + 22, 76, x + 28, 50, '#fff', ' stroke-dasharray="2 2"') + L(x + 60, 76, x + 54, 50, '#fff', ' stroke-dasharray="2 2"');
      } else if (i === 2) {
        g += P('M' + (x + 10) + ' 94 L' + (x + 33) + ' 46 H' + (x + 49) + ' L' + (x + 72) + ' 94 Z', '#7d4a3a') + P('M' + (x + 33) + ' 46 H' + (x + 49) + ' L' + (x + 46) + ' 52 H' + (x + 36) + ' Z', '#ff7a3a') +
          '<path d="M' + (x + 41) + ' 43 q-5 -6 0 -10 q5 -4 0 -8" fill="none" stroke="#9aa2ad" stroke-width="2" opacity=".7"/>';
      } else {
        g += P('M' + (x + 4) + ' 94 L' + (x + 18) + ' 66 H' + (x + 34) + ' L' + (x + 42) + ' 94 Z M' + (x + 44) + ' 94 L' + (x + 52) + ' 62 H' + (x + 64) + ' L' + (x + 78) + ' 94 Z', SAND, ' opacity=".9"');
      }
      g += T(x + 41, 112, c[0], { b: 1, s: 9.5, c: c[2] }) + lines(x + 41, 124, c[1], { s: 7.8, lh: 9.6, c: DIM });
      b += g;
    });
    return svg(360, 160, 'Fold, block, volcanic and residual mountains with Indian and world examples', b);
  }

  /* ---------- Himalaya and the northern plains ---------- */
  function himalaya() {
    var b = T(180, 14, 'North India: a cross-section from the plains up to the Trans-Himalaya', { b: 1, s: 10 });
    b += P('M10 172 H120 L124 160 L142 150 L165 142 L180 126 L200 112 L218 104 L235 96 L248 74 L262 56 L276 76 L290 70 L306 94 L322 90 L338 100 L355 104 V172 Z', '#6a5a48');
    b += P('M248 74 L262 56 L276 76 L268 72 L262 64 L255 72 Z', '#f4f7fb') + P('M284 78 L290 70 L297 82 L291 78 Z', '#f4f7fb');
    var strips = [[10, 36, 'Khadar', '#58b89a'], [36, 70, 'Bhangar', '#8fbf73'], [70, 94, 'Terai', '#4a9d9a'], [94, 124, 'Bhabar', '#c9a66b']];
    strips.forEach(function (s) { b += R(s[0], 172, s[1] - s[0], 16, s[3]) + T((s[0] + s[1]) / 2, 183, s[2], { s: 7, b: 1, c: '#10202a' }); });
    b += T(65, 201, 'Northern plains (alluvium)', { s: 8.2, c: DIM });
    b += T(10, 214, 'S', { a: 'start', s: 9, b: 1, c: GOLD }) + T(350, 214, 'N', { a: 'end', s: 9, b: 1, c: GOLD }) + L(24, 211, 336, 211, LINE);
    function tag(x, ly, ry, name, subs) {
      var g = L(x, ly + subs.length * 10 + 2, x, ry, LINE) + T(x, ly, name, { s: 8.8, b: 1, c: GOLD });
      return g + subs.map(function (t, i) { return T(x, ly + 10 + i * 9, t, { s: 7.2, c: DIM }); }).join('');
    }
    b += tag(142, 112, 146, 'Shiwalik', ['outer · youngest']);
    b += tag(205, 70, 108, 'Himachal', ['lesser Himalaya']);
    b += T(262, 32, 'Himadri', { s: 9.5, b: 1, c: GOLD }) + T(262, 43, 'greater · highest', { s: 7.2, c: DIM });
    b += tag(326, 52, 88, 'Trans-Himalaya', ['Karakoram', 'Ladakh · Zanskar']);
    b += lines(180, 230, ['Regional names: Punjab (Indus–Satluj) · Kumaon (Satluj–Kali)', 'Nepal (Kali–Tista) · Assam (Tista–Dihang)'], { s: 8, lh: 10.5, c: DIM });
    return svg(360, 252, 'Cross-section of the Himalayan ranges and the northern plains from south to north', b);
  }

  /* ---------- India: extent ---------- */
  function india() {
    var X0 = 44, X1 = 334, Y0 = 28, Y1 = 218;
    function px(lon) { return r1(X0 + (lon - 68.1) / (97.42 - 68.1) * (X1 - X0)); }
    function py(lat) { return r1(Y1 - (lat - 8.07) / (37.1 - 8.07) * (Y1 - Y0)); }
    var b = T(180, 14, 'India: the grid it sits on (schematic, not a map)', { b: 1, s: 10.5 });
    b += R(X0, Y0, X1 - X0, Y1 - Y0, '#161d30', ' stroke="' + LINE + '"');
    [70, 80, 90].forEach(function (lo) { b += L(px(lo), Y0, px(lo), Y1, LINE) + T(px(lo), Y1 + 11, lo + '°E', { s: 7.8, c: DIM }); });
    [10, 20, 30].forEach(function (la) { b += L(X0, py(la), X1, py(la), LINE) + T(X0 - 5, py(la) + 3, la + '°N', { s: 7.8, c: DIM, a: 'end' }); });
    b += L(X0, py(23.5), X1, py(23.5), ORANGE, ' stroke-width="1.6" stroke-dasharray="5 4"') + T(X1 - 4, py(23.5) - 4, 'Tropic of Cancer 23½°N · 8 states', { a: 'end', s: 8, c: ORANGE, b: 1, h: 1 });
    b += L(px(82.5), Y0, px(82.5), Y1, '#7fc4ff', ' stroke-width="1.6" stroke-dasharray="5 4"') + T(px(82.5) + 4, py(17), '82½°E · IST', { a: 'start', s: 8, c: '#7fc4ff', b: 1, h: 1 }) + T(px(82.5) + 4, py(17) + 10, 'UP · MP · CG · Odisha · AP', { a: 'start', s: 6.8, c: '#7fc4ff', h: 1 });
    b += C(px(76.8), py(37.1), 4, GOLD) + T(px(76.8) - 8, py(37.1) + 12, 'North: Indira Col', { a: 'end', s: 8, c: GOLD, h: 1 });
    b += C(px(77.5), py(8.1), 4, GOLD) + T(px(77.5) + 8, py(8.1) - 5, 'South: Kanyakumari (mainland)', { a: 'start', s: 8, c: GOLD, h: 1 });
    b += C(px(97.2), py(28.2), 4, GOLD) + T(px(97.2) - 7, py(28.2) + 3, 'East: Kibithu', { a: 'end', s: 8, c: GOLD, h: 1 });
    b += C(px(68.3), py(23.7), 4, GOLD) + T(px(68.3) + 8, py(23.7) + 14, 'West: Guhar Moti', { a: 'start', s: 8, c: GOLD, h: 1 });
    b += T(180, 244, 'Latitude 8°4′N to 37°6′N · Longitude 68°7′E to 97°25′E', { s: 8.8 });
    b += T(180, 257, 'N–S 3,214 km · E–W 2,933 km · 32.8 lakh km² (7th largest) · coast 7,516 km', { s: 8.2, c: DIM });
    b += T(180, 269, 'Extreme south of the whole country: Indira Point (Great Nicobar)', { s: 8.2, c: DIM });
    return svg(360, 278, 'A grid of latitude and longitude showing the extent of India, the Tropic of Cancer and the IST meridian', b);
  }

  /* ================= Class 7 ================= */
  function arrowDefs(id, col) {
    return '<defs><marker id="' + id + '" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="' + col + '"/></marker></defs>';
  }

  /* ---------- Earth's interior ---------- */
  function interior() {
    var cx = 100, cy = 128, b = T(180, 15, "Inside the Earth (radius 6,371 km)", { b: 1, s: 11 });
    b += C(cx, cy, 100, '#8a6a4a') + C(cx, cy, 95, '#c4553f') + C(cx, cy, 54.5, '#e39446') + C(cx, cy, 19, '#f2d06b');
    b += '<path d="M' + cx + ' ' + cy + ' L' + cx + ' ' + (cy - 100) + ' A100 100 0 0 1 ' + (cx + 100) + ' ' + cy + ' Z" fill="' + BG + '" opacity=".25"/>';
    function tag(px, py, ty, name, subs, col) {
      var g = L(px, py, 206, ty - 3, '#cfd3da', ' stroke-width=".8"') + C(px, py, 2.2, '#fff');
      g += T(210, ty, name, { a: 'start', s: 9.5, b: 1, c: col });
      return g + subs.map(function (t, i) { return T(210, ty + 11 + i * 10, t, { a: 'start', s: 8, c: DIM }); }).join('');
    }
    b += tag(150, 42, 40, 'Crust', ['5–70 km thick · ~1% of volume', 'Sial (land) · Sima (ocean floor)'], '#d8b48a');
    b += tag(165, 90, 88, 'Mantle', ['down to 2,900 km · ~84%', 'top part: asthenosphere (magma)'], '#ff8a73');
    b += tag(140, 125, 136, 'Outer core', ['liquid · ~15% of volume (whole core)'], ORANGE);
    b += tag(108, 133, 172, 'Inner core', ['solid · Nife (nickel + iron)', '~5,000°C or more'], GOLD);
    b += R(14, 240, 332, 44, '#161d30', ' rx="7"');
    b += T(180, 254, 'Boundaries (discontinuities)', { s: 8.8, b: 1, c: GOLD });
    b += T(180, 267, 'Moho: crust | mantle  ·  Gutenberg: mantle | core', { s: 8.4 });
    b += T(180, 279, 'Lehmann: outer core | inner core', { s: 8.4 });
    return svg(360, 292, 'Cross-section of the Earth showing crust, mantle, outer core and inner core', b);
  }

  /* ---------- Rock cycle ---------- */
  function rocks() {
    var b = arrowDefs('mk-rock', GOLD) + T(180, 15, 'The rock cycle', { b: 1, s: 11 });
    function node(x, y, name, ex, col) {
      return R(x - 58, y - 20, 116, 42, '#161d30', ' rx="9" stroke="' + col + '" stroke-width="1.6"') +
        T(x, y - 4, name, { s: 10, b: 1, c: col }) + T(x, y + 10, ex, { s: 7.8, c: DIM });
    }
    b += node(180, 48, 'IGNEOUS', 'granite · basalt · pumice', RED);
    b += node(296, 128, 'SEDIMENTARY', 'sandstone · limestone · coal', SAND);
    b += node(180, 208, 'METAMORPHIC', 'marble · slate · gneiss', '#b07cc6');
    b += node(64, 128, 'MAGMA', 'molten rock', ORANGE);
    function arc(d, lx, ly, txt, anchor) {
      return '<path d="' + d + '" fill="none" stroke="' + GOLD + '" stroke-width="1.6" marker-end="url(#mk-rock)"/>' +
        txt.map(function (t, i) { return T(lx, ly + i * 10, t, { s: 8, c: FG, a: anchor || 'middle', h: 1 }); }).join('');
    }
    b += arc('M238 52 Q290 62 296 104', 284, 66, ['weathering,', 'erosion, deposition'], 'start');
    b += arc('M296 152 Q290 196 240 206', 282, 186, ['heat +', 'pressure'], 'start');
    b += arc('M122 206 Q70 196 64 152', 76, 186, ['melting'], 'end');
    b += arc('M64 104 Q70 62 122 52', 78, 70, ['cooling'], 'end');
    b += R(14, 238, 332, 40, '#161d30', ' rx="7"');
    b += T(180, 252, 'limestone → marble · shale → slate → schist', { s: 8.6 });
    b += T(180, 266, 'sandstone → quartzite · granite → gneiss · coal → graphite', { s: 8.6 });
    return svg(360, 288, 'The rock cycle between magma, igneous, sedimentary and metamorphic rock', b);
  }

  /* ---------- Volcano ---------- */
  function volcano() {
    var b = T(180, 15, 'Parts of a volcano', { b: 1, s: 11 });
    b += R(10, 150, 220, 60, '#3a2e26');
    b += P('M20 150 L102 64 H128 L210 150 Z', '#6a4a3a');
    b += '<ellipse cx="115" cy="192" rx="46" ry="13" fill="#e2552c"/>';
    b += P('M111 180 L111 70 H119 L119 180 Z', '#ff7a3a');
    b += P('M102 64 H128 L124 72 H106 Z', '#ff9f4a');
    b += P('M119 70 Q140 92 150 118 Q158 136 170 150 L160 150 Q150 130 142 112 Q133 92 119 76 Z', '#ff7a3a', ' opacity=".9"');
    b += '<path d="M115 56 q-10 -10 0 -18 q12 -8 2 -18" fill="none" stroke="#9aa2ad" stroke-width="7" opacity=".45" stroke-linecap="round"/>';
    [[96, 30], [134, 26], [108, 18], [124, 40]].forEach(function (d) { b += C(d[0], d[1], 2, '#cfd3da', ' opacity=".7"'); });
    function tag(px, py, tx, ty, name, sub) {
      return L(px, py, tx - 4, ty - 3, '#cfd3da', ' stroke-width=".8"') + T(tx, ty, name, { a: 'start', s: 9, b: 1, h: 1 }) + (sub ? T(tx, ty + 10, sub, { a: 'start', s: 7.6, c: '#cfd3da', h: 1 }) : '');
    }
    b += tag(124, 26, 150, 30, 'Ash cloud', '');
    b += tag(128, 66, 150, 56, 'Crater', 'bowl at the top');
    b += tag(119, 100, 162, 84, 'Vent', 'magma rises here');
    b += tag(160, 140, 176, 118, 'Lava', 'above ground');
    b += T(115, 196, 'Magma chamber', { s: 9, b: 1, h: 1 }) + T(115, 207, 'below ground', { s: 7.6, c: '#cfd3da', h: 1 });
    b += R(240, 30, 108, 166, '#161d30', ' rx="8"');
    b += T(294, 46, 'Types', { s: 9.5, b: 1, c: GOLD });
    b += lines(248, 62, ['ACTIVE', 'Mauna Loa, Etna,', 'Stromboli, Barren', 'Island (India)'], { a: 'start', s: 7.8, lh: 10, c: FG }).replace('>ACTIVE<', ' font-weight="700" fill="#ff7a3a">ACTIVE<');
    b += lines(248, 112, ['DORMANT', 'Fuji, Narcondam,', 'Kilimanjaro'], { a: 'start', s: 7.8, lh: 10, c: FG }).replace('>DORMANT<', ' font-weight="700" fill="' + GOLD + '">DORMANT<');
    b += lines(248, 152, ['EXTINCT', 'no eruption in', 'recorded history'], { a: 'start', s: 7.8, lh: 10, c: FG }).replace('>EXTINCT<', ' font-weight="700" fill="' + DIM + '">EXTINCT<');
    b += T(180, 224, 'Ring of Fire (Pacific) holds ~75% of volcanoes · shapes: shield, composite, cinder cone', { s: 8, c: DIM });
    return svg(360, 234, 'Cross-section of a volcano with magma chamber, vent, crater and lava, and its types', b);
  }

  /* ---------- Earthquake ---------- */
  function quake() {
    var fx = 120, fy = 150, b = T(180, 15, 'Earthquake: focus, epicentre and waves', { b: 1, s: 11 });
    b += R(10, 62, 220, 150, '#3a2e26') + R(10, 56, 220, 6, '#5fae7e');
    [18, 32, 46, 60].forEach(function (r, i) { b += C(fx, fy, r, 'none', ' stroke="' + ORANGE + '" stroke-width="1.3" opacity="' + (0.9 - i * 0.18) + '" stroke-dasharray="4 3"'); });
    b += C(fx, fy, 5, RED) + L(fx, fy - 6, fx, 60, '#fff', ' stroke-dasharray="2 3"') + C(fx, 59, 4.5, GOLD);
    b += '<path d="M' + (fx - 22) + ' 44 l6 -6 l6 6 l6 -6 l6 6 l6 -6 l6 6 l6 -6" fill="none" stroke="' + GOLD + '" stroke-width="1.5"/>';
    b += T(fx + 30, 42, 'Epicentre', { a: 'start', s: 9, b: 1, c: GOLD }) + T(fx + 30, 52, 'on the surface, right above', { a: 'start', s: 7.6, c: DIM });
    b += T(fx + 12, fy + 4, 'Focus (hypocentre)', { a: 'start', s: 9, b: 1, c: '#ff8a73', h: 1 }) + T(fx + 12, fy + 14, 'where the rock breaks', { a: 'start', s: 7.6, c: DIM, h: 1 });
    b += R(240, 30, 108, 182, '#161d30', ' rx="8"');
    b += T(294, 46, 'Waves', { s: 9.5, b: 1, c: GOLD });
    function wave(y, d, name, lines2, col) {
      return '<path d="M250 ' + y + ' ' + d + '" fill="none" stroke="' + col + '" stroke-width="1.5"/>' + T(250, y + 16, name, { a: 'start', s: 8.5, b: 1, c: col }) +
        lines2.map(function (t, i) { return T(250, y + 26 + i * 9.5, t, { a: 'start', s: 7.4, c: DIM }); }).join('');
    }
    b += wave(60, 'l6 -5 l6 10 l6 -10 l6 10 l6 -10 l6 10 l6 -10 l6 10 l6 -5', 'P · primary', ['fastest · solid, liquid,', 'gas'], '#7fc4ff');
    b += wave(110, 'q8 -10 16 0 t16 0 t16 0 t16 0', 'S · secondary', ['solids only · cannot', 'cross the liquid outer core'], GREEN);
    b += wave(160, 'q12 -14 24 0 t24 0 t24 0', 'L · surface', ['slowest · most', 'destructive'], RED);
    b += T(180, 228, 'Seismograph records · Richter = magnitude · Mercalli = intensity', { s: 8.2, c: DIM });
    b += T(180, 241, 'India: seismic zones II–V · Zone V is riskiest (NE, Kashmir, Kutch, Andaman)', { s: 8.2, c: DIM });
    return svg(360, 252, 'An earthquake focus underground, the epicentre above it, and the three kinds of waves', b);
  }

  /* ---------- River from source to mouth ---------- */
  function river() {
    var b = T(180, 15, 'A river from source to sea', { b: 1, s: 11 });
    b += '<path d="M14 32 H346" stroke="' + DIM + '" stroke-width="1"/>' + T(14, 28, 'source · steep · erosion', { a: 'start', s: 8, c: DIM }) + T(346, 28, 'mouth · gentle · deposition', { a: 'end', s: 8, c: DIM });
    function panel(x, title, col, draw, words) {
      return R(x, 40, 110, 100, '#161d30', ' rx="8"') + draw + T(x + 55, 154, title, { s: 9.5, b: 1, c: col }) +
        words.map(function (t, i) { return T(x + 55, 166 + i * 10, t, { s: 7.8, c: DIM }); }).join('');
    }
    var p1 = P('M14 52 L60 128 L106 52 V138 H14 Z', '#6a5a48') + P('M52 118 L60 128 L68 118 Z', BLUE) +
      R(86, 66, 8, 22, '#7fc4ff', ' opacity=".8"') + T(60, 62, 'V-shaped valley', { s: 7.4, c: FG });
    var p2 = R(125, 40, 110, 100, '#2f4a2f', ' rx="8" opacity=".55"') +
      '<path d="M180 46 C150 62 150 76 180 84 C210 92 210 108 180 116 C156 122 160 132 180 138" fill="none" stroke="' + BLUE + '" stroke-width="5" stroke-linecap="round"/>' +
      T(206, 68, 'meander', { s: 7.4, c: FG, h: 1 });
    var p3 = R(240, 40, 110, 100, '#2f4a2f', ' rx="8" opacity=".55"') +
      '<path d="M266 44 C262 60 282 66 286 80 C290 92 292 100 295 108" fill="none" stroke="' + BLUE + '" stroke-width="5" stroke-linecap="round"/>' +
      '<path d="M252 62 C238 70 244 86 258 84" fill="none" stroke="#7fc4ff" stroke-width="3.5" stroke-linecap="round"/>' + T(246, 98, 'oxbow', { s: 7.2, c: FG, a: 'start', h: 1 }) +
      P('M295 104 L262 138 H332 Z', '#c9a66b', ' opacity=".85"') +
      '<path d="M295 106 L274 138 M295 106 L296 138 M295 106 L318 138" stroke="' + BLUE + '" stroke-width="2"/>' + T(316, 116, 'delta', { s: 7.4, c: FG, a: 'start', h: 1 });
    b += panel(10, 'Upper course', RED, p1, ['V-valley · gorge · canyon', 'waterfall · rapids', 'potholes']);
    b += panel(125, 'Middle course', GOLD, p2, ['meanders', 'alluvial fans']);
    b += panel(240, 'Lower course', GREEN, p3, ['floodplain · levees', 'oxbow lake · delta']);
    return svg(360, 200, 'Landforms in the upper, middle and lower course of a river', b);
  }

  /* ---------- Sea erosion ---------- */
  function coast() {
    var b = arrowDefs('mk-coast', DIM) + T(180, 15, 'How the sea wears away a headland', { b: 1, s: 11 });
    var Y = 112;
    function sea(x) { return R(x, Y, 78, 40, '#2d6bb0', ' opacity=".55"') + '<path d="M' + x + ' ' + Y + ' q6 -4 12 0 t12 0 t12 0 t12 0 t12 0 t12 0" fill="none" stroke="#7fc4ff" stroke-width="1.4"/>'; }
    var rock = '#8a7a66';
    b += sea(8) + P('M8 ' + Y + ' V40 H70 L80 ' + (Y + 2) + ' H50 Q42 ' + (Y - 22) + ' 30 ' + Y + ' Z', rock);
    b += sea(98) + P('M98 ' + Y + ' V44 H168 L172 ' + Y + ' H150 Q150 ' + (Y - 36) + ' 128 ' + (Y - 36) + ' Q108 ' + (Y - 36) + ' 110 ' + Y + ' Z', rock);
    b += sea(188) + P('M188 ' + Y + ' V48 H212 L214 ' + Y + ' Z', rock) + P('M236 ' + Y + ' L238 56 H256 L260 ' + Y + ' Z', rock);
    b += sea(278) + P('M278 ' + Y + ' V52 H302 L304 ' + Y + ' Z', rock) + P('M328 ' + Y + ' L330 96 H346 L348 ' + Y + ' Z', rock);
    var names = [['1. Cave', 47], ['2. Arch', 137], ['3. Stack', 227], ['4. Stump', 317]];
    names.forEach(function (n) { b += T(n[1], 168, n[0], { s: 9.5, b: 1, c: GOLD }); });
    [[88, 92], [178, 182], [268, 272]].forEach(function (a) { b += L(a[0] - 4, 80, a[1] + 4, 80, DIM, ' stroke-width="1.4" marker-end="url(#mk-coast)"'); });
    b += T(47, 182, 'waves hollow', { s: 7.6, c: DIM }) + T(47, 191, 'out a weak spot', { s: 7.6, c: DIM });
    b += T(137, 182, 'cave cuts right', { s: 7.6, c: DIM }) + T(137, 191, 'through', { s: 7.6, c: DIM });
    b += T(227, 182, 'arch roof falls,', { s: 7.6, c: DIM }) + T(227, 191, 'a pillar is left', { s: 7.6, c: DIM });
    b += T(317, 182, 'stack worn down', { s: 7.6, c: DIM }) + T(317, 191, 'to a stub', { s: 7.6, c: DIM });
    b += T(180, 212, 'Also: sea cliff · wave-cut platform · Deposition: beach · spit · bar · lagoon', { s: 8, c: DIM });
    return svg(360, 222, 'Four stages of sea erosion: cave, arch, stack and stump', b);
  }

  /* ---------- Pressure belts and winds ---------- */
  function winds() {
    var X = 70, W = 150, Y0 = 34, k = 1.3, y = function (lat) { return Y0 + (90 - lat) * k; };
    var b = arrowDefs('mk-wd', '#e8eaed') + T(180, 15, 'Pressure belts and planetary winds', { b: 1, s: 11 });
    var bands = [[90, 60, '#21304d'], [60, 30, '#25384f'], [30, 0, '#2a3f4a'], [0, -30, '#2a3f4a'], [-30, -60, '#25384f'], [-60, -90, '#21304d']];
    bands.forEach(function (bd) { b += R(X, y(bd[0]), W, y(bd[1]) - y(bd[0]), bd[2]); });
    var belts = [[90, 'H', 'Polar high', ''], [60, 'L', 'Subpolar low', '60°'], [30, 'H', 'Subtropical high', '30° · horse latitudes'], [0, 'L', 'Equatorial low', '0° · doldrums'],
      [-30, 'H', 'Subtropical high', '30°S'], [-60, 'L', 'Subpolar low', '60°S'], [-90, 'H', 'Polar high', '']];
    belts.forEach(function (bl) {
      var yy = y(bl[0]), col = bl[1] === 'H' ? ORANGE : '#7fc4ff';
      b += L(X, yy, X + W, yy, col, ' stroke-width="1.4"');
      b += C(X - 14, yy, 8, col) + T(X - 14, yy + 3.5, bl[1], { s: 9, b: 1, c: '#10202a' });
      b += T(X + W + 8, yy + 3, bl[2], { a: 'start', s: 8.6, b: 1, c: col }) + (bl[3] ? T(X + W + 8, yy + 13, bl[3], { a: 'start', s: 7.4, c: DIM }) : '');
    });
    function arrows(lat0, lat1, dx, dy, name) {
      var mid = (y(lat0) + y(lat1)) / 2, g = '';
      [X + 28, X + 75, X + 122].forEach(function (x) { g += L(x - dx / 2, mid - dy / 2, x + dx / 2, mid + dy / 2, '#e8eaed', ' stroke-width="1.5" marker-end="url(#mk-wd)"'); });
      return g + T(X + W / 2, mid + 14, name, { s: 7.6, c: GOLD, b: 1 });
    }
    b += arrows(90, 60, -18, 7, 'polar easterlies') + arrows(60, 30, 18, -7, 'westerlies') + arrows(30, 0, -18, 7, 'NE trade winds');
    b += arrows(0, -30, -18, -7, 'SE trade winds') + arrows(-30, -60, 18, 7, 'westerlies (roaring 40s)') + arrows(-60, -90, -18, -7, 'polar easterlies');
    b += T(180, 292, 'Coriolis: winds bend right in the North, left in the South', { s: 8.6, c: GOLD });
    b += T(180, 305, 'Sea-level pressure 1013.25 mb · H = high pressure, L = low', { s: 8, c: DIM });
    return svg(360, 314, 'Pressure belts from pole to pole with the trade winds, westerlies and polar easterlies', b);
  }

  /* ---------- Rain shadow ---------- */
  function rain() {
    var b = arrowDefs('mk-rn', '#7fc4ff') + T(180, 15, 'Relief (orographic) rain and the rain shadow', { b: 1, s: 11 });
    b += R(10, 160, 70, 24, '#2d6bb0', ' opacity=".6"') + T(45, 176, 'Sea', { s: 8.5, c: '#cfe6ff', b: 1 });
    b += P('M80 184 L80 160 L130 150 L190 60 L205 58 L250 140 L350 152 V184 Z', '#6a5a48');
    b += P('M130 150 L190 60 L180 60 L120 150 Z', '#3f7f4f', ' opacity=".85"');
    b += R(250, 148, 100, 6, '#c9a66b', ' opacity=".7"');
    b += '<path d="M20 150 Q90 140 150 100" fill="none" stroke="#7fc4ff" stroke-width="2" marker-end="url(#mk-rn)"/>';
    b += '<path d="M206 52 Q250 50 300 90" fill="none" stroke="' + SAND + '" stroke-width="2" stroke-dasharray="4 3"/>';
    b += '<ellipse cx="150" cy="70" rx="30" ry="12" fill="#cfd3da" opacity=".9"/><ellipse cx="170" cy="62" rx="22" ry="10" fill="#e8eaed" opacity=".9"/>';
    for (var i = 0; i < 6; i++) b += L(130 + i * 9, 86, 124 + i * 9, 104, '#7fc4ff', ' stroke-width="1.3"');
    b += T(18, 136, 'moist wind', { a: 'start', s: 8, c: '#7fc4ff', b: 1 }) + T(18, 146, 'from the sea', { a: 'start', s: 8, c: '#7fc4ff' });
    b += T(150, 34, 'air rises, cools,', { s: 8, c: FG, h: 1 }) + T(150, 44, 'clouds form', { s: 8, c: FG, h: 1 });
    b += T(306, 108, 'dry air sinks', { s: 8, c: SAND, h: 1 });
    b += T(110, 200, 'WINDWARD', { s: 9, b: 1, c: GREEN }) + T(110, 211, 'heavy rain', { s: 8, c: DIM });
    b += T(296, 200, 'LEEWARD', { s: 9, b: 1, c: SAND }) + T(296, 211, 'rain shadow · dry', { s: 8, c: DIM });
    b += R(14, 222, 332, 46, '#161d30', ' rx="7"');
    b += T(180, 236, 'Other kinds: Convectional (daily, equatorial) · Cyclonic/frontal (air masses meet)', { s: 7.9 });
    b += T(180, 249, 'Example: Western Ghats: Mumbai (windward) is wet, Pune (leeward) is drier', { s: 7.9, c: DIM });
    b += T(180, 262, 'Wettest place: Mawsynram (Meghalaya)', { s: 7.9, c: GOLD });
    return svg(360, 276, 'Moist sea wind rising over a mountain: rain on the windward side, rain shadow on the leeward side', b);
  }

  /* ---------- Ocean currents ---------- */
  function currents() {
    var b = arrowDefs('mk-cw', '#ff7a5a') + arrowDefs('mk-cc', '#6fb6ff') + arrowDefs('mk-cn', '#9aa2ad');
    b += T(180, 15, 'How ocean currents circle (one ocean, simplified)', { b: 1, s: 10.5 });
    b += R(62, 30, 236, 200, '#1d3b66', ' opacity=".55"');
    b += R(10, 30, 52, 200, '#6a5a48') + R(298, 30, 52, 200, '#6a5a48');
    b += L(62, 130, 298, 130, '#cfd3da', ' stroke-dasharray="5 4" opacity=".7"') + T(292, 126, 'Equator', { a: 'end', s: 8, c: '#cfd3da' });
    function seg(d, mk, col, w) { return '<path d="' + d + '" fill="none" stroke="' + col + '" stroke-width="' + (w || 3) + '" marker-end="url(#' + mk + ')"/>'; }
    var W = '#ff7a5a', Cc = '#6fb6ff', N = '#9aa2ad';
    b += seg('M80 82 A100 38 0 0 1 172 44', 'mk-cw', W) + seg('M188 44 A100 38 0 0 1 280 80', 'mk-cn', N, 2) + seg('M280 84 A100 38 0 0 1 188 118', 'mk-cc', Cc) + seg('M172 118 A100 38 0 0 1 80 86', 'mk-cn', N, 2);
    b += seg('M172 142 A100 38 0 0 0 80 176', 'mk-cn', N, 2) + seg('M80 182 A100 38 0 0 0 172 218', 'mk-cw', W) + seg('M188 218 A100 38 0 0 0 280 182', 'mk-cn', N, 2) + seg('M280 176 A100 38 0 0 0 188 142', 'mk-cc', Cc);
    b += T(180, 84, 'clockwise', { s: 8.6, b: 1, c: FG }) + T(180, 96, 'in the North', { s: 7.8, c: DIM });
    b += T(180, 176, 'anticlockwise', { s: 8.6, b: 1, c: FG }) + T(180, 188, 'in the South', { s: 7.8, c: DIM });
    b += '<text x="36" y="130" font-size="8" fill="#f0e2cf" text-anchor="middle" transform="rotate(-90 36 130)" font-weight="700">EAST coast of a continent</text>';
    b += '<text x="324" y="130" font-size="8" fill="#f0e2cf" text-anchor="middle" transform="rotate(90 324 130)" font-weight="700">WEST coast of a continent</text>';
    b += L(14, 246, 30, 246, W, ' stroke-width="3"') + T(36, 249, 'Warm: flows from the equator', { a: 'start', s: 8.2, c: W, b: 1 }) + T(36, 260, 'Gulf Stream, Kuroshio, Brazil, Agulhas', { a: 'start', s: 7.6, c: DIM });
    b += L(186, 246, 202, 246, Cc, ' stroke-width="3"') + T(208, 249, 'Cold: flows toward it', { a: 'start', s: 8.2, c: Cc, b: 1 }) + T(208, 260, 'Labrador, Canary, Humboldt,', { a: 'start', s: 7.6, c: DIM }) + T(208, 270, 'California, Benguela', { a: 'start', s: 7.6, c: DIM });
    b += T(180, 288, 'Cold currents on west coasts → coastal deserts (Atacama, Namib)', { s: 8, c: DIM });
    b += T(180, 300, 'Warm meets cold → fog + rich fishing (Grand Banks)', { s: 8, c: DIM });
    return svg(360, 310, 'Ocean gyres turning clockwise in the north and anticlockwise in the south, warm currents on east coasts and cold on west coasts', b);
  }

  function fig(f, cap) { return { svg: f, cap: cap }; }
  window.NCERT_FIGS = {
    moon: fig(moon(), 'Moon phases · a full cycle takes 29.5 days'),
    tides: fig(tides(), 'Tides follow the Sun–Earth–Moon line-up'),
    planets: fig(planets(), 'Planets in order · terrestrial vs Jovian'),
    meteor: fig(meteor(), 'Asteroid · comet · meteoroid · meteor · meteorite'),
    zones: fig(zones(), 'Key latitudes and heat zones'),
    time: fig(time(), 'Time follows longitude: 15° = 1 hour'),
    seasons: fig(seasons(), 'Revolution + tilt = seasons'),
    water: fig(water(), 'Land vs water, and where fresh water is'),
    atmos: fig(atmos(), 'Layers of the atmosphere'),
    mtns: fig(mtns(), 'Mountain types'),
    himalaya: fig(himalaya(), 'Himalayan ranges and the northern plains'),
    india: fig(india(), 'India: extent, Tropic of Cancer and IST meridian'),
    interior: fig(interior(), "Earth's interior: crust, mantle, core"),
    rocks: fig(rocks(), 'The rock cycle'),
    volcano: fig(volcano(), 'Parts and types of a volcano'),
    quake: fig(quake(), 'Focus, epicentre and P, S, L waves'),
    river: fig(river(), 'River landforms from source to mouth'),
    coast: fig(coast(), 'Sea erosion: cave → arch → stack → stump'),
    winds: fig(winds(), 'Pressure belts and planetary winds'),
    rain: fig(rain(), 'Relief rain and the rain shadow'),
    currents: fig(currents(), 'Ocean gyres: warm and cold currents')
  };
})();
