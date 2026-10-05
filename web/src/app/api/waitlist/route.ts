import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

interface WaitlistEntry {
  id: string;
  email: string;
  role: string;
  twitterHandle: string | null;
  consent: boolean;
  ip: string;
  timestamp: string;
}

const cwd = process.cwd();
const DATA_DIR = cwd.endsWith("web")
  ? path.join(cwd, "data")
  : path.join(cwd, "web", "data");
const WAITLIST_FILE = path.join(DATA_DIR, "waitlist.json");

function ensureDirectoryExists() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function readWaitlist(): WaitlistEntry[] {
  ensureDirectoryExists();
  if (!fs.existsSync(WAITLIST_FILE)) {
    return [];
  }
  try {
    const raw = fs.readFileSync(WAITLIST_FILE, "utf-8");
    return JSON.parse(raw);
  } catch (error) {
    console.error("Error reading waitlist.json:", error);
    return [];
  }
}

function writeWaitlist(entries: WaitlistEntry[]) {
  ensureDirectoryExists();
  fs.writeFileSync(WAITLIST_FILE, JSON.stringify(entries, null, 2), "utf-8");
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);

    if (!body || !body.email || typeof body.email !== "string") {
      return NextResponse.json(
        { error: "Valid email address is required" },
        { status: 400 }
      );
    }

    const email = body.email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    const role = typeof body.role === "string" ? body.role : "Community";
    const twitterHandle =
      typeof body.twitterHandle === "string" && body.twitterHandle.trim()
        ? body.twitterHandle.trim().replace(/^@/, "")
        : null;
    const consent = Boolean(body.consent);

    const forwarded = req.headers.get("x-forwarded-for");
    const ip = forwarded ? forwarded.split(",")[0].trim() : req.headers.get("x-real-ip") || "127.0.0.1";

    const entries = readWaitlist();
    const existingIndex = entries.findIndex((entry) => entry.email === email);

    if (existingIndex !== -1) {
      // Update entry if role or twitterHandle was updated
      entries[existingIndex] = {
        ...entries[existingIndex],
        role: role || entries[existingIndex].role,
        twitterHandle: twitterHandle || entries[existingIndex].twitterHandle,
        ip,
        timestamp: new Date().toISOString(),
      };
      writeWaitlist(entries);

      return NextResponse.json(
        {
          success: true,
          message: "Already on waitlist (entry updated)",
          email,
          totalSubscribers: entries.length,
        },
        { status: 200 }
      );
    }

    const newEntry: WaitlistEntry = {
      id: crypto.randomUUID(),
      email,
      role,
      twitterHandle,
      consent,
      ip,
      timestamp: new Date().toISOString(),
    };

    entries.push(newEntry);
    writeWaitlist(entries);

    return NextResponse.json(
      {
        success: true,
        message: "Successfully joined Ventrion waitlist",
        email,
        totalSubscribers: entries.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Waitlist API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  const entries = readWaitlist();
  return NextResponse.json({
    status: "ok",
    totalSubscribers: entries.length,
  });
}
