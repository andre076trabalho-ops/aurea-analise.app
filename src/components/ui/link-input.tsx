import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Plus, X, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LinkInputProps {
  label: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  prefix?: string;
  buildUrl?: (value: string) => string;
  className?: string;
}

export function LinkInput({ label, placeholder, value, onChange, prefix, buildUrl, className }: LinkInputProps) {
  const displayValue = prefix && value.startsWith(prefix) ? value.slice(prefix.length) : value;
  const fullUrl = buildUrl ? buildUrl(displayValue || value) : (value || '');
  const isValidUrl = fullUrl.length > 0;

  return (
    <div className={cn("space-y-2", className)}>
      <Label>{label}</Label>
      <div className="flex items-center gap-2">
        {prefix && (
          <span className="text-sm text-muted-foreground whitespace-nowrap shrink-0">{prefix}</span>
        )}
        <Input
          type="text"
          placeholder={placeholder}
          value={displayValue}
          onChange={(e) => onChange(prefix ? prefix + e.target.value : e.target.value)}
        />
        {isValidUrl && (
          <a
            href={fullUrl.startsWith('http') ? fullUrl : `https://${fullUrl}`}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 p-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        )}
      </div>
    </div>
  );
}

interface MultiLinkInputProps {
  label: string;
  placeholder?: string;
  values: string[];
  onChange: (values: string[]) => void;
  prefix?: string;
  buildUrl?: (value: string) => string;
  className?: string;
}

export function MultiLinkInput({ label, placeholder, values, onChange, prefix, buildUrl, className }: MultiLinkInputProps) {
  const addItem = () => {
    onChange([...values, '']);
  };

  const removeItem = (index: number) => {
    onChange(values.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, value: string) => {
    const updated = [...values];
    updated[index] = value;
    onChange(updated);
  };

  const currentValues = values.length === 0 ? [''] : values;

  return (
    <div className={cn("space-y-2", className)}>
      <Label>{label}</Label>
      {currentValues.map((val, i) => {
        const displayValue = prefix && val.startsWith(prefix) ? val.slice(prefix.length) : val;
        const fullUrl = buildUrl ? buildUrl(displayValue || val) : (val || '');
        const isValidUrl = displayValue.length > 0;

        return (
          <div key={i} className="flex items-center gap-2">
            {prefix && (
              <span className="text-sm text-muted-foreground whitespace-nowrap shrink-0">{prefix}</span>
            )}
            <Input
              type="text"
              placeholder={placeholder}
              value={displayValue}
              onChange={(e) => updateItem(i, prefix ? prefix + e.target.value : e.target.value)}
            />
            {isValidUrl && (
              <a
                href={fullUrl.startsWith('http') ? fullUrl : `https://${fullUrl}`}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 p-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
            {currentValues.length > 1 && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="shrink-0 h-9 w-9 text-muted-foreground hover:text-error"
                onClick={() => removeItem(i)}
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        );
      })}
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="gap-1.5 mt-1"
        onClick={addItem}
      >
        <Plus className="w-3.5 h-3.5" />
        Adicionar
      </Button>
    </div>
  );
}
