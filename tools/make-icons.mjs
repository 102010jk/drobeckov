// Generates pixel-art app icons (PNG) without any dependencies.
import { writeFileSync } from 'fs';
import { deflateSync } from 'zlib';
const ART = [
  '................',
  '................',
  '...o......o.....',
  '..oyo....oyo....',
  '..oyyooooyyo....',
  '..oyyyyyyyyo....',
  '..oyykyyykyo....',
  '..oyyyyyyyyo..o.',
  '..oyyypppyyo.oyo',
  '...oyyyyyyo..oyo',
  '...oyyyyyyyooyo.',
  '...oyywwwyyyyo..',
  '...oyywwwyyyo...',
  '...oyoyoyoyoo...',
  '....o.o.o.o.....',
  '................'
];
const COL = { '.': [255, 243, 220], o: [43, 27, 43], y: [247, 154, 58], k: [43, 27, 43], p: [255, 158, 192], w: [255, 243, 220] };
function png(size) {
  const s = size / 16, raw = Buffer.alloc((size * 3 + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (size * 3 + 1)] = 0;
    for (let x = 0; x < size; x++) {
      const ch = ART[Math.floor(y / s)][Math.floor(x / s)], c = COL[ch] || COL['.'];
      const o = y * (size * 3 + 1) + 1 + x * 3; raw[o] = c[0]; raw[o + 1] = c[1]; raw[o + 2] = c[2];
    }
  }
  const crcT = []; for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; crcT[n] = c >>> 0; }
  const crc = b => { let c = 0xffffffff; for (const x of b) c = crcT[(c ^ x) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
  const chunk = (t, d) => { const l = Buffer.alloc(4); l.writeUInt32BE(d.length); const td = Buffer.concat([Buffer.from(t), d]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([l, td, c]); };
  const ih = Buffer.alloc(13); ih.writeUInt32BE(size, 0); ih.writeUInt32BE(size, 4); ih[8] = 8; ih[9] = 2; ih[10] = 0; ih[11] = 0; ih[12] = 0;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ih), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}
for (const n of [192, 512]) writeFileSync(`icons/icon-${n}.png`, png(n));
console.log('icons written');
