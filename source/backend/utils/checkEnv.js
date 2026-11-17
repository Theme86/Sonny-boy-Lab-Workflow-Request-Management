// utils/checkEnv.js — checks the settings the server cannot run without, at start-up.
// Without this, a missing JWT_SECRET only shows up later as a 500 error at the first login.
const REQUIRED = [
  ['JWT_SECRET', 'signs the login cookie'],
  ['GOOGLE_CLIENT_ID', 'checks the Google sign-in token'],
  ['DATABASE_HOST', 'MySQL host'],
  ['DATABASE_PORT', 'MySQL port'],
  ['DATABASE_USER', 'MySQL user'],
  ['DATABASE_NAME', 'MySQL database name'],
];

/** Returns { missing: [...names], warnings: [...text] } for the given settings (does not exit). */
function checkEnv(env = process.env) {
  const missing = REQUIRED.filter(([name]) => !env[name] || !String(env[name]).trim()).map(([name]) => name);
  // an empty DATABASE_PASSWORD is allowed on a local database, but it must be set to something (even "")
  if (env.DATABASE_PASSWORD === undefined) missing.push('DATABASE_PASSWORD');

  const warnings = [];
  if (env.JWT_SECRET && env.JWT_SECRET.length < 16) {
    warnings.push('JWT_SECRET is shorter than 16 characters; use a long random string.');
  }
  if (env.NODE_ENV === 'production' && !env.FRONTEND_URL) {
    warnings.push('FRONTEND_URL is not set; CORS will only allow http://localhost:3000.');
  }
  return { missing, warnings };
}

/** Prints warnings; exits the process with a clear message when something required is missing. */
function assertEnv(env = process.env, exit = (code) => process.exit(code)) {
  const { missing, warnings } = checkEnv(env);
  warnings.forEach((w) => console.warn(`Warning: ${w}`));
  if (missing.length === 0) return;

  console.error('Cannot start: these settings are missing in backend/.env:');
  for (const name of missing) {
    const why = REQUIRED.find(([n]) => n === name)?.[1];
    console.error(`  - ${name}${why ? ` (${why})` : ''}`);
  }
  console.error('Copy .env.example to .env and fill them in.');
  exit(1);
}

module.exports = { checkEnv, assertEnv, REQUIRED };