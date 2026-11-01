// Where a seat's eye starts: a `start` actor of the scene, one per slot, a row at its `pos` looking
// along its `view` for the slot in `slot`, and nothing else. The `player` row puts its eye there. It
// has no rule and is not drawn.
import type { Kind } from '#engine/engine.ts'

export const start: Kind = {}
