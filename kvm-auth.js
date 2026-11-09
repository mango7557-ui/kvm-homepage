import {client,configured,status,friendly,pageUrl} from './kvm-api.js';
const output=document.getElementById('authStatus');
if(!configured())status(output,'회원 서비스 연결 준비 중입니다. Supabase 연결 후 가입·로그인이 활성화됩니다. 입력 정보는 저장되지 않습니다.');
for(const button of document.querySelectorAll('[data-toggle-password]'))button.addEventListener('click',()=>{const field=document.getElementById(button.dataset.togglePassword),show=field.type==='password';field.type=show?'text':'password';button.textContent=show?'숨기기':'보기';button.setAttribute('aria-label',show?'비밀번호 숨기기':'비밀번호 표시');button.setAttribute('aria-pressed',String(show));});
function handle(id,action){const form=document.getElementById(id);if(!form)return;form.addEventListener('submit',async event=>{event.preventDefault();const button=form.querySelector('[type=submit]');button.disabled=true;try{await action(form,new FormData(form));}catch(error){status(output,friendly(error),'error');}finally{button.disabled=false;}});}
handle('signupForm',async(form,data)=>{
  if(data.get('password')!==data.get('confirm')){status(output,'비밀번호가 일치하지 않습니다.','error');return;}
  if(!String(data.get('name')).trim()){status(output,'이름을 입력해 주세요.','error');return;}
  const api=await client(),{data:result,error}=await api.auth.signUp({email:String(data.get('email')).trim(),password:data.get('password'),options:{emailRedirectTo:pageUrl('account.html'),data:{full_name:String(data.get('name')).trim()}}});
  if(error)throw error;
  if(result.session){location.href=pageUrl('account.html');return;}
  status(output,'가입 가능한 이메일이면 인증 메일이 발송됩니다. 받은 메일함을 확인해 주세요. 이미 가입했다면 로그인해 주세요.','success');form.reset();
});
handle('loginForm',async(form,data)=>{const api=await client(),{error}=await api.auth.signInWithPassword({email:String(data.get('email')).trim(),password:data.get('password')});if(error)throw error;location.href=pageUrl(new URLSearchParams(location.search).get('next')==='admin'?'admin.html':'account.html');});
const reset=document.getElementById('resetPassword');
if(reset)reset.addEventListener('click',async()=>{const email=document.querySelector('[name=email]');if(!email.reportValidity())return;reset.disabled=true;try{const api=await client(),{error}=await api.auth.resetPasswordForEmail(email.value.trim(),{redirectTo:pageUrl('account.html')});if(error)throw error;status(output,'등록된 이메일이면 비밀번호 재설정 링크가 발송됩니다.','success');}catch(e){status(output,friendly(e),'error');}finally{reset.disabled=false;}});
let user;
async function loadAccount(){
  try{const api=await client(),{data,error}=await api.auth.getUser();if(error||!data.user){status(output,'로그인 또는 이메일 인증을 완료해 주세요.');return;}user=data.user;
    document.getElementById('accountGate').hidden=true;document.getElementById('accountContent').hidden=false;document.getElementById('logout').hidden=false;
    document.getElementById('accountEmail').value=user.email||'';
    const profile=await api.from('profiles').select('full_name').eq('id',user.id).single();if(profile.error)throw profile.error;
    document.getElementById('accountName').value=profile.data.full_name;status(output,'인증된 계정으로 연결되었습니다.','success');
  }catch(e){status(output,friendly(e),'error');}
}
if(document.body.dataset.page==='account'&&configured())loadAccount();
handle('profileForm',async(form,data)=>{const name=String(data.get('name')).trim();if(!name){status(output,'이름을 입력해 주세요.','error');return;}const api=await client(),{error}=await api.from('profiles').update({full_name:name}).eq('id',user.id);if(error)throw error;status(output,'회원 정보를 저장했습니다.','success');});
handle('passwordForm',async(form,data)=>{if(data.get('password')!==data.get('confirm')){status(output,'비밀번호가 일치하지 않습니다.','error');return;}const api=await client(),{error}=await api.auth.updateUser({password:data.get('password')});if(error)throw error;status(output,'비밀번호가 변경되었습니다.','success');form.reset();});
document.getElementById('logout')?.addEventListener('click',async()=>{try{const api=await client(),{error}=await api.auth.signOut();if(error)throw error;location.href=pageUrl('login.html');}catch(e){status(output,friendly(e),'error');}});
