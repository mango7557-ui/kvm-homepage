import {client,configured,status,friendly} from './kvm-api.js';
const video=document.querySelector('#heroVideo'),control=document.querySelector('.video-control');
if(video&&control){
  const sync=()=>{control.textContent=video.paused?'영상 재생 ▷':'영상 일시정지 Ⅱ';control.setAttribute('aria-pressed',String(video.paused));};
  control.addEventListener('click',()=>{if(video.paused){video.dataset.paused='false';video.play().catch(sync);}else{video.dataset.paused='true';video.pause();}});
  video.addEventListener('play',sync);video.addEventListener('pause',sync);sync();
}
for(const form of document.querySelectorAll('.cx-form,.sub')){
  form.removeAttribute('onsubmit');
  const output=document.createElement('p');output.className='form-status';output.setAttribute('role','status');form.append(output);
  if(!configured())status(output,'온라인 접수 연결 준비 중입니다. 상담은 카카오톡 또는 대표전화 02-538-9999를 이용해 주세요.');
  form.addEventListener('submit',async event=>{
    event.preventDefault();const button=form.querySelector('[type="submit"],button');button.disabled=true;
    try{
      const api=await client();let result;
      if(form.matches('.sub')){
        result=await api.from('subscriptions').insert({email:form.querySelector('input[type=email]').value.trim()});
      }else{
        const input=form.querySelectorAll('.cx-fld input');
        result=await api.from('consultations').insert({name:input[0].value.trim(),phone:input[1].value.trim(),income:form.querySelector('[name=income]:checked')?.value||'',interest:form.querySelector('[name=interest]:checked')?.value||'',message:form.querySelector('textarea').value.trim(),consent:form.querySelector('.cx-agree input').checked});
      }
      if(result.error)throw result.error;
      form.dispatchEvent(new CustomEvent('kvm:submitted'));
      status(output,form.matches('.sub')?'구독 신청이 접수되었습니다.':'상담 신청이 접수되었습니다. 담당자가 확인 후 연락드리겠습니다.','success');form.reset();
    }catch(error){status(output,friendly(error),'error');}finally{button.disabled=false;}
  });
}
