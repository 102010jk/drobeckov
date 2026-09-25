#!/usr/bin/env node
/* Drobečkov MCP server — lets an AI (Codex / ChatGPT, Gemini / Antigravity, Claude) play the game live.
   - speaks MCP over stdio (JSON-RPC 2.0, newline-delimited)
   - serves the game on http://localhost:5191 and bridges tool calls to the open browser tab
   - if another instance already owns the port, this one forwards its calls to it
   No dependencies. Node 18+. */
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { exec } from 'node:child_process';
import { appendFileSync } from 'node:fs';
import { tmpdir } from 'node:os';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PORT = +(process.env.DROBECKOV_PORT || 5191);
const GAME_URL = `http://localhost:${PORT}/`;
const LOG_FILE = join(tmpdir(), 'drobeckov-mcp.log');
const log = (...a) => {
  const line = `[drobeckov-mcp ${process.pid}] ${a.join(' ')}\n`;
  process.stderr.write(line);
  try { appendFileSync(LOG_FILE, new Date().toISOString() + ' ' + line); } catch (e) { /* ignore */ }
};
/* never die on a stray error — a dead stdio server shows up in the client as "Transport closed" */
process.on('uncaughtException', e => log('uncaught:', (e && e.stack) || e));
process.on('unhandledRejection', e => log('unhandled rejection:', (e && e.stack) || e));
process.stdout.on('error', e => log('stdout error:', e.message));

