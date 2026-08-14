import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getDevelopmentBySlug } from "@/lib/db/queries/developments";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth-token";
import { stands } from "@/lib/db/schema";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/lib/db/index";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const cookieStore = await cookies();
  const session = await verifySessionToken(cookieStore.get(SESSION_COOKIE)?.value);
  if (session?.user.role !== "SYSTEM_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { slug } = await params;
  const dev = await getDevelopmentBySlug(slug);
  if (!dev) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    id: dev.id,
    name: dev.name,
    location: dev.location,
    province: dev.province,
    description: dev.description,
    developerName: dev.developerName,
    developerContact: dev.developerContact,
    startingPrice: dev.startingPrice,
    pricePerSqm: dev.pricePerSqm,
    depositAmount: dev.depositAmount,
    interestRate: dev.interestRate,
    paymentDurationMonths: dev.paymentDurationMonths,
    paymentTerms: dev.paymentTerms,
    termsAndConditions: dev.termsAndConditions,
    infrastructureStatus: dev.infrastructureStatus,
    heroImage: dev.heroImage,
    gallery: dev.gallery,
    amenities: dev.amenities,
    brochureUrl: dev.brochureUrl ?? "",
    stands: (await db.select().from(stands).where(and(
      eq(stands.developmentId, dev.id),
      isNull(stands.archivedAt),
      isNull(stands.deletedAt),
    )))
      .map(s => ({
        id: s.id,
        standNumber: s.standNumber,
        sizeSqm: s.sizeSqm,
        price: s.price,
        status: s.status,
        phase: s.phase,
        notes: s.notes ?? "",
      })),
  });
}
