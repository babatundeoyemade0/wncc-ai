import React, { useState } from 'react';
import { MessageAttachment } from '../../types';
import {
  FileText,
  FileSpreadsheet,
  Download,
  Play,
  Pause,
  ExternalLink,
  Music,
  Video,
  File,
  X,
  Maximize2
} from 'lucide-react';

interface AttachmentViewerProps {
  attachments?: MessageAttachment[];
  onRemove?: (id: string) => void;
  isEditable?: boolean;
}

export const AttachmentViewer: React.FC<AttachmentViewerProps> = ({
  attachments,
  onRemove,
  isEditable = false
}) => {
  const [selectedImageForZoom, setSelectedImageForZoom] = useState<string | null>(null);

  if (!attachments || attachments.length === 0) return null;

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <>
      <div className="flex flex-wrap gap-2 mt-2">
        {attachments.map((att) => {
          if (att.type === 'image') {
            return (
              <div
                key={att.id}
                className="relative group rounded-xl overflow-hidden border border-stone-200/80 bg-stone-100 max-w-[220px]"
              >
                <img
                  src={att.url}
                  alt={att.name}
                  onClick={() => setSelectedImageForZoom(att.url)}
                  className="w-full h-32 object-cover cursor-pointer group-hover:scale-105 transition-transform duration-200"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 pointer-events-none">
                  <span className="p-1.5 bg-black/60 rounded-full text-white">
                    <Maximize2 className="w-3.5 h-3.5" />
                  </span>
                </div>
                {isEditable && onRemove && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemove(att.id);
                    }}
                    className="absolute top-1 right-1 p-1 bg-black/70 hover:bg-red-700 text-white rounded-full transition"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
                <div className="px-2 py-1 text-[10px] text-stone-600 bg-white/90 truncate max-w-[220px]">
                  {att.name} ({formatFileSize(att.size)})
                </div>
              </div>
            );
          }

          if (att.type === 'video') {
            return (
              <div
                key={att.id}
                className="relative rounded-xl overflow-hidden border border-stone-200 bg-stone-900 max-w-[260px] w-full"
              >
                <video
                  src={att.url}
                  controls
                  className="w-full max-h-48 rounded-xl bg-black"
                  preload="metadata"
                />
                {isEditable && onRemove && (
                  <button
                    type="button"
                    onClick={() => onRemove(att.id)}
                    className="absolute top-1 right-1 p-1 bg-black/70 hover:bg-red-700 text-white rounded-full transition z-10"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
                <div className="p-1.5 text-[10px] text-stone-300 bg-stone-950 flex items-center justify-between">
                  <span className="truncate max-w-[180px]">{att.name}</span>
                  <span>{formatFileSize(att.size)}</span>
                </div>
              </div>
            );
          }

          if (att.type === 'audio') {
            return (
              <div
                key={att.id}
                className="relative p-2.5 bg-amber-50/70 border border-amber-200 rounded-xl min-w-[240px] max-w-sm space-y-1.5"
              >
                <div className="flex items-center justify-between text-xs text-amber-950">
                  <div className="flex items-center gap-1.5 truncate">
                    <Music className="w-4 h-4 text-amber-800 shrink-0" />
                    <span className="font-semibold truncate">{att.name}</span>
                  </div>
                  <span className="text-[10px] text-amber-700 shrink-0 ml-2">
                    {formatFileSize(att.size)}
                  </span>
                </div>
                <audio src={att.url} controls className="w-full h-8" preload="metadata" />
                {isEditable && onRemove && (
                  <button
                    type="button"
                    onClick={() => onRemove(att.id)}
                    className="absolute -top-1.5 -right-1.5 p-1 bg-black/70 hover:bg-red-700 text-white rounded-full transition shadow-xs"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            );
          }

          // Document / Safe File Card
          return (
            <div
              key={att.id}
              className="relative p-2.5 bg-white border border-stone-200 rounded-xl flex items-center justify-between gap-3 min-w-[200px] max-w-xs shadow-2xs hover:border-amber-400 transition"
            >
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-900 flex items-center justify-center shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-stone-900 truncate">
                    {att.name}
                  </p>
                  <p className="text-[10px] text-stone-500">
                    {formatFileSize(att.size)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <a
                  href={att.url}
                  download={att.name}
                  target="_blank"
                  rel="noreferrer"
                  className="p-1.5 text-stone-500 hover:text-amber-900 hover:bg-stone-100 rounded-lg transition"
                  title="Download File"
                >
                  <Download className="w-3.5 h-3.5" />
                </a>
                {isEditable && onRemove && (
                  <button
                    type="button"
                    onClick={() => onRemove(att.id)}
                    className="p-1.5 text-stone-400 hover:text-red-700 rounded-lg transition"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Fullscreen Image Lightbox Modal */}
      {selectedImageForZoom && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in"
          onClick={() => setSelectedImageForZoom(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            <img
              src={selectedImageForZoom}
              alt=""
              className="max-w-full max-h-[85vh] rounded-2xl object-contain shadow-2xl"
            />
            <button
              onClick={() => setSelectedImageForZoom(null)}
              className="absolute top-3 right-3 p-2 bg-black/60 hover:bg-black/90 text-white rounded-full transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </>
  );
};
