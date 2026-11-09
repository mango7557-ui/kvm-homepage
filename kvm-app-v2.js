(function(){
const $=s=>document.querySelector(s);
const $$=(s,root=document)=>Array.from(root.querySelectorAll(s));
const FAQ=window.KVM_FAQ, RATES=window.KVM_RATES;
const SIM_CFG=window.KVM_SIM_CONFIG||{defaultRateIndex:3,defaultInvest:3000};
const won=v=>{v=Math.round(v);if(v>=10000){const e=Math.floor(v/10000),m=v%10000;return e+'억'+(m?' '+m.toLocaleString()+'만':'')+'원'}return v.toLocaleString()+'만원'};

/* ① 대문 드론 배경 영상 자동 재생 보장 */
const hv=$('#heroVideo');
if(hv){
  hv.muted=true;
  hv.defaultMuted=true;
  hv.playsInline=true;
  const tryPlay=()=>{ if(hv.dataset.paused!=='true'&&!matchMedia('(prefers-reduced-motion: reduce)').matches) hv.play && hv.play().catch(()=>{}); };
  if(matchMedia('(prefers-reduced-motion: reduce)').matches){hv.autoplay=false;hv.pause();}
  if(hv.readyState>=2) tryPlay();
  else hv.addEventListener('loadeddata',tryPlay,{once:true});
  document.addEventListener('visibilitychange',()=>{ if(!document.hidden && hv.paused) tryPlay(); });
  window.addEventListener('pointerdown',()=>{ if(hv.paused) tryPlay(); },{once:true,passive:true});
}

/* ① 대문 성과 4지표 (전산 자동 집계 데이터 렌더링) */
if(window.KVM_METRICS && $('#heroMetrics')){
  const M=window.KVM_METRICS;
  const rows=(M.items||[]).map(it=>`<div><dt>${it.label}</dt><dd class="num">${it.value}<small>${it.unit}${it.sub&&it.key==='history'?' · '+it.sub:''}</small></dd></div>`).join('');
  $('#heroMetrics').innerHTML=rows;
  const note=$('#heroMetricsNote');if(note)note.innerHTML=`집계 기준일 <b class="num">${M.baseDate}</b> <span class="ph-txt">[전산 DB 자동 집계 연동 · 가안]</span> · 환급세액은 지방소득세 포함 한계세율 기준 추정치`;
}

/* ②·③ 공통 3초 자동 전환 배너 캐러셀 엔진 (호버 일시정지, 좌우 화살표, 인디케이터 점, 모바일 스와이프) */
function initBannerCarousel(viewportId, count, intervalMs=3000, onSlideChange){
  const vp=document.getElementById(viewportId);
  if(!vp || !count) return null;
  const track=vp.querySelector('.cr-track');
  const ctrl=document.querySelector(`.cr-controls[data-target="${viewportId}"]`);
  const dotsWrap=ctrl?ctrl.querySelector('.cr-dots'):null;
  const prevBtn=ctrl?ctrl.querySelector('.cr-prev'):null;
  const nextBtn=ctrl?ctrl.querySelector('.cr-next'):null;
  let idx=0, timer=null, startX=0, deltaX=0, paused=false;
  if(ctrl){
    const toggle=document.createElement('button');
    toggle.type='button';toggle.className='carousel-toggle';toggle.textContent='일시정지';toggle.setAttribute('aria-pressed','false');
    toggle.addEventListener('click',()=>{paused=!paused;toggle.textContent=paused?'자동 재생':'일시정지';toggle.setAttribute('aria-pressed',String(paused));paused?stop():start();});
    ctrl.append(toggle);
  }

  if(dotsWrap){
    dotsWrap.innerHTML=Array.from({length:count},(_,i)=>`<button type="button" class="cr-dot ${i===0?'on':''}" data-i="${i}" aria-label="${i+1}번 슬라이드"></button>`).join('');
    dotsWrap.addEventListener('click',e=>{
      const d=e.target.closest('.cr-dot');
      if(d){ go(+d.dataset.i); restart(); }
    });
  }

  function go(nextIdx){
    idx=((nextIdx%count)+count)%count;
    track.style.transform=`translateX(-${idx*100}%)`;
    if(dotsWrap){
      dotsWrap.querySelectorAll('.cr-dot').forEach((d,i)=>{d.classList.toggle('on',i===idx);d.setAttribute('aria-current',String(i===idx));});
    }
    Array.from(track.children).forEach((slide,i)=>{slide.inert=i!==idx;slide.setAttribute('aria-hidden',String(i!==idx));});
    if(typeof onSlideChange==='function') onSlideChange(idx);
  }
  function next(){ go(idx+1); }
  function prev(){ go(idx-1); }
  function start(){
    stop();
    if(!paused && !document.hidden && !matchMedia('(prefers-reduced-motion: reduce)').matches && count>1){
      timer=setInterval(next, intervalMs);
    }
  }
  function stop(){ if(timer){ clearInterval(timer); timer=null; } }
  function restart(){ stop(); start(); }

  if(prevBtn) prevBtn.addEventListener('click',()=>{ prev(); restart(); });
  if(nextBtn) nextBtn.addEventListener('click',()=>{ next(); restart(); });

  vp.addEventListener('mouseenter',stop);
  vp.addEventListener('mouseleave',start);
  vp.addEventListener('focusin',stop);
  vp.addEventListener('focusout',start);

  /* 모바일 터치 스와이프 지원 */
  vp.addEventListener('touchstart',e=>{
    if(!e.touches.length) return;
    startX=e.touches[0].clientX;
    deltaX=0;
    stop();
  },{passive:true});
  vp.addEventListener('touchmove',e=>{
    if(!e.touches.length) return;
    deltaX=e.touches[0].clientX-startX;
  },{passive:true});
  vp.addEventListener('touchend',()=>{
    if(Math.abs(deltaX)>42){
      if(deltaX<0) next(); else prev();
    }
    start();
  });

  document.addEventListener('visibilitychange',()=>document.hidden?stop():start());
  go(0);start();
  return { go, restart };
}

/* ②-1 개인별 성공사례 렌더링 (실루엣 일러스트 + 배경 소속 로고 + 우측 데이터 텍스트) */
const personalList=(window.KVM_CASES_PERSONAL||[]).filter(x=>x.visible!==false);
if($('#personalTrack') && personalList.length){
  const silhouetteSvg=`<svg viewBox="0 0 140 160" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <circle cx="70" cy="50" r="28" fill="rgba(255,255,255,0.22)" stroke="rgba(255,255,255,0.45)" stroke-width="2"/>
    <path d="M22 152C22 118 42 96 70 96C98 96 118 118 118 152" fill="rgba(255,255,255,0.18)" stroke="rgba(255,255,255,0.45)" stroke-width="2" stroke-linecap="round"/>
  </svg>`;
  $('#personalTrack').innerHTML=personalList.map((item,i)=>`
    <article class="cr-slide p-banner" data-idx="${i}">
      <div class="p-visual" style="--brand:${item.logoColor||'#1e599a'}">
        <div class="p-bg-logo" aria-hidden="true">${item.logoText||item.company}</div>
        <div class="p-avatar">
          ${silhouetteSvg}
          <span class="p-anon-tag">비실명 보호 · 사전동의 게시</span>
        </div>
        <div class="p-corp-chip">
          <span class="dot" style="background:${item.logoColor||'#2fb89b'}"></span>
          <b>${item.company}</b>
        </div>
      </div>
      <div class="p-data">
        <div class="p-meta-top">
          <span class="p-seq num">CASE 0${i+1}</span>
          <span class="p-summary">${item.investSummary||''}</span>
        </div>
        <div class="p-headline">
          <h4>${item.maskedName} <small>${item.company}</small></h4>
          <div class="p-metrics num">
            <div class="pm-box"><span>과세표준 구간</span><b>${item.taxBase}</b><small>적용 한계세율 ${item.marginalRate}</small></div>
            <div class="pm-box hl"><span>누적 환급세액</span><b>${item.totalRefund}</b><small>조세특례제한법 제16조 적용</small></div>
          </div>
        </div>
        <blockquote class="p-quote">${item.comment}</blockquote>
        <div class="p-consent">게시 기준: ${item.consentScope} · <span class="ph-txt">[전산 DB 연동]</span></div>
      </div>
    </article>
  `).join('');
  initBannerCarousel('personalCarousel', personalList.length, 3000);
}

/* ②-2 그룹(기업)별 성공사례 렌더링 (기업 로고 + 건수/투자금액/누적환급 텍스트) */
const groupList=(window.KVM_CASES_GROUP||[]).filter(x=>x.visible!==false);
if($('#groupTrack') && groupList.length){
  $('#groupTrack').innerHTML=groupList.map((g,i)=>`
    <article class="cr-slide g-banner" data-idx="${i}">
      <div class="g-brand" style="--brand:${g.logoColor||'#1e599a'}">
        <span class="g-badge">${g.badge}</span>
        <div class="g-logo-box"><span>${g.shortName}</span></div>
        <h4>${g.company}</h4>
        <p>${g.avgRate}</p>
      </div>
      <div class="g-stats">
        <div class="g-stat-grid num">
          <div class="gs-item"><span>누적 참여 건수</span><b class="hi">${g.count}</b></div>
          <div class="gs-item"><span>누적 투자금액</span><b>${g.investAmount}</b><small class="ph-txt">[전산 집계 연동]</small></div>
          <div class="gs-item hl"><span>누적 환급세액</span><b>${g.refundAmount}</b><small class="ph-txt">[전산 집계 연동]</small></div>
        </div>
        <p class="g-desc">${g.desc}</p>
        <div class="g-foot"><span>집계 기준일: ${window.KVM_METRICS?window.KVM_METRICS.baseDate:'2026.10.31'} · 전산 자동 집계</span><a href="#contact">임직원·그룹 절세 상담 신청 →</a></div>
      </div>
    </article>
  `).join('');

  const groupCtrl=initBannerCarousel('groupCarousel', groupList.length, 3000, activeIdx=>{
    document.querySelectorAll('#groupSummaryGrid .gs-card').forEach((c,i)=>c.classList.toggle('on',i===activeIdx));
  });

  if($('#groupSummaryGrid')){
    $('#groupSummaryGrid').innerHTML=groupList.map((g,i)=>`
      <button type="button" class="gs-card ${i===0?'on':''}" data-i="${i}">
        <span class="gs-logo" style="background:${g.logoColor||'#1e599a'}">${g.shortName}</span>
        <div class="gs-txt">
          <b>${g.company}</b>
          <span class="num">참여 <em>${g.count}</em> · 투자 ${g.investAmount} · 누적환급 ${g.refundAmount}</span>
        </div>
      </button>
    `).join('');
    $('#groupSummaryGrid').addEventListener('click',e=>{
      const card=e.target.closest('.gs-card');
      if(card && groupCtrl){
        groupCtrl.go(+card.dataset.i);
        groupCtrl.restart();
      }
    });
  }
}

/* ③ 절세이슈 뉴스 기사 롤링 배너 렌더링 (클릭 시 원문 새 창 이동) */
const issueList=(window.KVM_TAX_ISSUES||[]).filter(x=>x.visible!==false).sort((a,b)=>(a.order||0)-(b.order||0));
if($('#issueTrack') && issueList.length){
  $('#issueTrack').innerHTML=issueList.map((iss,i)=>`
    <a class="cr-slide iss-banner" href="${iss.url}" target="_blank" rel="noopener">
      <div class="iss-img-wrap">
        <img src="${iss.image}" alt="${iss.title}" width="1024" height="1024" loading="lazy" decoding="async">
        <span class="iss-media-chip">${iss.media}</span>
      </div>
      <div class="iss-body">
        <div class="iss-top">
          <span class="iss-no num">ISSUE 0${i+1}</span>
          <span class="iss-date num">${iss.date}</span>
        </div>
        <h4>${iss.title}</h4>
        <p>${iss.summary}</p>
        <div class="iss-cta"><span>기사 원문 보기</span><i aria-hidden="true">↗</i></div>
      </div>
    </a>
  `).join('');
  initBannerCarousel('issueCarousel', issueList.length, 3000);
}

/* rate table */
$('#rateRows').innerHTML=RATES.map((x,i)=>`<tr data-i="${i}"><td>${x.t}</td><td class="r">${x.r}%</td><td class="r">${won(3000*x.r/100)}</td></tr>`).join('');

/* ④-2 simulator — 조특법 제16조 구간: 3,000만원 이하 100% / 3,000~5,000만원 70% / 5,000만원 초과 30% */
const safeGet=(k,fb)=>{try{const v=localStorage.getItem(k);return v!==null?v:fb}catch(e){return fb}};
const safeSet=(k,v)=>{try{localStorage.setItem(k,v)}catch(e){}};
let ri=+safeGet('kvm_ri',SIM_CFG.defaultRateIndex);
if(!Number.isFinite(ri)||ri<0||ri>=RATES.length) ri=SIM_CFG.defaultRateIndex;
let inv=+safeGet('kvm_inv',SIM_CFG.defaultInvest);
if(!Number.isFinite(inv)||inv<100||inv>10000) inv=SIM_CFG.defaultInvest;
$('#pRate').innerHTML=RATES.map((x,i)=>`<button type="button" data-i="${i}">${x.r}%<small>${x.t}</small></button>`).join('');
function dedOf(v){return Math.min(v,3000)+Math.max(0,Math.min(v,5000)-3000)*.7+Math.max(0,v-5000)*.3}
const pct=v=>Math.round(dedOf(v)/v*100);

/* 투자금액별 공제표 */
$('#dedRows').innerHTML=[1000,2000,3000,5000,7000,10000].map(v=>{
  const parts=[];parts.push(won(Math.min(v,3000))+'×100%');if(v>3000)parts.push(won(Math.min(v,5000)-3000)+'×70%');if(v>5000)parts.push(won(v-5000)+'×30%');
  return `<tr data-v="${v}"><td><b>${won(v)}</b></td><td>${parts.join(' + ')}</td><td class="r">${won(dedOf(v))}</td><td class="r">${pct(v)}%</td></tr>`}).join('');
function sim(){
  const r=RATES[ri].r, ded=dedOf(inv), ref=ded*r/100;
  $('#vInvest').textContent=won(inv);
  $('#invest').value=inv;
  $('#oRefund').textContent=won(ref);
  $('#oDed').textContent=won(ded)+' ('+pct(inv)+'%)';
  $('#oMarg').textContent=r+'%';
  $('#oX').textContent=(r/15).toFixed(1)+'배 · '+won(ded*.15)+' → '+won(ref);
  $('#oTxt').textContent=`한계세율 ${r}%인 분이 ${won(inv)}을 벤처투자하면 ${won(ded)}이 소득공제되어 약 ${won(ref)}이 환급될 것으로 추정됩니다.`;
  $('#pRate').querySelectorAll('button').forEach(b=>b.classList.toggle('on',+b.dataset.i===ri));
  $('#pInv').querySelectorAll('button').forEach(b=>b.classList.toggle('on',+b.dataset.v===inv));
  document.querySelectorAll('#dedRows tr').forEach(tr=>tr.classList.toggle('me',+tr.dataset.v===inv));
  document.querySelectorAll('#rateRows tr').forEach(tr=>tr.classList.toggle('me',+tr.dataset.i===ri));
  safeSet('kvm_ri',ri);safeSet('kvm_inv',inv);
}
$('#pRate').addEventListener('click',e=>{const b=e.target.closest('button');if(b){ri=+b.dataset.i;sim()}});
$('#pInv').addEventListener('click',e=>{const b=e.target.closest('button');if(b){inv=+b.dataset.v;sim()}});
$('#invest').addEventListener('input',e=>{inv=+e.target.value;sim()});
sim();

/* portfolio */
$('#pf').innerHTML=window.KVM_PORTFOLIO.map(p=>`<div><span class="a">${p.a}</span><b>${p.n}</b><small>${p.d}</small></div>`).join('');

/* ⑧-1 news (제목·요약·매체·날짜 텍스트 병기) */
$('#newsList').innerHTML=window.KVM_NEWS.map(n=>`<li><span class="k">${n.k}</span><div class="n-main"><b>${n.t}</b>${n.s?`<small>${n.s}</small>`:''}</div><span class="m">${n.m||'한국벤처경영원'}</span><span class="d num">${n.d}</span></li>`).join('');

/* 포트폴리오 아카이브 */
const SP=window.KVM_SITE_PF, G=['전체','자산형','투자·컨설팅','성장형'];let g='전체';
function arch(){
  $('#archF').innerHTML=G.map(x=>`<button class="chip ${x===g?'on':''}" data-g="${x}">${x}<em>${x==='전체'?SP.length:SP.filter(p=>p.g===x).length}</em></button>`).join('');
  $('#arch').innerHTML=SP.filter(p=>g==='전체'||p.g===g).map(p=>`<div class="pc"><span class="g">${p.g}</span><b>${p.n}</b><small>${p.b}</small><span class="y">설립 ${p.y}년</span></div>`).join('');
}
$('#archF').addEventListener('click',e=>{const b=e.target.closest('.chip');if(b){g=b.dataset.g;arch()}});
arch();

/* ⑦ FAQ */
const CATS=['전체','소득공제','제도','국민성장펀드','미국채','부동산','저작권','대부'];
let cat='전체';
function chips(){$('#chips').innerHTML=CATS.map(c=>{const n=c==='전체'?FAQ.length:FAQ.filter(f=>f.c===c).length;return `<button class="chip ${c===cat?'on':''}" data-c="${c}">${c}<em>${n}</em></button>`}).join('')}
function list(){
  const q=$('#q').value.trim();
  const L=FAQ.filter(f=>(cat==='전체'||f.c===cat)&&(!q||(f.q+f.a).includes(q)));
  $('#faqList').innerHTML=L.length?L.map((f,i)=>`<details ${i===0&&!q?'open':''}><summary><span class="cat">${f.c}</span><span class="q">${f.q}</span><span class="rv ${f.ok?'ok':''}">${f.ok?'검수 완료':'검수 대기'}</span><span class="pm">+</span></summary><div class="ans">${f.a}<div class="meta">출처: 한국벤처경영원 투자설명회 FAQ · 최종 업데이트 2026-11-02</div></div></details>`).join(''):'<div class="empty">검색 결과가 없습니다. 상담 신청으로 질문을 남겨주세요.</div>';
}
$('#chips').addEventListener('click',e=>{const b=e.target.closest('.chip');if(b){cat=b.dataset.c;chips();list()}});
$('#q').addEventListener('input',list);
chips();list();
$('#faqCount').textContent=FAQ.length;
$('#faqBar').style.width=Math.min(100,FAQ.length)+'%';

/* structured data (초기 HTML의 #kvm-jsonld가 있으면 갱신만 수행하고 중복 태그 생성 방지) */
const ldData=[
 {"@context":"https://schema.org","@type":"Organization","@id":"https://www.kofund.co.kr/#organization","name":"한국벤처경영원","alternateName":"KVM","url":"https://www.kofund.co.kr/","logo":"https://www.kofund.co.kr/assets/img/kvm-logo-2.png","description":"벤처투자 소득공제·개인투자조합·개인공동투자 전문 정보·컨설팅 기관","foundingDate":"2014","telephone":"02-538-9999","faxNumber":"02-538-9955","email":"kofund@kofund.co.kr",
  "founder":{"@type":"Person","name":"김승찬","jobTitle":"대표"},
  "address":{"@type":"PostalAddress","postalCode":"06182","addressRegion":"서울특별시","addressLocality":"강남구","streetAddress":"영동대로 407, 코니빌딩 7층 (대치동)","addressCountry":"KR"},
  "sameAs":["https://blog.naver.com/ko-funding","https://www.instagram.com/kvm0615/","https://www.youtube.com/channel/UCb7Uugp-gHSV--QQGLfb-uA"],
  "parentOrganization":{"@type":"Organization","name":"유스업파트너스(주)","url":"https://www.youthup.co.kr/"}},
 {"@context":"https://schema.org","@type":"WebSite","@id":"https://www.kofund.co.kr/#website","url":"https://www.kofund.co.kr/","name":"한국벤처경영원(KVM)","inLanguage":"ko-KR","publisher":{"@id":"https://www.kofund.co.kr/#organization"}},
 {"@context":"https://schema.org","@type":"FAQPage","@id":"https://www.kofund.co.kr/#faqpage","mainEntity":FAQ.filter(f=>f.ok).map(f=>({"@type":"Question","name":f.q,"acceptedAnswer":{"@type":"Answer","text":f.a}}))}
];
const existingLd=document.getElementById('kvm-jsonld');
if(existingLd){
  try{const keep=JSON.parse(existingLd.textContent).filter(d=>d['@type']==='HowTo'||d['@type']==='BreadcrumbList');const org=JSON.parse(existingLd.textContent).find(d=>d['@type']==='Organization');if(org&&org.contactPoint)ldData[0].contactPoint=org.contactPoint;if(org&&org.knowsAbout)ldData[0].knowsAbout=org.knowsAbout;ldData.push(...keep);}catch(e){}
  existingLd.textContent=JSON.stringify(ldData);
}else{
  const ld=document.createElement('script');ld.id='kvm-jsonld';ld.type='application/ld+json';
  ld.textContent=JSON.stringify(ldData);
  document.head.appendChild(ld);
}

/* 6단계: 비식별(PII-free) 전환 추적 훅 & 섹션별 상담 폼 컨텍스트 자동 프리필 */
function trackConversion(action, meta){
  const payload=Object.assign({event:'kvm_conversion',action,ts:Date.now()},meta||{});
  try{
    if(Array.isArray(window.dataLayer)) window.dataLayer.push(payload);
    window.dispatchEvent(new CustomEvent('kvm:conversion',{detail:payload}));
  }catch(e){}
}

document.addEventListener('click',e=>{
  const simLink=e.target.closest('[data-from-sim]');
  const ctxLink=e.target.closest('[data-consult-interest],[data-consult-note]');
  const kakaoLink=e.target.closest('a[href*="pf.kakao.com"]');
  const telLink=e.target.closest('a[href^="tel:"]');

  if(kakaoLink){
    trackConversion('click_kakao_consult',{section:(kakaoLink.closest('section')||{}).id||'floating'});
  }else if(telLink){
    trackConversion('click_tel_consult',{section:(telLink.closest('section')||{}).id||'contact'});
  }

  if(!simLink && !ctxLink) return;
  const form=$('.cx-form');
  if(!form) return;
  const ta=form.querySelector('textarea');

  if(simLink){
    const r=RATES[ri].r, t=RATES[ri].t, ded=dedOf(inv), ref=ded*r/100;
    const msg=`[계산기 연동] 과세표준 ${t}(한계세율 ${r}%), 투자 희망금액 ${won(inv)}(예상 소득공제 ${won(ded)} · 예상 환급액 약 ${won(ref)}) 기준으로 정밀 공제 한도 상담을 신청합니다.`;
    if(ta && (!ta.value.trim() || ta.dataset.autofilled==='1')){
      ta.value=msg;
      ta.dataset.autofilled='1';
    }
    trackConversion('simulator_to_consult',{ratePct:r,investManwon:inv});
  }else if(ctxLink){
    const interest=ctxLink.dataset.consultInterest;
    const note=ctxLink.dataset.consultNote;
    if(interest){
      const radio=form.querySelector(`input[name="interest"][value="${interest}"]`);
      if(radio) radio.checked=true;
    }
    if(note && ta && (!ta.value.trim() || ta.dataset.autofilled==='1')){
      ta.value=note;
      ta.dataset.autofilled='1';
    }
    trackConversion('section_to_consult',{interest:interest||'default',section:(ctxLink.closest('section')||{}).id||'main'});
  }
});

const cxForm=$('.cx-form');
if(cxForm){
  const ta=cxForm.querySelector('textarea');
  if(ta) ta.addEventListener('input',()=>{ delete ta.dataset.autofilled; });
  cxForm.addEventListener('kvm:submitted',()=>{
    const inc=(cxForm.querySelector('input[name="income"]:checked')||{}).value||'미선택';
    const intr=(cxForm.querySelector('input[name="interest"]:checked')||{}).value||'미선택';
    /* 개인정보(이름·연락처·문의원문)는 수집·전송하지 않고 소득유형·관심분야만 비식별 집계 */
    trackConversion('submit_consult_form',{incomeType:inc,interestCategory:intr});
  });
}

const subForm=$('.sub');
if(subForm){
  subForm.addEventListener('kvm:submitted',()=>{
    /* 이메일 원문은 제외하고 구독 전환 완료 이벤트만 비식별 집계 */
    trackConversion('subscribe_richletter',{section:'news'});
  });
}

/* ---------- 9. 모바일 하단 네비게이션 Scroll Spy & 활성 상태 연동 ---------- */
const mobNav=$('#mobBottomNav');
if(mobNav){
  const items=$$('.mb-item',mobNav);
  const setActive=(key)=>{
    items.forEach(a=>{const active=a.dataset.navSec===key;a.classList.toggle('on',active);if(active)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current');});
  };
  items.forEach(a=>{
    a.addEventListener('click',()=>{
      if(a.dataset.navSec) setActive(a.dataset.navSec);
    });
  });
  const secMap=[
    {id:'contact',key:'contact'},
    {id:'companies',key:'companies'},
    {id:'simulator',key:'simulator'},
    {id:'system-intro',key:'simulator'},
    {id:'issues',key:'cases'},
    {id:'cases',key:'cases'}
  ];
  let ticking=false;
  const updateNav=()=>{
    if(ticking) return;
    ticking=true;
    requestAnimationFrame(()=>{
      ticking=false;
      const y=window.scrollY+window.innerHeight*0.35;
      if(window.scrollY<260){
        setActive('top');
        return;
      }
      for(let i=0;i<secMap.length;i++){
        const el=document.getElementById(secMap[i].id);
        if(el && y>=el.getBoundingClientRect().top+window.scrollY){
          setActive(secMap[i].key);
          return;
        }
      }
      setActive('top');
    });
  };
  window.addEventListener('scroll',updateNav,{passive:true});
  window.addEventListener('resize',updateNav,{passive:true});
  updateNav();
}
})();
