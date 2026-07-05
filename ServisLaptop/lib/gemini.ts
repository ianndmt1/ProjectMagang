import { GoogleGenerativeAI, FunctionDeclaration, SchemaType } from "@google/generative-ai";
import { createServerSupabaseClient } from "./supabase/server";
import fs from "fs";
import path from "path";

const apiKey = process.env.GEMINI_API_KEY || "";
export const genAI = new GoogleGenerativeAI(apiKey);

// Load system prompt from file (only runs on server side)
export function getSystemInstruction() {
  try {
    const promptPath = path.join(process.cwd(), "gemini-system-prompt.md");
    return fs.readFileSync(promptPath, "utf-8");
  } catch (error) {
    console.error("Error reading gemini-system-prompt.md:", error);
    return "Kamu adalah teknisi AI BK Computer.";
  }
}

export const checkOrderStatusDeclaration: FunctionDeclaration = {
  name: "check_order_status",
  description: "Gunakan function ini saat user meminta cek status servis dan menyertakan nomor invoice (contoh: SRV-20260701-0001). JANGAN memanggil ini jika tidak ada kode invoice.",
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      invoice_code: {
        type: SchemaType.STRING,
        description: "Kode invoice servis",
      },
    },
    required: ["invoice_code"],
  },
};

export const geminiModel = genAI.getGenerativeModel({
  model: "gemini-2.5-flash",
  systemInstruction: getSystemInstruction(),
  tools: [
    {
      functionDeclarations: [checkOrderStatusDeclaration],
    },
  ],
  generationConfig: {
    maxOutputTokens: 350,
    temperature: 0.7,
  },
});

export async function executeCheckOrderStatus(invoice_code: string) {
  try {
    const supabase = createServerSupabaseClient();
    
    // Query without RLS since we use service_role
    const { data, error } = await supabase
      .from("service_orders")
      .select("status, created_at, service_categories(name)")
      .eq("invoice_code", invoice_code)
      .single();

    if (error || !data) {
      return {
        error: "Data tidak ditemukan. Pastikan nomor invoice benar.",
      };
    }

    // Extract category name safely based on Supabase response
    const categoryArray = data.service_categories as unknown as { name: string } | { name: string }[] | null;
    let kategori = "Tidak diketahui";
    if (categoryArray) {
      if (Array.isArray(categoryArray)) {
        kategori = categoryArray.length > 0 ? categoryArray[0].name : "Tidak diketahui";
      } else {
        kategori = categoryArray.name;
      }
    }

    return {
      status: data.status,
      kategori,
      tanggal_masuk: data.created_at,
    };
  } catch (err) {
    console.error("Error executing check_order_status:", err);
    return {
      error: "Terjadi kesalahan internal saat mengecek status.",
    };
  }
}
