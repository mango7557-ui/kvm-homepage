/* 한국벤처경영원 RAG 챗봇
   1) 지식베이스: kvm-data-v2.js의 검수 완료(ok:1) FAQ + 회사소개 + 투자기업 + 세율표
   2) 검색: 한글 2-gram + 단어 가중치로 상위 4개 문서 선택
   3) 생성: 선택된 문서만 근거로 답변, 근거 없으면 상담 안내 */
(function () {
  const D = window;
  const KB = [];
  const add = (id, cat, title, text, href) => KB.push({ id, cat, title, text, href });

  add('about', '회사소개', '한국벤처경영원은 어떤 곳인가요?',
    '한국벤처경영원(KVM)은 벤처투자 소득공제·개인투자조합 전문 정보·컨설팅 기관입니다. 미국채·부동산·음악저작권 기반 벤처기업의 투자를 소개하고, 투자자가 벤처투자 소득공제를 받을 수 있도록 안내합니다. 개인투자조합의 결성·운용은 중소벤처기업부 등록 창업기획자인 유스업파트너스(주)가 업무집행조합원(GP)으로서 담당합니다. 한국벤처경영원은 조합 운용기관이 아닙니다. 2014년 창립 이래 업력 12년 이상, 누적 투자금액 1,984억원, 투자건수 9,495건, 누적 환급세액 655억원(가안, 전산 집계 기준)의 성과를 보유하고 있습니다.', '#about');
  add('venture', '제도소개', '벤처투자 소득공제 구조',
    '개인이 개인공동투자(직접투자) 또는 개인투자조합(간접투자)에 출자해 벤처인증기업에 투자하면 투자금을 소득공제하여 세금을 환급합니다. 투자 수단은 상환전환우선주(RCPS)·전환사채(CB) 등입니다.', '#system-intro');
  add('direct', '개인공동투자', '개인공동투자(직접투자) 방식은 무엇인가요?',
    '개인공동투자(직접투자)는 투자자 개인 명의로 벤처인증기업의 신주·전환사채 등을 직접 인수하여 조세특례제한법 제16조에 따라 3,000만원 이하 100%, 3,000~5,000만원 70%, 5,000만원 초과 30% 소득공제를 받는 방식입니다. 기업 선정 및 인수계약 체결 후 주금을 납입하고 출자·투자확인서를 발급받아 연말정산 또는 종합소득세 신고 시 제출합니다.', '#direct-invest');
  add('cases', '성공사례', '개인별·그룹별 절세 성공사례',
    'SK하이닉스(192건), 삼성(86건), 전문직 그룹 등 대기업 임직원과 전문직 투자자들이 성과급 시즌 및 연말 공제 한도 진단을 통해 매년 소득공제 환급 혜택을 받고 있습니다.', '#cases');
  add('contact', '상담', '상담 방법',
    '1:1 소득공제 상담은 홈페이지 상담 신청 폼 또는 카카오톡 채널(평일, 담당자 직접 답변)로 신청할 수 있습니다. 온라인 투자설명회는 월 1회 진행합니다.', '#contact');
  (D.KVM_FAQ || []).filter(f => f.ok).forEach((f, i) => add('faq' + i, f.c, f.q, f.a, '#faq'));
  add('pf', '투자기업', '게재 투자기업 목록',
    (D.KVM_PORTFOLIO || []).map(p => `${p.n}(${p.a}): ${p.d}`).join(' / '), '#companies');
  add('rates', '세율', '한계세율(지방소득세 포함) 구간표',
    (D.KVM_RATES || []).map(r => `과세표준 ${r.t}: ${r.r}%`).join(' / ') + '. 소득공제 환급률은 본인의 한계세율과 같습니다.', '#simulator');

  /* ---------- retrieval ---------- */
  const norm = s => s.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, ' ');
  const grams = s => {
    const out = [];
    norm(s).split(/\s+/).filter(Boolean).forEach(w => {
      out.push('w:' + w);
      if (/\d/.test(w)) out.push('n:' + w.replace(/[^\d]/g, ''));
      for (let i = 0; i < w.length - 1; i++) out.push(w.slice(i, i + 2));
    });
    return out;
  };
  const docs = KB.map(d => {
    const tf = {};
    grams(d.title + ' ' + d.title + ' ' + d.cat + ' ' + d.text).forEach(g => tf[g] = (tf[g] || 0) + 1);
    return { d, tf };
  });
  const df = {};
  docs.forEach(x => Object.keys(x.tf).forEach(g => df[g] = (df[g] || 0) + 1));
  const idf = g => Math.log(1 + docs.length / (df[g] || 0.5));
  function retrieve(q, k = 4) {
    const qg = [...new Set(grams(q))];
    return docs.map(x => {
      let s = 0;
      qg.forEach(g => { if (x.tf[g]) s += idf(g) * (1 + Math.log(x.tf[g])) * (g.startsWith('w:') ? 1.6 : 1); });
      return { d: x.d, s };
    }).filter(r => r.s > 2.5).sort((a, b) => b.s - a.s).slice(0, k);
  }

  /* ---------- UI v4 (2026 대화형 AI 트렌드) ---------- */
  const SUGG = ['3,000만원 투자하면 얼마나 돌려받나요?', '국민성장펀드와 뭐가 달라요?', '개인투자조합으로 투자해도 공제되나요?'];
  const svg = (p, w = 18, sw = 2) => '<svg width="' + w + '" height="' + w + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="' + sw + '" stroke-linecap="round" stroke-linejoin="round">' + p + '</svg>';
  const IC = {
    spark: '<svg class="i-spark" width="26" height="26" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.5l1.9 5.6 5.6 1.9-5.6 1.9L12 17.5l-1.9-5.6L4.5 10l5.6-1.9z"/><path d="M19 15l.8 2.2 2.2.8-2.2.8L19 21l-.8-2.2-2.2-.8 2.2-.8z" opacity=".7"/></svg>',
    sparkS: '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.5l1.9 5.6 5.6 1.9-5.6 1.9L12 17.5l-1.9-5.6L4.5 10l5.6-1.9z"/></svg>',
    sparkL: '<svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.5l1.9 5.6 5.6 1.9-5.6 1.9L12 17.5l-1.9-5.6L4.5 10l5.6-1.9z"/><path d="M19 15l.8 2.2 2.2.8-2.2.8L19 21l-.8-2.2-2.2-.8 2.2-.8z" opacity=".7"/></svg>',
    xl: svg('<path d="M6 6l12 12M18 6L6 18"/>', 22, 2.2).replace('<svg', '<svg class="i-x"'),
    x: svg('<path d="M6 6l12 12M18 6L6 18"/>', 18),
    xs: svg('<path d="M6 6l12 12M18 6L6 18"/>', 12, 2.4),
    reset: svg('<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>', 17),
    grow: svg('<path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>', 16).replace('<svg', '<svg class="i-grow"'),
    shrink: svg('<path d="M4 14h6v6M20 10h-6V4M14 10l7-7M3 21l7-7"/>', 16).replace('<svg', '<svg class="i-shrink"'),
    up: svg('<path d="M12 19V5M5 12l7-7 7 7"/>', 18, 2.4),
    arrow: svg('<path d="M7 17L17 7M8 7h9v9"/>', 15),
    ret: svg('<path d="M9 10l-5 5 5 5"/><path d="M20 4v7a4 4 0 0 1-4 4H4"/>', 14),
    copy: svg('<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/>', 15),
    check: svg('<path d="M5 12l5 5L20 7"/>', 15, 2.4),
    up1: svg('<path d="M7 10v11H3V10zM7 10l4-8a3 3 0 0 1 3 3v4h6a2 2 0 0 1 2 2.3l-1.4 8A2 2 0 0 1 18.6 21H7"/>', 15),
    dn1: svg('<path d="M17 14V3h4v11zM17 14l-4 8a3 3 0 0 1-3-3v-4H4a2 2 0 0 1-2-2.3l1.4-8A2 2 0 0 1 5.4 3H17"/>', 15),
    calc: svg('<rect x="4" y="2" width="16" height="20" rx="2"/><path d="M8 6h8M8 11h.01M12 11h.01M16 11h.01M8 15h.01M12 15h.01M16 15h.01M8 19h8"/>', 17),
    team: svg('<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14a6 6 0 0 1 3.5 6"/>', 17),
    bldg: svg('<path d="M3 21h18M5 21V7l7-4 7 4v14"/><path d="M9 10h.01M15 10h.01M9 14h.01M15 14h.01M10 21v-3h4v3"/>', 17),
  };
  const TOPICS = [
    [IC.calc, '공제율·한도 계산', '소득공제', '벤처투자 소득공제율과 한도를 알려주세요.'],
    [IC.team, '조합 가입 요건', '개인투자조합', '개인투자조합 투자 시 소득공제 요건을 알려주세요.'],
    [IC.bldg, '대상 기업 확인', '투자기업', '게재된 투자기업은 어떤 곳이 있나요?'],
  ];
  const root = document.createElement('div');
  root.className = 'kc';
  root.innerHTML = '' +
    '<button class="kc-fab" aria-label="AI 소득공제 안내 열기">' + IC.spark + IC.xl + '</button>' +
    '<div class="kc-nudge"><button type="button" class="kc-nudge-open"><b>AI 소득공제 안내</b>내 소득이면 얼마나 환급받을 수 있을까요? 지금 물어보세요.</button><button type="button" class="kc-nudge-x" aria-label="안내 닫기">' + IC.xs + '</button></div>' +
    '<div class="kc-w closed" role="dialog" aria-label="AI 소득공제 안내">' +
      '<div class="kc-hd">' +
        '<div class="kc-orb">' + IC.sparkS + '</div>' +
        '<div class="kc-title"><b>AI 소득공제 안내 <span class="kc-badge">BETA</span></b><span><i></i>검수된 FAQ·제도 자료 기반</span></div>' +
        '<button class="kc-ib kc-reset" title="새 대화" aria-label="새 대화">' + IC.reset + '</button>' +
        '<button class="kc-ib kc-grow" title="크게 보기" aria-label="크게 보기">' + IC.grow + IC.shrink + '</button>' +
        '<button class="kc-ib kc-close" title="닫기" aria-label="닫기">' + IC.x + '</button>' +
      '</div>' +
      '<div class="kc-body" aria-live="polite"></div>' +
      '<div class="kc-ft">' +
        '<form class="kc-comp">' +
          '<textarea rows="1" maxlength="300" placeholder="소득공제에 대해 무엇이든 물어보세요" aria-label="질문"></textarea>' +
          '<button class="kc-send" type="submit" disabled aria-label="보내기">' + IC.up + '</button>' +
        '</form>' +
        '<p class="kc-note">AI 답변은 참고용이며 세무 자문이 아닙니다. 실제 공제액은 개인 소득·투자 조건에 따라 달라집니다.</p>' +
      '</div>' +
    '</div>';
  document.body.appendChild(root);

  const $ = s => root.querySelector(s);
  const panel = $('.kc-w'), log = $('.kc-body'), form = $('.kc-comp'), input = form.querySelector('textarea'), send = $('.kc-send'), nudge = $('.kc-nudge');
  let history = [];
  let busy = false;

  const esc = s => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const scroll = () => requestAnimationFrame(() => log.scrollTop = log.scrollHeight);
  function bubble(role, html) {
    const el = document.createElement('div');
    el.className = 'kc-row ' + role;
    el.innerHTML = (role === 'me' ? '' : '<div class="kc-orb sm">' + IC.sparkS + '</div>') + '<div class="kc-bub">' + html + '</div>';
    log.appendChild(el); scroll(); return el;
  }
  const fmt = t => esc(t.trim()).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\[(\d)\]/g, '<i class="kc-cite">$1</i>').replace(/\n/g, '<br>');

  function welcome() {
    log.innerHTML =
      '<div class="kc-hello"><div class="kc-orb lg">' + IC.sparkL + '</div>' +
      '<h2>안녕하세요!<br><em>무엇을 도와드릴까요?</em></h2>' +
      '<p>벤처투자 소득공제, 개인투자조합, 투자기업에 대해<br>검수된 자료를 근거로 답변해 드려요.</p></div>' +
      '<div class="kc-topics kc-sg">' + TOPICS.map(t => '<button class="kc-topic" data-q="' + t[3] + '"><span class="ico">' + t[0] + '</span><span><b>' + t[1] + '</b><small>' + t[2] + '</small></span></button>').join('') + '</div>' +
      '<div class="kc-slab kc-sg">자주 묻는 질문</div>' +
      '<div class="kc-faq kc-sg">' + SUGG.map(s => '<button data-q="' + s + '"><span>' + s + '</span>' + IC.arrow + '</button>').join('') + '</div>';
    log.scrollTop = 0;
  }

  const open = v => {
    panel.classList.toggle('closed', !v); root.classList.toggle('on', v);
    if (v) { nudge.classList.add('gone'); setTimeout(() => input.focus(), 80); }
  };
  const isOpen = () => !panel.classList.contains('closed');
  $('.kc-fab').onclick = () => open(!isOpen());
  $('.kc-close').onclick = () => open(false);
  $('.kc-grow').onclick = () => panel.classList.toggle('wide');
  $('.kc-reset').onclick = () => { if (!busy) { history = []; welcome(); input.focus(); } };
  nudge.onclick = e => { if (e.target.closest('.kc-nudge-x')) { nudge.classList.add('gone'); e.stopPropagation(); return; } if (e.target.closest('.kc-nudge-open')) open(true); };
  log.addEventListener('scroll', () => panel.classList.toggle('scrolled', log.scrollTop > 4));
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && isOpen()) open(false); });
  log.addEventListener('click', e => {
    const b = e.target.closest('[data-q]'); if (b) return ask(b.dataset.q);
    const a = e.target.closest('[data-act]'); if (!a) return;
    const row = a.closest('.kc-row');
    if (a.dataset.act === 'copy') {
      navigator.clipboard && navigator.clipboard.writeText(row.dataset.raw || '');
      a.innerHTML = IC.check; a.dataset.tip = '복사됨'; setTimeout(() => { a.innerHTML = IC.copy; a.dataset.tip = '복사'; }, 1400);
    } else {
      row.querySelectorAll('[data-act=up],[data-act=dn]').forEach(x => x.classList.toggle('on', x === a && !a.classList.contains('on')));
    }
  });
  const autosize = () => { input.style.height = 'auto'; input.style.height = Math.min(input.scrollHeight, 120) + 'px'; };
  input.addEventListener('input', () => { autosize(); send.disabled = busy || !input.value.trim(); });
  input.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); form.requestSubmit(); } });
  form.onsubmit = e => { e.preventDefault(); const q = input.value.trim(); if (q) ask(q); };

  /* 스트리밍 타이핑 효과 */
  function stream(bub, text, after) {
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) { bub.innerHTML = fmt(text) + after; return Promise.resolve(); }
    return new Promise(res => {
      let i = 0; const step = Math.max(2, Math.round(text.length / 90));
      const tick = () => {
        i = Math.min(text.length, i + step);
        const part = text.slice(0, i).replace(/\*\*([^*]*)$/, '$1');
        bub.innerHTML = fmt(part) + (i < text.length ? '<span class="kc-caret"></span>' : after);
        if (log.scrollHeight - log.scrollTop - log.clientHeight < 120) log.scrollTop = log.scrollHeight;
        if (i < text.length) setTimeout(tick, 16); else res();
      };
      tick();
    });
  }
  function followUps(hits, q) {
    const pool = hits.map(h => h.d.title).filter(t => t !== q && /\?|요$|나요|까요/.test(t));
    SUGG.forEach(s => { if (s !== q) pool.push(s); });
    const asked = new Set(history.map(h => h.q));
    return [...new Set(pool)].filter(t => !asked.has(t)).slice(0, 2);
  }

  async function ask(q) {
    if (busy) return;
    busy = true; input.value = ''; autosize(); send.disabled = true;
    log.querySelectorAll('.kc-sg').forEach(x => x.remove());
    bubble('me', esc(q));
    const hits = retrieve(q + ' ' + (history.slice(-2).map(h => h.q).join(' ')));
    const wait = bubble('bot', '<div class="kc-thinking"><span>검수 자료에서 근거를 찾는 중…</span></div>');
    const orb = wait.querySelector('.kc-orb'); orb.classList.add('think');
    let answer;
    if (!hits.length) {
      answer = '해당 질문은 검수된 자료에서 근거를 찾지 못했습니다. 정확한 안내를 위해 1:1 상담으로 문의해 주세요.';
    } else {
      const ctx = hits.map((h, i) => `[${i + 1}] (${h.d.cat}) ${h.d.title}\n${h.d.text}`).join('\n\n');
      const prompt = `당신은 한국벤처경영원 홈페이지의 안내 챗봇입니다.
규칙:
- 아래 [자료]에 있는 내용만 근거로 한국어 존댓말로 3~5문장 이내 답하세요.
- 자료에 없는 숫자·공제율·금액은 절대 만들지 마세요. 자료로 답할 수 없으면 "자료에서 확인되지 않아 1:1 상담으로 안내드립니다"라고 답하세요.
- '모집', '원금보장', '최고', '최저', '확정 수익' 표현을 쓰지 마세요.
- 한국벤처경영원은 조합 운용기관이 아니며, 운용은 유스업파트너스(주)가 담당합니다.
- 핵심 숫자는 **굵게** 표시하세요. 문장 끝에 근거 번호를 [1]처럼 붙이세요.

[자료]
${ctx}

${history.length ? '[이전 대화]\n' + history.slice(-2).map(h => `Q: ${h.q}\nA: ${h.a}`).join('\n') + '\n\n' : ''}[질문]
${q}`;
      try {
        if (window.genspark && typeof window.genspark.complete === 'function') {
          answer = await Promise.race([
            window.genspark.complete(prompt),
            new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 12000))
          ]);
          answer = (answer || '').trim().replace(/원금\s*보장|모집/g, '');
        } else {
          throw new Error('local-rag');
        }
      } catch (e) {
        const hi = s => s.replace(/(\d[\d,.]*\s*(?:만원|억원|억|%|배|년|개사))/g, '**$1**');
        const primary = hi(hits[0].d.text);
        const extra = hits[1] && hits[1].s > hits[0].s * 0.55 ? '\n\n' + hi(hits[1].d.text.split('. ')[0] + '.') + ' [2]' : '';
        answer = `${primary} [1]${extra}`;
      }
    }
    history.push({ q, a: answer });
    orb.classList.remove('think');
    wait.dataset.raw = answer;
    const src = hits.length ? '<div class="kc-src">' + hits.map((h, i) =>
      '<a href="' + h.d.href + '" title="' + esc(h.d.title) + '"><i>' + (i + 1) + '</i><span>' + esc(h.d.title) + '</span></a>').join('') + '</div>' : '';
    const cta = '<div class="kc-cta"><a href="#contact">1:1 상담 신청</a><a class="kk" href="http://pf.kakao.com/_Rgdxjb/chat" target="_blank" rel="noopener">카카오톡 상담</a></div>';
    const acts = '<div class="kc-acts"><button data-act="copy" data-tip="복사" aria-label="복사">' + IC.copy + '</button><button data-act="up" data-tip="도움됐어요" aria-label="도움됐어요">' + IC.up1 + '</button><button data-act="dn" data-tip="아쉬워요" aria-label="아쉬워요">' + IC.dn1 + '</button></div>';
    const fu = followUps(hits, q);
    const fol = fu.length ? '<div class="kc-follow kc-sg">' + fu.map(t => '<button data-q="' + esc(t) + '">' + IC.ret + esc(t) + '</button>').join('') + '</div>' : '';
    const bub = wait.querySelector('.kc-bub');
    await stream(bub, answer, src + (hits.length ? '' : cta) + acts + fol);
    wait.querySelectorAll('.kc-src a, .kc-cta a[href^="#"]').forEach(a => a.addEventListener('click', () => { if (innerWidth < 560) open(false); }));
    scroll(); busy = false; send.disabled = !input.value.trim(); input.focus();
  }

  welcome();
  window.KVM_RAG = { KB, retrieve, open };
})();
