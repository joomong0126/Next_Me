import { useNavigate } from 'react-router-dom';
import { Button } from '@/shared/ui/shadcn/button';
import { ArrowRight, Sparkles, Target, FileText } from 'lucide-react';

export default function IntroPage() {
  const navigate = useNavigate();

  const handleStart = () => {
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tr from-cyan-500/10 to-pink-500/10 rounded-full blur-3xl"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-4">
        <div className="max-w-5xl mx-auto text-center space-y-12">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center shadow-2xl">
              <span className="text-gray-900 text-3xl">ME</span>
            </div>
          </div>

          {/* Main Title */}
          <div className="space-y-6">
            <h1 className="text-5xl md:text-7xl text-white leading-tight">
              AI가 당신의 경험 속<br />
              <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-purple-400 bg-clip-text text-transparent">
                숨은 역량을 찾아드립니다
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 max-w-2xl mx-auto">
              프로젝트와 경험을 업로드하고,<br />
              AI Nexter와 함께 성장 인사이트를 발견하세요.
            </p>
          </div>

          {/* CTA Button */}
          <div className="flex justify-center pt-8">
            <Button
              onClick={handleStart}
              size="lg"
              className="bg-white text-gray-900 hover:bg-gray-100 rounded-full px-12 py-6 text-lg shadow-2xl group"
            >
              시작하기
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-16 max-w-4xl mx-auto">
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 text-left">
              <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center mb-4">
                <Sparkles className="w-6 h-6 text-blue-400" />
              </div>
              <h3 className="text-white text-lg mb-2">AI 기반 분석</h3>
              <p className="text-gray-400">
                경험과 프로젝트를 AI가 분석하여 숨겨진 역량을 발견합니다
              </p>
            </div>

            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 text-left">
              <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center mb-4">
                <Target className="w-6 h-6 text-purple-400" />
              </div>
              <h3 className="text-white text-lg mb-2">맞춤형 커리어 제안</h3>
              <p className="text-gray-400">
                당신의 역량에 최적화된 직무와 성장 방향을 제시합니다
              </p>
            </div>

            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 text-left">
              <div className="w-12 h-12 bg-cyan-500/20 rounded-xl flex items-center justify-center mb-4">
                <FileText className="w-6 h-6 text-cyan-400" />
              </div>
              <h3 className="text-white text-lg mb-2">자동 문서 생성</h3>
              <p className="text-gray-400">
                포트폴리오, 자기소개서를 AI가 자동으로 작성해드립니다
              </p>
            </div>
          </div>

          {/* Stats or Social Proof (Optional) */}
          <div className="flex flex-wrap justify-center gap-8 pt-8 text-gray-400">
            <div className="text-center">
              <div className="text-3xl text-white mb-1">1,000+</div>
              <div className="text-sm">활성 사용자</div>
            </div>
            <div className="text-center">
              <div className="text-3xl text-white mb-1">5,000+</div>
              <div className="text-sm">분석된 프로젝트</div>
            </div>
            <div className="text-center">
              <div className="text-3xl text-white mb-1">98%</div>
              <div className="text-sm">사용자 만족도</div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-8 left-0 right-0 text-center">
        <p className="text-gray-500 text-sm">
          © 2025 Next ME. All rights reserved.
        </p>
      </div>
    </div>
  );
}
