import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { cacheInvalidatePrefix } from "@/lib/cache";

// GET /api/projects/[id] - Busca projeto completo
export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        client: true,
        phases: {
          orderBy: { order: "asc" },
          include: {
            tasks: {
              include: {
                assignee: { select: { id: true, name: true } },
              },
            },
          },
        },
        documents: { orderBy: { createdAt: "desc" } },
        transactions: { orderBy: { transactionDate: "desc" } },
        history: {
          orderBy: { changedAt: "desc" },
          take: 10,
          select: { id: true, changedAt: true, dataSnapshot: true, user: { select: { id: true, name: true } } },
        },
      },
    });
    if (!project) {
      return NextResponse.json({ error: "Projeto não encontrado" }, { status: 404 });
    }
    return NextResponse.json(project);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT /api/projects/[id] - Atualiza projeto (com snapshot de segurança)
export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Busca o estado ATUAL antes de alterar (Trigger de segurança)
    const currentProject = await prisma.project.findUnique({
      where: { id },
      include: { phases: true },
    });

    if (!currentProject) {
      return NextResponse.json({ error: "Projeto não encontrado" }, { status: 404 });
    }

    // Salva snapshot na tabela de histórico
    if (body.changedBy) {
      await prisma.projectHistory.create({
        data: {
          projectId: id,
          dataSnapshot: JSON.parse(JSON.stringify(currentProject)),
          changedBy: body.changedBy,
        },
      });
    }

    // LÓGICA DO FINANCEIRO AUTOMÁTICO:
    if (body.status === "FINISHED" && currentProject.status !== "FINISHED") {
      const finalValue = body.totalValue ?? currentProject.totalValue;
      const paymentType = body.paymentType ?? currentProject.paymentType;
      const installmentsCount = body.installments ?? currentProject.installments;
      const upfrontAmount = body.upfrontValue ?? currentProject.upfrontValue;

      if (finalValue && finalValue > 0) {
        // SEGURANÇA: Verifica se já não existe transações geradas para este projeto
        // Bloqueio rigoroso: se tiver QUALQUER dinheiro vinculado a ele, não gera novamente.
        const existingTxCount = await prisma.financialTransaction.count({
          where: { projectId: id },
        });

        if (existingTxCount === 0) {
          const transactionsData = [];
          const now = new Date();
          
          // CONFIGURAÇÃO: Mude de "false" para "true" se preferir que as parcelas sejam 
          // jogadas sempre para o dia 01 dos próximos meses.
          const FIX_DAY_TO_FIRST_OF_MONTH = false;

          if (paymentType === "CASH_UPFRONT") {
            transactionsData.push({
              projectId: id,
              type: "INCOME",
              amount: finalValue,
              transactionDate: now,
              description: `Receita à vista (Projeto Concluído): ${currentProject.name}`,
              category: "Projeto Concluído",
            });
          } else if (paymentType === "INSTALLMENTS") {
            const installmentValue = finalValue.toNumber() / installmentsCount;
            for (let i = 0; i < installmentsCount; i++) {
              const txDate = new Date(now);
              txDate.setMonth(txDate.getMonth() + i);
              if (FIX_DAY_TO_FIRST_OF_MONTH && i > 0) txDate.setDate(1);
              
              transactionsData.push({
                projectId: id,
                type: "INCOME",
                amount: installmentValue,
                transactionDate: txDate,
                description: `Parcela ${i + 1}/${installmentsCount} (Projeto Concluído): ${currentProject.name}`,
                category: "Projeto Concluído",
              });
            }
          } else if (paymentType === "UPFRONT_AND_INSTALLMENTS") {
            let initialDate = new Date(now);
            
            // Lançamento da entrada imediata
            if (upfrontAmount && upfrontAmount > 0) {
              transactionsData.push({
                projectId: id,
                type: "INCOME",
                amount: upfrontAmount,
                transactionDate: initialDate,
                description: `Entrada (Projeto Concluído): ${currentProject.name}`,
                category: "Projeto Concluído (Entrada)",
              });
            }

            // Lançamentos das parcelas restantes
            const remainingAmount = finalValue.toNumber() - (upfrontAmount?.toNumber() || 0);
            if (remainingAmount > 0 && installmentsCount > 0) {
              const installmentValue = remainingAmount / installmentsCount;
              for (let i = 0; i < installmentsCount; i++) {
                const txDate = new Date(initialDate);
                txDate.setMonth(txDate.getMonth() + i + 1); // começa no próximo mês
                if (FIX_DAY_TO_FIRST_OF_MONTH) txDate.setDate(1);

                transactionsData.push({
                  projectId: id,
                  type: "INCOME",
                  amount: installmentValue,
                  transactionDate: txDate,
                  description: `Parcela restante ${i + 1}/${installmentsCount} (Projeto Concluído): ${currentProject.name}`,
                  category: "Projeto Concluído",
                });
              }
            }
          }

          // Salvar todas as transações de forma protegida
          if (transactionsData.length > 0) {
            await prisma.financialTransaction.createMany({
              data: transactionsData,
            });
          }
        }
      }
    }

    let finalClientId = currentProject.clientId;

    if (body.newClientName && body.newClientName.trim() !== "") {
      const newClient = await prisma.client.create({
        data: { name: body.newClientName },
      });
      finalClientId = newClient.id;
    } else if (body.clientId !== undefined) {
      finalClientId = body.clientId || null;
    }

    // Aplica a atualização (preparando dados base)
    const updateData = {
      name: body.name ?? currentProject.name,
        clientId: finalClientId,
        status: body.status ?? currentProject.status,
        deadline: body.deadline ? new Date(body.deadline) : currentProject.deadline,
        totalValue: (body.totalValue !== undefined && body.totalValue !== "") ? Number(body.totalValue) : currentProject.totalValue,
        paymentType: body.paymentType ?? currentProject.paymentType,
        installments: (body.installments !== undefined && body.installments !== "") ? Number(body.installments) : currentProject.installments,
        upfrontValue: (body.upfrontValue !== undefined && body.upfrontValue !== "") ? Number(body.upfrontValue) : currentProject.upfrontValue,
        notes: body.notes ?? currentProject.notes,
    };
    // Aplica os responsáveis se vieram no payload
    if (body.assignees !== undefined) {
      if (Array.isArray(body.assignees) && body.assignees.length > 0) {
        updateData.assignees = { set: body.assignees.map(id => ({ id })) };
      } else {
        updateData.assignees = { set: [] }; // Limpa a lista (aberto para toda a equipe)
      }
    } else if (body.assignedTo !== undefined) {
      // Compatibilidade antiga
      if (body.assignedTo) {
        updateData.assignees = { set: [{ id: body.assignedTo }] };
      } else {
        updateData.assignees = { set: [] };
      }
    }

    // Aplica a atualização
    const updated = await prisma.project.update({
      where: { id },
      data: updateData,
      include: {
        client: { select: { id: true, name: true } },
        phases: { orderBy: { order: "asc" } },
        assignees: { select: { id: true, name: true, role: true, avatarUrl: true } },
        transactions: {
          where: { type: "EXPENSE" },
          orderBy: { transactionDate: "desc" }
        },
        _count: { select: { documents: true, transactions: true } },
      },
    });

    // Invalida o cache para refletir a atualização imediatamente
    cacheInvalidatePrefix("projects");

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/projects/[id]
export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    await prisma.project.delete({ where: { id } });
    
    // Invalida o cache
    cacheInvalidatePrefix("projects");
    
    return NextResponse.json({ message: "Projeto deletado com sucesso" });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
