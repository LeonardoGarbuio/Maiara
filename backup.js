const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

async function backup() {
  try {
    const projects = await prisma.project.findMany({
      where: { assignedTo: { not: null, not: "" } },
      select: { id: true, assignedTo: true }
    });
    
    const tasks = await prisma.task.findMany({
      where: { assignedTo: { not: null, not: "" } },
      select: { id: true, assignedTo: true }
    });

    const backupData = { projects, tasks };
    fs.writeFileSync('backup-assignments.json', JSON.stringify(backupData, null, 2));
    console.log(`Backup completed: ${projects.length} projects, ${tasks.length} tasks.`);
  } catch (error) {
    console.error("Backup failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

backup();
