import { Textarea } from './textarea';

interface AuditorNoteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function AuditorNote({ value, onChange, placeholder }: AuditorNoteProps) {
  return (
    <div className="flex gap-3 items-start p-4 bg-secondary/20 rounded-xl border border-border">
      <div className="flex-1 space-y-1">
        <span className="text-sm font-semibold text-foreground">Observações do Rodrigo</span>
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
