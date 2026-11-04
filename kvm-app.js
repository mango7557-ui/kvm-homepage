(function(){
const $=s=>document.querySelector(s);
const FAQ=window.KVM_FAQ, RATES=window.KVM_RATES;
const won=v=>{v=Math.round(v);if(v>=10000){const e=Math.floor(v/10000),m=v%10000;return e+'억'+(m?' '+m.toLocaleString()+'만':'')+'원'}return v.toLocaleString()+'만원'};

/* rate table */
$('#rateRows').innerHTML=RATES.map((x,i)=>`<tr data-i="${i}"><td>${x.t}</td><td class="r">${x.r}%</td><td class="r">${won(3000*x.r/100)}</td></tr>`).join('');

/* simulator — 표준 문구 범위만 계산: 3,000만원 이하 100%, 5,000만원 88% */
let ri=+(localStorage.getItem('kvm_ri')??3);
let inv=+(localStorage.getItem('kvm_inv')??3000);
$('#pRate').innerHTML=RATES.map((x,i)=>`<button data-i="${i}">${x.r}%<small>${x.t}</small></button>`).join('');
function dedOf(v){return v<=3000?v:(v===5000?4400:null)}
function sim(){
  const r=RATES[ri].r, ded=dedOf(inv), ref=ded*r/100;
  $('#vInvest').textContent=won(inv);
  $('#invest').value=Math.min(inv,3000);
  $('#oRefund').textContent=won(ref);
  $('#oDed').textContent=won(ded)+(inv===5000?' (88%)':' (100%)');
  $('#oMarg').textContent=r+'%';
  $('#oX').textContent=(r/15).toFixed(1)+'배 · '+won(ded*.15)+' → '+won(ref);
  $('#oTxt').textContent=`한계세율 ${r}%인 분이 ${won(inv)}을 벤처투자하면 ${won(ded)}이 소득공제되어 약 ${won(ref)}이 환급될 것으로 추정됩니다.`;
  $('#pRate').querySelectorAll('button').forEach(b=>b.classList.toggle('on',+b.dataset.i===ri));
  $('#pInv').querySelectorAll('button').forEach(b=>b.classList.toggle('on',+b.dataset.v===inv));
  document.querySelectorAll('#rateRows tr').forEach(tr=>tr.classList.toggle('me',+tr.dataset.i===ri));
  localStorage.setItem('kvm_ri',ri);localStorage.setItem('kvm_inv',inv);
}
$('#pRate').addEventListener('click',e=>{const b=e.target.closest('button');if(b){ri=+b.dataset.i;sim()}});
$('#pInv').addEventListener('click',e=>{const b=e.target.closest('button');if(b){inv=+b.dataset.v;sim()}});
$('#invest').addEventListener('input',e=>{inv=+e.target.value;sim()});
sim();

/* portfolio */
$('#pf').innerHTML=window.KVM_PORTFOLIO.map(p=>`<div><span class="a">${p.a}</span><b>${p.n}</b><small>${p.d}</small></div>`).join('');

/* news */
$('#newsList').innerHTML=window.KVM_NEWS.map(n=>`<li><span class="k">${n.k}</span><span>${n.t}</span><span class="m">${n.m}</span><span class="d">${n.d}</span></li>`).join('');

/* FAQ */
const CATS=['전체','소득공제','제도','국민성장펀드','미국채','부동산','저작권','대부'];
let cat='전체';
function chips(){$('#chips').innerHTML=CATS.map(c=>{const n=c==='전체'?FAQ.length:FAQ.filter(f=>f.c===c).length;return `<button class="chip ${c===cat?'on':''}" data-c="${c}">${c}<em>${n}</em></button>`}).join('')}
function list(){
  const q=$('#q').value.trim();
  const L=FAQ.filter(f=>(cat==='전체'||f.c===cat)&&(!q||(f.q+f.a).includes(q)));
  $('#faqList').innerHTML=L.length?L.map((f,i)=>`<details ${i===0&&!q?'open':''}><summary><span class="cat">${f.c}</span><span class="q">${f.q}</span><span class="rv ${f.ok?'ok':''}">${f.ok?'검수 완료':'검수 대기'}</span><span class="pm">+</span></summary><div class="ans">${f.a}<div class="meta">출처: 한국벤처경영원 투자설명회 FAQ · 최종 업데이트 2026-09-30</div></div></details>`).join(''):'<div class="empty">검색 결과가 없습니다. 상담 신청으로 질문을 남겨주세요.</div>';
}
$('#chips').addEventListener('click',e=>{const b=e.target.closest('.chip');if(b){cat=b.dataset.c;chips();list()}});
$('#q').addEventListener('input',list);
chips();list();
$('#faqCount').textContent=FAQ.length;
$('#faqBar').style.width=Math.min(100,FAQ.length)+'%';

/* structured data */
const ld=document.createElement('script');ld.type='application/ld+json';
ld.textContent=JSON.stringify([
 {"@context":"https://schema.org","@type":"Organization","name":"한국벤처경영원","alternateName":"KVM","url":"https://www.kofund.co.kr/","description":"벤처투자 소득공제·개인투자조합 전문 정보·컨설팅 기관","telephone":"02-538-9999","faxNumber":"02-538-9955","email":"kofund@kofund.co.kr",
  "founder":{"@type":"Person","name":"김승찬","jobTitle":"대표"},
  "address":{"@type":"PostalAddress","postalCode":"06182","addressRegion":"서울특별시","addressLocality":"강남구","streetAddress":"영동대로 407, 6층 (대치동, 코니빌딩)","addressCountry":"KR"},
  "sameAs":["https://blog.naver.com/ko-funding","https://www.instagram.com/kvm0615/"],
  "parentOrganization":{"@type":"Organization","name":"유스업파트너스(주)","url":"https://www.youthup.co.kr/"}},
 {"@context":"https://schema.org","@type":"FAQPage","mainEntity":FAQ.filter(f=>f.ok).map(f=>({"@type":"Question","name":f.q,"acceptedAnswer":{"@type":"Answer","text":f.a}}))}
]);
document.head.appendChild(ld);
})();
