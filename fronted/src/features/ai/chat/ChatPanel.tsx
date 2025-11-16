import { ChangeEvent, KeyboardEvent, useEffect, useRef } from 'react';

import type { Project } from '@/entities/project';
import type { AssistantMessage } from './types';

import { Bot, Loader2, MessageSquare, RotateCcw, Send, User, Plus, Check, Download } from 'lucide-react';

import { Button } from '@/shared/ui/shadcn/button';
import { Textarea } from '@/shared/ui/shadcn/textarea';

interface ChatPanelProps {
  messages: AssistantMessage[];
  selectedProject: Project | null;
  inputValue: string;
  onInputChange: (value: string) => void;
  onSend: () => void | Promise<void>;
  isGenerating: boolean;
  onResetChat: () => void | Promise<void>;
  onFileUpload?: (event: ChangeEvent<HTMLInputElement>) => void; // 파일 업로드 기능이 있을 때만 사용
  onSaveProjectOrganizing?: (projectId: number | string) => void | Promise<void>; // 프로젝트 관리 기능이 있을 때만 사용
  onContinueOrganizing?: () => void; // 프로젝트 관리 기능이 있을 때만 사용
  onOpenProjectUpload?: () => void; // 프로젝트 관리 기능이 있을 때만 사용
}

export function ChatPanel({
  messages,
  selectedProject,
  inputValue,
  onInputChange,
  onSend,
  onFileUpload,
  isGenerating,
  onSaveProjectOrganizing,
  onContinueOrganizing,
  onResetChat,
  onOpenProjectUpload,
}: ChatPanelProps) {
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const bottomAnchorRef = useRef<HTMLDivElement | null>(null);

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      onSend();
    }
  };

  // 새 메시지가 추가되거나 생성 상태가 바뀔 때, 최신 메시지가 보이도록 스크롤을 바닥으로 이동
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    // 즉시 스크롤
    container.scrollTop = container.scrollHeight;
    // 앵커가 있을 경우 보장 스크롤
    bottomAnchorRef.current?.scrollIntoView({ block: 'end' });
  }, [messages.length, isGenerating]);

  const computeBubbleWidthClass = (role: 'ai' | 'user') => {
    // 콘텐츠 길이에 따라 자동으로 늘어나되, 역할별 최대 폭만 제한
    // 사용자: 읽기 편하게 90%까지, AI: 80%까지
    return role === 'user' ? 'max-w-[90%]' : 'max-w-[80%]';
  };

  return (
    <div className="flex-1 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col min-h-0 h-full">
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
          <Button variant="ghost" size="icon" onClick={onResetChat} title="대화 초기화">
            <RotateCcw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-hide">
        {messages.map((message, index) => {
          const timestamp = message.timestamp instanceof Date ? message.timestamp : new Date(message.timestamp);

          return (
            <div
              key={message.id ?? `${message.role}-${index}`}
              className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  message.role === 'ai' ? 'bg-gradient-to-br from-purple-600 to-blue-600' : 'bg-gray-600 dark:bg-gray-400'
                }`}
              >
                {message.role === 'ai' ? <Bot className="w-5 h-5 text-white" /> : <User className="w-5 h-5 text-white" />}
              </div>
              <div className={`flex-1 ${message.role === 'user' ? 'flex justify-end' : ''}`}>
                <div>
                  <div
                    className={`inline-block w-fit ${computeBubbleWidthClass(message.role as 'ai' | 'user')} min-w-[80px] break-words rounded-2xl px-4 py-3 ${
                      message.role === 'ai'
                        ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                        : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                    }`}
                  >
                    {message.image && <img src={message.image} alt="uploaded" className="max-w-full rounded-lg mb-2" />}
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    <p className="text-xs mt-2 opacity-70">
                      {timestamp.toLocaleTimeString('ko-KR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>

                  {message.role === 'ai' &&
                    message.isProjectOrganizing &&
                    message.projectId &&
                    onContinueOrganizing &&
                    onSaveProjectOrganizing && (
                      <div className="mt-2 flex gap-2">
                        <Button onClick={onContinueOrganizing} variant="outline" size="sm" className="rounded-lg">
                          <MessageSquare className="w-3 h-3 mr-1" />
                          더 대화하기
                        </Button>
                        <Button
                          onClick={() => void onSaveProjectOrganizing(message.projectId!)}
                          size="sm"
                          className="rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                        >
                          <Check className="w-3 h-3 mr-1" />
                          저장하기
                        </Button>
                      </div>
                    )}

                  {message.role === 'ai' && message.action === 'registerProject' && onOpenProjectUpload && (
                    <div className="mt-3">
                      <Button
                        onClick={onOpenProjectUpload}
                        className="rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                      >
                        프로젝트 등록하기
                      </Button>
                    </div>
                  )}

                  {message.role === 'ai' && message.url && message.filename && (
                    <div className="mt-3">
                      <Button
                        onClick={() => {
                          window.open(message.url, '_blank');
                        }}
                        className="rounded-lg bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        {message.filename} 다운로드
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}

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
        <div ref={bottomAnchorRef} />
      </div>

      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex gap-2">
          <input
            type="file"
            id="chat-file-upload"
            className="hidden"
            accept="image/*,.pdf,.doc,.docx"
            onChange={onFileUpload}
          />
          {onFileUpload && (
            <Button
              variant="outline"
              size="icon"
              onClick={() => document.getElementById('chat-file-upload')?.click()}
              className="flex-shrink-0"
            >
              <Plus className="w-4 h-4" />
            </Button>
          )}
          <Textarea
            placeholder={
              selectedProject ? `"${selectedProject.title}" 프로젝트에 대해 질문하세요...` : 'Nexter에게 질문하세요...'
            }
            value={inputValue}
            onChange={(event) => onInputChange(event.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 min-h-[44px] max-h-32 resize-none"
          />
          <Button
            onClick={onSend}
            disabled={!inputValue.trim() || isGenerating}
            className="flex-shrink-0 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

