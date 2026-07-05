import { NextResponse } from "next/server";
import { geminiModel, executeCheckOrderStatus } from "@/lib/gemini";

export async function POST(request: Request) {
  try {
    const { message, history = [] } = await request.json();

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    // Ambil history maksimal 4 pertukaran terakhir saja (8 pesan)
    let limitedHistory = history.slice(-8).map((h: any) => ({
      role: h.role,
      parts: [{ text: h.text }]
    }));

    // Gemini API wajib diawali dengan role 'user'. Jika 'model' yang pertama, buang pesannya.
    while (limitedHistory.length > 0 && limitedHistory[0].role !== "user") {
      limitedHistory.shift();
    }

    const chat = geminiModel.startChat({
      history: limitedHistory,
    });

    let result = await chat.sendMessage(message);
    let showWhatsappButton = false;

    // Handle function calling if Gemini requests to use the tool
    const functionCalls = result.response.functionCalls();
    
    if (functionCalls && functionCalls.length > 0) {
      const call = functionCalls[0];
      if (call.name === "check_order_status") {
        const { invoice_code } = call.args as { invoice_code: string };
        const apiResponse = await executeCheckOrderStatus(invoice_code as string);
        
        // Return tool output to Gemini to get a natural language response
        result = await chat.sendMessage([{
          functionResponse: {
            name: "check_order_status",
            response: apiResponse
          }
        }]);
      }
    }

    const reply = result.response.text();
    
    // Fallback/heuristic for WhatsApp button visibility
    const lowerReply = reply.toLowerCase();
    if (
      lowerReply.includes("whatsapp") || 
      lowerReply.includes("wa ") ||
      lowerReply.includes("homeservice") || 
      lowerReply.includes("hubungi") || 
      lowerReply.includes("maaf")
    ) {
      showWhatsappButton = true;
    }

    return NextResponse.json({
      reply,
      show_whatsapp_button: showWhatsappButton
    });

  } catch (error) {
    console.error("Gemini API Error:", error);
    // Graceful fallback on API error/Rate Limit
    return NextResponse.json({
      reply: "Maaf, AI lagi sibuk. Coba beberapa saat lagi atau hubungi kami langsung lewat WhatsApp.",
      show_whatsapp_button: true
    });
  }
}
