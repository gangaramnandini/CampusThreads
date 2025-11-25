const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function clearTables() {
  // Delete dependent tables first!
  await prisma.channelMessage.deleteMany({});
  await prisma.channelMembership.deleteMany({});
  await prisma.channel.deleteMany({});

  console.log('All channel tables data cleared!');
  await prisma.$disconnect();
}

clearTables();
