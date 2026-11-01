// The plaza's ground: a square of its definition's `size` metres in its `colour`, lying on y = 0 on
// render3d's scene, taking shadows, dressed by render3d.
import type * as THREE from 'three'
import type { Row } from '#engine/engine.ts'
import type { Plugins } from '#engine/browser.ts'
import { def } from '#plugins/loader/loader.sim.ts'

let plane: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshStandardMaterial> | undefined

export function setup(row: Row, plugins: Plugins) {
  const T = plugins.render3d.THREE as typeof THREE
  const { size, colour, roughness } = def(plugins.wire, row.kind)
  plane = new T.Mesh(new T.PlaneGeometry(size, size), plugins.render3d.dress(new T.MeshStandardMaterial({ color: colour, roughness })))
  plane.quaternion.setFromAxisAngle(new T.Vector3(1, 0, 0), -Math.PI / 2)
  plane.receiveShadow = true
  plane.name = 'ground'
  plugins.render3d.scene.add(plane)
}

export function tick() {}

export function remove(plugins: Plugins) {
  if (!plane) return
  plugins.render3d.scene.remove(plane)
  plane.geometry.dispose()
  plane.material.dispose()
  plane = undefined
}
