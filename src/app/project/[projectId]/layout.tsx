import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { projectAccess } from "@/lib/db/schema";

/**
 * Server-side guard for a single project workspace. Mirrors `enforceProjectScope`
 * in `api/vcaas/_shared`: a signed-in user who has no `project_access` row for this
 * project is sent back to the dashboard instead of a workspace whose API calls
 * would all 404.
 */
export default async function ProjectWorkspaceLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect(`/sign-in?callbackUrl=/project/${projectId}`);
  const access = await db
    .select({ id: projectAccess.id })
    .from(projectAccess)
    .where(and(eq(projectAccess.userId, session.user.id), eq(projectAccess.projectId, projectId)))
    .limit(1);
  if (!access.length) redirect("/projects");
  return <>{children}</>;
}
