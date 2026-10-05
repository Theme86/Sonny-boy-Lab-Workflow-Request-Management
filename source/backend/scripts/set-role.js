// backend/scripts/set-role.js
// Changes a user's role from the command line — needed to create the very first Lab Manager,
// because everyone who signs in with Google starts as "member".
//
// Usage (from source/backend, after the user has signed in once):
//   npm run set-role -- someone@ku.th lab_manager
const { prisma } = require('../lib/prisma');

const ROLES = ['member', 'ta', 'lecturer', 'lab_manager'];

async function main() {
  const [email, role] = process.argv.slice(2);
  if (!email || !ROLES.includes(role)) {
    console.error(`Usage: npm run set-role -- <email> <${ROLES.join('|')}>`);
    process.exit(1);
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    console.error(`No user with email ${email}. Sign in with Google once first, then run this again.`);
    process.exit(1);
  }

  await prisma.user.update({ where: { email }, data: { role } });
  console.log(`${email}: ${user.role} -> ${role}`);
}

main()
  .catch((err) => {
    console.error(err.message);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
