export const MARKETING_CATEGORIES = [
  '브랜드 마케팅',
  'SNS 마케팅',
  '콘텐츠 마케팅',
  '퍼포먼스 마케팅',
  'UI/UX 디자인',
  '그래픽 디자인',
] as const;

export const DEVELOPMENT_CATEGORIES = ['프론트엔드', '백엔드', '풀스택', '데이터 분석', 'AI/ML', '모바일 앱'] as const;

export const DEFAULT_SUGGESTED_PROMPTS = [
  '내 프로젝트 경험을 바탕으로 강점을 분석해줘',
  '이 프로젝트로 어떤 역량을 어필할 수 있을까?',
  '자기소개서에 이 경험을 어떻게 녹여낼 수 있을까?',
  '다음 프로젝트는 어떤 걸 해야 경쟁력이 생길까?',
] as const;

export type MarketingCategory = (typeof MARKETING_CATEGORIES)[number];
export type DevelopmentCategory = (typeof DEVELOPMENT_CATEGORIES)[number];



