import { LucideIcon } from 'lucide-react';
import { EmptyState as InteractiveEmptyState } from '@/components/ui/interactive-empty-state';
import { Plus } from 'lucide-react';
import React from 'react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  // Create three icon instances for the interactive display
  const icons = [
    <Icon key="1" className="h-6 w-6" />,
    <Icon key="2" className="h-6 w-6" />,
    <Icon key="3" className="h-6 w-6" />
  ];

  return (
    <InteractiveEmptyState
      title={title}
      description={description}
      icons={icons}
      action={actionLabel && onAction ? {
        label: actionLabel,
        icon: <Plus className="h-4 w-4" />,
        onClick: onAction
      } : undefined}
      variant="default"
      size="default"
      theme="light"
    />
  );
}
