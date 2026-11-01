# demo_crowd3d journal

The experiment behind crowd3d (outsidedata/core#44): background crowds of Mixamo bodies, many animated
bodies in one draw call per mesh, drawn between steps. Written as it happens, failures included.

## 2026-10-22

**Start.** Issue #44 made with the nine-step chain. `yarn new-game demo_crowd3d` wrote the game. It is
its own private repo, `billautomata/patchwork-dev-demo_crowd3d`, like `demo_wormhole`, because nobody
knows yet how big its art gets.

**What was read first, and what it settled.**

- render3d draws between steps by moving each Object3D's position, turn and scale (`steps` in
  `engine/browser.ts`), then draws, then puts them back. An InstancedMesh's copies are not moved.
- Every row goes to every seat on every step, whole (`engine/engine.ts`, `packet`). So a thousand
  standing people as rows would be a thousand rows in every packet. Standing people are fixed, so they
  go in a data file the scene names. Walkers are rows.
- three 0.186 skins a mesh on the GPU already: the mixer moves bones on the CPU, `Skeleton.update`
  writes `boneWorld × boneInverse` per bone into `boneTexture`, and the vertex shader blends four of
  them per vertex.
- The testbed's time stop (benchmarking-a-game `testbed.mjs`, `stop()`/`go()`) drops packets and
  draws at `between` 1, so a crowd whose clips run on the step clock stands still when stopped.

**The design going in.**

- The bake happens in the page, on load, with three's own mixer: each clip is set to each frame time
  on a clone at the origin, `Skeleton.update()` runs, and its `boneMatrices` are copied into one
  float texture per body (4 texels a bone, one row a frame). The numbers are three's own by
  construction. Between two baked frames the shader blends the two matrices linearly; step 3 measures
  how far that is from the mixer.
- The hips' travel is taken out of every clip at the bake: the steady line from the hips' first place
  to their last is taken off each frame, across the ground only, so a walk is drawn in place and the
  row carries the travel. The clip's own speed (that line's length over its length in time) is handed
  out, so a walker's rule can walk at it and the feet do not slide.
- One InstancedMesh per mesh of each body. Each copy's place, turn, clip and phase are 2 texels of a
  float texture, read in the vertex shader by `gl_InstanceID`; the instance matrices stay identity.
  Placement goes in a texture, not `instanceMatrix`, because three uploads `instanceMatrix` while it
  lists objects, before any hook a plugin has after render3d has placed things between steps, while
  a texture is uploaded when it is bound for the draw.
- A walker's place between steps: each walker row gets an empty Object3D in render3d's scene, tagged
  `userData.row`, which render3d moves between steps like everything else (so `drew` and `drifted`
  see it). The copy reads that object's world matrix in `onBeforeRender` / `onBeforeShadow`, after
  render3d has placed it and before the draw.
- Clip time is the step clock: `(n − 1 + between) × dt`, the moment render3d draws.

**The art.** Six library bodies (farmer_man, farmer_woman, farmhand, mechworker, soldier,
soldier_woman), eight clips each (idle, bored, look, talk, wave, cheer, clap, walk), baked by anim's
export through `assets/demo_crowd3d.bake.ts`: 2.4 to 4.4 MB a glb, 22 MB in all. Materials checked:
metallic 0, gloss turned to roughness, hair clipped (`MASK`). The plain Mixamo "Walking" is in place
(no travel to measure), so the walk is the Male Locomotion Pack's.

**Bugs met on the way.** `mixer.setTime` after a LoopOnce action finished left it paused, so every
later frame sampled time 0: replaced by setting `action.time` and `mixer.update(0)`, which three
evaluates at exactly that time (anim scrubs the same way). Growing an InstancedMesh inside the draw
hook would have swapped meshes in the middle of three's render list: growth moved to `tick`. A body
with no people has count 0, three would skip drawing it and its hook would never write the first
walker: such a mesh is drawn as one copy scaled to nothing.

**First look** (time stopped, step 300): 1012 people, no errors. 67 draw calls for the frame: 33 mesh
groups (bodies merged by material: 3 to 8 a body), 33 again for the sun's shadow, 1 the floor. 50.3M
triangles, about 25k a person per pass: this is now the whole cost, as wanted. The headless Chrome
drew 18 fps while sharing the GPU with another Chrome. The walk clip's hips travel 1.6686 m/s across
the ground; the stroller's speed is set to it. Shadows did not show on the ground in the first shot:
to look into.

**Shadows.** environment3d's `floor` is made without `receiveShadow`, so nothing ever shadowed it.
environment3d is shared and was left alone; the demo draws its own `ground` kind, which takes them.
The people's shadows then showed, cast through crowd3d's depth material.

**The chain, measured** (`crowd-evidence.mjs` and `crowd-overlap.mjs` on the testbed's headless
Chrome; every picture with time stopped):

1. One body: a mechworker waving, from three angles. Not done as asked: it is shown in its clip, not
   in its rest pose, since crowd3d draws clips only.
2. Draw calls do not follow the people: 67 calls with 1018 people, 67 with 1116, 67 with 1114.
   Triangles do: 50.6M, 55.5M, 55.4M.
3. The bake against three's own mixer, every body, every clip, 40 times each, bone positions from the
   hips: on a baked frame at most 0.0003 mm apart; between two baked frames at most 9.5 mm (a
   fingertip in `cheer`, 30 frames a second, the matrices blended linearly); hips height at most
   0.00003 mm. A three SkinnedMesh posed by its mixer, painted red and put exactly on a crowd3d
   person at the same clip time: the red covers it, and offset a metre it holds the same pose. The
   shader poses as three's skinning does.
4. 952 distinct start times among the 1000 standing (phases rounded to a millisecond); two pictures
   0.7 s apart show the crowd's poses moved.
5. Eight clips mixed in one body's crowd, still the same 67 calls.
6. Six bodies, 3 to 8 groups each (merged by material): 33 groups, 66 calls with the shadow.
7. Inside the crowd, at its edge and from above: every person drawn (never culled), 67 calls each
   time. The page held 23.7 frames a second over 180 frames, headless, with another Chrome on the GPU.
8. 180 frames of walkers drawn between steps (render3d's `drew`): 20555 frame-to-frame speeds, every
   one 1.6686 m/s to within 1e-12, the rule's speed; `drifted` named nothing. The planted toe of one
   walker slides a median 12 cm/s (worst 38 cm/s) on the frames it is down, against 1.67 m/s walked.
9. 19 walkers came during those frames, each first drawn 8 to 14 cm from its gate (it was hidden for
   the step it came on, then drawn where its row then stood); 19 went; no walker's drawn speed jumped.

**Where the cost is now.** Triangles. A Mixamo body is about 25k triangles a pass, so 1000 people are
50M with the shadow pass. The next thing to find is fewer triangles far off (a second, lighter mesh
per body, by distance), and whether the shadow pass needs every person.
