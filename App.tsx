
import React, { useState, useCallback, useRef } from 'react';
import { Header } from './components/Header';
import { AudioPlayer } from './components/AudioPlayer';
import { transcribeAudio, summarizeText } from './services/geminiService';
import { fileToBase64 } from './utils/audioUtils';
import { TranscriptionState, AudioFile } from './types';

const App: React.FC = () => {
  const [audioFiles, setAudioFiles] = useState<AudioFile[]>([]);
  const [state, setState] = useState<TranscriptionState>({
    text: '',
    isProcessing: false,
    error: null,
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const newAudioFiles: AudioFile[] = Array.from(files).map((file: File) => ({
        file,
        previewUrl: URL.createObjectURL(file),
      }));
      
      setAudioFiles(prev => [...prev, ...newAudioFiles]);
      if (e.target) e.target.value = '';
    }
  };

  const removeFile = (index: number) => {
    setAudioFiles(prev => {
      const updated = [...prev];
      URL.revokeObjectURL(updated[index].previewUrl);
      updated.splice(index, 1);
      return updated;
    });
  };

  const handleTranscribeAll = async () => {
    if (audioFiles.length === 0) return;

    setState(prev => ({ ...prev, isProcessing: true, error: null, text: '' }));
    let combinedText = '';

    try {
      for (let i = 0; i < audioFiles.length; i++) {
        const audio = audioFiles[i];
        const base64 = await fileToBase64(audio.file);
        
        const header = `--- DOSYA: ${audio.file.name} ---\n`;
        
        // İşlem başladığında kullanıcıya bilgi ver
        setState(prev => ({ ...prev, text: combinedText + header + "İşleniyor...\n\n" }));

        const transcription = await transcribeAudio(base64, audio.file.type);
        
        combinedText += header + transcription + '\n\n';
        setState(prev => ({ ...prev, text: combinedText }));

        // Kota hatalarını önlemek için her dosya arasında 1 saniye bekle (Rate limiting safety)
        if (i < audioFiles.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      setState(prev => ({ ...prev, isProcessing: false }));
    } catch (err: any) {
      console.error(err);
      let errorMessage = 'Bir hata oluştu. Lütfen tekrar deneyin.';
      if (err?.message?.includes('429') || err?.message?.includes('RESOURCE_EXHAUSTED')) {
        errorMessage = 'API kullanım kotası aşıldı. Lütfen birkaç dakika bekleyip tekrar deneyin (Ücretsiz plan sınırları).';
      }
      
      setState(prev => ({
        ...prev,
        isProcessing: false,
        error: errorMessage,
      }));
    }
  };

  const handleSummarize = async () => {
    if (!state.text) return;
    
    setState(prev => ({ ...prev, isProcessing: true }));
    try {
      const summary = await summarizeText(state.text);
      setState(prev => ({ ...prev, summary, isProcessing: false }));
    } catch (err: any) {
      let errorMessage = 'Özetleme sırasında bir hata oluştu.';
      if (err?.message?.includes('429')) {
        errorMessage = 'Kotanız doldu, özetleme için biraz bekleyin.';
      }
      setState(prev => ({ ...prev, isProcessing: false, error: errorMessage }));
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setState(prev => ({ ...prev, text: e.target.value }));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Panoya kopyalandı!');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header />
      
      <main className="flex-1 max-w-4xl w-full mx-auto px-6 py-8">
        <div className="grid grid-cols-1 gap-8">
          
          <section className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 transition-all">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-600 text-white text-xs">1</span>
                Ses Dosyalarını Yönetin
              </h2>
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="text-sm font-semibold text-indigo-600 hover:bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors border border-indigo-100 flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Dosya Ekle
              </button>
            </div>
            
            <div 
              onClick={() => audioFiles.length === 0 && fileInputRef.current?.click()}
              className={`${audioFiles.length === 0 ? 'cursor-pointer p-10' : 'p-0'} border-2 border-dashed border-slate-300 rounded-2xl transition-all hover:border-indigo-400 hover:bg-indigo-50/30 flex flex-col items-center justify-center gap-4`}
            >
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="audio/*"
                multiple
                className="hidden"
              />
              
              {audioFiles.length === 0 ? (
                <>
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  </div>
                  <div className="text-center">
                    <p className="text-slate-700 font-medium">Birden Fazla Ses Dosyası Yükleyin</p>
                    <p className="text-slate-400 text-sm mt-1">Hepsini tek bir dokümanda birleştirelim</p>
                  </div>
                </>
              ) : (
                <div className="w-full space-y-4 p-2 border-none">
                  {audioFiles.map((audio, idx) => (
                    <div key={audio.previewUrl} className="relative group">
                      <AudioPlayer url={audio.previewUrl} fileName={audio.file.name} />
                      <button 
                        onClick={() => removeFile(idx)}
                        className="absolute -top-2 -right-2 bg-red-100 text-red-600 p-1.5 rounded-full shadow-sm hover:bg-red-200 transition-colors opacity-0 group-hover:opacity-100"
                        title="Dosyayı Kaldır"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {audioFiles.length > 0 && (
              <div className="mt-8 pt-6 border-t border-slate-100">
                <button
                  disabled={state.isProcessing}
                  onClick={handleTranscribeAll}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-bold py-4 px-6 rounded-2xl transition-all shadow-xl shadow-indigo-100 active:transform active:scale-95 flex items-center justify-center gap-3"
                >
                  {state.isProcessing ? (
                    <>
                      <svg className="animate-spin h-6 w-6 text-white" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      {audioFiles.length} Dosya İşleniyor...
                    </>
                  ) : (
                    <>
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Tümünü Metne Çevir ve Birleştir
                    </>
                  )}
                </button>
                <p className="mt-3 text-center text-xs text-slate-400">
                  Dosyalar sırayla işlenir. Kota limitlerini korumak için aralarda otomatik beklemeler eklendi.
                </p>
              </div>
            )}
          </section>

          {(state.text || state.isProcessing || state.error) && (
            <section className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 animate-fade-in">
              <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-600 text-white text-xs">2</span>
                Birleşik Transkripsiyon Dokümanı
              </h2>

              {state.error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4 text-sm flex items-center gap-2">
                  <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {state.error}
                </div>
              )}

              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <label className="text-sm font-medium text-slate-500 uppercase tracking-wider">Metin Editörü</label>
                      {state.isProcessing && <span className="animate-pulse text-indigo-600 text-[10px] font-bold tracking-widest">GEMINI ÇALIŞIYOR...</span>}
                    </div>
                    <button 
                      onClick={() => copyToClipboard(state.text)}
                      className="text-indigo-600 hover:text-indigo-700 text-xs font-semibold flex items-center gap-1 transition-colors bg-indigo-50 px-3 py-1.5 rounded-lg"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                      </svg>
                      Dokümanı Kopyala
                    </button>
                  </div>
                  <div className="relative group">
                    <textarea
                      value={state.text}
                      onChange={handleTextChange}
                      placeholder="Transkripsiyonlar burada birleştirilecek..."
                      className="w-full p-6 bg-slate-50 rounded-2xl border border-slate-200 text-slate-700 leading-relaxed min-h-[400px] focus:bg-white focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 outline-none transition-all resize-none shadow-inner font-mono text-sm"
                    />
                  </div>
                </div>

                {state.text && (
                  <div className="pt-4 border-t border-slate-100 flex flex-col gap-4">
                    {!state.summary ? (
                      <button 
                        onClick={handleSummarize}
                        disabled={state.isProcessing}
                        className="w-fit self-start text-sm font-bold text-white bg-slate-800 hover:bg-black px-5 py-3 rounded-xl transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50"
                      >
                        Tüm Dokümanı Özetle
                      </button>
                    ) : (
                      <div className="animate-fade-in bg-indigo-50/50 rounded-2xl p-6 border border-indigo-100">
                        <div className="flex items-center justify-between mb-3">
                          <label className="text-sm font-bold text-indigo-900 uppercase">Yönetici Özeti</label>
                          <button 
                            onClick={() => state.summary && copyToClipboard(state.summary)}
                            className="text-indigo-600 hover:text-indigo-800 text-[10px] font-bold uppercase"
                          >
                            Özeti Kopyala
                          </button>
                        </div>
                        <div className="text-slate-700 italic leading-relaxed text-sm">
                          {state.summary}
                        </div>
                        <button 
                          onClick={() => setState(prev => ({ ...prev, summary: undefined }))}
                          className="mt-4 text-[10px] text-slate-400 hover:text-slate-600 underline uppercase tracking-widest"
                        >
                          Özeti Yenile
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </section>
          )}

        </div>
      </main>

      <footer className="py-8 text-center text-slate-400 text-xs border-t border-slate-100 bg-white mt-12">
        <p>VoiceTranscribe Pro &bull; Hata Yönetimi ve Kota Koruması Etkin</p>
      </footer>
    </div>
  );
};

export default App;
