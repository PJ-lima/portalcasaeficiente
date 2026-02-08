// Simple environment check script
const required = ['DATABASE_URL','NEXTAUTH_SECRET','NEXTAUTH_URL'];
const missing = required.filter((key) => !process.env[key]);
if (missing.length) {
  console.error('Missing env vars:', missing.join(', '));
  process.exit(1);
}
console.log('All required env vars present.');
