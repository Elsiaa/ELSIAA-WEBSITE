import { NextRequest, NextResponse } from "next/server";
import { getParsedProjectApiKeyFromRequest } from "@/lib/project-api-key";
import { getProjectByApiKey } from "@/lib/projects";
import { createPendingDeviceRequest } from "@/lib/project-auth-devices";
import { findActiveDeviceByExternalId } from "@/lib/project-auth-device-lookup";
import { getServerSupabaseClient } from "@/lib/supabase";
import { getProjectAuthDeviceCount } from "@/lib/project-auth-devices";

/**
 * POST /api/entitlement/request-device
 * External sites call this to request a device be added to a project.
 * Auth: x-project-api-key or Authorization: Bearer <project_api_key>
 * Body: { name: string, deviceId?: string }
 *
 * Creates a device with status "pending". A super admin must approve it
 * in the admin panel before it becomes active.
 *
 * If a device with the same deviceId already exists for this project,
 * returns the existing device with 200 instead of erroring.
 */
export async function POST(request: NextRequest) {
  try {
    const parsedKey = getParsedProjectApiKeyFromRequest(request);
    if (!parsedKey) {
      return NextResponse.json({ error: "Missing project API key" }, { status: 401 });
    }

    const project = await getProjectByApiKey(parsedKey.lookupKey);
    if (!project) {
      return NextResponse.json({ error: "Invalid project API key" }, { status: 403 });
    }

    const body = await request.json();
    const { name, deviceId } = body || {};

    if (!name || typeof name !== "string" || name.trim() === "") {
      return NextResponse.json(
        { error: "name is required (e.g. device hostname or description)" },
        { status: 400 },
      );
    }

    // If deviceId provided, check if it already exists for this project
    if (deviceId && typeof deviceId === "string") {
      const existing = await findExistingDevice(project.id, deviceId.trim());
      if (existing) {
        return NextResponse.json({
          message: "Device already registered for this project.",
          device: {
            id: existing.id,
            name: existing.name,
            deviceId: existing.deviceId,
            status: existing.status,
          },
        });
      }
    }

    if (project.deviceLimit != null) {
      const currentCount = await getProjectAuthDeviceCount(project.id);
      if (currentCount >= project.deviceLimit) {
        return NextResponse.json(
          {
            error: `Device limit reached (${project.deviceLimit}) for this project. Contact your administrator.`,
          },
          { status: 403 },
        );
      }
    }

    const device = await createPendingDeviceRequest({
      projectId: project.id,
      name: name.trim(),
      deviceId: typeof deviceId === "string" ? deviceId : undefined,
    });

    if (!device) {
      return NextResponse.json({ error: "Failed to create device request" }, { status: 500 });
    }

    return NextResponse.json(
      {
        message: "Device request submitted. A super admin will review and approve it.",
        device: {
          id: device.id,
          name: device.name,
          deviceId: device.deviceId,
          status: device.status,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Device request error:", error);
    return NextResponse.json({ error: "Failed to submit device request" }, { status: 500 });
  }
}

/** Look up any device (any status) by project + external device_id. */
async function findExistingDevice(projectId: string, externalDeviceId: string) {
  const supabase = getServerSupabaseClient();
  const { data, error } = await supabase
    .from("project_auth_devices")
    .select("*")
    .eq("project_id", projectId)
    .eq("device_id", externalDeviceId)
    .maybeSingle();

  if (error || !data) return null;
  return {
    id: data.id as string,
    name: data.name as string,
    deviceId: data.device_id as string,
    status: data.status as string,
  };
}
