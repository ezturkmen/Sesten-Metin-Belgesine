
import { GoogleGenAI } from "@google/genai";

const getAIClient = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

/**
 * Üstel Geri Çekilme (Exponential Backoff) ile API çağrısı yapan yardımcı fonksiyon.
 * 429 hatası alındığında belirli süre bekleyip tekrar dener.
 */
async function withRetry<T>(fn: () => Promise<T>, maxRetries = 3, initialDelay = 2000): Promise<T> {
  let lastError: any;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      // Eğer hata "quota" veya "429" ile ilgiliyse bekle ve tekrar dene
      if (error?.message?.includes('429') || error?.message?.includes('RESOURCE_EXHAUSTED')) {
        const delay = initialDelay * Math.pow(2, i); // 2s, 4s, 8s...
        console.warn(`Kota aşıldı, ${delay}ms sonra tekrar deneniyor... (Deneme ${i + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw error; // Diğer hataları hemen fırlat
    }
  }
  throw lastError;
}

export const transcribeAudio = async (base64Data: string, mimeType: string): Promise<string> => {
  return withRetry(async () => {
    const ai = getAIClient();
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Data,
              mimeType: mimeType,
            },
          },
          {
            text: "Lütfen bu ses kaydını tam ve doğru bir şekilde metne çevir. Konuşmacı değişimlerini fark edersen satır başı yap. Sadece konuşulanları yaz, ekstra yorum ekleme.",
          },
        ],
      },
    });
    return response.text || "Transcription failed.";
  });
};

export const summarizeText = async (text: string): Promise<string> => {
  return withRetry(async () => {
    const ai = getAIClient();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Aşağıdaki metni profesyonel bir dille, ana noktaları vurgulayarak özetle:\n\n${text}`,
    });
    return response.text || "Summary failed.";
  });
};
