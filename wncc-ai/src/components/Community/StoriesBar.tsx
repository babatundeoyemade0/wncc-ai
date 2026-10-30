import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { Story } from '../../types';
import { Plus, X, Image as ImageIcon, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';

interface StoriesBarProps {
  onRefresh?: () => void;
}

export const StoriesBar: React.FC<StoriesBarProps> = () => {
  const { user, openAuthModal } = useAuth();
  const [stories, setStories] = useState<Story[]>([]);
  const [selectedStoryIndex, setSelectedStoryIndex] = useState<number | null>(null);
  const [isCreatingStory, setIsCreatingStory] = useState(false);
  const [storyImageDataUrl, setStoryImageDataUrl] = useState<string | null>(null);
  const [storyCaption, setStoryCaption] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadStories();
  }, []);

  const loadStories = async () => {
    try {
      const res = await api.getStories();
      setStories(res.stories);
    } catch (err) {
      console.error('Failed to load stories:', err);
    }
  };

  // Timed progress bar for story viewing (5 seconds per story)
  useEffect(() => {
    if (selectedStoryIndex === null) {
      setProgress(0);
      return;
    }

    const interval = 50;
    const step = 100 / (5000 / interval);

    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          // Advance to next story or close
          if (selectedStoryIndex < stories.length - 1) {
            setSelectedStoryIndex(selectedStoryIndex + 1);
            return 0;
          } else {
            setSelectedStoryIndex(null);
            return 0;
          }
        }
        return prev + step;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [selectedStoryIndex, stories.length]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setStoryImageDataUrl(reader.result as string);
      setIsCreatingStory(true);
    };
    reader.readAsDataURL(file);
  };

  const handlePostStory = async () => {
    if (!storyImageDataUrl) return;
    if (!user) {
      openAuthModal('login');
      return;
    }

    setIsUploading(true);
    try {
      const uploadRes = await api.uploadImage(storyImageDataUrl);
      const res = await api.createStory(uploadRes.url, storyCaption);
      setStories([res.story, ...stories]);
      setIsCreatingStory(false);
      setStoryImageDataUrl(null);
      setStoryCaption('');
    } catch (err: any) {
      alert(err.message || 'Failed to post story.');
    } finally {
      setIsUploading(false);
    }
  };

  const currentStory = selectedStoryIndex !== null ? stories[selectedStoryIndex] : null;

  return (
    <div className="w-full">
      {/* Horizontal Carousel of Stories */}
      <div className="flex items-center gap-2.5 overflow-x-auto pb-2 scrollbar-none py-1">
        {/* Create Story Tile */}
        <div
          onClick={() => {
            if (!user) {
              openAuthModal('login');
              return;
            }
            fileInputRef.current?.click();
          }}
          className="relative flex-shrink-0 w-28 sm:w-32 h-44 sm:h-48 rounded-2xl overflow-hidden bg-stone-100 border border-stone-200 hover:border-amber-400 cursor-pointer shadow-xs group transition flex flex-col justify-between"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/jpg"
            onChange={handleFileSelect}
            className="hidden"
          />

          <div className="h-32 sm:h-36 overflow-hidden bg-stone-200">
            {user?.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt=""
                className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
              />
            ) : (
              <div className="w-full h-full bg-amber-900/20 flex items-center justify-center text-amber-900 font-bold text-2xl">
                +
              </div>
            )}
          </div>

          <div className="absolute top-28 sm:top-32 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-amber-900 text-white flex items-center justify-center border-2 border-white shadow-md">
            <Plus className="w-5 h-5" />
          </div>

          <div className="pb-2 pt-4 text-center bg-white">
            <p className="text-[11px] font-bold text-stone-800 leading-tight">Create Story</p>
          </div>
        </div>

        {/* Stories from Community Scholars */}
        {stories.map((story, idx) => (
          <div
            key={story.id}
            onClick={() => {
              setSelectedStoryIndex(idx);
              setProgress(0);
            }}
            className="relative flex-shrink-0 w-28 sm:w-32 h-44 sm:h-48 rounded-2xl overflow-hidden cursor-pointer shadow-xs group border border-stone-200 hover:shadow-md transition"
          >
            <img
              src={story.mediaUrl}
              alt=""
              className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
            />
            {/* Dark gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/70" />

            {/* Author Avatar with Gold Ring */}
            <div className="absolute top-2.5 left-2.5 p-0.5 rounded-full bg-gradient-to-tr from-amber-600 to-amber-300 shadow-sm">
              <img
                src={story.authorAvatar}
                alt=""
                className="w-7 h-7 rounded-full object-cover border border-white"
              />
            </div>

            {/* Caption & Author Name */}
            <div className="absolute bottom-2 left-2 right-2 text-white">
              <p className="text-[11px] font-bold truncate leading-tight drop-shadow-sm">
                {story.authorName}
              </p>
              {story.caption && (
                <p className="text-[9px] text-stone-200 line-clamp-1 mt-0.5">
                  {story.caption}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Story Viewer Modal (Facebook-style timed viewer) */}
      {currentStory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-2 sm:p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-sm h-[80vh] max-h-[720px] bg-stone-900 rounded-3xl overflow-hidden shadow-2xl flex flex-col justify-between">
            {/* Story Image */}
            <img
              src={currentStory.mediaUrl}
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80" />

            {/* Top Progress Bars & Author Info */}
            <div className="relative z-10 p-4 space-y-3">
              <div className="w-full h-1 bg-white/30 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white transition-all duration-75"
                  style={{ width: `${progress}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-white">
                <div className="flex items-center gap-2.5">
                  <img
                    src={currentStory.authorAvatar}
                    alt=""
                    className="w-9 h-9 rounded-full object-cover border-2 border-white"
                  />
                  <div>
                    <p className="text-xs font-bold leading-tight">{currentStory.authorName}</p>
                    <p className="text-[10px] text-stone-300">
                      {new Date(currentStory.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedStoryIndex(null)}
                  className="p-1.5 bg-black/40 hover:bg-black/60 rounded-full text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Bottom Caption */}
            <div className="relative z-10 p-5 text-white">
              {currentStory.caption && (
                <p className="text-sm font-medium bg-black/40 backdrop-blur-sm p-3 rounded-2xl border border-white/10">
                  {currentStory.caption}
                </p>
              )}
            </div>

            {/* Navigation buttons */}
            {selectedStoryIndex! > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedStoryIndex(selectedStoryIndex! - 1);
                  setProgress(0);
                }}
                className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-black/40 hover:bg-black/70 text-white rounded-full z-10"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}

            {selectedStoryIndex! < stories.length - 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedStoryIndex(selectedStoryIndex! + 1);
                  setProgress(0);
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-black/40 hover:bg-black/70 text-white rounded-full z-10"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Create Story Modal */}
      {isCreatingStory && storyImageDataUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            className="w-full max-w-md bg-white rounded-3xl overflow-hidden shadow-2xl border border-stone-200 flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 bg-stone-900 text-white flex items-center justify-between">
              <h3 className="text-sm font-bold font-serif-heading">Create New Story</h3>
              <button
                onClick={() => {
                  setIsCreatingStory(false);
                  setStoryImageDataUrl(null);
                }}
                className="p-1 text-stone-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-3">
              <div className="max-h-72 rounded-2xl overflow-hidden bg-stone-100 flex items-center justify-center">
                <img
                  src={storyImageDataUrl}
                  alt="Story preview"
                  className="w-full h-auto max-h-72 object-contain"
                />
              </div>

              <input
                type="text"
                value={storyCaption}
                onChange={(e) => setStoryCaption(e.target.value)}
                placeholder="Add a caption to your story..."
                className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-amber-800"
              />

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreatingStory(false);
                    setStoryImageDataUrl(null);
                  }}
                  className="px-4 py-2 text-stone-600 hover:bg-stone-100 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handlePostStory}
                  disabled={isUploading}
                  className="px-5 py-2.5 bg-amber-900 hover:bg-amber-850 text-white rounded-xl text-xs font-semibold shadow-xs disabled:opacity-50 transition"
                >
                  {isUploading ? 'Posting...' : 'Share to Story'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
