const prisma = require("../config/prisma");

exports.getUsers = async ({ skip, limit, where, orderBy }) => {
  return prisma.user.findMany({
    where,
    skip,
    take: limit,
    orderBy,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      is_active: true,
      created_at: true,
    },
  });
};

exports.countUsers = async (where) => {
  return prisma.user.count({ where });
};