/* Smoke test: spawns the MCP server over stdio and plays a few moves. Open http://localhost:5191/ while it runs. */
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const srv = spawn(process.execPath, [join(dirname(fileURLToPath(import.meta.url)), 'server.mjs')], { stdio: ['pipe', 'pipe', 'inherit'] });
let buf = '', nid = 1; const pend = new Map();
srv.stdout.on('data', d => { buf += d; let i; while ((i = buf.indexOf('\n')) >= 0) { const m = JSON.parse(buf.slice(0, i)); buf = buf.slice(i + 1); pend.get(m.id)?.(m); } });
const rpc = (method, params) => new Promise(r => { const id = nid++; pend.set(id, r); srv.stdin.write(JSON.stringify({ jsonrpc: '2.0', id, method, params }) + '\n'); });
const call = async (name, args = {}) => { const m = await rpc('tools/call', { name, arguments: args }); const c = m.result.content[0]; return { err: m.result.isError, out: c.type === 'text' ? c.text : `[image ${c.data.length} b64]` }; };
const init = await rpc('initialize', { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'test', version: '1' } });
console.log('server:', init.result.serverInfo.name, '| tools:', (await rpc('tools/list', {})).result.tools.length);
let st; for (let i = 0; i < 30; i++) { st = await call('state'); if (!st.err) break; await new Promise(r => setTimeout(r, 2000)); }
const s = JSON.parse(st.out); console.log('state:', s.town, s.era.name, 'coins', s.coins, 'cats', s.cats.count);
const spot = JSON.parse((await call('find_spot', { type: 'mlyn' })).out); console.log('spot:', JSON.stringify(spot.spots[0]));
console.log('build:', (await call('build', { type: 'mlyn', ...spot.spots[0] })).out.slice(0, 160));
console.log('bad build:', (await call('build', { type: 'mlyn', x: 99999, y: 0 })).out);
console.log('cats:', JSON.parse((await call('cats')).out).map(c => c.name + ':' + c.doing).join(', '));
console.log('map:\n' + JSON.parse((await call('map', { w: 30, h: 12 })).out).rows.join('\n'));
console.log('wait:', JSON.parse((await call('wait', { seconds: 3 })).out).gameHoursPassed, 'h');
console.log('screenshot:', (await call('screenshot')).out);
srv.kill(); process.exit(0);