/* ---------------- tools ---------------- */
const num = (d) => ({ type: 'number', description: d });
const str = (d) => ({ type: 'string', description: d });
const obj = (props = {}, required = []) => ({ type: 'object', properties: props, required });
const TOOLS = [
  ['open_game', 'Open the Drobečkov game window in the browser (call this first). The human watches the game on screen while you play.', obj()],
  ['state', 'Overview of the town: era and what the next era needs, date, coins, storage, cats (mood, hunger, unemployed, free beds), buildings count, open orders, festival, advisor warnings, tutorial hint.', obj()],
  ['buildable', 'List building types with cost, size, category, recipes and whether they are unlocked (and why not).', obj({ category: str('optional: vyroba, priroda, domov, ozdoby, cesty') })],
  ['find_spot', 'Find valid top-left positions for a building type near a point (default: town centre).', obj({ type: str('building type id from buildable'), near_x: num('tile x'), near_y: num('tile y'), count: num('how many spots, default 5') }, ['type'])],
  ['build', 'Place a building / path / decoration at tile x,y (top-left). Cats then carry materials and build it.', obj({ type: str('building type id'), x: num('tile x'), y: num('tile y') }, ['type', 'x', 'y'])],
  ['demolish', 'Demolish a building (by id, or whatever is on tile x,y). Refunds half.', obj({ building_id: num('building id'), x: num('tile x'), y: num('tile y') })],
  ['buildings', 'List buildings with id, position, status, workers, recipe, inputs/outputs.', obj({ type: str('optional filter by type') })],
  ['building', 'Details of one building (also selects it on screen).', obj({ building_id: num('id') }, ['building_id'])],
  ['cats', 'List cats with id, trait, job, home, food, energy, mood, what they do.', obj()],
  ['assign', 'Give a cat a job in a building with workplaces.', obj({ cat_id: num('cat id'), building_id: num('building id') }, ['cat_id', 'building_id'])],
  ['unassign', 'Remove a cat from its job (it then helps wherever needed).', obj({ cat_id: num('cat id') }, ['cat_id'])],
  ['set_recipe', 'Choose what a workshop produces.', obj({ building_id: num('id'), recipe: str('recipe id from the building recipes') }, ['building_id', 'recipe'])],
  ['set_crop', 'Choose the crop of a field (pole).', obj({ building_id: num('id'), crop: str('psenice, mrkev, jahody, dyne, …') }, ['building_id', 'crop'])],
  ['deliver_order', 'Deliver an order from the notice board (items must be in storage).', obj({ order_id: num('order id') }, ['order_id'])],
  ['deliver_festival', 'Hand in items for the seasonal festival from storage.', obj()],
  ['parcels', 'List land parcels you can buy next to your land, cheapest first.', obj()],
  ['buy_parcel', 'Buy an 8x8 parcel (px,py are parcel coordinates from parcels).', obj({ px: num('parcel x'), py: num('parcel y') }, ['px', 'py'])],
  ['map', 'ASCII map of your land around a point (letters = buildings, T trees, ~ water, = paths).', obj({ x: num('left tile'), y: num('top tile'), w: num('width ≤48'), h: num('height ≤32') })],
  ['research', 'Without tech: list technologies. With tech: start researching it (needs a laboratory).', obj({ tech: str('tech id') })],
  ['upgrade', 'Upgrade a finished building to the next level (faster work / more beds / more storage).', obj({ building_id: num('id') }, ['building_id'])],
  ['set_speed', 'Game speed: 0 pause, 1 normal, 2 fast, 4 very fast.', obj({ speed: num('0,1,2,4') }, ['speed'])],
  ['wait', 'Let the game run for some real seconds (1-120), then get the new state. One game day ≈ 144 s at speed 1.', obj({ seconds: num('1-120') })],
  ['claim_rewards', 'Claim finished daily wishes and send letters to neighbours when possible.', obj()],
  ['action', 'Advanced: call any in-game UI action by name (e.g. expedition "0", fireworks "buy", autodeliver).', obj({ name: str('action name'), arg: str('argument') }, ['name'])],
  ['focus', 'Move the camera to tile x,y so the human sees it.', obj({ x: num('tile x'), y: num('tile y') }, ['x', 'y'])],
  ['new_game', 'Start a brand new town (saved as a new slot; existing saves stay).', obj({ name: str('town name'), seed: str('world seed'), mode: str('klid, normal, narocny, kreativ') })],
  ['screenshot', 'PNG screenshot of the game view.', obj()],
  // ---- economy & storage
  ['state_brief', 'Compact status (day, era, coins, cats, hungry, storage, sites, advisor codes, next era). Cheaper than state.', obj()],
  ['sell', 'Sell items from storage right away to the fox buyer (half price, affected by market saturation). Give amount or excess_over.', obj({ item: str('item id'), amount: num('how many'), excess_over: num('sell everything above this stock level') }, ['item'])],
  ['storage_rules', 'Standing storage policy, applied every game hour. rules = {"mrkev":{"sell_excess_over":40},"uhli":{"reserve":30},"ocel":{"never_sell":true}}; null removes a rule.', obj({ rules: { type: 'object', description: 'item -> {reserve, sell_excess_over, sell_all, never_sell} or null' }, clear: { type: 'boolean' } })],
  ['trade', 'Caravan / ship traders. action=offers lists what they want and sell; prepare item amount (cats carry goods to the market square); sell item; buy item amount.', obj({ action: str('offers | prepare | sell | buy'), item: str('item id'), amount: num('amount') })],
  ['orders', 'Detailed order board: every line with need/have/missing and whether it can be produced.', obj()],
  ['list_deposits', 'Known ore deposits on your land and on parcels next to it (resource, parcel, tiles, owned, existing mine).', obj({ resource: str('uhli, zelezo, med, cin, bauxit, zlato, kamen, hlina, pisek'), owned_only: { type: 'boolean' } })],
  ['prospect_deposit', 'What a 2x2 mine placed at x,y would extract, and whether it can be built there.', obj({ x: num('tile x'), y: num('tile y') }, ['x', 'y'])],
  ['prospect_parcel', 'Terrain, ores, water and trees inside an 8x8 parcel (also before buying) + price.', obj({ px: num('parcel x'), py: num('parcel y') }, ['px', 'py'])],
  ['find_resource', 'Nearest tiles with a given ore, owned first.', obj({ resource: str('ore id'), max_distance: num('tiles, default 40') }, ['resource'])],
  ['cancel_construction', 'Cancel a construction site: full coin refund and delivered materials back.', obj({ building_id: num('site id') }, ['building_id'])],
  ['construction_status', 'All construction sites: missing materials, what is on the way, carriers, builders, progress, what blocks them.', obj()],
  ['production_status', 'All producing buildings: recipe, inputs/outputs, workers, missing inputs, blocked or not.', obj()],
  ['explain_building', 'Why a building does or does not work: missing inputs, workers, their commute, full storage.', obj({ building_id: num('id') }, ['building_id'])],
  ['recommend_next_actions', 'Ranked hints what to do next, with suggested commands.', obj({ limit: num('default 6') })],
  ['action_catalog', 'List of all names for the generic action tool with their arguments.', obj()],
  ['auto_assign', 'Fill empty workplaces with unemployed cats (food first). Keeps one free cat unless rebalance=true.', obj({ rebalance: { type: 'boolean' } })],
  ['build_many', 'Build the same thing several times on valid spots near a point.', obj({ type: str('building type'), count: num('max 30'), near_x: num('tile x'), near_y: num('tile y') }, ['type'])],
  ['batch', 'Run many commands in one call: commands=[{"tool":"assign","cat_id":7,"building_id":18},{"tool":"set_recipe","building_id":18,"recipe":"ocel"}]. mode: best_effort (default), sequential (stop at first error), atomic (all or nothing).', obj({ commands: { type: 'array', items: { type: 'object' } }, mode: str('best_effort | sequential | atomic') }, ['commands'])],
  ['dry_run', 'Try commands on a copy of the world (optionally simulate then_hours after) and report costs, stock changes and errors. Nothing is kept.', obj({ commands: { type: 'array', items: { type: 'object' } }, then_hours: num('game hours to simulate after') }, ['commands'])],
  ['skip_time', 'Instantly simulate game hours (no real-time waiting; works even if the window is in the background). stop_on: hunger, storage_full, construction_done, new_cat, era_change, no_materials, order_deliverable, morning.', obj({ game_hours: num('1-480'), stop_on: { type: 'array', items: { type: 'string' } } })],
  ['simulate_until', 'Simulate until a condition holds, e.g. "storage.ocel >= 15", "built.dul >= 2 and cats > 8", "building.42.built == 1". Terms: storage.X, made.X, built.TYPE, building.ID.built, coins, cats, era, day, hungry, free_beds, coziness, mood, storage_used_pct, sites, orders_deliverable, tech.X, parcels.', obj({ condition: str('condition'), conditions: { type: 'array', items: { type: 'string' }, description: 'stop at the first that holds' }, max_game_days: num('1-30') })],
  ['simulate_preview', 'Simulate N game days on a copy of the world and report the result (coins, cats, stock, problems, events). Nothing is kept.', obj({ game_days: num('max 10') })],
  ['fast_forward_report', 'Skip N game days and return a short timeline every interval_hours.', obj({ game_days: num('max 20'), interval_hours: num('default 12') })],
  ['ensure_running', 'Close dialogs, leave factory interiors, set speed and verify that game time really moves.', obj({ speed: num('1,2,4') })],
  ['events', 'Incremental event feed (banners, toasts, sales, rules) since a cursor; returns the new cursor.', obj({ since: num('cursor from last call'), types: { type: 'array', items: { type: 'string' } } })],
  ['checkpoint', 'Named save points for experiments. action: list | save | restore | delete.', obj({ action: str('list | save | restore | delete'), name: str('name') })],
  ['notes', 'Your own notebook stored in the save. action: add (text, tags, x, y, pinned) | list (tags, resolved) | update (note_id, text, resolved, pinned) | delete (note_id).', obj({ action: str('add | list | update | delete'), text: str('text'), tags: { type: 'array', items: { type: 'string' } }, x: num('tile x'), y: num('tile y'), note_id: num('id'), resolved: { type: 'boolean' }, pinned: { type: 'boolean' } })],
  ['rules', 'If-then automation checked every game hour: action add (condition like simulate_until, then = batch commands, once, cooldown_hours) | list | remove (rule_id). once=true makes a one-time todo.', obj({ action: str('add | list | remove'), condition: str('condition'), then: { type: 'array', items: { type: 'object' } }, once: { type: 'boolean' }, cooldown_hours: num('default 6'), rule_id: num('id') })]
].map(([name, description, inputSchema]) => ({ name, description: description + ' Only for playing the Drobečkov game when the user explicitly asked for it.', inputSchema }));

