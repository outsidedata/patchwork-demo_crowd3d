// The plaza's ground: one `ground` actor of the scene, a square of its definition's `size` metres in
// its `colour`, lying on y = 0, which takes the sun's shadow (`ground.client.ts`). It has no rule.
import type { Kind } from '#engine/engine.ts'

export const ground: Kind = {}
