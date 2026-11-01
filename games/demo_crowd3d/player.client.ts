// The seat's eye, for the row that is `mine`: render3d's camera at the row's `pos`, looking along its
// `view` [yaw, pitch], set whole as a quaternion every frame. W and S fly forward and back, A and D
// turn, Q and E tilt up and down, Shift climbs and Control sinks, the wheel paces: the keys dev.html
// binds too, so the two pages fly alike. A click sends `kill` the ray from the camera through the
// pixel clicked, for the crowd to kill the first person on it.
import type * as THREE from 'three'
import type { Row } from '#engine/engine.ts'
import type { Plugins } from '#engine/browser.ts'
import { def } from '#plugins/loader/loader.sim.ts'
import type { Binds } from '#plugins/player/player.plugin.ts'

let ours = false
let turn: THREE.Euler

export function setup(row: Row, plugins: Plugins) {
  ours = row.data.mine === true
  if (!ours) return
  turn = new (plugins.render3d.THREE as typeof THREE).Euler(0, 0, 0, 'YXZ')
  const { turnRate, tiltRate } = def(plugins.wire, row.kind)
  let turned = performance.now()
  plugins.player.bind({
    stick: [{ keys: ['F13', 'F14', 'w', 's'], send: (x, y) => ['stick', x, y] }],
    hold: [
      { keys: ['Shift'], send: v => ['up', v] },
      { keys: ['Control'], send: v => ['down', v] },
    ],
    every: held => {
      const now = performance.now(), dt = Math.min((now - turned) / 1000, 0.1)
      turned = now
      const yaw = (held('a') ? 1 : 0) - (held('d') ? 1 : 0), pitch = (held('q') ? 1 : 0) - (held('e') ? 1 : 0)
      return yaw || pitch ? ['look', yaw * turnRate * dt, pitch * tiltRate * dt] : undefined
    },
    wheel: dy => ['pace', dy],
    click: (x, y) => {
      const { THREE: T, camera, renderer } = plugins.render3d
      if (!camera || !renderer) return undefined
      const size = renderer.getSize(new T.Vector2())
      const ray = new T.Raycaster()
      ray.setFromCamera(new T.Vector2((x / size.x) * 2 - 1, -((y / size.y) * 2 - 1)), camera)
      return ['kill', ...ray.ray.origin.toArray(), ...ray.ray.direction.toArray()]
    },
  } satisfies Binds)
}

export function tick(row: Row, plugins: Plugins) {
  if (!ours) return
  const camera: THREE.PerspectiveCamera | undefined = plugins.render3d.camera
  if (!camera) return
  camera.position.fromArray(row.data.pos)
  // Three's camera looks down −z; yaw θ + π turns it to (sin θ, cos θ).
  camera.quaternion.setFromEuler(turn.set(row.data.view[1], row.data.view[0] + Math.PI, 0))
}

export function remove(plugins: Plugins) {
  if (ours) plugins.player.unbind()
}
