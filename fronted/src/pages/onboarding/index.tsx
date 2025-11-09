import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Button } from '@/shared/ui/shadcn/button';
import { Badge } from '@/shared/ui/shadcn/badge';
import { Input } from '@/shared/ui/shadcn/input';
import { Bot, ArrowRight } from 'lucide-react';

const steps = [
  {
    question: '안녕하세요, Next ME에 오신 걸 환영합니다.\n당신의 현재 상태를 알려주세요.',
    options: ['대학생', '취업준비생', '직장인', '프리랜서'],
    multiSelect: true,
  },
  {
    question: '목표 직무를 선택해주세요.',
    options: ['기획/전략', 'UI/UX 디자인', '그래픽 디자인', '마케팅', '브랜딩', '프론트엔드 개발', '백엔드 개발', '데이터 분석', 'PM/PO', '영업/세일즈', '인사/HR', '재무/회계', '컨설팅', '기타'],
    enabledOptions: ['마케팅', '프론트엔드 개발', '백엔드 개발'],
    multiSelect: true,
  },
  {
    question: '사용 가능한 툴 또는 기술을 선택하거나 직접 입력해주세요.',
    options: ['Figma', 'Sketch', 'Adobe XD', 'Photoshop', 'Illustrator', 'After Effects', 'Premiere Pro', 'React', 'Vue.js', 'Angular', 'Node.js', 'Python', 'Java', 'Swift', 'Kotlin', 'Google Analytics', 'Excel', 'PowerPoint', 'Notion', 'Slack', 'Jira', 'Git', 'SQL', 'Tableau', 'Power BI'],
    multiSelect: true,
    isInput: true,
  },
];

export default function OnboardingPage() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [selections, setSelections] = useState<{ [key: number]: string[] }>({});
  const [inputValue, setInputValue] = useState('');
  const [tags, setTags] = useState<string[]>([]);

  const currentStepData = steps[currentStep];

  const handleOptionClick = (option: string) => {
    const currentSelections = selections[currentStep] || [];
    if (currentStepData.multiSelect) {
      if (currentSelections.includes(option)) {
        setSelections({
          ...selections,
          [currentStep]: currentSelections.filter((s) => s !== option),
        });
      } else {
        setSelections({
          ...selections,
          [currentStep]: [...currentSelections, option],
        });
      }
    } else {
      setSelections({ ...selections, [currentStep]: [option] });
    }
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // 온보딩 완료 시 사용자 정보 저장
      const userProfile = {
        status: selections[0] || [],
        goals: selections[1] || [],
        skills: [...(selections[2] || []), ...tags],
        completedAt: new Date().toISOString(),
      };
      
      // localStorage에 저장
      localStorage.setItem('onboardingCompleted', 'true');
      localStorage.setItem('userProfile', JSON.stringify(userProfile));
      
      sessionStorage.removeItem('welcomeShown');
      navigate('/app/assistant');
    }
  };

  const handleAddTag = () => {
    if (inputValue.trim() && !tags.includes(inputValue.trim())) {
      setTags([...tags, inputValue.trim()]);
      setInputValue('');
    }
  };

  const canProceed = currentStepData.isInput
    ? true // 스킬 입력은 선택사항
    : (selections[currentStep] || []).length > 0;

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
        <div className="grid md:grid-cols-2">
          {/* Left Side - AI Character */}
          <div className="bg-[#1A1A1A] p-12 flex flex-col items-center justify-center text-white">
            <div className="w-32 h-32 bg-white/10 rounded-full flex items-center justify-center mb-6">
              <Bot className="w-16 h-16 text-white" />
            </div>
            <h3 className="text-center mb-2">AI 커리어 코치</h3>
            <p className="text-center text-gray-400">
              당신만의 커리어 여정을 함께 만들어갑니다
            </p>
            <div className="mt-8 flex gap-2">
              {steps.map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full ${
                    index <= currentStep ? 'bg-white' : 'bg-gray-700'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Right Side - Questions */}
          <div className="p-12">
            <div className="mb-8">
              <h2 className="text-gray-900 mb-6 whitespace-pre-line">
                {currentStepData.question}
              </h2>

              {currentStepData.isInput && (
                <div className="flex gap-2 mb-4">
                  <Input
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                    placeholder="스킬을 입력하세요"
                    className="rounded-lg"
                  />
                  <Button onClick={handleAddTag} className="rounded-lg bg-gray-900 hover:bg-gray-800 text-white">
                    추가
                  </Button>
                </div>
              )}

              {currentStepData.isInput && tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {tags.map((tag, index) => (
                    <Badge key={index} variant="secondary" className="rounded-lg bg-accent text-accent-foreground">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                {currentStepData.options.map((option) => {
                  const isSelected = (selections[currentStep] || []).includes(option);
                  const isEnabled = !currentStepData.enabledOptions || currentStepData.enabledOptions.includes(option);
                  return (
                    <Button
                      key={option}
                      onClick={() => isEnabled && handleOptionClick(option)}
                      variant={isSelected ? 'default' : 'outline'}
                      size="sm"
                      disabled={!isEnabled}
                      className={`rounded-lg ${
                        isSelected ? 'bg-gray-900 hover:bg-gray-800 text-white' : 
                        !isEnabled ? 'border-gray-200 text-gray-400 cursor-not-allowed opacity-50' :
                        'border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {option}
                    </Button>
                  );
                })}
              </div>
            </div>

            <Button
              onClick={handleNext}
              disabled={!canProceed}
              className="w-full rounded-lg bg-gray-900 hover:bg-gray-800 text-white mt-8"
            >
              {currentStep < steps.length - 1 ? '다음' : '시작하기'}
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}