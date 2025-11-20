import { GoogleGenAI } from "@google/genai";

// NOTE: In a real production environment, you should not expose API keys in the frontend code.
// Usually, you would call your own backend, which then calls Gemini.
// For this generated demo, we assume the key is available in the environment.
// Since we cannot inject env vars here easily, this service is structured to work 
// if the user provides a key, or gracefully fallback if not.

export const generateWorkSummary = async (jobName: string, durationHours: string): Promise<string> => {
  try {
    if (!process.env.API_KEY) {
      console.warn("Gemini API Key missing. Skipping AI summary.");
      return "AI Summary not available (Missing Key).";
    }

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const prompt = `
      Generate a very short, professional one-sentence summary for a timesheet log.
      Job: "${jobName}".
      Duration: ${durationHours}.
      Format: "Completed [Task] in [Duration]. [Encouraging remark]"
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || "Work completed successfully.";
  } catch (error) {
    console.error("Error generating summary:", error);
    return "Work completed.";
  }
};

export const getLocationName = async (lat: number, lng: number): Promise<string | null> => {
  try {
    if (!process.env.API_KEY) {
      return null;
    }

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // Using Google Maps Grounding to get the real address
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `What is the specific address or place name at latitude ${lat} and longitude ${lng}? Return only the address/place name concisely.`,
      config: {
        tools: [{googleMaps: {}}],
        toolConfig: {
          retrievalConfig: {
            latLng: {
              latitude: lat,
              longitude: lng
            }
          }
        }
      },
    });

    // Grounding maps usually returns text, we strip markdown if any
    return response.text ? response.text.trim() : null;
  } catch (error) {
    console.error("Error fetching location name:", error);
    return null;
  }
};