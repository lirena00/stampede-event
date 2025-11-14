import { NextRequest, NextResponse } from "next/server";
import { db } from "~/server/db";
import { teams, teamMembers } from "~/server/db/schema";
import { auth } from "~/lib/auth";
import { headers } from "next/headers";

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, description, eventId } = body;

    if (!name || !eventId) {
      return NextResponse.json(
        { error: "Team name and event ID are required" },
        { status: 400 }
      );
    }

    // Create the team
    const [newTeam] = await db
      .insert(teams)
      .values({
        name,
        description: description || null,
        event_id: eventId,
        created_by: session.user.id,
      })
      .returning();

    if (!newTeam) {
      return NextResponse.json(
        { error: "Failed to create team" },
        { status: 500 }
      );
    }

    // Add the creator as an admin team member
    await db.insert(teamMembers).values({
      team_id: newTeam.id,
      user_id: session.user.id,
      role: "admin",
      permissions: "{}",
    });

    return NextResponse.json({
      success: true,
      team: newTeam,
    });
  } catch (error) {
    console.error("Error creating team:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
