import { cn } from '@/lib/utils';
import { Check, X, Minus } from 'lucide-react';

interface StatusIndicatorProps {
  value: boolean | 'ok' | 'nok' | null;
  label?: string;
  size?: 'sm' | 'md';
}

export function StatusIndicator({ value, label, size = 'md' }: StatusIndicatorProps) {
  const isPositive = value === true || value === 'ok';
  const isNegative = value === false || value === 'nok';
  const isNull = value === null;

  const sizeClasses = {
    sm: 'w-5 h-5',
    md: 'w-6 h-6',
  };

  const iconSize = size === 'sm' ? 'w-3 h-3' : 'w-4 h-4';

  return (
    <div className="flex items-center gap-2">
      <div 
        className={cn(
          "rounded-full flex items-center justify-center",
          sizeClasses[size],
          isPositive && "bg-success/20 text-success",
          isNegative && "bg-error/20 text-error",
          isNull && "bg-muted text-muted-foreground"
        )}
      >
        {isPositive && <Check className={iconSize} />}
        {isNegative && <X className={iconSize} />}
        {isNull && <Minus className={iconSize} />}
      </div>
      {label && (
        <span className={cn(
          "text-sm",
          isPositive && "text-success",
          isNegative && "text-error",
          isNull && "text-muted-foreground"
        )}>
          {label}
        </span>
      )}
    </div>
  );
}
