import { NextRequest, NextResponse } from "next/server";
import { connectAdminDB } from "@/lib/db";
import { getFeedbackModel } from "@/models/Feedback";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, query, message, source = "builder" } = body;

    const feedbackName = (name || "").trim();
    const feedbackEmail = (email || "").trim().toLowerCase();
    const feedbackQuery = (query || message || "").trim();

    if (!feedbackName || feedbackName.length < 2) {
      return NextResponse.json(
        { error: "Valid name (at least 2 characters) is required" },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!feedbackEmail || !emailRegex.test(feedbackEmail)) {
      return NextResponse.json(
        { error: "Valid email address is required" },
        { status: 400 }
      );
    }

    if (!feedbackQuery || feedbackQuery.length < 5) {
      return NextResponse.json(
        { error: "Query/feedback message must be at least 5 characters long" },
        { status: 400 }
      );
    }

    // Connect directly to Admin Database
    const adminConn = await connectAdminDB();
    const FeedbackModel = getFeedbackModel(adminConn);

    const feedbackSource = source === "mandate" ? "mandate" : "builder";

    const feedback = new FeedbackModel({
      name: feedbackName,
      email: feedbackEmail,
      query: feedbackQuery,
      message: feedbackQuery,
      source: feedbackSource,
      status: "new",
    });

    await feedback.save();

    return NextResponse.json(
      {
        success: true,
        message: "Feedback submitted successfully to Admin! We will review it shortly.",
        feedbackId: feedback._id,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating feedback in Admin DB:", error);
    return NextResponse.json(
      { error: error.message || "Failed to submit feedback" },
      { status: 500 }
    );
  }
}
