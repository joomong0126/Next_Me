"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { XIcon } from "lucide-react";

import { cn } from "./utils";

function Dialog({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Root>) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />;
}

function DialogTrigger({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />;
}

function DialogPortal({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Portal>) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />;
}

function DialogClose({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Close>) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />;
}

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => {
  return (
    <DialogPrimitive.Overlay
      ref={ref}
      data-slot="dialog-overlay"
      className={cn(
        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50",
        className,
      )}
      {...props}
    />
  );
});
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

interface DialogContentProps extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> {
  'data-no-drag'?: boolean;
}

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  DialogContentProps
>(({ className, children, 'data-no-drag': noDrag, ...props }, ref) => {
  const contentRef = React.useRef<HTMLDivElement>(null);
  const [isCustomPositioned, setIsCustomPositioned] = React.useState(false);
  const [size, setSize] = React.useState<{ width: number; height: number } | null>(null);
  const [position, setPosition] = React.useState<{ x: number; y: number } | null>(null);
  const [isResizing, setIsResizing] = React.useState(false);
  const [isDragging, setIsDragging] = React.useState(false);
  const resizeStartRef = React.useRef<{ x: number; y: number; width: number; height: number } | null>(null);
  const dragStartRef = React.useRef<{ x: number; y: number; startX: number; startY: number } | null>(null);

  React.useImperativeHandle(ref, () => contentRef.current as HTMLDivElement);

  const handleMouseDownResize = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!contentRef.current) return;
    
    const rect = contentRef.current.getBoundingClientRect();
    setIsResizing(true);
    setIsCustomPositioned(true);
    resizeStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      width: rect.width,
      height: rect.height,
    };
    setSize({ width: rect.width, height: rect.height });
    if (!position) {
      setPosition({ x: rect.left, y: rect.top });
    }
  };

  const handleMouseDownDrag = (e: React.MouseEvent) => {
    // data-no-drag prop이 있으면 드래그 비활성화
    if (noDrag) {
      return;
    }
    
    const target = e.target as HTMLElement;
    
    // 드래그를 시작하지 않아야 하는 요소들
    if (
      target.closest('[data-slot="dialog-close"]') ||
      target.closest('[data-resize-handle]') ||
      target.closest('button') ||
      target.closest('input') ||
      target.closest('textarea') ||
      target.closest('select') ||
      target.closest('a') ||
      target.closest('label') ||
      target.closest('[role="button"]') ||
      target.closest('[role="textbox"]') ||
      target.closest('[contenteditable="true"]') ||
      target.closest('[data-no-drag]')
    ) {
      return;
    }
    
    if (!contentRef.current) return;
    
    const rect = contentRef.current.getBoundingClientRect();
    setIsDragging(true);
    setIsCustomPositioned(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      startX: rect.left,
      startY: rect.top,
    };
    if (!position) {
      setPosition({ x: rect.left, y: rect.top });
    }
    if (!size) {
      setSize({ width: rect.width, height: rect.height });
    }
  };

  React.useEffect(() => {
    if (!isResizing && !isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (isResizing && resizeStartRef.current && size) {
        const deltaX = e.clientX - resizeStartRef.current.x;
        const deltaY = e.clientY - resizeStartRef.current.y;
        const newWidth = Math.max(400, Math.min(window.innerWidth - 40, resizeStartRef.current.width + deltaX));
        const newHeight = Math.max(300, Math.min(window.innerHeight - 40, resizeStartRef.current.height + deltaY));
        setSize({ width: newWidth, height: newHeight });
      } else if (isDragging && dragStartRef.current && position) {
        const deltaX = e.clientX - dragStartRef.current.x;
        const deltaY = e.clientY - dragStartRef.current.y;
        const newX = Math.max(20, Math.min(window.innerWidth - (size?.width || 500) - 20, dragStartRef.current.startX + deltaX));
        const newY = Math.max(20, Math.min(window.innerHeight - (size?.height || 400) - 20, dragStartRef.current.startY + deltaY));
        setPosition({ x: newX, y: newY });
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      setIsDragging(false);
      resizeStartRef.current = null;
      dragStartRef.current = null;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, isDragging, size, position]);

  const style: React.CSSProperties = isCustomPositioned && size && position
    ? {
        width: `${size.width}px`,
        height: `${size.height}px`,
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: 'none',
        maxWidth: 'none',
      }
    : {};

  return (
    <DialogPortal data-slot="dialog-portal">
      <DialogOverlay />
      <DialogPrimitive.Content
        ref={contentRef}
        data-slot="dialog-content"
          className={cn(
          "bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed z-50 grid gap-4 rounded-2xl border p-6 shadow-lg duration-200 overflow-auto",
          !isCustomPositioned && "top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] w-full max-w-[calc(100%-2rem)] sm:max-w-lg",
          isDragging && "cursor-move",
          className,
        )}
        style={style}
        onMouseDown={handleMouseDownDrag}
        {...props}
      >
        {children}
        {!noDrag && (
          <div
            data-resize-handle
            onMouseDown={handleMouseDownResize}
            className="absolute bottom-0 right-0 w-6 h-6 cursor-nwse-resize z-10 group"
            title="크기 조절"
          >
            <div className="absolute bottom-0 right-0 w-full h-full bg-transparent group-hover:bg-blue-500/20 active:bg-blue-500/40 rounded-tl-lg transition-colors" 
                 style={{ clipPath: 'polygon(100% 0, 0 100%, 100% 100%)' }} />
            <div className="absolute bottom-1 right-1 w-2 h-2 border-r-2 border-b-2 border-gray-400 dark:border-gray-500 group-hover:border-blue-500 opacity-60 group-hover:opacity-100 transition-opacity" />
          </div>
        )}
        <DialogPrimitive.Close className="ring-offset-background focus:ring-ring data-[state=open]:bg-accent data-[state=open]:text-muted-foreground absolute top-4 right-4 rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4">
          <XIcon />
          <span className="sr-only">Close</span>
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPortal>
  );
});
DialogContent.displayName = DialogPrimitive.Content.displayName;

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-header"
      className={cn("flex flex-col gap-2 text-center sm:text-left", className)}
      {...props}
    />
  );
}

function DialogFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        "flex flex-col-reverse gap-2 sm:flex-row sm:justify-end",
        className,
      )}
      {...props}
    />
  );
}

function DialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn("text-lg leading-none font-semibold", className)}
      {...props}
    />
  );
}

function DialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  );
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
};
