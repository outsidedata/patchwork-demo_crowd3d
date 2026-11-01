# demo_crowd3d

The demo of crowd3d: a plaza of a thousand Mixamo people standing, talking, cheering, clapping and
waving, and people walking across it from six gates, every body of a kind drawn in a draw call per
material however many there are. Every soldier holds a sword in the right hand and a shield on the
left forearm and wears a helmet, each item drawn in a draw call however many hold it. Every person is
a row in crowd3d's pool, posed on the GPU from one bake of clips every body shares, and placed by the
clock along its row's course: where it stood, when, which way and how fast. A row that keeps its
course never changes, so a seat is sent nothing for it. Click a person to kill them: they fall where
they stand and stay lying there.

- `dev.html` is the demo: fly with W/S, turn with A/D, tilt with Q/E, Shift and Control to climb and
  sink, the wheel to pace, click a person to kill them. The panel holds crowd3d's bake rate, a
  `people` slider of how many of the standing crowd stand, and render3d's settings; the frame rate is
  at the top left.
- `index.html` is the plain game, `client.html` one seat on `demo_crowd3d.server.ts`.
- `main.scene.json` holds `world.crowd3d`: the bodies, the clips, and the `items`, each item a model
  and how it sits on its place (`rightHand`, `leftForearm`, `head`), `at`, `turn` and `scale` from
  that bone.
- `crowd` is the scene's clock (`time`, the steps taken times `dt`), stands the standing crowd when
  main starts, ends each walker when its walk is done, and kills the first living person a click's
  ray meets where they stand now. A `person` is a course: `pos` where it stood at `since`, `yaw`,
  `speed`, `body`, `clip`, and `holding`, what it holds on which place; a walker's `ends` is when it
  goes. A `gate` sends a person walking each time the clock reaches its `due`.
- `assets/crowd.rig.json` names the six library bodies and the nine clips baked onto each, `die`
  among them; `yarn bake demo_crowd3d` bakes them (`assets/demo_crowd3d.bake.ts`) into
  `assets/<body>.glb`.
- `assets/sword.glb`, `assets/shield.glb` and `assets/helmet.glb` are boxes standing in for real
  items.
- `assets/crowd.mjs` writes the standing crowd, `assets/crowd.json`, each person with its body,
  clip, place, facing and what it holds (every soldier the kit).
- `JOURNAL.md` is the experiment as it went (outsidedata/core#44).
