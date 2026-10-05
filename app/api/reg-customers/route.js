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

// GET: Returns registered customers (filtered by layoutId if provided, or all)
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const layoutId = searchParams.get("layoutId");

    await dbConnect();

    const query = {};
    if (layoutId && layoutId !== "all") {
      query.layoutId = layoutId;
    }

    const regCustomers = await RegCustomer.find(query);

    // Sort by S.No. (numerically if possible), then regDate, then createdAt
    regCustomers.sort((a, b) => {
      const numA = Number(a.sNo);
      const numB = Number(b.sNo);
      if (!isNaN(numA) && !isNaN(numB) && a.sNo !== "" && b.sNo !== "") {
        if (numA !== numB) return numA - numB;
      } else if (a.sNo && !b.sNo) {
        return -1;
      } else if (!a.sNo && b.sNo) {
        return 1;
      }

      const dateA = a.regDate?.trim();
      const dateB = b.regDate?.trim();
      if (dateA && dateB && dateA !== dateB) {
        return dateA.localeCompare(dateB);
      }
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });

    return NextResponse.json(regCustomers);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch registered customers: " + error.message },
      { status: 500 }
    );
  }
}

// POST: Creates a new registered customer record (No fields are mandatory)
export async function POST(request) {
  try {
    const authorized = await isAdminAuthenticated();
    if (!authorized) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const body = await request.json();
    const {
      layoutId,
      sNo,
      customerName,
      plotNo,
      sqYards,
      facing,
      regDate,
      documentNo,
      tlName,
    } = body;

    await dbConnect();

    let layoutName = "";
    if (layoutId) {
      const layout = await Layout.findById(layoutId);
      if (layout) {
        layoutName = layout.name;
      }
    }

    const newRegCustomer = await RegCustomer.create({
      layoutId: layoutId || null,
      layoutName,
      sNo: sNo ? String(sNo).trim() : "",
      customerName: customerName ? String(customerName).trim() : "",
      plotNo: plotNo ? String(plotNo).trim() : "",
      sqYards: sqYards ? String(sqYards).trim() : "",
      facing: facing ? String(facing).trim() : "",
      regDate: regDate ? String(regDate).trim() : "",
      documentNo: documentNo ? String(documentNo).trim() : "",
      tlName: tlName ? String(tlName).trim() : "",
    });

    return NextResponse.json({ success: true, regCustomer: newRegCustomer }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create registered customer: " + error.message },
      { status: 500 }
    );
  }
}
