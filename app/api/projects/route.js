import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { PHASE_TEMPLATES } from "@/lib/phase-templates";

// GET /api/projects - Lista todos os projetos
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const type = searchParams.get("type");
    
    // Ler os cabeçalhos seguros injetados pelo Middleware (invulnerável a fraudes de URL)
    const userId = request.headers.get("x-user-id");
    const role = request.headers.get("x-user-role");

    const where = {};
    if (status) where.status = status;
    if (type) where.type = type;

    // Se for estagiário, só vê projetos atribuídos a ele ou não atribuídos a ninguém
    if (role === "TEAM" && userId) {
      where.OR = [
        { assignedTo: userId },
        { assignedTo: null }
      ];
    }

    const projects = await prisma.project.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        client: { select: { id: true, name: true } },
        phases: { orderBy: { order: "asc" } },
        _count: { select: { documents: true, transactions: true } },
      },
    });
    return NextResponse.json(projects);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/projects - Cria novo projeto + fases automáticas
export async function POST(request) {
  try {
    const body = await request.json();

    let finalClientId = body.clientId || null;

    // Se um novo cliente for fornecido, a gente cria ele no banco na hora
    if (body.newClientName && body.newClientName.trim() !== "") {
      const newClient = await prisma.client.create({
        data: { name: body.newClientName },
      });
      finalClientId = newClient.id;
    }

    // Cria o projeto
    const project = await prisma.project.create({
      data: {
        name: body.name,
        clientId: finalClientId,
        type: body.type,
        status: body.status || "PROSPECT",
        deadline: body.deadline ? new Date(body.deadline) : null,
        totalValue: body.totalValue || null,
        paymentType: body.paymentType || "CASH_UPFRONT",
        installments: body.installments || 1,
        upfrontValue: body.upfrontValue || null,
        notes: body.notes || null,
        assignedTo: body.assignedTo || null,
      },
    });

    // Cria as fases automaticamente com base no template
    const template = PHASE_TEMPLATES[body.type] || [];
    if (template.length > 0) {
      await prisma.phase.createMany({
        data: template.map((phase) => ({
          projectId: project.id,
          name: phase.name,
          order: phase.order,
          status: "PENDING",
        })),
      });
    }

    // Busca o projeto criado com as fases
    const fullProject = await prisma.project.findUnique({
      where: { id: project.id },
      include: {
        client: { select: { id: true, name: true } },
        phases: { orderBy: { order: "asc" } },
      },
    });

    return NextResponse.json(fullProject, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
