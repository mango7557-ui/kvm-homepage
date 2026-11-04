/* 유튜브 쇼츠·영상 캐러셀
   ▶ 채널 주소와 영상 ID만 채우면 썸네일·링크가 자동으로 들어갑니다.
     id 예: https://www.youtube.com/watch?v=ABCDEFGHIJK → "ABCDEFGHIJK"
            https://www.youtube.com/shorts/ABCDEFGHIJK  → "ABCDEFGHIJK" */
window.KVM_YT = {
  channel: "https://www.youtube.com/channel/UCb7Uugp-gHSV--QQGLfb-uA", // 예: "https://www.youtube.com/@채널핸들"
  interval: 3000, // 자동 넘김 간격(ms)
  shorts: [
    { id: "00MfsdWOmwg", title: "3,000만원 100% 소득공제, 세금 폭탄 고소득자 주목!" },
    { id: "dJbkyXeFDqA", title: "연말정산에서 1,000만원 환급받는 방법" },
    { id: "ucLc2HnjNXI", title: "연말정산 절세팁! 개인공동투자(직접투자) vs 개인투자조합 특징 비교" },
    { id: "UtxDMxCUyN8", title: "1,000만원 세금 절약 원천징수영수증 살펴보기" },
    { id: "cEcgFpzkQ-w", title: "[개인투자조합] 직장인 연말정산 소득공제 신청하는 방법" },
    { id: "4OR6qkHj3UE", title: "1,000만원 세금 절약한 실제 사례" },
    { id: "BcNqCsFVRGY", title: "벤처투자로 세금 확 줄이는 방법!" },
    { id: "hBStJVpQaHM", title: "대기업 직원, 의사, 전문직은 꼭 받는 소득공제 방법" },
    { id: "KeyTLh4kdVM", title: "벤처투자 소득공제 신청 안내" }
  ],
  videos: [
    { id: "OT2y6PS3OfU", title: "고소득자 필수 시청! 세금 환급 제대로 받는 법 (국민성장펀드 vs 벤처투자)" },
    { id: "DsNV1SXyqDE", title: "소득공제 벤처투자 종류, 개인공동투자와 개인투자조합" },
    { id: "oia8lvFwDxg", title: "2025_기업설명회_[ 뮤직오너 ]" },
    { id: "WLQgYJhankQ", title: "[ 아트오너 ] 신라호텔 아트페어 스케치" },
    { id: "BR6s8D8poXM", title: "[ 벤처투자 소득공제 ] 완전정복" },
    { id: "hIvuY9pRA3s", title: "[아트오너] 3D 전시회_ 이승현 작가 아트컬렉션" },
    { id: "gnCunLZmqSE", title: "[뮤직오너] 기업소개_음악저작권 투자로 절세하기" },
    { id: "XSSysuhZxfY", title: "한국벤처경영원 [ 10년의 노력 ]" },
    { id: "5T2Xs9UQjog", title: "[ 한국벤처경영원 10주년 ] 2024서울머니쇼" },
    { id: "hZR69yhuR-o", title: "2024_IR발표_[ 인이스홀딩스 ]" }
  ],
};

(function () {
  const cfg = window.KVM_YT;
  const ch = document.querySelector('[data-yt-channel]');
  if (ch && cfg.channel) { ch.href = cfg.channel; ch.target = "_blank"; ch.rel = "noopener"; }

  document.querySelectorAll('.yt-row').forEach(row => {
    const kind = row.dataset.yt;
    const list = cfg[kind] || [];
    const track = row.querySelector('.yt-track');
    row.style.setProperty('--n', row.dataset.visible);

    const html = it => {
      const url = it.id ? (kind === 'shorts' ? 'https://www.youtube.com/shorts/' : 'https://www.youtube.com/watch?v=') + it.id : (cfg.channel || '#');
      const safeAlt = (it.title || '한국벤처경영원 유튜브 영상').replace(/"/g, '&quot;');
      const dims = kind === 'shorts' ? 'width="405" height="720"' : 'width="480" height="360"';
      const img = it.id ? `<img src="https://i.ytimg.com/vi/${it.id}/${kind === 'shorts' ? 'oar2' : 'hqdefault'}.jpg" onerror="this.onerror=null;this.src='https://i.ytimg.com/vi/${it.id}/hqdefault.jpg'" alt="${safeAlt}" ${dims} loading="lazy" decoding="async">`
                        : `<span class="yt-ph">${kind === 'shorts' ? '쇼츠 썸네일<br>9:16' : '영상 썸네일 16:9'}</span>`;
      return `<a class="yt-item" href="${url}" ${url !== '#' ? 'target="_blank" rel="noopener"' : 'onclick="return false"'}>
        <div class="yt-th">${img}<span class="yt-play">▶</span></div>
        <div class="yt-t">${it.title}</div></a>`;
    };
    // 무한 루프용: 원본 + 앞쪽 복제
    const n = () => parseInt(getComputedStyle(row).getPropertyValue('--n')) || 1;
    track.innerHTML = list.map(html).join('') + list.map(html).join('');
    let idx = 0, timer;
    const step = () => { const a = track.children[0], b = track.children[1]; return b ? b.offsetLeft - a.offsetLeft : 0; };
    const go = (i, anim = true) => {
      track.style.transition = anim ? '' : 'none';
      idx = i;
      track.style.transform = `translateX(${-idx * step()}px)`;
    };
    track.addEventListener('transitionend', () => {
      if (idx >= list.length) go(idx - list.length, false);
      if (idx < 0) go(idx + list.length, false);
    });
    const next = () => go(idx + 1);
    const prev = () => { if (idx <= 0) { go(idx + list.length, false); track.offsetWidth; } go(idx - 1); };
    const start = () => { stop(); timer = setInterval(next, cfg.interval); };
    const stop = () => clearInterval(timer);
    row.querySelector('.yt-next').onclick = () => { next(); start(); };
    row.querySelector('.yt-prev').onclick = () => { prev(); start(); };
    row.addEventListener('mouseenter', stop);
    row.addEventListener('mouseleave', start);
    window.addEventListener('resize', () => go(idx, false));
    if (!matchMedia('(prefers-reduced-motion: reduce)').matches) start();
  });
})();
