(function () {
  const rows = document.getElementById('caseDirectoryRows');
  const search = document.getElementById('caseSearch');
  const empty = document.getElementById('caseEmpty');
  if (!rows || !search || !empty) return;

  // These examples reproduce the supplied storyboard, pending factual and consent review.
  const entries = [
    {keywords:['연속투자'], title:'10년 연속투자, 어느새 환급금액만 1억 이상', company:'삼성', name:'김○한'},
    {keywords:['성과급 절세','증액'], title:'성과급 세금부담, 5천만원 증액으로 세금 부담 줄이기', company:'SK하이닉스', name:'곽○삼'},
    {keywords:['국민성장펀드'], title:'국민성장펀드와 비교 후 벤처투자 소득공제 선택', company:'의사·약사', name:'전○희'},
    {keywords:['연속투자'], title:'장기 투자에 따른 누적 환급 사례', company:'의사·약사', name:'김○열'},
    {keywords:['투자후기'], title:'소득공제 투자 후 주변에도 소개한 사례', company:'전문직', name:'김○수'},
    {keywords:['증액'], title:'추가 절세상품을 비교하고 벤처투자 증액을 검토한 사례', company:'SK하이닉스', name:'이○호'},
    {keywords:['조기투자'], title:'연초 투자로 3년 연속 진행한 사례', company:'의사·약사', name:'이○기'},
    {keywords:['투자후기'], title:'소득공제 벤처투자를 더 일찍 알았더라면', company:'감정평가사', name:'임○종'}
  ];
  const personal = window.KVM_CASES_PERSONAL || [];
  const groups = window.KVM_CASES_GROUP || [];
  const cases = document.getElementById('cases');
  const lead = cases && cases.querySelector('.sec-head-split .lede');
  if (lead) lead.textContent = '콘티에 제시된 사례 예시입니다. 실제 투자·환급 내역과 게시 동의는 확인이 필요합니다. 실제 환급액은 개인의 공제 한도와 과세표준 등에 따라 달라집니다.';
  const title = cases && cases.querySelector('.sec-head-split h2');
  if (title) title.textContent = '소득공제 절세사례';

  document.querySelectorAll('#personalTrack .p-banner').forEach((slide, i) => {
    const item = personal[i];
    if (!item) return;
    const avatar = slide.querySelector('.p-avatar svg');
    if (avatar) {
      avatar.setAttribute('viewBox','0 0 200 230');
      avatar.innerHTML = '<path d="M68 44C68 20 80 8 100 8S132 20 132 44v21c0 15-8 27-16 33v10l19 9c36 13 48 49 51 100H14c3-51 15-87 51-100l19-9V98c-8-6-16-18-16-33z"/>' +
        (i===2
          ? '<path class="portrait-cutout" d="M66 115l34 59 34-59 12 8-28 94H82l-28-94z"/><path class="portrait-line" d="M63 119c-1 23 1 46 16 58m56-58c3 20 0 45-6 55m-50 3c0 9 9 14 18 14m32-17c0 12-5 18-14 18h-7"/><circle class="portrait-dot" cx="103" cy="192" r="5"/>'
          : '<path class="portrait-cutout" d="M70 112l30 35 30-35 12 8-27 97H85l-27-97z"/><path d="M94 149l6-8 6 8-4 8 9 60H89l9-60z"/>');
    }
    const title = slide.querySelector('.p-headline h4');
    if (title) title.textContent = item.company + ' ' + item.maskedName;
    const tag = slide.querySelector('.p-anon-tag');
    if (tag) tag.textContent = '콘티 예시 · 확인 필요';
    const note = slide.querySelector('.p-consent');
    if (note) note.textContent = item.detailNote || '콘티 예시 · 사실관계 및 게시 동의 확인 필요';
    const metrics = slide.querySelector('.p-metrics');
    if (metrics && item.detailMetrics) {
      metrics.replaceChildren();
      item.detailMetrics.forEach(([label, value], index) => {
        const box = document.createElement('div');
        box.className = 'pm-box' + ((label.includes('환급') || label.includes('절세액')) ? ' hl' : '');
        const caption = document.createElement('span'); caption.textContent = label;
        const number = document.createElement('b'); number.textContent = value;
        box.append(caption, number); metrics.append(box);
      });
    }
  });

  const heading = document.querySelector('.case-directory-head h3');
  if (heading) heading.textContent = '소득공제 사례보기';
  const description = document.querySelector('.case-directory-head p');
  if (description) description.textContent = '콘티 예시 · 사례 내용과 게시 동의 확인 필요';
  search.placeholder = '이름, 직장 또는 키워드 검색';
  const filters = document.querySelector('.case-filters');
  let keyword = '전체', occupation = '전체';
  const makeFilter = (label, values, type) => {
    const line = document.createElement('div'); line.className = 'story-filter-line';
    const heading = document.createElement('span'); heading.className = 'story-filter-label'; heading.textContent = label; line.append(heading);
    const controls = document.createElement('div'); controls.className = 'story-filter-controls';
    controls.setAttribute('role','group'); controls.setAttribute('aria-label',label);
    values.forEach(value => {
      const button=document.createElement('button'); button.type='button'; button.textContent=value;
      button.setAttribute('aria-pressed',String(value==='전체'));
      button.addEventListener('click',() => {
        if(type==='keyword') keyword=value; else occupation=value;
        controls.querySelectorAll('button').forEach(el=>el.setAttribute('aria-pressed',String(el===button)));
        render();
      });
      controls.append(button);
    });
    line.append(controls); return line;
  };
  if(filters) {
    filters.replaceChildren(
      makeFilter('키워드별 사례보기',['전체','국민성장펀드','성과급 절세','연속투자','증액','조기투자'],'keyword'),
      makeFilter('직업·직장별 사례보기',['전체','삼성','SK하이닉스','의사·약사','LG','공기업'],'occupation')
    );
  }
  const head = rows.closest('table').querySelector('thead tr');
  if (head) {
    head.replaceChildren();
    ['번호','키워드','제목','직업·직장','투자자'].forEach(value=>{
      const th=document.createElement('th'); th.scope='col'; th.textContent=value; head.append(th);
    });
  }
  function render(){
    const q=search.value.trim().toLowerCase();
    const list=entries.map((item,index)=>({...item,index:index+1})).filter(item=>
      (keyword==='전체'||item.keywords.includes(keyword)) &&
      (occupation==='전체'||item.company===occupation) &&
      [item.name,item.company,item.title,...item.keywords].join(' ').toLowerCase().includes(q)
    );
    rows.replaceChildren();
    for(const item of list){
      const tr=document.createElement('tr');
      [item.index,item.keywords.join(', '),item.title,item.company,item.name].forEach(value=>{
        const td=document.createElement('td'); td.textContent=value; tr.append(td);
      });
      rows.append(tr);
    }
    empty.hidden=list.length>0;
  }
  search.addEventListener('input',render); render();

  const groupTitle=document.querySelector('#cases-group .sub-head h3');
  if(groupTitle) groupTitle.textContent='그룹별 소득공제 환급사례';
  document.querySelectorAll('#groupSummaryGrid .gs-card').forEach((card,i)=>{
    const group=groups[i]; if(!group) return;
    const logo=card.querySelector('.gs-logo'); if(logo) logo.remove();
    const target=card.querySelector('.gs-txt'); if(!target) return;
    target.replaceChildren();
    const name=document.createElement('b'); name.textContent=group.company;
    const amount=document.createElement('strong'); amount.textContent=group.investAmount;
    const count=document.createElement('strong'); count.textContent=group.count;
    const note=document.createElement('small'); note.textContent='콘티 예시 · 확인 필요';
    target.append(name,amount,count,note);
  });
  document.querySelectorAll('#groupTrack .g-banner').forEach((slide,i)=>{
    const group=groups[i]; if(!group) return;
    const labels=slide.querySelectorAll('.gs-item span');
    if(labels[0]) labels[0].textContent='콘티 표시 인원';
    if(labels[1]) labels[1].textContent='콘티 표시 금액';
    if(labels[2]) labels[2].textContent='환급세액';
    slide.querySelectorAll('.gs-item small').forEach(el=>el.textContent='[확인 필요]');
    const foot=slide.querySelector('.g-foot span'); if(foot) foot.textContent='콘티 예시 · 실제 집계 확인 필요';
  });
})();
