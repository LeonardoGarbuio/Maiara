import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

// PUT /api/tasks/[id] - Marca tarefa como concluída
export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();

    const updateData = {
      isCompleted: body.isCompleted ?? undefined,
      description: body.description ?? undefined,
    };

    if (body.assignees !== undefined) {
      if (Array.isArray(body.assignees) && body.assignees.length > 0) {
        updateData.assignees = { set: body.assignees.map(id => ({ id })) };
      } else {
        updateData.assignees = { set: [] };
      }
    } else if (body.assignedTo !== undefined) {
      if (body.assignedTo) {
        updateData.assignees = { set: [{ id: body.assignedTo }] };
      } else {
        updateData.assignees = { set: [] };
      }
    }

    const task = await prisma.task.update({
      where: { id },
      data: updateData,
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
