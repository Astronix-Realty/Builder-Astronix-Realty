import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Property from "@/models/Property";
import { checkRBAC, getOwnershipQuery } from "@/lib/rbac";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const STANDARD_DEFAULT_QUESTIONS = [
  {
    id: "std_q_1",
    question: "Is this property RERA approved and legally title-verified?",
    defaultAskedBy: "Verified Visitor",
    order: 1,
  },
  {
    id: "std_q_2",
    question: "Which banks have pre-approved home loans for this property?",
    defaultAskedBy: "Verified Visitor",
    order: 2,
  },
  {
    id: "std_q_3",
    question: "What is the construction schedule and expected possession timeline?",
    defaultAskedBy: "Verified Visitor",
    order: 3,
  },
  {
    id: "std_q_4",
    question: "How is the carpet area measured and what is the usable layout?",
    defaultAskedBy: "Verified Visitor",
    order: 4,
  },
  {
    id: "std_q_5",
    question: "Are there any hidden costs or surprise additional charges?",
    defaultAskedBy: "Verified Visitor",
    order: 5,
  },
  {
    id: "std_q_6",
    question: "What lifestyle amenities and sustainable eco-infrastructure are included?",
    defaultAskedBy: "Verified Visitor",
    order: 6,
  },
  {
    id: "std_q_7",
    question: "How does the unit booking and token payment process work?",
    defaultAskedBy: "Verified Visitor",
    order: 7,
  },
  {
    id: "std_q_8",
    question: "What is the maintenance framework and post-handover management structure?",
    defaultAskedBy: "Verified Visitor",
    order: 8,
  },
];

/**
 * GET /api/inventory/faqs
 * Fetches all Q&A questions (pending, answered, edit_pending, unanswered defaults) across all properties.
 */
export async function GET(req: NextRequest) {
  try {
    const { context, errorResponse } = await checkRBAC(req, ["builder", "mandate", "teamLeader"]);
    if (errorResponse) return errorResponse;

    await dbConnect();

    let ownershipQuery = getOwnershipQuery(context!);
    if (context!.role === "builder") {
      ownershipQuery = { builderId: context!.userId, role: { $ne: "mandate" } };
    }

    const properties = await Property.find({
      ...ownershipQuery,
      isDeleted: { $ne: true },
    }).lean();

    const allFaqs: any[] = [];

    for (const prop of properties) {
      const propIdStr = (prop as any)._id?.toString() || "";
      const propTitle = (prop as any).name || "Property";
      const propType = prop.type || "property";
      const faqsList = Array.isArray(prop.details?.faqs) ? prop.details.faqs : [];
      const existingQuestionKeys = new Set(faqsList.map((f: any) => (f.question || "").toLowerCase().trim()));

      // 1. Existing Saved FAQs
      for (const item of faqsList) {
        if (!item || !item.question) continue;

        allFaqs.push({
          id: (item.id || item._id || `faq_${Date.now()}`).toString(),
          question: item.question,
          answer: item.answer || "",
          askedBy: item.askedBy || item.name || "Verified Visitor",
          askedByPhone: item.askedByPhone || item.phone || "",
          hierarchyLevel: item.hierarchyLevel || (prop.type ? prop.type.charAt(0).toUpperCase() + prop.type.slice(1) : "Property"),
          propertyId: propIdStr,
          propertyName: propTitle,
          propertyType: propType,
          status: item.status || (item.answer ? "answered" : "pending"),
          isPublished: item.isPublished === true || item.status === "answered",
          createdAt: item.createdAt || prop.createdAt || new Date(),
          answeredAt: item.answeredAt || null,
          editStatus: item.editStatus || "none",
          pendingAnswer: item.pendingAnswer || "",
          editReason: item.editReason || "",
          isDefaultQuestion: Boolean(item.isDefaultQuestion || item.id?.startsWith("std_q_")),
        });
      }

      // 2. Add Unanswered Standard Default Questions for Builder to Answer
      for (const std of STANDARD_DEFAULT_QUESTIONS) {
        const stdKey = std.question.toLowerCase().trim();
        if (!existingQuestionKeys.has(stdKey)) {
          allFaqs.push({
            id: `${std.id}_${propIdStr}`,
            question: std.question,
            answer: "",
            askedBy: std.defaultAskedBy,
            askedByPhone: "",
            hierarchyLevel: prop.type ? prop.type.charAt(0).toUpperCase() + prop.type.slice(1) : "Property",
            propertyId: propIdStr,
            propertyName: propTitle,
            propertyType: propType,
            status: "unanswered",
            isPublished: false,
            createdAt: prop.createdAt || new Date(),
            answeredAt: null,
            editStatus: "none",
            pendingAnswer: "",
            editReason: "",
            isDefaultQuestion: true,
            order: std.order,
          });
        }
      }
    }

    // Sort: pending & edit_pending first, then answered, then unanswered defaults
    allFaqs.sort((a, b) => {
      const score = (item: any) => {
        if (item.editStatus === "pending") return 1;
        if (item.status === "pending") return 2;
        if (item.status === "unanswered") return 3;
        return 4;
      };
      return score(a) - score(b);
    });

    return NextResponse.json(
      { success: true, faqs: allFaqs },
      { status: 200, headers: { "Cache-Control": "no-store, must-revalidate" } }
    );
  } catch (error: any) {
    console.error("[GET /api/inventory/faqs] error:", error.message);
    return NextResponse.json(
      { success: false, error: "Failed to fetch Q&A questions", faqs: [] },
      { status: 500 }
    );
  }
}

