const { PrismaClient, Role } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  const email = "admin@example.com";

  const existing = await prisma.user.findUnique({
    where: { email },
  });

  if (!existing) {
    const hashedPassword = await bcrypt.hash("12345678", 10);

    await prisma.user.create({
      data: {
        name: "Admin",
        email,
        password: hashedPassword,
        role: Role.admin, 
      },
    });

    console.log("Admin user created");
  } else {
    console.log("Admin already exists");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });