import type { ProjectRecord, ProjectsAPI } from '../../contracts';

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const mockProjects: ProjectRecord[] = [
  {
    id: 1,
    title: '10월 페이백 이벤트 캠페인',
    category: '콘텐츠 마케팅',
    tags: ['오프라인 프로모션', '지역 마케팅', '페이백 이벤트', '페스티벌'],
    summary: '페스티벌 기간 동안 방문 유도를 위해 진행한 지역형 페이백 이벤트로 방문자 200% 증가를 달성했습니다.',
    type: 'file',
    sourceUrl: 'KakaoTalk_20251005_194830764_01.png',
    period: '2025.10',
    startDate: '2025-10-01',
    endDate: '2025-10-31',
    role: '마케팅 리드',
    achievements: '방문자 수 전월 대비 200% 상승\n예산 조기 소진',
    tools: 'Google Analytics, Instagram, Canva',
    description: '요가 페스티벌과 연계한 선착순 페이백 이벤트를 기획하고 운영했습니다.',
  },
  {
    id: 2,
    title: '신규 브랜드 런칭 캠페인',
    category: '브랜드 마케팅',
    tags: ['캠페인 기획', '인플루언서 관리', 'SNS'],
    summary: '브랜드 런칭 이벤트를 기획하고 멀티 채널 라이브 캠페인을 진행했습니다.',
    type: 'project',
    startDate: '2025-05-01',
    endDate: '2025-07-31',
    role: '프로젝트 매니저',
    achievements: '인스타그램 팔로워 35% 증가\n사전 예약 1,200건 확보',
    tools: 'Notion, Google Analytics, TikTok Ads',
    description: '콘텐츠 캘린더를 설계하고 인플루언서 12명과 협업하여 브랜드 인지도를 확보했습니다.',
  },
  {
    id: 3,
    title: 'SNS 콘텐츠 전략 프로젝트',
    category: '콘텐츠 마케팅',
    tags: ['데이터 분석', '콘텐츠 기획', '전략 수립'],
    summary: 'SNS 데이터 분석을 기반으로 콘텐츠 전략을 수립해 참여율을 높였습니다.',
    type: 'project',
    startDate: '2025-01-01',
    endDate: '2025-03-31',
    role: '콘텐츠 플래너',
    achievements: '콘텐츠 참여율 2.3배 상승\n월간 전환율 18% 향상',
    tools: 'Tableau, Google Analytics, Buffer',
    description: '주요 채널별 KPI를 재설정하고 유형별 콘텐츠 실험을 통해 최적의 포맷을 도출했습니다.',
  },
  {
    id: 4,
    title: '브랜드 포트폴리오',
    category: '그래픽 디자인',
    tags: ['브랜딩', '비주얼 디자인', '포트폴리오'],
    summary: '브랜드 아이덴티티 디자인 작업물과 산출물을 정리한 포트폴리오입니다.',
    type: 'file',
    sourceUrl: 'portfolio_main.jpg',
    period: '2024',
    tools: 'Figma, Illustrator, Photoshop',
    description: '로고, 컬러 시스템, 타이포그래피 가이드 등 브랜드 에셋을 체계적으로 정리했습니다.',
  },
  {
    id: 5,
    title: '데이터 분석 리포트',
    category: '데이터 분석',
    tags: ['데이터', '분석', '인사이트'],
    summary: '사용자 행동 데이터를 분석하여 전환율 개선 방안을 제시한 리포트입니다.',
    type: 'file',
    sourceUrl: 'data_analysis.pdf',
    period: '2025 Q2',
    tools: 'Python, BigQuery, Looker Studio',
    description: '세그먼트별 퍼널 데이터를 분석하고 문제 구간을 도출했습니다.',
  },
  {
    id: 6,
    title: '제품 목업 이미지',
    category: '디자인',
    tags: ['목업', '제품 디자인', '비주얼'],
    summary: '신제품 패키징 및 목업 디자인 시안을 정리했습니다.',
    type: 'file',
    sourceUrl: 'product_mockup.webp',
    role: '시각 디자이너',
    tools: 'Figma, Blender',
    description: '3D 목업과 패키징 전개도를 제작해 제품 출시 전 이해관계자 검토를 지원했습니다.',
  },
];

export const projects: ProjectsAPI = {
  async list() {
    await wait(350);
    return mockProjects;
  },
  async create(data: Partial<ProjectRecord>): Promise<ProjectRecord> {
    await wait(200);
    const newId = mockProjects.length > 0 ? Math.max(...mockProjects.map(p => p.id)) + 1 : 1;
    const newProject = { id: newId, ...data } as ProjectRecord;
    mockProjects.push(newProject);
    return newProject;
  },
  async update(id: number | string, data: Partial<ProjectRecord>): Promise<ProjectRecord> {
    await wait(200);
    const projectIndex = mockProjects.findIndex((p) => p.id === id);
    if (projectIndex === -1) {
      throw new Error('프로젝트를 찾을 수 없습니다.');
    }
    const updatedProject = { ...mockProjects[projectIndex], ...data };
    mockProjects[projectIndex] = updatedProject;
    return updatedProject;
  },
  async delete(id: number | string): Promise<void> {
    await wait(200);
    const projectIndex = mockProjects.findIndex((p) => p.id === id);
    if (projectIndex === -1) {
      throw new Error('프로젝트를 찾을 수 없습니다.');
    }
    mockProjects.splice(projectIndex, 1);
  },
};


