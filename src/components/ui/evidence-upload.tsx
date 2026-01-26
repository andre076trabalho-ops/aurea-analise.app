import { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Upload, Image, X, Eye, Loader2 } from 'lucide-react';
import { Button } from './button';

interface EvidenceUploadProps {
  label: string;
  description?: string;
  value?: string;
  confidence?: number;
  onUpload?: (file: File) => void;
  onRemove?: () => void;
  onView?: () => void;
  isExtracting?: boolean;
}

export function EvidenceUpload({ 
  label, 
  description, 
  value,
  confidence,
  onUpload, 
  onRemove,
  onView,
  isExtracting 
}: EvidenceUploadProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && onUpload) {
      onUpload(file);
    }
  }, [onUpload]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onUpload) {
      onUpload(file);
    }
  }, [onUpload]);

  if (value) {
    return (
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">{label}</label>
        <div className="evidence-thumb group">
          <img src={value} alt={label} />
          <div className="absolute inset-0 bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            {onView && (
              <Button size="sm" variant="secondary" onClick={onView}>
                <Eye className="w-4 h-4 mr-1" />
                Ver
              </Button>
            )}
            {onRemove && (
              <Button size="sm" variant="destructive" onClick={onRemove}>
                <X className="w-4 h-4 mr-1" />
                Remover
              </Button>
            )}
          </div>
          {confidence !== undefined && (
            <div className={cn(
              "absolute top-2 right-2 text-xs px-2 py-0.5 rounded-full",
              confidence >= 0.65 ? "bg-success/20 text-success" : "bg-warning/20 text-warning"
            )}>
              {Math.round(confidence * 100)}% confiança
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground">{label}</label>
      <div
        className={cn(
          "border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer",
          isDragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-accent/50"
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => document.getElementById(`upload-${label}`)?.click()}
      >
        <input
          id={`upload-${label}`}
          type="file"
          accept="image/*,.pdf"
          className="hidden"
          onChange={handleFileChange}
        />
        
        {isExtracting ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <p className="text-sm text-muted-foreground">Extraindo dados...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Upload className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">
                Arraste ou clique para enviar
              </p>
              {description && (
                <p className="text-xs text-muted-foreground mt-1">{description}</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
