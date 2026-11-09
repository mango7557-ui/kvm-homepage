import {client,configured,status,friendly,pageUrl} from './kvm-api.js';
const $=s=>document.querySelector(s),demo=!configured(),labels={new:'접수 대기',progress:'상담 중',done:'처리 완료'};
const views={overview:['대시보드','회원과 상담 현황을 한눈에 확인하세요.'],consultations:['상담 관리','신청 내용을 확인하고 상담 진행 상태를 관리하세요.'],members:['회원 관리','등록된 회원 정보를 확인하세요.'],subscriptions:['구독 관리','리치레터 구독 신청 내역을 확인하세요.'],sections:['섹션 점검','홈페이지의 모든 섹션과 회원 페이지를 확인하세요.'],settings:['연결 설정','인증 및 데이터베이스 연결을 준비하세요.']};
let allowed=false,consultations=[],members=[],subscriptions=[],selected=null,api;
function showView(key){if(!views[key])return;document.querySelectorAll('[data-panel]').forEach(e=>e.hidden=e.dataset.panel!==key);document.querySelectorAll('.side-tab').forEach(e=>{const active=e.dataset.view===key;e.classList.toggle('active',active);if(active)e.setAttribute('aria-current','page');else e.removeAttribute('aria-current');});$('#viewTitle').textContent=views[key][0];$('#viewDescription').textContent=views[key][1];}
document.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',()=>showView(b.dataset.view)));
document.querySelectorAll('[data-open-view]').forEach(b=>b.addEventListener('click',()=>showView(b.dataset.openView)));
const sections=[['홈','index.html#top'],['개인별 성공사례','index.html#cases-personal'],['그룹별 성공사례','index.html#cases-group'],['절세이슈','index.html#issues'],['연간 절세 캘린더','index.html#ivCalWrap'],['제도소개','index.html#system-intro'],['소득공제 · 근거 법률','index.html#law'],['국민성장펀드 비교','index.html#system'],['환급 계산기','index.html#simulator'],['투자기업','index.html#companies'],['파트너사','index.html#partners'],['개인공동투자','index.html#direct-invest'],['FAQ','index.html#faq'],['경영원 소식','index.html#news'],['소셜미디어','index.html#social'],['회사소개 · 자문단','index.html#about'],['상담 신청','index.html#contact'],['회원가입','signup.html'],['로그인','login.html'],['마이페이지','account.html']];
sections.forEach(([name,href],i)=>{const a=document.createElement('a');a.className='section-link';a.href=href;a.target='_blank';a.rel='noopener';const n=document.createElement('span'),b=document.createElement('b');n.textContent=String(i+1).padStart(2,'0');b.textContent=name;a.append(n,b,'↗');$('#sectionLinks').append(a);});
function date(value){return new Date(value).toLocaleDateString('ko-KR');}
function table(container,headers,rows,render){container.replaceChildren();if(!rows.length){const box=document.createElement('div');box.className='empty-state';const b=document.createElement('b');b.textContent='표시할 내역이 없습니다';const p=document.createElement('p');p.textContent='검색 조건을 확인하거나 새 신청을 기다려 주세요.';box.append(b,p);container.append(box);return;}
  const wrap=document.createElement('div');wrap.className='table-scroll';const t=document.createElement('table'),head=document.createElement('thead'),tr=document.createElement('tr'),body=document.createElement('tbody');headers.forEach(h=>{const th=document.createElement('th');th.textContent=h;th.scope='col';tr.append(th);});head.append(tr);rows.forEach(row=>{const r=document.createElement('tr');render(row).forEach(value=>{const td=document.createElement('td');if(value instanceof Node)td.append(value);else td.textContent=value;r.append(td);});body.append(r);});t.append(head,body);wrap.append(t);container.append(wrap);
}
function tag(value){const span=document.createElement('span');span.className='status-tag '+(value==='done'?'done':value==='new'?'pending':'');span.textContent=labels[value]||value;return span;}
function detailButton(row){const b=document.createElement('button');b.type='button';b.className='quiet';b.textContent='상세 보기 →';b.addEventListener('click',()=>openDetail(row));return b;}
function consultRows(row){return [row.name,row.phone,row.interest,date(row.created_at),tag(row.status),detailButton(row)];}
function render(){
  const q=$('#consultSearch').value.trim().toLowerCase(),f=$('#consultFilter').value;
  table($('#consultTable'),['신청자','연락처','관심 분야','접수일','상태','상세'],consultations.filter(r=>(f==='all'||r.status===f)&&[r.name,r.phone,r.interest].join(' ').toLowerCase().includes(q)),consultRows);
  table($('#recentTable'),['신청자','연락처','관심 분야','접수일','상태','상세'],consultations.slice(0,5),consultRows);
  const m=$('#memberSearch').value.trim().toLowerCase();table($('#memberTable'),['이름','이메일','가입일'],members.filter(r=>[r.full_name,r.email].join(' ').toLowerCase().includes(m)),r=>[r.full_name,r.email,date(r.created_at)]);
  const s=$('#subscriptionSearch').value.trim().toLowerCase();table($('#subscriptionTable'),['이메일','신청일'],subscriptions.filter(r=>r.email.toLowerCase().includes(s)),r=>[r.email,date(r.created_at)]);
}
for(const id of ['consultSearch','consultFilter','memberSearch','subscriptionSearch'])$('#'+id).addEventListener('input',render);
function openDetail(row){selected=row;$('#consultDetails').replaceChildren();Object.entries({'이름':row.name,'연락처':row.phone,'소득 유형':row.income,'관심 분야':row.interest,'문의 내용':row.message||'입력 없음','접수일':date(row.created_at)}).forEach(([k,v])=>{const dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=k;dd.textContent=v;$('#consultDetails').append(dt,dd);});$('#detailStatus').value=row.status;status($('#detailMessage'),demo?'체험 데이터입니다. 변경은 현재 화면에서만 적용됩니다.':'');$('#consultDialog').showModal();}
$('#closeDialog').addEventListener('click',()=>$('#consultDialog').close());
$('#saveConsult').addEventListener('click',async()=>{
  if(!allowed||!selected)return;const button=$('#saveConsult'),next=$('#detailStatus').value;button.disabled=true;
  try{if(!demo){const {data,error}=await api.from('consultations').update({status:next}).eq('id',selected.id).select('id');if(error)throw error;if(!data?.length)throw new Error('Permission denied');}selected.status=next;render();status($('#detailMessage'),demo?'체험 상태를 변경했습니다. 실제 데이터는 저장되지 않습니다.':'상담 상태를 저장했습니다.','success');if(demo)$('#metricPending').textContent=consultations.filter(r=>r.status==='new').length;else await load();}catch(e){status($('#detailMessage'),friendly(e),'error');}finally{button.disabled=false;}
});
function metrics(total,pending,memberCount,subscriptionCount){$('#metricTotal').textContent=total.toLocaleString();$('#metricPending').textContent=pending.toLocaleString();$('#metricMembers').textContent=memberCount.toLocaleString();$('#metricSubscriptions').textContent=subscriptionCount.toLocaleString();}
function demoData(){const created_at='2026-11-09T09:00:00Z';consultations=[{id:'demo-1',name:'체험 회원 A',phone:'010-0000-0000',interest:'벤처투자 소득공제',income:'근로소득자',message:'관리자 상담 상세 화면을 확인하기 위한 예시입니다.',status:'new',created_at},{id:'demo-2',name:'체험 회원 B',phone:'010-0000-0000',interest:'개인공동투자(직접투자)',income:'전문직',message:'실제 신청이 아닌 화면 확인용 예시입니다.',status:'progress',created_at},{id:'demo-3',name:'체험 회원 C',phone:'010-0000-0000',interest:'음악저작권',income:'사업소득자',message:'예시 상담입니다.',status:'done',created_at}];members=[{full_name:'체험 회원 A',email:'member-a@example.com',created_at},{full_name:'체험 회원 B',email:'member-b@example.com',created_at}];subscriptions=[{email:'newsletter@example.com',created_at}];metrics(3,1,2,1);}
async function load(){
  $('#refreshData').disabled=true;
  try{
    if(demo){allowed=true;demoData();$('#adminNotice').querySelector('p').textContent='디자인 체험 모드 · 아래 회원과 상담은 예시 데이터입니다. Supabase 연결 후 실제 관리자 로그인과 데이터가 활성화됩니다.';}
    else{
      api=await client();const {data:auth,error:authError}=await api.auth.getUser();if(authError||!auth.user){$('#adminGate').hidden=false;$('#adminContent').hidden=true;$('#adminNotice').querySelector('p').textContent='인증된 관리자 계정으로 로그인해 주세요.';return;}
      $('#adminLogout').hidden=false;
      const {data:isAdmin,error:roleError}=await api.rpc('is_admin');if(roleError)throw roleError;if(!isAdmin){$('#adminGate').hidden=false;$('#adminContent').hidden=true;$('#adminNotice').querySelector('p').textContent='현재 계정에는 관리자 권한이 없습니다.';return;}
      allowed=true;
      const results=await Promise.all([api.from('consultations').select('*',{count:'exact'}).order('created_at',{ascending:false}).limit(200),api.from('profiles').select('id,full_name,email,created_at',{count:'exact'}).order('created_at',{ascending:false}).limit(200),api.from('subscriptions').select('id,email,created_at',{count:'exact'}).order('created_at',{ascending:false}).limit(200),api.from('consultations').select('id',{count:'exact',head:true}).eq('status','new')]);
      results.forEach(r=>{if(r.error)throw r.error;});consultations=results[0].data;members=results[1].data;subscriptions=results[2].data;metrics(results[0].count,results[3].count,results[1].count,results[2].count);
      $('#adminNotice').querySelector('p').textContent='관리자 인증 완료 · 실제 데이터에 연결되었습니다. 목록은 최근 200건을 표시합니다.';$('#connectionBadge').textContent='연결됨';
    }
    $('#adminGate').hidden=true;$('#adminContent').hidden=false;render();status($('#adminStatus'),'');
  }catch(e){allowed=false;$('#adminContent').hidden=true;status($('#adminStatus'),friendly(e),'error');}finally{$('#refreshData').disabled=false;}
}
$('#refreshData').addEventListener('click',load);
$('#adminLogout').addEventListener('click',async()=>{try{const {error}=await api.auth.signOut();if(error)throw error;location.href=pageUrl('login.html');}catch(e){status($('#adminStatus'),friendly(e),'error');}});
load();
