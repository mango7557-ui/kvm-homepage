(function(){
  const rows=document.getElementById('caseDirectoryRows'), search=document.getElementById('caseSearch'), empty=document.getElementById('caseEmpty');
  if(!rows||!search||!empty)return;
  const items=(window.KVM_CASES_PERSONAL||[]).filter(x=>x.visible!==false),buttons=[...document.querySelectorAll('[data-case-filter]')]; let active='전체';
  function render(){const q=search.value.trim().toLowerCase(); const list=items.filter(x=>{const category=/의원|전문의/.test(x.company)?'전문직':'직장인'; return (active==='전체'||active===category)&&[x.maskedName,x.company,x.investSummary].join(' ').toLowerCase().includes(q)});rows.replaceChildren();for(const item of list){const tr=document.createElement('tr');for(const value of [item.maskedName,item.company,item.investSummary,item.totalRefund]){const td=document.createElement('td');td.textContent=value||'—';tr.append(td)}rows.append(tr)}empty.hidden=list.length>0;}
  buttons.forEach(button=>button.addEventListener('click',()=>{active=button.dataset.caseFilter;buttons.forEach(b=>b.setAttribute('aria-pressed',String(b===button)));render()}));search.addEventListener('input',render);render();
})();
