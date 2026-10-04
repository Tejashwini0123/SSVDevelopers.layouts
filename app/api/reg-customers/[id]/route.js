import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import RegCustomer from "@/lib/models/RegCustomer";
import Layout from "@/lib/models/Layout";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

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

// PUT: Update registered customer details (No fields are mandatory)
export async function PUT(request, { params }) {
  try {
    const authorized = await isAdminAuthenticated();
    if (!authorized) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const {
      layoutId,
      sNo,
      customerName,
      sqYards,
      facing,
      regDate,
      documentNo,
    } = body;

    await dbConnect();

    const regCustomer = await RegCustomer.findById(id);
    if (!regCustomer) {
      return NextResponse.json({ error: "Registered customer not found." }, { status: 404 });
    }

    if (sNo !== undefined) regCustomer.sNo = String(sNo).trim();
    if (customerName !== undefined) regCustomer.customerName = String(customerName).trim();
    if (sqYards !== undefined) regCustomer.sqYards = String(sqYards).trim();
    if (facing !== undefined) regCustomer.facing = String(facing).trim();
    if (regDate !== undefined) regCustomer.regDate = String(regDate).trim();
    if (documentNo !== undefined) regCustomer.documentNo = String(documentNo).trim();

    if (layoutId) {
      regCustomer.layoutId = layoutId;
      const layout = await Layout.findById(layoutId);
      if (layout) {
        regCustomer.layoutName = layout.name;
      }
    }

    await regCustomer.save();

    return NextResponse.json({ success: true, regCustomer });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update registered customer: " + error.message },
      { status: 500 }
    );
  }
}

// DELETE: Delete registered customer record
export async function DELETE(request, { params }) {
  try {
    const authorized = await isAdminAuthenticated();
    if (!authorized) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const { id } = await params;

    await dbConnect();
    const regCustomer = await RegCustomer.findByIdAndDelete(id);

    if (!regCustomer) {
      return NextResponse.json({ error: "Registered customer not found." }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Registered customer deleted successfully" });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete registered customer: " + error.message },
      { status: 500 }
    );
  }
}
