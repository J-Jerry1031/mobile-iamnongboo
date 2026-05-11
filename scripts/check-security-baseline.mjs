import { readFileSync } from 'node:fs';

const nextConfig = readFileSync('next.config.ts', 'utf8');
const requiredHeaders = [
  'X-Content-Type-Options',
  'X-Frame-Options',
  'Referrer-Policy',
  'Permissions-Policy',
  'Content-Security-Policy',
];

const missingHeaders = requiredHeaders.filter((header) => !nextConfig.includes(header));
if (missingHeaders.length) {
  console.error(`Missing security headers: ${missingHeaders.join(', ')}`);
  process.exit(1);
}

const apiFiles = [
  'app/api/login/route.ts',
  'app/api/signup/route.ts',
  'app/api/orders/create/route.ts',
  'app/api/toss/confirm/route.ts',
];
const missingRateLimit = apiFiles.filter((file) => !readFileSync(file, 'utf8').includes('rateLimit('));
if (missingRateLimit.length) {
  console.error(`Missing rate limit on sensitive API routes: ${missingRateLimit.join(', ')}`);
  process.exit(1);
}

const requiredFiles = [
  'lib/privacy-audit.ts',
  'app/admin/privacy-logs/page.tsx',
];
const missingFiles = requiredFiles.filter((file) => {
  try {
    readFileSync(file, 'utf8');
    return false;
  } catch {
    return true;
  }
});
if (missingFiles.length) {
  console.error(`Missing privacy audit files: ${missingFiles.join(', ')}`);
  process.exit(1);
}

console.log('Security baseline check passed: headers and sensitive API rate limits are present.');
