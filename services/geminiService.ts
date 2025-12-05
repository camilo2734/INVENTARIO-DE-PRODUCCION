import { GoogleGenerativeAI } from "@google/generative-ai";
import { InvoiceItem } from "../types";

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || "");

export const GeminiService = {
  /**
   * Parses an invoice image and returns structured data.
   */
  parseInvoice: async (base64Image: string): Promise<InvoiceItem[]> => {
    try {
      // Remove data URL prefix if present for clean base64
      const cleanBase64 = base64Image.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, "");
      
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      
      const prompt = `
        Analiza esta imagen de una factura de compra de insumos de restaurante.
        Extrae los items comprados.
        Si la unidad está en kg, conviértela a gramos. Si está en Litros, a ml.
        Intenta normalizar las unidades a 'g', 'ml' o 'units'.
        
        Devuelve un array JSON con esta estructura:
        [
          {
            "name": "nombre del producto",
            "quantity": número,
            "unit": "g" | "ml" | "units",
            "cost": número en pesos
          }
        ]
      `;
      
      const result = await model.generateContent([
        {
          inlineData: {
            mimeType: "image/jpeg",
            data: cleanBase64
          }
        },
        prompt
      ]);
      
      const response = await result.response;
      const text = response.text();
      
      if (!text) return [];
      
      // Extract JSON from markdown code blocks if present
      const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/```\s*([\s\S]*?)\s*```/);
      const jsonText = jsonMatch ? jsonMatch[1] : text;
      
      return JSON.parse(jsonText.trim()) as InvoiceItem[];
    } catch (error) {
      console.error("Gemini OCR Error:", error);
      throw new Error("No se pudo procesar la factura. Intenta de nuevo.");
    }
  }
};
