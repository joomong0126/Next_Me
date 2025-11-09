import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/shared/ui/shadcn/dialog';
import { Button } from '@/shared/ui/shadcn/button';
import { Input } from '@/shared/ui/shadcn/input';
import { Textarea } from '@/shared/ui/shadcn/textarea';
import { Label } from '@/shared/ui/shadcn/label';
import { Upload, MessageSquare, Sparkles, FileText, Send, X, File, Image as ImageIcon, Link as LinkIcon, Plus } from 'lucide-react';
import { Badge } from '@/shared/ui/shadcn/badge';
import { ScrollArea } from '@/shared/ui/shadcn/scroll-area';

interface UploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Step = 'upload' | 'chat';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function UploadDialog({ open, onOpenChange }: UploadDialogProps) {
  const [step, setStep] = useState<Step>('upload');
  const [projectTitle, setProjectTitle] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [links, setLinks] = useState<string[]>([]);
  const [linkInput, setLinkInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      setUploadedFiles([...uploadedFiles, ...Array.from(files)]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files) {
      setUploadedFiles([...uploadedFiles, ...Array.from(files)]);
    }
  };

  const handleRemoveFile = (index: number) => {
    setUploadedFiles(uploadedFiles.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(ext || '')) {
      return <ImageIcon className="w-5 h-5" />;
    }
    return <File className="w-5 h-5" />;
  };

  const handleAddLink = () => {
    const trimmedLink = linkInput.trim();
    if (!trimmedLink) return;

    try {
      new URL(trimmedLink.startsWith('http') ? trimmedLink : `https://${trimmedLink}`);
      setLinks([...links, trimmedLink]);
      setLinkInput('');
    } catch {
      alert('올바른 URL을 입력해주세요.');
    }
  };

  const handleRemoveLink = (index: number) => {
    setLinks(links.filter((_, i) => i !== index));
  };

