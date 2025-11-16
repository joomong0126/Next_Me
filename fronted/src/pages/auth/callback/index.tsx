import { useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { supabaseClient } from '@/shared/api/supabaseClient';
import { api } from '@/shared/api';
import { writeToken } from '@/shared/api/tokenStorage';

export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();

  const hashParams = useMemo(() => {
    // URL hash 형태: #access_token=...&refresh_token=...&token_type=bearer&expires_in=...
    const hash = location.hash.startsWith('#') ? location.hash.slice(1) : location.hash;
    const params = new URLSearchParams(hash);
    return {
      access_token: params.get('access_token'),
      refresh_token: params.get('refresh_token'),
      token_type: params.get('token_type'),
      expires_in: params.get('expires_in'),
      error: params.get('error'),
      code: new URLSearchParams(location.search).get('code'),
    };
  }, [location.hash, location.search]);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        // 우선순위:
        // 1) 해시 기반 implicit flow(#access_token, #refresh_token)
        // 2) 코드 기반 PKCE(?code=) → exchangeCodeForSession
        if (hashParams.access_token && hashParams.refresh_token) {
          await supabaseClient.auth.setSession({
            access_token: hashParams.access_token,
            refresh_token: hashParams.refresh_token,
          });
          // 앱의 인증 가드가 확인할 수 있도록 토큰 저장
          writeToken(hashParams.access_token);
        } else if (hashParams.code) {
          // 일부 공급자/설정에선 code 플로우로 돌아올 수 있음
          await supabaseClient.auth.exchangeCodeForSession(hashParams.code);
          // 세션에서 액세스 토큰을 가져와 저장
          const { data } = await supabaseClient.auth.getSession();
          const accessToken = data?.session?.access_token;
          if (accessToken) {
            writeToken(accessToken);
          }
        } else {
          // Supabase가 자동 처리하도록 시도 (detectSessionInUrl=false 이지만 보호차 호출)
          try {
            // @ts-expect-error - 방법 지원 여부 환경에 따라 다름
            if (typeof supabaseClient.auth.getSessionFromUrl === 'function') {
              // @ts-ignore
              await supabaseClient.auth.getSessionFromUrl({ storeSession: true });
            }
            // 세션에서 액세스 토큰을 가져와 저장
            const { data } = await supabaseClient.auth.getSession();
            const accessToken = data?.session?.access_token;
            if (accessToken) {
              writeToken(accessToken);
            }
          } catch {
            // 무시하고 계속 진행
          }
        }

        // 사용자 프로필 적재 시도 (선택)
        try {
          await api.auth.me();
        } catch {
          // 세션은 있지만 프로필이 아직 없을 수 있음 → 무시
        }

        await queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
        if (!cancelled) {
          navigate('/app', { replace: true });
        }
      } catch (err) {
        console.error('[AuthCallback] Failed to complete OAuth callback:', err);
        if (!cancelled) {
          // 실패 시 로그인 페이지로
          navigate('/login', { replace: true });
        }
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [hashParams, navigate, queryClient]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-gray-700">로그인 처리 중입니다...</div>
    </div>
  );
}


