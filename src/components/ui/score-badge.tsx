import { cn } from '@/lib/utils';

interface ScoreBadgeProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export function ScoreBadge({ score, size = 'md', showLabel = false }: ScoreBadgeProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'success';
    if (score >= 60) return 'warning';
    return 'error';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Bom';
    if (score >= 60) return 'Regular';
    return 'Crítico';
  };

  const color = getScoreColor(score);
  const label = getScoreLabel(score);

  const sizeClasses = {
    sm: 'w-10 h-10 text-sm',
    md: 'w-14 h-14 text-lg',
    lg: 'w-20 h-20 text-2xl',
  };

  return (
    <div className="flex flex-col items-center gap-1">
      <div 
        className={cn(
          "rounded-full flex items-center justify-center font-bold border-2",
          sizeClasses[size],
          color === 'success' && "bg-success/20 border-success text-success",
          color === 'warning' && "bg-warning/20 border-warning text-warning",
          color === 'error' && "bg-error/20 border-error text-error"
        )}
      >
        {score}
      </div>
      {showLabel && (
        <span className={cn(
          "text-xs font-medium",
          color === 'success' && "text-success",
          color === 'warning' && "text-warning",
          color === 'error' && "text-error"
        )}>
          {label}
        </span>
      )}
    </div>
  );
}
