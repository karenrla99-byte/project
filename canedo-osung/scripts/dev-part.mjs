// 사용: npm run part -- game-1
// 해당 파트만 단독으로 띄웁니다. (다른 파트가 없어도 실행됨)
import { spawn } from 'node:child_process';

const part = process.argv[2];
if (!part) {
  console.error('파트 이름을 적어 주세요. 예: npm run part -- game-1');
  process.exit(1);
}
const child = spawn('npx', ['vite', '--open', `/sandbox.html?part=${part}`], {
  stdio: 'inherit',
  shell: process.platform === 'win32',
});
child.on('exit', (code) => process.exit(code ?? 0));
