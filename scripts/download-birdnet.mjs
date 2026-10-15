// Local educational prototype assets. Models: CC BY-NC-SA 4.0.
import { mkdir, writeFile } from 'node:fs/promises';
const root = new URL('../.birdnet-local/', import.meta.url);
await mkdir(root, { recursive: true });
const base = 'https://birdnet.cornell.edu/models/birdnet/';
async function download(path, destination = path) {
  const response = await fetch(base + path);
  if (!response.ok) throw new Error(`${path}: ${response.status}`);
  const bytes = new Uint8Array(await response.arrayBuffer());
  await writeFile(new URL(destination, root), bytes);
  return bytes;
}
const manifest = JSON.parse(new TextDecoder().decode(await download('model.json')));
await Promise.all(manifest.weightsManifest.flatMap(group => group.paths).map(path => download(path)));
await download('labels/en_us.txt', 'labels.txt');
await mkdir(new URL('area-model/', root), {recursive:true});
const area = JSON.parse(new TextDecoder().decode(await download('area-model/model.json')));
await Promise.all(area.weightsManifest.flatMap(group => group.paths).map(path => download('area-model/' + path)));
console.log('BirdNET browser model downloaded for local testing.');
