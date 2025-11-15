import type { Project } from '@/entities/project';

import type { AssistantMessage } from '@/features/ai/chat/types';

export type AIFeatureName = '포트폴리오 작성' | '자기소개서 작성' | '역량 분석' | '학습 계획' | '목표 직무 제안';

export const MAX_FEATURE_PROJECT_SELECTION = 3;

const SELF_INTRO_GUIDANCE =
  '자기소개서 작성을 도와드릴게요!\n\n**Settings에 등록된 프로필과 커리어 정보**를 바탕으로 자기소개서를 작성할 수 있어요.\n더 풍부한 결과를 원하신다면, **Settings 탭에서 "경력 · 기술 · 활동 정보"**를 추가해보세요.\n\n프로젝트를 선택하시면 더욱 구체적인 자기소개서를 작성해드릴게요. 어떤 프로젝트를 포함하시겠어요?';

const MARKETING_ROLE_KEYWORDS = ['marketing', '마케팅'];
const DEVELOPMENT_ROLE_KEYWORDS = ['developer', '개발', '프론트엔드 개발', '백엔드 개발'];

export interface FeaturePreparationContext {
  feature: string;
  projectId: number;
}

export interface FeatureResultContext {
  feature: string;
  projects: Project[];
  userRole: string;
}

export const createFeaturePreparationMessage = ({
  feature,
  projectId,
}: FeaturePreparationContext): AssistantMessage | null => {
  if (feature === '자기소개서 작성') {
    return {
      projectId,
      role: 'ai',
      content: SELF_INTRO_GUIDANCE,
      timestamp: new Date(),
    };
  }

  return null;
};

export const createFeatureResultContent = ({ feature, projects, userRole }: FeatureResultContext): string => {
  if (projects.length === 0) {
    return '선택된 프로젝트가 없습니다. 다시 시도해주세요.';
  }

  const projectTitles = projects.map((project) => project.title).join(', ');
  const uniqueTags = Array.from(new Set(projects.flatMap((project) => project.tags)));
  const primaryProject = projects[0];

  switch (feature) {
    case '포트폴리오 작성':
      return `선택하신 프로젝트(${projectTitles})를 바탕으로 포트폴리오를 작성해드릴게요!\n\n**프로젝트 개요**\n${projects
        .map((project) => `• ${project.title}: ${project.summary}`)
        .join('\n')}\n\n**핵심 역량**\n${uniqueTags.join(', ')}\n\n포트폴리오를 더 구체적으로 작성하려면 각 프로젝트의 성과를 추가해주세요!`;
    case '자기소개서 작성':
      if (!primaryProject) {
        return '프로젝트 정보를 찾을 수 없습니다. 다시 시도해주세요.';
      }
      return `선택하신 프로젝트(${projectTitles})를 바탕으로 자기소개서를 작성해드릴게요!\n\n**지원 동기 및 경험**\n저는 ${
        primaryProject.category
      } 분야에서 다양한 프로젝트를 수행하며 실무 경험을 쌓아왔습니다.\n\n특히 "${
        primaryProject.title
      }" 프로젝트에서는 ${primaryProject.tags.join(
        ', ',
      )} 등의 역량을 발휘했습니다.\n\n더 구체적인 자기소개서를 원하시면 프로젝트의 상세 정보를 추가해주세요!`;
    case '역량 분석':
      return `선택하신 프로젝트(${projectTitles})를 분석한 결과입니다!\n\n**보유 역량**\n${uniqueTags
        .map((tag) => `• ${tag}`)
        .join('\n')}\n\n**프로젝트 유형**\n${Array.from(new Set(projects.map((project) => `• ${project.category}`))).join(
        '\n',
      )}\n\n**추천 발전 방향**\n현재 역량을 바탕으로 더 심화된 프로젝트에 도전해보세요!`;
    case '학습 계획':
      if (!primaryProject) {
        return '프로젝트 정보를 찾을 수 없습니다. 다시 시도해주세요.';
      }
      return `선택하신 프로젝트(${projectTitles})를 바탕으로 학습 계획을 제안드립니다!\n\n**현재 수준**\n${
        primaryProject.category
      } 분야의 기초~중급 프로젝트 경험\n\n**추천 학습 계획 (3개월)**\n1주차: 기존 프로젝트 복습 및 부족한 부분 파악\n2-4주차: 관련 심화 이론 학습\n5-8주차: 새로운 기술 스택 적용 프로젝트 진행\n9-12주차: 포트폴리오 정리 및 실전 프로젝트`;
    case '목표 직무 제안': {
      const isMarketingRole = MARKETING_ROLE_KEYWORDS.includes(userRole.toLowerCase());
      const isDevelopmentRole = DEVELOPMENT_ROLE_KEYWORDS.includes(userRole.toLowerCase());

      const recommendedRoles = isMarketingRole
        ? ['• 디지털 마케팅 매니저', '• 브랜드 마케팅 스페셜리스트', '• 콘텐츠 마케팅 매니저']
        : ['• 프론트엔드 개발자', '• 풀스택 개발자', '• UI/UX 엔지니어'];

      const highlightedTags = uniqueTags.slice(0, 3).join(', ');

      return `선택하신 프로젝트(${projectTitles})를 분석한 결과, 다음 직무를 추천드립니다!\n\n**추천 직무**\n${recommendedRoles.join(
        '\n',
      )}\n\n**이유**\n보유하신 ${highlightedTags} 등의 역량이 해당 직무에 적합합니다!`;
    }
    default:
      return '선택하신 기능을 처리할 수 없습니다. 잠시 후 다시 시도해주세요.';
  }
};

export const createFeatureResultMessage = (
  projectId: number,
  content: string,
  overrides?: Partial<AssistantMessage>,
): AssistantMessage => ({
  projectId,
  role: 'ai',
  content,
  timestamp: new Date(),
  ...overrides,
});

