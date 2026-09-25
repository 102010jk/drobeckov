# Drobečkov MCP server — ať hru hraje AI

MCP server, přes který může AI (Codex / ChatGPT, Antigravity / Gemini, Claude…) hrát Drobečkov
**živě v prohlížeči** — ty se díváš na obrazovku, jak staví, přiřazuje kočky a plní zakázky.

- Bez závislostí, stačí Node 18+.
- Server běží přes stdio (spustí ho AI klient) a zároveň servíruje hru na **http://localhost:5191**.
- Hra na tomhle portu má vlastní uložené hry, tvoje hra z GitHub Pages zůstane netknutá.
- Vpravo nahoře ve hře je cedulka **„AI hraje“** s posledními akcemi.
- Ovládá vždy jen naposledy otevřené okno se hrou.

## Nástroje
`open_game`, `state`, `buildable`, `find_spot`, `build`, `demolish`, `buildings`, `building`, `cats`,
`assign`, `unassign`, `set_recipe`, `set_crop`, `deliver_order`, `deliver_festival`, `parcels`, `buy_parcel`,
`map` (ASCII mapa), `research`, `upgrade`, `set_speed`, `wait`, `claim_rewards`, `action`, `focus`,
`new_game`, `screenshot`.

## Instalace

**Codex (ChatGPT)** — `~/.codex/config.toml`:
```toml
[mcp_servers.drobeckov]
command = 'C:\Program Files\nodejs\node.exe'
args = ['C:\Crumbvale\mcp\server.mjs']
startup_timeout_sec = 30
default_tools_approval_mode = "approve"
```
Skill: zkopíruj `SKILL.md` do `~/.codex/skills/drobeckov/SKILL.md`.

**Antigravity (Gemini, `agy`)** — `~/.gemini/config/mcp_config.json`:
```json
"drobeckov": { "command": "C:\\Program Files\\nodejs\\node.exe", "args": ["C:\\Crumbvale\\mcp\\server.mjs"] }
```
Skill: `~/.gemini/skills/drobeckov/SKILL.md`.

**Claude Code**: `claude mcp add drobeckov -- node C:\Crumbvale\mcp\server.mjs`

Skill říká, že se nástroje mají použít **jen na výslovný pokyn** („hraj Drobečkov“).

## Test
```bash
node mcp/test-client.mjs
```
a během běhu otevři http://localhost:5191/.
