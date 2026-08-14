/* =========================================================================
   HILTON ROULETTE — アプリケーション
   ========================================================================= */
(() => {
  'use strict';

  const $ = (id) => document.getElementById(id);

  const BRAND_BY_ID = new Map(BRANDS.map((b) => [b.id, b]));
  const REGION_BY_ID = new Map(REGIONS.map((r) => [r.id, r]));
  const OPERATOR_BY_ID = new Map(OPERATORS.map((o) => [o.id, o]));
  const TYPES = [
    { id: 'city', label: 'シティ' },
    { id: 'resort', label: 'リゾート' },
  ];
  const TYPE_BY_ID = new Map(TYPES.map((t) => [t.id, t]));

  /* ---------------------------------------------------------------------
     State
     --------------------------------------------------------------------- */
  const LS = {
    filters: 'hr:filters',
    history: 'hr:history',
    excluded: 'hr:excluded',
  };

  const load = (key, fallback) => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  };
  const save = (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* プライベートモード等では黙って諦める */
    }
  };

  const savedFilters = load(LS.filters, {}) || {};
  const state = {
    regions: new Set(savedFilters.regions || []),
    brands: new Set(savedFilters.brands || []),
    operators: new Set(savedFilters.operators || []),
    types: new Set(savedFilters.types || []),
    upcoming: !!savedFilters.upcoming,
    sound: !!savedFilters.sound,
    excluded: new Set(load(LS.excluded, []) || []),
    history: load(LS.history, []) || [],
    pool: [],
    spinning: false,
    rotation: -Math.PI / 2,
    current: null,
  };

  const persistFilters = () =>
    save(LS.filters, {
      regions: [...state.regions],
      brands: [...state.brands],
      operators: [...state.operators],
      types: [...state.types],
      upcoming: state.upcoming,
      sound: state.sound,
    });

  /* ---------------------------------------------------------------------
     Filtering
     --------------------------------------------------------------------- */
  const sourceList = () => (state.upcoming ? HOTELS.concat(UPCOMING) : HOTELS);

  /** `skip` に指定したグループの条件だけ無視して絞り込む（ファセット件数用） */
  function filtered(skip) {
    return sourceList().filter((h) => {
      if (state.excluded.has(h.n)) return false;
      if (skip !== 'regions' && state.regions.size && !state.regions.has(h.r)) return false;
      if (skip !== 'brands' && state.brands.size && !state.brands.has(h.b)) return false;
      if (skip !== 'operators' && state.operators.size && !state.operators.has(h.o)) return false;
      if (skip !== 'types' && state.types.size && !state.types.has(h.t)) return false;
      return true;
    });
  }

  /* ---------------------------------------------------------------------
     Chips
     --------------------------------------------------------------------- */
  const GROUPS = [
    { key: 'regions', mount: 'regionChips', items: REGIONS, field: 'r' },
    { key: 'brands', mount: 'brandChips', items: BRANDS, field: 'b' },
    { key: 'operators', mount: 'operatorChips', items: OPERATORS, field: 'o' },
    { key: 'types', mount: 'typeChips', items: TYPES, field: 't' },
  ];

  function buildChips() {
    for (const g of GROUPS) {
      const host = $(g.mount);
      host.textContent = '';

      host.appendChild(makeChip('すべて', '', g.key, true));
      for (const item of g.items) {
        host.appendChild(makeChip(item.label, item.id, g.key, false));
      }
    }
  }

  function makeChip(label, value, groupKey, isAll) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'chip';
    btn.dataset.group = groupKey;
    btn.dataset.value = value;
    if (isAll) btn.dataset.all = 'true';
    btn.setAttribute('aria-pressed', 'false');

    const text = document.createElement('span');
    text.textContent = label;
    btn.append(text);

    if (!isAll) {
      const n = document.createElement('span');
      n.className = 'chip__n';
      btn.append(n);
    }

    btn.addEventListener('click', () => {
      if (state.spinning) return;
      const set = state[groupKey];
      if (isAll) {
        set.clear();
      } else if (set.has(value)) {
        set.delete(value);
      } else {
        set.add(value);
      }
      persistFilters();
      refresh();
    });

    return btn;
  }

  function syncChips() {
    for (const g of GROUPS) {
      const base = filtered(g.key);
      const counts = new Map();
      for (const h of base) counts.set(h[g.field], (counts.get(h[g.field]) || 0) + 1);

      for (const chip of $(g.mount).querySelectorAll('.chip')) {
        const value = chip.dataset.value;
        if (chip.dataset.all) {
          const on = state[g.key].size === 0;
          chip.dataset.on = String(on);
          chip.setAttribute('aria-pressed', String(on));
          continue;
        }
        const n = counts.get(value) || 0;
        const on = state[g.key].has(value);
        chip.dataset.on = String(on);
        chip.setAttribute('aria-pressed', String(on));
        chip.dataset.disabled = String(n === 0 && !on);
        chip.querySelector('.chip__n').textContent = n;
      }
    }
  }

  /* ---------------------------------------------------------------------
     Wheel
     --------------------------------------------------------------------- */
  const canvas = $('wheel');
  const ctx = canvas.getContext('2d');
  const TAU = Math.PI * 2;
  let sprite = null;
  let sizePx = 0;
  let labels = [];
  let geom = null;

  const TIER_COLORS = {
    luxury: ['#3d1424', '#4b1a2d'],
    lifestyle: ['#0f2b2a', '#153735'],
    full: ['#101b33', '#17243f'],
    focused: ['#191922', '#21212c'],
  };

  function fitCanvas() {
    const rect = canvas.getBoundingClientRect();
    if (!rect.width) return false;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const px = Math.max(240, Math.round(rect.width * dpr));
    if (px === sizePx) return false;
    sizePx = px;
    canvas.width = px;
    canvas.height = px;
    return true;
  }

  function fitText(c, text, maxWidth) {
    if (c.measureText(text).width <= maxWidth) return text;
    let out = text;
    while (out.length > 1 && c.measureText(out + '…').width > maxWidth) {
      out = out.slice(0, -1);
    }
    return out + '…';
  }

  function buildSprite() {
    if (!sizePx) return;
    const px = sizePx;
    sprite = document.createElement('canvas');
    sprite.width = px;
    sprite.height = px;

    const c = sprite.getContext('2d');
    const R = px / 2 - 1;
    const rIn = R * 0.29;
    const pool = state.pool;

    labels = [];
    geom = null;

    c.translate(px / 2, px / 2);

    // 盤面ベース
    c.beginPath();
    c.arc(0, 0, R, 0, Math.PI * 2);
    c.fillStyle = '#0a0a12';
    c.fill();

    if (!pool.length) return;

    const seg = (Math.PI * 2) / pool.length;
    const single = pool.length === 1;

    pool.forEach((h, i) => {
      const tier = (BRAND_BY_ID.get(h.b) || {}).tier || 'full';
      const shades = TIER_COLORS[tier] || TIER_COLORS.full;
      const a0 = i * seg;
      const a1 = a0 + seg;

      c.beginPath();
      if (single) {
        c.arc(0, 0, R, 0, Math.PI * 2);
      } else {
        c.moveTo(0, 0);
        c.arc(0, 0, R, a0, a1);
        c.closePath();
      }
      c.fillStyle = shades[i % 2];
      c.fill();

      if (!single) {
        c.strokeStyle = 'rgba(216,178,95,.30)';
        c.lineWidth = Math.max(1, px * 0.0016);
        c.stroke();
      }
    });

    // 中心へ向かう陰影
    const shade = c.createRadialGradient(0, 0, rIn * 0.7, 0, 0, R);
    shade.addColorStop(0, 'rgba(0,0,0,.55)');
    shade.addColorStop(0.45, 'rgba(0,0,0,0)');
    shade.addColorStop(1, 'rgba(0,0,0,.42)');
    c.beginPath();
    c.arc(0, 0, R, 0, Math.PI * 2);
    c.fillStyle = shade;
    c.fill();

    // ラベルは回転に合わせて向きを変えるため、描画時に別途重ねる。
    // ここでは「半径方向に収まる最大の文字サイズ」を実測して決めておく。
    const maxWidth = R * 0.92 - rIn - px * 0.012;
    const REF = 100;
    c.font = `500 ${REF}px "Shippori Mincho", serif`;

    let widest = 1;
    for (const h of pool) widest = Math.max(widest, c.measureText(h.s).width);

    const fontSize = Math.max(
      px * 0.018,
      Math.min(
        (maxWidth / widest) * REF, // 最長ラベルが収まる大きさ
        seg * R * 0.62,            // 区画の幅（弧）からはみ出さない大きさ
        px * 0.05                  // 大きくなりすぎない上限
      )
    );

    geom = { R, rIn, fontSize };
    c.font = `500 ${fontSize}px "Shippori Mincho", serif`;
    labels = pool.map((h) => fitText(c, h.s, maxWidth));

    // 内外のゴールドリング
    c.beginPath();
    c.arc(0, 0, rIn, 0, Math.PI * 2);
    c.strokeStyle = 'rgba(216,178,95,.5)';
    c.lineWidth = Math.max(1, px * 0.003);
    c.stroke();

    c.beginPath();
    c.arc(0, 0, R - px * 0.004, 0, Math.PI * 2);
    c.strokeStyle = 'rgba(253,246,227,.32)';
    c.lineWidth = Math.max(1, px * 0.004);
    c.stroke();
  }

  /** 盤面がどの角度でも文字が上下逆にならないよう、毎フレーム描き直す */
  function drawLabels() {
    const pool = state.pool;
    if (!geom || !pool.length) return;

    const seg = TAU / pool.length;
    const { R, fontSize } = geom;

    ctx.save();
    ctx.translate(sizePx / 2, sizePx / 2);
    ctx.font = `500 ${fontSize}px "Shippori Mincho", serif`;
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#f2e2b6';

    for (let i = 0; i < pool.length; i++) {
      const angle = state.rotation + i * seg + seg / 2;
      const onScreen = ((angle % TAU) + TAU) % TAU;
      const flip = onScreen > Math.PI / 2 && onScreen < Math.PI * 1.5;

      ctx.save();
      ctx.rotate(flip ? angle + Math.PI : angle);
      ctx.textAlign = flip ? 'left' : 'right';
      ctx.fillText(labels[i], flip ? -R * 0.92 : R * 0.92, 0);
      ctx.restore();
    }
    ctx.restore();
  }

  function render() {
    if (!sizePx) return;
    ctx.clearRect(0, 0, sizePx, sizePx);
    if (!sprite) return;

    ctx.save();
    ctx.translate(sizePx / 2, sizePx / 2);
    ctx.rotate(state.rotation);
    ctx.drawImage(sprite, -sizePx / 2, -sizePx / 2);
    ctx.restore();

    drawLabels();
  }

  /* ---------------------------------------------------------------------
     Sound（クリック音）
     --------------------------------------------------------------------- */
  let audioCtx = null;
  function tick() {
    if (!state.sound) return;
    try {
      audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
      if (audioCtx.state === 'suspended') audioCtx.resume();
      const t = audioCtx.currentTime;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(1750, t);
      osc.frequency.exponentialRampToValueAtTime(760, t + 0.045);
      gain.gain.setValueAtTime(0.06, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.055);
      osc.connect(gain).connect(audioCtx.destination);
      osc.start(t);
      osc.stop(t + 0.06);
    } catch {
      /* 音が出せない環境では無視 */
    }
  }

  function fanfare() {
    if (!state.sound) return;
    try {
      audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
      const base = audioCtx.currentTime;
      [0, 0.09, 0.18].forEach((offset, i) => {
        const t = base + offset;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime([784, 988, 1319][i], t);
        gain.gain.setValueAtTime(0.0001, t);
        gain.gain.exponentialRampToValueAtTime(0.09, t + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
        osc.connect(gain).connect(audioCtx.destination);
        osc.start(t);
        osc.stop(t + 0.55);
      });
    } catch {
      /* 同上 */
    }
  }

  /* ---------------------------------------------------------------------
     Spin
     --------------------------------------------------------------------- */
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)');

  /** 抽選中は盤面と結果がずれないようフィルタ操作を止める */
  function setBusy(busy) {
    $('spinBtn').disabled = busy || state.pool.length === 0;
    const panel = document.querySelector('.panel');
    if (panel) {
      panel.toggleAttribute('inert', busy);
      panel.dataset.busy = String(busy);
    }
  }

  function randomIndex(max) {
    if (window.crypto && window.crypto.getRandomValues) {
      // 剰余バイアスを避けるため、範囲外の値は引き直す
      const limit = Math.floor(0xffffffff / max) * max;
      const buf = new Uint32Array(1);
      let v;
      do {
        window.crypto.getRandomValues(buf);
        v = buf[0];
      } while (v >= limit);
      return v % max;
    }
    return Math.floor(Math.random() * max);
  }

  function spin() {
    if (state.spinning || !state.pool.length) return;

    const pool = state.pool;
    const winner = randomIndex(pool.length);
    const seg = TAU / pool.length;

    // 針（12時 = -90°）に winner の区画中心＋ゆらぎが来る回転量
    const jitter = (Math.random() - 0.5) * seg * 0.7;
    const target = -Math.PI / 2 - (winner + 0.5) * seg + jitter;

    // 時計回りに turns 周ぶん回したうえで target と合同になる角度へ
    const turns = 5 + randomIndex(3);
    const from = state.rotation;
    const minTo = from + TAU * turns;
    const to = target + Math.ceil((minTo - target) / TAU) * TAU;

    const duration = prefersReduced.matches ? 420 : 5200;
    const start = performance.now();
    let lastSeg = -1;

    state.spinning = true;
    setBusy(true);
    $('ticket').classList.remove('is-new');

    const easeOut = (p) => 1 - Math.pow(1 - p, 4);

    function frame(now) {
      const p = Math.min(1, (now - start) / duration);
      state.rotation = from + (to - from) * easeOut(p);
      render();

      if (!prefersReduced.matches) {
        // 針の下にある区画が変わるたびにカチッと鳴らす
        const local = ((((-Math.PI / 2 - state.rotation) % TAU) + TAU) % TAU) / seg;
        const idx = Math.floor(local);
        if (idx !== lastSeg) {
          if (lastSeg !== -1) tick();
          lastSeg = idx;
        }
      }

      if (p < 1) {
        requestAnimationFrame(frame);
      } else {
        state.rotation = ((to % TAU) + TAU) % TAU;
        render();
        state.spinning = false;
        setBusy(false);
        announce(pool[winner]);
        fanfare();
      }
    }
    requestAnimationFrame(frame);
  }

  /* ---------------------------------------------------------------------
     Result
     --------------------------------------------------------------------- */
  function shareText(h) {
    const brand = BRAND_BY_ID.get(h.b) || {};
    const tier = TIERS[brand.tier] || {};
    const lines = [
      '🥂 今夜の一泊は、ここに決まり。',
      '',
      h.n,
      `ブランド：${brand.label}（${tier.label}）`,
      `エリア：${(REGION_BY_ID.get(h.r) || {}).label}／${h.p} ${h.c}`,
      `運営元：${(OPERATOR_BY_ID.get(h.o) || {}).label}`,
    ];
    if (h.when) lines.push(`※ ${h.when} 開業予定`);
    lines.push('', `地図 ▶ ${mapUrl(h)}`, '', '— HILTON ROULETTE');
    return lines.join('\n');
  }

  const mapUrl = (h) =>
    'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(h.n);
  const searchUrl = (h) =>
    'https://www.google.com/search?q=' + encodeURIComponent(h.n + ' 公式サイト');

  function announce(h) {
    state.current = h;

    const brand = BRAND_BY_ID.get(h.b) || {};
    const tier = TIERS[brand.tier] || {};

    $('tTier').textContent = tier.en || '';
    $('tBrand').textContent = brand.label || '';
    $('tName').textContent = h.n;
    $('tPlace').textContent = `${h.p} ${h.c}` + (h.when ? `（${h.when} 開業予定）` : '');
    $('tRegion').textContent = (REGION_BY_ID.get(h.r) || {}).label || '';
    $('tType').textContent = (TYPE_BY_ID.get(h.t) || {}).label || '';
    $('tOperator').textContent = (OPERATOR_BY_ID.get(h.o) || {}).label || '';

    $('tMap').href = mapUrl(h);
    $('tSearch').href = searchUrl(h);
    $('shareLine').href = 'https://line.me/R/share?text=' + encodeURIComponent(shareText(h));
    $('shareStatus').textContent = '';

    const ticket = $('ticket');
    ticket.hidden = false;
    // アニメーションを再生し直すためにクラスを付け直す
    ticket.classList.remove('is-new');
    void ticket.offsetWidth;
    ticket.classList.add('is-new');

    pushHistory(h);
  }

  /* ---------------------------------------------------------------------
     History
     --------------------------------------------------------------------- */
  function pushHistory(h) {
    state.history.unshift({
      n: h.n,
      p: h.p,
      c: h.c,
      b: h.b,
      at: new Date().toISOString(),
    });
    state.history = state.history.slice(0, 12);
    save(LS.history, state.history);
    renderHistory();
  }

  function renderHistory() {
    const panel = $('historyPanel');
    const list = $('historyList');
    if (!state.history.length) {
      panel.hidden = true;
      list.textContent = '';
      return;
    }
    panel.hidden = false;
    list.textContent = '';

    state.history.forEach((item, i) => {
      const li = document.createElement('li');

      const no = document.createElement('span');
      no.className = 'history__no';
      no.textContent = String(i + 1).padStart(2, '0');

      const name = document.createElement('span');
      name.className = 'history__name';
      name.textContent = item.n;

      const meta = document.createElement('span');
      meta.className = 'history__meta';
      const d = new Date(item.at);
      const stamp = Number.isNaN(d.getTime())
        ? ''
        : `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
      meta.textContent = `${item.p} ${item.c}　${stamp}`;

      li.append(no, name, meta);
      list.append(li);
    });
  }

  /* ---------------------------------------------------------------------
     Refresh
     --------------------------------------------------------------------- */
  function refresh() {
    state.pool = filtered(null);

    syncChips();
    $('matchCount').textContent = state.pool.length;

    const hasExcluded = state.excluded.size > 0;
    $('excludedNote').hidden = !hasExcluded;
    $('excludedCount').textContent = state.excluded.size;

    $('wheelEmpty').hidden = state.pool.length > 0;
    $('spinBtn').disabled = state.pool.length === 0 || state.spinning;
    canvas.setAttribute(
      'aria-label',
      `ホテル抽選ルーレット（対象 ${state.pool.length} 軒）`
    );

    buildSprite();
    render();
  }

  /* ---------------------------------------------------------------------
     Wiring
     --------------------------------------------------------------------- */
  function init() {
    $('totalCount').textContent = HOTELS.length;

    buildChips();

    $('includeUpcoming').checked = state.upcoming;
    $('soundOn').checked = state.sound;

    $('includeUpcoming').addEventListener('change', (e) => {
      state.upcoming = e.target.checked;
      persistFilters();
      refresh();
    });

    $('soundOn').addEventListener('change', (e) => {
      state.sound = e.target.checked;
      persistFilters();
      if (state.sound) tick();
    });

    $('spinBtn').addEventListener('click', spin);
    $('respinBtn').addEventListener('click', () => {
      document.getElementById('stage').scrollIntoView({ block: 'center' });
      spin();
    });

    $('excludeBtn').addEventListener('click', () => {
      if (!state.current) return;
      state.excluded.add(state.current.n);
      save(LS.excluded, [...state.excluded]);
      refresh();
      if (state.pool.length) {
        document.getElementById('stage').scrollIntoView({ block: 'center' });
        spin();
      }
    });

    $('clearExcluded').addEventListener('click', () => {
      state.excluded.clear();
      save(LS.excluded, []);
      refresh();
    });

    $('resetBtn').addEventListener('click', () => {
      state.regions.clear();
      state.brands.clear();
      state.operators.clear();
      state.types.clear();
      state.upcoming = false;
      $('includeUpcoming').checked = false;
      persistFilters();
      refresh();
    });

    $('clearHistory').addEventListener('click', () => {
      state.history = [];
      save(LS.history, []);
      renderHistory();
    });

    // 共有
    if (navigator.share) {
      const btn = $('shareNative');
      btn.hidden = false;
      btn.addEventListener('click', async () => {
        if (!state.current) return;
        try {
          await navigator.share({
            title: 'HILTON ROULETTE',
            text: shareText(state.current),
          });
        } catch {
          /* ユーザーがキャンセルした場合など */
        }
      });
    }

    $('shareCopy').addEventListener('click', async () => {
      if (!state.current) return;
      const text = shareText(state.current);
      try {
        await navigator.clipboard.writeText(text);
        $('shareStatus').textContent = 'コピーしました。';
      } catch {
        $('shareStatus').textContent = 'コピーできませんでした。テキストを長押しで選択してください。';
      }
      setTimeout(() => ($('shareStatus').textContent = ''), 2600);
    });

    // 盤面のサイズ追従
    const ro = new ResizeObserver(() => {
      if (fitCanvas()) {
        buildSprite();
        render();
      }
    });
    ro.observe(canvas);

    // Web フォント読み込み後にラベルを描き直す
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => {
        buildSprite();
        render();
      });
    }

    fitCanvas();
    renderHistory();
    refresh();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
