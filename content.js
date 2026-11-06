/* GitGraph Live v0.3 — живой граф коммитов и надзор за ветками поверх GitHub.
 * Вкладка «Граф»: точка = коммит (цвет = ветка/линия), линия = связь родитель→ребёнок.
 * Вкладка «Ветки»: рейтинг брошенности — кто не обновлялся N дней.
 * Данные: публичный GitHub API; при лимите — демо-режим. Языки: EN/RU (авто). */
(() => {
  if (window.__gglLoaded) return;
  window.__gglLoaded = true;

  const TOKEN_KEY = 'ggl_token';
  const STALE_DAYS = 30;
  const WORN_DAYS = 14;
  const COLORS = ['#58a6ff', '#f778ba', '#26a269', '#e8a33d', '#b081f5', '#33d17a', '#e05661', '#1c71d8'];
  const ROW_H = 26, LANE_W = 20, PAD_L = 16, PAD_T = 18;

  /* ---------- i18n ---------- */
  const LANG = (navigator.language || '').toLowerCase().startsWith('ru') ? 'ru' : 'en';
  const T = {
    ru: {
      fab_title: '⎇ GitGraph Live — граф коммитов и брошенные ветки',
      initial: 'Нажми ⟳, чтобы загрузить данные.',
      tab_graph: 'Граф', tab_branches: 'Ветки 🪦',
      tt_refresh: 'Обновить данные', tt_token: 'Токен GitHub (5000 запросов/час вместо 60)', tt_close: 'Закрыть',
      tt_play: 'Проиграть историю (таймлапс)', tt_speed: 'Скорость анимации',
      token_prompt: 'Токен GitHub (необязателен). Оставь пустым, чтобы убрать:',
      loading: 'Загружаю…',
      err_commits: 'коммиты', err_branches: 'ветки', err_branch_date: 'дата ветки',
      err_repo: 'описание репозитория', err_compare: 'сравнение с основной веткой',
      limit_hint: 'лимит API — добавь токен 🔑', timeout_note: ' (таймаут 12 c)',
      unexpected: 'неожиданная ошибка:', demo_meantime: 'пока показываю демо.',
      demo_note: 'Демо-режим: так будет выглядеть настоящий граф.',
      commits_note: (n) => `Последние ${n} коммитов. Вертикаль слева — ствол (основная ветка); изгиб на точке «Merge …» — чья-то ветка влилась.`,
      branches_label: 'Веток', of: 'из', stale_stat: 'брошенных', worn_stat: 'на грани', days_short: 'дн.',
      truncated_note: (n) => `Показаны даты для первых ${n} веток (лимит API без токена). Вставь токен 🔑 — покажем до 100.`,
      branches_footer: '🪦 давний застой, вероятно можно удалить · ⏳ свежесть на грани · ✅ живые. Значки: ↓ отстаёт от main, ↑ впереди, ❔ без сравнения. Клик — открывает ветку на GitHub.',
      tt_behind: 'коммитов позади основной ветки', tt_ahead: 'коммитов впереди основной ветки',
      stale_top: (name, n) => `Максимальный разрыв: ${name} — позади на ${n}`,
      date_unavailable: 'дата недоступна', today: 'сегодня', yesterday: 'вчера', days_ago: (d) => `${d} дн. назад`,
      demo_list_prefix: 'Пока — демо-список:', not_received: 'Данные ещё не получены — нажми ⟳.',
      render_error: 'Ошибка отрисовки', unexpected_short: 'сбой',
      repo_demo: 'демо',
    },
    en: {
      fab_title: '⎇ GitGraph Live — commit graph & stale branches',
      initial: 'Press ⟳ to load data.',
      tab_graph: 'Graph', tab_branches: 'Branches 🪦',
      tt_refresh: 'Refresh data', tt_token: 'GitHub token (5,000 req/hour instead of 60)', tt_close: 'Close',
      tt_play: 'Play the history (timelapse)', tt_speed: 'Animation speed',
      token_prompt: 'GitHub token (optional). Leave empty to remove:',
      loading: 'Loading…',
      err_commits: 'commits', err_branches: 'branches', err_branch_date: 'branch date',
      err_repo: 'repository info', err_compare: 'comparison with the default branch',
      limit_hint: 'API limit — add a token 🔑', timeout_note: ' (12 s timeout)',
      unexpected: 'unexpected error:', demo_meantime: 'showing demo meanwhile.',
      demo_note: 'Demo mode: this is what the real graph will look like.',
      commits_note: (n) => `Last ${n} commits. The left vertical is the trunk (default branch); a curve meeting a “Merge …” dot = that branch merged in.`,
      branches_label: 'Branches', of: 'of', stale_stat: 'stale', worn_stat: 'at risk', days_short: 'days',
      truncated_note: (n) => `Dates shown for the first ${n} branches (API limit without token). Add a token 🔑 to cover up to 100.`,
      branches_footer: '🪦 stale, safe to delete · ⏳ borderline · ✅ alive. Badges: ↓ behind main, ↑ ahead, ❔ not compared. Click opens the branch on GitHub.',
      tt_behind: 'commits behind the default branch', tt_ahead: 'commits ahead of the default branch',
      stale_top: (name, n) => `Biggest gap: ${name} — ${n} behind`,
      date_unavailable: 'date unavailable', today: 'today', yesterday: 'yesterday', days_ago: (d) => `${d} d ago`,
      demo_list_prefix: 'Showing demo list meanwhile:', not_received: 'No data yet — press ⟳.',
      render_error: 'Render error', unexpected_short: 'glitch',
      repo_demo: 'demo',
    },
  };
  const t = (k) => (T[LANG][k] !== undefined ? T[LANG][k] : (T.en[k] !== undefined ? T.en[k] : k));

  const esc = (s) => String(s ?? '').replace(/[&<>"']/g,
    (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
  const daysAgo = (date) => (date ? Math.floor((Date.now() - Date.parse(date)) / 86400000) : null);
  const fmtAge = (d) => (d === null ? t('date_unavailable') : d <= 0 ? t('today') : d === 1 ? t('yesterday') : t('days_ago')(d));

  /* fetch с таймаутом: GitHub не отвечает — не ждём вечно */
  const FETCH_MS = 12000;
  function timedFetch(url, opts = {}) {
    const ctrl = new AbortController();
    const tm = setTimeout(() => ctrl.abort(), FETCH_MS);
    return fetch(url, { ...opts, signal: ctrl.signal }).finally(() => clearTimeout(tm));
  }

  let loadSeqId = 0; // защита от наложений: старые загрузки не перезаписывают свежие

  /* Кэш на 10 минут: повторные открытия панели не расходуют лимит API */
  const CACHE_MS = 10 * 60 * 1000;
  function cacheGet(key) {
    try {
      const raw = sessionStorage.getItem('ggl:' + key);
      if (!raw) return null;
      const o = JSON.parse(raw);
      return (Date.now() - o.ts < CACHE_MS) ? o.data : null;
    } catch { return null; }
  }
  function cacheSet(key, data) {
    try { sessionStorage.setItem('ggl:' + key, JSON.stringify({ ts: Date.now(), data })); } catch { /* приватный режим — переживём */ }
  }

  const state = { repo: null, commits: null, branches: null, tab: 'commits', demo: false, commitsError: null, branchesError: null, branchesTotal: null };
  let panel = null;

  /* ---------- Демо-данные (когда API недоступен) ---------- */
  function demoData() {
    const day = 86400000;
    const d = (n) => new Date(Date.now() - n * day).toISOString().slice(0, 10);
    const mk = (sha, msg, author, n, parents = []) => ({ sha, msg, author, parents, date: d(n) });
    return [
      mk('a1b2c3d', 'feat: initialize project', 'Ann', 14),
      mk('b2c3d4e', 'feat: landing page layout', 'Ann', 13, ['a1b2c3d']),
      mk('c3d4e5f', 'feat: login page (branch auth)', 'Bob', 12, ['b2c3d4e']),
      mk('d4e5f6a', 'style: dark theme', 'Ann', 11, ['b2c3d4e']),
      mk('e5f6a7b', 'fix: button offset', 'Ann', 10, ['d4e5f6a']),
      mk('f6a7b8c', 'feat: product cards (branch catalog)', 'Kate', 9, ['e5f6a7b']),
      mk('1178fed', 'fix: CORS errors', 'Ann', 8, ['e5f6a7b']),
      mk('2278fed', "Merge branch 'auth'", 'Kate', 7, ['1178fed', 'c3d4e5f']),
      mk('3378fed', 'refactor: state storage', 'Bob', 6, ['2278fed']),
      mk('4478fed', 'feat: shopping cart', 'Kate', 5, ['3378fed']),
      mk('5578fed', "Merge branch 'catalog'", 'Ann', 4, ['4478fed', 'f6a7b8c']),
      mk('6678fed', 'docs: README', 'Ann', 3, ['5578fed']),
      mk('7788fed', 'fix: memory leak in chat', 'Bob', 2, ['6678fed']),
      mk('8888fed', 'chore: bump dependencies', 'Ann', 1, ['7788fed']),
      mk('9998fed', 'feat: dark cart theme', 'Ann', 0, ['8888fed']),
    ];
  }
  function demoBranches() {
    const day = 86400000;
    const d = (n) => new Date(Date.now() - n * day).toISOString();
    return [
      { name: 'feature/new-core-engine', author: 'Bob', date: d(96), behind: 480, ahead: 0 },
      { name: 'feature/chats-2.0', author: 'Kate', date: d(41), behind: 120, ahead: 0 },
      { name: 'bugfix/memory-leak', author: 'Bob', date: d(17), behind: 23, ahead: 3 },
      { name: 'feature/dark-theme', author: 'Ann', date: d(2), behind: 2, ahead: 8 },
    ];
  }

  /* ---------- Раскладка lanes ----------
   * Стратегия «одна цепочка первых родителей — одна линия»:
   * 1) ствол: от самого свежего коммита вниз по parents[0] → линия 0;
   * 2) каждая побочная ветка каждого merge → своя вертикальная линия;
   * 3) ствол всегда слева, линии не пересекают чужие точки. */
  function layout(newestFirst) {
    const bySha = new Map(newestFirst.map((c) => [c.sha, c]));
    const row = new Map();
    newestFirst.forEach((c, i) => row.set(c.sha, i));
    const laneOf = new Map();
    let maxLane = -1;
    const newLane = () => ++maxLane;
    const walkChain = (startSha, lane) => {
      let cur = startSha;
      while (cur && bySha.has(cur) && !laneOf.has(cur)) {
        laneOf.set(cur, lane);
        cur = bySha.get(cur).parents[0];
      }
    };
    if (newestFirst.length) walkChain(newestFirst[0].sha, newLane());
    for (const c of newestFirst) {
      for (let i = 1; i < c.parents.length; i++) {
        walkChain(c.parents[i], newLane());
      }
    }
    for (const c of newestFirst) if (!laneOf.has(c.sha)) laneOf.set(c.sha, newLane()); // страховка
    const edges = [];
    for (const c of newestFirst) {
      const cl = laneOf.get(c.sha), cr = row.get(c.sha);
      for (const p of c.parents) {
        if (!bySha.has(p)) { edges.push({ cl, cr, parent: null }); continue; }
        edges.push({ cl, cr, pl: laneOf.get(p), pr: row.get(p) });
      }
    }
    return { laneOf, edges, maxLane: Math.max(0, maxLane) };
  }

  /* ---------- Рендер SVG ---------- */
  function renderSVG(data) {
    const { laneOf, edges, maxLane } = layout(data);
    const n = data.length;
    const graphW = PAD_L + (maxLane + 1) * LANE_W;
    const width = graphW + 500; // граф слева, подписи в отдельном столбце справа
    const height = PAD_T * 2 + n * ROW_H;
    const cx = (l) => PAD_L + l * LANE_W + 9;
    const cy = (r) => PAD_T + r * ROW_H + 6;
    const color = (l) => COLORS[l % COLORS.length];

    let dots = '', labels = '', lines = '';
    data.forEach((c, r) => {
      const x = cx(laneOf.get(c.sha)), y = cy(r), col = color(laneOf.get(c.sha));
      const msg = c.msg.length > 46 ? c.msg.slice(0, 46) + '…' : c.msg;
      dots += `<circle class="ggl-dot" data-r="${r}" data-cx="${x}" data-cy="${y}" style="animation-delay:${r * 55}ms" cx="${x}" cy="${y}" r="5" fill="${col}" stroke="#12161c" stroke-width="2"><title>${esc(c.author)} · ${esc(c.msg)}</title></circle>`;
      labels += `<text class="ggl-label" data-r="${r}" style="animation-delay:${r * 55 + 120}ms" x="${graphW + 14}" y="${y + 4}"><tspan class="ggl-msg">${esc(msg)}</tspan><tspan class="ggl-meta" dx="8">${esc(c.author)} · ${esc(c.date.slice(0, 10))}</tspan></text>`;
    });
    edges.forEach((e) => {
      const col = color(e.cl), x1 = cx(e.cl), y1 = cy(e.cr);
      const attrs = `class="ggl-edge" data-r="${e.cr}"`;
      if (e.parent === null) {
        lines += `<path ${attrs} d="M${x1} ${y1} L${x1} ${y1 + 10}" stroke="${col}" stroke-width="2" opacity="0.55" fill="none"/>`;
        return;
      }
      const x2 = cx(e.pl), y2 = cy(e.pr);
      const k = Math.min(14, Math.max(6, (y2 - y1) / 3));
      lines += (x1 === x2)
        ? `<path ${attrs} d="M${x1} ${y1} L${x1} ${y2}" stroke="${col}" stroke-width="2" fill="none"/>`
        : `<path ${attrs} d="M${x1} ${y1} C ${x1} ${y1 + k}, ${x2} ${y2 - k}, ${x2} ${y2}" stroke="${col}" stroke-width="2" fill="none"/>`;
    });
    const cursor = `<circle class="ggl-cursor" cx="-99" cy="-99" r="7"/>`;
    return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">${lines}${dots}${labels}${cursor}</svg>`;
  }

  /* ---------- Загрузка данных ---------- */
  async function loadAll() {
    const seq = ++loadSeqId;
    const r = location.pathname.match(/^\/([^/]+)\/([^/]+)/);
    state.repo = r ? { owner: r[1], name: r[2] } : null;
    state.commitsError = state.branchesError = null;
    state.branchesTotal = null;
    if (!state.repo) {
      state.commits = demoData();
      state.branches = demoBranches();
      state.demo = true;
      renderTab();
      return;
    }
    renderTab(true); // показываем «Загружаю…»
    try {
      const headers = { Accept: 'application/vnd.github+json' };
      const token = localStorage.getItem(TOKEN_KEY);
      if (token) headers.Authorization = 'Bearer ' + token;
      const base = `https://api.github.com/repos/${state.repo.owner}/${state.repo.name}`;
      const fruited = (labelKey, res) => {
        if (!res.ok) throw new Error(`${t('err_' + labelKey)}: HTTP ${res.status}${(res.status === 403 || res.status === 429) ? ` (${t('limit_hint')})` : ''}`);
        return res.json();
      };

      // 1) кэш — если всё свежее, API не трогаем
      const ck = `${state.repo.owner}/${state.repo.name}`;
      const cachedCommits = cacheGet('c:' + ck);
      if (cachedCommits) { state.commits = cachedCommits; state.demo = false; }
      const cachedBranches = cacheGet('b2:' + ck);
      if (cachedBranches) { state.branches = cachedBranches.branches; state.branchesTotal = cachedBranches.total; }
      if (cachedCommits && cachedBranches) { renderTab(); return; }

      // 2) добираем из API только недостающее
      const jobs = [];
      if (!cachedCommits) jobs.push(['commits', timedFetch(base + '/commits?per_page=40', { headers }).then((res) => fruited('commits', res))]);
      if (!cachedBranches) jobs.push(['branches', timedFetch(base + '/branches?per_page=100', { headers }).then((res) => fruited('branches', res))]);
      const results = await Promise.allSettled(jobs.map((j) => j[1]));
      if (seq !== loadSeqId) return; // устаревшая загрузка → выходим тихо
      const resOf = (label) => results[jobs.findIndex((j) => j[0] === label)];
      const whyTxt = (reason) => {
        const msg = `${(reason && reason.message) || reason || ''}`;
        return msg + (/aborted/i.test(msg) ? t('timeout_note') : '');
      };

      if (!cachedCommits) {
        const commitsRes = resOf('commits');
        if (commitsRes.status === 'fulfilled') {
          state.commits = commitsRes.value.map((c) => ({
            sha: c.sha.slice(0, 7),
            msg: (c.commit.message || '').split('\n')[0],
            author: (c.commit.author && c.commit.author.name) || '—',
            date: c.commit.author && c.commit.author.date,
            parents: c.parents.map((p) => p.sha.slice(0, 7)),
          }));
          state.demo = false;
          cacheSet('c:' + ck, state.commits);
        } else {
          state.commits = demoData();
          state.commitsError = whyTxt(commitsRes.reason);
          state.demo = true;
        }
      }
      if (!cachedBranches) {
        const branchesRes = resOf('branches');
        if (branchesRes.status === 'fulfilled') {
          // /branches отдаёт только sha кончика ветки. Разрыв и дату меряем через /compare:
          // один запрос на ветку даёт behind_by + ahead_by + head_commit (дата+автор) сразу.
          const raw = branchesRes.value;
          const limit = token ? 100 : 25;
          const sample = raw.slice(0, limit);
          let baseBranch = null, repoInfo = null;
          try {
            repoInfo = await timedFetch(base, { headers }).then((res) => fruited('repo', res));
            baseBranch = repoInfo.default_branch;
          } catch { /* сравнение отметим недоступным ниже */ }
          if (seq !== loadSeqId) return;
          const cmpRequests = sample.map((br) => (baseBranch && br.name !== baseBranch)
            ? timedFetch(`${base}/compare/${encodeURIComponent(baseBranch)}...${encodeURIComponent(br.name)}`, { headers })
            : Promise.resolve(null));
          const cmpRes = await Promise.allSettled(cmpRequests.map((req) => req.then((res) => (res === null ? null : fruited('compare', res)))));
          if (seq !== loadSeqId) return;
          const pickDate = (c) => ({ author: (c.commit.author && c.commit.author.name) || '—', date: (c.commit.committer && c.commit.committer.date) || (c.commit.author && c.commit.author.date) });
          state.branches = sample.map((br, i) => {
            let date = null, author = '—', behind = null, ahead = null;
            const cmp = cmpRes[i];
            if (br.name === baseBranch && repoInfo) { // основная ветка: разрыв нулевой, дата = последний пуш
              behind = 0; ahead = 0; date = repoInfo.pushed_at || null;
            } else if (cmp.status === 'fulfilled' && cmp.value) {
              behind = cmp.value.behind_by; ahead = cmp.value.ahead_by;
              // head_commit иногда отсутствует в ответе → дата живёт в commits[0],
              // это новейший коммит на стороне ветки (массив отсортирован от свежих).
              const head = cmp.value.head_commit;
              const local = (head && head.commit) ? head : ((cmp.value.commits && cmp.value.commits.length) ? cmp.value.commits[0] : null);
              if (local) { ({ author, date } = pickDate(local)); }
            } else {
              const inline = br.commit.commit && (br.commit.commit.committer || br.commit.commit.author); // GitHub внезапно вернул дату сразу
              if (inline) {
                author = (br.commit.commit.author && br.commit.commit.author.name) || '—';
                date = (br.commit.commit.committer && br.commit.commit.committer.date) || (br.commit.commit.author && br.commit.commit.author.date);
              }
            }
            return { name: br.name, sha: String(br.commit.sha).slice(0, 7), author, date, behind, ahead };
          });
          // Добор дат, которых compare не дал (осиротевшие/слитые ветки, сбой запроса):
          // 1 запрос на такую ветку — обычный случай не дороже старой доборки по хешам.
          const needDate = state.branches.map((b, i) => ({ b, i })).filter(({ b }) => !b.date).slice(0, limit);
          if (needDate.length) {
            const dateRes = await Promise.allSettled(needDate.map(({ b }) =>
              timedFetch(`${base}/commits/${b.sha}`, { headers }).then((res) => fruited('branch_date', res))));
            if (seq !== loadSeqId) return;
            dateRes.forEach((d, j) => {
              if (d.status !== 'fulfilled') return;
              const fix = pickDate(d.value);
              Object.assign(state.branches[needDate[j].i], fix);
            });
          }
          state.branchesTotal = raw.length;
          cacheSet('b2:' + ck, { branches: state.branches, total: state.branchesTotal });
        } else {
          state.branchesError = whyTxt(branchesRes.reason);
        }
      }
    } catch (err) {
      console.error('[GitGraph Live] loadAll', err);
      if (state.demo) state.commitsError = state.commitsError || `${t('unexpected')} ${(err && err.message) || err}`;
      state.branchesError = state.branchesError || `${(err && err.message) || err}`;
      if (!state.commits) { state.commits = demoData(); state.demo = true; }
      if (!state.branches) state.branches = [];
    } finally {
      if (seq === loadSeqId) renderTab(); // UI оживает при любом исходе
    }
  }

  /* ---------- Таймлапс «Проиграть историю» ----------
   * idle ▶ → playing ⏸ → paused ▶ → done ↺ (снова ▶ = рестарт).
   * Граф скрывается целиком; коммиты «вырастают» снизу вверх (от старых к новым),
   * пульсирующий курсор ведёт зрителя по текущей точке. */
  let playState = 'idle';   // idle | playing | paused | done
  let playTimer = null;
  let playIdx = 0;          // текущая строка (идём от старых к новым => от дна вверх)
  let playSpeed = 1;        // 1x | 2x | 4x
  const PLAY_BASE_MS = 140;

  const playGlyph = { idle: '▶', playing: '⏸', paused: '▶', done: '↺' };

  function playBtn() { return panel && panel.querySelector('[data-act="play"]'); }
  function setPlayGlyph() { const b = playBtn(); if (b) b.textContent = playGlyph[playState]; }

  function stopPlayTimer() { if (playTimer) { clearTimeout(playTimer); playTimer = null; } }

  function setPlayMode(on) {
    const svg = panel.querySelector('.ggl-body svg');
    if (svg) svg.classList.toggle('ggl-playmode', on);
  }

  function hideAllRows() {
    panel.querySelectorAll('.ggl-body [data-r]').forEach((el) => el.classList.remove('ggl-on'));
    const cur = panel.querySelector('.ggl-cursor');
    if (cur) cur.style.display = 'none';
  }

  function playStep() {
    if (playState !== 'playing') return;
    const svg = panel.querySelector('.ggl-body svg');
    if (!svg || !document.contains(svg)) { playState = 'idle'; setPlayGlyph(); return; }
    if (playIdx < 0) { // конец
      playState = 'done';
      stopPlayTimer();
      setPlayGlyph();
      return;
    }
    svg.querySelectorAll(`[data-r="${playIdx}"]`).forEach((el) => el.classList.add('ggl-on'));
    const dot = svg.querySelector(`circle.ggl-dot[data-r="${playIdx}"]`);
    const cur = svg.querySelector('.ggl-cursor');
    if (cur && dot) {
      cur.style.display = '';
      cur.classList.add('live');
      cur.setAttribute('cx', dot.dataset.cx);
      cur.setAttribute('cy', dot.dataset.cy);
    }
    playIdx--;
    const nextIdx = playIdx;
    playTimer = setTimeout(playStep, Math.max(30, Math.round(PLAY_BASE_MS / playSpeed)));
    if (nextIdx < 0) return; // последний шаг — ждём финала в конце
  }

  function togglePlay() {
    if (state.tab !== 'commits') { state.tab = 'commits'; renderTab(); }
    const svg = panel.querySelector('.ggl-body svg');
    if (!svg) return;
    if (playState === 'idle' || playState === 'done') { // старт/рестарт
      stopPlayTimer();
      setPlayMode(true);
      hideAllRows();
      playIdx = state.commits ? state.commits.length - 1 : 14;
      playState = 'playing';
      setPlayGlyph();
      playTimer = setTimeout(playStep, 220); // мини-пауза, чтобы скрытие применилось
      return;
    }
    if (playState === 'playing') { // пауза
      playState = 'paused';
      stopPlayTimer();
      setPlayGlyph();
      return;
    }
    if (playState === 'paused') { // продолжить
      playState = 'playing';
      setPlayGlyph();
      playTimer = setTimeout(playStep, Math.max(30, Math.round(PLAY_BASE_MS / playSpeed)));
    }
  }

  function resetPlay() {
    stopPlayTimer();
    playState = 'idle';
    setPlayMode(false);
    setPlayGlyph();
  }

  function cycleSpeed() {
    playSpeed = playSpeed === 1 ? 2 : playSpeed === 2 ? 4 : 1;
    const b = panel.querySelector('[data-act="speed"]');
    if (b) b.textContent = `⚡${playSpeed}x`;
  }

  /* ---------- Рендер вкладок ---------- */
  function renderCommits(body) {
    body.innerHTML = '';
    resetPlay();
    if (state.commitsError) {
      body.insertAdjacentHTML('beforeend', `<div class="ggl-status">⚠ ${esc(state.commitsError)} — ${esc(t('demo_meantime'))}</div>`);
    }
    body.insertAdjacentHTML('beforeend', renderSVG(state.commits));
    if (state.demo) body.insertAdjacentHTML('beforeend', `<div class="ggl-note">${esc(t('demo_note'))}</div>`);
    else body.insertAdjacentHTML('beforeend', `<div class="ggl-note">${esc(t('commits_note')(state.commits.length))}</div>`);
  }

  function branchIcon(days) {
    if (days === null) return ['❔', 'ggl-worn'];
    if (days >= STALE_DAYS) return ['🪦', 'ggl-stale'];
    if (days >= WORN_DAYS) return ['⏳', 'ggl-worn'];
    return ['✅', 'ggl-fresh'];
  }

  function renderBranches(body) {
    body.innerHTML = '';
    if (state.branchesError) {
      body.insertAdjacentHTML('beforeend', `<div class="ggl-status">⚠ ${esc(state.branchesError)}</div>`);
      if (!state.branches) return;
      body.insertAdjacentHTML('beforeend', `<div class="ggl-status">${esc(t('demo_list_prefix'))}</div>`);
    }
    if (!state.branches) {
      body.insertAdjacentHTML('beforeend', `<div class="ggl-status">${esc(t('not_received'))}</div>`);
      return;
    }
    const list = state.branches
      .map((b) => ({ ...b, days: daysAgo(b.date) }))
      .sort((a, b) => ((b.days ?? -1) - (a.days ?? -1)));
    const stale = list.filter((b) => b.days !== null && b.days >= STALE_DAYS).length;
    const worn = list.filter((b) => b.days !== null && b.days >= WORN_DAYS && b.days < STALE_DAYS).length;
    body.insertAdjacentHTML('beforeend',
      `<div class="ggl-note">${esc(t('branches_label'))}: ${list.length}${state.branchesTotal > list.length ? ` ${esc(t('of'))} ${state.branchesTotal}` : ''} · 🪦 ${esc(t('stale_stat'))} (&gt;${STALE_DAYS} ${esc(t('days_short'))}): ${stale} · ⏳ ${esc(t('worn_stat'))} (&gt;${WORN_DAYS}): ${worn}</div>`);
    // «Максимальный разрыв»: ветка, которая дальше всех от main (сводка по behind)
    const worst = list.reduce((w, b) => ((b.behind || 0) > (w ? (w.behind || 0) : -1) ? b : w), null);
    if (worst && (worst.behind || 0) > 0) {
      body.insertAdjacentHTML('beforeend', `<div class="ggl-note ggl-gap">🪓 ${esc(t('stale_top')(worst.name, worst.behind > 999 ? '999+' : worst.behind))}</div>`);
    }    if (state.branchesTotal > list.length) {
      body.insertAdjacentHTML('beforeend', `<div class="ggl-note">${esc(t('truncated_note')(list.length))}</div>`);
    }
    const repoUrl = state.repo ? `https://github.com/${state.repo.owner}/${state.repo.name}/tree/` : '#';
    // Бейджи разрыва: ↓N — отстаёт от main (оранжевый), ↑N — впереди (синий); нули приглушены
    const badge = (val, cls, titleKey, glyph) => {
      if (val === null || val === undefined) return '';
      const zero = val === 0 ? ' ggl-zero' : '';
      return `<span class="ggl-badge ${cls}${zero}" title="${esc(t(titleKey))}">${glyph}${val > 999 ? '999+' : val}</span>`;
    };
    list.forEach((b) => {
      const [icon, cls] = branchIcon(b.days);
      body.insertAdjacentHTML('beforeend',
        `<a class="ggl-row" href="${repoUrl}${encodeURIComponent(b.name)}" target="_blank" rel="noopener">` +
        `<span class="ggl-st ${cls}">${icon}</span>` +
        `<span class="ggl-bname">${esc(b.name)}</span>` +
        badge(b.behind, 'ggl-bh', 'tt_behind', '↓') +
        badge(b.ahead, 'ggl-ah', 'tt_ahead', '↑') +
        `<span class="ggl-bmeta">${esc(b.author)} · ${esc(fmtAge(b.days))}</span></a>`);
    });
    body.insertAdjacentHTML('beforeend', `<div class="ggl-note">${esc(t('branches_footer'))}</div>`);
  }

  function safeRender(labelKey, fn, body) {
    try {
      fn(body);
    } catch (err) {
      console.error('[GitGraph Live]', err);
      body.insertAdjacentHTML('beforeend', `<div class="ggl-status">⚠ ${esc(t('render_error'))} (${esc(t(labelKey))}): ${esc((err && err.message) || String(err))}</div>`);
    }
  }

  function renderTab(loading = false) {
    if (!panel) return;
    panel.querySelector('.ggl-repo').textContent = state.repo ? `${state.repo.owner}/${state.repo.name}` : t('repo_demo');
    panel.querySelectorAll('.ggl-tab').forEach((el) => el.classList.toggle('ggl-active', el.dataset.act === `tab-${state.tab}`));
    const body = panel.querySelector('.ggl-body');
    if (loading) { body.innerHTML = `<div class="ggl-status">${esc(t('loading'))}</div>`; return; }
    if (state.tab === 'branches') safeRender('tab_branches', renderBranches, body);
    else safeRender('tab_graph', renderCommits, body);
  }

  /* ---------- UI ---------- */
  function ensurePanel() {
    if (panel) return panel;
    panel = document.createElement('div');
    panel.className = 'ggl-panel ggl-hidden';
    panel.innerHTML = `
      <div class="ggl-head">
        <span class="ggl-title">⎇ GitGraph Live</span>
        <span class="ggl-repo"></span>
        <span class="ggl-spacer"></span>
        <button class="ggl-tab" data-act="tab-commits" title="${esc(t('tab_graph'))}">${esc(t('tab_graph'))}</button>
        <button class="ggl-tab" data-act="tab-branches" title="${esc(t('tab_branches'))}">${esc(t('tab_branches'))}</button>
        <button class="ggl-btn" data-act="play" title="${esc(t('tt_play'))}">▶</button>
        <button class="ggl-btn" data-act="speed" title="${esc(t('tt_speed'))}">⚡1x</button>
        <button class="ggl-btn" data-act="refresh" title="${esc(t('tt_refresh'))}">⟳</button>
        <button class="ggl-btn" data-act="token" title="${esc(t('tt_token'))}">🔑</button>
        <button class="ggl-btn" data-act="close" title="${esc(t('tt_close'))}">✕</button>
      </div>
      <div class="ggl-body"><div class="ggl-status">${esc(t('initial'))}</div></div>`;
    document.body.appendChild(panel);

    panel.addEventListener('click', (e) => {
      const btn = e.target.closest('.ggl-btn, .ggl-tab');
      if (!btn) return;
      const act = btn.dataset.act;
      if (act === 'close') panel.classList.add('ggl-hidden');
      if (act === 'refresh') loadAll();
      if (act === 'play') togglePlay();
      if (act === 'speed') cycleSpeed();      if (act === 'token') {
        const cur = localStorage.getItem(TOKEN_KEY) || '';
        const tk = prompt(t('token_prompt'), cur);
        if (tk !== null) {
          Object.keys(sessionStorage).filter((k) => k.startsWith('ggl:')).forEach((k) => sessionStorage.removeItem(k));
          tk.trim() ? localStorage.setItem(TOKEN_KEY, tk.trim()) : localStorage.removeItem(TOKEN_KEY);
          loadAll();
        }
      }
      if (act === 'tab-commits' || act === 'tab-branches') {
        state.tab = act === 'tab-branches' ? 'branches' : 'commits';
        renderTab();
      }
    });
    return panel;
  }

  function openPanel() {
    const p = ensurePanel();
    p.classList.remove('ggl-hidden');
    const r = location.pathname.match(/^\/([^/]+)\/([^/]+)/);
    const repoKey = r ? `${r[1]}/${r[2]}` : '';
    if (p.dataset.repo !== repoKey) { // репозиторий сменился (SPA) → перезагружаем данные
      p.dataset.repo = repoKey;
      loadAll();
      p.querySelector('.ggl-body').scrollTop = 0;
    }
  }

  const fab = document.createElement('button');
  fab.className = 'ggl-fab';
  fab.title = t('fab_title');
  fab.textContent = '⎇';
  fab.addEventListener('click', () => {
    const p = ensurePanel();
    if (p.classList.contains('ggl-hidden')) openPanel();
    else p.classList.add('ggl-hidden');
  });
  document.body.appendChild(fab);

  /* Клик по иконке расширения на тулбаре — открыть панель */
  if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
    chrome.runtime.onMessage.addListener((msg) => {
      if (msg && msg.type === 'ggl_open') openPanel();
    });
  }
})();
