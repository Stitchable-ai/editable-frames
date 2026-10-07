# EffectCraft study

The imported inventory maps 306 entries at upstream revision 8c4b988a65c772ca72ff1a6144f0b867bcbe2892. It is engineering research, not a certification of After Effects parity.

| Count | Primary implementation route |
|---:|---|
| 208 | Single-frame image/vector processing |
| 18 | Simulation and generated 3D |
| 24 | Time, analysis, tracking and deformation |
| 34 | Specialized data, VR and color pipelines |
| 13 | Audio DSP |
| 9 | Expression/UI controls |

The live effects studio contains 24 limited web implementations plus six composed looks. Each catalog entry identifies its prototype scope. The remaining 282 entries have not been implemented in this beta. Color keying uses a synthetic test scene; it does not prove natural-hair keying quality. Temporal examples read procedural source times, not arbitrary MP4 histories.

The useful architectural lesson is an effect host that can serve the inputs a complex effect requires. An optional WASM integration could reuse EffectCraft kernels, but no compiled EffectCraft engine is included. Remotion can host capable rendering libraries too; the framework's value is editing contracts and flexible adapters rather than a claim that removing Remotion increases visual fidelity by itself.
