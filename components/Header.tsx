
import React from 'react';

export const Header: React.FC = () => {
  return (
    <header className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
        </div>
        <div className="flex flex-col">
          <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700 leading-none">
            VoiceTranscribe Pro
          </h1>
          <span className="text-[10px] text-slate-400 font-medium uppercase tracking-tighter">AI-Powered Transcription</span>
        </div>
      </div>
      <div className="hidden md:flex items-center gap-4">
        <span className="px-3 py-1 text-xs font-bold bg-indigo-600 text-white rounded-full shadow-sm shadow-indigo-100 animate-pulse">
          Gemini 3 Pro Active
        </span>
      </div>
    </header>
  );
};
