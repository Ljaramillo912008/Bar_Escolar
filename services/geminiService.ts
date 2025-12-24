
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getHealthTip = async (dishName: string) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Proporciona un consejo nutricional muy breve (máximo 20 palabras) para niños que consumen: ${dishName}`,
    });
    return response.text || "Comer balanceado ayuda a crecer fuerte.";
  } catch (error) {
    console.error("Error fetching health tip:", error);
    return "Una dieta balanceada es la clave de la salud.";
  }
};

export const suggestWeeklyMenu = async () => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: "Genera una sugerencia de menú escolar saludable para 5 días de la semana (Lunes a Viernes). Solo nombres de platos.",
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              dia: { type: Type.STRING },
              plato: { type: Type.STRING },
              descripcion: { type: Type.STRING }
            },
            required: ["dia", "plato", "descripcion"]
          }
        }
      }
    });
    return JSON.parse(response.text || "[]");
  } catch (error) {
    console.error("Error suggesting menu:", error);
    return [];
  }
};
