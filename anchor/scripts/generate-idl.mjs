import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const idlRawPath = path.join(rootDir, 'target', 'idl_seq.txt');
if (!fs.existsSync(idlRawPath)) {
  console.error(`Missing ${idlRawPath}. Run cargo test with __anchor_private_print_idl first.`);
  process.exit(1);
}

const text = fs.readFileSync(idlRawPath, 'utf16le');
const regex = /--- IDL begin (\w+) ---[\r\n]+([\s\S]*?)[\r\n]+--- IDL end \1 ---/g;

let programBlock = null;
let errorsBlock = null;
const eventBlocks = [];
let addressBlock = null;

let match;
while ((match = regex.exec(text)) !== null) {
  const kind = match[1];
  const content = JSON.parse(match[2]);
  if (kind === 'program') {
    programBlock = content;
  } else if (kind === 'errors') {
    errorsBlock = content;
  } else if (kind === 'event') {
    eventBlocks.push(content);
  } else if (kind === 'address') {
    addressBlock = content;
  }
}

if (!programBlock) {
  console.error('No program block found in IDL dump!');
  process.exit(1);
}

function stripPath(name) {
  if (typeof name !== 'string') return name;
  return name.split('::').pop();
}

function cleanTypeRef(t) {
  if (!t || typeof t !== 'object') return t;
  if (t.defined) {
    if (typeof t.defined === 'string') {
      return { defined: stripPath(t.defined) };
    }
    if (t.defined.name) {
      return { defined: { ...t.defined, name: stripPath(t.defined.name) } };
    }
  }
  if (t.vec) {
    return { vec: cleanTypeRef(t.vec) };
  }
  if (t.option) {
    return { option: cleanTypeRef(t.option) };
  }
  if (t.array) {
    return { array: [cleanTypeRef(t.array[0]), t.array[1]] };
  }
  return t;
}

const idl = {
  address: addressBlock || programBlock.address || '37WQY8a7fzyVTTov8U5zZQywWSD5h2gSV5XFo7CL67f8',
  metadata: {
    name: 'ventrion_protocol',
    version: '1.0.0',
    spec: '0.1.0',
    description: 'Ventrion Protocol ($VENT) - Regulated Security Token Escrow, DLMM Graduation, and Governance Engine'
  },
  instructions: (programBlock.instructions || []).map(ix => ({
    ...ix,
    args: (ix.args || []).map(arg => ({
      ...arg,
      type: cleanTypeRef(arg.type)
    }))
  })),
  accounts: (programBlock.accounts || []).map(acc => ({
    ...acc,
    name: stripPath(acc.name)
  })),
  events: [],
  errors: errorsBlock || [],
  types: (programBlock.types || []).map(t => ({
    ...t,
    name: stripPath(t.name),
    type: t.type && t.type.fields ? {
      ...t.type,
      fields: t.type.fields.map(f => ({
        ...f,
        type: cleanTypeRef(f.type)
      }))
    } : t.type
  }))
};

// Merge events
const knownTypes = new Set(idl.types.map(t => t.name));
for (const ev of eventBlocks) {
  if (ev.event) {
    const shortName = stripPath(ev.event.name);
    idl.events.push({
      name: shortName,
      discriminator: ev.event.discriminator
    });
  }
  if (ev.types) {
    for (const t of ev.types) {
      const shortName = stripPath(t.name);
      if (!knownTypes.has(shortName)) {
        idl.types.push({
          ...t,
          name: shortName,
          type: t.type && t.type.fields ? {
            ...t.type,
            fields: t.type.fields.map(f => ({
              ...f,
              type: cleanTypeRef(f.type)
            }))
          } : t.type
        });
        knownTypes.add(shortName);
      }
    }
  }
}

const outDir = path.join(rootDir, 'target', 'idl');
fs.mkdirSync(outDir, { recursive: true });
const idlOut = path.join(outDir, 'ventrion_protocol.json');
fs.writeFileSync(idlOut, JSON.stringify(idl, null, 2));
console.log(`Generated IDL: ${idlOut} (${fs.statSync(idlOut).size} bytes)`);

// Also copy to web/src/lib/idl/ventrion_protocol.json if web exists
const webIdlDir = path.resolve(rootDir, '..', 'web', 'src', 'lib', 'idl');
if (fs.existsSync(webIdlDir)) {
  fs.writeFileSync(path.join(webIdlDir, 'ventrion_protocol.json'), JSON.stringify(idl, null, 2));
  console.log(`Updated web IDL: ${path.join(webIdlDir, 'ventrion_protocol.json')}`);
}

// Generate TypeScript definitions
const typesDir = path.join(rootDir, 'target', 'types');
fs.mkdirSync(typesDir, { recursive: true });
const tsOut = path.join(typesDir, 'ventrion_protocol.ts');
const tsContent = `/**
 * Program IDL in TypeScript format for ventrion_protocol
 * Generated automatically - do not edit directly
 */
export type VentrionProtocol = ${JSON.stringify(idl, null, 2)};
export const IDL: VentrionProtocol = ${JSON.stringify(idl, null, 2)};
`;
fs.writeFileSync(tsOut, tsContent);
console.log(`Generated TypeScript types: ${tsOut}`);
