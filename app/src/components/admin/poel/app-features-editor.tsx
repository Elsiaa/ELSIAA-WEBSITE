'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, X } from 'lucide-react';
import {
  EXAMPLE_APP_FEATURE_KEYS,
  collectAppFeatureKeys,
  formatAppFeatureLabel,
  isValidAppFeatureKey,
  type AppFeatures,
} from '@/lib/app-features';

type AppFeaturesEditorProps = {
  value: AppFeatures;
  onChange: (next: AppFeatures) => void;
  /** Compact layout for user modal */
  dense?: boolean;
  disabled?: boolean;
};

/**
 * Free-form feature map editor: toggle existing keys, add/remove any key.
 */
export function AppFeaturesEditor({ value, onChange, dense, disabled }: AppFeaturesEditorProps) {
  const [newKey, setNewKey] = useState('');
  const [error, setError] = useState<string | null>(null);

  const keys = collectAppFeatureKeys(value);
  const suggestionKeys = EXAMPLE_APP_FEATURE_KEYS.filter((k) => !(k in value));

  const addKey = (raw: string, enabled = true) => {
    const key = raw.trim();
    if (!key) return;
    if (!isValidAppFeatureKey(key)) {
      setError('Use a letter, then letters/numbers/underscores (max 64).');
      return;
    }
    if (key in value) {
      setError('That feature already exists.');
      return;
    }
    setError(null);
    onChange({ ...value, [key]: enabled });
    setNewKey('');
  };

  const removeKey = (key: string) => {
    const next = { ...value };
    delete next[key];
    onChange(next);
  };

  return (
    <div className={dense ? 'space-y-2' : 'space-y-3'}>
      {keys.length === 0 ? (
        <p className="text-xs text-muted-foreground">No features yet. Add a key below.</p>
      ) : (
        <div className={dense ? 'grid grid-cols-1 gap-2' : 'grid grid-cols-1 sm:grid-cols-2 gap-2'}>
          {keys.map((key) => (
            <div
              key={key}
              className="flex items-center gap-2 rounded-lg border border-border/50 bg-background/60 px-3 py-2 text-sm"
            >
              <label className="flex flex-1 items-center gap-2 cursor-pointer min-w-0">
                <Checkbox
                  checked={value[key] === true}
                  disabled={disabled}
                  onCheckedChange={(v) => onChange({ ...value, [key]: v === true })}
                />
                <span className="truncate" title={key}>
                  {formatAppFeatureLabel(key)}
                  <span className="ml-1 text-xs text-muted-foreground font-mono">({key})</span>
                </span>
              </label>
              <button
                type="button"
                disabled={disabled}
                aria-label={`Remove ${key}`}
                className="text-muted-foreground hover:text-foreground shrink-0 disabled:opacity-50"
                onClick={() => removeKey(key)}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {suggestionKeys.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          <span className="text-xs text-muted-foreground self-center">Quick add:</span>
          {suggestionKeys.map((key) => (
            <Button
              key={key}
              type="button"
              size="sm"
              variant="outline"
              className="h-7 text-xs"
              disabled={disabled}
              onClick={() => addKey(key, true)}
            >
              <Plus className="w-3 h-3 mr-1" />
              {key}
            </Button>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <Input
          value={newKey}
          disabled={disabled}
          placeholder="featureKey"
          className="h-8 w-48 font-mono text-sm"
          onChange={(e) => {
            setNewKey(e.target.value);
            if (error) setError(null);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addKey(newKey, true);
            }
          }}
        />
        <Button
          type="button"
          size="sm"
          variant="secondary"
          disabled={disabled || !newKey.trim()}
          onClick={() => addKey(newKey, true)}
        >
          <Plus className="w-3.5 h-3.5 mr-1" />
          Add feature
        </Button>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
