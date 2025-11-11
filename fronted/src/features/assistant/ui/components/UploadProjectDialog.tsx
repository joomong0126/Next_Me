import { useState } from 'react';

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/shared/ui/shadcn/dialog';
import { Button } from '@/shared/ui/shadcn/button';
import { Input } from '@/shared/ui/shadcn/input';
import { Textarea } from '@/shared/ui/shadcn/textarea';

import { FileText, Link2, Upload } from 'lucide-react';

type UploadType = 'image' | 'document' | 'pdf' | 'link' | 'text' | null;

interface UploadProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onFileSelected: (file: File) => void;
  onLinkSubmit: (url: string) => void;
  onTextSubmit: (payload: { title: string; content: string }) => void;
}

export function UploadProjectDialog({
  open,
  onOpenChange,
  onFileSelected,
  onLinkSubmit,
  onTextSubmit,
}: UploadProjectDialogProps) {
  const [uploadType, setUploadType] = useState<UploadType>(null);
  const [linkUrl, setLinkUrl] = useState('');
  const [textTitle, setTextTitle] = useState('');
  const [textInput, setTextInput] = useState('');

  const handleReset = () => {
    setUploadType(null);
    setLinkUrl('');
    setTextInput('');
    setTextTitle('');
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      handleReset();
    }
    onOpenChange(nextOpen);
  };

  const handleLinkSubmit = () => {
    onLinkSubmit(linkUrl);
    handleReset();
  };

  const handleTextSubmit = () => {
    onTextSubmit({ title: textTitle, content: textInput });
    handleReset();
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>프로젝트 등록</DialogTitle>
          <DialogDescription>프로젝트를 등록할 방법을 선택하세요</DialogDescription>
        </DialogHeader>

        {!uploadType ? (
          <div className="grid grid-cols-3 gap-4 py-4">
            <Button variant="outline" className="h-auto py-6 flex flex-col gap-2" onClick={() => setUploadType('image')}>
              <Upload className="w-8 h-8" />
              <span className="text-sm">이미지</span>
            </Button>
            <Button variant="outline" className="h-auto py-6 flex flex-col gap-2" onClick={() => setUploadType('document')}>
              <FileText className="w-8 h-8" />
              <span className="text-sm">문서</span>
            </Button>
            <Button variant="outline" className="h-auto py-6 flex flex-col gap-2" onClick={() => setUploadType('pdf')}>
              <FileText className="w-8 h-8" />
              <span className="text-sm">PDF</span>
            </Button>
            <Button variant="outline" className="h-auto py-6 flex flex-col gap-2 col-span-3" onClick={() => setUploadType('link')}>
              <Link2 className="w-8 h-8" />
              <span className="text-sm">링크</span>
            </Button>
            <Button variant="outline" className="h-auto py-6 flex flex-col gap-2 col-span-3" onClick={() => setUploadType('text')}>
              <FileText className="w-8 h-8" />
              <span className="text-sm">텍스트</span>
            </Button>
          </div>
        ) : uploadType === 'link' ? (
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm mb-2 block">링크 URL</label>
              <Input placeholder="https://..." value={linkUrl} onChange={(event) => setLinkUrl(event.target.value)} />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleReset} className="flex-1">
                뒤로
              </Button>
              <Button onClick={handleLinkSubmit} className="flex-1">
                등록
              </Button>
            </div>
          </div>
        ) : uploadType === 'text' ? (
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm mb-2 block">프로젝트 제목</label>
              <Input value={textTitle} onChange={(event) => setTextTitle(event.target.value)} placeholder="프로젝트 제목" />
            </div>
            <div>
              <label className="text-sm mb-2 block">프로젝트 내용</label>
              <Textarea value={textInput} onChange={(event) => setTextInput(event.target.value)} placeholder="프로젝트 내용" rows={4} />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleReset} className="flex-1">
                뒤로
              </Button>
              <Button onClick={handleTextSubmit} className="flex-1">
                등록
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
              <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">파일을 드래그하거나 클릭하여 업로드하세요</p>
              <input
                type="file"
                id="file-upload"
                className="hidden"
                accept={uploadType === 'image' ? 'image/*' : uploadType === 'pdf' ? '.pdf' : '.doc,.docx,.txt'}
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) {
                    onFileSelected(file);
                    handleReset();
                  }
                }}
              />
              <Button onClick={() => document.getElementById('file-upload')?.click()}>파일 선택</Button>
            </div>
            <Button variant="outline" onClick={handleReset} className="w-full">
              뒤로
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}


