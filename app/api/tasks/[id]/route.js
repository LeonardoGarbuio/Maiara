import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

// PUT /api/tasks/[id] - Marca tarefa como concluída
export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();

    const task = await prisma.task.update({
      where: { id },
      data: {
        isCompleted: body.isCompleted ?? undefined,
        description: body.description ?? undefined,
        assignedTo: body.assignedTo !== undefined ? body.assignedTo : undefined,
      },
    });

    return NextResponse.json(task);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/tasks/[id]
export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    await prisma.task.delete({ where: { id } });
    return NextResponse.json({ message: "Tarefa deletada" });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
