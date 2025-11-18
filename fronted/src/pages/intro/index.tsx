import { useNavigate } from 'react-router-dom';
import { Button } from '@/shared/ui/shadcn/button';
import { ArrowRight, Sparkles, FolderOpen, FileText } from 'lucide-react';

export default function IntroPage() {
  const navigate = useNavigate();

  const handleStart = () => {
    navigate('/login');
  };

  const featureCards = [
    {
      id: 1,
      title: 'AI 기반 분석',
      description: '경험과 프로젝트를 AI가 분석하여\n숨겨진 역량을 발견합니다',
      icon: Sparkles,
      bgColor: 'rgba(255, 255, 255, 0.1)',
      iconBgColor: '#281836',
      backdropBlur: '15.0px',
    },
    {
      id: 2,
      title: '프로젝트 파일 보관',
      description: '흩어진 프로젝트 문서들을\n한곳에 모아 저장하고 관리합니다.',
      icon: FolderOpen,
      bgColor: 'rgba(38, 38, 38, 0.2)',
      iconBgColor: '#313131',
      backdropBlur: '5.5px',
    },
    {
      id: 3,
      title: 'AI 맞춤 문서 생성',
      description: 'AI가 당신의 역량을 바탕으로\n맞춤 문서를 생성합니다.',
      icon: FileText,
      bgColor: 'rgba(255, 255, 255, 0.1)',
      iconBgColor: '#281836',
      backdropBlur: '23.0px',
    },
  ];

  return (
    <main
      className="relative w-full min-h-screen overflow-x-hidden overflow-y-auto"
      style={{
        background:
          'linear-gradient(179deg, rgba(0,0,1,1) 0%, rgba(0,0,1,1) 35%, rgba(13,0,21,1) 50%, rgba(40,24,55,1) 70%, rgba(45,11,80,1) 80%, rgba(86,45,126,1) 93%, rgba(210,164,255,1) 99%)',
        minHeight: '100vh',
      }}
    >
      {/* 유령 캐릭터 - 텍스트 위쪽 가운데 */}
      <div className="absolute top-[44%] md:top-[42%] left-1/2 -translate-x-1/2 z-30 flex items-center justify-center">
        <img
          src="/유령.png"
          alt="Ghost character"
          className="w-16 h-16 md:w-20 md:h-20 object-contain drop-shadow-[0_0_10px_rgba(255,255,255,0.5)] block"
        />
      </div>

      {/* 텍스트 섹션 - 완전 중앙 */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-10 px-4 w-full max-w-7xl">
        {/* 메인 헤딩 */}
        <h1 className="mb-8 text-center z-10 text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl font-bold text-white leading-tight">
          AI가 당신의 경험 속
          <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 drop-shadow-[0_0_12px_rgba(147,51,234,0.8)]">
            숨은 역량을 찾아드립니다
          </span>
        </h1>

        {/* 서브 헤딩 */}
        <p className="mb-0 text-center font-bold text-white text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl tracking-[0] leading-relaxed z-10 max-w-6xl">
          Next me에서 프로젝트와 경험을 업로드하고,
          <br />
          AI Nexter와 함께 성장 인사이트를 발견하세요.
        </p>

        {/* 시작하기 버튼 - 서브 헤딩 바로 아래 중앙 */}
        <div className="mt-16 md:mt-24 z-10 relative">
          {/* 버튼 주변 장식 요소 */}
          <div className="absolute -inset-4 bg-gradient-to-r from-blue-400/20 via-purple-400/20 to-pink-400/20 rounded-full blur-xl animate-pulse" />
          <div className="absolute -inset-2 bg-gradient-to-r from-blue-400/10 via-purple-400/10 to-pink-400/10 rounded-full blur-md" />
          
          <Button
            onClick={handleStart}
            className="group relative bg-white text-black hover:bg-gray-100 rounded-full px-16 py-8 md:px-20 md:py-9 text-3xl md:text-4xl font-bold shadow-[0_0_30px_rgba(255,255,255,0.5),0_0_60px_rgba(147,51,234,0.3)] transition-all hover:scale-110 hover:shadow-[0_0_40px_rgba(255,255,255,0.7),0_0_80px_rgba(147,51,234,0.5)] flex items-center justify-center gap-3 border-2 border-white/50 min-w-[280px] md:min-w-[320px]"
          >
            <span className="relative z-10">시작하기</span>
            <ArrowRight className="w-7 h-7 md:w-8 md:h-8 relative z-10 transition-transform group-hover:translate-x-1" />
            {/* 버튼 내부 그라데이션 오버레이 */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400/0 via-purple-400/0 to-pink-400/0 hover:from-blue-400/10 hover:via-purple-400/10 hover:to-pink-400/10 rounded-full transition-all" />
          </Button>
        </div>
      </div>

      {/* 계단 유령 이미지 - 오른쪽 아래 */}
      <div className="absolute bottom-8 md:bottom-12 right-4 md:right-12 z-20">
        <img
          src="/계단유령.png"
          alt="3D structure with ghost"
          className="w-[250px] md:w-[350px] h-auto object-contain"
        />
      </div>

      {/* 기능 카드 - 3개 가로 배치 */}
      <section className="absolute top-[85%] left-1/2 -translate-x-1/2 w-full max-w-5xl px-4 z-10">
        <div className="flex flex-col md:flex-row gap-5 justify-center items-center">
          {featureCards.map((card) => {
            const Icon = card.icon;
            return (
              <article
                key={card.id}
                className="relative w-full md:w-[252px] h-[155px] rounded-[15px] overflow-hidden border border-white/20"
                style={{
                  background: card.bgColor,
                  backdropFilter: `blur(${card.backdropBlur}) brightness(100.0%) saturate(${
                    card.id === 2 ? '90.0%' : '94.0%'
                  }) ${card.id === 2 ? 'hue-rotate(-5.6deg)' : card.id === 3 ? 'hue-rotate(-7.4deg)' : ''}`,
                  WebkitBackdropFilter: `blur(${card.backdropBlur}) brightness(100.0%) saturate(${
                    card.id === 2 ? '90.0%' : '94.0%'
                  }) ${card.id === 2 ? 'hue-rotate(-5.6deg)' : card.id === 3 ? 'hue-rotate(-7.4deg)' : ''}`,
                }}
              >
                <p className="absolute top-[76px] left-[23px] w-[calc(100%-46px)] font-bold text-white text-[15px] tracking-[-0.15px] leading-[30px] whitespace-pre-line">
                  {card.description}
                </p>

                <h3 className="absolute top-12 left-[23px] w-[calc(100%-46px)] font-extrabold text-white text-[15px] tracking-[0] leading-[30px] whitespace-nowrap">
                  {card.title}
                </h3>

                <div className="absolute top-3 right-3 w-[38px] h-[38px] rounded overflow-hidden shadow-[0px_4px_4px_rgba(0,0,0,0.25)]">
                  <div
                    className="absolute -top-px -left-px w-[39px] h-10 rounded shadow-[inset_0px_4px_4px_rgba(0,0,0,0.25)]"
                    style={{ background: card.iconBgColor }}
                  />
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="absolute top-px left-0 w-[38px] h-[38px] bg-[#ffffff1a] rounded backdrop-blur-[41.5px] backdrop-brightness-[100.0%] backdrop-saturate-[94.7%] backdrop-hue-rotate-[10.0deg] shadow-[inset_1px_0_0_rgba(255,255,255,0.32),inset_-1px_0_27px_rgba(0,0,0,0.16)] opacity-10" />
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}
