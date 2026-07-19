const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash('123456', 10);
  const user = await prisma.usuario.update({
    where: { email: 'teste@exemplo.com' },
    data: { senha: hash }
  });
  console.log('Senha do usuario teste@exemplo.com alterada para 123456');
}

main().catch(console.error).finally(() => prisma.$disconnect());
