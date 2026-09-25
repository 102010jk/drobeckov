/* Read-only check: starts an MCP instance over stdio, lists tools and asks the game for state_brief. */
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const srv = spawn(process.execPath, [join(dirname(fileURLToPath(import.meta.url)), 'server.mjs')], { stdio: ['pipe', 'pipe', 'inherit'] });
let buf = '', nid = 1; const pend = new Map();
srv.stdout.on('data', d => { buf += d; let i; while ((i = buf.indexOf('\n')) >= 0) { const m = JSON.parse(buf.slice(0, i)); buf = buf.slice(i + 1); pend.get(m.id)?.(m); } });
const rpc = (method, params) => new Promise(r => { const id = nid++; pend.set(id, r); srv.stdin.write(JSON.stringify({ jsonrpc: '2.0', id, method, params }) + '\n'); });
await rpc('initialize', { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'ping', version: '1' } });
console.log('tools:', (await rpc('tools/list', {})).result.tools.length);
const r = await rpc('tools/call', { name: 'state_brief', arguments: {} });
console.log('state_brief:', r.result.content[0].text.slice(0, 300));
srv.kill(); process.exit(0);
