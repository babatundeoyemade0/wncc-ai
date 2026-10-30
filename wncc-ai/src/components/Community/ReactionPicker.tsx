import React, { useState } from 'react';
import { ReactionType } from '../../types';

interface ReactionPickerProps {
  currentReaction?: ReactionType;
  onSelectReaction: (type: ReactionType) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const REACTIONS: Array<{ type: ReactionType; label: string; emoji: string; color: string }> = [
  { type: 'like', label: 'Like', emoji: '👍', color: 'text-amber-800' },
  { type: 'love', label: 'Love', emoji: '❤️', color: 'text-rose-600' },
  { type: 'amen', label: 'Amen', emoji: '🙏', color: 'text-amber-600' },
  { type: 'insightful', label: 'Insightful', emoji: '💡', color: 'text-yellow-600' },
  { type: 'haha', label: 'Haha', emoji: '😆', color: 'text-amber-500' },
  { type: 'wow', label: 'Wow', emoji: '😮', color: 'text-amber-700' }
];

export const ReactionPicker: React.FC<ReactionPickerProps> = ({
  currentReaction,
  onSelectReaction,
  isOpen,
  onClose
}) => {
  if (!isOpen) return null;

  return (
    <div
      onMouseLeave={onClose}
      className="absolute bottom-full left-0 mb-2 z-30 bg-white/95 backdrop-blur-md rounded-full shadow-xl border border-stone-200 px-2 py-1.5 flex items-center gap-1 animate-in zoom-in-95 duration-150"
    >
      {REACTIONS.map((r) => {
        const isSelected = currentReaction === r.type;
        return (
          <button
            key={r.type}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSelectReaction(r.type);
              onClose();
            }}
            className={`p-1.5 rounded-full hover:scale-130 active:scale-110 transition-transform duration-200 flex flex-col items-center group ${
              isSelected ? 'bg-amber-100 scale-110' : ''
            }`}
            title={r.label}
          >
            <span className="text-xl sm:text-2xl select-none">{r.emoji}</span>
          </button>
        );
      })}
    </div>
  );
};
