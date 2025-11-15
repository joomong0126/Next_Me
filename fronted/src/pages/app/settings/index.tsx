import { useState, useRef, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/shadcn/card';
import { Button } from '@/shared/ui/shadcn/button';
import { Input } from '@/shared/ui/shadcn/input';
import { Label } from '@/shared/ui/shadcn/label';
import { Textarea } from '@/shared/ui/shadcn/textarea';
import { Switch } from '@/shared/ui/shadcn/switch';
import { Separator } from '@/shared/ui/shadcn/separator';
import { Badge } from '@/shared/ui/shadcn/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/shadcn/avatar';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/shared/ui/shadcn/dialog';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/shared/ui/shadcn/accordion';
import { Checkbox } from '@/shared/ui/shadcn/checkbox';
import { ScrollArea } from '@/shared/ui/shadcn/scroll-area';
import { Calendar as CalendarComponent } from '@/shared/ui/shadcn/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/shadcn/popover';
import {
  User,
  Briefcase,
  Cloud,
  Download,
  Palette,
  Bell,
  Shield,
  Trash2,
  Check,
  Plus,
  Edit2,
  Users,
  Trophy,
  Award,
  Calendar,
  Building,
  MapPin,
  FileText,
  Target,
  Code,
  FolderKanban,
  X,
  GraduationCap,
  LogOut,
} from 'lucide-react';
import { themes } from '@/shared/lib/themes';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import type { AppOutletContext } from '../types';
import { api } from '@/shared/api';
import { useNavigate } from 'react-router-dom';

interface WorkExperience {
  id: number;
  company: string;
  position: string;
  period: string;
  location: string;
  description: string;
  achievements: string[];
  skills: string[];
}

interface Activity {
  id: number;
  name: string;
  organization: string;
  period: string;
  role: string;
  description: string;
  skills: string[];
}

interface Competition {
  id: number;
  name: string;
  organizer: string;
  date: string;
  result: string;
  description: string;
  skills: string[];
}

interface AwardItem {
  id: number;
  name: string;
  organizer: string;
  date: string;
  description: string;
}

interface Certificate {
  id: number;
  name: string;
  issuer: string;
  date: string;
  certificateNumber?: string;
}

type EditMode = 'experience' | 'activity' | 'competition' | 'award' | 'certificate' | 'status' | 'role' | 'skill';

interface PDFExportOptions {
  includeBasicInfo: boolean;
  includeCareerGoals: boolean;
  includeSkills: boolean;
  includeExperiences: boolean;
  includeActivities: boolean;
  includeCompetitions: boolean;
  includeAwards: boolean;
  includeCertificates: boolean;
}

export default function SettingsPage() {
  const {
    themeName,
    setThemeName,
    darkMode,
    toggleDarkMode,
    handleLogout,
    projects,
  } = useOutletContext<AppOutletContext>();
  const [experiences, setExperiences] = useState<WorkExperience[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [awards, setAwards] = useState<AwardItem[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [currentStatus, setCurrentStatus] = useState<string[]>(['직장인']);
  const [targetRoles, setTargetRoles] = useState<string[]>(['마케팅', '기획']);
  const [techStack, setTechStack] = useState<string[]>(['Google Analytics', 'Figma', 'Notion', 'Photoshop']);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPdfDialogOpen, setIsPdfDialogOpen] = useState(false);
  const [isProjectDialogOpen, setIsProjectDialogOpen] = useState(false);
  const [isProjectImportDialogOpen, setIsProjectImportDialogOpen] = useState(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [isDeleteAccountDialogOpen, setIsDeleteAccountDialogOpen] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const navigate = useNavigate();
  const [importTargetSection, setImportTargetSection] = useState<'experience' | 'activity' | 'competition' | 'award' | null>(null);
  const [selectedProjectIds, setSelectedProjectIds] = useState<number[]>([]);
  const [editMode, setEditMode] = useState<EditMode | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<any>({});

  // Mock 프로젝트 데이터 (실제로는 ProjectsPage에서 공유하거나 API로 가져옴)
  const [registeredProjects] = useState([
    {
      id: 1,
      title: '신규 앱 런칭 캠페인',
      description: '모바일 앱 출시를 위한 통합 마케팅 전략 수립 및 실행',
      achievements: [
        '첫 달 다운로드 10만 건 달성',
        '광고 ROI 250% 달성',
        '앱스토어 주요 카테고리 TOP 10 진입'
      ]
    },
    {
      id: 2,
      title: 'SNS 마케팅 전략 리뉴얼',
      description: '인스타그램 및 페이스북 ���널 개선',
      achievements: [
        '팔로워 300% 증가',
        '참여율 150% 향상',
        '월간 리치 500만 달성'
      ]
    },
    {
      id: 3,
      title: '브랜드 리포지셔닝 프로젝트',
      description: '브랜드 아이덴티티 재정립 및 타겟 고객층 확대',
      achievements: [
        '브랜드 인지도 40% 상승',
        '신규 고객층 유입 200% 증가',
        '브랜드 선호도 1위 달성'
      ]
    },
    {
      id: 4,
      title: '데이터 기반 고객 분석 시스템 구축',
      description: 'GA4 및 빅데이터 분석 도구를 활용한 인사이트 도출',
      achievements: [
        '고객 이탈률 30% 감소',
        '타겟 마케팅 정확도 85% 향상',
        '마케팅 비용 20% 절감'
      ]
    },
  ]);

  const [pdfOptions, setPdfOptions] = useState<PDFExportOptions>({
    includeBasicInfo: true,
    includeCareerGoals: true,
    includeSkills: true,
    includeExperiences: true,
    includeActivities: true,
    includeCompetitions: true,
    includeAwards: true,
    includeCertificates: true,
  });

  const pdfRef = useRef<HTMLDivElement>(null);

  // localStorage에 커리어 정보 저장
  useEffect(() => {
    const careerData = {
      experiences,
      activities,
      competitions,
      awards,
      certificates,
      currentStatus,
      targetRoles,
      techStack,
    };
    localStorage.setItem('careerData', JSON.stringify(careerData));
  }, [experiences, activities, competitions, awards, certificates, currentStatus, targetRoles, techStack]);

  // 컴포넌트 마운트 시 localStorage에서 데이터 불러오기
  useEffect(() => {
    // 온보딩에서 입력한 사용자 프로필 정보 가져오기
    const userProfile = localStorage.getItem('userProfile');
    if (userProfile) {
      const profile = JSON.parse(userProfile);
      // 온보딩 정보로 초기화
      if (profile.status && profile.status.length > 0) {
        setCurrentStatus(profile.status);
      }
      if (profile.goals && profile.goals.length > 0) {
        setTargetRoles(profile.goals);
      }
      if (profile.skills && profile.skills.length > 0) {
        setTechStack(profile.skills);
      }
    }

    // 저장된 커리어 데이터 불러오기 (온보딩 정보보다 우선)
    const savedData = localStorage.getItem('careerData');
    if (savedData) {
      const data = JSON.parse(savedData);
      if (data.experiences) setExperiences(data.experiences);
      if (data.activities) setActivities(data.activities);
      if (data.competitions) setCompetitions(data.competitions);
      if (data.awards) setAwards(data.awards);
      if (data.certificates) setCertificates(data.certificates);
      if (data.currentStatus) setCurrentStatus(data.currentStatus);
      if (data.targetRoles) setTargetRoles(data.targetRoles);
      if (data.techStack) setTechStack(data.techStack);
    }
  }, []);

  const openAddDialog = (mode: EditMode) => {
    setEditMode(mode);
    setEditingId(null);
    setFormData({});
    setIsDialogOpen(true);
  };

  const openEditDialog = (mode: EditMode, id: number, data: any) => {
    setEditMode(mode);
    setEditingId(id);
    
    // 기존 데이터의 period/date를 파싱하여 startDate, endDate로 변환
    if (mode === 'experience' || mode === 'activity') {
      const period = data.period || '';
      const isCurrent = period.includes('현재');
      let startDate = '';
      let endDate = '';
      
      if (period) {
        const parts = period.split(' - ');
        if (parts[0]) {
          try {
            const [year, month] = parts[0].split('.');
            startDate = new Date(parseInt(year), parseInt(month) - 1, 1).toISOString();
          } catch (e) {}
        }
        if (parts[1] && !isCurrent) {
          try {
            const [year, month] = parts[1].split('.');
            endDate = new Date(parseInt(year), parseInt(month) - 1, 1).toISOString();
          } catch (e) {}
        }
      }
      
      setFormData({ ...data, startDate, endDate, isCurrent });
    } else if (mode === 'competition' || mode === 'award' || mode === 'certificate') {
      const dateStr = data.date || '';
      let date = '';
      
      if (dateStr) {
        try {
          const [year, month] = dateStr.split('.');
          date = new Date(parseInt(year), parseInt(month) - 1, 1).toISOString();
        } catch (e) {}
      }
      
      setFormData({ ...data, date });
    } else {
      setFormData(data);
    }
    
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (editMode === 'experience') {
      const periodText = formData.startDate && formData.endDate 
        ? `${format(new Date(formData.startDate), 'yyyy.MM', { locale: ko })} - ${format(new Date(formData.endDate), 'yyyy.MM', { locale: ko })}`
        : formData.startDate && formData.isCurrent
        ? `${format(new Date(formData.startDate), 'yyyy.MM', { locale: ko })} - 현재`
        : formData.startDate
        ? format(new Date(formData.startDate), 'yyyy.MM', { locale: ko })
        : '';
      
      const savedData = { ...formData, period: periodText };
      if (editingId) {
        setExperiences(experiences.map(exp => 
          exp.id === editingId ? { ...savedData, id: editingId } : exp
        ));
      } else {
        setExperiences([...experiences, { ...savedData, id: Date.now() }]);
      }
    } else if (editMode === 'activity') {
      const periodText = formData.startDate && formData.endDate 
        ? `${format(new Date(formData.startDate), 'yyyy.MM', { locale: ko })} - ${format(new Date(formData.endDate), 'yyyy.MM', { locale: ko })}`
        : formData.startDate && formData.isCurrent
        ? `${format(new Date(formData.startDate), 'yyyy.MM', { locale: ko })} - 현재`
        : formData.startDate
        ? format(new Date(formData.startDate), 'yyyy.MM', { locale: ko })
        : '';
      
      const savedData = { ...formData, period: periodText };
      if (editingId) {
        setActivities(activities.map(act => 
          act.id === editingId ? { ...savedData, id: editingId } : act
        ));
      } else {
        setActivities([...activities, { ...savedData, id: Date.now() }]);
      }
    } else if (editMode === 'competition') {
      const dateText = formData.date ? format(new Date(formData.date), 'yyyy.MM', { locale: ko }) : '';
      const savedData = { ...formData, date: dateText };
      if (editingId) {
        setCompetitions(competitions.map(comp => 
          comp.id === editingId ? { ...savedData, id: editingId } : comp
        ));
      } else {
        setCompetitions([...competitions, { ...savedData, id: Date.now() }]);
      }
    } else if (editMode === 'award') {
      const dateText = formData.date ? format(new Date(formData.date), 'yyyy.MM', { locale: ko }) : '';
      const savedData = { ...formData, date: dateText };
      if (editingId) {
        setAwards(awards.map(award => 
          award.id === editingId ? { ...savedData, id: editingId } : award
        ));
      } else {
        setAwards([...awards, { ...savedData, id: Date.now() }]);
      }
    } else if (editMode === 'certificate') {
      const dateText = formData.date ? format(new Date(formData.date), 'yyyy.MM', { locale: ko }) : '';
      const savedData = { ...formData, date: dateText };
      if (editingId) {
        setCertificates(certificates.map(cert => 
          cert.id === editingId ? { ...savedData, id: editingId } : cert
        ));
      } else {
        setCertificates([...certificates, { ...savedData, id: Date.now() }]);
      }
    } else if (editMode === 'status') {
      if (formData.value && formData.value.trim()) {
        setCurrentStatus([...currentStatus, formData.value.trim()]);
      }
    } else if (editMode === 'role') {
      if (formData.value && formData.value.trim()) {
        setTargetRoles([...targetRoles, formData.value.trim()]);
      }
    } else if (editMode === 'skill') {
      if (formData.value && formData.value.trim()) {
        setTechStack([...techStack, formData.value.trim()]);
      }
    }
    setIsDialogOpen(false);
  };

  const handleDelete = (mode: EditMode, id: number | string) => {
    if (confirm('정말 삭제하시겠습니까?')) {
      if (mode === 'experience') {
        setExperiences(experiences.filter(exp => exp.id !== id));
      } else if (mode === 'activity') {
        setActivities(activities.filter(act => act.id !== id));
      } else if (mode === 'competition') {
        setCompetitions(competitions.filter(comp => comp.id !== id));
      } else if (mode === 'award') {
        setAwards(awards.filter(award => award.id !== id));
      } else if (mode === 'certificate') {
        setCertificates(certificates.filter(cert => cert.id !== id));
      } else if (mode === 'status') {
        setCurrentStatus(currentStatus.filter(s => s !== id));
      } else if (mode === 'role') {
        setTargetRoles(targetRoles.filter(r => r !== id));
      } else if (mode === 'skill') {
        setTechStack(techStack.filter(s => s !== id));
      }
    }
  };

  // 프로젝트 불러오기 다이얼로그 열기
  const openProjectImportDialog = (section: 'experience' | 'activity' | 'competition' | 'award') => {
    setImportTargetSection(section);
    setSelectedProjectIds([]);
    setIsProjectImportDialogOpen(true);
  };

  // 프로젝트 선택 토글
  const toggleProjectSelection = (projectId: number) => {
    if (selectedProjectIds.includes(projectId)) {
      setSelectedProjectIds(selectedProjectIds.filter(id => id !== projectId));
    } else {
      setSelectedProjectIds([...selectedProjectIds, projectId]);
    }
  };

  // 선택한 프로젝트를 해당 섹션으로 변환
  const handleImportProjects = () => {
    if (selectedProjectIds.length === 0) {
      alert('프로젝트를 선택해주세요');
      return;
    }

    const selectedProjects = projects.filter(p => selectedProjectIds.includes(p.id));

    selectedProjects.forEach(project => {
      const newId = Date.now() + Math.random();

      if (importTargetSection === 'experience') {
        const newExperience: WorkExperience = {
          id: newId,
          company: project.title,
          position: project.role || '담당자',
          period: project.period || '기간 미정',
          location: '위치 미정',
          description: project.summary || project.description || '',
          achievements: project.achievements ? [project.achievements] : [],
          skills: project.tags || [],
        };
        setExperiences([...experiences, newExperience]);
      } else if (importTargetSection === 'activity') {
        const newActivity: Activity = {
          id: newId,
          name: project.title,
          organization: '조직명 미정',
          period: project.period || '기간 미정',
          role: project.role || '참여자',
          description: project.summary || project.description || '',
          skills: project.tags || [],
        };
        setActivities([...activities, newActivity]);
      } else if (importTargetSection === 'competition') {
        const newCompetition: Competition = {
          id: newId,
          name: project.title,
          organizer: '주최자 미정',
          date: project.period || '날짜 미정',
          result: '참가',
          description: project.summary || project.description || '',
          skills: project.tags || [],
        };
        setCompetitions([...competitions, newCompetition]);
      } else if (importTargetSection === 'award') {
        const newAward: AwardItem = {
          id: newId,
          name: project.title,
          organizer: '주최자 미정',
          date: project.period || '날짜 미정',
          description: project.summary || project.description || '',
        };
        setAwards([...awards, newAward]);
      }
    });

    setIsProjectImportDialogOpen(false);
    setSelectedProjectIds([]);
    alert(`${selectedProjects.length}개의 프로젝트를 불러왔습니다`);
  };

  const handleExportPDF = async () => {
    // Using jspdf and html2canvas
    const { jsPDF } = await import('jspdf');
    const html2canvas = (await import('html2canvas')).default;

    // Create a temporary container for PDF content
    const pdfContent = document.createElement('div');
    pdfContent.style.position = 'absolute';
    pdfContent.style.left = '-9999px';
    pdfContent.style.width = '210mm'; // A4 width
    pdfContent.style.padding = '20mm';
    pdfContent.style.backgroundColor = 'white';
    pdfContent.style.fontFamily = 'Arial, sans-serif';

    // Build PDF content
    let html = `
      <div style="max-width: 170mm;">
        <h1 style="font-size: 28px; margin-bottom: 10px; color: #1f2937;">이력서</h1>
        <p style="font-size: 14px; color: #6b7280; margin-bottom: 30px;">예진님의 커리어 정보</p>
    `;

    // Add basic info
    if (pdfOptions.includeBasicInfo) {
      html += `
        <h2 style="font-size: 20px; margin-top: 30px; margin-bottom: 15px; color: #1f2937; border-bottom: 2px solid #1f2937; padding-bottom: 5px;">기본 정보</h2>
        <p style="font-size: 14px; color: #374151; margin-bottom: 5px;"><strong>이름:</strong> 예진</p>
        <p style="font-size: 14px; color: #374151; margin-bottom: 5px;"><strong>이메일:</strong> yejin@example.com</p>
        <p style="font-size: 14px; color: #374151; margin-bottom: 5px;"><strong>소개:</strong> 데이터 기반 마케팅을 공부하는 마케터입니다</p>
      `;
    }

    // Add career goals
    if (pdfOptions.includeCareerGoals && (currentStatus.length > 0 || targetRoles.length > 0)) {
      html += `<h2 style="font-size: 20px; margin-top: 30px; margin-bottom: 15px; color: #1f2937; border-bottom: 2px solid #1f2937; padding-bottom: 5px;">커리어 목표</h2>`;
      
      if (currentStatus.length > 0) {
        html += `<p style="font-size: 14px; color: #374151; margin-bottom: 5px;"><strong>현재 상태:</strong> ${currentStatus.join(', ')}</p>`;
      }
      
      if (targetRoles.length > 0) {
        html += `<p style="font-size: 14px; color: #374151; margin-bottom: 5px;"><strong>목표 직무:</strong> ${targetRoles.join(', ')}</p>`;
      }
    }

    // Add skills
    if (pdfOptions.includeSkills && techStack.length > 0) {
      html += `
        <h2 style="font-size: 20px; margin-top: 30px; margin-bottom: 15px; color: #1f2937; border-bottom: 2px solid #1f2937; padding-bottom: 5px;">���술 스택</h2>
        <p style="font-size: 14px; color: #374151;">${techStack.join(' • ')}</p>
      `;
    }

    // Add experiences
    if (pdfOptions.includeExperiences && experiences.length > 0) {
      html += `
        <h2 style="font-size: 20px; margin-top: 30px; margin-bottom: 15px; color: #1f2937; border-bottom: 2px solid #1f2937; padding-bottom: 5px;">경력</h2>
      `;
      experiences.forEach(exp => {
        html += `
          <div style="margin-bottom: 20px;">
            <h3 style="font-size: 16px; margin-bottom: 5px; color: #1f2937;">${exp.position}</h3>
            <p style="font-size: 14px; color: #6b7280; margin-bottom: 5px;">
              <strong>${exp.company}</strong> | ${exp.period} | ${exp.location}
            </p>
            <p style="font-size: 14px; color: #374151; margin-bottom: 10px;">${exp.description}</p>
        `;
        
        if (exp.achievements && exp.achievements.length > 0) {
          html += `<p style="font-size: 13px; color: #1f2937; margin-bottom: 5px;"><strong>주요 성과:</strong></p><ul style="margin-left: 20px; margin-bottom: 10px;">`;
          exp.achievements.forEach(achievement => {
            html += `<li style="font-size: 13px; color: #374151; margin-bottom: 3px;">${achievement}</li>`;
          });
          html += `</ul>`;
        }
        
        if (exp.skills && exp.skills.length > 0) {
          html += `<p style="font-size: 13px; color: #6b7280;">스킬: ${exp.skills.join(', ')}</p>`;
        }
        
        html += `</div>`;
      });
    }

    // Add activities
    if (pdfOptions.includeActivities && activities.length > 0) {
      html += `
        <h2 style="font-size: 20px; margin-top: 30px; margin-bottom: 15px; color: #1f2937; border-bottom: 2px solid #1f2937; padding-bottom: 5px;">대외활동</h2>
      `;
      activities.forEach(activity => {
        html += `
          <div style="margin-bottom: 20px;">
            <h3 style="font-size: 16px; margin-bottom: 5px; color: #1f2937;">${activity.name}</h3>
            <p style="font-size: 14px; color: #6b7280; margin-bottom: 5px;">
              <strong>${activity.organization}</strong> | ${activity.period} | ${activity.role}
            </p>
            <p style="font-size: 14px; color: #374151; margin-bottom: 10px;">${activity.description}</p>
            ${activity.skills && activity.skills.length > 0 ? `<p style="font-size: 13px; color: #6b7280;">스킬: ${activity.skills.join(', ')}</p>` : ''}
          </div>
        `;
      });
    }

    // Add competitions
    if (pdfOptions.includeCompetitions && competitions.length > 0) {
      html += `
        <h2 style="font-size: 20px; margin-top: 30px; margin-bottom: 15px; color: #1f2937; border-bottom: 2px solid #1f2937; padding-bottom: 5px;">공모전</h2>
      `;
      competitions.forEach(comp => {
        html += `
          <div style="margin-bottom: 20px;">
            <h3 style="font-size: 16px; margin-bottom: 5px; color: #1f2937;">${comp.name} - ${comp.result}</h3>
            <p style="font-size: 14px; color: #6b7280; margin-bottom: 5px;">
              <strong>${comp.organizer}</strong> | ${comp.date}
            </p>
            <p style="font-size: 14px; color: #374151; margin-bottom: 10px;">${comp.description}</p>
            ${comp.skills && comp.skills.length > 0 ? `<p style="font-size: 13px; color: #6b7280;">스킬: ${comp.skills.join(', ')}</p>` : ''}
          </div>
        `;
      });
    }

    // Add awards
    if (pdfOptions.includeAwards && awards.length > 0) {
      html += `
        <h2 style="font-size: 20px; margin-top: 30px; margin-bottom: 15px; color: #1f2937; border-bottom: 2px solid #1f2937; padding-bottom: 5px;">수상내역</h2>
      `;
      awards.forEach(award => {
        html += `
          <div style="margin-bottom: 20px;">
            <h3 style="font-size: 16px; margin-bottom: 5px; color: #1f2937;">${award.name}</h3>
            <p style="font-size: 14px; color: #6b7280; margin-bottom: 5px;">
              <strong>${award.organizer}</strong> | ${award.date}
            </p>
            <p style="font-size: 14px; color: #374151;">${award.description}</p>
          </div>
        `;
      });
    }

    // Add certificates
    if (pdfOptions.includeCertificates && certificates.length > 0) {
      html += `
        <h2 style="font-size: 20px; margin-top: 30px; margin-bottom: 15px; color: #1f2937; border-bottom: 2px solid #1f2937; padding-bottom: 5px;">자격증</h2>
      `;
      certificates.forEach(cert => {
        html += `
          <div style="margin-bottom: 20px;">
            <h3 style="font-size: 16px; margin-bottom: 5px; color: #1f2937;">${cert.name}</h3>
            <p style="font-size: 14px; color: #6b7280; margin-bottom: 5px;">
              <strong>${cert.issuer}</strong> | ${cert.date}
            </p>
            ${cert.certificateNumber ? `<p style="font-size: 13px; color: #6b7280;">자격증 번호: ${cert.certificateNumber}</p>` : ''}
          </div>
        `;
      });
    }

    html += `</div>`;
    pdfContent.innerHTML = html;
    document.body.appendChild(pdfContent);

    try {
      const canvas = await html2canvas(pdfContent, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;
      }

      pdf.save('이력서_' + new Date().toISOString().split('T')[0] + '.pdf');
      setIsPdfDialogOpen(false);
    } catch (error) {
      console.error('PDF 생성 중 오류:', error);
      alert('PDF 생성 중 오류가 발생했습니다.');
    } finally {
      document.body.removeChild(pdfContent);
    }
  };

  const hasAnyCareerData = () => {
    return (
      currentStatus.length > 0 ||
      targetRoles.length > 0 ||
      techStack.length > 0 ||
      experiences.length > 0 ||
      activities.length > 0 ||
      competitions.length > 0 ||
      awards.length > 0 ||
      certificates.length > 0
    );
  };

  const handleChangePassword = async () => {
    setPasswordError(null);

    // 유효성 검사
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      setPasswordError('모든 필드를 입력해주세요.');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('새 비밀번호와 확인 비밀번호가 일치하지 않습니다.');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setPasswordError('비밀번호는 최소 6자 이상이어야 합니다.');
      return;
    }

    setIsChangingPassword(true);
    try {
      await api.auth.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      
      // 성공 메시지
      alert('비밀번호가 성공적으로 변경되었습니다.');
      setIsPasswordDialogOpen(false);
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      setPasswordError(null);
    } catch (error) {
      setPasswordError(error instanceof Error ? error.message : '비밀번호 변경에 실패했습니다.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirm('정말 계정을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      return;
    }

    setIsDeletingAccount(true);
    try {
      await api.auth.deleteAccount();
      
      // 계정 삭제 성공 - 로그아웃 처리
      alert('계정이 삭제되었습니다.');
      await handleLogout();
      navigate('/login');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '계정 삭제에 실패했습니다.';
      alert(errorMessage);
      
      // 계정 삭제가 요청되었지만 실제 삭제는 나중에 처리되는 경우
      if (errorMessage.includes('로그아웃')) {
        await handleLogout();
        navigate('/login');
      }
    } finally {
      setIsDeletingAccount(false);
      setIsDeleteAccountDialogOpen(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <h1 className="text-gray-900 dark:text-white mb-2">Settings</h1>
        <p className="text-gray-600 dark:text-gray-400">계정 및 환경 설정을 관리하세요</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Settings */}
        <div className="lg:col-span-2 space-y-6">
          {/* Profile Settings */}
          <Card className="rounded-2xl shadow-sm border-gray-200 dark:border-gray-700">
            <CardHeader>
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-primary" />
                <CardTitle className="dark:text-white">프로필 정보</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="w-20 h-20 ring-2 ring-primary">
                  <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=Yejin" />
                  <AvatarFallback className="bg-primary text-white">예진</AvatarFallback>
                </Avatar>
                <div>
                  <Button variant="outline" className="rounded-xl">
                    사진 변경
                  </Button>
                  <p className="text-gray-500 dark:text-gray-400 mt-2">JPG, PNG 최대 5MB</p>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">이름</Label>
                  <Input id="name" defaultValue="예진" className="rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">이메일</Label>
                  <Input
                    id="email"
                    type="email"
                    defaultValue="yejin@example.com"
                    className="rounded-xl"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">소개</Label>
                <Input
                  id="bio"
                  defaultValue="데이터 기반 마케팅을 공부하는 마케터입니다"
                  className="rounded-xl"
                />
              </div>
            </CardContent>
          </Card>

          {/* Career & Resume Information - Combined */}
          <Card className="rounded-2xl shadow-sm border-gray-200 dark:border-gray-700">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-primary" />
                  <CardTitle className="dark:text-white">커리어 & 이력서 정보</CardTitle>
                </div>
                <Button
                  onClick={() => setIsPdfDialogOpen(true)}
                  className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl"
                  disabled={!hasAnyCareerData()}
                >
                  <Download className="w-4 h-4 mr-2" />
                  PDF 다운로드
                </Button>
              </div>
              <CardDescription className="dark:text-gray-400">
                커리어 목표, 경력, 활동 내역을 관리하고 이력서로 내보내세요
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                {/* Career Goals Section */}
                <AccordionItem value="goals">
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-2">
                      <Target className="w-4 h-4" />
                      <span>기본 정보</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4 pt-3">
                      {/* Current Status */}
                      <div className="space-y-2">
                        <Label>현재 상태</Label>
                        <div className="flex flex-wrap gap-2">
                          {currentStatus.map((status, idx) => (
                            <Badge
                              key={idx}
                              variant="secondary"
                              className="rounded-lg bg-accent text-accent-foreground relative pr-8"
                            >
                              {status}
                              <button
                                onClick={() => handleDelete('status', status)}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                              >
                                ×
                              </button>
                            </Badge>
                          ))}
                          <Button
                            variant="outline"
                            size="sm"
                            className="rounded-lg"
                            onClick={() => openAddDialog('status')}
                          >
                            추가
                          </Button>
                        </div>
                      </div>

                      {/* Target Roles */}
                      <div className="space-y-2">
                        <Label>목표 직무</Label>
                        <div className="flex flex-wrap gap-2">
                          {targetRoles.map((role, idx) => (
                            <Badge
                              key={idx}
                              variant="secondary"
                              className="rounded-lg bg-accent text-accent-foreground relative pr-8"
                            >
                              {role}
                              <button
                                onClick={() => handleDelete('role', role)}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                              >
                                ×
                              </button>
                            </Badge>
                          ))}
                          <Button
                            variant="outline"
                            size="sm"
                            className="rounded-lg"
                            onClick={() => openAddDialog('role')}
                          >
                            추가
                          </Button>
                        </div>
                      </div>

                      {/* Tech Stack */}
                      <div className="space-y-2">
                        <Label>기술 스택</Label>
                        <div className="flex flex-wrap gap-2">
                          {techStack.map((skill, idx) => (
                            <Badge
                              key={idx}
                              variant="secondary"
                              className="rounded-lg bg-accent text-accent-foreground relative pr-8"
                            >
                              {skill}
                              <button
                                onClick={() => handleDelete('skill', skill)}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                              >
                                ×
                              </button>
                            </Badge>
                          ))}
                          <Button
                            variant="outline"
                            size="sm"
                            className="rounded-lg"
                            onClick={() => openAddDialog('skill')}
                          >
                            추가
                          </Button>
                        </div>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* Experience Section */}
                <AccordionItem value="experience">
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-2">
                      <Briefcase className="w-4 h-4" />
                      <span>경력 ({experiences.length})</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3 pt-3">
                      <div className="flex gap-2">
                        <Button
                          onClick={() => openAddDialog('experience')}
                          variant="outline"
                          className="flex-1 rounded-xl"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          경력 추가
                        </Button>
                        <Button
                          onClick={() => openProjectImportDialog('experience')}
                          variant="outline"
                          className="flex-1 rounded-xl bg-blue-50 dark:bg-blue-950 hover:bg-blue-100 dark:hover:bg-blue-900 border-blue-200 dark:border-blue-800"
                        >
                          <FolderKanban className="w-4 h-4 mr-2" />
                          프로젝트 불러오기
                        </Button>
                      </div>

                      {experiences.map((exp) => (
                        <div
                          key={exp.id}
                          className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <h4 className="text-gray-900 dark:text-white font-medium">{exp.position}</h4>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {exp.company} | {exp.period}
                              </p>
                            </div>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openEditDialog('experience', exp.id, exp)}
                              >
                                <Edit2 className="w-3 h-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete('experience', exp.id)}
                                className="text-red-500 hover:text-red-600"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{exp.description}</p>
                          {exp.achievements && exp.achievements.length > 0 && (
                            <div className="mb-2">
                              <p className="text-xs text-gray-700 dark:text-gray-300 font-medium mb-1">주요 성과:</p>
                              <ul className="list-disc list-inside space-y-0.5">
                                {exp.achievements.map((achievement, idx) => (
                                  <li key={idx} className="text-xs text-gray-600 dark:text-gray-400">
                                    {achievement}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {exp.skills && exp.skills.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {exp.skills.map((skill, idx) => (
                                <Badge key={idx} variant="secondary" className="text-xs">
                                  {skill}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* Activity Section */}
                <AccordionItem value="activity">
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      <span>대외활동 ({activities.length})</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3 pt-3">
                      <div className="flex gap-2">
                        <Button
                          onClick={() => openAddDialog('activity')}
                          variant="outline"
                          className="flex-1 rounded-xl"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          대외활동 추가
                        </Button>
                        <Button
                          onClick={() => openProjectImportDialog('activity')}
                          variant="outline"
                          className="flex-1 rounded-xl bg-blue-50 dark:bg-blue-950 hover:bg-blue-100 dark:hover:bg-blue-900 border-blue-200 dark:border-blue-800"
                        >
                          <FolderKanban className="w-4 h-4 mr-2" />
                          프로젝트 불러오기
                        </Button>
                      </div>

                      {activities.map((activity) => (
                        <div
                          key={activity.id}
                          className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <h4 className="text-gray-900 dark:text-white font-medium">{activity.name}</h4>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {activity.organization} | {activity.period}
                              </p>
                            </div>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openEditDialog('activity', activity.id, activity)}
                              >
                                <Edit2 className="w-3 h-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete('activity', activity.id)}
                                className="text-red-500 hover:text-red-600"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{activity.description}</p>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* Competition Section */}
                <AccordionItem value="competition">
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-2">
                      <Trophy className="w-4 h-4" />
                      <span>공모전 ({competitions.length})</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3 pt-3">
                      <div className="flex gap-2">
                        <Button
                          onClick={() => openAddDialog('competition')}
                          variant="outline"
                          className="flex-1 rounded-xl"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          공모전 추가
                        </Button>
                        <Button
                          onClick={() => openProjectImportDialog('competition')}
                          variant="outline"
                          className="flex-1 rounded-xl bg-blue-50 dark:bg-blue-950 hover:bg-blue-100 dark:hover:bg-blue-900 border-blue-200 dark:border-blue-800"
                        >
                          <FolderKanban className="w-4 h-4 mr-2" />
                          프로젝트 불러오기
                        </Button>
                      </div>

                      {competitions.map((comp) => (
                        <div
                          key={comp.id}
                          className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h4 className="text-gray-900 dark:text-white font-medium">{comp.name}</h4>
                                <Badge className="bg-yellow-500 text-white text-xs">{comp.result}</Badge>
                              </div>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {comp.organizer} | {comp.date}
                              </p>
                            </div>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openEditDialog('competition', comp.id, comp)}
                              >
                                <Edit2 className="w-3 h-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete('competition', comp.id)}
                                className="text-red-500 hover:text-red-600"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{comp.description}</p>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* Award Section */}
                <AccordionItem value="award">
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-2">
                      <Award className="w-4 h-4" />
                      <span>수상내역 ({awards.length})</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3 pt-3">
                      <div className="flex gap-2">
                        <Button
                          onClick={() => openAddDialog('award')}
                          variant="outline"
                          className="flex-1 rounded-xl"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          수상내역 추가
                        </Button>
                        <Button
                          onClick={() => openProjectImportDialog('award')}
                          variant="outline"
                          className="flex-1 rounded-xl bg-blue-50 dark:bg-blue-950 hover:bg-blue-100 dark:hover:bg-blue-900 border-blue-200 dark:border-blue-800"
                        >
                          <FolderKanban className="w-4 h-4 mr-2" />
                          프로젝트 불러오기
                        </Button>
                      </div>

                      {awards.map((award) => (
                        <div
                          key={award.id}
                          className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <h4 className="text-gray-900 dark:text-white font-medium">{award.name}</h4>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {award.organizer} | {award.date}
                              </p>
                            </div>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openEditDialog('award', award.id, award)}
                              >
                                <Edit2 className="w-3 h-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete('award', award.id)}
                                className="text-red-500 hover:text-red-600"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{award.description}</p>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* Certificate Section */}
                <AccordionItem value="certificate">
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-2">
                      <GraduationCap className="w-4 h-4" />
                      <span>자격증 ({certificates.length})</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3 pt-3">
                      <Button
                        onClick={() => openAddDialog('certificate')}
                        variant="outline"
                        className="w-full rounded-xl"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        자격증 추가
                      </Button>

                      {certificates.map((cert) => (
                        <div
                          key={cert.id}
                          className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <h4 className="text-gray-900 dark:text-white font-medium">{cert.name}</h4>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {cert.issuer} | {cert.date}
                              </p>
                              {cert.certificateNumber && (
                                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                                  번호: {cert.certificateNumber}
                                </p>
                              )}
                            </div>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openEditDialog('certificate', cert.id, cert)}
                              >
                                <Edit2 className="w-3 h-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete('certificate', cert.id)}
                                className="text-red-500 hover:text-red-600"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>

          {/* Integration Settings */}
          <Card className="rounded-2xl shadow-sm border-gray-200 dark:border-gray-700">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Cloud className="w-5 h-5 text-primary" />
                <CardTitle className="dark:text-white">클라우드 연동</CardTitle>
              </div>
              <CardDescription className="dark:text-gray-400">외부 서비스와 동기화하세요</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center">
                    <Cloud className="w-5 h-5 text-accent-foreground" />
                  </div>
                  <div>
                    <div className="text-gray-900 dark:text-white">Google Drive</div>
                    <div className="text-gray-500 dark:text-gray-400">연결되지 않음</div>
                  </div>
                </div>
                <Button variant="outline" className="rounded-xl">
                  연결
                </Button>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center">
                    <Cloud className="w-5 h-5 text-accent-foreground" />
                  </div>
                  <div>
                    <div className="text-gray-900 dark:text-white">Dropbox</div>
                    <div className="text-gray-500 dark:text-gray-400">연결되지 않음</div>
                  </div>
                </div>
                <Button variant="outline" className="rounded-xl">
                  연결
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Data Export */}
          <Card className="rounded-2xl shadow-sm border-gray-200 dark:border-gray-700">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Download className="w-5 h-5 text-primary" />
                <CardTitle className="dark:text-white">데이터 내보내기</CardTitle>
              </div>
              <CardDescription className="dark:text-gray-400">프로젝트 및 커리어 데이터를 다운로드하세요</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button 
                onClick={() => setIsPdfDialogOpen(true)}
                variant="outline" 
                className="w-full rounded-xl justify-start"
                disabled={!hasAnyCareerData()}
              >
                <Download className="w-4 h-4 mr-2" />
                이력서 PDF로 내보내기
              </Button>
              <Button variant="outline" className="w-full rounded-xl justify-start">
                <Download className="w-4 h-4 mr-2" />
                CSV로 내보내기
              </Button>
              <Button variant="outline" className="w-full rounded-xl justify-start">
                <Download className="w-4 h-4 mr-2" />
                JSON으로 내보내기
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Additional Settings */}
        <div className="space-y-6">
          {/* UI Settings */}
          <Card className="rounded-2xl shadow-sm border-gray-200 dark:border-gray-700">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Palette className="w-5 h-5 text-primary" />
                <CardTitle className="dark:text-white">UI 설정</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <Label className="text-gray-900 dark:text-white">테마 컬러</Label>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  앱 전체의 색상 테마를 변경하세요
                </p>
                <div className="grid grid-cols-4 gap-3">
                  {themes.map((theme) => (
                    <button
                      key={theme.name}
                      onClick={() => setThemeName(theme.name)}
                      className={`group relative flex flex-col items-center gap-2 p-3 rounded-xl bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all border-2 ${
                        themeName === theme.name 
                          ? 'border-primary shadow-lg' 
                          : 'border-transparent hover:border-gray-200 dark:hover:border-gray-600'
                      }`}
                    >
                      <div
                        className={`w-12 h-12 rounded-full bg-gradient-to-br ${theme.gradient} shadow-lg transition-transform group-hover:scale-110 flex items-center justify-center`}
                      >
                        {themeName === theme.name && (
                          <Check className="w-6 h-6 text-white drop-shadow-lg" />
                        )}
                      </div>
                      <span className="text-xs text-gray-600 dark:text-gray-400 font-medium text-center">
                        {theme.displayName}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <div className="text-gray-900 dark:text-white">다크 모드</div>
                  <div className="text-gray-500 dark:text-gray-400">어두운 테마 사용</div>
                </div>
                <Switch checked={darkMode} onCheckedChange={toggleDarkMode} />
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>언어</Label>
                <Input defaultValue="한국어" className="rounded-xl" disabled />
              </div>
            </CardContent>
          </Card>

          {/* Notification Settings */}
          <Card className="rounded-2xl shadow-sm border-gray-200 dark:border-gray-700">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-primary" />
                <CardTitle className="dark:text-white">알림 설정</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-gray-900 dark:text-white">이메일 알림</div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div className="text-gray-900 dark:text-white">푸시 알림</div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div className="text-gray-900 dark:text-white">주간 리포트</div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div className="text-gray-900 dark:text-white">AI 추천</div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>

          {/* Privacy & Security */}
          <Card className="rounded-2xl shadow-sm border-gray-200 dark:border-gray-700">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                <CardTitle className="dark:text-white">보안 및 개인정보</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button 
                variant="outline" 
                className="w-full rounded-xl justify-start"
                onClick={() => setIsPasswordDialogOpen(true)}
              >
                비밀번호 변경
              </Button>
              <Button variant="outline" className="w-full rounded-xl justify-start">
                2단계 인증 설정
              </Button>
              <Button variant="outline" className="w-full rounded-xl justify-start">
                개인정보 처리방침
              </Button>
              <Separator className="my-4" />
              <Button 
                variant="outline" 
                className="w-full rounded-xl justify-start text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                onClick={handleLogout}
              >
                <LogOut className="w-4 h-4 mr-2" />
                로그아웃
              </Button>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="rounded-2xl shadow-sm border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/20">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Trash2 className="w-5 h-5 text-red-600 dark:text-red-400" />
                <CardTitle className="text-red-900 dark:text-red-400">위험 영역</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                className="w-full rounded-xl justify-start border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-950/50"
                onClick={() => setIsDeleteAccountDialogOpen(true)}
              >
                계정 삭제
              </Button>
            </CardContent>
          </Card>

          {/* Save Button */}
          <Button className="w-full rounded-xl bg-primary hover:opacity-90">
            변경사항 저장
          </Button>
        </div>
      </div>

      {/* PDF Export Options Dialog */}
      <Dialog open={isPdfDialogOpen} onOpenChange={setIsPdfDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>PDF로 내보내기</DialogTitle>
            <DialogDescription>
              이력서에 포함할 항목을 선택하세요
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="basic-info"
                checked={pdfOptions.includeBasicInfo}
                onCheckedChange={(checked) => 
                  setPdfOptions({ ...pdfOptions, includeBasicInfo: checked as boolean })
                }
              />
              <label
                htmlFor="basic-info"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                기본 정보 (이름, 이메일, 소개)
              </label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="career-goals"
                checked={pdfOptions.includeCareerGoals}
                onCheckedChange={(checked) => 
                  setPdfOptions({ ...pdfOptions, includeCareerGoals: checked as boolean })
                }
                disabled={currentStatus.length === 0 && targetRoles.length === 0}
              />
              <label
                htmlFor="career-goals"
                className={`text-sm font-medium leading-none cursor-pointer ${
                  currentStatus.length === 0 && targetRoles.length === 0 
                    ? 'opacity-50 cursor-not-allowed' 
                    : ''
                }`}
              >
                커리어 목표 (현재 상태, 목표 직무) {currentStatus.length === 0 && targetRoles.length === 0 && '- 없음'}
              </label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="skills"
                checked={pdfOptions.includeSkills}
                onCheckedChange={(checked) => 
                  setPdfOptions({ ...pdfOptions, includeSkills: checked as boolean })
                }
                disabled={techStack.length === 0}
              />
              <label
                htmlFor="skills"
                className={`text-sm font-medium leading-none cursor-pointer ${
                  techStack.length === 0 ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                기술 스택 ({techStack.length}개)
              </label>
            </div>

            <Separator />

            <div className="flex items-center space-x-2">
              <Checkbox
                id="experiences"
                checked={pdfOptions.includeExperiences}
                onCheckedChange={(checked) => 
                  setPdfOptions({ ...pdfOptions, includeExperiences: checked as boolean })
                }
                disabled={experiences.length === 0}
              />
              <label
                htmlFor="experiences"
                className={`text-sm font-medium leading-none cursor-pointer ${
                  experiences.length === 0 ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                경력 ({experiences.length}개)
              </label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="activities"
                checked={pdfOptions.includeActivities}
                onCheckedChange={(checked) => 
                  setPdfOptions({ ...pdfOptions, includeActivities: checked as boolean })
                }
                disabled={activities.length === 0}
              />
              <label
                htmlFor="activities"
                className={`text-sm font-medium leading-none cursor-pointer ${
                  activities.length === 0 ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                대외활동 ({activities.length}개)
              </label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="competitions"
                checked={pdfOptions.includeCompetitions}
                onCheckedChange={(checked) => 
                  setPdfOptions({ ...pdfOptions, includeCompetitions: checked as boolean })
                }
                disabled={competitions.length === 0}
              />
              <label
                htmlFor="competitions"
                className={`text-sm font-medium leading-none cursor-pointer ${
                  competitions.length === 0 ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                공모전 ({competitions.length}개)
              </label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="awards"
                checked={pdfOptions.includeAwards}
                onCheckedChange={(checked) => 
                  setPdfOptions({ ...pdfOptions, includeAwards: checked as boolean })
                }
                disabled={awards.length === 0}
              />
              <label
                htmlFor="awards"
                className={`text-sm font-medium leading-none cursor-pointer ${
                  awards.length === 0 ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                수상내역 ({awards.length}개)
              </label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="certificates"
                checked={pdfOptions.includeCertificates}
                onCheckedChange={(checked) => 
                  setPdfOptions({ ...pdfOptions, includeCertificates: checked as boolean })
                }
                disabled={certificates.length === 0}
              />
              <label
                htmlFor="certificates"
                className={`text-sm font-medium leading-none cursor-pointer ${
                  certificates.length === 0 ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                자격증 ({certificates.length}개)
              </label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPdfDialogOpen(false)} className="rounded-xl">
              취소
            </Button>
            <Button 
              onClick={handleExportPDF} 
              className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl"
            >
              <Download className="w-4 h-4 mr-2" />
              다운로드
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Project Import Dialog */}
      <Dialog open={isProjectImportDialogOpen} onOpenChange={setIsProjectImportDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>프로젝트 불러오기</DialogTitle>
            <DialogDescription>
              {importTargetSection === 'experience' && '경력에 추가할 프로젝트를 선택하세요'}
              {importTargetSection === 'activity' && '대외활동에 추가할 프로젝트를 선택하세요'}
              {importTargetSection === 'competition' && '공모전에 추가할 프로젝트를 선택하세요'}
              {importTargetSection === 'award' && '수상내역에 추가할 프로젝트를 선택하세요'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-4">
            {projects.length === 0 ? (
              <div className="text-center py-8">
                <FolderKanban className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                  불러올 프로젝트가 없습니다
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  Nexter 페이지에서 프로젝트를 먼저 추가해주세요
                </p>
              </div>
            ) : (
              projects.map((project) => {
                const isSelected = selectedProjectIds.includes(project.id);
                const ProjectIcon = project.icon;
                
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
                        <ProjectIcon className="w-5 h-5 text-white" />
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
                        {project.tags && project.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {project.tags.slice(0, 3).map((tag, idx) => (
                              <Badge key={idx} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                            {project.tags.length > 3 && (
                              <Badge variant="secondary" className="text-xs">
                                +{project.tags.length - 3}
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsProjectImportDialogOpen(false)} className="rounded-xl">
              취소
            </Button>
            <Button 
              onClick={handleImportProjects} 
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl"
              disabled={selectedProjectIds.length === 0}
            >
              <FolderKanban className="w-4 h-4 mr-2" />
              불러오기 ({selectedProjectIds.length})
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit/Add Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingId ? '수정하기' : '추가하기'}
            </DialogTitle>
            <DialogDescription>
              {editMode === 'experience' && '경력 정보를 입력하세요'}
              {editMode === 'activity' && '대외활동 정보를 입력하세요'}
              {editMode === 'competition' && '공모전 정보를 입력하세요'}
              {editMode === 'award' && '수상내역 정보를 입력하세요'}
              {editMode === 'certificate' && '자격증 정보를 입력하세요'}
              {editMode === 'status' && '현재 상태를 입력하세요'}
              {editMode === 'role' && '목표 직무를 입력하세요'}
              {editMode === 'skill' && '기술 스택을 입력하세요'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {(editMode === 'status' || editMode === 'role' || editMode === 'skill') && (
              <div className="space-y-2">
                <Label>
                  {editMode === 'status' && '현재 상태'}
                  {editMode === 'role' && '목표 직무'}
                  {editMode === 'skill' && '기술 스택'}
                </Label>
                <Input 
                  value={formData.value || ''} 
                  onChange={(e) => setFormData({...formData, value: e.target.value})}
                  placeholder={
                    editMode === 'status' ? '예) 대학생, 직장인, 구직자' :
                    editMode === 'role' ? '예) 마케팅, 기획, 개발' :
                    '예) JavaScript, React, Python'
                  }
                />
              </div>
            )}

            {editMode === 'experience' && (
              <>
                <div className="space-y-2">
                  <Label>직위</Label>
                  <Input 
                    value={formData.position || ''} 
                    onChange={(e) => setFormData({...formData, position: e.target.value})}
                    placeholder="예) 마케팅 매니저"
                  />
                </div>
                <div className="space-y-2">
                  <Label>회사명</Label>
                  <Input 
                    value={formData.company || ''} 
                    onChange={(e) => setFormData({...formData, company: e.target.value})}
                    placeholder="예) 테크스타트업 A"
                  />
                </div>
                <div className="space-y-2">
                  <Label>근무기간</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left"
                        >
                          <Calendar className="mr-2 h-4 w-4" />
                          {formData.startDate ? format(new Date(formData.startDate), 'yyyy.MM.dd', { locale: ko }) : '시작일 선택'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <CalendarComponent
                          mode="single"
                          selected={formData.startDate ? new Date(formData.startDate) : undefined}
                          onSelect={(date) => setFormData({...formData, startDate: date?.toISOString()})}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left"
                        >
                          <Calendar className="mr-2 h-4 w-4" />
                          {formData.endDate ? format(new Date(formData.endDate), 'yyyy.MM.dd', { locale: ko }) : '종료일 선택'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <CalendarComponent
                          mode="single"
                          selected={formData.endDate ? new Date(formData.endDate) : undefined}
                          onSelect={(date) => setFormData({...formData, endDate: date?.toISOString()})}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <Checkbox
                      id="current-work"
                      checked={formData.isCurrent || false}
                      onCheckedChange={(checked) => setFormData({...formData, isCurrent: checked, endDate: checked ? undefined : formData.endDate})}
                    />
                    <Label htmlFor="current-work" className="cursor-pointer">현재 재직중</Label>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>위치</Label>
                  <Input 
                    value={formData.location || ''} 
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                    placeholder="예) 서울"
                  />
                </div>
                <div className="space-y-2">
                  <Label>업무 설명</Label>
                  <Textarea 
                    value={formData.description || ''} 
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="담당 업무를 설명해주세요"
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>주요 성과</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setIsProjectDialogOpen(true)}
                      className="rounded-lg"
                    >
                      <FolderKanban className="w-3 h-3 mr-1" />
                      프로젝트에서 불러오기
                    </Button>
                  </div>
                  
                  {formData.achievements && formData.achievements.length > 0 && (
                    <div className="space-y-2 mb-2">
                      {formData.achievements.map((achievement: string, idx: number) => (
                        <div 
                          key={idx}
                          className="flex items-start gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                        >
                          <span className="text-sm flex-1 text-gray-900 dark:text-white">{achievement}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const newAchievements = formData.achievements.filter((_: string, i: number) => i !== idx);
                              setFormData({...formData, achievements: newAchievements});
                            }}
                            className="h-6 w-6 p-0 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-600"
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <Textarea 
                    value={formData.newAchievement || ''} 
                    onChange={(e) => setFormData({...formData, newAchievement: e.target.value})}
                    placeholder="새로운 성과를 입력하세요 (엔터로 추가)"
                    rows={2}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        const value = formData.newAchievement?.trim();
                        if (value) {
                          const currentAchievements = formData.achievements || [];
                          setFormData({
                            ...formData,
                            achievements: [...currentAchievements, value],
                            newAchievement: ''
                          });
                        }
                      }
                    }}
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    성과를 입력하고 Enter를 눌러 추가하세요
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>스킬 (쉼표로 구분)</Label>
                  <Input 
                    value={formData.skills?.join(', ') || ''} 
                    onChange={(e) => setFormData({...formData, skills: e.target.value.split(',').map((s: string) => s.trim()).filter((s: string) => s)})}
                    placeholder="예) 디지털 마케팅, 데이터 분석, SNS 마케팅"
                  />
                </div>
              </>
            )}

            {editMode === 'activity' && (
              <>
                <div className="space-y-2">
                  <Label>활동명</Label>
                  <Input 
                    value={formData.name || ''} 
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="예) 대학생 마케팅 동아리"
                  />
                </div>
                <div className="space-y-2">
                  <Label>기관/조직</Label>
                  <Input 
                    value={formData.organization || ''} 
                    onChange={(e) => setFormData({...formData, organization: e.target.value})}
                    placeholder="예) ○○대학교"
                  />
                </div>
                <div className="space-y-2">
                  <Label>활동기간</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left"
                        >
                          <Calendar className="mr-2 h-4 w-4" />
                          {formData.startDate ? format(new Date(formData.startDate), 'yyyy.MM.dd', { locale: ko }) : '시작일 선택'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <CalendarComponent
                          mode="single"
                          selected={formData.startDate ? new Date(formData.startDate) : undefined}
                          onSelect={(date) => setFormData({...formData, startDate: date?.toISOString()})}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left"
                        >
                          <Calendar className="mr-2 h-4 w-4" />
                          {formData.endDate ? format(new Date(formData.endDate), 'yyyy.MM.dd', { locale: ko }) : '종료일 선택'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <CalendarComponent
                          mode="single"
                          selected={formData.endDate ? new Date(formData.endDate) : undefined}
                          onSelect={(date) => setFormData({...formData, endDate: date?.toISOString()})}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <Checkbox
                      id="current-activity"
                      checked={formData.isCurrent || false}
                      onCheckedChange={(checked) => setFormData({...formData, isCurrent: checked, endDate: checked ? undefined : formData.endDate})}
                    />
                    <Label htmlFor="current-activity" className="cursor-pointer">현재 활동중</Label>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>역할</Label>
                  <Input 
                    value={formData.role || ''} 
                    onChange={(e) => setFormData({...formData, role: e.target.value})}
                    placeholder="예) 회장"
                  />
                </div>
                <div className="space-y-2">
                  <Label>활동 설명</Label>
                  <Textarea 
                    value={formData.description || ''} 
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="활동 내용을 설명해주세요"
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label>스킬 (쉼표로 구분)</Label>
                  <Input 
                    value={formData.skills?.join(', ') || ''} 
                    onChange={(e) => setFormData({...formData, skills: e.target.value.split(',').map((s: string) => s.trim()).filter((s: string) => s)})}
                    placeholder="예) 리더십, 프로젝트 관리, 팀워크"
                  />
                </div>
              </>
            )}

            {editMode === 'competition' && (
              <>
                <div className="space-y-2">
                  <Label>공모전명</Label>
                  <Input 
                    value={formData.name || ''} 
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="예) 대학생 마케팅 공모전"
                  />
                </div>
                <div className="space-y-2">
                  <Label>주최기관</Label>
                  <Input 
                    value={formData.organizer || ''} 
                    onChange={(e) => setFormData({...formData, organizer: e.target.value})}
                    placeholder="예) 한국광고학회"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>일자</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left"
                        >
                          <Calendar className="mr-2 h-4 w-4" />
                          {formData.date ? format(new Date(formData.date), 'yyyy.MM.dd', { locale: ko }) : '날짜 선택'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <CalendarComponent
                          mode="single"
                          selected={formData.date ? new Date(formData.date) : undefined}
                          onSelect={(date) => setFormData({...formData, date: date?.toISOString()})}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="space-y-2">
                    <Label>결과</Label>
                    <Input 
                      value={formData.result || ''} 
                      onChange={(e) => setFormData({...formData, result: e.target.value})}
                      placeholder="예) 대상"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>설명</Label>
                  <Textarea 
                    value={formData.description || ''} 
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="프로젝트 내용을 설명해주세요"
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label>스킬 (쉼표로 구분)</Label>
                  <Input 
                    value={formData.skills?.join(', ') || ''} 
                    onChange={(e) => setFormData({...formData, skills: e.target.value.split(',').map((s: string) => s.trim()).filter((s: string) => s)})}
                    placeholder="예) 마케팅 전략, 기획력, 발표력"
                  />
                </div>
              </>
            )}

            {editMode === 'award' && (
              <>
                <div className="space-y-2">
                  <Label>수상명</Label>
                  <Input 
                    value={formData.name || ''} 
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="예) 우수 사원상"
                  />
                </div>
                <div className="space-y-2">
                  <Label>수여기관</Label>
                  <Input 
                    value={formData.organizer || ''} 
                    onChange={(e) => setFormData({...formData, organizer: e.target.value})}
                    placeholder="예) 테크스타트업 A"
                  />
                </div>
                <div className="space-y-2">
                  <Label>수상일</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left"
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        {formData.date ? format(new Date(formData.date), 'yyyy.MM.dd', { locale: ko }) : '날짜 선택'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <CalendarComponent
                        mode="single"
                        selected={formData.date ? new Date(formData.date) : undefined}
                        onSelect={(date) => setFormData({...formData, date: date?.toISOString()})}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label>설명</Label>
                  <Textarea 
                    value={formData.description || ''} 
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="수상 내용을 설명해주세요"
                    rows={3}
                  />
                </div>
              </>
            )}

            {editMode === 'certificate' && (
              <>
                <div className="space-y-2">
                  <Label>자격증명</Label>
                  <Input 
                    value={formData.name || ''} 
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="예) 정보처리기사"
                  />
                </div>
                <div className="space-y-2">
                  <Label>발급기관</Label>
                  <Input 
                    value={formData.issuer || ''} 
                    onChange={(e) => setFormData({...formData, issuer: e.target.value})}
                    placeholder="예) 한국산업인력공단"
                  />
                </div>
                <div className="space-y-2">
                  <Label>취득일자</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left"
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        {formData.date ? format(new Date(formData.date), 'yyyy.MM.dd', { locale: ko }) : '날짜 선택'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <CalendarComponent
                        mode="single"
                        selected={formData.date ? new Date(formData.date) : undefined}
                        onSelect={(date) => setFormData({...formData, date: date?.toISOString()})}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label>자격증 번호 (선택사항)</Label>
                  <Input 
                    value={formData.certificateNumber || ''} 
                    onChange={(e) => setFormData({...formData, certificateNumber: e.target.value})}
                    placeholder="예) 23-A-12345"
                  />
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="rounded-xl">
              취소
            </Button>
            <Button onClick={handleSave} className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl">
              저장
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Project Selection Dialog */}
      <Dialog open={isProjectDialogOpen} onOpenChange={setIsProjectDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>프로젝트에서 주요성과 불러오기</DialogTitle>
            <DialogDescription>
              등록된 프로젝트의 성과를 경력에 추가하세요
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[500px] pr-4">
            <div className="space-y-3">
              {registeredProjects.map((project) => (
                <div
                  key={project.id}
                  className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-primary transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h4 className="text-gray-900 dark:text-white font-medium mb-1">
                        {project.title}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                        {project.description}
                      </p>
                    </div>
                  </div>

                  {project.achievements && project.achievements.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs text-gray-700 dark:text-gray-300 font-medium">
                        주요 성과:
                      </p>
                      <div className="space-y-1.5">
                        {project.achievements.map((achievement, idx) => (
                          <div
                            key={idx}
                            className="flex items-start gap-2 group"
                          >
                            <div className="flex-1 p-2 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-600">
                              <p className="text-sm text-gray-900 dark:text-white">
                                {achievement}
                              </p>
                            </div>
                            <Button
                              type="button"
                              size="sm"
                              onClick={() => {
                                const currentAchievements = formData.achievements || [];
                                if (!currentAchievements.includes(achievement)) {
                                  setFormData({
                                    ...formData,
                                    achievements: [...currentAchievements, achievement]
                                  });
                                }
                              }}
                              className="opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity rounded-lg"
                            >
                              <Plus className="w-3 h-3 mr-1" />
                              추가
                            </Button>
                          </div>
                        ))}
                      </div>

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const currentAchievements = formData.achievements || [];
                          const newAchievements = project.achievements.filter(
                            (a) => !currentAchievements.includes(a)
                          );
                          if (newAchievements.length > 0) {
                            setFormData({
                              ...formData,
                              achievements: [...currentAchievements, ...newAchievements]
                            });
                          }
                        }}
                        className="w-full mt-2 rounded-lg"
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        모든 성과 추가
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsProjectDialogOpen(false)}
              className="rounded-xl"
            >
              닫기
            </Button>
            <Button
              onClick={() => setIsProjectDialogOpen(false)}
              className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl"
            >
              <Check className="w-4 h-4 mr-2" />
              완료
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 비밀번호 변경 다이얼로그 */}
      <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>비밀번호 변경</DialogTitle>
            <DialogDescription>
              현재 비밀번호를 입력하고 새 비밀번호를 설정해주세요
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="current-password">현재 비밀번호</Label>
              <Input
                id="current-password"
                type="password"
                value={passwordForm.currentPassword}
                onChange={(e) =>
                  setPasswordForm({ ...passwordForm, currentPassword: e.target.value })
                }
                placeholder="현재 비밀번호를 입력하세요"
                className="rounded-lg"
                disabled={isChangingPassword}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-password">새 비밀번호</Label>
              <Input
                id="new-password"
                type="password"
                value={passwordForm.newPassword}
                onChange={(e) =>
                  setPasswordForm({ ...passwordForm, newPassword: e.target.value })
                }
                placeholder="새 비밀번호를 입력하세요 (최소 6자)"
                className="rounded-lg"
                disabled={isChangingPassword}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password">비밀번호 확인</Label>
              <Input
                id="confirm-password"
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(e) =>
                  setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })
                }
                placeholder="새 비밀번호를 다시 입력하세요"
                className="rounded-lg"
                disabled={isChangingPassword}
              />
            </div>

            {passwordError && (
              <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-600 dark:text-red-400">{passwordError}</p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsPasswordDialogOpen(false);
                setPasswordForm({
                  currentPassword: '',
                  newPassword: '',
                  confirmPassword: '',
                });
                setPasswordError(null);
              }}
              className="rounded-xl"
              disabled={isChangingPassword}
            >
              취소
            </Button>
            <Button
              onClick={handleChangePassword}
              className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl"
              disabled={isChangingPassword}
            >
              {isChangingPassword ? '변경 중...' : '변경하기'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 회원 탈퇴 확인 다이얼로그 */}
      <Dialog open={isDeleteAccountDialogOpen} onOpenChange={setIsDeleteAccountDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-600 dark:text-red-400">계정 삭제</DialogTitle>
            <DialogDescription>
              계정을 삭제하면 모든 데이터가 영구적으로 삭제되며 복구할 수 없습니다.
              정말 계정을 삭제하시겠습니까?
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400 font-medium mb-2">
                주의사항:
              </p>
              <ul className="text-sm text-red-600 dark:text-red-400 space-y-1 list-disc list-inside">
                <li>모든 프로젝트 및 커리어 데이터가 삭제됩니다</li>
                <li>이 작업은 되돌릴 수 없습니다</li>
                <li>다시 가입하지 않는 한 데이터를 복구할 수 없습니다</li>
              </ul>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteAccountDialogOpen(false)}
              className="rounded-xl"
              disabled={isDeletingAccount}
            >
              취소
            </Button>
            <Button
              onClick={handleDeleteAccount}
              className="bg-red-600 hover:bg-red-700 text-white rounded-xl"
              disabled={isDeletingAccount}
            >
              {isDeletingAccount ? '삭제 중...' : '계정 삭제'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
