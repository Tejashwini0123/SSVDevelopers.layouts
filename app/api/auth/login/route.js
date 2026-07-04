import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

export async function POST(request) {
  try {
    const { username, password } = await request.json();

    const envUsername = process.env.ADMIN_USERNAME || "Admin@123";
    const envPassword = process.env.ADMIN_PASSWORD || "180825";

    if (username === envUsername && password === envPassword) {
      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) {
        return NextResponse.json(
          { error: "Server error: JWT secret is not configured" },
          { status: 500 }
        );
      }

      // Generate JWT Token
      const token = jwt.sign({ username }, jwtSecret, { expiresIn: "1d" });

      // Set cookie
      const cookieStore = await cookies();
      cookieStore.set("admin_session", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 60 * 60 * 24, // 1 day
        path: "/",
      });

      return NextResponse.json({ success: true, message: "Logged in successfully" });
    }

    return NextResponse.json(
      { error: "Invalid username or password" },
      { status: 401 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Something went wrong: " + error.message },
      { status: 500 }
    );
  }
}
