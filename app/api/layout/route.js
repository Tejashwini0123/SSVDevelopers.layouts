import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Layout from "@/lib/models/Layout";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

// Helper to check admin authorization
async function isAdminAuthenticated() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("admin_session")?.value;
    if (!token) return false;

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) return false;

    const decoded = jwt.verify(token, jwtSecret);
    return !!decoded.username;
  } catch {
    return false;
  }
}

// GET: Returns list of layouts (metadata only, excluding base64 image data)
export async function GET() {
  try {
    await dbConnect();
    const layouts = await Layout.find().select("-image").sort({ name: 1 });
    return NextResponse.json(layouts);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch layouts: " + error.message },
      { status: 500 }
    );
  }
}

// POST: Creates a new named layout sheet
export async function POST(request) {
  try {
    const authorized = await isAdminAuthenticated();
    if (!authorized) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const { name, image } = await request.json();
    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Layout Name is required" }, { status: 400 });
    }
    if (!image) {
      return NextResponse.json({ error: "Image data is required" }, { status: 400 });
    }

    await dbConnect();

    // Check unique name
    const existingLayout = await Layout.findOne({ name: name.trim() });
    if (existingLayout) {
      return NextResponse.json(
        { error: `Layout name "${name}" already exists.` },
        { status: 400 }
      );
    }

    const layout = await Layout.create({
      name: name.trim(),
      image,
    });

    return NextResponse.json({
      success: true,
      message: "Layout created successfully",
      layout: {
        _id: layout._id,
        name: layout.name,
        updatedAt: layout.updatedAt,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to save layout: " + error.message },
      { status: 500 }
    );
  }
}
