// demo_crowd3d's bake, `yarn bake demo_crowd3d` (core's `scripts/bake.ts`): every body of
// `crowd.rig.json`, a Mixamo character of the library, with every clip of the rig baked onto it by
// anim's export (`plugins/anim/anim.export.py`), packed by gltfpack and written as `<body>.glb` beside
// this file, where the scene's catalogue reads it. The export measures the rig's table too; crowd3d
// reads none of it, so it is written to the bake's scratch folder and dropped.
import path from 'node:path'
import type { Tools } from '#scripts/bake.ts'

const here = import.meta.dirname
const root = path.join(here, '..', '..', '..')

export default async ({ blender, scratch }: Tools) => {
  const rig = path.join(here, 'crowd.rig.json')
  const { bodies } = (await import(rig, { with: { type: 'json' } })).default as { bodies: Record<string, string> }
  const outs = Object.keys(bodies).map(body => `${body}=${path.join(here, `${body}.glb`)}`)
  await blender(['--factory-startup', '--python-exit-code', '1', '--python', path.join(root, 'plugins', 'anim', 'anim.export.py'), '--', rig, scratch('table.json'), ...outs])
  for (const body of Object.keys(bodies)) console.log('wrote', path.relative(root, path.join(here, `${body}.glb`)))
}
