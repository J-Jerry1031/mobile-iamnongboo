import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';

const root = process.cwd();
let output = '';
try {
  output = execFileSync('rg', ['-n', '\\$queryRawUnsafe|\\$executeRawUnsafe|\\$queryRaw`|\\$executeRaw`|\\$queryRaw\\(|\\$executeRaw\\(', 'app', 'components', 'lib'], {
    cwd: root,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();
} catch (error) {
  if (error.status !== 1) throw error;
}

if (output) {
  console.error('Unsafe or direct raw SQL usage found:\n');
  console.error(output);
  process.exit(1);
}

const prisma = readFileSync(join(root, 'lib', 'prisma.ts'), 'utf8');
if (!prisma.includes('new PrismaClient')) {
  console.error('Prisma client wrapper was not found.');
  process.exit(1);
}

console.log('SQL injection guard check passed: no raw SQL calls found.');
