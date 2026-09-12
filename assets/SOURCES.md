# Interface assets

Original assets produced for the Sun Interference calculator on 2026-09-12. Static WebP images add no browser runtime dependency. They are illustrations, not measured orbital geometry or live site photographs.

| Asset | Production | Encoded size |
|---|---|---:|
| orbital-header.webp | Generated in the signed-in ChatGPT Pro Images interface, labelled Images 2.5; cwebp quality 76, 1440x811 | 53850 bytes |
| ground-station.webp | Higgsfield, gpt_image_2, medium; cwebp quality 74, 960x538 | 9246 bytes |
| sun-alignment.webp | Original Blender 5.2.1 LTS scene, Cycles 64 samples; cwebp quality 86, 1200x600 | 15976 bytes |

The ChatGPT image metadata exposes software-agent version 2.0 despite the interface's Images 2.5 title. The generation route is verified; the metadata does not independently verify a backend model version. No API-key fallback was used for the header.

Full prompts, provenance, private generation references, Blender source/scene and QA are retained in the local `.agents/` workspace. Original high-resolution masters are not needed by the application. Existing Rhuanssauro watermark assets and claw identity are preserved.

The three compared 21st directions informed composition only. No React, MapLibre, particle-loop implementation or third-party component source was copied into the runtime. References: [Black Hole Hero Section](https://21st.dev/@yura/components/blackhole-hero-section), [Constellation Grid](https://21st.dev/@daiwiikharihar/components/constellation-grid), [SatelliteOrbit](https://21st.dev/@ridemountainpig/components/flightcn-satellite-orbit).
