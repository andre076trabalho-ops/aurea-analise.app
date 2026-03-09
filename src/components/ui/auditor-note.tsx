import { useState } from 'react';
import { Textarea } from './textarea';
import { Sparkles, Loader2 } from 'lucide-react';

interface AuditorNoteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onAIComplement?: () => Promise<void>;
}

export function AuditorNote({ value, onChange, placeholder, onAIComplement }: AuditorNoteProps) {
  const [loading, setLoading] = useState(false);

  const handleComplement = async () => {
    if (!onAIComplement || loading) return;
    setLoading(true);
    try {
      await onAIComplement();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex gap-3 items-start p-4 bg-secondary/20 rounded-xl border border-border">
      <div className="flex-1 space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-foreground">Observações do Rodrigo</span>
          {onAIComplement && (
            <button
              type="button"
              onClick={handleComplement}
              disabled={loading}
              className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors disabled:opacity-50"
              title="Complementar com IA"
            >
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              {loading ? 'Gerando...' : 'Complementar com IA'}
            </button>
          )}
        </div>
        <Textarea
          placeholder={placeholder ?? 'Adicione observações e insights estratégicos...'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={4}
          className="bg-background/60 resize-none"
        />
      </div>
      <img
        src="/rodrigo.png"
        alt="Rodrigo"
        className="w-10 h-10 rounded-full object-cover flex-shrink-0 mt-6 ring-2 ring-primary/30"
      />
    </div>
  );
}
