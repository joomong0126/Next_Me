import { useNavigate } from 'react-router-dom';
import { Mail } from 'lucide-react';
import { Button } from '@/shared/ui/shadcn/button';
import { Input } from '@/shared/ui/shadcn/input';
import { Label } from '@/shared/ui/shadcn/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/shadcn/card';

export default function LoginPage() {
  const navigate = useNavigate();

  const handleContinue = () => {
    navigate('/onboarding');
  };

  const handleSignup = (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    navigate('/onboarding');
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg rounded-xl border-gray-200">
        <CardHeader className="space-y-2 text-center pt-8 pb-6">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-gray-900 rounded-xl flex items-center justify-center">
              <span className="text-white text-2xl">ME</span>
            </div>
          </div>
          <CardTitle className="text-gray-900">Next ME에 오신 걸 환영합니다</CardTitle>
          <CardDescription className="text-gray-600">AI 기반 커리어 관리를 시작하세요</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">이메일</Label>
            <Input
              id="email"
              type="email"
              placeholder="name@example.com"
              className="rounded-lg"
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
              className="rounded-lg"
            />
          </div>
          <Button onClick={handleContinue} className="w-full rounded-lg bg-gray-900 hover:bg-gray-800 text-white">
            로그인
          </Button>
          
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white px-2 text-gray-500">또는</span>
            </div>
          </div>

          <Button
            variant="outline"
            className="w-full rounded-lg border-gray-300 hover:bg-gray-50"
            onClick={handleContinue}
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

          <div className="text-center">
            <a href="#" className="text-gray-900 hover:underline" onClick={handleSignup}>
              회원가입하기
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}