import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { MoreHorizontal, PencilLine, Trash } from 'lucide-react';
import Link from 'next/link';
import React, { useState } from 'react';

interface ChatItemProps {
  chat: {
    id: string;
    title: string;
  };
  isActive: boolean;
  isEditing: boolean;
  editValue: string;
  onEditValueChange: (value: string) => void;
  onStartEdit: () => void;
  onFinishEdit: (save: boolean) => void;
  onDelete: (e: React.MouseEvent) => void;
  clearCode: () => void;
}

export const ChatItem = React.memo(function ChatItem({
  chat,
  isActive,
  isEditing,
  editValue,
  onEditValueChange,
  onStartEdit,
  onFinishEdit,
  onDelete,
  clearCode,
}: ChatItemProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (isEditing) {
    return (
      <div className="flex w-full items-center px-2">
        <Input
          autoFocus
          value={editValue}
          onChange={(e) => onEditValueChange(e.target.value)}
          onBlur={() => onFinishEdit(true)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              onFinishEdit(true);
            } else if (e.key === 'Escape') {
              e.preventDefault();
              onFinishEdit(false);
            }
          }}
          className="h-8"
        />
      </div>
    );
  }

  return (
    <div className="chat-item relative flex w-full items-center rounded-md">
      <Link
        href={`/chat/${chat.id}`}
        className={cn(
          'flex flex-1 items-center px-2 py-2 text-sm transition-colors',
          isActive && 'rounded-md bg-accent font-medium text-accent-foreground',
          !isActive && 'text-foreground/90'
        )}
        onClick={(e) => {
          clearCode();
          if (e.detail === 2) {
            e.preventDefault();
            onStartEdit();
          }
        }}
      >
        <span className="line-clamp-1 pr-4" title={chat.title}>
          {chat.title}
        </span>
      </Link>

      <div className={cn('action-menu absolute right-0.5 opacity-0 transition-opacity', isOpen && 'opacity-100')}>
        <DropdownMenu onOpenChange={setIsOpen}>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-6 w-6 hover:bg-accent">
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">Actions</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem onClick={onStartEdit} className="cursor-pointer">
              <PencilLine className="mr-2 h-4 w-4" />
              <span>Rename</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onDelete} className="cursor-pointer">
              <Trash className="mr-2 h-4 w-4" />
              <span>Delete</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
});
