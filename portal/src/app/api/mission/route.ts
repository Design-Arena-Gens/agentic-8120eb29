import { NextResponse } from "next/server";
import { buildMission } from "@/lib/mission";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const idea = typeof body?.idea === "string" ? body.idea.trim() : "";

    if (!idea) {
      return NextResponse.json(
        { error: "Please provide a project idea or instruction for the agents." },
        { status: 400 }
      );
    }

    const mission = buildMission(idea);
    return NextResponse.json(mission);
  } catch (error) {
    console.error("Agent mission error", error);
    return NextResponse.json(
      {
        error:
          "The agent crew could not process this request right now. Please retry in a moment.",
      },
      { status: 500 }
    );
  }
}
