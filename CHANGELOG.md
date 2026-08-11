# Changelog

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
