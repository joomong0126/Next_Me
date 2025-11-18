import { useState } from 'react';

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/shared/ui/shadcn/dialog';
import { Button } from '@/shared/ui/shadcn/button';
import { Input } from '@/shared/ui/shadcn/input';

import { FileText, Link2, Upload, X, File } from 'lucide-react';

type UploadType = 'image' | 'document' | 'pdf' | 'link' | null;

interface UploadProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onFileSelected: (file: File) => void;
  onLinkSubmit: (url: string) => void;
}

export function UploadProjectDialog({
  open,
  onOpenChange,
  onFileSelected,
  onLinkSubmit,
}: UploadProjectDialogProps) {
  const [uploadType, setUploadType] = useState<UploadType>(null);
  const [linkUrl, setLinkUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleReset = () => {
    setUploadType(null);
    setLinkUrl('');
    setSelectedFile(null);
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

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleFileSubmit = () => {
    if (selectedFile) {
      onFileSelected(selectedFile);
      handleReset();
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    // Reset file input
    const fileInput = document.getElementById('file-upload') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
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
        ) : (
          <div className="space-y-4 py-4">
            {!selectedFile ? (
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
                <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">파일을 드래그하거나 클릭하여 업로드하세요</p>
                <input
                  type="file"
                  id="file-upload"
                  className="hidden"
                  accept={uploadType === 'image' ? 'image/*' : uploadType === 'pdf' ? '.pdf' : '.doc,.docx,.txt'}
                  onChange={handleFileChange}
                />
                <Button onClick={() => document.getElementById('file-upload')?.click()}>파일 선택</Button>
              </div>
            ) : (
              <div className="border-2 border-gray-300 dark:border-gray-600 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <File className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{selectedFile.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{formatFileSize(selectedFile.size)}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="flex-shrink-0"
                    onClick={handleRemoveFile}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleReset} className="flex-1">
                뒤로
              </Button>
              {selectedFile && (
                <Button onClick={handleFileSubmit} className="flex-1">
                  업로드
                </Button>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}


