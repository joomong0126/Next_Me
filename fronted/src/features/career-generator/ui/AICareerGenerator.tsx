import { AIAssistant, type AIAssistantProps } from '@/features/assistant';

export type AICareerGeneratorProps = AIAssistantProps;

const DEFAULT_WELCOME_MESSAGE =
  'AI 커리어 제너레이터입니다. 프로젝트를 분석하고 원하는 결과물을 만들어보세요.';

export function AICareerGenerator({ welcomeMessage, ...rest }: AICareerGeneratorProps) {
  return (
    <AIAssistant
      {...rest}
      welcomeMessage={welcomeMessage ?? DEFAULT_WELCOME_MESSAGE}
      showProjectSidebar={false}
    />
  );
}