/* ---------------- bridge (browser side) ---------------- */
const queue = [], waiting = new Map(), pollers = [];
let lastPoll = 0, owner = true, activeTab = null, activeSeen = 0;
function sendToGame(cmd, args, timeoutMs) {
  return new Promise((resolve, reject) => {
    const id = Math.random().toString(36).slice(2);
    const t = setTimeout(() => { waiting.delete(id); reject(new Error(Date.now() - lastPoll > 30000 ? 'Hra není otevřená v prohlížeči — zavolej nejdřív open_game.' : 'Hra neodpověděla včas.')); }, timeoutMs);
    waiting.set(id, (res) => { clearTimeout(t); res.ok ? resolve(res.data) : reject(new Error(res.error)); });
    queue.push({ id, cmd, args });
    flush();
  });
}
function flush() { while (queue.length && pollers.length) { const res = pollers.shift(); if (res.writableEnded || res.destroyed) continue; try { res.writeHead(200, { 'content-type': 'application/json' }).end(JSON.stringify(queue.shift())); } catch (e) { log('poll write failed', e.message); } } }
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css', '.png': 'image/png', '.json': 'application/json', '.md': 'text/plain; charset=utf-8', '.txt': 'text/plain; charset=utf-8' };
const body = (req) => new Promise(r => { let d = ''; req.on('data', c => d += c); req.on('end', () => r(d)); });
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, GAME_URL);
  if (url.pathname === '/bridge/poll') {
    const tab = url.searchParams.get('tab') || 'x';
    if (url.searchParams.get('hello')) activeTab = tab;          // the newest window takes control
    if (activeTab && tab !== activeTab && Date.now() - activeSeen < 15000) return res.writeHead(409).end();   // another window is in control
    activeTab = tab; activeSeen = lastPoll = Date.now();
    pollers.push(res); flush();
    const t = setTimeout(() => { const i = pollers.indexOf(res); if (i >= 0) { pollers.splice(i, 1); res.writeHead(204).end(); } }, 25000);
    res.on('close', () => { clearTimeout(t); const i = pollers.indexOf(res); if (i >= 0) pollers.splice(i, 1); });
    return;
  }
  if (url.pathname === '/bridge/result' && req.method === 'POST') { try { const r = JSON.parse(await body(req)); const cb = waiting.get(r.id); if (cb) { waiting.delete(r.id); cb(r); } } catch (e) { /* ignore */ } return res.writeHead(204).end(); }
  if (url.pathname === '/bridge/call' && req.method === 'POST') {   // forwarded from a second MCP instance
    try { const { cmd, args } = JSON.parse(await body(req)); const data = await runTool(cmd, args); res.writeHead(200, { 'content-type': 'application/json' }).end(JSON.stringify({ ok: true, data })); }
    catch (e) { res.writeHead(200, { 'content-type': 'application/json' }).end(JSON.stringify({ ok: false, error: e.message })); }
    return;
  }
  let p = decodeURIComponent(url.pathname); if (p.endsWith('/')) p += 'index.html';
  const file = normalize(join(ROOT, p));
  if (!file.startsWith(ROOT)) return res.writeHead(403).end();
  try { const data = await readFile(file); res.writeHead(200, { 'content-type': TYPES[extname(file)] || 'application/octet-stream', 'cache-control': 'no-store' }).end(data); }
  catch (e) { res.writeHead(404).end('not found'); }
});
server.on('error', (e) => { if (e.code === 'EADDRINUSE') { owner = false; log(`port ${PORT} busy — forwarding calls to the running instance`); } else log('http error', e.message); });
server.listen(PORT, '127.0.0.1', () => log('game served at', GAME_URL));
log('started', process.argv.slice(2).join(' ') || '(stdio)');

function openBrowser() {
  const cmd = process.platform === 'win32' ? `start "" "${GAME_URL}"` : process.platform === 'darwin' ? `open "${GAME_URL}"` : `xdg-open "${GAME_URL}"`;
  exec(cmd, () => {});
}
async function runTool(name, args = {}) {
  if (!owner) {   // forward to the instance that owns the port
    let r;
    try { r = await fetch(GAME_URL + 'bridge/call', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ cmd: name, args }) }); }
    catch (e) {   // the owning instance went away: take the port over
      owner = true; await new Promise(res => { server.once('listening', res); server.once('error', res); server.listen(PORT, '127.0.0.1'); });
      if (!owner) throw new Error('Most na portu ' + PORT + ' neodpovídá.');
      return runTool(name, args);
    }
    const j = await r.json(); if (!j.ok) throw new Error(j.error); return j.data;
  }
  if (name === 'open_game') {
    if (Date.now() - lastPoll < 30000) return { ok: true, note: 'Hra už je otevřená a připojená.', url: GAME_URL };
    openBrowser();
    for (let i = 0; i < 40 && Date.now() - lastPoll > 30000; i++) await new Promise(r => setTimeout(r, 500));
    return Date.now() - lastPoll < 30000 ? { ok: true, note: 'Hra je otevřená v prohlížeči a připojená.', url: GAME_URL } : { ok: false, note: 'Prohlížeč se neotevřel — otevři ručně ' + GAME_URL };
  }
  const extra = name === 'wait' ? Math.min(120, args.seconds || 10) * 1000 : ['skip_time', 'simulate_until', 'simulate_preview', 'fast_forward_report', 'dry_run'].includes(name) ? 100000 : 0;
  return sendToGame(name, args, 20000 + extra);
}