/**
 * POST /api/inventory/faqs
 * Handles Answer submission, Edit Requests (with mandatory editReason), and deletion.
 */
export async function POST(req: NextRequest) {
  try {
    const { context, errorResponse } = await checkRBAC(req, ["builder", "mandate", "teamLeader"]);
    if (errorResponse) return errorResponse;

    const body = await req.json();
    const {
      propertyId,
      faqId,
      answer,
      action = "publish",
      editReason,
      questionText,
      askedBy,
      hierarchyLevel,
    } = body;

    if (!propertyId || !faqId) {
      return NextResponse.json(
        { success: false, error: "propertyId and faqId are required" },
        { status: 400 }
      );
    }

    await dbConnect();

    const property = await Property.findById(propertyId);
    if (!property) {
      return NextResponse.json(
        { success: false, error: "Property not found" },
        { status: 404 }
      );
    }

    let faqsList = Array.isArray(property.details?.faqs) ? [...property.details.faqs] : [];

    if (action === "delete") {
      faqsList = faqsList.filter((f: any) => (f.id || f._id)?.toString() !== faqId.toString());
    } else if (action === "request_edit" || action === "edit") {
      // Builder submits Edit Request for an existing answered FAQ -> Needs Admin Approval
      const cleanAnswer = (answer || "").trim();
      const cleanReason = (editReason || "").trim();

      if (!cleanAnswer) {
        return NextResponse.json(
          { success: false, error: "Proposed new answer text is required" },
          { status: 400 }
        );
      }
      if (!cleanReason) {
        return NextResponse.json(
          { success: false, error: "Mandatory reason for edit is required for Admin review" },
          { status: 400 }
        );
      }

      let found = false;
      faqsList = faqsList.map((f: any) => {
        const itemId = (f.id || f._id || "").toString();
        const isIdMatch = itemId === faqId.toString() || faqId.toString().startsWith(itemId) || itemId.startsWith(faqId.toString());
        const isQMatch = Boolean(questionText && f.question && f.question.trim().toLowerCase() === questionText.trim().toLowerCase());

        if (isIdMatch || isQMatch) {
          found = true;
          return {
            ...f,
            editStatus: "pending",
            pendingAnswer: cleanAnswer,
            editReason: cleanReason,
            editRequestedAt: new Date(),
            editRequestedBy: context!.userId,
          };
        }
        return f;
      });

      if (!found) {
        return NextResponse.json(
          { success: false, error: "Target FAQ not found for edit request" },
          { status: 404 }
        );
      }
    } else {
      // Action === "publish" / "answer" (Initial Answer for Unanswered or Pending Question)
      const cleanAnswer = (answer || "").trim();
      if (!cleanAnswer) {
        return NextResponse.json(
          { success: false, error: "Answer text is required" },
          { status: 400 }
        );
      }

      let found = false;
      faqsList = faqsList.map((f: any) => {
        const itemId = (f.id || f._id || "").toString();
        const isIdMatch = itemId === faqId.toString() || faqId.toString().startsWith(itemId) || itemId.startsWith(faqId.toString());
        const isQMatch = Boolean(questionText && f.question && f.question.trim().toLowerCase() === questionText.trim().toLowerCase());

        if (isIdMatch || isQMatch) {
          found = true;

          // If ALREADY answered, block direct overwriting and require edit approval
          if (f.status === "answered" && f.answer && f.answer !== cleanAnswer) {
            throw new Error("This FAQ is already answered and live. To update the answer, please use 'Request Edit' with a valid reason for Admin Approval.");
          }

          return {
            ...f,
            answer: cleanAnswer,
            status: "answered",
            isPublished: true,
            answeredAt: new Date(),
            answeredBy: context!.userId,
            editStatus: "none",
          };
        }
        return f;
      });

      // If it's a new initial answer for a standard default question not yet in faqsList
      if (!found) {
        const newFaqItem = {
          id: faqId,
          question: questionText || "Property FAQ",
          answer: cleanAnswer,
          askedBy: askedBy || "Verified Visitor",
          hierarchyLevel: hierarchyLevel || (property.type ? property.type.charAt(0).toUpperCase() + property.type.slice(1) : "Property"),
          status: "answered",
          isPublished: true,
          answeredAt: new Date(),
          answeredBy: context!.userId,
          createdAt: new Date(),
          editStatus: "none",
          isDefaultQuestion: true,
        };
        faqsList = [newFaqItem, ...faqsList];
      }
    }

    await Property.updateOne(
      { _id: property._id },
      { $set: { "details.faqs": faqsList } }
    );

    const isEditReq = action === "request_edit" || action === "edit";

    return NextResponse.json({
      success: true,
      message: isEditReq
        ? "Edit request submitted successfully! Pending Admin Approval."
        : (action === "delete" ? "Question deleted successfully" : "Answer published successfully to Visitor FAQs!"),
      faqs: faqsList,
    });
  } catch (error: any) {
    console.error("[POST /api/inventory/faqs] error:", error.message);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update FAQ" },
      { status: 500 }
    );
  }
}
