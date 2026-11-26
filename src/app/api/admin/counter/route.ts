import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/apiAdmin";
import { patchFirestoreDoc } from "@/lib/firestoreRest";
import { revalidatePath, revalidateTag } from "next/cache";
import { CACHE_TAGS } from "@/lib/serverContent";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const counterConfigSchema = z.object({
  ratingMode: z.enum(["site", "google"]).default("site"),
  googleRating: z.number().min(0).max(5).default(4.9),
  googleReviewCount: z.number().int().min(0).default(0),
  googleReviewUrl: z.string().optional().default(""),

  testimonialsMode: z.enum(["auto", "manual"]).default("auto"),
  testimonialsManualValue: z
    .number()
    .int("Manual value must be an integer")
    .min(0, "Manual value cannot be negative")
    .max(9999999, "Manual value cannot exceed 9,999,999")
    .default(0),
  testimonialsLabel: z
    .string()
    .min(1, "Label is required")
    .max(60, "Label cannot exceed 60 characters"),

  projectsThisYearMode: z.enum(["auto", "manual"]).default("auto"),
  projectsThisYearManualValue: z
    .number()
    .int("Manual value must be an integer")
    .min(0, "Manual value cannot be negative")
    .max(9999999, "Manual value cannot exceed 9,999,999")
    .default(0),
  projectsThisYearLabel: z
    .string()
    .min(1, "Label is required")
    .max(60, "Label cannot exceed 60 characters"),

  totalProjectsMode: z.enum(["auto", "manual"]).default("auto"),
  totalProjectsManualValue: z
    .number()
    .int("Manual value must be an integer")
    .min(0, "Manual value cannot be negative")
    .max(9999999, "Manual value cannot exceed 9,999,999")
    .default(0),
  totalProjectsLabel: z
    .string()
    .min(1, "Label is required")
    .max(60, "Label cannot exceed 60 characters"),

  visitorsMode: z.enum(["auto", "manual"]).default("auto"),
  visitorsManualValue: z
    .number()
    .int("Manual value must be an integer")
    .min(0, "Manual value cannot be negative")
    .max(9999999, "Manual value cannot exceed 9,999,999")
    .default(0),
  visitorsLabel: z
    .string()
    .min(1, "Label is required")
    .max(60, "Label cannot exceed 60 characters"),

  // Backward compatibility overrides
  testimonialsOverride: z.number().optional(),
  projectsThisYearOverride: z.number().optional(),
  totalProjectsOverride: z.number().optional(),
  visitorsOverride: z.number().optional(),
});

export type ValidatedCounterConfig = z.infer<typeof counterConfigSchema>;

export async function POST(req: Request) {
  const auth = await requireAdmin(req, { bucket: "admin-counter", limit: 60 });
  if ("response" in auth) return auth.response;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parseResult = counterConfigSchema.safeParse(body);
  if (!parseResult.success) {
    const issue = parseResult.error.issues[0];
    const path = issue.path.join(".");
    const message = `${path ? `${path}: ` : ""}${issue.message}`;
    return NextResponse.json(
      {
        error: message,
        errors: parseResult.error.issues.map((i) => ({
          field: i.path.join("."),
          message: i.message,
        })),
      },
      { status: 400 }
    );
  }

  const data = parseResult.data;
  const now = new Date().toISOString();
  const editorName = auth.admin.email.split("@")[0] || "Admin";

  // Ensure legacy overrides stay synced for any legacy consumers
  const payload = {
    ...data,
    testimonialsOverride: data.testimonialsMode === "manual" ? data.testimonialsManualValue : 0,
    projectsThisYearOverride:
      data.projectsThisYearMode === "manual" ? data.projectsThisYearManualValue : 0,
    totalProjectsOverride: data.totalProjectsMode === "manual" ? data.totalProjectsManualValue : 0,
    visitorsOverride: data.visitorsMode === "manual" ? data.visitorsManualValue : 0,
    lastEditedBy: editorName,
    lastEditedEmail: auth.admin.email,
    lastEditedAt: now,
    updatedAt: now,
  };

  try {
    // 1. Write config to siteContent/counter
    await patchFirestoreDoc("siteContent/counter", payload, auth.admin.idToken);

    // 2. Audit log entry
    try {
      const auditDocId = `counter_${Date.now()}`;
      await patchFirestoreDoc(
        `auditLogs/${auditDocId}`,
        {
          action: "UPDATE_HOMEPAGE_STATS",
          target: "siteContent/counter",
          userEmail: auth.admin.email,
          userName: editorName,
          timestamp: now,
          details: {
            testimonials: {
              mode: data.testimonialsMode,
              value: data.testimonialsManualValue,
              label: data.testimonialsLabel,
            },
            projectsThisYear: {
              mode: data.projectsThisYearMode,
              value: data.projectsThisYearManualValue,
              label: data.projectsThisYearLabel,
            },
            totalProjects: {
              mode: data.totalProjectsMode,
              value: data.totalProjectsManualValue,
              label: data.totalProjectsLabel,
            },
            visitors: {
              mode: data.visitorsMode,
              value: data.visitorsManualValue,
              label: data.visitorsLabel,
            },
          },
        },
        auth.admin.idToken
      );
    } catch (auditErr) {
      console.warn("Audit log creation note:", auditErr);
    }

    // 3. On-demand ISR revalidation so change appears immediately
    try {
      revalidatePath("/");
      revalidateTag(CACHE_TAGS.site);
    } catch (revalErr) {
      console.warn("Revalidation warning:", revalErr);
    }

    return NextResponse.json({
      success: true,
      message: "Stats configuration saved successfully!",
      config: payload,
    });
  } catch (err: any) {
    console.error("Counter config save error:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to save counter configuration." },
      { status: 500 }
    );
  }
}