/* ---------------- MCP over stdio ---------------- */
const INSTRUCTIONS = 'Drobečkov is a cozy pixel-art cat-colony builder running in the user\'s browser. Use these tools ONLY when the user explicitly asks you to play or control Drobečkov. Start with open_game, then state. Keep cats fed (mill+bakery or pier), build houses and decorations so new cats arrive, fulfil orders for coins, buy land, and progress through the eras. Use wait to let time pass.';
function reply(id, result) { process.stdout.write(JSON.stringify({ jsonrpc: '2.0', id, result }) + '\n'); }
function fail(id, code, message) { process.stdout.write(JSON.stringify({ jsonrpc: '2.0', id, error: { code, message } }) + '\n'); }
async function handle(msg) {
  const { id, method, params } = msg;
  if (method === 'initialize') return reply(id, { protocolVersion: params && params.protocolVersion || '2025-06-18', capabilities: { tools: {} }, serverInfo: { name: 'drobeckov', version: '1.0.0' }, instructions: INSTRUCTIONS });
  if (method === 'ping') return reply(id, {});
  if (method === 'tools/list') return reply(id, { tools: TOOLS });
  if (method === 'tools/call') {
    const name = params.name, args = params.arguments || {};
    try {
      const data = await runTool(name, args);
      if (name === 'screenshot' && data && data.png) return reply(id, { content: [{ type: 'image', data: data.png, mimeType: 'image/png' }] });
      return reply(id, { content: [{ type: 'text', text: JSON.stringify(data, null, 1) }] });
    } catch (e) { return reply(id, { content: [{ type: 'text', text: 'Chyba: ' + e.message }], isError: true }); }
  }
  if (id !== undefined) fail(id, -32601, 'Method not found: ' + method);
}
let buf = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk) => {
  buf += chunk; let i;
  while ((i = buf.indexOf('\n')) >= 0) { const line = buf.slice(0, i).trim(); buf = buf.slice(i + 1); if (!line) continue; let m; try { m = JSON.parse(line); } catch (e) { continue; } handle(m).catch(e => log('handler error', e.message)); }
});
const SERVE_ONLY = process.argv.includes('--serve');   // standalone: just serve the game + bridge, no MCP client attached
process.stdin.on('end', () => { if (!SERVE_ONLY) process.exit(0); });
if (SERVE_ONLY) process.stdin.pause();
