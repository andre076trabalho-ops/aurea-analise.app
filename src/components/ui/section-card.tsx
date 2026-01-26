import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon, ChevronDown } from 'lucide-react';
import { ScoreBadge } from './score-badge';

interface SectionCardProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  score?: number;
  children: ReactNode;
  collapsible?: boolean;
  defaultOpen?: boolean;
  className?: string;
}

export function SectionCard({ 
  icon: Icon, 
  title, 
  description, 
  score,
  children, 
  collapsible = false,
  defaultOpen = true,
  className 
}: SectionCardProps) {
  return (
    <div className={cn("bg-card border border-border rounded-2xl overflow-hidden", className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-border">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Icon className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">{title}</h3>
            {description && (
              <p className="text-sm text-muted-foreground">{description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-4">
          {score !== undefined && (
            <ScoreBadge score={score} size="sm" />
          )}
          {collapsible && (
            <button className="p-2 hover:bg-accent rounded-lg transition-colors">
              <ChevronDown className="w-5 h-5 text-muted-foreground" />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {children}
      </div>
    </div>
  );
}
