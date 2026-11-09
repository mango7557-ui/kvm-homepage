# KVM 회원 · 관리자 연결

## 현재 상태
디자인과 연결 코드는 준비되어 있습니다. 실제 Supabase 프로젝트는 아직 연결하지 않았습니다. 회원가입·로그인·상담·구독은 서버 성공 응답을 받은 경우에만 완료로 표시합니다. 연결 전 관리자 화면은 명시적인 예시 데이터 체험 모드입니다.

## 1. 프로젝트와 데이터베이스
1. Supabase 프로젝트를 생성합니다.
2. SQL Editor에서 `supabase-schema.sql`을 **한 번** 실행합니다. 테이블, 회원 생성 트리거, RLS 권한을 함께 생성합니다. 기존 동일 이름의 테이블이 있으면 먼저 스키마를 비교하세요.
3. Authentication → Providers에서 Email을 켜고 **Confirm email**을 활성화합니다. 비밀번호 최소 길이는 12자 이상으로 설정합니다.
4. Authentication → URL Configuration에 아래 값을 등록합니다.
   - Site URL: `https://mango7557-ui.github.io/kvm-homepage/`
   - Redirect URL: `https://mango7557-ui.github.io/kvm-homepage/account.html`
   - 로컬 테스트 Redirect URL: `http://127.0.0.1:8080/account.html`
5. 실제 인증 메일 발송을 위한 SMTP와 발송 제한을 설정합니다.

## 2. 공개 연결값
`kvm-config.js`의 빈 값을 Settings → API의 프로젝트 URL과 Publishable key(또는 anon 키)로 채웁니다. **service_role / secret 키는 넣지 않습니다.**

```js
window.KVM_CONFIG=Object.freeze({
  supabaseUrl:'https://PROJECT.supabase.co',
  supabasePublishableKey:'sb_publishable_…'
});
```

설정 파일을 사이트와 함께 배포하면 같은 프로젝트에 가입·로그인·상담·구독이 연결됩니다. GitHub Pages는 정적 호스팅이며, 권한 검사는 Supabase RLS가 수행합니다. 브라우저에서 관리자 플래그를 변경해도 실제 데이터 권한은 생기지 않습니다.

## 3. 최초 관리자
1. `signup.html`에서 가입하고 이메일 인증을 완료합니다.
2. Supabase Authentication → Users에서 해당 사용자 UUID를 확인합니다.
3. SQL Editor에서 실행합니다.

```sql
insert into public.admin_users(user_id) values ('관리자-사용자-UUID');
```

4. `login.html?next=admin`에서 로그인합니다. 관리자 화면이 체험 모드에서 실제 데이터 모드로 바뀝니다.

## 기능 범위
- 회원: 가입, 이메일 확인, 로그인, 비밀번호 재설정, 이름 수정, 비밀번호 변경, 로그아웃.
- 관리자: 상담 목록·검색·상태 변경, 회원 조회·검색, 구독 조회·검색, 섹션 바로가기, 연결 상태 확인.
- 목록: 최근 200건 표시, 대시보드 숫자는 전체 데이터 개수.
- 홈페이지 원문 수정은 파일 기반입니다. 관리자 섹션 점검 메뉴는 콘텐츠 편집기가 아닌 실제 화면 바로가기입니다.
- 상담 완료 후 개인정보 파기 및 회원 탈퇴 요청은 운영자가 Supabase에서 처리합니다. 회원 계정 삭제는 Authentication에서 처리하면 프로필도 함께 삭제됩니다.
- 구독 중복 신청은 별도 기록됩니다. 발송 전 수신 이메일을 중복 제거하세요.

## 연결 후 필수 확인
1. 새 이메일로 가입 → 인증 메일 → 마이페이지.
2. 로그아웃 → 로그인 → 비밀번호 재설정 메일 → 새 비밀번호 변경.
3. 일반 회원은 다른 회원 프로필·상담 목록을 읽을 수 없는지 확인.
4. 관리자만 회원·상담·구독 조회 및 상담 상태 변경이 가능한지 확인.
5. 비로그인 상담·구독 신청은 기록되지만 타인 기록을 조회할 수 없는지 확인.
6. 메일 발송 및 익명 신청 남용 방지를 위해 실제 운영량에 맞는 CAPTCHA/Edge Function 제한을 추가할 수 있습니다.

현재 프로젝트 연결값이 없으므로 실제 이메일 전달·DB 쓰기·RLS 통합 검증은 연결 후 진행해야 합니다.
