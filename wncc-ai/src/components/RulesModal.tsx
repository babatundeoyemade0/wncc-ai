import React, { useState, useEffect } from 'react';
import { X, ShieldCheck, BookOpen, AlertCircle } from 'lucide-react';
import { api } from '../lib/api';

interface RulesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAppeal?: () => void;
}

export const RulesModal: React.FC<RulesModalProps> = ({ isOpen, onClose, onOpenAppeal }) => {
  const [rules, setRules] = useState<string[]>([]);
  const [siteName, setSiteName] = useState('WNCC AI');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      api.getBranding()
        .then(res => {
          if (res.branding) {
            setRules(res.branding.rules || []);
            setSiteName(res.branding.siteName || 'WNCC AI');
          }
        })
        .catch(() => {
          setRules([
            'Maintain Christ-like reverence, scholarly integrity, and mutual respect across all discussions.',
            'Ground theological debates in Scripture, hermeneutical rigor, and historical Christian context.',
            'No harassment, unedifying vulgarity, deceptive claims, or malicious conduct.',
            'Group owners and admins are responsible for pastoral and academic order in their respective spaces.',
            'Respect intellectual copyright and cite scholarly references accurately.'
          ]);
        })
        .finally(() => setLoading(false));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-stone-150 flex items-center justify-between bg-stone-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-900 text-amber-100 flex items-center justify-center shadow-xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-stone-900 text-lg">
                Platform Rules & Guidelines
              </h3>
              <p className="text-xs text-stone-500 font-medium">
                {siteName} Community Standards
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4">
          <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 flex gap-3 text-amber-900 text-xs leading-relaxed">
            <BookOpen className="w-5 h-5 text-amber-800 shrink-0 mt-0.5" />
            <p>
              These rules are established by the College Administration to ensure an edifying,
              scholarly, and spiritually sound environment for all students, faculty, and participants.
            </p>
          </div>

          {loading ? (
            <div className="py-8 text-center text-stone-400 text-xs">Loading rules...</div>
          ) : (
            <ol className="space-y-3">
              {rules.map((rule, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-3 p-3 bg-stone-50 rounded-xl border border-stone-200/80 text-xs text-stone-800 leading-relaxed"
                >
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-amber-800 text-white font-bold text-[10px] shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <span>{rule}</span>
                </li>
              ))}
            </ol>
          )}

          <div className="border-t border-stone-150 pt-4 flex items-center justify-between text-xs text-stone-500">
            <span>Enforced by Super Admin & Group Moderators</span>
            {onOpenAppeal && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenAppeal();
                }}
                className="text-amber-850 hover:underline font-semibold flex items-center gap-1"
              >
                <AlertCircle className="w-3.5 h-3.5" />
                Submit an Appeal
              </button>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-stone-50 border-t border-stone-150 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-amber-900 hover:bg-amber-850 text-white text-xs font-semibold rounded-xl shadow-xs transition"
          >
            Understood
          </button>
        </div>
      </div>
    </div>
  );
};
