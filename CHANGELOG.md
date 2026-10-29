# Changelog

## [3.19.2](https://github.com/verstak-ai/skills/compare/v3.19.1...v3.19.2) (2026-10-29)


### Bug Fixes

* **skills:** reconcile cited by pass; waking names every genre's open will ([#256](https://github.com/verstak-ai/skills/issues/256)) ([6eca1f1](https://github.com/verstak-ai/skills/commit/6eca1f1a0fc0290e2e4a5d6f2746ba77bc378a32))
* **skills:** review findings of 3.19.0 — six inherited prose defects ([#253](https://github.com/verstak-ai/skills/issues/253)) ([9988b3b](https://github.com/verstak-ai/skills/commit/9988b3bec28c075601afdf15e83ff886b028c767))
* **skills:** review nits of 3.18.x — person's kind, unknown readiness signs, CI reuse ([#255](https://github.com/verstak-ai/skills/issues/255)) ([b6b5ab8](https://github.com/verstak-ai/skills/commit/b6b5ab898f00935686a081e5b394ff1cf7267350))

## [3.19.1](https://github.com/verstak-ai/skills/compare/v3.19.0...v3.19.1) (2026-10-29)


### Bug Fixes

* **bridge:** the reply line under a person word is a full send, or names what is missing ([#251](https://github.com/verstak-ai/skills/issues/251)) ([6547fbe](https://github.com/verstak-ai/skills/commit/6547fbe4770d7782e181709f09a28ef546da0c6e))

## [3.19.0](https://github.com/verstak-ai/skills/compare/v3.18.2...v3.19.0) (2026-10-29)


### Features

* **bridge:** one dispatcher connection per daemon for every channel, the per-seat socket kept as the fallback (core 6f36bba0) ([ddccfe2](https://github.com/verstak-ai/skills/commit/ddccfe2166a264c2a45cf4fd60a8c130d606c95f))
* **bridge:** the reply line under a person's direct word from the window ([ddccfe2](https://github.com/verstak-ai/skills/commit/ddccfe2166a264c2a45cf4fd60a8c130d606c95f))


### Bug Fixes

* **bridge:** act_at in the seat's pulse; a usage snapshot over the tact limit is not sent ([ddccfe2](https://github.com/verstak-ai/skills/commit/ddccfe2166a264c2a45cf4fd60a8c130d606c95f))
* **opencode:** a first request with no cached tool list waits for the server's list ([ddccfe2](https://github.com/verstak-ai/skills/commit/ddccfe2166a264c2a45cf4fd60a8c130d606c95f))
* **writing:** a name too long for its emoji is shortened to its thesis ([ddccfe2](https://github.com/verstak-ai/skills/commit/ddccfe2166a264c2a45cf4fd60a8c130d606c95f))
* **writing:** a node's name starts with an emoji or a mark glyph ([#248](https://github.com/verstak-ai/skills/issues/248)) ([ae66f6d](https://github.com/verstak-ai/skills/commit/ae66f6db9d88e6d3804a2ad617b3025cf48b058f))
* **writing:** the leading emoji is the writer's duty; a long name loses words, not the emoji ([#250](https://github.com/verstak-ai/skills/issues/250)) ([2b2e035](https://github.com/verstak-ai/skills/commit/2b2e035b7f1cf7781c9f30809997cf0665fa18b0))

## [3.18.2](https://github.com/verstak-ai/skills/compare/v3.18.1...v3.18.2) (2026-10-28)


### Bug Fixes

* **onboarding:** name readiness by the labels the answer prints ([#246](https://github.com/verstak-ai/skills/issues/246)) ([e20d908](https://github.com/verstak-ai/skills/commit/e20d9083e9ae50941c9c88e653f5b90f019969e5))
* **onboarding:** never say the progress count as the person's progress ([#244](https://github.com/verstak-ai/skills/issues/244)) ([68939f6](https://github.com/verstak-ai/skills/commit/68939f6659dc4d7d9efb11f12d887fae365504bc))

## [3.18.1](https://github.com/verstak-ai/skills/compare/v3.18.0...v3.18.1) (2026-10-28)


### Bug Fixes

* **onboarding:** readiness by complete and items; a person's role always svatantra ([#240](https://github.com/verstak-ai/skills/issues/240)) ([d0f1cc5](https://github.com/verstak-ai/skills/commit/d0f1cc5fa507b1efc585dfb965b989d66465b487))
* **skills:** a person working in the graph is svatantra — scope it and name it at the call ([#243](https://github.com/verstak-ai/skills/issues/243)) ([86472e6](https://github.com/verstak-ai/skills/commit/86472e67d19f4cca1b680cb2e4684a3d0c93279f))

## [3.18.0](https://github.com/verstak-ai/skills/compare/v3.17.3...v3.18.0) (2026-10-27)


### Features

* adopt batch review and CI discipline in align contract 7 ([#236](https://github.com/verstak-ai/skills/issues/236)) ([4ddd521](https://github.com/verstak-ai/skills/commit/4ddd52152aa5aa990fd3ad374ec5fa0f63757236))
* **home:** full verstak catalogue in home/ — every skill but product-roadmap ([#238](https://github.com/verstak-ai/skills/issues/238)) ([32dfd87](https://github.com/verstak-ai/skills/commit/32dfd876367817b2f4616f8e5d534459ab56ebb5))


### Bug Fixes

* **home:** door contract line, home preface, verbatim fences, live pointers in onboarding ([#239](https://github.com/verstak-ai/skills/issues/239)) ([45567aa](https://github.com/verstak-ai/skills/commit/45567aa59ad9586dccfae4b2851ccd2f82bde59e))

## [3.17.3](https://github.com/verstak-ai/skills/compare/v3.17.2...v3.17.3) (2026-10-24)


### Bug Fixes

* **bridge:** sync core 9f3ec06d — seat graph canonical before register ([#234](https://github.com/verstak-ai/skills/issues/234)) ([a097fd6](https://github.com/verstak-ai/skills/commit/a097fd685c264494999703118a9393d166a93817))

## [3.17.2](https://github.com/verstak-ai/skills/compare/v3.17.1...v3.17.2) (2026-10-23)


### Bug Fixes

* a root session that finds personal memory missing provides it before reading the slice ([#232](https://github.com/verstak-ai/skills/issues/232)) ([f3a2faf](https://github.com/verstak-ai/skills/commit/f3a2faf40c39a9ce8dc7222473bac007fedea7ac))

## [3.17.1](https://github.com/verstak-ai/skills/compare/v3.17.0...v3.17.1) (2026-10-23)


### Bug Fixes

* a bare graph name only for a graph of your own; full address or rN otherwise ([#230](https://github.com/verstak-ai/skills/issues/230)) ([4ca670f](https://github.com/verstak-ai/skills/commit/4ca670f21e74db8735e0273a015724146afb6712))

## [3.17.0](https://github.com/verstak-ai/skills/compare/v3.16.0...v3.17.0) (2026-10-23)


### Features

* bridge core 09d31f55 — cover forms by language, verstak en form ([#221](https://github.com/verstak-ai/skills/issues/221)) ([63b7e28](https://github.com/verstak-ai/skills/commit/63b7e28b051d70ce11607131199795704ff8eda6))
* lead is its own method; roles and the steward seam; personal memory leaves AGENTS.md ([#227](https://github.com/verstak-ai/skills/issues/227)) ([bd7f390](https://github.com/verstak-ai/skills/commit/bd7f390c551d4d1374d9529e979f192203ecaaf7))
* leads hold contracts and effects; human questions as cards; graph address without a placeholder ([#223](https://github.com/verstak-ai/skills/issues/223)) ([1e6fe43](https://github.com/verstak-ai/skills/commit/1e6fe433eed43c623a7f24cfb525ba6b6c810c5f))


### Bug Fixes

* architecture's output is contracts; a contract yields an effect, a thing, or both ([#224](https://github.com/verstak-ai/skills/issues/224)) ([1808e6a](https://github.com/verstak-ai/skills/commit/1808e6a3b6908bbb9f9b6aaa7da6fe4eb22d6a12))
* read mind only once readiness shows this account's own graph ([#228](https://github.com/verstak-ai/skills/issues/228)) ([3e2edfb](https://github.com/verstak-ai/skills/commit/3e2edfb0aff8f263f3d5be21eced3599a8c4f4b3))
* the architect's goal is the architecture; reuse of the graph's fabric is the lead's to look for ([#225](https://github.com/verstak-ai/skills/issues/225)) ([553154f](https://github.com/verstak-ai/skills/commit/553154f63f7dae4d575cd251bde7d995017612bf))
* the start slice reads mind only on personal_mind state exactly present ([#229](https://github.com/verstak-ai/skills/issues/229)) ([3d73ddb](https://github.com/verstak-ai/skills/commit/3d73ddb43df07a6d803f07fd632de7e554bf8004))
* widgets leaves the delivery — the verstak.ai home carries its own ([#226](https://github.com/verstak-ai/skills/issues/226)) ([7f22d9a](https://github.com/verstak-ai/skills/commit/7f22d9a99cf4d4ab70d5cf889cf94ba5b648a99d))

## [3.16.0](https://github.com/verstak-ai/skills/compare/v3.15.0...v3.16.0) (2026-10-20)


### Features

* **verstak:** sync the bridge core to 4eede146; entry reads current nodes, onboarding counts the person's own move ([#218](https://github.com/verstak-ai/skills/issues/218)) ([f9d74cf](https://github.com/verstak-ai/skills/commit/f9d74cf10d38ec875b8d68b310f28d926f9932d6))

## [3.15.0](https://github.com/verstak-ai/skills/compare/v3.14.0...v3.15.0) (2026-10-20)


### Features

* resolve personal memory by identity and advance align contract ([#214](https://github.com/verstak-ai/skills/issues/214)) ([74728de](https://github.com/verstak-ai/skills/commit/74728deaf995905b9ca7b2f6351b7caff2882d87))

## [3.14.0](https://github.com/verstak-ai/skills/compare/v3.13.0...v3.14.0) (2026-10-20)


### Features

* **verstak:** sync the bridge core to f6efd85c — the role after compaction, a root without a cover seats in the same session ([#212](https://github.com/verstak-ai/skills/issues/212)) ([e7cb8c6](https://github.com/verstak-ai/skills/commit/e7cb8c6bf86c5c0ea8c1ccd0c9a563f2b4765552))

## [3.13.0](https://github.com/verstak-ai/skills/compare/v3.12.1...v3.13.0) (2026-10-19)


### Features

* **verstak:** telos check and re-assembly — the door's signal, assembly's review ([#210](https://github.com/verstak-ai/skills/issues/210)) ([2e035b4](https://github.com/verstak-ai/skills/commit/2e035b4c56a6ca37a63f7c5ea1068559da92a9ca))

## [3.12.1](https://github.com/verstak-ai/skills/compare/v3.12.0...v3.12.1) (2026-10-19)


### Bug Fixes

* **verstak:** a stop reaches only the seat it names — core synced to cd23015e ([#206](https://github.com/verstak-ai/skills/issues/206)) ([7152659](https://github.com/verstak-ai/skills/commit/715265992a69e52f1eb2b972dde0a41e730c1085))

## [3.12.0](https://github.com/verstak-ai/skills/compare/v3.11.1...v3.12.0) (2026-10-18)


### Features

* **verstak:** sync the bridge core to 0e44b1df and the onboarding fixes ([#204](https://github.com/verstak-ai/skills/issues/204)) ([81bbd25](https://github.com/verstak-ai/skills/commit/81bbd2555751b55b9192aeb709f27bab9b66a687))

## [3.11.1](https://github.com/verstak-ai/skills/compare/v3.11.0...v3.11.1) (2026-10-18)


### Bug Fixes

* **verstak:** subagent assignment case and closure follow the canon ([#202](https://github.com/verstak-ai/skills/issues/202)) ([891bb80](https://github.com/verstak-ai/skills/commit/891bb809e00706988cde4d250460e288b9078bb5))

## [3.11.0](https://github.com/verstak-ai/skills/compare/v3.10.0...v3.11.0) (2026-10-18)


### Features

* **verstak:** skills quality wave — one home per norm, teaching true to the tool surface ([#200](https://github.com/verstak-ai/skills/issues/200)) ([103eff4](https://github.com/verstak-ai/skills/commit/103eff40406f9e40f63771b66d99ec73edcebcfb))

## [3.10.0](https://github.com/verstak-ai/skills/compare/v3.9.0...v3.10.0) (2026-10-17)


### Features

* onboarding invited by the repository's own signs; a case line reports one movement ([#191](https://github.com/verstak-ai/skills/issues/191)) ([9f67897](https://github.com/verstak-ai/skills/commit/9f678972ecfe65edd2f1fd9b32f25dc0b7b3511f))


### Bug Fixes

* **bridge:** a case record of kind retract reads as a retracted answer ([#194](https://github.com/verstak-ai/skills/issues/194)) ([7aca6e1](https://github.com/verstak-ai/skills/commit/7aca6e1fd1988c35a9bc0dfc9bf7d8a8fcc2d682))

## [3.9.0](https://github.com/verstak-ai/skills/compare/v3.8.1...v3.9.0) (2026-10-17)


### Features

* **opencode:** a root session with no working graph is pointed at the onboarding method; core iskron v7.14.0 ([#189](https://github.com/verstak-ai/skills/issues/189)) ([7173b5f](https://github.com/verstak-ai/skills/commit/7173b5fea53a9ffb2031ca97d335921d8d15b944))

## [3.8.1](https://github.com/verstak-ai/skills/compare/v3.8.0...v3.8.1) (2026-10-17)


### Bug Fixes

* **bridge:** write the seat's hold record atomically — a reload under a race no longer loses the seat ([#187](https://github.com/verstak-ai/skills/issues/187)) ([c06af41](https://github.com/verstak-ai/skills/commit/c06af413195b6adb2677f3887fd9ef5bb1cf5507))

## [3.8.0](https://github.com/verstak-ai/skills/compare/v3.7.2...v3.8.0) (2026-10-16)


### Features

* **opencode:** root autoseat back on — core iskron 1229ebb0, onboarding role kind by motivation ([#183](https://github.com/verstak-ai/skills/issues/183)) ([1ea80c0](https://github.com/verstak-ai/skills/commit/1ea80c0934c3b9b315a9a7a8300e1944937f539b))

## [3.7.2](https://github.com/verstak-ai/skills/compare/v3.7.1...v3.7.2) (2026-10-16)


### Bug Fixes

* **opencode:** switch the root autoseat off — an owner's stop is no longer undone after a reload ([#184](https://github.com/verstak-ai/skills/issues/184)) ([2b5a6cb](https://github.com/verstak-ai/skills/commit/2b5a6cba4ed01e84aa046e50058a440fdcf2e617))

## [3.7.1](https://github.com/verstak-ai/skills/compare/v3.7.0...v3.7.1) (2026-10-16)


### Bug Fixes

* **onboarding:** the thread's first word is a phrase or a readiness sign's key ([#181](https://github.com/verstak-ai/skills/issues/181)) ([92b4475](https://github.com/verstak-ai/skills/commit/92b44750c70f5436f8f7b9060b65e53eb517c055))

## [3.7.0](https://github.com/verstak-ai/skills/compare/v3.6.1...v3.7.0) (2026-10-16)


### Features

* release 3.7 — core 7.13 stop strength, root autoseat, onboarding method, seat-honest door, two-step review ([#179](https://github.com/verstak-ai/skills/issues/179)) ([702980b](https://github.com/verstak-ai/skills/commit/702980bcee2256127ef98e801e22e63ac02efa8a))

## [3.6.1](https://github.com/verstak-ai/skills/compare/v3.6.0...v3.6.1) (2026-10-16)


### Bug Fixes

* **door:** a one-off task already yours opens its case on the subject; talk only when another holder must move ([#173](https://github.com/verstak-ai/skills/issues/173)) ([e665adb](https://github.com/verstak-ai/skills/commit/e665adb4525b7aa90423305426dddc7d3bddaedb))

## [3.6.0](https://github.com/verstak-ai/skills/compare/v3.5.0...v3.6.0) (2026-10-15)


### Features

* **assistant:** an assignment to an agent goes as a case; what's in work is read from cases ([#165](https://github.com/verstak-ai/skills/issues/165)) ([522d7ab](https://github.com/verstak-ai/skills/commit/522d7abcfd267b26dc6333382d4579a1e87ee086))
* **minding:** personal knowledge stays the user's; recall names its outcome and relates it to the case ([#168](https://github.com/verstak-ai/skills/issues/168)) ([e521358](https://github.com/verstak-ai/skills/commit/e521358278421875801f9d89558a7a6de45d62eb))


### Bug Fixes

* **bridge:** words and methods lead to cases instead of the channel's journal ([#171](https://github.com/verstak-ai/skills/issues/171)) ([cf8e9db](https://github.com/verstak-ai/skills/commit/cf8e9db6d948085c156969fba0be37a80e9c71dc))
* **minding:** no supersedes edge between personal records; a lesson's kind follows what it is ([#170](https://github.com/verstak-ai/skills/issues/170)) ([f545097](https://github.com/verstak-ai/skills/commit/f545097748db949c89abfe6be6c78e75e21eac4d))
* **writing:** every phenomenon has its given_as; a partial update that omits it keeps the value ([#167](https://github.com/verstak-ai/skills/issues/167)) ([bfd5a6c](https://github.com/verstak-ai/skills/commit/bfd5a6c1c82ca4b9d9e316893098759b2c697127))

## [3.5.0](https://github.com/verstak-ai/skills/compare/v3.4.0...v3.5.0) (2026-10-14)


### Features

* ship verstak to Codex as a plugin — manifest, repo marketplace, version and bridge-only gates ([#161](https://github.com/verstak-ai/skills/issues/161)) ([989c96c](https://github.com/verstak-ai/skills/commit/989c96cbea976f009c4757075ebaee5065c830ed))


### Bug Fixes

* **verstak:** C1 en r2 — claims graded by grounds, ends and waits by kind, the bridge core with the C1 moment and outcome cut ([#163](https://github.com/verstak-ai/skills/issues/163)) ([8def136](https://github.com/verstak-ai/skills/commit/8def1369088bbd51ed6169ac4e342dd77d62bb61))

## [3.4.0](https://github.com/verstak-ai/skills/compare/v3.3.0...v3.4.0) (2026-10-14)


### Features

* **bridge:** core from the sibling at 0434b9a6 — a seat taken off stops its agent, the status command, no room synonym ([#158](https://github.com/verstak-ai/skills/issues/158)) ([05c485b](https://github.com/verstak-ai/skills/commit/05c485b6d2eda81e3230b38baac107f9f06b8e83))


### Bug Fixes

* **bridge:** sync the core to iskron 7.10.0 — a stopped seat's word stays in the turn, an ended satellite is not woken, the launcher's revoke takes its seat off ([#160](https://github.com/verstak-ai/skills/issues/160)) ([c3d04cb](https://github.com/verstak-ai/skills/commit/c3d04cb8588f75372343d582df5a3270eae6d84f))
* **verstak:** a walk-through checks structure, not outcome; a decision is judged by what was known then and is not acceptance ([#157](https://github.com/verstak-ai/skills/issues/157)) ([25bbbf9](https://github.com/verstak-ai/skills/commit/25bbbf9701216a7ebd58ea68d71e98f9e3253a7d))

## [3.3.0](https://github.com/verstak-ai/skills/compare/v3.2.1...v3.3.0) (2026-10-12)


### Features

* **bridge:** core from the sibling 7.9.0 ([#156](https://github.com/verstak-ai/skills/issues/156)) ([a75fa92](https://github.com/verstak-ai/skills/commit/a75fa92e2cbbf4b262e91646fe4853ae363940c4))
* **verstak:** a correction or decision updates the touched nodes, not a new rule; a designer may update them; align contract 4 ([#155](https://github.com/verstak-ai/skills/issues/155)) ([2a4325a](https://github.com/verstak-ai/skills/commit/2a4325a11d9b42db0a79f44d28ccb51f5f0cc9ce))


### Bug Fixes

* **verstak:** architect sets work as a project in the graph and hands over a reference; no provenance in nodes; a correction fixes the deed ([#153](https://github.com/verstak-ai/skills/issues/153)) ([27725b3](https://github.com/verstak-ai/skills/commit/27725b3fa031c0d7b2fea88c23e0a0c3226ffd96))

## [3.2.1](https://github.com/verstak-ai/skills/compare/v3.2.0...v3.2.1) (2026-10-12)


### Bug Fixes

* **verstak:** the card is the wait — a wait on an agent is an ask card too, a partial line is only your own key's state ([#151](https://github.com/verstak-ai/skills/issues/151)) ([f3f5f94](https://github.com/verstak-ai/skills/commit/f3f5f94d4f3bec3be40c4c36a09a196245a29bfd))

## [3.2.0](https://github.com/verstak-ai/skills/compare/v3.1.0...v3.2.0) (2026-10-10)


### Features

* **bridge:** default server address and tool prefix from ~/.verstak-bridge/config.json ([#147](https://github.com/verstak-ai/skills/issues/147)) ([f16bccb](https://github.com/verstak-ai/skills/commit/f16bccbc23025a4f49f48e9d6e9b038ca2553799))

## [3.1.0](https://github.com/verstak-ai/skills/compare/v3.0.1...v3.1.0) (2026-10-09)


### Features

* **bridge:** core from the sibling 7.8.0 — leave refuses another seat by name, beside-seat probe, no role inbox hook ([#141](https://github.com/verstak-ai/skills/issues/141)) ([53b4e21](https://github.com/verstak-ai/skills/commit/53b4e21692155edf7388facadf2eec16a76277d9))


### Bug Fixes

* **align:** the plugin sample gives fj pr merge the same no-op flags as the hook filter ([#139](https://github.com/verstak-ai/skills/issues/139)) ([f324d55](https://github.com/verstak-ai/skills/commit/f324d558776360574bde4b9cf80fcab0f9db4451))
* **bridge:** verstak's own launch word — a subagent line reads 'verstak &lt;graph&gt; &lt;role&gt; case #N'; align contract 3 ([#143](https://github.com/verstak-ai/skills/issues/143)) ([96c5600](https://github.com/verstak-ai/skills/commit/96c5600d596d3762481aa8bde4894b9f04723686))
* **verstak:** a line on the key of your own open ask withdraws it — the card is already the wait ([#142](https://github.com/verstak-ai/skills/issues/142)) ([da41a42](https://github.com/verstak-ai/skills/commit/da41a425e8c6277e5fedc8e9a4c99af658c85b33))
* **verstak:** a subagent with an open ask hands its key to the lead before leaving ([#140](https://github.com/verstak-ai/skills/issues/140)) ([cd779ed](https://github.com/verstak-ai/skills/commit/cd779eda01e64bad256a88ec3911d1474ed3e120))
* **verstak:** cleanup is by name — a machine-wide prune deletes others' work ([#137](https://github.com/verstak-ai/skills/issues/137)) ([5fdebfc](https://github.com/verstak-ai/skills/commit/5fdebfc0af828118bce073e52571c0697b02881d))
* **verstak:** debts are the role's, not the seat's — abandoned role cases are worked through and closed ([#136](https://github.com/verstak-ai/skills/issues/136)) ([5f81e50](https://github.com/verstak-ai/skills/commit/5f81e5091c0845b8f7520a47d8c33e03ffdcd49d))
* **verstak:** integrity runs integration with a live neighbour as a case ([#144](https://github.com/verstak-ai/skills/issues/144)) ([8942827](https://github.com/verstak-ai/skills/commit/894282760de29a0d9154266e5ea4526bbf058aa1))
* **verstak:** port vahta after 7.8.0 — case closes at merge, findings as nodes; empty subagent answer is unverified; drop the room alias ([#145](https://github.com/verstak-ai/skills/issues/145)) ([5f656af](https://github.com/verstak-ai/skills/commit/5f656affc378e72a0e5635e8553edd0654e1c75b))
* **verstak:** refresh the tool-surface snapshot; restore is no batch action ([#146](https://github.com/verstak-ai/skills/issues/146)) ([04cebac](https://github.com/verstak-ai/skills/commit/04cebacf2c66d436c1c44d434f9c101f964b647b))
* **verstak:** waits on CI, builds and rollouts run in the background — a waiting turn hears nothing ([#133](https://github.com/verstak-ai/skills/issues/133)) ([b0065fe](https://github.com/verstak-ai/skills/commit/b0065fe15bbc640e86b245a197cca205923ce222))

## [3.0.1](https://github.com/verstak-ai/skills/compare/v3.0.0...v3.0.1) (2026-10-09)


### Bug Fixes

* **verstak:** report the receipt, not the hope — recorded, waiting or taken, never 'sent' beyond it ([#131](https://github.com/verstak-ai/skills/issues/131)) ([951eb76](https://github.com/verstak-ai/skills/commit/951eb76508cda0fec38646a525e2f8cf8dbc2ea6))

## [3.0.0](https://github.com/verstak-ai/skills/compare/v2.10.1...v3.0.0) (2026-10-08)


### ⚠ BREAKING CHANGES

* one verstak skill — the method re-derived from canon in English ([#120](https://github.com/verstak-ai/skills/issues/120))
* verstak bridge built from the shared core with an English delivery layer ([#127](https://github.com/verstak-ai/skills/issues/127))

### Features

* bridge core 7.7.0 from the shared core (8c67b1eb) ([#130](https://github.com/verstak-ai/skills/issues/130)) ([2de7cba](https://github.com/verstak-ai/skills/commit/2de7cbad31d9f82def8e35d38c12f89a8f36480b))
* one verstak skill — the method re-derived from canon in English ([#120](https://github.com/verstak-ai/skills/issues/120)) ([e5eaae4](https://github.com/verstak-ai/skills/commit/e5eaae4c7c853031016eb51dbb0f8ea7bff75607))
* verstak bridge built from the shared core with an English delivery layer ([#127](https://github.com/verstak-ai/skills/issues/127)) ([bd4acc7](https://github.com/verstak-ai/skills/commit/bd4acc7d0273e10dd2686028124c9e03ff8e4de7))


### Bug Fixes

* **build:** check-js compares the shipped version with the stamped one ([#129](https://github.com/verstak-ai/skills/issues/129)) ([f26ec7e](https://github.com/verstak-ai/skills/commit/f26ec7eb724a4a0113124d59f2f3e065f0694f09))

## [2.10.1](https://github.com/verstak-ai/skills/compare/v2.10.0...v2.10.1) (2026-10-08)


### Bug Fixes

* **assistant:** fall back to case at without the board lens; Map measured as the home does ([#125](https://github.com/verstak-ai/skills/issues/125)) ([0a33cab](https://github.com/verstak-ai/skills/commit/0a33caba83f315e5396ea5dbc3578af8d342b00c))

## [2.10.0](https://github.com/verstak-ai/skills/compare/v2.9.2...v2.10.0) (2026-10-08)


### Features

* **skills:** flat assistant and widgets for the conversation home ([#123](https://github.com/verstak-ai/skills/issues/123)) ([5d2ceaf](https://github.com/verstak-ai/skills/commit/5d2ceaf7160f51f1865f0279f336e6d39087b168))

## [2.9.2](https://github.com/verstak-ai/skills/compare/v2.9.1...v2.9.2) (2026-10-08)


### Bug Fixes

* **skills:** call the verstak_* tools — the verstak delivery's tool prefix ([#121](https://github.com/verstak-ai/skills/issues/121)) ([33300d7](https://github.com/verstak-ai/skills/commit/33300d72695b21a787c2cfd1781cb451a7ac26f7))

## [2.9.1](https://github.com/verstak-ai/skills/compare/v2.9.0...v2.9.1) (2026-08-24)


### Bug Fixes

* **establish-mcp:** the callback listener, not a file, decides who owns the bridge's OAuth flow ([#118](https://github.com/verstak-ai/skills/issues/118)) ([3887607](https://github.com/verstak-ai/skills/commit/3887607cf46fe3409062d910e467b6b2508a305b))

## [2.9.0](https://github.com/verstak-ai/skills/compare/v2.8.0...v2.9.0) (2026-08-24)


### Features

* conformance gate (manifest + surface lints); drop methodology-work ([#114](https://github.com/verstak-ai/skills/issues/114)) ([174d4a3](https://github.com/verstak-ai/skills/commit/174d4a3d7b6fdf4ba108dcf74bf7facd5ba2c6b5))
* **establish-mcp:** verstak-bridge — machine-wide auth coordination + rename ([#116](https://github.com/verstak-ai/skills/issues/116)) ([ea1b1da](https://github.com/verstak-ai/skills/commit/ea1b1da6443a6c20870745eaa440ca20c3152ad0))

## [2.8.0](https://github.com/verstak-ai/skills/compare/v2.7.0...v2.8.0) (2026-08-21)


### Features

* **establish-mcp:** bridge defaults to the product instance; MCP registered at user scope ([#111](https://github.com/verstak-ai/skills/issues/111)) ([a21bde8](https://github.com/verstak-ai/skills/commit/a21bde83d9f7db1caa38056aea1c0035d57ca169))

## [2.7.0](https://github.com/verstak-ai/skills/compare/v2.6.0...v2.7.0) (2026-08-21)


### Features

* **establish-mcp:** ship nks-bridge — stdio↔https OAuth bridge + the establish-mcp skill ([#109](https://github.com/verstak-ai/skills/issues/109)) ([e43f3f9](https://github.com/verstak-ai/skills/commit/e43f3f9071c805238096fe062c8e0089d0158b52))


### Bug Fixes

* **autonomous,collaborate:** name one Monitor form for holding the socket ([#108](https://github.com/verstak-ai/skills/issues/108)) ([d5ff196](https://github.com/verstak-ai/skills/commit/d5ff196e7461ff366ecee72ca59ed4a4564c5453))

## [2.6.0](https://github.com/verstak-ai/skills/compare/v2.5.0...v2.6.0) (2026-08-21)


### Features

* collaborate — pose-without-wake fix and the exit-on-frame waiting pattern ([#105](https://github.com/verstak-ai/skills/issues/105)) ([edb6061](https://github.com/verstak-ai/skills/commit/edb606184a7739f7de4f0b5c20ee2dcd79c92870))
* **foreman:** add the crew-running skill ([#90](https://github.com/verstak-ai/skills/issues/90)) ([4dc03da](https://github.com/verstak-ai/skills/commit/4dc03da684c2c563fce66022031fdc8aaea7ac72))
* **minding:** two-boundary fact routing + before-you-finish persistence checklist ([#106](https://github.com/verstak-ai/skills/issues/106)) ([d8ea449](https://github.com/verstak-ai/skills/commit/d8ea4492058f287f68842993e46d94044f3d92fe))
* ship the plugin archive as a release asset — the claude.ai delivery channel ([#104](https://github.com/verstak-ai/skills/issues/104)) ([3877331](https://github.com/verstak-ai/skills/commit/387733182f3faefe42fb756bdcc1d582c2cc72cf))


### Bug Fixes

* keep angle brackets out of skill descriptions (claude.ai plugin loader rejects them) ([#103](https://github.com/verstak-ai/skills/issues/103)) ([c2e1de8](https://github.com/verstak-ai/skills/commit/c2e1de84029a0ab8decb71b8fa63c655e8544168))

## [2.5.0](https://github.com/verstak-ai/skills/compare/v2.4.3...v2.5.0) (2026-08-14)


### Features

* **feedback,entry:** the feedback skill, plus two fixes the session paid for ([#97](https://github.com/verstak-ai/skills/issues/97)) ([f75f140](https://github.com/verstak-ai/skills/commit/f75f140a43d0efeedd5624a21a7d61d5f9f859e5))

## [2.4.3](https://github.com/verstak-ai/skills/compare/v2.4.2...v2.4.3) (2026-08-14)


### Bug Fixes

* **writing:** name the create gate on ahara/utpatti instead of denying it ([#95](https://github.com/verstak-ai/skills/issues/95)) ([c3cc0a3](https://github.com/verstak-ai/skills/commit/c3cc0a38182566a43362e3714db3c3865fe97f06))

## [2.4.2](https://github.com/verstak-ai/skills/compare/v2.4.1...v2.4.2) (2026-08-11)


### Bug Fixes

* **verstakify:** the doc slot is the only way an agent finds its own karta ([#93](https://github.com/verstak-ai/skills/issues/93)) ([7b16fb2](https://github.com/verstak-ai/skills/commit/7b16fb2824b7a5d45b3df92074bca876d8f98a01))

## [2.4.1](https://github.com/verstak-ai/skills/compare/v2.4.0...v2.4.1) (2026-08-09)


### Bug Fixes

* **collaborate,autonomous:** holding the socket closes on hello and a listening row, not on connect ([#91](https://github.com/verstak-ai/skills/issues/91)) ([b8d4f14](https://github.com/verstak-ai/skills/commit/b8d4f1458c8343591703217c050fdfac8158b8c8))

## [2.4.0](https://github.com/verstak-ai/skills/compare/v2.3.0...v2.4.0) (2026-08-08)


### Features

* **autonomous,collaborate,verstakify:** the merge is an event, freshness is checked, and the socket is held by a watchdog ([#85](https://github.com/verstak-ai/skills/issues/85)) ([7a72778](https://github.com/verstak-ai/skills/commit/7a72778a11efbf8e8caa6c9bfde2e540a9b59620))
* **collaborate,autonomous:** a person cannot open your pointer, talking is not a node, and a refusal is the densest reading ([#83](https://github.com/verstak-ai/skills/issues/83)) ([1bf56e1](https://github.com/verstak-ai/skills/commit/1bf56e1b75188e8fdf2d13fbb9f5a0fcf1b5a363))
* **integrity,autonomous,collaborate,verstakify:** integration starts from the graph, and choosing work is not a turn ([#89](https://github.com/verstak-ai/skills/issues/89)) ([69d884f](https://github.com/verstak-ai/skills/commit/69d884fcece6dd230575eedd19c1c8e127f5b54b))
* **writing,weaving:** the link goes in the edge, the explanation of the link goes in the body ([#88](https://github.com/verstak-ai/skills/issues/88)) ([8cb9a07](https://github.com/verstak-ai/skills/commit/8cb9a070c2a35d053140f1d21db91e5f724fb6c4))


### Bug Fixes

* **autonomous:** put the socket call in the body — a reference is read when debugging, not when doing ([#84](https://github.com/verstak-ai/skills/issues/84)) ([86fc74b](https://github.com/verstak-ai/skills/commit/86fc74bd8ef257be7856971c39238eea7f44c42f))
* **collaborate:** register settles who is speaking, not whether anyone can reach you ([#87](https://github.com/verstak-ai/skills/issues/87)) ([c2ea46d](https://github.com/verstak-ai/skills/commit/c2ea46d4174db394f86b55317a4945997ff4d576))

## [2.3.0](https://github.com/verstak-ai/skills/compare/v2.2.0...v2.3.0) (2026-08-06)


### Features

* **autonomous,collaborate:** the watch must be able to speak, read the board, and never end a tact on the mode ([#79](https://github.com/verstak-ai/skills/issues/79)) ([43da632](https://github.com/verstak-ai/skills/commit/43da632805af853473fede1240e337cc368300ef))
* **collaborate,autonomous:** name your standing before you write, register vs connect, muting, and the leaving close ([#81](https://github.com/verstak-ai/skills/issues/81)) ([91b144a](https://github.com/verstak-ai/skills/commit/91b144a6901664fa79484a08c3576220492a3960))


## [2.2.0](https://github.com/verstak-ai/skills/compare/v2.1.0...v2.2.0) (2026-08-05)


### ⚠ BREAKING CHANGES

* **verstakify:** the built-in memory is forbidden by dir, not by category ([#77](https://github.com/verstak-ai/skills/issues/77))

### Features

* **collaborate,autonomous:** standings, escalation by marker, channel liveness, weighing an ask, agreement over consensus ([#73](https://github.com/verstak-ai/skills/issues/73)) ([37d846a](https://github.com/verstak-ai/skills/commit/37d846a4e4c54e3fcbfd9d9767427d441133d094))
* **verstakify:** record a decision when it is taken, and describe a task before beginning it ([#78](https://github.com/verstak-ai/skills/issues/78)) ([2a12a83](https://github.com/verstak-ai/skills/commit/2a12a83a0b54a5b788703eb38c64ba83e6d31c15))
* **verstakify:** the built-in memory is forbidden by dir, not by category ([#77](https://github.com/verstak-ai/skills/issues/77)) ([d29df21](https://github.com/verstak-ai/skills/commit/d29df2161a36abb7637f27447cb8a0a0b42e6fc9))


### Bug Fixes

* **verstakify:** declare slash: true so typed /verstakify resolves in OpenCode v2 ([#72](https://github.com/verstak-ai/skills/issues/72)) ([fb8f35a](https://github.com/verstak-ai/skills/commit/fb8f35a43e2aae3dd3813e2707e06e78615b8a0c))

## [2.1.0](https://github.com/verstak-ai/skills/compare/v2.0.1...v2.1.0) (2026-08-04)


### Features

* **collaborate,autonomous,verstakify:** teach the status line, fix the watch's channel entry, name two projection defects ([#67](https://github.com/verstak-ai/skills/issues/67)) ([0274f76](https://github.com/verstak-ai/skills/commit/0274f76dde01aa8f4e6861023fbbd489634d9d1d))


### Bug Fixes

* **collaborate:** compare a frame's declared length against the wire form, not the unpacked text ([#70](https://github.com/verstak-ai/skills/issues/70)) ([462ba28](https://github.com/verstak-ai/skills/commit/462ba285a9692d966e88a7ef3f885674b0f793ad))
* name the entry skill in the form that actually resolves ([#69](https://github.com/verstak-ai/skills/issues/69)) ([fca81ed](https://github.com/verstak-ai/skills/commit/fca81eddee0cd7b149944b2e7404e72a0046ca41))

## [2.0.1](https://github.com/verstak-ai/skills/compare/v2.0.0...v2.0.1) (2026-08-04)


### Bug Fixes

* **collaborate:** make the listening half of the exchange executable ([#65](https://github.com/verstak-ai/skills/issues/65)) ([3a60f8b](https://github.com/verstak-ai/skills/commit/3a60f8b63c471cdf057a0237ad68a1fe434fd75d))

## [2.0.0](https://github.com/verstak-ai/skills/compare/v1.10.0...v2.0.0) (2026-08-02)


### ⚠ BREAKING CHANGES

* autonomous — the cycle carries work to integration; collaborate ([#59](https://github.com/verstak-ai/skills/issues/59))

### Features

* autonomous — the cycle carries work to integration; collaborate ([#59](https://github.com/verstak-ai/skills/issues/59)) ([9ed1720](https://github.com/verstak-ai/skills/commit/9ed1720f4b361ecb823773cd2f9db72635f64bc6))

## [1.10.0](https://github.com/verstak-ai/skills/compare/v1.9.0...v1.10.0) (2026-07-28)


### Features

* add reality-audit skill discipline ([#44](https://github.com/verstak-ai/skills/issues/44)) ([3ce074e](https://github.com/verstak-ai/skills/commit/3ce074eed5689aa64b5cb489ae27a80b7a0af8d8))
* **memory:** the user's mind in the graph — personal realm @&lt;handle&gt;/mind ([#53](https://github.com/verstak-ai/skills/issues/53)) ([02546b1](https://github.com/verstak-ai/skills/commit/02546b117cd7096440f64a85a7e50249bc15368b))
* **verstakify:** contract stamp and a Reality slot the agent cannot derive ([#57](https://github.com/verstak-ai/skills/issues/57)) ([0fb80a5](https://github.com/verstak-ai/skills/commit/0fb80a5d97e1cf303e595b4b9f6b2fec87fc172a))


### Bug Fixes

* replace dead nks_admin(my_kartas) with live nks_me(kartas) ([#55](https://github.com/verstak-ai/skills/issues/55)) ([f4d361d](https://github.com/verstak-ai/skills/commit/f4d361d44ff696b621e002ca38fc67cf050fd051))

## [1.9.0](https://github.com/verstak-ai/skills/compare/v1.8.0...v1.9.0) (2026-07-24)


### Features

* adopt release-please for versioning and tags ([#49](https://github.com/verstak-ai/skills/issues/49)) ([7eee045](https://github.com/verstak-ai/skills/commit/7eee045d15431966c33566ac59e424670e53d7ef))
* **assembly,writing,inquiry,design:** bianhua is the owner's interfa… ([067dcbb](https://github.com/verstak-ai/skills/commit/067dcbb9f090420d593b395cf3f6713202b314de))
* **assembly,writing,inquiry,design:** bianhua is the owner's interface — acceptance discipline ([43d7c68](https://github.com/verstak-ai/skills/commit/43d7c6806e235c4feb86fab438327c3954796d7e))
* bianhua-first orientation — seeds become pointers, not payload ([b7dfe58](https://github.com/verstak-ai/skills/commit/b7dfe5852a27c07473e0aa85bc3ebee9a861f981))
* bianhua-first orientation — seeds become pointers, not payload ([a9b1aa2](https://github.com/verstak-ai/skills/commit/a9b1aa2b507128b37aa7b3cd1708773e17c37e76))
* bump plugin version on every merge to main (no release-please) ([#35](https://github.com/verstak-ai/skills/issues/35)) ([9dace91](https://github.com/verstak-ai/skills/commit/9dace91454102cfb18c8cb344cf24506cb12c7de))
* **design:** canonical right-to-left flow + dedup write-mechanics into writing ([9d69cb9](https://github.com/verstak-ai/skills/commit/9d69cb9b43b0d765e39b15b34abf8e714ed67bc3))
* **design:** volitional kriya attaches as kriya-anga (mechanics, post-[#997](https://github.com/verstak-ai/skills/issues/997)) ([b2a2136](https://github.com/verstak-ai/skills/commit/b2a2136baf5403573029395c91bdb0fbb4f098cf))
* flip source of truth to skills/ + Claude Code plugin marketplace ([3bc4f80](https://github.com/verstak-ai/skills/commit/3bc4f8045eea9f93968d0e6cee5746e9ee8ee6b5))
* inbox batch — intake discipline, repo boundary, search-the-gap ([#46](https://github.com/verstak-ai/skills/issues/46)) ([de2d07f](https://github.com/verstak-ai/skills/commit/de2d07f621b8f881caa45df6cbb6d74e699b35bf))
* **intake:** add source-independent shabda-intake skill ([fa53e2b](https://github.com/verstak-ai/skills/commit/fa53e2be7637f66839d04fdf94096ee64f137372))
* **intake:** source-independent shabda-intake skill ([ab8217c](https://github.com/verstak-ai/skills/commit/ab8217c2332a49f6ab1bfd168f17cccaba1763d6))
* **integrity:** new skill — обвязка превращения (impact pass over a … ([a5c6bd8](https://github.com/verstak-ai/skills/commit/a5c6bd8970c589ac9b9b51b190d730fed1c27404))
* **integrity:** new skill — обвязка превращения (impact pass over a bianhua's telos) ([66025f5](https://github.com/verstak-ai/skills/commit/66025f58b494c4491f3628e7b338bc5d46ed4708))
* **interop:** superpowers coexistence — kernel law, adapter section, skill notes, spec-write hook ([#30](https://github.com/verstak-ai/skills/issues/30)) ([25410be](https://github.com/verstak-ai/skills/commit/25410bef692b0c82fa3e7a5f7ff70da38da7e03d))
* **on-duty:** rewrite as two loops ([#48](https://github.com/verstak-ai/skills/issues/48)) ([dc18fc9](https://github.com/verstak-ai/skills/commit/dc18fc956587db02bfb7eb8dd367b5c9eba17e02))
* onboarding arc, toolchain currency, session-close sweep ([#47](https://github.com/verstak-ai/skills/issues/47)) ([8b94a2b](https://github.com/verstak-ai/skills/commit/8b94a2b8eabc6bec28807efde01cc726e3f66d27))
* **product-roadmap:** add the product-roadmap skill ([4b9c436](https://github.com/verstak-ai/skills/commit/4b9c4360a3075c25fde001f53c042a8c56860b66))
* **repo-roadmap:** add the repo-roadmap skill ([476198c](https://github.com/verstak-ai/skills/commit/476198cbbeae6a60ceac2d1441cd39386f9fe601))
* **repo-roadmap:** adopt the intake skill for Step 5 ([3f04a0e](https://github.com/verstak-ai/skills/commit/3f04a0ee20f327792643ecd64e8fd72427f54be7))
* **repo-roadmap:** native multi-repo + graph-view showcase + grounding discipline ([5945757](https://github.com/verstak-ai/skills/commit/5945757726a2a30a54f0177b317961d4946a677d))
* **repo-roadmap:** ship a self-contained HTML render template ([b466bed](https://github.com/verstak-ai/skills/commit/b466bede5613be652f0acb2f4dc47379f8a2d44c))
* **skills:** add assembly + inquiry skills, wire bianhua into writin… ([a077d7f](https://github.com/verstak-ai/skills/commit/a077d7f53e72570febf65f6107637ca22f381439))
* **skills:** add assembly + inquiry skills, wire bianhua into writing/design/entry/methodology-work ([b8e5010](https://github.com/verstak-ai/skills/commit/b8e5010567ab67a3cf8b059852da397deb3491a1))
* **skills:** delegation discipline, identity-first entry, plugin manifest fix ([#39](https://github.com/verstak-ai/skills/issues/39)) ([aace348](https://github.com/verstak-ai/skills/commit/aace3480ecca0f08484f8ae9f1a336dfcf72aecb))
* **skills:** realm-agnostic skills + integrity claim-audit mode ([#32](https://github.com/verstak-ai/skills/issues/32)) ([7084a7b](https://github.com/verstak-ai/skills/commit/7084a7bd7f658d6826aaebd9ffc35ac283d63e68))
* **skills:** steward inbox loop + digestion rituals + first-session baton ([#34](https://github.com/verstak-ai/skills/issues/34)) ([dbed206](https://github.com/verstak-ai/skills/commit/dbed20612686811d998d87d7928c209cc183ef9a))
* **skills:** surface nks_semantic_search at every discovery step ([4af6ba6](https://github.com/verstak-ai/skills/commit/4af6ba646456e0ec4f2a655b3cbd991b7cc6e599))
* **skills:** surface nks_semantic_search at every discovery step ([89f02a9](https://github.com/verstak-ai/skills/commit/89f02a917f3798f0f81bf01b353284ac91342f34))
* **validate:** description byte gate — fail &gt;1024 UTF-8 bytes, warn &gt;900 ([#38](https://github.com/verstak-ai/skills/issues/38)) ([63f6cb6](https://github.com/verstak-ai/skills/commit/63f6cb639a6108e2fdff2f856a722ce2eee3be94))
* **verstakify:** operational-hazard audits + orchestration boundary ([fabbf19](https://github.com/verstak-ai/skills/commit/fabbf1903c867e9f97d23d12f514ba4690d79418))
* **verstakify:** operational-hazard audits + orchestration boundary ([49dd0b0](https://github.com/verstak-ai/skills/commit/49dd0b0fde5c3ba483f7a7278d017209d1b994af))
* **verstakify:** subagent delegation doctrine + role-agent projection ([#43](https://github.com/verstak-ai/skills/issues/43)) ([11ce31b](https://github.com/verstak-ai/skills/commit/11ce31b3eb12838b2906d7e05f88b65f30cc791f))
* **verstakify:** turn META.md archetype into an applied skill ([51d8ace](https://github.com/verstak-ai/skills/commit/51d8ace446d09c186514f0ca4538552a280000cc))
* **verstakify:** turn META.md archetype into an applied skill ([3524a54](https://github.com/verstak-ai/skills/commit/3524a54705685f348a2ab4ced60b8fcc623e9cf7))
* **weaving,entry:** route tensions by response_kind; name the bounda… ([b81c8a3](https://github.com/verstak-ai/skills/commit/b81c8a3675c78e6a5d274c79850b85d005330c36))
* **weaving,entry:** route tensions by response_kind; name the boundary criterion ([a93811e](https://github.com/verstak-ai/skills/commit/a93811ebe58821dc0ef4fa8c3f49caf467849e41))
* **writing,…:** posed_to arrow-only + step-by-step karta-kind discriminator ([9170e8f](https://github.com/verstak-ai/skills/commit/9170e8fed7eb2e9e711325e0f2fbb3166c110917))
* **writing,…:** teach karta manifested_as + machines-not-karta boundary ([138d2ca](https://github.com/verstak-ai/skills/commit/138d2ca02752abf53eb1d3703828094ca11a9005))
* **writing,design,integrity,inquiry:** posed_to is an arrow only; step-by-step karta-kind discriminator ([a8a1cdf](https://github.com/verstak-ai/skills/commit/a8a1cdf57951faf0ff27ebe2d002ec6c84c8ab8e))
* **writing,design,integrity,inquiry:** teach karta manifested_as + machines-not-karta boundary ([3e22155](https://github.com/verstak-ai/skills/commit/3e221559078b3696d6b5e47d25f1671657ac034b))
* **writing,inquiry,assembly:** teach kriya-anga grammar ([4e549a1](https://github.com/verstak-ai/skills/commit/4e549a17e9994532354f637ad0f2cbfe2ab1c0b1))
* **writing,inquiry,assembly:** teach kriya-anga grammar ([00c82ab](https://github.com/verstak-ai/skills/commit/00c82ab80da1889826d394882c6fa3c5f52e7187))
* **writing,weaving,methodology-work:** carrier canon — liveness axis per род ([#438](https://github.com/verstak-ai/skills/issues/438)) ([1477c54](https://github.com/verstak-ai/skills/commit/1477c543913f20a2405485ad148b96ec9f2c22d9))
* **writing,weaving,methodology-work:** carrier canon — liveness axis… ([5b3275e](https://github.com/verstak-ai/skills/commit/5b3275ecffc8551f513a5811ddc4074cc136afab))
* **writing:** per-type body vocabulary + batch schema preload ([#1027](https://github.com/verstak-ai/skills/issues/1027)) ([f56c660](https://github.com/verstak-ai/skills/commit/f56c66048dd41fea8c8e0992174f9e1101cd666d))
* **writing:** per-type body vocabulary + batch schema preload ([#1027](https://github.com/verstak-ai/skills/issues/1027)) ([a0e3f2e](https://github.com/verstak-ai/skills/commit/a0e3f2ea8dcfb2219170e9bd726af84246e8803a))
* **writing:** sync skill to shipped factory ergonomics ([#1027](https://github.com/verstak-ai/skills/issues/1027)) ([6ab7b84](https://github.com/verstak-ai/skills/commit/6ab7b848da843de36dc49b08c8cf9a76ece4080e))
* **writing:** sync skill to shipped factory ergonomics ([#1027](https://github.com/verstak-ai/skills/issues/1027)) ([34f931d](https://github.com/verstak-ai/skills/commit/34f931d633ac8eac51a5f7f7d7b742ed3c3bcc7b))
* **writing:** teach manifested_as + the karta test ([f52c83e](https://github.com/verstak-ai/skills/commit/f52c83ee34e37bc7ad778701d41c7964b1647bf0))


### Bug Fixes

* **design:** a ready (completed) kriya can be anga — bianhua reads the field of kriyas ([e5ed1a0](https://github.com/verstak-ai/skills/commit/e5ed1a07e5bf8539319f1f02f602d1e60041319a))
* **design:** project-triad birth modes + drop attrs.priority ([#998](https://github.com/verstak-ai/skills/issues/998)) ([12f5553](https://github.com/verstak-ai/skills/commit/12f555371f1357479573b0db423713c45f51be69))
* **design:** project-triad birth modes + drop attrs.priority ([#998](https://github.com/verstak-ai/skills/issues/998)) ([c00ba75](https://github.com/verstak-ai/skills/commit/c00ba755af2f466fe9d25975d4933375daf7b5c8))
* **product-roadmap:** align karta guidance with the manifested_as canon ([90cf699](https://github.com/verstak-ai/skills/commit/90cf699c32b086bbc16b55b8c45c8d64a08e3826))
* **product-roadmap:** runtime-operator actor layer + read-refresh re-run contract ([#28](https://github.com/verstak-ai/skills/issues/28)) ([9c76f44](https://github.com/verstak-ai/skills/commit/9c76f4440836928a664638d4e1e626aac37aa70d))
* **repo-roadmap:** correct the intake form-&gt;type attribution in Step 5 ([d784463](https://github.com/verstak-ai/skills/commit/d78446319a53508c1d5826b6c774855752434240))
* **repo-roadmap:** instant custom graph-view tooltip (replace slow native SVG &lt;title&gt;) ([be07681](https://github.com/verstak-ai/skills/commit/be076812e919e356ff44c0191956408962b32337))
* **skills:** compress descriptions to ≤900 UTF-8 bytes (opencode/agentskills 1024 limit) ([#37](https://github.com/verstak-ai/skills/issues/37)) ([930969a](https://github.com/verstak-ai/skills/commit/930969a58149f399ad94f4dc54114b6e793cfe53))
* **verstakify:** harden skill from end-to-end run feedback ([3c4183b](https://github.com/verstak-ai/skills/commit/3c4183b9a9244dc5e467d8251d1d3a46f0f95402))
* **verstakify:** harden skill from end-to-end run feedback ([a531287](https://github.com/verstak-ai/skills/commit/a531287f2f8a306101637634a9f38d7fb0a1d55c))
* **verstakify:** make accuracy first-class — AGENTS.md as derived view ([bca11f6](https://github.com/verstak-ai/skills/commit/bca11f65b8770c8ec154cbd8fa7a6087257e87b1))
* **verstakify:** make accuracy first-class — AGENTS.md as derived view ([91032b9](https://github.com/verstak-ai/skills/commit/91032b9b8b5e0e32823ca47461cdb84b4fb47946))
* **verstakify:** memory write-gate — project facts to repo/NKS, gate line in MEMORY.md ([#36](https://github.com/verstak-ai/skills/issues/36)) ([84bce70](https://github.com/verstak-ai/skills/commit/84bce701d41481da97e2c764057eccce9dc66109))
* **weaving,design,entry,verstakify:** skills review — retire stale teachings ([4c97a3b](https://github.com/verstak-ai/skills/commit/4c97a3bde8db5abfec0d6f1858f5c13184e2783f))
* **writing,design:** boundary is topological — drop boundary='init' w… ([c9ba15f](https://github.com/verstak-ai/skills/commit/c9ba15fc45446b21de5e45457337348dca7c1b8c))
* **writing,design:** boundary is topological — drop boundary='init' waiver and dead no-ahara row ([9d0f565](https://github.com/verstak-ai/skills/commit/9d0f565735736f0ca17cfa83ad7201ed37b65a7d))
* **writing,design:** inline ahara/utpatti in batches + no-actor karta-test gate ([2d0bcfe](https://github.com/verstak-ai/skills/commit/2d0bcfe86dfb4799cf283b12905b1efa88f9de0c))
* **writing,inquiry,design:** posed_to without an anchor is a lost vimarsha ([0905c4c](https://github.com/verstak-ai/skills/commit/0905c4cc7dda8cd228f282461a98e074b5aa9b0e))
* **writing:** trim manifested_as dup + require inline ahara/utpatti in batches ([ee058b7](https://github.com/verstak-ai/skills/commit/ee058b78c476ec8ee70d33118e767661cb943dd5))
