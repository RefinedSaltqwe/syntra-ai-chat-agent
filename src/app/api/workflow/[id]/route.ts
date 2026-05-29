import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { db } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { Edge, Node } from "@xyflow/react";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const session = await getKindeServerSession();
    const user = await session.getUser();
    if (!user) throw new Error("Unauthorized");

    const workflow = await db.workflow.findUnique({
      where: {
        id,
        userId: user.id,
      },
    });

    if (!workflow) {
      return NextResponse.json(
        {
          error: "Workflow not found",
        },
        { status: 404 },
      );
    }

    const flowObject = JSON.parse(workflow.flowObject);

    return NextResponse.json({
      success: true,
      data: {
        id: workflow.id,
        name: workflow.name,
        flowObject: flowObject,
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      {
        error: "Failed to fetch workflow",
      },
      {
        status: 500,
      },
    );
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { nodes, edges } = (await req.json()) as {
      nodes: Node[];
      edges: Edge[];
    };

    const session = await getKindeServerSession();
    const user = await session.getUser();
    if (!user) throw new Error("Unauthorized");

    const workflow = await db.workflow.findUnique({
      where: {
        id,
        userId: user.id,
      },
    });

    if (!workflow) {
      return NextResponse.json(
        {
          error: "Workflow not found",
        },
        { status: 404 },
      );
    }

    const updatedWorkflow = await db.workflow.update({
      where: { id },
      data: {
        flowObject: JSON.stringify({ nodes, edges }),
      },
    });

    console.log(`Backend: Workflow ${id} updated in database`, updatedWorkflow);

    return NextResponse.json({
      success: true,
      data: {
        id: updatedWorkflow.id,
        name: updatedWorkflow.name,
        flowObject: JSON.parse(updatedWorkflow.flowObject),
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      {
        error: "Failed to update workflow",
      },
      {
        status: 500,
      },
    );
  }
}
