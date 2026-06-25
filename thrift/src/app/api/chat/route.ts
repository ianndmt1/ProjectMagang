import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

const systemInstruction = "Kamu adalah asisten belanja thrift yang ramah, membantu, dan menggunakan bahasa Indonesia yang santai tapi sopan. Berikan jawaban yang singkat dan langsung pada intinya. Tugas utamamu adalah membantu pengguna mencari dan melihat produk pakaian thrift yang tersedia.";

const tools: any = [
  {
    functionDeclarations: [
      {
        name: "cari_produk",
        description: "Mencari produk thrift berdasarkan kategori, harga maksimal, atau ukuran.",
        parameters: {
          type: "OBJECT",
          properties: {
            kategori: {
              type: "STRING",
              description: "Kategori produk, contoh: 'baju', 'celana', 'jaket', 'kaos'."
            },
            harga_max: {
              type: "NUMBER",
              description: "Harga maksimal produk dalam Rupiah."
            },
            ukuran: {
              type: "STRING",
              description: "Ukuran produk, contoh: 'S', 'M', 'L', 'XL'."
            }
          }
        }
      },
      {
        name: "lihat_semua_produk",
        description: "Menampilkan semua produk thrift yang tersedia.",
      }
    ]
  }
];

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Messages format is invalid' }, { status: 400 });
    }

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction,
      tools
    });

    const history = messages.slice(0, -1).map((msg: any) => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    }));

    const chat = model.startChat({
      history: history
    });

    const latestMessage = messages[messages.length - 1].content;
    let result = await chat.sendMessage(latestMessage);
    let calls = result.response.functionCalls();

    while (calls && calls.length > 0) {
      const call = calls[0];
      const name = call.name;
      const args: any = call.args;

      let functionResponseData: any = {};

      if (name === 'lihat_semua_produk') {
        const { data, error } = await supabase
          .from('products')
          .select('name, brand, price, size, category, status, slug')
          .eq('status', 'available')
          .limit(10);

        if (error) {
          functionResponseData = { error: error.message };
        } else {
          functionResponseData = { produk: data };
        }
      } else if (name === 'cari_produk') {
        let query = supabase
          .from('products')
          .select('name, brand, price, size, category, status, slug')
          .eq('status', 'available');

        if (args.kategori) {
          query = query.ilike('category', `%${args.kategori}%`);
        }
        if (args.harga_max) {
          query = query.lte('price', args.harga_max);
        }
        if (args.ukuran) {
          query = query.ilike('size', `%${args.ukuran}%`);
        }

        const { data, error } = await query.limit(10);

        if (error) {
          functionResponseData = { error: error.message };
        } else {
          functionResponseData = { produk: data };
        }
      }

      result = await chat.sendMessage([{
        functionResponse: {
          name: name,
          response: functionResponseData
        }
      }]);

      calls = result.response.functionCalls();
    }

    return NextResponse.json({ reply: result.response.text() });
  } catch (error: any) {
    console.error('Chat API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
