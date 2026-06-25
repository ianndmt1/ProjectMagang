import { NextResponse } from "next/server"

export async function POST(req: Request) {
  const { username, password } = await req.json()
  
  if (username === "admin" && password === "santdoor2nd") {
    const response = NextResponse.json({ success: true })
    response.cookies.set("admin_token", "authenticated", {
      httpOnly: true,
      path: "/",
      maxAge: 60 * 60 * 24, // 1 hari
    })
    return response
  }
  
  return NextResponse.json({ success: false, message: "Username atau password salah" }, { status: 401 })
}
