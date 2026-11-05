// Preloaded with `node -r` by setRole.test.js so the script runs without a database.
// STUB_USERS = JSON array of users; the calls made are printed as "CALL <json>" lines on stdout.
const path = require('path');

const users = JSON.parse(process.env.STUB_USERS || '[]');
const log = (call) => console.log(`CALL ${JSON.stringify(call)}`);

const prisma = {
  user: {
    findUnique: async ({ where }) => users.find((u) => u.email === where.email) ?? null,
    update: async (args) => {
      log({ update: args });
      return {};
    },
  },
  $disconnect: async () => log({ disconnect: true }),
};

const target = path.join(__dirname, '..', '..', 'lib', 'prisma.js');
require.cache[target] = { id: target, filename: target, loaded: true, exports: { prisma } };
