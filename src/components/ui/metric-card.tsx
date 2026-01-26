import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  icon?: LucideIcon;
  label: string;
  value: string | number | null;
  subtitle?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  confidence?: number;
  onEdit?: () => void;
}

export function MetricCard({ 
  icon: Icon, 
  label, 
  value, 
  subtitle,
  trend,
  trendValue,
  confidence,
  onEdit 
}: MetricCardProps) {
  const displayValue = value !== null ? value : '—';
  const needsReview = confidence !== undefined && confidence < 0.65;

  return (
    <div 
      className={cn(
        "metric-card group relative",
        needsReview && "border-warning/50"
      )}
    >
      {/* Confidence indicator */}
      {confidence !== undefined && (
        <div className="absolute top-2 right-2">
          <div 
            className={cn(
              "text-xs px-2 py-0.5 rounded-full",
              confidence >= 0.8 && "bg-success/20 text-success",
              confidence >= 0.65 && confidence < 0.8 && "bg-warning/20 text-warning",
              confidence < 0.65 && "bg-error/20 text-error"
            )}
          >
            {Math.round(confidence * 100)}%
          </div>
        </div>
      )}

      <div className="flex items-start gap-3">
        {Icon && (
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Icon className="w-5 h-5 text-primary" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold text-foreground mt-1">{displayValue}</p>
          {subtitle && (
            <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
          )}
          {trend && trendValue && (
            <div className={cn(
              "flex items-center gap-1 mt-2 text-xs font-medium",
              trend === 'up' && "text-success",
              trend === 'down' && "text-error",
              trend === 'neutral' && "text-muted-foreground"
            )}>
              <span>{trendValue}</span>
            </div>
          )}
        </div>
      </div>

      {/* Edit overlay on hover */}
      {onEdit && (
        <button
          onClick={onEdit}
          className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-xl"
        >
          <span className="text-sm font-medium text-primary">Editar</span>
        </button>
      )}

      {/* Review badge */}
      {needsReview && (
        <div className="absolute -top-2 -right-2 bg-warning text-warning-foreground text-xs px-2 py-0.5 rounded-full font-medium">
          Revisar
        </div>
      )}
    </div>
  );
}
