import { useState, MouseEvent, useMemo, Dispatch, SetStateAction } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader } from '@/shared/ui/shadcn/card';
import { Button } from '@/shared/ui/shadcn/button';
import { Badge } from '@/shared/ui/shadcn/badge';
import { FileText, Link2, Sparkles, Download, ExternalLink, Grid3x3, List, Filter, Image, File } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/shared/ui/shadcn/dialog';
import { Checkbox } from '@/shared/ui/shadcn/checkbox';
import type { Project } from '@/entities/project';
import { api } from '@/shared/api';
import { mapProjectRecordToProject } from '@/entities/project/lib/mapProject';
import { EditProjectDialog, type EditProjectFormValues } from '@/features/ai/assistant/components/EditProjectDialog';
import { MARKETING_CATEGORIES, DEVELOPMENT_CATEGORIES } from '@/features/ai/assistant/constants';
import JSZip from 'jszip';

interface ProjectsBoardProps {
  projects: Project[];
  setProjects?: Dispatch<SetStateAction<Project[]>>;
}

type FilterType = 'all' | 'files' | 'links' | 'projects';

function ProjectCard({ project, onProjectClick }: { project: Project; onProjectClick: (project: Project) => void }) {
  const Icon = project.icon;
  const TypeIcon = project.type === 'file' ? FileText : project.type === 'link' ? Link2 : Sparkles;
  const files = (project as any)?.files as Array<{ name: string; url: string }> | undefined;

  const resolveSourceUrl = (sourceUrl: string) => {
    if (/^https?:\/\//i.test(sourceUrl)) return sourceUrl;
    const base = import.meta.env.VITE_PROJECT_FILES_BASE_URL || '/files/';
    return `${base}${sourceUrl}`.replace(/([^:]\/)\/+/g, '$1');
  };

  const downloadFromUrl = async (url: string, filename: string) => {
    try {
      const response = await fetch(url, { credentials: 'omit' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(objectUrl);
      toast.success(`"${filename}" 파일을 다운로드했습니다`, {
        description: '다운로드 폴더를 확인하세요.',
      });
    } catch (error) {
      console.error('[ProjectsBoard] download error (blob). Falling back to direct link:', error);
      // CORS/서명 URL 등으로 blob 다운로드가 막히는 경우 직접 링크로 열기 (쿼리스트링 보존)
      try {
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.rel = 'noopener';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        toast.success(`"${filename}" 파일을 다운로드했습니다`, {
          description: '다운로드 폴더를 확인하세요.',
        });
      } catch (fallbackErr) {
        console.error('[ProjectsBoard] download error (fallback):', fallbackErr);
        toast.error('파일을 다운로드할 수 없습니다', {
          description: '파일 경로 또는 권한을 확인하세요.',
        });
      }
    }
  };

  const handleDownload = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (project.sourceUrl || (files && files.length > 0)) {
      // files[0]를 우선 사용, 없으면 sourceUrl 사용
      if (files && files.length > 0) {
        const first = files[0];
        const url = resolveSourceUrl(first.url);
        const filename = first.name || first.url.split('/').pop() || 'project-file';
        toast.message('다운로드 준비', { description: filename });
        void downloadFromUrl(url, filename);
        return;
      }
      if (project.sourceUrl) {
        const url = resolveSourceUrl(project.sourceUrl);
        const filename = project.sourceUrl.split('/').pop() || 'project-file';
        toast.message('다운로드 준비', { description: filename });
        void downloadFromUrl(url, filename);
      }
    } else {
      toast.error('다운로드할 파일이 없습니다');
    }
  };

  const handleOpenLink = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (project.type === 'link' && project.sourceUrl) {
      const demoUrl = project.sourceUrl.startsWith('http') ? project.sourceUrl : `https://example.com/${project.sourceUrl}`;
      window.open(demoUrl, '_blank', 'noopener,noreferrer');
      
      toast.success('링크를 새 탭에서 엽니다', {
        description: project.sourceUrl,
      });
    }
  };

  return (
    <Card 
      className="rounded-xl shadow-sm border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow overflow-hidden group cursor-pointer"
      onClick={() => onProjectClick(project)}
    >
      {/* Icon Header */}
      <div className={`h-20 md:h-24 bg-gradient-to-br ${project.gradient} flex items-center gap-3 md:gap-4 px-4 md:px-6 relative overflow-hidden`}>
        <div className="absolute inset-0 bg-black/5"></div>
        <Icon className="w-10 h-10 md:w-12 md:h-12 text-white/90 relative z-10 flex-shrink-0" strokeWidth={1.5} />
        <div className="relative z-10 flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-white font-semibold truncate text-sm md:text-base">{project.title}</h3>
            <TypeIcon className="w-4 h-4 text-white/70" />
          </div>
          <p className="text-white/80 text-xs md:text-sm truncate">{project.category}</p>
        </div>
        
        {/* Action Buttons */}
        <Button
          size="sm"
          variant="ghost"
          onClick={handleDownload}
          disabled={!(project.sourceUrl || (files && files.length > 0))}
          className="relative z-10 rounded-lg bg-white/10 hover:bg-white/20 text-white border-0 disabled:opacity-50 disabled:cursor-not-allowed"
          title={project.sourceUrl || (files && files.length > 0) ? undefined : '다운로드할 파일이 없습니다'}
        >
          <Download className="w-4 h-4" />
        </Button>
        {project.type === 'link' && (
          <Button
            size="sm"
            variant="ghost"
            onClick={handleOpenLink}
            className="relative z-10 rounded-lg bg-white/10 hover:bg-white/20 text-white border-0"
          >
            <ExternalLink className="w-4 h-4" />
          </Button>
        )}
        
        {/* Decorative elements */}
        <div className="absolute top-2 right-2 w-8 h-8 md:w-10 md:h-10 bg-white/10 rounded-full blur-lg"></div>
        <div className="absolute bottom-2 md:bottom-3 left-2 md:left-3 w-6 h-6 md:w-8 md:h-8 bg-white/10 rounded-full blur-md"></div>
      </div>

      <CardHeader className="p-4 md:p-6">
        <CardDescription className="text-sm md:text-base line-clamp-2">{project.summary}</CardDescription>
        {(project.sourceUrl || (files && files.length > 0)) && (
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-2">
            {project.type === 'file' ? '📄 ' : '🔗 '}
            {project.sourceUrl ? project.sourceUrl : files && files.length > 0 ? (files[0].name || files[0].url) : ''}
          </p>
        )}
      </CardHeader>
      <CardContent className="p-4 md:p-6 pt-0">
        <div className="flex items-center justify-between gap-2">
          <div className="flex flex-wrap gap-1.5 md:gap-2">
            {project.tags.map((tag) => (
              <Badge key={tag} variant="outline" className="rounded-lg text-xs md:text-sm">
                {tag}
              </Badge>
            ))}
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={(e: MouseEvent<HTMLButtonElement>) => {
              e.stopPropagation();
              // files[0]를 우선 사용, 없으면 sourceUrl 사용
              if (files && files.length > 0) {
                const first = files[0];
                const url = resolveSourceUrl(first.url);
                const filename = first.name || first.url.split('/').pop() || 'project-file';
                toast.message('다운로드 준비', { description: filename });
                void downloadFromUrl(url, filename);
              } else if (project.sourceUrl) {
                const url = resolveSourceUrl(project.sourceUrl!);
                const filename = project.sourceUrl!.split('/').pop() || 'project-file';
                toast.message('다운로드 준비', { description: filename });
                void downloadFromUrl(url, filename);
              } else {
                toast.error('다운로드할 파일이 없습니다');
              }
            }}
            disabled={!(project.sourceUrl || (files && files.length > 0))}
            className="rounded-lg shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
            title={project.sourceUrl || (files && files.length > 0) ? undefined : '다운로드할 파일이 없습니다'}
          >
            <Download className="w-4 h-4 mr-1.5" />
            다운로드
          </Button>
        </div>
        {files && files.length > 0 && (
          <div className="mt-3 space-y-1.5">
            {files.slice(0, 3).map((f) => (
              <div key={f.url} className="flex items-center justify-between gap-2 text-xs">
                <span className="truncate">{f.name || f.url}</span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={(e: MouseEvent<HTMLButtonElement>) => {
                    e.stopPropagation();
                    const url = resolveSourceUrl(f.url);
                    const filename = f.name || f.url.split('/').pop() || 'file';
                    void downloadFromUrl(url, filename);
                  }}
                  className="h-7 px-2"
                >
                  <Download className="w-3.5 h-3.5" />
                </Button>
              </div>
            ))}
            {files.length > 3 && (
              <p className="text-[11px] text-gray-500 dark:text-gray-400">외 {files.length - 3}개 파일</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function ProjectsBoard({ projects, setProjects }: ProjectsBoardProps) {
  const queryClient = useQueryClient();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [filesDialogOpen, setFilesDialogOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [selectedFileForView, setSelectedFileForView] = useState<string | null>(null);
  const [projectToEdit, setProjectToEdit] = useState<Project | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // 파일 타입 체크 함수
  const getFileType = (filename: string): 'image' | 'pdf' | 'docx' | null => {
    const ext = filename.toLowerCase().split('.').pop();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext || '')) return 'image';
    if (ext === 'pdf') return 'pdf';
    if (['docx', 'doc'].includes(ext || '')) return 'docx';
    return null;
  };

  // 프로젝트에서 파일 추출
  const extractFiles = () => {
    const files: Array<{ id: string; name: string; url: string; type: 'image' | 'pdf' | 'docx'; projectTitle: string; projectId: number | string }> = [];
    
    projects.forEach(project => {
      if (project.type === 'file' && project.sourceUrl) {
        const fileType = getFileType(project.sourceUrl);
        if (fileType) {
          files.push({
            id: `${project.id}-${project.sourceUrl}`,
            name: project.sourceUrl,
            url: (/^https?:\/\//i.test(project.sourceUrl) ? project.sourceUrl : `${(import.meta as any).env?.VITE_PROJECT_FILES_BASE_URL || '/files/'}${project.sourceUrl}`).replace(/([^:]\/)\/+/g, '$1'),
            type: fileType,
            projectTitle: project.title,
            projectId: project.id
          });
        }
      }
      if (project.type === 'file' && Array.isArray((project as any)?.files)) {
        const pFiles = (project as any).files as Array<{ name: string; url: string }>;
        pFiles.forEach((f) => {
          const displayName = f.name || f.url;
          const fileType = getFileType(displayName);
          if (fileType) {
            files.push({
              id: `${project.id}-${f.url}`,
              name: displayName,
              url: (/^https?:\/\//i.test(f.url) ? f.url : `${(import.meta as any).env?.VITE_PROJECT_FILES_BASE_URL || '/files/'}${f.url}`).replace(/([^:]\/)\/+/g, '$1'),
              type: fileType,
              projectTitle: project.title,
              projectId: project.id
            });
          }
        });
      }
    });
    
    return files;
  };

  const allFiles = extractFiles();
  const imageFiles = allFiles.filter(f => f.type === 'image');
  const pdfFiles = allFiles.filter(f => f.type === 'pdf');
  const docxFiles = allFiles.filter(f => f.type === 'docx');

  // 파일 선택/해제
  const toggleFileSelection = (fileId: string) => {
    const newSelected = new Set(selectedFiles);
    if (newSelected.has(fileId)) {
      newSelected.delete(fileId);
    } else {
      newSelected.add(fileId);
    }
    setSelectedFiles(newSelected);
  };

  // 파일 클릭 핸들러
  const handleFileClick = (fileId: string, e: MouseEvent<HTMLDivElement>) => {
    // 체크박스 클릭이 아닌 경우에만 상세보기
    const target = e.target as HTMLElement;
    if (target.tagName !== 'INPUT' && target.tagName !== 'BUTTON') {
      setSelectedFileForView(fileId);
    }
  };

  // 선택된 파일의 프로젝트 정보 가져오기
  const getSelectedFileProject = () => {
    if (!selectedFileForView) return null;
    const file = allFiles.find(f => f.id === selectedFileForView);
    if (!file) return null;
    return projects.find(p => p.id === file.projectId);
  };

  const selectedProject = getSelectedFileProject();

  // 전체 선택/해제
  const toggleSelectAll = () => {
    if (selectedFiles.size === allFiles.length) {
      setSelectedFiles(new Set());
    } else {
      setSelectedFiles(new Set(allFiles.map(f => f.id)));
    }
  };

  // 선택한 파일 일괄 다운로드
  const handleFilesDownload = async () => {
    if (selectedFiles.size === 0) {
      toast.error('다운로드할 파일을 선택해주세요');
      return;
    }

    const selectedFilesList = allFiles.filter(f => selectedFiles.has(f.id));
    
    for (let i = 0; i < selectedFilesList.length; i++) {
      const file = selectedFilesList[i];
      const url = file.url || ((/^https?:\/\//i.test(file.name) ? file.name : `${(import.meta as any).env?.VITE_PROJECT_FILES_BASE_URL || '/files/'}${file.name}`).replace(/([^:]\/)\/+/g, '$1'));
      const filename = file.name.split('/').pop() || `file-${i + 1}`;
      // eslint-disable-next-line no-await-in-loop
      await new Promise((r) => setTimeout(r, i * 100));
      // eslint-disable-next-line no-await-in-loop
      await (async () => {
        try {
          const res = await fetch(url, { credentials: 'omit' });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const blob = await res.blob();
          const objectUrl = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = objectUrl;
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(objectUrl);
        } catch (err) {
          console.error('[ProjectsBoard] batch download error:', err);
          toast.error(`"${filename}" 다운로드 실패`, { description: '파일 경로 또는 권한을 확인하세요.' });
        }
      })();
    }

    toast.success(`${selectedFiles.size}개의 파일을 다운로드했습니다`, {
      description: '다운로드 폴더를 확인하세요.',
    });
    
    setSelectedFiles(new Set());
    setFilesDialogOpen(false);
  };

  // 필터링된 프로젝트
  const getFilteredProjects = () => {
    if (filterType === 'files') {
      return projects.filter(p => p.type === 'file');
    } else if (filterType === 'links') {
      return projects.filter(p => p.type === 'link');
    } else if (filterType === 'projects') {
      return projects.filter(p => p.type === 'project');
    }
    return projects;
  };

  const filteredProjects = getFilteredProjects();

  // 사용 가능한 카테고리 목록 생성
  const availableCategories = useMemo(() => {
    const categorySet = new Set<string>([...MARKETING_CATEGORIES, ...DEVELOPMENT_CATEGORIES]);
    projects.forEach((project) => {
      if (project.category) {
        categorySet.add(project.category);
      }
    });
    return Array.from(categorySet);
  }, [projects]);

  // 프로젝트 저장 핸들러
  const handleSaveProject = async (projectId: number | string, data: EditProjectFormValues) => {
    const targetProject = projects.find((project) => project.id === projectId);
    if (!targetProject) {
      toast.error('프로젝트를 찾을 수 없습니다.');
      return;
    }

    try {
      const updatedRecord = await api.projects.update(projectId, {
        title: data.title,
        category: data.category,
        tags: data.tags.split(',').map((tag) => tag.trim()).filter(Boolean),
        summary: data.summary,
        type: targetProject.type,
        sourceUrl: targetProject.sourceUrl,
        period: data.period,
        startDate: data.startDate ? data.startDate.toISOString() : null,
        endDate: data.endDate ? data.endDate.toISOString() : null,
        role: data.role,
        achievements: data.achievements,
        tools: data.tools,
        description: data.description,
        files: targetProject.files || data.files,
      });

      const updatedProject = mapProjectRecordToProject(updatedRecord);

      if (setProjects) {
        setProjects((previous) => previous.map((project) => (project.id === projectId ? updatedProject : project)));
      }

      void queryClient.refetchQueries({ queryKey: ['projects'] });

      setIsEditDialogOpen(false);
      setProjectToEdit(null);

      toast.success('저장 완료 되었습니다');
    } catch (error) {
      console.error('Error saving project:', error);
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다';
      toast.error(`프로젝트 저장 실패: ${errorMessage}`);
    }
  };

  // AI로 정리하기 핸들러 (간단한 안내 메시지)
  const handleOrganizeWithAI = async (project: Project) => {
    toast.info('AI로 프로젝트 정리 기능은 AI Assistant 페이지에서 사용할 수 있습니다.', {
      description: 'AI Assistant 페이지로 이동하여 프로젝트를 정리해보세요.',
    });
  };

  // 프로젝트 클릭 핸들러 (편집 다이얼로그 열기)
  const handleProjectClick = (project: Project) => {
    setProjectToEdit(project);
    setIsEditDialogOpen(true);
  };

  // 일괄 다운로드 함수 (ZIP 압축)
  const handleBulkDownload = async () => {
    if (projects.length === 0) {
      toast.error('다운로드할 프로젝트가 없습니다');
      return;
    }

    // 다운로드할 파일 목록 수집
    const filesToDownload: Array<{ url: string; filename: string; projectTitle: string; folder?: string }> = [];

    projects.forEach((project) => {
      // files 배열이 있는 경우
      const projectFiles = (project as any)?.files as Array<{ name: string; url: string }> | undefined;
      if (Array.isArray(projectFiles) && projectFiles.length > 0) {
        projectFiles.forEach((file) => {
          const base = (import.meta as any).env?.VITE_PROJECT_FILES_BASE_URL || '/files/';
          const url = (/^https?:\/\//i.test(file.url) ? file.url : `${base}${file.url}`).replace(/([^:]\/)\/+/g, '$1');
          const filename = file.name || file.url.split('/').pop() || 'file';
          filesToDownload.push({
            url,
            filename,
            projectTitle: project.title,
            folder: project.title, // 프로젝트 제목을 폴더명으로 사용
          });
        });
      }
      // sourceUrl이 있는 경우 (files 배열이 없을 때만)
      else if (project.type === 'file' && project.sourceUrl) {
        const base = (import.meta as any).env?.VITE_PROJECT_FILES_BASE_URL || '/files/';
        const url = (/^https?:\/\//i.test(project.sourceUrl) ? project.sourceUrl : `${base}${project.sourceUrl}`).replace(/([^:]\/)\/+/g, '$1');
        const filename = project.sourceUrl.split('/').pop() || 'file';
        filesToDownload.push({
          url,
          filename,
          projectTitle: project.title,
          folder: project.title, // 프로젝트 제목을 폴더명으로 사용
        });
      }
    });

    if (filesToDownload.length === 0) {
      toast.error('다운로드할 파일이 없습니다');
      return;
    }

    // 로딩 토스트 표시
    const loadingToast = toast.loading(`${filesToDownload.length}개의 파일을 압축 중...`, {
      description: '잠시만 기다려주세요',
    });

    try {
      const zip = new JSZip();
      let successCount = 0;
      let failCount = 0;

      // 각 파일을 다운로드하여 ZIP에 추가
      for (const file of filesToDownload) {
        try {
          const response = await fetch(file.url, { credentials: 'omit' });
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          
          const blob = await response.blob();
          
          // 프로젝트별로 폴더를 만들어서 파일 추가
          const folderPath = file.folder ? `${file.folder}/` : '';
          const filePath = `${folderPath}${file.filename}`;
          
          zip.file(filePath, blob);
          successCount++;
        } catch (err) {
          console.error(`[ProjectsBoard] Failed to download ${file.filename}:`, err);
          failCount++;
        }
      }

      if (successCount === 0) {
        toast.dismiss(loadingToast);
        toast.error('모든 파일 다운로드에 실패했습니다', {
          description: '파일 경로 또는 권한을 확인하세요.',
        });
        return;
      }

      // ZIP 파일 생성
      toast.dismiss(loadingToast);
      const generatingToast = toast.loading('ZIP 파일 생성 중...', {
        description: '잠시만 기다려주세요',
      });

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      
      // ZIP 파일 다운로드
      const zipUrl = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = zipUrl;
      a.download = `projects-files-${new Date().toISOString().split('T')[0]}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(zipUrl);

      toast.dismiss(generatingToast);
      
      // 결과 표시
      if (failCount > 0) {
        toast.success(`${successCount}개의 파일을 ZIP으로 압축했습니다`, {
          description: `${failCount}개 파일 다운로드 실패`,
          duration: 4000,
        });
      } else {
        toast.success(`${successCount}개의 파일을 ZIP으로 압축했습니다`, {
          duration: 3000,
        });
      }
    } catch (err) {
      toast.dismiss(loadingToast);
      console.error('[ProjectsBoard] ZIP creation error:', err);
      toast.error('ZIP 파일 생성에 실패했습니다', {
        description: err instanceof Error ? err.message : '알 수 없는 오류',
      });
    }
  };

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-gray-800 rounded-lg md:rounded-xl p-4 md:p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex-1 min-w-0">
          <h1 className="text-gray-900 dark:text-white mb-1 md:mb-2">내 프로젝트 모아보기</h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm md:text-base">Nexter에서 추가한 프로젝트를 한눈에 확인하세요</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleBulkDownload}
            variant="default"
            className="rounded-lg"
          >
            <Download className="w-4 h-4 mr-2" />
            전체 파일 다운로드
          </Button>
          <Button
            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            variant="outline"
            className="rounded-lg"
          >
            {viewMode === 'grid' ? <List className="w-4 h-4 mr-2" /> : <Grid3x3 className="w-4 h-4 mr-2" />}
            {viewMode === 'grid' ? '리스트 보기' : '그리드 보기'}
          </Button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        <Button
          variant={filterType === 'all' ? 'default' : 'outline'}
          onClick={() => setFilterType('all')}
          className="rounded-lg whitespace-nowrap"
        >
          <Filter className="w-4 h-4 mr-2" />
          모든 항목 ({projects.length})
        </Button>
        <Button
          variant={filterType === 'files' ? 'default' : 'outline'}
          onClick={() => setFilesDialogOpen(true)}
          className="rounded-lg whitespace-nowrap"
        >
          <FileText className="w-4 h-4 mr-2" />
          파일만 ({projects.filter(p => p.type === 'file').length})
        </Button>
        <Button
          variant={filterType === 'links' ? 'default' : 'outline'}
          onClick={() => setFilterType('links')}
          className="rounded-lg whitespace-nowrap"
        >
          <Link2 className="w-4 h-4 mr-2" />
          링크만 ({projects.filter(p => p.type === 'link').length})
        </Button>
      </div>

      {/* Projects Grid/List */}
      {filteredProjects.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-12 md:p-16 text-center border border-gray-200 dark:border-gray-700">
          <Sparkles className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-4 text-gray-400 dark:text-gray-500" />
          <h3 className="text-gray-900 dark:text-white mb-2">프로젝트가 없습니다</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Nexter 페이지에서 프로젝트를 추가해보세요
          </p>
        </div>
      ) : (
        <div className={viewMode === 'grid' 
          ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6" 
          : "space-y-4"
        }>
          {filteredProjects.map((project) => (
            <ProjectCard key={project.id} project={project} onProjectClick={handleProjectClick} />
          ))}
        </div>
      )}

      {/* Files Dialog */}
      <Dialog open={filesDialogOpen} onOpenChange={setFilesDialogOpen}>
        <DialogContent className="max-w-5xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>파일 모음</DialogTitle>
            <DialogDescription>
              모든 프로젝트의 이미지, PDF, DOCX 파일을 확인하고 다운로드하세요
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-hidden flex gap-4">
            {/* 파일 목록 */}
            <div className={`${selectedFileForView ? 'w-1/2' : 'w-full'} overflow-y-auto space-y-4 pr-2 transition-all`}>
              {allFiles.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    저장된 파일이 없습니다
                  </p>
                </div>
              ) : (
                <>
                  {/* 전체 선택 */}
                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg sticky top-0 z-10">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={selectedFiles.size === allFiles.length && allFiles.length > 0}
                        onCheckedChange={toggleSelectAll}
                        id="select-all"
                      />
                      <label htmlFor="select-all" className="text-sm cursor-pointer">
                        전체 선택 ({selectedFiles.size}/{allFiles.length})
                      </label>
                    </div>
                    <Button
                      onClick={handleFilesDownload}
                      disabled={selectedFiles.size === 0}
                      size="sm"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      선택 다운로드
                    </Button>
                  </div>

                  {/* 이미지 파일 */}
                  {imageFiles.length > 0 && (
                    <div>
                      <h3 className="text-sm mb-2 text-gray-700 dark:text-gray-300 flex items-center gap-2">
                        <Image className="w-4 h-4" />
                        이미지 ({imageFiles.length})
                      </h3>
                      <div className="space-y-2">
                        {imageFiles.map(file => (
                          <div 
                            key={file.id} 
                            className={`flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer ${
                              selectedFileForView === file.id 
                                ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700' 
                                : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750'
                            }`}
                            onClick={(event: MouseEvent<HTMLDivElement>) => handleFileClick(file.id, event)}
                          >
                            <Checkbox
                              checked={selectedFiles.has(file.id)}
                              onCheckedChange={() => toggleFileSelection(file.id)}
                              id={file.id}
                              onClick={(event: MouseEvent<HTMLButtonElement>) => event.stopPropagation()}
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm truncate">{file.name}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                프로젝트: {file.projectTitle}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* PDF 파일 */}
                  {pdfFiles.length > 0 && (
                    <div>
                      <h3 className="text-sm mb-2 text-gray-700 dark:text-gray-300 flex items-center gap-2">
                        <File className="w-4 h-4" />
                        PDF ({pdfFiles.length})
                      </h3>
                      <div className="space-y-2">
                        {pdfFiles.map(file => (
                          <div 
                            key={file.id} 
                            className={`flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer ${
                              selectedFileForView === file.id 
                                ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700' 
                                : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750'
                            }`}
                            onClick={(event: MouseEvent<HTMLDivElement>) => handleFileClick(file.id, event)}
                          >
                            <Checkbox
                              checked={selectedFiles.has(file.id)}
                              onCheckedChange={() => toggleFileSelection(file.id)}
                              id={file.id}
                              onClick={(event: MouseEvent<HTMLButtonElement>) => event.stopPropagation()}
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm truncate">{file.name}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                프로젝트: {file.projectTitle}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* DOCX 파일 */}
                  {docxFiles.length > 0 && (
                    <div>
                      <h3 className="text-sm mb-2 text-gray-700 dark:text-gray-300 flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        DOCX ({docxFiles.length})
                      </h3>
                      <div className="space-y-2">
                        {docxFiles.map(file => (
                          <div 
                            key={file.id} 
                            className={`flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer ${
                              selectedFileForView === file.id 
                                ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700' 
                                : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750'
                            }`}
                            onClick={(event: MouseEvent<HTMLDivElement>) => handleFileClick(file.id, event)}
                          >
                            <Checkbox
                              checked={selectedFiles.has(file.id)}
                              onCheckedChange={() => toggleFileSelection(file.id)}
                              id={file.id}
                              onClick={(event: MouseEvent<HTMLButtonElement>) => event.stopPropagation()}
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm truncate">{file.name}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                프로젝트: {file.projectTitle}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* 프로젝트 상세 정보 */}
            {selectedFileForView && selectedProject && (
              <div className="w-1/2 overflow-y-auto border-l pl-4 space-y-4">
                <div className="flex items-center justify-between sticky top-0 bg-white dark:bg-gray-900 pb-3 z-10">
                  <h3 className="text-sm text-gray-700 dark:text-gray-300">프로젝트 정보</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedFileForView(null)}
                    className="h-6 w-6 p-0"
                  >
                    ✕
                  </Button>
                </div>

                <Card className="overflow-hidden">
                  {/* Project Header */}
                  <div className={`bg-gradient-to-br ${selectedProject.gradient} p-4 relative overflow-hidden`}>
                    <div className="absolute inset-0 bg-black/5"></div>
                    <div className="relative z-10">
                      <div className="flex items-center gap-3 mb-2">
                        {selectedProject.icon && <selectedProject.icon className="w-8 h-8 text-white/90" />}
                        <h3 className="text-white">{selectedProject.title}</h3>
                      </div>
                      <p className="text-white/80 text-sm">{selectedProject.category}</p>
                    </div>
                  </div>

                  <CardContent className="p-4 space-y-4">
                    {/* Summary */}
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">요약</p>
                      <p className="text-sm">{selectedProject.summary}</p>
                    </div>

                    {/* Source URL */}
                    {selectedProject.sourceUrl && (
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">파일명</p>
                        <p className="text-sm bg-gray-50 dark:bg-gray-800 p-2 rounded border border-gray-200 dark:border-gray-700 break-all">
                          {selectedProject.sourceUrl}
                        </p>
                      </div>
                    )}

                    {/* Tags */}
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">태그</p>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedProject.tags.map((tag) => (
                          <Badge key={tag} variant="outline" className="rounded-lg text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Type */}
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">타입</p>
                      <Badge variant="secondary" className="rounded-lg">
                        {selectedProject.type === 'file' ? '📄 파일' : selectedProject.type === 'link' ? '🔗 링크' : '✨ AI 프로젝트'}
                      </Badge>
                    </div>

                    {/* Download Buttons (always visible) */}
                    <div className="space-y-2">
                      <Button
                        onClick={() => {
                          // 1) sourceUrl 우선, 2) files[0], 3) 없으면 오류
                          const filesArr = Array.isArray((selectedProject as any).files)
                            ? ((selectedProject as any).files as Array<{ name: string; url: string }>)
                            : [];
                          // files[0] 우선, 없으면 sourceUrl
                          const candidateUrl = filesArr[0]?.url
                            ? (/^https?:\/\//i.test(filesArr[0].url) ? filesArr[0].url : `${(import.meta as any).env?.VITE_PROJECT_FILES_BASE_URL || '/files/'}${filesArr[0].url}`).replace(/([^:]\/)\/+/g, '$1')
                            : (selectedProject.sourceUrl
                                ? (/^https?:\/\//i.test(selectedProject.sourceUrl!) ? selectedProject.sourceUrl! : `${(import.meta as any).env?.VITE_PROJECT_FILES_BASE_URL || '/files/'}${selectedProject.sourceUrl!}`).replace(/([^:]\/)\/+/g, '$1')
                                : null);
                          const filename = filesArr[0]?.name || filesArr[0]?.url?.split('/').pop() || (selectedProject.sourceUrl ? selectedProject.sourceUrl!.split('/').pop() : 'file') || 'file';
                          if (!candidateUrl) {
                            toast.error('다운로드할 파일이 없습니다');
                            return;
                          }
                          void (async () => {
                            try {
                              const res = await fetch(candidateUrl, { credentials: 'omit' });
                              if (!res.ok) throw new Error(`HTTP ${res.status}`);
                              const blob = await res.blob();
                              const objectUrl = URL.createObjectURL(blob);
                              const a = document.createElement('a');
                              a.href = objectUrl;
                              a.download = filename!;
                              document.body.appendChild(a);
                              a.click();
                              document.body.removeChild(a);
                              URL.revokeObjectURL(objectUrl);
                              toast.success('파일을 다운로드했습니다');
                            } catch (err) {
                              console.error('[ProjectsBoard] single download error:', err);
                              toast.error('파일을 다운로드할 수 없습니다', { description: '파일 경로 또는 권한을 확인하세요.' });
                            }
                          })();
                        }}
                        className="w-full"
                        size="sm"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        파일 다운로드
                      </Button>
                      {/* files 배열이 있는 경우 목록도 그대로 유지 */}
                      {Array.isArray((selectedProject as any).files) && !selectedProject.sourceUrl && (
                        <div className="space-y-2">
                          {((selectedProject as any).files as Array<{ name: string; url: string }>).map((f) => (
                            <div key={f.url} className="flex items-center justify-between gap-2">
                              <span className="text-sm truncate">{f.name || f.url}</span>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  const url = (/^https?:\/\//i.test(f.url) ? f.url : `${(import.meta as any).env?.VITE_PROJECT_FILES_BASE_URL || '/files/'}${f.url}`).replace(/([^:]\/)\/+/g, '$1');
                                  const filename = f.name || f.url.split('/').pop() || 'file';
                                  void (async () => {
                                    try {
                                      const res = await fetch(url, { credentials: 'omit' });
                                      if (!res.ok) throw new Error(`HTTP ${res.status}`);
                                      const blob = await res.blob();
                                      const objectUrl = URL.createObjectURL(blob);
                                      const a = document.createElement('a');
                                      a.href = objectUrl;
                                      a.download = filename;
                                      document.body.appendChild(a);
                                      a.click();
                                      document.body.removeChild(a);
                                      URL.revokeObjectURL(objectUrl);
                                      toast.success('파일을 다운로드했습니다');
                                    } catch (err) {
                                      console.error('[ProjectsBoard] single download error:', err);
                                      toast.error('파일을 다운로드할 수 없습니다', { description: '파일 경로 또는 권한을 확인하세요.' });
                                    }
                                  })();
                                }}
                              >
                                <Download className="w-4 h-4 mr-2" />
                                다운로드
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>

          {/* Footer close button removed; use top-right X to close */}
        </DialogContent>
      </Dialog>

      {/* Edit Project Dialog */}
      <EditProjectDialog
        open={isEditDialogOpen}
        project={projectToEdit}
        onClose={() => {
          setIsEditDialogOpen(false);
          setProjectToEdit(null);
        }}
        onSave={handleSaveProject}
        availableCategories={availableCategories}
        onOrganizeWithAI={handleOrganizeWithAI}
      />
    </div>
  );
}