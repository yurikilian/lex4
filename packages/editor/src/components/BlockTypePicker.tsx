import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import type { Lex4Translations } from '../i18n';
import { useTranslations } from '../i18n';
import type { BlockType } from '../lexical/commands/block-commands';

const BLOCK_TYPE_OPTIONS: Array<{ value: BlockType; shortLabel: string }> = [
  { value: 'paragraph', shortLabel: 'P' },
  { value: 'h1', shortLabel: 'H1' },
  { value: 'h2', shortLabel: 'H2' },
  { value: 'h3', shortLabel: 'H3' },
  { value: 'h4', shortLabel: 'H4' },
  { value: 'h5', shortLabel: 'H5' },
  { value: 'h6', shortLabel: 'H6' },
];

export function getBlockTypeLabel(t: Lex4Translations, blockType: BlockType): string {
  switch (blockType) {
    case 'h1':
      return t.toolbar.heading1;
    case 'h2':
      return t.toolbar.heading2;
    case 'h3':
      return t.toolbar.heading3;
    case 'h4':
      return t.toolbar.heading4;
    case 'h5':
      return t.toolbar.heading5;
    case 'h6':
      return t.toolbar.heading6;
    default:
      return t.toolbar.paragraph;
  }
}

function getBlockTypeShortLabel(blockType: BlockType): string {
  return BLOCK_TYPE_OPTIONS.find((option) => option.value === blockType)?.shortLabel ?? 'P';
}

interface BlockTypePickerProps {
  value: BlockType;
  onChange: (blockType: BlockType) => void;
}

export const BlockTypePicker: React.FC<BlockTypePickerProps> = ({ value, onChange }) => {
  const t = useTranslations();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open]);

  return (
    <div
      ref={containerRef}
      className="lex4-block-type-picker"
      data-testid="block-type-picker"
    >
      <button
        type="button"
        className={`lex4-block-type-trigger${open ? ' open' : ''}`}
        data-testid="block-type-selector"
        aria-label={t.toolbar.blockType}
        aria-expanded={open}
        aria-haspopup="menu"
        title={getBlockTypeLabel(t, value)}
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => setOpen((current) => !current)}
      >
        <span
          className={`lex4-block-type-trigger-code${value === 'paragraph' ? '' : ' heading'}`}
        >
          {getBlockTypeShortLabel(value)}
        </span>
        <ChevronDown size={14} className={`lex4-block-type-trigger-chevron${open ? ' open' : ''}`} />
      </button>

      {open && (
        <div
          className="lex4-block-type-menu"
          role="menu"
          data-testid="block-type-menu"
        >
          {BLOCK_TYPE_OPTIONS.map((option) => {
            const label = getBlockTypeLabel(t, option.value);
            const active = option.value === value;

            return (
              <button
                key={option.value}
                type="button"
                role="menuitemradio"
                aria-checked={active}
                className={`lex4-block-type-item${active ? ' active' : ''}`}
                data-testid={`block-type-option-${option.value}`}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
              >
                <span
                  className={`lex4-block-type-item-code${option.value === 'paragraph' ? '' : ' heading'}${active ? ' active' : ''}`}
                >
                  {option.shortLabel}
                </span>
                <span className="lex4-block-type-item-label">{label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
