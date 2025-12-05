import { GoogleGenerativeAI } from "@google/generative-ai";
import { InvoiceItem } from "../types";

const ai = new GoogleGenerativeAI(import.meta.env.VITE_API_KEY as string);

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
        Devuelve SOLO un array JSON válido sin markdown.
        Formato esperado:
        [
          { "name": "nombre del producto", "quantity": número, "unit": "g, kg, ml, l, o unidad", "cost": costo_unitario_estimado }
        ]
        Si la unidad está en kg, conviértela a gramos. Si está en Litros, a ml.
        Intenta normalizar las unidades a 'g', 'ml' o 'units'.
      `;

      const model = ai.getGenerativeModel({ model: "gemini-2.0-flash" });
            const response = await model.generateContent(
                      contents: [
                        {
                                      parts: [
          {inlineData: {
            mimeType: "image/jpeg",
            data: cleanBase64
          }
        },
        { text: prompt }
                                                    ]
          }
        ]
      });
