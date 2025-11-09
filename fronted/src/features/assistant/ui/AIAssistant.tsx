import { useState, useEffect, Dispatch, SetStateAction, ChangeEvent, MouseEvent } from 'react';
import { Card } from '@/shared/ui/shadcn/card';
import { Button } from '@/shared/ui/shadcn/button';
import { Textarea } from '@/shared/ui/shadcn/textarea';
import { Badge } from '@/shared/ui/shadcn/badge';
import { Input } from '@/shared/ui/shadcn/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/shared/ui/shadcn/dialog';
import { Checkbox } from '@/shared/ui/shadcn/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/shadcn/popover';
import { Calendar } from '@/shared/ui/shadcn/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/shadcn/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/shadcn/tabs';
import { Send, Bot, User, Copy, ThumbsUp, ThumbsDown, Sparkles, Upload, FileText, Link2, MessageSquare, Plus, Download, ExternalLink, Megaphone, PenTool, Layout, Palette, Code, BarChart3, TrendingUp, X, Check, Loader2, Edit2, Trash2, CalendarIcon, Briefcase, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { YearMonthPicker } from '@/shared/ui/custom';
import type { Project } from '@/entities/project';

interface Message {
  role: 'ai' | 'user';
  content: string;
  timestamp: Date;
  image?: string; // 이미지 URL 추가
  isProjectOrganizing?: boolean; // 프로젝트 정리 관련 메시지 식별
  projectId?: number; // 어떤 프로젝트 정리인지
}

interface AIGeneratedData {
  title: string;
  date: string;
  format: string;
  tags: string[];
  summary: string;
  category: string;
}

// 카테고리별 아이콘 매핑 함수
const getCategoryIcon = (category: string) => {
  const iconMap: { [key: string]: { icon: any; gradient: string } } = {
    // 마케팅 카테고리
    '브랜드 마케팅': { icon: Megaphone, gradient: 'from-blue-500 to-cyan-500' },
    'SNS 마케팅': { icon: MessageSquare, gradient: 'from-purple-500 to-pink-500' },
    '콘텐츠 마케팅': { icon: PenTool, gradient: 'from-orange-500 to-red-500' },
    '퍼포먼스 마케팅': { icon: TrendingUp, gradient: 'from-green-500 to-emerald-500' },
    'UI/UX 디자인': { icon: Layout, gradient: 'from-indigo-500 to-purple-500' },
    '그래픽 디자인': { icon: Palette, gradient: 'from-pink-500 to-rose-500' },
    
    // 개발 카테고리
    '프론트엔드': { icon: Code, gradient: 'from-blue-500 to-cyan-500' },
    '백엔드': { icon: Code, gradient: 'from-purple-500 to-pink-500' },
    '풀스택': { icon: Code, gradient: 'from-orange-500 to-red-500' },
    '데이터 분석': { icon: BarChart3, gradient: 'from-green-500 to-emerald-500' },
    'AI/ML': { icon: Sparkles, gradient: 'from-indigo-500 to-purple-500' },
    '모바일 앱': { icon: Code, gradient: 'from-pink-500 to-rose-500' },
    
    // 기타
    '기타': { icon: FileText, gradient: 'from-gray-500 to-gray-600' },
  };

  return iconMap[category] || iconMap['기타'];
};

// 날짜 포맷 헬퍼 함수
const formatDate = (date: Date | undefined) => {
  if (!date) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}.${month}`;
};

// 기간 포맷 헬퍼 함수
const formatPeriod = (startDate: Date | undefined, endDate: Date | undefined) => {
  if (!startDate && !endDate) return '';
  if (startDate && endDate) {
    return `${formatDate(startDate)} - ${formatDate(endDate)}`;
  }
  if (startDate) {
    return `${formatDate(startDate)} - 진행중`;
  }
  return '';
};

export interface AIAssistantProps {
  projects: Project[];
  setProjects: Dispatch<SetStateAction<Project[]>>;
  userRole: string;
}

const suggestedPrompts = [
  '내 프로젝트 경험을 바탕으로 강점을 분석해줘',
  '이 프로젝트로 어떤 역량을 어필할 수 있을까?',
  '자기소개서에 이 경험을 어떻게 녹여낼 수 있을까?',
  '다음 프로젝트는 어떤 걸 해야 경쟁력이 생길까?',
];

export function AIAssistant({ projects, setProjects, userRole }: AIAssistantProps) {
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'ai',
      content:
        '안녕하세요! 저는 Nexter, 당신의 커리어 성장 파트너입니다.\n업로드한 프로젝트 속에서 당신의 강점과 잠재력을 발견하고,\n커리어 방향과 자기소개서까지 함께 정리해드릴게요!\n왼쪽에서 프로젝트를 선택하거나 새 프로젝트를 추가해보세요!',
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [uploadType, setUploadType] = useState<'file' | 'link' | 'image' | 'document' | 'pdf' | 'text' | null>(null);
  const [linkUrl, setLinkUrl] = useState('');
  const [textInput, setTextInput] = useState('');
  const [textTitle, setTextTitle] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [viewingProject, setViewingProject] = useState<Project | null>(null);
  const [editedTitle, setEditedTitle] = useState('');
  const [editedTags, setEditedTags] = useState('');
  const [editedSummary, setEditedSummary] = useState('');
  const [editedCategory, setEditedCategory] = useState('');
  const [editedPeriod, setEditedPeriod] = useState('');
  const [editedRole, setEditedRole] = useState('');
  const [editedAchievements, setEditedAchievements] = useState('');
  const [editedTools, setEditedTools] = useState('');
  const [editedDescription, setEditedDescription] = useState('');
  const [editedStartDate, setEditedStartDate] = useState<Date | undefined>(undefined);
  const [editedEndDate, setEditedEndDate] = useState<Date | undefined>(undefined);

  // 프로젝트 불러오기 다이얼로그
  const [loadProjectDialogOpen, setLoadProjectDialogOpen] = useState(false);
  const [selectedProjectsToLoad, setSelectedProjectsToLoad] = useState<number[]>([]);

  // AI 기능 관련 상태
  const [aiFeatureDialogOpen, setAiFeatureDialogOpen] = useState(false);
  const [selectedFeature, setSelectedFeature] = useState<string>('');
  const [projectSelectDialogOpen, setProjectSelectDialogOpen] = useState(false);
  const [selectedProjectsForFeature, setSelectedProjectsForFeature] = useState<number[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  // 데모 대화 상태
  const [isDemoRunning, setIsDemoRunning] = useState(false);
  const [demoStep, setDemoStep] = useState(0);

  // 사용자 프로필 정보 (Settings에서 가져오기)
  const [userProfile, setUserProfile] = useState<{
    name: string;
    currentStatus: string[];
    targetRoles: string[];
  }>({
    name: '예진',
    currentStatus: [],
    targetRoles: [],
  });

  // localStorage에서 사용자 정보 불러오기
  useEffect(() => {
    const savedCareerData = localStorage.getItem('careerData');
    if (savedCareerData) {
      try {
        const careerData = JSON.parse(savedCareerData);
        setUserProfile({
          name: '예진', // 기본값
          currentStatus: careerData.currentStatus || [],
          targetRoles: careerData.targetRoles || [],
        });
      } catch (e) {
        console.error('Failed to parse career data:', e);
      }
    }
  }, []);

  const selectedProject = projects.find((p) => p.id === selectedProjectId);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      role: 'user',
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages([...messages, userMessage]);
    setInputValue('');

    // 프로젝트 정리 대화 중인지 확인
    const isOrganizingProject = messages.some(m => m.isProjectOrganizing && m.projectId === selectedProjectId);

    // AI 응답 시뮬레이션
    setTimeout(() => {
      const aiMessage: Message = {
        role: 'ai',
        content: isOrganizingProject && selectedProject
          ? `네, 좋은 답변이에요! 👍\n\n"${selectedProject.title}" 프로젝트에 대해 더 자세히 알려주실 내용이 있다면 계속 이야기해주세요. 충분히 정리되었다면 '저장하기' 버튼을 눌러주세요.`
          : selectedProject
          ? `"${selectedProject.title}" 프로젝트에 대한 질문이시군요! 이 프로젝트에서는 ${selectedProject.tags.join(', ')} 등의 역량을 보여주셨네요. 더 구체적으로 어떤 부분이 궁금하신가요?`
          : '프로젝트를 선택하시면 더 구체적인 답변을 드릴 수 있어요. 왼쪽에서 프로젝트를 선택해주세요!',
        timestamp: new Date(),
        isProjectOrganizing: isOrganizingProject,
        projectId: isOrganizingProject && selectedProjectId !== null ? selectedProjectId : undefined,
      };
      setMessages((prev) => [...prev, aiMessage]);
    }, 1000);
  };

  const handleCopyMessage = async (content: string) => {
    try {
      // 최신 브라우저의 Clipboard API 사용
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(content);
        toast.success('메시지가 복사되었습니다');
      } else {
        // Fallback: textarea를 사용한 복사
        const textarea = document.createElement('textarea');
        textarea.value = content;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        
        try {
          document.execCommand('copy');
          toast.success('시지가 복사되었습니다');
        } catch (err) {
          toast.error('복사에 실패했습니다');
        }
        
        document.body.removeChild(textarea);
      }
    } catch (err) {
      toast.error('복사에 실패했습니다');
    }
  };

  // 채팅 입력창에서 파일 업로드
  const handleChatFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileType = file.type;
    let uploadTypeToSet: 'image' | 'document' | 'pdf' = 'document';

    if (fileType.startsWith('image/')) {
      uploadTypeToSet = 'image';
    } else if (fileType === 'application/pdf') {
      uploadTypeToSet = 'pdf';
    }

    setUploadType(uploadTypeToSet);
    handleFileUpload(file);
  };

  // 프로젝트 등록 다이얼로그 열기
  const openUploadDialog = () => {
    setShowUploadDialog(true);
    setUploadType(null);
  };

  // 파일 업로드 처리
  const handleFileUpload = (file: File) => {
    setIsAnalyzing(true);
    setShowUploadDialog(false);

    // 파일 분석 시뮬레이션
    setTimeout(() => {
      const generatedData: AIGeneratedData = {
        title: file.name.replace(/\.[^/.]+$/, ''),
        date: new Date().toLocaleDateString('ko-KR'),
        format: file.type.startsWith('image/') ? '이미지' : file.type === 'application/pdf' ? 'PDF' : '문서',
        tags: ['분석됨', '업로드'],
        summary: `${file.name} 파일이 성공적으로 업로드되었습니다.`,
        category: userRole === 'marketing' ? '브랜드 마케팅' : '프론트엔드',
      };

      createProjectFromAI(generatedData);
      setIsAnalyzing(false);
    }, 2000);
  };

  // 링크 업로드 처리
  const handleLinkUpload = () => {
    if (!linkUrl.trim()) {
      toast.error('링크를 입력해주세요');
      return;
    }

    setIsAnalyzing(true);
    setShowUploadDialog(false);

    setTimeout(() => {
      const generatedData: AIGeneratedData = {
        title: new URL(linkUrl).hostname,
        date: new Date().toLocaleDateString('ko-KR'),
        format: '링크',
        tags: ['웹사이트', '링크'],
        summary: `${linkUrl}에서 가져온 프로젝트입니다.`,
        category: userRole === 'marketing' ? 'SNS 마케팅' : '백엔드',
      };

      createProjectFromAI(generatedData, linkUrl);
      setIsAnalyzing(false);
      setLinkUrl('');
    }, 2000);
  };

  // 텍스트 업로드 처리
  const handleTextUpload = () => {
    if (!textInput.trim() || !textTitle.trim()) {
      toast.error('제목과 내용을 입력해주세요');
      return;
    }

    setIsAnalyzing(true);
    setShowUploadDialog(false);

    setTimeout(() => {
      const generatedData: AIGeneratedData = {
        title: textTitle,
        date: new Date().toLocaleDateString('ko-KR'),
        format: '텍스트',
        tags: ['텍스트', '업로드'],
        summary: `${textInput} 텍스트가 성공적으로 업로드되었습니다.`,
        category: userRole === 'marketing' ? '콘텐츠 마케팅' : '풀스택',
      };

      createProjectFromAI(generatedData);
      setIsAnalyzing(false);
      setTextInput('');
      setTextTitle('');
    }, 2000);
  };

  // AI 생성 데이터로부터 프로젝트 생��
  const createProjectFromAI = (data: AIGeneratedData, sourceUrl?: string) => {
    const { icon, gradient } = getCategoryIcon(data.category);
    
    const newProject: Project = {
      id: Date.now(),
      title: data.title,
      category: data.category,
      tags: data.tags,
      summary: data.summary,
      icon: icon,
      gradient: gradient,
      type: sourceUrl ? 'link' : 'file',
      sourceUrl: sourceUrl,
    };

    setProjects([...projects, newProject]);
    
    // 프로젝트 생성 후 편집 다이얼로그 자동 열기
    openEditDialog(newProject);
    
    toast.success('프로젝트가 생성되었습니다! 정보를 수정해주세요.');
  };

  // 프로젝트 편집 다이얼로그 열기
  const openEditDialog = (project: Project) => {
    setEditingProject(project);
    setEditedTitle(project.title);
    setEditedTags(project.tags.join(', '));
    setEditedSummary(project.summary);
    setEditedCategory(project.category);
    setEditedPeriod(project.period || '');
    setEditedRole(project.role || '');
    setEditedAchievements(project.achievements || '');
    setEditedTools(project.tools || '');
    setEditedDescription(project.description || '');
    setEditedStartDate(project.startDate);
    setEditedEndDate(project.endDate);
    setEditDialogOpen(true);
  };

  // 프로젝트 정보 저장
  const handleSaveProject = () => {
    if (!editingProject) return;

    const { icon, gradient } = getCategoryIcon(editedCategory);

    const updatedProject: Project = {
      ...editingProject,
      title: editedTitle,
      category: editedCategory,
      tags: editedTags.split(',').map((tag) => tag.trim()).filter(tag => tag),
      summary: editedSummary,
      icon: icon,
      gradient: gradient,
      period: editedPeriod,
      role: editedRole,
      achievements: editedAchievements,
      tools: editedTools,
      description: editedDescription,
      startDate: editedStartDate,
      endDate: editedEndDate,
    };

    setProjects(projects.map((p) => (p.id === editingProject.id ? updatedProject : p)));
    setEditDialogOpen(false);
    toast.success('프로젝트가 업데이트되었습니다');
  };

  // 프로젝트 삭제
  const handleDeleteProject = (id: number) => {
    if (confirm('정말 이 프로젝트를 삭제하시겠습니까?')) {
      setProjects(projects.filter((p) => p.id !== id));
      if (selectedProjectId === id) {
        setSelectedProjectId(null);
      }
      toast.success('프로젝트가 삭제되었습니다');
    }
  };

  // 프로젝트 상세 정보 보기
  const handleViewProjectDetail = (project: Project) => {
    setViewingProject(project);
    setDetailDialogOpen(true);
  };

  // AI 기능 실행
  const handleAIFeature = (feature: string) => {
    if (projects.length === 0) {
      toast.error('프로젝트를 먼저 추가해주세요');
      return;
    }

    setSelectedFeature(feature);
    
    // 자기소개서 작성일 때는 채팅창에 안내 메시지 표시
    if (feature === '자기소개서 작성') {
      const infoMessage: Message = {
        role: 'ai',
        content: '자기소개서 작성을 도와드릴게요!\n\n**Settings에 등록된 프로필과 커리어 정보**를 바탕으로 자기소개서를 작성할 수 있어요.\n더 풍부한 결과를 원하신다면, **Settings 탭에서 "경력 · 기술 · 활동 정보"**를 추가해보세요.\n\n프로젝트를 선택하시면 더욱 구체적인 자기소개서를 작성해드릴게요. 어떤 프로젝트를 포함하시겠어요?',
        timestamp: new Date(),
      };
      setMessages([...messages, infoMessage]);
      setSelectedProjectsForFeature([]);
      setProjectSelectDialogOpen(true);
    } else {
      setSelectedProjectsForFeature([]);
      setProjectSelectDialogOpen(true);
    }
  };

  // 프로젝트 선택 토글
  const toggleProjectSelection = (projectId: number) => {
    if (selectedProjectsForFeature.includes(projectId)) {
      setSelectedProjectsForFeature(selectedProjectsForFeature.filter(id => id !== projectId));
    } else {
      if (selectedProjectsForFeature.length >= 3) {
        toast.error('최대 3개까지 선택 가능합니다');
        return;
      }
      setSelectedProjectsForFeature([...selectedProjectsForFeature, projectId]);
    }
  };

  // AI 기능 실행 확인
  const handleConfirmAIFeature = () => {
    if (selectedProjectsForFeature.length === 0) {
      toast.error('최소 1개의 프로젝트를 선택해주세요');
      return;
    }

    setProjectSelectDialogOpen(false);
    setIsGenerating(true);

    setTimeout(() => {
      const selectedProjects = projects.filter(p => selectedProjectsForFeature.includes(p.id));
      const projectTitles = selectedProjects.map(p => p.title).join(', ');

      let aiResponse = '';
      switch (selectedFeature) {
        case '포트폴리오 작성':
          aiResponse = `선택하신 프로젝트(${projectTitles})를 바탕으로 포트폴리오를 작성해드릴게요!\n\n**프로젝트 개요**\n${selectedProjects.map(p => `• ${p.title}: ${p.summary}`).join('\n')}\n\n**핵심 역량**\n${selectedProjects.flatMap(p => p.tags).filter((v, i, a) => a.indexOf(v) === i).join(', ')}\n\n포트폴리오를 더 구체적으로 작성하려면 각 프로젝트의 성과를 추가해주세요!`;
          break;
        case '자기소개서 작성':
          aiResponse = `선택하신 프로젝트(${projectTitles})를 바탕으로 자기소개서를 작성해드릴게요!\n\n**지원 동기 및 경험**\n저는 ${selectedProjects[0].category} 분야에서 다양한 프로젝트를 수행하며 실무 경험을 쌓아왔습니다.\n\n특히 "${selectedProjects[0].title}" 프로젝트에서는 ${selectedProjects[0].tags.join(', ')} 등의 역량을 발휘했습니다.\n\n더 구체적인 자기소개서를 원하시면 프로젝트의 상세 정보를 추가해주세요!`;
          break;
        case '역량 분석':
          aiResponse = `선택하신 프로젝트(${projectTitles})를 분석한 결과입니다!\n\n**보유 역량**\n${selectedProjects.flatMap(p => p.tags).filter((v, i, a) => a.indexOf(v) === i).map(tag => `• ${tag}`).join('\n')}\n\n**프로젝트 유형**\n${selectedProjects.map(p => `• ${p.category}`).filter((v, i, a) => a.indexOf(v) === i).join('\n')}\n\n**추천 발전 방향**\n현재 역량을 바탕으로 더 심화된 프로젝트에 도전해보세요!`;
          break;
        case '학습 계획':
          aiResponse = `선택하신 프로젝트(${projectTitles})를 바탕으로 학습 계획을 제안드립니다!\n\n**현재 수준**\n${selectedProjects[0].category} 분야의 기초~중급 프로젝트 경험\n\n**추천 학습 계획 (3개월)**\n1주차: 기존 프로젝트 복습 및 부족한 부분 파악\n2-4주차: 관련 심화 이론 학습\n5-8주차: 새로운 기술 스택 적용 프로젝트 진행\n9-12주차: 포트폴리오 정리 및 실전 프로젝트`;
          break;
        case '목표 직무 제안':
          aiResponse = `선택하신 프로젝트(${projectTitles})를 분석한 결과, 다음 직무를 추천드립니다!\n\n**추천 직무**\n${userRole === 'marketing' ? '• 디지털 마케팅 매니저\n• 브랜드 마케팅 스페셜리스트\n• 콘텐츠 마케팅 매니저' : '• 프론트엔드 개발자\n• 풀스택 개발자\n• UI/UX 엔지니어'}\n\n**이유**\n보유하신 ${selectedProjects.flatMap(p => p.tags).filter((v, i, a) => a.indexOf(v) === i).slice(0, 3).join(', ')} 등의 역량이 해당 직무에 적합합니다!`;
          break;
      }

      const aiMessage: Message = {
        role: 'ai',
        content: aiResponse,
        timestamp: new Date(),
      };

      setMessages([...messages, aiMessage]);
      setIsGenerating(false);
      setAiFeatureDialogOpen(true);
      toast.success(`${selectedFeature} 완료!`);
    }, 2000);
  };

  // 사용자 역할에 따른 카테고리 필터링
  const getAvailableCategories = () => {
    if (userRole === 'marketing' || userRole === '마케팅') {
      return ['브랜드 마케팅', 'SNS 마케팅', '콘텐츠 마케팅', '퍼포먼스 마케팅', 'UI/UX 디자인', '그래픽 디자인'];
    } else if (userRole === 'developer' || userRole === '개발' || userRole === '프론트엔드 개발' || userRole === '백엔드 개발') {
      return ['프론트엔드', '백엔드', '풀스택', '데이터 분석', 'AI/ML', '모바일 앱'];
    }
    // 기본값: 모든 카테고리
    return ['브랜드 마케팅', 'SNS 마케팅', '콘텐츠 마케', '퍼포먼스 마케팅', 'UI/UX 디자인', '그래픽 디자인', '프론트엔드', '백엔드', '풀스택', '데이터 분석', 'AI/ML', '모바일 앱'];
  };

  // 대화 초기화
  const handleResetChat = () => {
    if (confirm('대화 내용을 모두 삭제하시겠습니까?')) {
      setMessages([
        {
          role: 'ai',
          content:
            '안녕하세요! 저는 Nexter, 당신의 커리어 성장 파트너입니다.\\n업로드한 프로젝트 속에서 당신의 강점과 잠재력을 발견하고,\\n커리어 방향과 자기소개서까지 함께 정리해드릴게요!\\n왼쪽에서 프로젝트를 선택하거나 새 프로젝트를 추가해보세요!',
          timestamp: new Date(),
        },
      ]);
      toast.success('대화가 초기화되었습니다');
    }
  };

  // 데모 대화 시작하기 (10월 페이백 이벤트 캠페인용)
  const startDemoConversation = () => {
    setIsDemoRunning(true);
    setDemoStep(0);
    
    // 초기 메시지만 남기고 초기화
    setMessages([
      {
        role: 'ai',
        content:
          '안녕하세요! 저는 Nexter, 당신의 커리어 성장 파트너입니다.\\n업로드한 프로젝트 속에서 당신의 강점과 잠재력을 발견하고,\\n커리어 방향과 자기소개서까지 함께 정리해드릴게요!\\n왼쪽에서 프로젝트를 선택하거나 새 프로젝트를 추가해보세요!',
        timestamp: new Date(),
      },
    ]);
    
    // 첫 번째 AI 메시지
    setTimeout(() => {
      const message1: Message = {
        role: 'ai',
        content: '올려주신 이미지는 "10월 한달간 체험료 1인 1만원 한도 전액 페이백" 캠페인 안내네요.\\n이 프로젝트는 어떤 목표로 진행하신 건가요?',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, message1]);
      setDemoStep(1);
    }, 1000);
  };

  // 데모 대화 진행
  useEffect(() => {
    if (!isDemoRunning) return;
    
    const demoScenario = [
      {
        step: 1,
        userMessage: '10월 요가페스티벌 기간 동안 방문을 늘리려는 목적이었어요.',
        aiMessage: '페스티벌 연계 방문 유도 캠페인이었군요.\\n그럼 이 이벤트는 어떤 식으로 진행되었나요? 예를 들어 오프라인 참여나 신청 방식 같은 부분이 궁금해요.',
        isProjectOrganizing: true,
      },
      {
        step: 2,
        userMessage: '오프라인 방문 고객 중 체험한 사람에게 밀양사랑상품권을 지급했어요. ��착순으로 진행됐고, 예산이 빨리 소진됐어요.',
        aiMessage: '예산이 조기 소진됐다는 건 반응이 예상보다 좋았다는 뜻이네요 😊\\n혹시 목표 대비 얼마나 달성하셨는지 수치적으로도 파악된 게 있을까요?',
        isProjectOrganizing: true,
      },
      {
        step: 3,
        userMessage: '네, 방문자가 전월 대비 약 200% 증가했어요.',
        aiMessage: '방문자 수는 크게 올랐지만, 예산 관리나 운영 측면에서 어려움은 있었던 것 같아요.\\n다음에 같은 캠페인을 진행한다면 어떤 점을 바꾸고 싶으세요?',
        isProjectOrganizing: true,
      },
      {
        step: 4,
        userMessage: '선착순 대신 예약제로 바꾸고, 후기 공유형 이벤트로 바꾸려고요.',
        aiMessage: '정리해보면 이렇게 요약할 수 있겠네요 👇\\n\\n🎯 **목표**: 요가컬처타운 방문 유도 및 페스티벌 연계 홍보\\n📊 **성과**: 방문자 수 200% 증가 (예산 조기 소진)\\n⚙️ **운영 이슈**: 선착순 참여 혼잡\\n💡 **개선 방향**: 예약제 + 후기 공유형 참여 구조\\n\\nKPI와 근거도 함께 정리해둘게요. 다음엔 이 데이터를 기반으로 비슷한 캠페인 설계 시 비교분석도 가능하겠어요!',
        isProjectOrganizing: true,
      },
    ];
    
    const currentScenario = demoScenario.find(s => s.step === demoStep);
    if (!currentScenario) return;
    
    // 사용자 메시지 추가
    const timer1 = setTimeout(() => {
      const userMessage: Message = {
        role: 'user',
        content: currentScenario.userMessage,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, userMessage]);
      
      // AI 응답 추가
      const timer2 = setTimeout(() => {
        const aiMessage: Message = {
          role: 'ai',
          content: currentScenario.aiMessage,
          timestamp: new Date(),
          isProjectOrganizing: true,
          projectId: 1,
        };
        setMessages(prev => [...prev, aiMessage]);
        
        if (demoStep < 4) {
          setDemoStep(demoStep + 1);
        } else {
          setIsDemoRunning(false);
          toast.success('데모 대화가 완료되었습니다!');
        }
      }, 1500);
      
      return () => clearTimeout(timer2);
    }, 1000);
    
    return () => clearTimeout(timer1);
  }, [demoStep, isDemoRunning]);

  // AI와 대화를 통해 프로젝트 정리하기
  const handleOrganizeWithAI = () => {
    if (!editingProject) return;
    
    // 편집 다이얼로그 닫기
    setEditDialogOpen(false);
    
    // 해당 프로젝트 선택
    setSelectedProjectId(editingProject.id);
    
    // AI 메시지 추가
    const aiMessage: Message = {
      role: 'ai',
      content: `"${editingProject.title}" 프로젝트를 함께 정리해볼까요? 😊\n\n다음 질문들에 답변해주시면 프로젝트를 체계적으로 정리할 수 있어요:\n\n1. 이 프로젝트의 주요 목표는 무엇이었나요?\n2. 어떤 역할을 맡으셨나요?\n3. 가장 어려웠던 점과 어떻게 해결하셨나요?\n4. 이 프로젝트를 통해 얻은 성과나 배운 점은 무엇인가요?\n\n자유롭게 답변해주세요!`,
      timestamp: new Date(),
      isProjectOrganizing: true,
      projectId: editingProject.id,
    };
    
    setMessages(prev => [...prev, aiMessage]);
    toast.success('AI와 대화를 시작합니다');
  };

  // 프로젝트 정리 대화 저장하기
  const handleSaveProjectOrganizing = (projectId: number) => {
    const project = projects.find(p => p.id === projectId);
    if (!project) return;

    // 데모 모드일 때
    if (isDemoRunning) {
      // 데모 저장 시연
      toast.loading('프로젝트 정보를 업데이트하는 중...');
      
      setTimeout(() => {
        toast.dismiss();
        toast.success('프로젝트 정보가 업데이트되었습니다!');
        
        // 프로젝트 상세 정보 업데이트 시연을 위한 메시지
        setTimeout(() => {
          const summaryMessage: Message = {
            role: 'ai',
            content: '✅ **저장 완료!**\\n\\n다음 정보가 "10월 페이백 이벤트 캠페인" 프로젝트에 추가되었어요:\\n\\n**목표**: 요가컬처타운 방문 유도 및 페스티벌 연계 홍보\\n**성과**: 방문자 수 200% 증가 (예산 조기 소진)\\n**운영 방식**: 오프라인 방문 → 체험 → 밀양사랑상품권 지급 (선착순)\\n**개선점**: 예약제 + 후기 공유형 참여 구조로 전환 예정\\n\\n언제든 이 프로젝트를 다시 불러와서 포트폴리오나 자기소개서에 활용할 수 있어요! 💪',
            timestamp: new Date(),
          };
          setMessages(prev => [...prev, summaryMessage]);
        }, 500);
      }, 1500);
      return;
    }

    // 일반 모드일 때 (기존 로직)
    // 해당 프로젝트와 관련된 대화 내용 수집
    const projectMessages = messages.filter(msg => 
      messages.findIndex(m => m.projectId === projectId) >= 0 && 
      messages.indexOf(msg) >= messages.findIndex(m => m.projectId === projectId)
    );

    // 사용자 답변들을 수집
    const userResponses = projectMessages
      .filter(m => m.role === 'user')
      .map(m => m.content)
      .join('\n\n');

    // 프로젝트 정보 업데이트 (간단한 파싱)
    const updatedProject = { ...project };
    
    // AI가 분석한 내용을 description에 추가
    if (userResponses) {
      updatedProject.description = `${updatedProject.description || updatedProject.summary}\n\n=== AI와 함께 정리한 내용 ===\n${userResponses}`;
    }

    // 프로젝트 업데이트
    const updatedProjects = projects.map(p => 
      p.id === projectId ? updatedProject : p
    );
    setProjects(updatedProjects);

    // 편집 다이얼로그 열기
    setEditingProject(updatedProject);
    setEditDialogOpen(true);

    toast.success('대화 내용이 프로젝트에 반영되었습니다');
  };

  // 프로젝트 불러오기 선택 토글
  const toggleProjectToLoad = (projectId: number) => {
    if (selectedProjectsToLoad.includes(projectId)) {
      setSelectedProjectsToLoad(selectedProjectsToLoad.filter(id => id !== projectId));
    } else {
      if (selectedProjectsToLoad.length >= 5) {
        toast.error('최대 5개까지 선택 가능합니다');
        return;
      }
      setSelectedProjectsToLoad([...selectedProjectsToLoad, projectId]);
    }
  };

  // 선택한 프로젝트 불러오기
  const handleLoadSelectedProjects = () => {
    if (selectedProjectsToLoad.length === 0) {
      toast.error('프로젝트를 선택해주세요');
      return;
    }

    // 첫 번째 선택된 프로젝트를 현재 대화 프로젝트로 설정
    setSelectedProjectId(selectedProjectsToLoad[0]);
    
    const selectedTitles = projects
      .filter(p => selectedProjectsToLoad.includes(p.id))
      .map(p => p.title)
      .join(', ');
    
    toast.success(`${selectedProjectsToLoad.length}개 프로젝트를 선택했습니다: ${selectedTitles}`);
    
    setLoadProjectDialogOpen(false);
    setSelectedProjectsToLoad([]);
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex gap-4">
      {/* 왼쪽: 프로젝트 목록 */}
      <div className="w-80 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-gray-900 dark:text-white flex items-center gap-2">
              <Upload className="w-5 h-5 text-blue-600" />
              프로젝트
            </h2>
          </div>
          <div className="space-y-2">
            <Button
              onClick={openUploadDialog}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              프로젝트 등록
            </Button>
            <Button
              onClick={() => setLoadProjectDialogOpen(true)}
              variant="outline"
              className="w-full"
            >
              <Download className="w-4 h-4 mr-2" />
              프로젝트 불러오기
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {projects.length === 0 ? (
            <div className="text-center py-12">
              <Upload className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                아직 프로젝트가 없습니다
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500">
                프로젝트를 추가해보세요
              </p>
            </div>
          ) : (
            (() => {
              // 선택된 프로젝트가 있으면 그것을 포함하여 표시
              let displayProjects = [];
              if (selectedProjectId) {
                const selectedProject = projects.find(p => p.id === selectedProjectId);
                if (selectedProject) {
                  displayProjects.push(selectedProject);
                  // 선택된 프로젝트를 제외한 나머지에서 최근 4개 추가
                  const otherProjects = projects.filter(p => p.id !== selectedProjectId).slice(-4).reverse();
                  displayProjects.push(...otherProjects);
                } else {
                  displayProjects = projects.slice(-5).reverse();
                }
              } else {
                displayProjects = projects.slice(-5).reverse();
              }
              
              return displayProjects.map((project) => {
                const Icon = project.icon;
                return (
                  <Card
                    key={project.id}
                    className={`p-4 cursor-pointer transition-all hover:shadow-md group relative ${
                      selectedProjectId === project.id
                        ? 'ring-2 ring-blue-500 dark:ring-blue-400 bg-blue-50 dark:bg-blue-950'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                    onClick={() => handleViewProjectDetail(project)}
                  >
                    {/* 삭제 버튼 */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2 w-7 h-7 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                      onClick={(event: MouseEvent<HTMLButtonElement>) => {
                        event.stopPropagation();
                        handleDeleteProject(project.id);
                      }}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>

                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${project.gradient} flex items-center justify-center flex-shrink-0`}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm text-gray-900 dark:text-white mb-1 truncate pr-8">
                          {project.title}
                        </h3>
                        <Badge variant="outline" className="text-xs mb-2">
                          {project.category}
                        </Badge>
                        <div className="flex flex-wrap gap-1">
                          {project.tags.slice(0, 2).map((tag, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                          {project.tags.length > 2 && (
                            <Badge variant="secondary" className="text-xs">
                              +{project.tags.length - 2}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                      <p className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1">
                        <CalendarIcon className="w-3 h-3" />
                        {(project.startDate || project.endDate) 
                          ? formatPeriod(project.startDate, project.endDate)
                          : project.period 
                          ? project.period
                          : '기간 미정'}
                      </p>
                    </div>

                    {/* 편집 버튼 */}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full mt-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(event: MouseEvent<HTMLButtonElement>) => {
                        event.stopPropagation();
                        openEditDialog(project);
                      }}
                    >
                      <Edit2 className="w-3 h-3 mr-1" />
                      편집
                    </Button>
                  </Card>
                );
              });
            })()
          )}
        </div>
      </div>

      {/* 가운데: 채팅 */}
      <div className="flex-1 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-gray-900 dark:text-white">Nexter</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">AI 커리어 어시스턴트</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleResetChat}
              title="대화 초기화"
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  message.role === 'ai'
                    ? 'bg-gradient-to-br from-purple-600 to-blue-600'
                    : 'bg-gray-600 dark:bg-gray-400'
                }`}
              >
                {message.role === 'ai' ? (
                  <Bot className="w-5 h-5 text-white" />
                ) : (
                  <User className="w-5 h-5 text-white" />
                )}
              </div>
              <div
                className={`flex-1 ${
                  message.role === 'user' ? 'flex justify-end' : ''
                }`}
              >
                <div>
                  <div
                    className={`inline-block max-w-[80%] rounded-2xl px-4 py-3 ${
                      message.role === 'ai'
                        ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                        : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                    }`}
                  >
                    {message.image && (
                      <img src={message.image} alt="uploaded" className="max-w-full rounded-lg mb-2" />
                    )}
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    <p className="text-xs mt-2 opacity-70">
                      {message.timestamp.toLocaleTimeString('ko-KR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                  
                  {/* 프로젝트 정리 대화일 때 버튼 표시 */}
                  {message.role === 'ai' && message.isProjectOrganizing && message.projectId && (
                    <div className="mt-2 flex gap-2">
                      <Button
                        onClick={handleSendMessage}
                        variant="outline"
                        size="sm"
                        className="rounded-lg"
                      >
                        <MessageSquare className="w-3 h-3 mr-1" />
                        더 대화하기
                      </Button>
                      <Button
                        onClick={() => handleSaveProjectOrganizing(message.projectId!)}
                        size="sm"
                        className="rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                      >
                        <Check className="w-3 h-3 mr-1" />
                        저장하기
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          {isGenerating && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center flex-shrink-0">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <div className="inline-block rounded-2xl px-4 py-3 bg-gray-100 dark:bg-gray-700">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                    <span className="text-sm text-gray-600 dark:text-gray-300">생성 중...</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex gap-2">
            <input
              type="file"
              id="chat-file-upload"
              className="hidden"
              accept="image/*,.pdf,.doc,.docx"
              onChange={handleChatFileUpload}
            />
            <Button
              variant="outline"
              size="icon"
              onClick={() => document.getElementById('chat-file-upload')?.click()}
              className="flex-shrink-0"
            >
              <Plus className="w-4 h-4" />
            </Button>
            <Textarea
              placeholder={
                selectedProject
                  ? `"${selectedProject.title}" 프로젝트에 대해 질문하세요...`
                  : 'Nexter에게 질문하세요...'
              }
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              className="flex-1 min-h-[44px] max-h-32 resize-none"
            />
            <Button
              onClick={handleSendMessage}
              disabled={!inputValue.trim()}
              className="flex-shrink-0 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* 오른쪽: AI 기능 & 추천 질문 */}
      <div className="w-80 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 p-6 overflow-y-auto">
        {/* 내 기본정보 */}
        <div className="mb-8">
          <h3 className="text-sm text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <User className="w-4 h-4 text-blue-600" />
            내 기본정보
          </h3>
          <Card className="p-4">
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400">이름</label>
                <p className="text-sm text-gray-900 dark:text-white">{userProfile.name}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400">현재 상태</label>
                <p className="text-sm text-gray-900 dark:text-white">
                  {userProfile.currentStatus.length > 0 ? userProfile.currentStatus.join(', ') : '설정되지 않음'}
                </p>
              </div>
              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400">목표 직무</label>
                <p className="text-sm text-gray-900 dark:text-white">
                  {userProfile.targetRoles.length > 0 ? userProfile.targetRoles.join(', ') : '설정되지 않음'}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full mt-2"
                onClick={() => window.location.hash = '#settings'}
              >
                <Edit2 className="w-3 h-3 mr-1" />
                정보 수정
              </Button>
            </div>
          </Card>
        </div>

        {/* AI 기능 */}
        <div className="mb-8">
          <h3 className="text-sm text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-600" />
            AI 기능
          </h3>
          <div className="space-y-2">
            {[
              { icon: FileText, label: '포트폴리오 작성', gradient: 'from-blue-500 to-cyan-500' },
              { icon: MessageSquare, label: '자기소개서 작성', gradient: 'from-purple-500 to-pink-500' },
              { icon: BarChart3, label: '역량 분석', gradient: 'from-orange-500 to-red-500' },
              { icon: TrendingUp, label: '학습 계획', gradient: 'from-green-500 to-emerald-500' },
              { icon: Briefcase, label: '목표 직무 제안', gradient: 'from-pink-500 to-rose-500' },
            ].map((item, index) => (
              <Button
                key={index}
                variant="outline"
                className="w-full justify-start gap-3 h-auto py-3"
                onClick={() => handleAIFeature(item.label)}
              >
                <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${item.gradient} flex items-center justify-center`}>
                  <item.icon className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm">{item.label}</span>
              </Button>
            ))}
          </div>
        </div>

        {/* 추천 질문 */}
        <div className="mb-8">
          <h3 className="text-sm text-gray-900 dark:text-white mb-4">추천 질문</h3>
          <div className="space-y-2">
            {suggestedPrompts.map((prompt, index) => (
              <Button
                key={index}
                variant="ghost"
                className="w-full justify-start text-left h-auto py-3 px-3"
                onClick={() => setInputValue(prompt)}
              >
                <span className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                  {prompt}
                </span>
              </Button>
            ))}
          </div>
        </div>

        {/* 선택된 프로젝트 정보 */}
        {selectedProject && (
          <div>
            <h3 className="text-sm text-gray-900 dark:text-white mb-4">선택된 프로젝트</h3>
            <Card className="p-4">
              <div className="flex items-start gap-3 mb-3">
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${selectedProject.gradient} flex items-center justify-center flex-shrink-0`}>
                  <selectedProject.icon className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm text-gray-900 dark:text-white mb-1">
                    {selectedProject.title}
                  </h4>
                  <Badge variant="outline" className="text-xs">
                    {selectedProject.category}
                  </Badge>
                </div>
              </div>
              <div className="space-y-2 text-xs">
                {selectedProject.period && (
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">기간:</span>
                    <span className="text-gray-900 dark:text-white ml-2">
                      {selectedProject.period}
                    </span>
                  </div>
                )}
                {selectedProject.role && (
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">역할:</span>
                    <span className="text-gray-900 dark:text-white ml-2">
                      {selectedProject.role}
                    </span>
                  </div>
                )}
                {selectedProject.sourceUrl && (
                  <div>
                    <a
                      href={selectedProject.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline flex items-center gap-1"
                    >
                      <ExternalLink className="w-3 h-3" />
                      원본 보기
                    </a>
                  </div>
                )}
              </div>
              
              {/* 데모 대화 시작 버튼 (10월 페이백 이벤트 캠페인 전용) */}
              {selectedProject.id === 1 && (
                <Button
                  onClick={startDemoConversation}
                  disabled={isDemoRunning}
                  className="w-full mt-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  {isDemoRunning ? '데모 진행 중...' : '데모 대화 시작'}
                </Button>
              )}
            </Card>
          </div>
        )}
      </div>

      {/* 프로젝트 등록 다이얼로그 */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>프로젝트 등록</DialogTitle>
            <DialogDescription>
              프로젝트를 등록할 방법을 선택하세요
            </DialogDescription>
          </DialogHeader>
          
          {!uploadType ? (
            <div className="grid grid-cols-3 gap-4 py-4">
              <Button
                variant="outline"
                className="h-auto py-6 flex flex-col gap-2"
                onClick={() => setUploadType('image')}
              >
                <Upload className="w-8 h-8" />
                <span className="text-sm">이미지</span>
              </Button>
              <Button
                variant="outline"
                className="h-auto py-6 flex flex-col gap-2"
                onClick={() => setUploadType('document')}
              >
                <FileText className="w-8 h-8" />
                <span className="text-sm">문서</span>
              </Button>
              <Button
                variant="outline"
                className="h-auto py-6 flex flex-col gap-2"
                onClick={() => setUploadType('pdf')}
              >
                <FileText className="w-8 h-8" />
                <span className="text-sm">PDF</span>
              </Button>
              <Button
                variant="outline"
                className="h-auto py-6 flex flex-col gap-2 col-span-3"
                onClick={() => setUploadType('link')}
              >
                <Link2 className="w-8 h-8" />
                <span className="text-sm">링크</span>
              </Button>
              <Button
                variant="outline"
                className="h-auto py-6 flex flex-col gap-2 col-span-3"
                onClick={() => setUploadType('text')}
              >
                <FileText className="w-8 h-8" />
                <span className="text-sm">텍스트</span>
              </Button>
            </div>
          ) : uploadType === 'link' ? (
            <div className="space-y-4 py-4">
              <div>
                <label className="text-sm mb-2 block">링크 URL</label>
                <Input
                  placeholder="https://..."
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setUploadType(null)} className="flex-1">
                  뒤로
                </Button>
                <Button onClick={handleLinkUpload} className="flex-1">
                  등록
                </Button>
              </div>
            </div>
          ) : uploadType === 'text' ? (
            <div className="space-y-4 py-4">
              <div>
                <label className="text-sm mb-2 block">프로젝트 제목</label>
                <Input
                  value={textTitle}
                  onChange={(e) => setTextTitle(e.target.value)}
                  placeholder="프로젝트 제목"
                />
              </div>
              <div>
                <label className="text-sm mb-2 block">프로젝트 내용</label>
                <Textarea
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder="프로젝트 내용"
                  rows={4}
                />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setUploadType(null)} className="flex-1">
                  뒤로
                </Button>
                <Button onClick={handleTextUpload} className="flex-1">
                  등록
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4 py-4">
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
                <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  파일을 드래그하거나 클릭하여 업로드하세요
                </p>
                <input
                  type="file"
                  id="file-upload"
                  className="hidden"
                  accept={
                    uploadType === 'image' ? 'image/*' :
                    uploadType === 'pdf' ? '.pdf' :
                    '.doc,.docx,.txt'
                  }
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file);
                  }}
                />
                <Button onClick={() => document.getElementById('file-upload')?.click()}>
                  파일 선택
                </Button>
              </div>
              <Button variant="outline" onClick={() => setUploadType(null)} className="w-full">
                뒤로
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 프로젝트 편집 다이얼로그 */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>프로젝트 편집</DialogTitle>
            <DialogDescription>
              프로젝트 정보를 수정하세요
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm mb-2 block">프로젝트 제목</label>
              <Input
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                placeholder="프로젝트 제목"
              />
            </div>

            <div>
              <label className="text-sm mb-2 block">카테고리</label>
              <Select value={editedCategory} onValueChange={setEditedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="카테고리 선택" />
                </SelectTrigger>
                <SelectContent>
                  {getAvailableCategories().map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm mb-2 block">태그 (쉼표로 구분)</label>
              <Input
                value={editedTags}
                onChange={(e) => setEditedTags(e.target.value)}
                placeholder="예: React, TypeScript, 디자인"
              />
            </div>

            <div>
              <label className="text-sm mb-2 block">요약</label>
              <Textarea
                value={editedSummary}
                onChange={(e) => setEditedSummary(e.target.value)}
                placeholder="프로젝트 요약"
                rows={3}
              />
            </div>

            <div>
              <label className="text-sm mb-2 block">프로젝트 기간</label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">시작일</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {editedStartDate ? formatDate(editedStartDate) : '선택'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <YearMonthPicker 
                        date={editedStartDate} 
                        onDateChange={setEditedStartDate}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div>
                  <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">종료일</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {editedEndDate ? formatDate(editedEndDate) : '진행중'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <YearMonthPicker 
                        date={editedEndDate} 
                        onDateChange={setEditedEndDate}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>

            <Button 
              variant="outline" 
              className="w-full bg-gradient-to-r from-purple-50 to-blue-50 hover:from-purple-100 hover:to-blue-100 dark:from-purple-950 dark:to-blue-950 border-purple-200 dark:border-purple-800"
              onClick={handleOrganizeWithAI}
            >
              <Bot className="w-4 h-4 mr-2" />
              AI와 대화를 통해 프로젝트 정리하기
            </Button>

            <div>
              <label className="text-sm mb-2 block">내 역할</label>
              <Input
                value={editedRole}
                onChange={(e) => setEditedRole(e.target.value)}
                placeholder="예: 프론트엔드 개발, 팀 리더"
              />
            </div>

            <div>
              <label className="text-sm mb-2 block">주요 성과</label>
              <Textarea
                value={editedAchievements}
                onChange={(e) => setEditedAchievements(e.target.value)}
                placeholder="프로젝에서 달성한 주요 성과를 작성하세요"
                rows={3}
              />
            </div>

            <div>
              <label className="text-sm mb-2 block">사용 기술/도구</label>
              <Input
                value={editedTools}
                onChange={(e) => setEditedTools(e.target.value)}
                placeholder="예: React, Figma, Google Analytics"
              />
            </div>

            <div>
              <label className="text-sm mb-2 block">상세 설명</label>
              <Textarea
                value={editedDescription}
                onChange={(e) => setEditedDescription(e.target.value)}
                placeholder="프로젝트에 대한 상세 설명"
                rows={4}
              />
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setEditDialogOpen(false)} className="flex-1">
                취소
              </Button>
              <Button onClick={handleSaveProject} className="flex-1">
                저장
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* AI 기능 프로젝트 선택 다이얼로그 */}
      <Dialog open={projectSelectDialogOpen} onOpenChange={setProjectSelectDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedFeature}</DialogTitle>
            <DialogDescription>
              분석할 프로젝트를 선택하세요 (최대 3개)
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-3 py-4">
            {projects.map((project) => {
              const Icon = project.icon;
              const isSelected = selectedProjectsForFeature.includes(project.id);
              
              return (
                <Card
                  key={project.id}
                  className={`p-4 cursor-pointer transition-all ${
                    isSelected
                      ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-950'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                  onClick={() => toggleProjectSelection(project.id)}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${project.gradient} flex items-center justify-center flex-shrink-0`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-sm text-gray-900 dark:text-white">
                          {project.title}
                        </h4>
                        {isSelected && (
                          <Check className="w-4 h-4 text-blue-600" />
                        )}
                      </div>
                      <Badge variant="outline" className="text-xs mb-2">
                        {project.category}
                      </Badge>
                      <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                        {project.summary}
                      </p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setProjectSelectDialogOpen(false)} className="flex-1">
              취소
            </Button>
            <Button onClick={handleConfirmAIFeature} className="flex-1" disabled={selectedProjectsForFeature.length === 0}>
              실행 ({selectedProjectsForFeature.length}/3)
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 분석 중 로딩 */}
      {isAnalyzing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="p-8">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
              <p className="text-gray-900 dark:text-white">AI가 프로젝트를 분석하고 있습니다...</p>
            </div>
          </Card>
        </div>
      )}

      {/* 프로젝트 상세 정보 다이얼로그 */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>프로젝트 상세 정보</DialogTitle>
            <DialogDescription>
              저장된 프로젝트 정보를 확인하세요
            </DialogDescription>
          </DialogHeader>

          {viewingProject && (
            <div className="space-y-4 py-4">
              {/* 프로젝트 헤더 */}
              <div className="flex items-start gap-4 pb-4 border-b border-gray-200 dark:border-gray-700">
                <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${viewingProject.gradient} flex items-center justify-center flex-shrink-0`}>
                  <viewingProject.icon className="w-8 h-8 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-gray-900 dark:text-white mb-2">{viewingProject.title}</h3>
                  <Badge variant="outline" className="mb-2">{viewingProject.category}</Badge>
                  <div className="flex flex-wrap gap-1">
                    {viewingProject.tags.map((tag, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              {/* 기본 정보 */}
              <div className="space-y-3">
                {viewingProject.period && (
                  <div>
                    <label className="text-sm text-gray-500 dark:text-gray-400 block mb-1">프로젝트 기간</label>
                    <p className="text-sm text-gray-900 dark:text-white">{viewingProject.period}</p>
                  </div>
                )}

                <div>
                  <label className="text-sm text-gray-500 dark:text-gray-400 block mb-1">요약</label>
                  <p className="text-sm text-gray-900 dark:text-white">{viewingProject.summary}</p>
                </div>

                {viewingProject.role && (
                  <div>
                    <label className="text-sm text-gray-500 dark:text-gray-400 block mb-1">내 역할</label>
                    <p className="text-sm text-gray-900 dark:text-white">{viewingProject.role}</p>
                  </div>
                )}

                {viewingProject.achievements && (
                  <div>
                    <label className="text-sm text-gray-500 dark:text-gray-400 block mb-1">주요 성과</label>
                    <p className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap">{viewingProject.achievements}</p>
                  </div>
                )}

                {viewingProject.tools && (
                  <div>
                    <label className="text-sm text-gray-500 dark:text-gray-400 block mb-1">사용 기술/도구</label>
                    <p className="text-sm text-gray-900 dark:text-white">{viewingProject.tools}</p>
                  </div>
                )}

                {viewingProject.description && (
                  <div>
                    <label className="text-sm text-gray-500 dark:text-gray-400 block mb-1">상세 설명</label>
                    <p className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap">{viewingProject.description}</p>
                  </div>
                )}

                {viewingProject.sourceUrl && (
                  <div>
                    <label className="text-sm text-gray-500 dark:text-gray-400 block mb-1">원본 링크</label>
                    <a
                      href={viewingProject.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                    >
                      <ExternalLink className="w-3 h-3" />
                      {viewingProject.sourceUrl}
                    </a>
                  </div>
                )}
              </div>

              {/* 액션 버튼 */}
              <div className="flex gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button
                  variant="outline"
                  onClick={() => {
                    setDetailDialogOpen(false);
                    openEditDialog(viewingProject);
                  }}
                  className="flex-1"
                >
                  <Edit2 className="w-4 h-4 mr-2" />
                  편집
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 프로젝트 불러오기 다이얼로그 */}
      <Dialog open={loadProjectDialogOpen} onOpenChange={setLoadProjectDialogOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>프로젝트 불러오기</DialogTitle>
            <DialogDescription>
              Nexter에서 대화할 프로젝트를 선택하세요 (최대 5개)
            </DialogDescription>
          </DialogHeader>

          {selectedProjectsToLoad.length > 0 && (
            <div className="px-1 py-2">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {selectedProjectsToLoad.length}개 선택됨
              </p>
            </div>
          )}

          <div className="overflow-y-auto flex-1 min-h-0">
            {projects.length === 0 ? (
            <div className="text-center py-12">
              <Upload className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                저장된 프로젝트가 없습니다
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500">
                먼저 프로젝트를 추가해주세요
              </p>
            </div>
          ) : (
            <Tabs defaultValue="all" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="all">전체 ({projects.length})</TabsTrigger>
                <TabsTrigger value="marketing">
                  마케팅 ({projects.filter(p => ['브랜드 마케팅', 'SNS 마케팅', '콘텐츠 마케팅', '퍼포먼스 마케팅', 'UI/UX 디자인', '그래픽 디자인'].includes(p.category)).length})
                </TabsTrigger>
                <TabsTrigger value="development">
                  개발 ({projects.filter(p => ['프론트엔드', '백엔드', '풀스택', '데이터 분석', 'AI/ML', '모바일 앱'].includes(p.category)).length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="space-y-3 mt-4">
                {projects.map((project) => {
                  const Icon = project.icon;
                  const isSelected = selectedProjectsToLoad.includes(project.id);
                  
                  return (
                    <Card
                      key={project.id}
                      className={`p-4 cursor-pointer transition-all hover:bg-gray-50 dark:hover:bg-gray-700 hover:shadow-md ${
                        isSelected ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20' : ''
                      }`}
                      onClick={() => toggleProjectToLoad(project.id)}
                    >
                      <div className="flex items-start gap-3">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleProjectToLoad(project.id)}
                          onClick={(event: MouseEvent<HTMLButtonElement>) => event.stopPropagation()}
                        />
                        <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${project.gradient} flex items-center justify-center flex-shrink-0`}>
                          <Icon className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm text-gray-900 dark:text-white mb-1">
                            {project.title}
                          </h4>
                          <Badge variant="outline" className="text-xs mb-2">
                            {project.category}
                          </Badge>
                          <div className="flex flex-wrap gap-1 mb-2">
                            {project.tags.slice(0, 3).map((tag, i) => (
                              <Badge key={i} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                            {project.tags.length > 3 && (
                              <Badge variant="secondary" className="text-xs">
                                +{project.tags.length - 3}
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                            {project.summary}
                          </p>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </TabsContent>

              <TabsContent value="marketing" className="space-y-3 mt-4">
                {projects.filter(p => ['브랜드 마케팅', 'SNS 마케팅', '콘텐츠 마케팅', '퍼포먼스 마케팅', 'UI/UX 디자인', '그래픽 디자인'].includes(p.category)).length === 0 ? (
                  <div className="text-center py-12">
                    <Megaphone className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      마케팅 프로젝트가 없습니다
                    </p>
                  </div>
                ) : (
                  projects.filter(p => ['브랜드 마케팅', 'SNS 마케팅', '콘텐츠 마케팅', '퍼포먼스 마케팅', 'UI/UX 디자인', '그래픽 디자인'].includes(p.category)).map((project) => {
                    const Icon = project.icon;
                    const isSelected = selectedProjectsToLoad.includes(project.id);
                    
                    return (
                      <Card
                        key={project.id}
                        className={`p-4 cursor-pointer transition-all hover:bg-gray-50 dark:hover:bg-gray-700 hover:shadow-md ${
                          isSelected ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20' : ''
                        }`}
                        onClick={() => toggleProjectToLoad(project.id)}
                      >
                        <div className="flex items-start gap-3">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => toggleProjectToLoad(project.id)}
                            onClick={(event: MouseEvent<HTMLButtonElement>) => event.stopPropagation()}
                          />
                          <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${project.gradient} flex items-center justify-center flex-shrink-0`}>
                            <Icon className="w-5 h-5 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm text-gray-900 dark:text-white mb-1">
                              {project.title}
                            </h4>
                            <Badge variant="outline" className="text-xs mb-2">
                              {project.category}
                            </Badge>
                            <div className="flex flex-wrap gap-1 mb-2">
                              {project.tags.slice(0, 3).map((tag, i) => (
                                <Badge key={i} variant="secondary" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                              {project.tags.length > 3 && (
                                <Badge variant="secondary" className="text-xs">
                                  +{project.tags.length - 3}
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                              {project.summary}
                            </p>
                          </div>
                        </div>
                      </Card>
                    );
                  })
                )}
              </TabsContent>

              <TabsContent value="development" className="space-y-3 mt-4">
                {projects.filter(p => ['프론트엔드', '백엔드', '풀스택', '데이터 분석', 'AI/ML', '모바일 앱'].includes(p.category)).length === 0 ? (
                  <div className="text-center py-12">
                    <Code className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      개발 프로젝트가 없습니다
                    </p>
                  </div>
                ) : (
                  projects.filter(p => ['프론트엔드', '백엔드', '풀스택', '데이터 분석', 'AI/ML', '모바일 앱'].includes(p.category)).map((project) => {
                    const Icon = project.icon;
                    const isSelected = selectedProjectsToLoad.includes(project.id);
                    
                    return (
                      <Card
                        key={project.id}
                        className={`p-4 cursor-pointer transition-all hover:bg-gray-50 dark:hover:bg-gray-700 hover:shadow-md ${
                          isSelected ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20' : ''
                        }`}
                        onClick={() => toggleProjectToLoad(project.id)}
                      >
                        <div className="flex items-start gap-3">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => toggleProjectToLoad(project.id)}
                            onClick={(event: MouseEvent<HTMLButtonElement>) => event.stopPropagation()}
                          />
                          <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${project.gradient} flex items-center justify-center flex-shrink-0`}>
                            <Icon className="w-5 h-5 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm text-gray-900 dark:text-white mb-1">
                              {project.title}
                            </h4>
                            <Badge variant="outline" className="text-xs mb-2">
                              {project.category}
                            </Badge>
                            <div className="flex flex-wrap gap-1 mb-2">
                              {project.tags.slice(0, 3).map((tag, i) => (
                                <Badge key={i} variant="secondary" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                              {project.tags.length > 3 && (
                                <Badge variant="secondary" className="text-xs">
                                  +{project.tags.length - 3}
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                              {project.summary}
                            </p>
                          </div>
                        </div>
                      </Card>
                    );
                  })
                )}
              </TabsContent>
            </Tabs>
          )}
          </div>

          <div className="flex gap-2 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button 
              variant="outline" 
              onClick={() => {
                setLoadProjectDialogOpen(false);
                setSelectedProjectsToLoad([]);
              }} 
              className="w-full"
            >
              취소
            </Button>
            <Button 
              onClick={handleLoadSelectedProjects}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              disabled={selectedProjectsToLoad.length === 0}
            >
              불러오기 ({selectedProjectsToLoad.length})
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}