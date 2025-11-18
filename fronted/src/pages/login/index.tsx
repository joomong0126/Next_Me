import { FormEvent, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/shared/ui/shadcn/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/shared/ui/shadcn/alert-dialog';
import { Input } from '@/shared/ui/shadcn/input';
import { Label } from '@/shared/ui/shadcn/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/shadcn/card';
import { api } from '@/shared/api';
import { supabaseClient } from '@/shared/api/supabaseClient';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();

  // 개발 편의를 위한 기본값
  const [email, setEmail] = useState('dev@dev.com');
  const [password, setPassword] = useState('1234');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletionProfile, setDeletionProfile] = useState<{ email: string; name?: string } | null>(null);
  const [isLookupLoading, setIsLookupLoading] = useState(false);
  const [dialogEmail, setDialogEmail] = useState('');
  const [dialogPassword, setDialogPassword] = useState('');

  const handleSignup = (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    navigate('/signup');
  };

  const persistProfile = async () => {
    try {
      const profile = await api.auth.me();
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('userProfile', JSON.stringify(profile));
        window.localStorage.setItem('onboardingCompleted', 'true');
      }
    } catch {
      // ignore profile fetch failures – user still logged in
    }
  };

  const redirectTarget = (() => {
    const fromState = location.state as { from?: string } | null;
    const candidate = fromState?.from;
    if (candidate && candidate.startsWith('/')) {
      return candidate;
    }
    return '/app';
  })();

  const handleAuthSuccess = async () => {
    await queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
    await persistProfile();
    navigate(redirectTarget, { replace: true });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isLoading) return;

    setError(null);
    setIsLoading(true);
    try {
      await api.auth.login({ email, password });
      await handleAuthSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : '로그인에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAccount = async (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    if (isLoading) return;

    setError(null);
    setDeletionProfile(null);
    setDialogEmail(email ?? '');
    setDialogPassword(password ?? '');
    setIsDeleteDialogOpen(true);
  };

  const lookupDeleteTarget = async () => {
    if (isLookupLoading) return;
    setError(null);
    setIsLookupLoading(true);
    try {
      // 팝업 내 입력값으로 인증 확인
      await api.auth.login({ email: dialogEmail, password: dialogPassword });
      // 인증 성공 시 즉시 탈퇴 처리
      try {
        await api.auth.deleteAccount();
      } catch (deleteErr) {
        const message =
          deleteErr instanceof Error
            ? deleteErr.message
            : '계정 삭제 요청이 처리되었습니다.';
        alert(message);
      }
      setIsDeleteDialogOpen(false);
      setDeletionProfile(null);
      navigate('/intro', { replace: true });
    } catch (err) {
      setDeletionProfile(null);
      setError(err instanceof Error ? err.message : '아이디 또는 비밀번호가 올바르지 않습니다.');
    } finally {
      setIsLookupLoading(false);
    }
  };

  const confirmDeleteAccount = async () => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      await api.auth.deleteAccount();
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : '계정 삭제 요청이 처리되었습니다. 잠시 후 다시 시도하거나, 문제가 지속되면 문의해주세요.';
      alert(message);
    } finally {
      setIsLoading(false);
      setIsDeleteDialogOpen(false);
      setDeletionProfile(null);
      navigate('/intro', { replace: true });
    }
  };

  const handleGoogleLogin = async () => {
    if (isLoading) return;
    setError(null);
    setIsLoading(true);
    try {
      // 구글 로그인 실행 - OAuth 리다이렉트 방식
      const { data, error: oauthError } = await supabaseClient.auth.signInWithOAuth({
        provider: 'google',
        options: {
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (oauthError) {
        throw oauthError;
      }

      // OAuth는 리다이렉트 방식이므로 여기서는 페이지가 이동됩니다
      // 실제 세션 처리는 /auth/callback에서 이루어집니다
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Google 로그인에 실패했습니다.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg rounded-3xl border-gray-200">
        <CardHeader className="space-y-2 text-center pt-8 pb-6">
          <div className="flex justify-center mb-4">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{
                background: 'linear-gradient(to right, #000000, #9333EA)',
              }}
            >
              <img
                src="/유령.png"
                alt="ME"
                className="w-8 h-8 object-contain"
              />
            </div>
          </div>
          <CardTitle className="text-gray-900">Next ME에 오신 걸 환영합니다</CardTitle>
          <CardDescription className="text-gray-600">
            AI 기반 커리어 관리를 시작하세요
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="email">이메일</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="rounded-xl"
                required
                autoComplete="email"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">비밀번호</Label>
                <button
                  type="button"
                  onClick={() => alert('비밀번호 찾기 기능은 준비 중입니다.')}
                  className="text-sm text-gray-600 hover:text-gray-900 hover:underline"
                >
                  비밀번호 찾기
                </button>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="rounded-xl"
                required
                autoComplete="current-password"
              />
            </div>
            {error ? <p className="text-sm text-red-500">{error}</p> : null}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-xl text-white disabled:opacity-60 disabled:cursor-not-allowed"
              style={{
                background: 'linear-gradient(to right, #000000, #9333EA)',
              }}
            >
              {isLoading ? '로그인 중...' : '로그인'}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white px-2 text-gray-500">또는</span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            disabled={isLoading}
            className="w-full rounded-xl border-gray-300 hover:bg-gray-50 disabled:opacity-60 disabled:cursor-not-allowed"
            onClick={handleGoogleLogin}
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Google로 계속하기
          </Button>

          <div className="flex items-center justify-between text-sm">
            <a href="#" className="text-gray-900 hover:underline" onClick={handleSignup}>
              회원가입하기
            </a>
            <a
              href="#"
              className="text-gray-500 hover:text-gray-900 hover:underline"
              onClick={handleDeleteAccount}
            >
              탈퇴하기
            </a>
          </div>
        </CardContent>
      </Card>
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>계정 삭제 확인</AlertDialogTitle>
            <AlertDialogDescription>
              <div className="space-y-3">
                <div>탈퇴를 진행하려면 계정 정보를 입력하고 조회를 눌러주세요. 일치하면 즉시 탈퇴됩니다.</div>
                <div className="space-y-2">
                  <Label htmlFor="delete-email">이메일</Label>
                  <Input
                    id="delete-email"
                    type="email"
                    value={dialogEmail}
                    onChange={(e) => setDialogEmail(e.target.value)}
                    autoComplete="email"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="delete-password">비밀번호</Label>
                  <Input
                    id="delete-password"
                    type="password"
                    value={dialogPassword}
                    onChange={(e) => setDialogPassword(e.target.value)}
                    autoComplete="current-password"
                  />
                </div>
                {error ? <p className="text-sm text-red-500">{error}</p> : null}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading} onClick={() => setIsDeleteDialogOpen(false)}>
              취소
            </AlertDialogCancel>
            <Button
              type="button"
              variant="outline"
              disabled={isLookupLoading || !dialogEmail || !dialogPassword}
              className="min-w-20"
              onClick={lookupDeleteTarget}
            >
              {isLookupLoading ? '조회 중...' : '조회'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}