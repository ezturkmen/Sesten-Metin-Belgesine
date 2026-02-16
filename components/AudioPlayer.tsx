
import React from 'react';

interface AudioPlayerProps {
  url: string;
  fileName: string;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({ url, fileName }) => {
  return (
    <div className="w-full p-4 bg-white rounded-xl border border-slate-200 shadow-sm transition-all hover:shadow-md animate-fade-in">
      <div className="flex items-center gap-3 mb-3">
        <div className="p-2 bg-indigo-100 rounded-lg">
          <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-slate-800 truncate">{fileName}</h3>
          <p className="text-xs text-slate-500">Yüklendi, dinlemeye hazır</p>
        </div>
      </div>
      {/* key={url} eklemek, dosya değiştiğinde ses oynatıcısının tamamen yenilenmesini sağlar */}
      <audio key={url} controls className="w-full h-10 rounded-lg outline-none focus:ring-2 focus:ring-indigo-100">
        <source src={url} type="audio/mpeg" />
        Tarayıcınız ses öğesini desteklemiyor.
      </audio>
    </div>
  );
};