  const handleUpload = () => {
    if (!projectTitle.trim()) return;

    let attachmentInfo = '';

    if (uploadedFiles.length > 0) {
      attachmentInfo += `\n\n업로드된 파일: ${uploadedFiles.map((f) => f.name).join(', ')}`;
    }

    if (links.length > 0) {
      attachmentInfo += `\n\n첨부된 링크: ${links.join(', ')}`;
    }

    const initialMessage: Message = {
      role: 'assistant',
      content: `안녕하세요! "${projectTitle}" 프로젝트를 업로드하셨네요.${attachmentInfo}\n\n이 프로젝트에 대해 더 자세히 알려주시면, 역량 분석과 인사이트를 제공해드리겠습니다. 어떤 점이 궁금하신가요?`,
    };

    setMessages([initialMessage]);
    setStep('chat');
  };

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      role: 'user',
      content: inputMessage,
    };

    setMessages([...messages, userMessage]);

    setTimeout(() => {
      const aiResponse: Message = {
        role: 'assistant',
        content: generateAIResponse(inputMessage),
      };
      setMessages((prev) => [...prev, aiResponse]);
    }, 500);

    setInputMessage('');
  };

  const generateAIResponse = (userInput: string): string => {
    const responses = [
      `"${projectTitle}" 프로젝트에서 ${projectDescription ? '귀하가 설명하신 내용을 바탕으로' : ''} 다음과 같은 핵심 역량을 발견했습니다:\n\n• 문제 해결 능력\n• 프로젝트 기획 및 실행력\n• 기술적 구현 능력\n\n이러한 역량들은 프로덕트 매니저, 소프트웨어 엔지니어 포지션에 적합합니다.`,
      `좋은 질문이네요! 이 프로젝트의 강점은 다음과 같습니다:\n\n1. 사용자 중심 사고\n2. 데이터 기반 의사결정\n3. 협업 및 커뮤니케이션 능력\n\n이력서에 추가하시면 좋을 것 같습니다.`,
      `프로젝트 분석 결과, 다음 스킬들을 보완하시면 좋을 것 같습니다:\n\n• UX/UI 디자인 이해도\n• 데이터 분석 도구 활용\n• 애자일 방법론\n\n관련 온라인 강의나 사이드 프로젝트를 추천드립니다.`,
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  };

  const handleReset = () => {
    setStep('upload');
    setProjectTitle('');
    setProjectDescription('');
    setMessages([]);
    setInputMessage('');
    setUploadedFiles([]);
    setLinks([]);
    setLinkInput('');
    setIsDragging(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] p-0 gap-0 overflow-hidden">
        <DialogHeader className="p-6 pb-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {step === 'upload' ? (
                <>
                  <div className="p-2 bg-gray-900 dark:bg-white rounded-xl">
                    <Upload className="w-5 h-5 text-white dark:text-gray-900" />
                  </div>
                  <DialogTitle className="text-xl">빠른 프로젝트 추가</DialogTitle>
                </>
              ) : (
                <>
                  <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <DialogTitle className="text-xl">AI 분석 & 대화</DialogTitle>
                </>
              )}
            </div>
            <Badge variant="secondary" className="rounded-lg">
              {step === 'upload' ? '1/2' : '2/2'}
            </Badge>
          </div>
          <DialogDescription className="sr-only">
            {step === 'upload'
              ? '프로젝트 정보를 입력하고 AI와 대화를 시작하세요'
              : 'AI와 프로젝트에 대해 대화하며 인사이트를 얻으세요'}
          </DialogDescription>
        </DialogHeader>

        {step === 'upload' ? (
          <div className="p-6 space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">프로젝트 제목 *</Label>
                <Input
                  id="title"
                  placeholder="예: 쇼핑몰 리뉴얼 프로젝트"
                  value={projectTitle}
                  onChange={(e) => setProjectTitle(e.target.value)}
                  className="h-12 rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">프로젝트 설명</Label>
                <Textarea
                  id="description"
                  placeholder="프로젝트에 대해 간단히 설명해주세요. AI가 더 정확한 분석을 제공합니다."
                  value={projectDescription}
                  onChange={(e) => setProjectDescription(e.target.value)}
                  className="min-h-32 rounded-xl resize-none"
                />
              </div>

              <div className="space-y-2">
                <Label>프로젝트 파일 (선택사항)</Label>
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                    isDragging
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30'
                      : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                    accept="image/*,.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.zip"
                  />
                  <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400 dark:text-gray-500" />
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    파일을 드래그하거나 클릭하여 업로드
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    className="rounded-lg"
                  >
                    파일 선택
                  </Button>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-3">
                    이미지, PDF, 문서, 프레젠테이션 등
                  </p>
                </div>
              </div>

              {uploadedFiles.length > 0 && (
                <div className="space-y-2">
                  <Label>업로드된 파일 ({uploadedFiles.length})</Label>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {uploadedFiles.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                      >
                        <div className="text-gray-600 dark:text-gray-400">{getFileIcon(file.name)}</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm truncate text-gray-900 dark:text-white">{file.name}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{formatFileSize(file.size)}</p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveFile(index)}
                          className="h-8 w-8 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-600 dark:hover:text-red-400"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="link-input">링크 추가 (선택사항)</Label>
                <div className="flex gap-2">
                  <Input
                    id="link-input"
                    placeholder="https://example.com 또는 example.com"
                    value={linkInput}
                    onChange={(e) => setLinkInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddLink()}
                    className="h-11 rounded-xl"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={handleAddLink}
                    disabled={!linkInput.trim()}
                    className="h-11 w-11 rounded-xl"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {links.length > 0 && (
                <div className="space-y-2">
                  <Label>첨부된 링크 ({links.length})</Label>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {links.map((link, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                      >
                        <div className="text-gray-600 dark:text-gray-400">
                          <LinkIcon className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm truncate text-gray-900 dark:text-white">{link}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">웹 링크</p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveLink(index)}
                          className="h-8 w-8 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-600 dark:hover:text-red-400"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-xl border border-blue-200 dark:border-blue-800">
                <div className="flex gap-3">
                  <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-sm text-blue-900 dark:text-blue-100">파일과 링크는 선택사항입니다</p>
                    <p className="text-xs text-blue-700 dark:text-blue-300">
                      제목과 설명만으로도 AI가 프로젝트를 분석하고 인사이트를 제공합니다. 프로젝트 관련 URL이나 포트폴리오 링크를 추가하면 더 풍부한 분석이 가능합니다.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1 h-12 rounded-xl">
                취소
              </Button>
              <Button
                onClick={handleUpload}
                disabled={!projectTitle.trim()}
                className="flex-1 h-12 rounded-xl bg-gray-900 dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-100 text-white dark:text-gray-900"
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                AI와 대화 시작
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col h-[500px]">
            <ScrollArea className="flex-1 p-6">
              <div className="space-y-4">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {message.role === 'assistant' && (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center flex-shrink-0">
                        <Sparkles className="w-4 h-4 text-white" />
                      </div>
                    )}
                    <div
                      className={`max-w-[80%] p-4 rounded-2xl ${
                        message.role === 'user'
                          ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    </div>
                    {message.role === 'user' && (
                      <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center flex-shrink-0 text-xs">
                        나
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className="p-6 pt-4 border-t border-gray-200 dark:border-gray-700 space-y-3">
              <div className="flex gap-2">
                <Input
                  placeholder="프로젝트에 대해 질문하거나 인사이트를 요청하세요..."
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  className="flex-1 h-12 rounded-xl"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim()}
                  size="icon"
                  className="h-12 w-12 rounded-xl bg-gray-900 dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-100 text-white dark:text-gray-900"
                >
                  <Send className="w-5 h-5" />
                </Button>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleReset} className="rounded-lg text-xs">
                  새 프로젝트 추가
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onOpenChange(false)}
                  className="rounded-lg text-xs"
                >
                  완료
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

