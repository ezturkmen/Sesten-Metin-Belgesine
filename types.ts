
export interface TranscriptionState {
  text: string;
  summary?: string;
  isProcessing: boolean;
  error: string | null;
}

export interface AudioFile {
  file: File;
  previewUrl: string;
}
