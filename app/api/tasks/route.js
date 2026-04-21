import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

// GET /api/tasks - Lista tarefas (opcionalmente filtrado por usuário ou fase)
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const assignedTo = searchParams.get("assignedTo");
    const phaseId = searchParams.get("phaseId");

    const where = {};
    if (phaseId) where.phaseId = phaseId;

    // Se filtra por assignedTo, mostra tarefas do usuário OU tarefas globais (assignedTo = null)
    if (assignedTo) {
      where.OR = [{ assignedTo }, { assignedTo: null }];
    }

    const tasks = await prisma.task.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        assignee: { select: { id: true, name: true } },
        phase: {
          select: {
            id: true,
            name: true,
            project: { select: { id: true, name: true } },
          },
        },
      },
    });

    return NextResponse.json(tasks);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/tasks - Admin cria tarefa (individual ou global)
export async function POST(request) {
  try {
    const body = await request.json();
    const task = await prisma.task.create({
      data: {
        phaseId: body.phaseId,
        description: body.description,
        assignedTo: body.assignedTo || null, // null = tarefa para todos
        isCompleted: false,
      },
      include: {
        assignee: { select: { id: true, name: true } },
      },
    });
    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
