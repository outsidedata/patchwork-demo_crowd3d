// The kinds of main and the main.scene.json file next to this one: a plaza of people, standing where
// the crowd's standing file puts them (`assets/crowd.json`) and walking across it from its gates,
// killed where a seat clicks (`crowd`). Every number of them that never changes is its definition in
// `assets/demo_crowd3d.json`, which the scene's `world.defs` names. Where each seat's eye starts is a
// `start` actor of the scene file, one per slot.
import type { Scene, Sim } from '#engine/engine.ts'
import { scenemanager } from '#plugins/scenemanager/scenemanager.sim.ts'
import { loader } from '#plugins/loader/loader.sim.ts'
import { player } from './player.sim.ts'
import { start } from './start.sim.ts'
import { gate } from './gate.sim.ts'
import { person } from './person.sim.ts'
import { ground } from './ground.sim.ts'
import { crowd } from './crowd.sim.ts'
import file from './main.scene.json' with { type: 'json' }

export const sim: Sim = { scenemanager, loader, player, start, gate, person, ground, crowd }

export const scene = file as Scene
