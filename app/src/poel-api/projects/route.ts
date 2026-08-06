import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { addProject, getUserProjects } from "@/lib/projects";
import { isSuperAdmin } from "@/lib/permissions";

// Get projects for the authenticated user
export async function GET() {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const projects = await getUserProjects(userId);
    return NextResponse.json({ projects });
  } catch (error) {
    console.error("Error fetching projects:", error);
    return NextResponse.json({ error: "Failed to fetch projects" }, { status: 500 });
  }
}

// Add a project (superuser only)
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!(await isSuperAdmin())) {
      return NextResponse.json({ error: "Only superusers can create projects" }, { status: 403 });
    }

    const body = await request.json();
    const { targetCompanyId, title, url, description } = body;

    if (!targetCompanyId || !title || !url) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const project = await addProject(targetCompanyId, title, url, description);
    return NextResponse.json({ project });
  } catch (error) {
    console.error("Error creating project:", error);
    return NextResponse.json({ error: "Failed to create project" }, { status: 500 });
  }
}
