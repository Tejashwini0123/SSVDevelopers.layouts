import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Layout from "@/lib/models/Layout";
import Plot from "@/lib/models/Plot";
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

// GET: Returns a specific layout (including base64 image)
export async function GET(request, { params }) {
  try {
    const { id } = await params;

    await dbConnect();
    const layout = await Layout.findById(id);
    if (!layout) {
      return NextResponse.json({ error: "Layout not found" }, { status: 404 });
    }

    return NextResponse.json(layout);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch layout: " + error.message },
      { status: 500 }
    );
  }
}

// DELETE: Deletes the layout and all associated plots (cascade delete)
export async function DELETE(request, { params }) {
  try {
    const authorized = await isAdminAuthenticated();
    if (!authorized) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const { id } = await params;

    await dbConnect();

    // Delete the layout sheet
    const layout = await Layout.findByIdAndDelete(id);
    if (!layout) {
      return NextResponse.json({ error: "Layout not found" }, { status: 404 });
    }

    // Cascade delete all plots associated with this layout
    const plotsResult = await Plot.deleteMany({ layoutId: id });

    return NextResponse.json({
      success: true,
      message: `Layout "${layout.name}" and its ${plotsResult.deletedCount} plots deleted successfully.`,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete layout: " + error.message },
      { status: 500 }
    );
  }
}
