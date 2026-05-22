const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

async function restore() {
  try {
    const backupStr = fs.readFileSync('backup-assignments.json', 'utf8');
    const backupData = JSON.parse(backupStr);

    console.log("Restoring project assignments...");
    for (const p of backupData.projects) {
      if (p.assignedTo) {
        await prisma.project.update({
          where: { id: p.id },
          data: { assignees: { connect: { id: p.assignedTo } } }
        });
      }
    }

    console.log("Restoring task assignments...");
    for (const t of backupData.tasks) {
      if (t.assignedTo) {
        await prisma.task.update({
          where: { id: t.id },
          data: { assignees: { connect: { id: t.assignedTo } } }
        });
      }
    }

    console.log("Restore completed successfully!");
  } catch (error) {
    console.error("Restore failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

restore();
