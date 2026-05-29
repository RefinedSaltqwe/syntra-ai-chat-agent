import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { db } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { createNode, NodeTypeEnum } from "@/lib/workflow/node-config";

export async function GET() {
  try {
    const session = await getKindeServerSession();
    const user = await session.getUser();
    if (!user) throw new Error("Unauthorized");

    const workflows = await db.workflow.findMany({
      where: { userId: user.id },
      select: {
        id: true,
        name: true,
        description: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      data: workflows,
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

export async function POST(req: Request) {
  try {
    const { name, description } = await req.json();
    const session = await getKindeServerSession();
    const user = await session.getUser();

    if (!user) throw new Error("Unauthorized");
    if (!name) throw new Error("Name field required");

    const userId = user.id;
    const startNode = createNode({
      type: NodeTypeEnum.START,
    });

    const flowObject = {
      nodes: [
        {
          id: startNode.id,
          type: startNode.type,
          position: startNode.position,
          data: startNode.data,
          deletable: false,
        },
      ],
      edges: [],
    };

    const workflow = await db.workflow.create({
      data: {
        userId,
        name,
        description: description || "",
        flowObject: JSON.stringify(flowObject),
      },
    });

    return NextResponse.json({
      success: true,
      data: workflow,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      {
        error: "Failed to create workflow",
      },
      {
        status: 500,
      },
    );
  }
}
