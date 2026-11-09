let clientPromise;
export function configured(){const c=window.KVM_CONFIG||{};return /^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/.test(c.supabaseUrl||'')&&!!c.supabasePublishableKey;}
export async function client(){
  if(!configured())throw new Error('Supabase 연결 준비 중입니다. 현재 입력 내용은 서버에 전송되지 않습니다.');
  if(!clientPromise)clientPromise=import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.49.8/+esm').then(({createClient})=>createClient(window.KVM_CONFIG.supabaseUrl,window.KVM_CONFIG.supabasePublishableKey,{auth:{flowType:'pkce',persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}})).catch(e=>{clientPromise=null;throw e;});
  return clientPromise;
}
export function status(node,message,type=''){node.textContent=message;node.className='form-status '+type;node.setAttribute('role','status');}
export function friendly(error){
  const message=error?.message||'';
  if(message.includes('연결 준비'))return message;
  if(/Invalid login credentials/i.test(message))return '이메일 또는 비밀번호를 확인해 주세요.';
  if(/Email not confirmed/i.test(message))return '받은 이메일의 인증 링크를 먼저 눌러 주세요.';
  if(/already registered/i.test(message))return '이미 등록된 이메일입니다. 로그인해 주세요.';
  if(/rate limit/i.test(message))return '요청이 많습니다. 잠시 후 다시 시도해 주세요.';
  return '요청을 처리하지 못했습니다. 네트워크와 서비스 연결 상태를 확인한 후 다시 시도해 주세요.';
}
export function pageUrl(file){return new URL(file,location.href).href.split('#')[0].split('?')[0];}
