import { GoogleGenerativeAI } from "@google/generative-ai";
import { InvoiceItem } from "../types";

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_API_KEY || '');

export const GeminiService = {
  /**
   * Parses an invoice image and returns structured data.
   */
  parseInvoice: async (base64Image: string): Promise<InvoiceItem[]> => {
    try {
      // Remove data URL prefix if present for clean base64
      const cleanBase64 = base64Image.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, "");

      const prompt = `
        Analiza esta imagen de una factura de compra de insumos de restaurante.
        Extrae los items comprados.
        Si la unidad está en kg, conviértela a gramos. Si está en Litros, a ml.
        Intenta normalizar las unidades a 'g', 'ml' o 'units'.
        
        IMPORTANTE: Devuelve SOLO un JSON válido con este formato exacto, sin texto adicional:
        {
          "items": [
            {
              "name": "nombre del producto",
              "quantity": número,
              "unit": "g" | "ml" | "units",
              "unitCost": número en pesos colombianos
            }
          ]
        }
      `;

      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      
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
      
      // Extract JSON from response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const parsedData = JSON.parse(jsonMatch[0]);
      return parsedData.items || [];
    } catch (error) {
      console.error('Error parsing invoice:', error);
      throw new Error('Failed to parse invoice');
    }
  }
};
