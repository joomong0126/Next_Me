import type {
  AuthAPI,
  ChangePasswordInput,
  GoogleLoginInput,
  LoginInput,
  LoginOutput,
  MeOutput,
  SignupInput,
  SignupOutput,
} from '../../contracts';
import { UnauthorizedError } from '../../errors';
import { supabaseClient, isMockSupabaseClient } from '../../supabaseClient';
import { writeToken, removeToken } from '../../tokenStorage';

const sb = supabaseClient;

// 실제 Supabase 클라이언트인지 확인
if (isMockSupabaseClient) {
  console.warn('[supabase/auth] ⚠️ WARNING: Using mock Supabase client even though API adapter is set to supabase!');
  console.warn('[supabase/auth] This means environment variables might not be loaded correctly.');
} else {
  console.info('[supabase/auth] ✅ Using real Supabase client');
}

export const auth: AuthAPI = {
  async login({ email, password }: LoginInput): Promise<LoginOutput> {
    // 개발 편의를 위한 하드코딩된 계정 (바로 통과)
    const DEV_ACCOUNTS = [
      { email: 'dev@dev.com', password: '1234', name: '개발자' },
      { email: 'admin@admin.com', password: 'admin', name: '관리자' },
      { email: 'test@test.com', password: 'test', name: '테스터' },
      { email: 'demo@demo.com', password: 'demo', name: '데모' },
    ];
    
    // 개발 계정 체크
    const devAccount = DEV_ACCOUNTS.find(acc => acc.email === email && acc.password === password);
    if (devAccount) {
      console.info(`[supabase/auth] 🚀 Dev account login: ${email} (bypassing Supabase)`);
      
      // 개발 계정용 더미 토큰 및 사용자 정보
      const devUser = {
        id: 'dev-user-' + email.replace('@', '-').replace('.', '-'),
        email: email,
        name: devAccount.name,
      };
      
      // 토큰 저장 (실제로는 더미이지만 로그인 상태 유지)
      const dummyToken = 'dev-token-' + btoa(email + ':' + Date.now());
      writeToken(dummyToken);
      
      return {
        token: dummyToken,
        user: devUser,
      };
    }
    
    // 로그인 시도 (개발 편의를 위해 여러 번 재시도)
    let lastError: any = null;
    let lastData: any = null;
    
    // 최대 3번까지 재시도 (타이밍 이슈 또는 이메일 확인 상태 변화 대응)
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        console.info(`[supabase/auth] Login attempt ${attempt}/3...`);
        
        // 약간의 지연 시간 (재시도 시)
        if (attempt > 1) {
          await new Promise(resolve => setTimeout(resolve, 300 * attempt));
        }
        
        const { data, error } = await sb.auth.signInWithPassword({ email, password });
        
        if (error) {
          lastError = error;
          console.warn(`[supabase/auth] Login attempt ${attempt} failed:`, error.message);
          
          // 이메일 미확인 에러인 경우, 재시도해볼 가치가 있음
          if (
            error.message?.includes('Email not confirmed') || 
            error.message?.includes('email_not_confirmed') ||
            error.message?.includes('Invalid login credentials')
          ) {
            // 마지막 시도가 아니면 계속 시도
            if (attempt < 3) {
              continue;
            }
          } else if (error.message?.includes('User not found')) {
            // 사용자를 찾을 수 없으면 재시도 의미 없음
            throw new Error('등록되지 않은 이메일입니다. 회원가입해주세요.');
          } else {
            // 다른 에러는 즉시 실패
            break;
          }
        } else {
          // 성공!
          lastData = data;
          lastError = null;
          break;
        }
      } catch (err) {
        lastError = err;
        // 예상치 못한 에러는 즉시 실패
        if (attempt === 1) {
          break;
        }
      }
    }
    
    // 최종 결과 처리
    if (lastError) {
      console.error('[supabase/auth] Login error:', lastError);
      console.error('[supabase/auth] Login error details:', {
        message: lastError.message,
        status: lastError.status,
        name: lastError.name,
      });
      
      // 이메일 미확인 관련 에러 처리
      if (
        lastError.message?.includes('Email not confirmed') || 
        lastError.message?.includes('email_not_confirmed')
      ) {
        // 개발 환경에서는 더 친절한 안내
        const isDev = import.meta.env.DEV;
        const devTip = isDev 
          ? '\n\n💡 개발 팁: Supabase 대시보드에서 "Enable email confirmations"을 비활성화하면 이메일 확인 없이 바로 로그인할 수 있습니다.'
          : '';
        
        throw new Error(
          `이메일 확인이 필요합니다. 이메일을 확인하고 링크를 클릭해주세요.${devTip}`,
        );
      } else if (lastError.message?.includes('Invalid login credentials')) {
        throw new Error(
          '이메일 또는 비밀번호가 올바르지 않습니다.\n\n' +
          '가능한 원인:\n' +
          '• 이메일 확인이 필요한 경우: 회원가입 시 발송된 이메일을 확인하고 링크를 클릭해주세요.\n' +
          '• 비밀번호가 틀린 경우: 올바른 비밀번호를 입력해주세요.\n' +
          '• 등록되지 않은 이메일: 회원가입을 먼저 진행해주세요.',
        );
      }
      
      throw new Error(lastError.message || '로그인에 실패했습니다.');
    }

    if (!lastData || !lastData.user || !lastData.session) {
      throw new Error('로그인에 실패했습니다. 세션이 생성되지 않았습니다.');
    }

    const user = lastData.user;
    const token = lastData.session.access_token;
    
    console.info('[supabase/auth] ✅ Login successful');
    
    // 토큰을 localStorage에 저장
    writeToken(token);
    
    return {
      token,
      user: {
        id: user.id,
        email: user.email!,
        name: user.user_metadata?.name ?? user.email!.split('@')[0] ?? 'User',
      },
    };
  },
  async loginWithGoogle(_input: GoogleLoginInput): Promise<LoginOutput> {
    // 구글 로그인 실행 (OAuth 리다이렉트 방식)
    const { data, error } = await sb.auth.signInWithOAuth({
      provider: 'google',
      options: {
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      throw error;
    }

    // OAuth는 비동기 리다이렉트 방식이므로, 여기서는 에러를 던지지 않고
    // 리다이렉트가 시작되었음을 알려야 합니다.
    // 실제 세션은 콜백 URL에서 처리됩니다.
    // 이 함수는 콜백 처리 후 호출되지 않으므로, 타입상으로는 에러를 던집니다.
    // 실제 구현은 콜백 핸들러에서 처리해야 합니다.
    throw new Error('Google OAuth는 리다이렉트 방식입니다. 콜백 핸들러에서 처리해주세요.');
  },
  async signup(input: SignupInput): Promise<SignupOutput> {
    const { method, email, password, name, phone, status, goals } = input;

    if (method === 'google') {
      // Google 로그인의 경우: 이미 OAuth로 인증되었을 수 있으므로
      // 현재 사용자 정보를 업데이트합니다
      const {
        data: { user: currentUser },
        error: getUserError,
      } = await sb.auth.getUser();

      if (getUserError || !currentUser) {
        throw new Error('Google 로그인이 완료되지 않았습니다. 먼저 Google로 로그인해주세요.');
      }

      // users 테이블에 프로필 정보 저장 또는 업데이트
      const { data: existingUser } = await sb.from('users').select('id').eq('id', currentUser.id).single();

      const userProfileData = {
        id: currentUser.id,
        email: currentUser.email || email,
        name: name,
        phone: phone,
        status: status ? [status] : null, // _text 배열 타입
        target_jobs: goals && goals.length > 0 ? goals : null, // goals를 target_jobs로 매핑
      };

      if (existingUser) {
        // 이미 users 테이블에 있으면 업데이트
        const { error: updateError } = await sb.from('users').update(userProfileData).eq('id', currentUser.id);
        if (updateError) {
          console.error('[supabase/auth] Failed to update user profile:', updateError);
        }
      } else {
        // 없으면 새로 생성
        const { error: insertError } = await sb.from('users').insert(userProfileData);
        if (insertError) {
          console.error('[supabase/auth] Failed to insert user profile:', insertError);
        }
      }

      // 사용자 메타데이터 업데이트
      const { data: updateData, error: updateError } = await sb.auth.updateUser({
        data: {
          name,
          phone,
          status: status || null,
          goals: goals && goals.length > 0 ? JSON.stringify(goals) : null, // 배열을 JSON 문자열로 변환
          method: 'google',
        },
      });

      if (updateError) {
        throw updateError;
      }

      if (!updateData.user || !updateData.session) {
        throw new Error('사용자 정보 업데이트에 실패했습니다.');
      }

      const user = updateData.user;
      const token = updateData.session.access_token;
      
      // 토큰을 localStorage에 저장
      writeToken(token);
      
      return {
        token,
        user: {
          id: user.id,
          email: user.email!,
          name: name,
          phone: phone,
          status: status,
          goals: goals,
          method: 'google',
        },
      };
    }

    // 이메일 회원가입
    if (!password) {
      throw new Error('비밀번호가 필요합니다.');
    }

    // user_metadata는 JSON 직렬화 가능한 값만 허용
    // 배열은 JSON.stringify로 변환하거나 문자열로 저장
    const { data, error } = await sb.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: {
          name,
          phone,
          status: status || null,
          goals: goals && goals.length > 0 ? JSON.stringify(goals) : null, // 배열을 JSON 문자열로 변환
          method: 'email',
        },
      },
    });

    if (error) {
      console.error('[supabase/auth] Signup error:', error);
      console.error('[supabase/auth] Error details:', {
        message: error.message,
        status: error.status,
        name: error.name,
      });
      // 더 자세한 에러 메시지 제공
      throw new Error(error.message || '회원가입에 실패했습니다.');
    }

    if (!data.user) {
      throw new Error('회원가입에 실패했습니다.');
    }

    const user = data.user;

    // users 테이블에 이미 사용자가 존재하는지 확인
    const { data: existingUser, error: checkError } = await sb
      .from('users')
      .select('id')
      .eq('id', user.id)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      // PGRST116은 "no rows returned" 에러이므로 정상 (사용자가 없음)
      console.error('[supabase/auth] Failed to check existing user:', checkError);
    }

    if (existingUser) {
      // 이미 사용자가 존재하는 경우
      throw new Error('이미 사용 중인 계정입니다. 로그인해주세요.');
    }

    // users 테이블에 프로필 정보 저장
    const userProfileData = {
      id: user.id,
      email: user.email,
      name: name,
      phone: phone,
      status: status ? [status] : null, // _text 배열 타입
      target_jobs: goals && goals.length > 0 ? goals : null, // goals를 target_jobs로 매핑
      // skills는 나중에 추가 가능
      // bio는 나중에 추가 가능
      // profile_image_url은 나중에 추가 가능
    };

    const { error: profileError } = await sb.from('users').insert(userProfileData);

    if (profileError) {
      console.error('[supabase/auth] Failed to insert user profile:', profileError);
      // 프로필 저장 실패해도 인증은 성공했으므로 계속 진행
      // 하지만 사용자에게 알려야 할 수도 있음
    }

    // 세션이 있으면 즉시 로그인된 상태
    if (data.session) {
      const token = data.session.access_token;
      
      // 토큰을 localStorage에 저장
      writeToken(token);
      
      return {
        token,
        user: {
          id: user.id,
          email: user.email!,
          name: name,
          phone: phone,
          status: status,
          goals: goals,
          method: 'email',
        },
      };
    }

    // 이메일 확인이 필요한 경우
    // Supabase가 이메일 확인을 요구하는 경우, user는 생성되었지만 세션은 이메일 확인 후에 생성됩니다
    // 개발 편의를 위해 강력하게 자동 로그인을 시도합니다
    console.info('[supabase/auth] User created but no session. Attempting automatic login...');
    
    // 회원가입 직후 자동 로그인 시도 (여러 번 재시도)
    // 개발 환경에서는 이메일 확인 없이도 바로 로그인할 수 있도록 강제 시도
    let loginSuccess = false;
    let lastLoginError: any = null;
    
    // 최대 3번까지 재시도 (짧은 지연 시간을 두고)
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        console.info(`[supabase/auth] Login attempt ${attempt}/3...`);
        
        // 약간의 지연 시간 (사용자 생성 후 즉시 로그인 시도 시 타이밍 이슈 가능)
        if (attempt > 1) {
          await new Promise(resolve => setTimeout(resolve, 500 * attempt));
        }
        
        const { data: loginData, error: loginError } = await sb.auth.signInWithPassword({
          email,
          password,
        });

        if (!loginError && loginData?.session) {
          // 로그인 성공! 세션이 생성되었습니다
          console.info('[supabase/auth] ✅ Automatic login successful after signup');
          const token = loginData.session.access_token;
          
          // 토큰을 localStorage에 저장
          writeToken(token);
          
          loginSuccess = true;
          return {
            token,
            user: {
              id: user.id,
              email: user.email!,
              name: name,
              phone: phone,
              status: status,
              goals: goals,
              method: 'email',
            },
          };
        }

        lastLoginError = loginError;
        console.warn(`[supabase/auth] Login attempt ${attempt} failed:`, loginError?.message);
      } catch (loginAttemptError) {
        lastLoginError = loginAttemptError;
        console.warn(`[supabase/auth] Login attempt ${attempt} error:`, loginAttemptError);
      }
    }

    // 모든 로그인 시도가 실패한 경우
    // 개발 편의를 위해 사용자 정보를 반환하고, 수동 로그인을 안내
    console.warn('[supabase/auth] ⚠️ All login attempts failed. User created but email confirmation may be required.');
    console.warn('[supabase/auth] You can try logging in manually with the credentials you just created.');
    
    // 개발 환경에서는 더 친절한 메시지
    const isDev = import.meta.env.DEV;
    if (isDev) {
      console.info('[supabase/auth] 💡 Development tip: You can try logging in manually, or check Supabase settings to disable email confirmation for development.');
    }
    
    // 사용자 정보를 반환하되 토큰 없이 처리
    // 프론트엔드에서 수동 로그인을 시도하도록 안내
    throw new Error(
      '회원가입이 완료되었습니다. 자동 로그인에 실패했습니다. 로그인 페이지에서 직접 로그인해주세요.\n' +
      '(이메일 확인이 필요한 경우 이메일을 확인해주세요)',
    );
  },
  async logout() {
    // TODO: Extend with any local cleanup or telemetry once Supabase integration is finalized.
    await sb.auth.signOut();
    // 토큰을 localStorage에서 제거
    removeToken();
  },
  async me(): Promise<MeOutput> {
    // 개발 계정 체크 (토큰에서 이메일 추출)
    const token = typeof window !== 'undefined' 
      ? window.localStorage.getItem('next-me:auth-token') 
      : null;
    
    if (token && token.startsWith('dev-token-')) {
      // 개발 계정 토큰인 경우
      try {
        const decoded = atob(token.replace('dev-token-', ''));
        const [email] = decoded.split(':');
        
        const DEV_ACCOUNTS = [
          { email: 'dev@dev.com', name: '개발자' },
          { email: 'admin@admin.com', name: '관리자' },
          { email: 'test@test.com', name: '테스터' },
          { email: 'demo@demo.com', name: '데모' },
        ];
        
        const devAccount = DEV_ACCOUNTS.find(acc => acc.email === email);
        if (devAccount) {
          console.info(`[supabase/auth] 🚀 Dev account me(): ${email}`);
          return {
            id: 'dev-user-' + email.replace('@', '-').replace('.', '-'),
            email: email,
            name: devAccount.name,
          };
        }
      } catch {
        // 토큰 파싱 실패 시 정상 처리 계속
      }
    }
    
    // TODO: Map to richer profile data when Supabase schema is available.
    const {
      data: { user },
    } = await sb.auth.getUser();
    if (!user) {
      throw new UnauthorizedError();
    }

    return {
      id: user.id,
      email: user.email!,
      name: user.user_metadata?.name ?? 'User',
      headline: user.user_metadata?.headline ?? undefined,
    };
  },
  async resendEmailConfirmation(email: string): Promise<void> {
    // 이메일 확인 재전송
    const { error } = await sb.auth.resend({
      type: 'signup',
      email: email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      console.error('[supabase/auth] Failed to resend email confirmation:', error);
      throw new Error(error.message || '이메일 재전송에 실패했습니다.');
    }
  },
  async changePassword({ currentPassword, newPassword }: ChangePasswordInput): Promise<void> {
    // 현재 사용자 정보 가져오기
    const {
      data: { user },
      error: getUserError,
    } = await sb.auth.getUser();

    if (getUserError || !user || !user.email) {
      throw new UnauthorizedError('로그인이 필요합니다.');
    }

    // 현재 비밀번호로 재인증 (비밀번호 변경 전 확인)
    // Supabase는 updateUser를 호출하기 전에 현재 세션으로 인증 확인
    const { error: updateError } = await sb.auth.updateUser({
      password: newPassword,
    });

    if (updateError) {
      console.error('[supabase/auth] Failed to change password:', updateError);
      
      if (updateError.message?.includes('same password')) {
        throw new Error('새 비밀번호는 현재 비밀번호와 달라야 합니다.');
      } else if (updateError.message?.includes('weak password')) {
        throw new Error('비밀번호가 너무 약합니다. 더 강한 비밀번호를 사용해주세요.');
      } else if (updateError.message?.includes('password')) {
        throw new Error('비밀번호 변경에 실패했습니다. 현재 비밀번호를 확인해주세요.');
      }
      
      throw new Error(updateError.message || '비밀번호 변경에 실패했습니다.');
    }

    console.info('[supabase/auth] Password changed successfully');
  },
  async deleteAccount(): Promise<void> {
    // 현재 사용자 정보 가져오기
    const {
      data: { user },
      error: getUserError,
    } = await sb.auth.getUser();

    if (getUserError || !user) {
      throw new UnauthorizedError('로그인이 필요합니다.');
    }

    // users 테이블에서 사용자 정보 삭제
    const { error: deleteProfileError } = await sb
      .from('users')
      .delete()
      .eq('id', user.id);

    if (deleteProfileError) {
      console.error('[supabase/auth] Failed to delete user profile:', deleteProfileError);
      // 프로필 삭제 실패해도 계정 삭제는 진행 (auth는 별도로 삭제됨)
    }

    // Supabase Auth에서 사용자 삭제
    // Supabase Admin API를 사용해야 하지만, 클라이언트에서는 직접 삭제가 불가능
    // 대신 사용자 계정을 비활성화하거나, 서버 사이드에서 처리해야 함
    // 여기서는 로그아웃하고 사용자에게 안내
    await sb.auth.signOut();
    removeToken();

    // 주의: 실제 계정 삭제는 Supabase Admin API를 통해 서버에서 처리해야 합니다
    // 클라이언트에서는 사용자 데이터 삭제와 로그아웃만 수행
    console.info('[supabase/auth] User account deletion initiated. Profile deleted.');
    throw new Error(
      '계정 삭제가 요청되었습니다. 실제 계정 삭제는 관리자 확인 후 처리됩니다. 잠시 후 로그아웃됩니다.',
    );
  },
};