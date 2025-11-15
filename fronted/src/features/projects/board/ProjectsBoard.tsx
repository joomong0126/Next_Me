import { useState, MouseEvent } from 'react';
import { Card, CardContent, CardDescription, CardHeader } from '@/shared/ui/shadcn/card';
import { Button } from '@/shared/ui/shadcn/button';
import { Badge } from '@/shared/ui/shadcn/badge';
import { FileText, Link2, Sparkles, Download, ExternalLink, Grid3x3, List, Filter, Image, File, CheckSquare, Square } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/shared/ui/shadcn/dialog';
import { Checkbox } from '@/shared/ui/shadcn/checkbox';
import type { Project } from '@/entities/project';

interface ProjectsBoardProps {
  projects: Project[];
}

type FilterType = 'all' | 'files' | 'links' | 'projects';

function ProjectCard({ project, onProjectClick }: { project: Project; onProjectClick: (project: Project) => void }) {
  const Icon = project.icon;
  const TypeIcon = project.type === 'file' ? FileText : project.type === 'link' ? Link2 : Sparkles;

  const handleDownload = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (project.type === 'file' && project.sourceUrl) {
      const fileContent = `프로젝트: ${project.title}\n카테고리: ${project.category}\n요약: ${project.summary}\n태그: ${project.tags.join(', ')}\n\n이 파일은 Next ME에서 생성된 샘플 파일입니다.`;
      
      const blob = new Blob([fileContent], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = project.sourceUrl!;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success(`"${project.sourceUrl}" 파일을 다운로드했습니다`, {
        description: '다운로드 폴더를 확인하세요.',
      });
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
        {project.type === 'file' && (
          <Button
            size="sm"
            variant="ghost"
            onClick={handleDownload}
            className="relative z-10 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg bg-white/10 hover:bg-white/20 text-white border-0"
          >
            <Download className="w-4 h-4" />
          </Button>
        )}
        {project.type === 'link' && (
          <Button
            size="sm"
            variant="ghost"
            onClick={handleOpenLink}
            className="relative z-10 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg bg-white/10 hover:bg-white/20 text-white border-0"
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
        {project.sourceUrl && (
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-2">
            {project.type === 'file' ? '📄 ' : '🔗 '}{project.sourceUrl}
          </p>
        )}
      </CardHeader>
      <CardContent className="p-4 md:p-6 pt-0">
        <div className="flex flex-wrap gap-1.5 md:gap-2">
          {project.tags.map((tag) => (
            <Badge key={tag} variant="outline" className="rounded-lg text-xs md:text-sm">
              {tag}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function ProjectsBoard({ projects }: ProjectsBoardProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [filesDialogOpen, setFilesDialogOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [selectedFileForView, setSelectedFileForView] = useState<string | null>(null);
  const [selectedProjectForDetail, setSelectedProjectForDetail] = useState<Project | null>(null);

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
    const files: Array<{ id: string; name: string; type: 'image' | 'pdf' | 'docx'; projectTitle: string; projectId: number }> = [];
    
    projects.forEach(project => {
      if (project.type === 'file' && project.sourceUrl) {
        const fileType = getFileType(project.sourceUrl);
        if (fileType) {
          files.push({
            id: `${project.id}-${project.sourceUrl}`,
            name: project.sourceUrl,
            type: fileType,
            projectTitle: project.title,
            projectId: project.id
          });
        }
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
  const handleFilesDownload = () => {
    if (selectedFiles.size === 0) {
      toast.error('다운로드할 파일을 선택해주세요');
      return;
    }

    const selectedFilesList = allFiles.filter(f => selectedFiles.has(f.id));
    
    selectedFilesList.forEach((file, index) => {
      setTimeout(() => {
        const fileContent = `프로젝트: ${file.projectTitle}\\n파일명: ${file.name}\\n\\n이 파일은 Next ME에서 생성된 샘플 파일입니다.`;
        const blob = new Blob([fileContent], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = file.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, index * 100); // 순차적으로 다운로드
    });

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

  // 일괄 다운로드 함수
  const handleBulkDownload = () => {
    if (projects.length === 0) {
      toast.error('다운로드할 프로젝트가 없습니다');
      return;
    }

    // 모든 프로젝트 정보를 하나의 텍스트 파일로 생성
    let fileContent = `Next ME - 프로젝트 일괄 다운로드\\n`;
    fileContent += `생성일: ${new Date().toLocaleString('ko-KR')}\\n`;
    fileContent += `총 프로젝트 수: ${projects.length}\\n`;
    fileContent += `\\n${'='.repeat(80)}\\n\\n`;

    projects.forEach((project, index) => {
      fileContent += `[${index + 1}] ${project.title}\\n`;
      fileContent += `${'─'.repeat(80)}\\n`;
      fileContent += `카테고리: ${project.category}\\n`;
      fileContent += `타입: ${project.type === 'file' ? '파일' : project.type === 'link' ? '링크' : 'AI 프로젝트'}\\n`;
      if (project.sourceUrl) {
        fileContent += `소스: ${project.sourceUrl}\\n`;
      }
      fileContent += `\\n요약:\\n${project.summary}\\n`;
      fileContent += `\\n태그: ${project.tags.join(', ')}\\n`;
      fileContent += `\\n${'='.repeat(80)}\\n\\n`;
    });

    // 파일 다운로드
    const blob = new Blob([fileContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `NextME_프로젝트_전체_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success(`${projects.length}개의 프로젝트를 다운로드했습니다`, {
      description: '다운로드 폴더를 확인하세요.',
    });
  };

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-gray-800 rounded-lg md:rounded-xl p-4 md:p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex-1 min-w-0">
          <h1 className="text-gray-900 dark:text-white mb-1 md:mb-2">내 프로젝트 모아보기</h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm md:text-base">Nexter에서 추가한 프로젝트를 한눈에 확인하세요</p>
        </div>
        <Button
          onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
          variant="outline"
          className="rounded-lg"
        >
          {viewMode === 'grid' ? <List className="w-4 h-4 mr-2" /> : <Grid3x3 className="w-4 h-4 mr-2" />}
          {viewMode === 'grid' ? '리스트 보기' : '그리드 보기'}
        </Button>
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
            <ProjectCard key={project.id} project={project} onProjectClick={setSelectedProjectForDetail} />
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

                    {/* Download Button */}
                    {selectedProject.type === 'file' && selectedProject.sourceUrl && (
                      <Button
                        onClick={() => {
                          const fileContent = `프로젝트: ${selectedProject.title}\n카테고리: ${selectedProject.category}\n요약: ${selectedProject.summary}\n태그: ${selectedProject.tags.join(', ')}\n\n이 파일은 Next ME에서 생성된 샘플 파일입니다.`;
                          const blob = new Blob([fileContent], { type: 'text/plain;charset=utf-8' });
                          const url = URL.createObjectURL(blob);
                          const link = document.createElement('a');
                          link.href = url;
                          link.download = selectedProject.sourceUrl ?? 'project.txt';
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                          URL.revokeObjectURL(url);
                          toast.success('파일을 다운로드했습니다');
                        }}
                        className="w-full"
                        size="sm"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        파일 다운로드
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </div>

          <div className="flex gap-2 mt-4 border-t pt-4">
            <Button
              onClick={() => {
                setFilesDialogOpen(false);
                setSelectedFileForView(null);
              }}
              variant="outline"
              className="flex-1"
            >
              닫기
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Project Detail Dialog */}
      <Dialog open={selectedProjectForDetail !== null} onOpenChange={(open: boolean) => !open && setSelectedProjectForDetail(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          {selectedProjectForDetail && (
            <>
              <DialogHeader>
                <DialogTitle>프로젝트 상세 정보</DialogTitle>
                <DialogDescription>
                  프로젝트의 전체 정보를 확인하세요
                </DialogDescription>
              </DialogHeader>

              <div className="overflow-y-auto flex-1 min-h-0">
                <Card className="overflow-hidden border-0 shadow-none">
                  {/* Project Header */}
                  <div className={`bg-gradient-to-br ${selectedProjectForDetail.gradient} p-6 relative overflow-hidden`}>
                    <div className="absolute inset-0 bg-black/5"></div>
                    <div className="absolute top-2 right-2 w-16 h-16 bg-white/10 rounded-full blur-xl"></div>
                    <div className="absolute bottom-3 left-3 w-12 h-12 bg-white/10 rounded-full blur-lg"></div>
                    <div className="relative z-10">
                      <div className="flex items-center gap-4 mb-3">
                        {selectedProjectForDetail.icon && (
                          <div className="w-14 h-14 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
                            <selectedProjectForDetail.icon className="w-8 h-8 text-white/90" strokeWidth={1.5} />
                          </div>
                        )}
                        <div className="flex-1">
                          <h3 className="text-white text-xl">{selectedProjectForDetail.title}</h3>
                          <p className="text-white/80">{selectedProjectForDetail.category}</p>
                        </div>
                      </div>
                      <Badge variant="secondary" className="bg-white/20 text-white border-0">
                        {selectedProjectForDetail.type === 'file' ? '📄 파일' : selectedProjectForDetail.type === 'link' ? '🔗 링크' : '✨ AI 프로젝트'}
                      </Badge>
                    </div>
                  </div>

                  <CardContent className="p-6 space-y-6">
                    {/* Summary */}
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">프로젝트 요약</p>
                      <p className="text-sm leading-relaxed">{selectedProjectForDetail.summary}</p>
                    </div>

                    {/* Source URL */}
                    {selectedProjectForDetail.sourceUrl && (
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                          {selectedProjectForDetail.type === 'file' ? '파일명' : '링크 주소'}
                        </p>
                        <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                          <p className="text-sm break-all">{selectedProjectForDetail.sourceUrl}</p>
                        </div>
                      </div>
                    )}

                    {/* Tags */}
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">태그</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedProjectForDetail.tags.map((tag) => (
                          <Badge key={tag} variant="outline" className="rounded-lg">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                      {selectedProjectForDetail.type === 'file' && selectedProjectForDetail.sourceUrl && (
                        <Button
                          onClick={() => {
                            const fileContent = `프로젝트: ${selectedProjectForDetail.title}\\n카테고리: ${selectedProjectForDetail.category}\\n요약: ${selectedProjectForDetail.summary}\\n태그: ${selectedProjectForDetail.tags.join(', ')}\\n\\n이 파일은 Next ME에서 생성된 샘플 파일입니다.`;
                            const blob = new Blob([fileContent], { type: 'text/plain;charset=utf-8' });
                            const url = URL.createObjectURL(blob);
                            const link = document.createElement('a');
                            link.href = url;
                            link.download = selectedProjectForDetail.sourceUrl ?? 'project.txt';
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                            URL.revokeObjectURL(url);
                            toast.success('파일을 다운로드했습니다');
                          }}
                          className="flex-1"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          파일 다운로드
                        </Button>
                      )}
                      {selectedProjectForDetail.type === 'link' && selectedProjectForDetail.sourceUrl && (
                        <Button
                          onClick={() => {
                            const demoUrl = selectedProjectForDetail.sourceUrl!.startsWith('http') 
                              ? selectedProjectForDetail.sourceUrl! 
                              : `https://example.com/${selectedProjectForDetail.sourceUrl}`;
                            window.open(demoUrl, '_blank', 'noopener,noreferrer');
                            toast.success('링크를 새 탭에서 엽니다');
                          }}
                          className="flex-1"
                        >
                          <ExternalLink className="w-4 h-4 mr-2" />
                          링크 열기
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="flex gap-2 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button
                  onClick={() => setSelectedProjectForDetail(null)}
                  variant="outline"
                  className="flex-1"
                >
                  닫기
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}