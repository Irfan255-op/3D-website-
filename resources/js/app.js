import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

if (import.meta.env.DEV) {
    window.gsap = gsap;
    window.ScrollTrigger = ScrollTrigger;
}

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Loading the page with a hash already in the URL (a cross-page nav link,
// a bookmark, a shared link, browser back/forward) otherwise races the
// browser's own native instant jump-to-fragment against Lenis/GSAP/the
// sphere system still initialising — the page ends up stuck in whatever
// transient, half-resolved state each system glimpsed mid-race. Forcing
// scroll back to 0 here, as early as possible, and disabling the browser's
// own scroll restoration neutralises that native jump so resolveInitialHash()
// (called once everything is actually ready, in the DOMContentLoaded handler
// below) can be the one and only thing that moves the scroll position.
if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
}
if (window.location.hash) {
    window.scrollTo(0, 0);
}

let lenis = null;

function initPageLoader() {
    const loader = document.getElementById('page-loader');

    if (!loader) {
        return;
    }

    const hide = () => {
        loader.classList.add('is-hidden');
        loader.addEventListener('transitionend', () => loader.remove(), { once: true });
    };

    const ready = Promise.all([
        new Promise((resolve) => {
            if (document.readyState === 'complete') {
                resolve();
            } else {
                window.addEventListener('load', resolve, { once: true });
            }
        }),
        'fonts' in document ? document.fonts.ready : Promise.resolve(),
    ]);

    ready.then(hide).catch(hide);
}

function initSmoothScroll() {
    if (prefersReducedMotion) {
        return;
    }

    lenis = new Lenis({
        duration: 1.1,
        smoothWheel: true,
    });

    lenis.on('scroll', ScrollTrigger.update);

    gsap.ticker.add((time) => {
        lenis.raf(time * 1000);
    });

    gsap.ticker.lagSmoothing(0);
}

function initScrollReveal() {
    if (prefersReducedMotion) {
        return;
    }

    gsap.utils.toArray('[data-animate-group]').forEach((group) => {
        const items = group.querySelectorAll('[data-animate]');

        if (!items.length) {
            return;
        }

        const isGrid = window.getComputedStyle(group).display === 'grid';

        try {
            gsap.from(items, {
                opacity: 0,
                scale: 0.9,
                y: 48,
                duration: 0.9,
                ease: 'back.out(1.4)',
                stagger: isGrid
                    ? { each: 0.1, from: 'start', grid: 'auto' }
                    : { each: 0.1, from: 'start' },
                scrollTrigger: {
                    trigger: group,
                    start: 'top 92%',
                    once: true,
                    invalidateOnRefresh: true,
                },
            });
        } catch (error) {
            gsap.set(items, { clearProps: 'all' });
            console.error('Scroll reveal failed for group, showing content instead:', group, error);
        }
    });

    const standalone = gsap.utils
        .toArray('[data-animate]')
        .filter((el) => !el.closest('[data-animate-group]'));

    standalone.forEach((el) => {
        gsap.fromTo(
            el,
            { opacity: 0, y: 56 },
            {
                opacity: 1,
                y: 0,
                duration: 1,
                ease: 'power2.out',
                scrollTrigger: {
                    trigger: el,
                    start: 'top 92%',
                    once: true,
                    invalidateOnRefresh: true,
                },
            }
        );
    });
}

function initScrambleReveal() {
    const targets = document.querySelectorAll('[data-scramble]');

    if (!targets.length) {
        return;
    }

    const GLYPHS = '!<>-_\\/[]{}=+*^?#%&~';

    function scramble(el) {
        const original = el.textContent;
        const length = original.length;
        const duration = 150 + length * 28;
        const start = performance.now();

        // The visible text mutates several times a second while this runs —
        // without this, a screen reader landing on the heading mid-animation
        // reads whatever garbled glyphs happen to be there at that instant,
        // not "Services". aria-label is static from the first frame, so the
        // accessible name is always correct regardless of animation state.
        el.setAttribute('aria-label', original);

        function frame(now) {
            const progress = Math.min(1, (now - start) / duration);
            const revealCount = Math.floor(progress * length);
            let output = '';

            for (let i = 0; i < length; i += 1) {
                if (i < revealCount || original[i] === ' ') {
                    output += original[i];
                } else {
                    output += GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
                }
            }

            el.textContent = output;

            if (progress < 1) {
                requestAnimationFrame(frame);
            } else {
                el.textContent = original;
            }
        }

        requestAnimationFrame(frame);
    }

    if (prefersReducedMotion) {
        return;
    }

    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    scramble(entry.target);
                    observer.unobserve(entry.target);
                }
            });
        },
        { threshold: 0.6 }
    );

    targets.forEach((el) => observer.observe(el));
}

function initHeroSphere() {
    const canvas = document.getElementById('hero-sphere');

    if (!canvas) {
        return;
    }

    if (prefersReducedMotion) {
        canvas.remove();
        document.getElementById('motion-toggle')?.remove();

        return;
    }

    import('three')
        .then((THREE) => buildHeroSphere(THREE, canvas))
        .catch((error) => {
            console.error('Hero sphere failed to load:', error);
            canvas.remove();
        });
}

// Parses "#rrggbb" into {r,g,b} 0-255 components for the mood-colour system;
// falls back to brand-600 so a missing/malformed data-sphere-mood never
// breaks the generic numeric lerp it feeds into.
const DEFAULT_MOOD = { r: 21, g: 87, b: 232 };

function moodKeysFromHex(hex) {
    const match = /^#?([a-f\d]{6})$/i.exec(hex || '');
    const rgb = match
        ? {
              r: parseInt(match[1].slice(0, 2), 16),
              g: parseInt(match[1].slice(2, 4), 16),
              b: parseInt(match[1].slice(4, 6), 16),
          }
        : DEFAULT_MOOD;

    return { moodR: rgb.r, moodG: rgb.g, moodB: rgb.b };
}

function buildHeroSphere(THREE, canvas) {
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
    camera.position.set(0, 0, 6.2);

    // Real scene lights, used only by the faceted gem (Skills) and stacked
    // discs (Work) below — the main orb and everything else fake their own
    // lighting inside a custom shader and ignore these entirely. Matches the
    // orb's existing top-right light direction so the two families read as
    // lit by the same source.
    const keyLight = new THREE.DirectionalLight(0xffffff, 2.4);
    keyLight.position.set(3, 3.5, 3);
    scene.add(keyLight);
    scene.add(new THREE.AmbientLight(0xbfe0ff, 0.55));

    function resize() {
        const width = canvas.clientWidth || window.innerWidth;
        const height = canvas.clientHeight || window.innerHeight;

        renderer.setSize(width, height, false);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
    }

    const uniforms = {
        uTime: { value: 0 },
        uDistort: { value: 0.07 },
        uProgress: { value: 0 },
        uSpike: { value: 0 },
        uBeacon: { value: 0 },
        uGlobalAlpha: { value: 1 },
        // Pearl white through the body, a rose-pink sheen at the fresnel
        // rim — was solid brand blue, which (once the background became
        // permanently blue from About onward) left the orb barely
        // distinguishable from its own backdrop. A warm, light palette
        // reads clearly regardless of what hue is behind it.
        uColorA: { value: new THREE.Color('#e8a0bc') },
        uColorB: { value: new THREE.Color('#f5c2d6') },
        uColorC: { value: new THREE.Color('#f29bc4') },
        // Page light source: top-right corner, slightly toward the viewer.
        uLightDir: { value: new THREE.Vector3(0.6, 0.7, 0.55).normalize() },
    };

    const vertexShader = `
        uniform float uTime;
        uniform float uDistort;
        uniform float uSpike;
        varying vec3 vNormal;
        varying vec3 vWorldPos;
        varying float vWave;
        varying float vSpike;

        float wave(vec3 p) {
            float n = sin(p.x * 2.1 + uTime * 0.9) * sin(p.y * 2.4 + uTime * 0.7);
            n += sin(p.y * 3.3 - uTime * 1.1) * sin(p.z * 2.6 + uTime * 0.5) * 0.6;
            n += sin(p.z * 1.8 + uTime * 1.3) * sin(p.x * 2.9 - uTime * 0.6) * 0.4;
            return n / 2.0;
        }

        // Soft rolling waves — a smooth triple-sine lattice. The original
        // version here used abs() and a sharpening pow(x, 1.9), which forced
        // the field toward 0 everywhere except isolated points where all
        // three sines aligned, reading as sharp sea-urchin spikes. Dropping
        // both keeps the value continuous and signed (-1..1), so the surface
        // gets broad, gentle dunes rolling both outward and inward instead —
        // calmer and more deliberate for an About/bio section.
        float spikeField(vec3 d) {
            return sin(d.x * 3.4 + uTime * 0.22)
                 * sin(d.y * 3.4 + uTime * 0.18)
                 * sin(d.z * 3.4 + uTime * 0.26);
        }

        float surfaceOffset(vec3 dir) {
            return wave(dir * 2.0) * uDistort + spikeField(dir) * uSpike * 0.34;
        }

        vec3 displacePoint(vec3 p) {
            vec3 dir = normalize(p);
            return p + dir * surfaceOffset(dir);
        }

        void main() {
            vec3 pos = position;
            vec3 displaced = displacePoint(pos);

            // Rebuild the normal from two displaced neighbours, otherwise the
            // spikes would be lit as if the surface were still smooth.
            vec3 up = mix(vec3(0.0, 1.0, 0.0), vec3(1.0, 0.0, 0.0), step(0.99, abs(normal.y)));
            vec3 tangent = normalize(cross(up, normal));
            vec3 bitangent = cross(normal, tangent);
            float eps = 0.025;
            vec3 pa = displacePoint(pos + tangent * eps);
            vec3 pb = displacePoint(pos + bitangent * eps);
            vec3 rebuilt = normalize(cross(pa - displaced, pb - displaced));

            vNormal = normalize(mat3(modelMatrix) * rebuilt);
            vec4 worldPos = modelMatrix * vec4(displaced, 1.0);
            vWorldPos = worldPos.xyz;
            vWave = wave(normalize(pos) * 2.0);
            vSpike = spikeField(normalize(pos)) * uSpike;

            gl_Position = projectionMatrix * viewMatrix * worldPos;
        }
    `;

    const fragmentShader = `
        precision highp float;
        uniform vec3 uColorA;
        uniform vec3 uColorB;
        uniform vec3 uColorC;
        uniform vec3 uLightDir;
        uniform float uProgress;
        uniform float uTime;
        uniform float uBeacon;
        uniform float uGlobalAlpha;
        varying vec3 vNormal;
        varying vec3 vWorldPos;
        varying float vWave;
        varying float vSpike;

        void main() {
            vec3 viewDir = normalize(cameraPosition - vWorldPos);
            vec3 n = normalize(vNormal);
            vec3 lightDir = normalize(uLightDir);

            float fresnel = pow(1.0 - clamp(dot(n, viewDir), 0.0, 1.0), 2.2);

            float mixPoint = clamp(n.y * 0.5 + 0.5 + uProgress * 0.4, 0.0, 1.0);
            vec3 base = mix(uColorA, uColorB, mixPoint);
            base = mix(base, uColorC, pow(fresnel, 1.3));

            // Frosted glass scatters light evenly rather than casting a hard
            // directional shadow, so the ambient floor sits much higher than
            // the old solid-gloss material used.
            float diffuse = max(dot(n, lightDir), 0.0);
            float ambient = 0.62;
            vec3 shaded = base * (ambient + (1.0 - ambient) * diffuse);

            // A dimmer, wider highlight than a plastic specular dot — light
            // diffusing through a frosted surface rather than bouncing off it.
            vec3 halfDir = normalize(lightDir + viewDir);
            float specular = pow(max(dot(n, halfDir), 0.0), 34.0) * 0.55;

            float sheen = smoothstep(0.4, 1.0, fresnel) * 0.5;
            vec3 color = shaded + specular + sheen + vWave * 0.04;

            // A milky frost where the surface faces the camera, clearing
            // toward the pink rim colour. Warmed from a cool blue-white to
            // match the new pearl palette — the old cool tint fought the
            // pink everywhere except right at the fresnel edge.
            color = mix(color, vec3(0.98, 0.93, 0.95), (1.0 - fresnel) * 0.2);

            // This darkened the wave crests toward near-black (0.45x) to
            // read as "dark wet metal" against the old blue palette — fine
            // when hue barely matters at low lightness, but it crushed the
            // new pearl-pink to near-grayscale across most of the visible
            // surface on About specifically (the one section with spike/wave
            // active), which is exactly where the "orb isn't visible"
            // complaint screenshot was taken. Lightened and weakened so the
            // waves still read as a distinct, glossier material without
            // erasing the colour that's the whole point now.
            float ferro = clamp(vSpike * 2.4, 0.0, 1.0) * 0.6;
            color = mix(color, color * 0.8 + specular * 0.7, ferro);

            // Fresnel-driven transparency: more solid near the centre, fully
            // bright right at the rim, the way light catches a glass edge.
            // Ferrofluid spikes stay fully opaque so they read as a distinct
            // wet material, not glass. The floor here used to be 0.48 — translucent
            // enough that on the old pale background it read as elegant frosted
            // glass, but against the permanent solid-blue background (added
            // later) that same transparency let the backdrop's blue dominate
            // over the orb's own pearl colour, especially face-on at the
            // centre where fresnel is lowest. Raised so the orb's own colour
            // wins regardless of what's behind it, while still keeping some
            // fresnel-driven glass variation toward the rim.
            float glassAlpha = mix(0.9, 0.99, pow(fresnel, 0.6));
            float alpha = mix(glassAlpha, 1.0, ferro);

            // Contact's "breathing beacon" — a slow pulsing inner light,
            // strongest facing the camera (not at the rim, which already has
            // its own fresnel sheen) so it reads as light coming from inside
            // the glass rather than another rim highlight.
            float pulse = sin(uTime * 1.3) * 0.5 + 0.5;
            color += vec3(1.0, 0.85, 0.92) * pulse * 0.4 * uBeacon * (1.0 - fresnel);

            gl_FragColor = vec4(color, alpha * uGlobalAlpha);
        }
    `;

    const sphereMesh = new THREE.Mesh(
        new THREE.SphereGeometry(0.95, 150, 150),
        new THREE.ShaderMaterial({ uniforms, vertexShader, fragmentShader, transparent: true })
    );

    // The group carries position/scale/roll for the whole assembly; only the
    // mesh itself spins on Y, so the orbital rings stay as flat circles.
    const sphere = new THREE.Group();
    sphere.add(sphereMesh);

    const rings = [];
    const ringDots = [];
    // Pearl/pink palette, not mood-hue-synced — rings tinted the same blue
    // family as the (now permanent, from About onward) blue background
    // nearly disappeared against it. A warm, light palette unrelated to
    // whatever hue the backdrop happens to be reads clearly regardless of
    // section, which a hue-matched one structurally can't. Fixed once at
    // creation rather than updated per frame, since it no longer needs to
    // track anything that changes.
    const RING_PALETTE = [new THREE.Color('#f2a8cc'), new THREE.Color('#fbeef3')];

    // Tilted at two different angles (not a shared one) rather than face-on
    // circles — reads more like two differently-inclined orbital planes
    // (closer to an armillary sphere) than two flat, nested rings.
    const RING_TILTS = [0.55, -0.38];

    [1.62, 2.12].forEach((radius, i) => {
        const tilt = RING_TILTS[i];
        const ringColor = RING_PALETTE[i];

        const ringMaterial = new THREE.MeshBasicMaterial({
            color: ringColor,
            transparent: true,
            // Roughly doubled from the original 0.18/0.12 — against a
            // saturated blue backdrop a hairline at the old opacity read as
            // barely-there regardless of hue.
            opacity: 0.4 - i * 0.12,
        });
        const ring = new THREE.Mesh(new THREE.TorusGeometry(radius, 0.005, 8, 200), ringMaterial);
        ring.rotation.x = tilt;
        ring.userData.spin = i === 0 ? 0.06 : -0.04;
        rings.push(ring);
        sphere.add(ring);

        // A marker riding each ring, so the orbits read as moving rather than drawn.
        const pivot = new THREE.Object3D();
        pivot.rotation.x = tilt;

        const dotMaterial = new THREE.MeshBasicMaterial({ color: ringColor, transparent: true, opacity: 0.95 });
        const dot = new THREE.Mesh(new THREE.SphereGeometry(i === 0 ? 0.042 : 0.03, 16, 16), dotMaterial);
        dot.position.x = radius;

        const trailMaterial = new THREE.MeshBasicMaterial({ color: ringColor, transparent: true, opacity: 0.4 });
        const trail = new THREE.Mesh(
            new THREE.TorusGeometry(radius, i === 0 ? 0.018 : 0.013, 8, 60, 0.6),
            trailMaterial
        );
        trail.rotation.z = -0.6;

        pivot.add(dot);
        pivot.add(trail);
        pivot.userData.spin = i === 0 ? 0.42 : -0.3;
        ringDots.push(pivot);
        sphere.add(pivot);
    });

    function makeBandTexture(label) {
        const textCanvas = document.createElement('canvas');
        textCanvas.width = 2048;
        textCanvas.height = 200;

        const ctx = textCanvas.getContext('2d');
        ctx.fillStyle = 'rgba(21, 87, 232, 0.72)';
        ctx.fillRect(0, 0, textCanvas.width, textCanvas.height);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.96)';
        ctx.font = '600 112px ui-monospace, Menlo, Consolas, monospace';
        ctx.textBaseline = 'middle';

        const unit = ctx.measureText(label).width;

        for (let x = 0; x < textCanvas.width + unit; x += unit) {
            ctx.fillText(label, x, textCanvas.height / 2 + 4);
        }

        const texture = new THREE.CanvasTexture(textCanvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.ClampToEdgeWrapping;
        texture.repeat.set(2, 1);
        texture.anisotropy = renderer.capabilities.getMaxAnisotropy();

        return texture;
    }

    const bandSideTexture = makeBandTexture('  LARAVEL  ·  PHP  ·  MYSQL  ·  REST API  ·');
    const bandTopTexture = makeBandTexture('  LIVEKIT  ·  WEBRTC  ·  TAILWINDCSS  ·  VITE  ·');

    // Sits clear of the sphere's own surface so it reads as wrapping around it
    // rather than slicing through it.
    const bandGeometry = new THREE.CylinderGeometry(1.4, 1.4, 0.36, 128, 1, true);
    const bandMaterials = [];

    function makeBand(map) {
        // Front faces carry the readable lettering. Back faces stay faint so the
        // ring closes behind the sphere without showing the text mirrored.
        const group = new THREE.Group();

        [[THREE.BackSide, 0.2], [THREE.FrontSide, 1]].forEach(([side, scale]) => {
            const bandMaterial = new THREE.MeshBasicMaterial({
                map,
                transparent: true,
                opacity: 0,
                side,
                depthWrite: false,
            });
            bandMaterial.userData.scale = scale;
            bandMaterials.push(bandMaterial);
            group.add(new THREE.Mesh(bandGeometry, bandMaterial));
        });

        return group;
    }

    const bandSide = makeBand(bandSideTexture);
    bandSide.rotation.x = 0.16;

    const bandTop = makeBand(bandTopTexture);
    bandTop.rotation.z = Math.PI / 2;
    bandTop.rotation.x = 0.06;

    const bands = [bandSide, bandTop];
    bands.forEach((band) => {
        band.visible = false;
        sphere.add(band);
    });

    // Skills gets its own object — a flat-faced, low-poly gem — rather than
    // another sphere variant. Flat (non-indexed) normals are what give it
    // distinct faces instead of a smooth-shaded ball; it's lit by the real
    // scene lights above, not the orb's faked shader lighting.
    // Skills: gyroscope rings — several thin rings at different fixed tilts
    // (not one shared axis), each independently precessing around its own
    // local z, interlocking around a small glowing core. Third design for
    // this section: the first was one solid faceted gem, the second was
    // orbiting discrete shards — this one is deliberately a different
    // *texture* again, wireframe-ish rotating bands rather than solid
    // chunks, closer to an armillary sphere/gyroscope mechanism than an
    // object made of parts.
    const gemCluster = new THREE.Group();
    gemCluster.visible = false;
    sphere.add(gemCluster);

    const gemCoreMaterial = new THREE.MeshStandardMaterial({
        color: new THREE.Color('#bfe9ff'),
        emissive: new THREE.Color('#27c9f2'),
        emissiveIntensity: 1.6,
        transparent: true,
        opacity: 0,
    });
    const gemCoreMesh = new THREE.Mesh(new THREE.IcosahedronGeometry(0.2, 1), gemCoreMaterial);
    gemCluster.add(gemCoreMesh);

    const skillTags = Array.from(document.querySelectorAll('#skills [data-skill-index]'));
    const skillCount = skillTags.length;

    // Similar-ish radius, each on a genuinely different axis combination —
    // true gyroscope/gimbal rings read as interlocking because they share
    // roughly one size and differ in orientation, not because they nest at
    // increasing radii the way the old orbit shells did.
    const GYRO_RING_COUNT = 4;
    const GYRO_TILTS = [
        { x: 0, y: 0 },
        { x: Math.PI / 2, y: 0.15 },
        { x: Math.PI / 4, y: Math.PI / 3 },
        { x: -Math.PI / 3, y: Math.PI / 6 },
    ];
    const gemRings = [];

    for (let i = 0; i < GYRO_RING_COUNT; i += 1) {
        const ringMaterial = new THREE.MeshPhysicalMaterial({
            color: new THREE.Color('#1557e8'),
            emissive: new THREE.Color('#27c9f2'),
            emissiveIntensity: 0,
            metalness: 0.2,
            roughness: 0.25,
            clearcoat: 1,
            clearcoatRoughness: 0.15,
            transparent: true,
            opacity: 0,
            side: THREE.DoubleSide,
            depthWrite: false,
        });
        const ring = new THREE.Mesh(new THREE.TorusGeometry(0.66 + i * 0.03, 0.028, 12, 100), ringMaterial);
        ring.rotation.x = GYRO_TILTS[i].x;
        ring.rotation.y = GYRO_TILTS[i].y;
        gemCluster.add(ring);

        // Round-robin bucketing of skills across the (deliberately small,
        // for an elegant gyroscope rather than a busy one) ring count —
        // several skills can share a ring, same grouping idea the original
        // single-gem version used across its facets.
        const groupSkills = skillCount
            ? skillTags.map((_, si) => si).filter((si) => Math.floor((si * GYRO_RING_COUNT) / skillCount) === i)
            : [];

        const spin = (0.3 + i * 0.12) * (i % 2 === 0 ? 1 : -1);

        gemRings.push({
            ring,
            ringMaterial,
            spin,
            spinCurrent: spin,
            glowCurrent: 0,
            skillIndices: groupSkills,
        });
    }

    let activeSkillIndex = -1;

    skillTags.forEach((el, index) => {
        el.setAttribute('tabindex', '0');

        const setActive = () => {
            activeSkillIndex = index;
        };
        const clearActive = () => {
            activeSkillIndex = -1;
        };

        el.addEventListener('mouseenter', setActive);
        el.addEventListener('mouseleave', clearActive);
        el.addEventListener('focus', setActive);
        el.addEventListener('blur', clearActive);
    });

    // Work: a floating block grid — small cubes at the eight corners of a
    // loose cube formation, each bobbing up and down at its own rhythm and
    // slowly self-rotating. Third design for this section (stacked/twisted
    // discs, then orbiting plates, now this): a literal "building blocks"
    // reading, and a genuinely different texture from either previous
    // version — independent bobbing rather than any kind of orbit, so
    // neither this nor the Skills gyroscope rings risk echoing each other
    // or the halo rings the way the last orbiting-plates version did.
    const discMaterial = new THREE.MeshPhysicalMaterial({
        color: new THREE.Color('#168bff'),
        metalness: 0.2,
        roughness: 0.25,
        clearcoat: 1,
        clearcoatRoughness: 0.15,
        transparent: true,
        opacity: 0,
        depthWrite: false,
    });

    const discGroup = new THREE.Group();
    const blockGeometry = new THREE.BoxGeometry(0.24, 0.24, 0.24);
    const discs = [];

    [-1, 1].forEach((gx) => {
        [-1, 1].forEach((gy) => {
            [-1, 1].forEach((gz) => {
                const block = new THREE.Mesh(blockGeometry, discMaterial);
                const base = new THREE.Vector3(gx * 0.42, gy * 0.42, gz * 0.42);
                block.position.copy(base);
                discGroup.add(block);

                discs.push({
                    block,
                    base,
                    phase: Math.random() * Math.PI * 2,
                    bobSpeed: 0.7 + Math.random() * 0.6,
                    bobHeight: 0.07 + Math.random() * 0.04,
                    spinX: (Math.random() - 0.5) * 0.5,
                    spinY: (Math.random() - 0.5) * 0.5,
                });
            });
        });
    });
    discGroup.visible = false;
    sphere.add(discGroup);

    // Explode-and-rebuild: during a left-right section crossing, whichever
    // shape is currently showing (orb, gem, or discs) dissolves and a cloud
    // of shards bursts outward from it, then the shards collapse back
    // together into a solid form as the crossing settles. Deliberately
    // scoped as a transition-only effect driven by the same `crossing`
    // value the arc/tumble/stretch already use (peaks at the horizontal
    // centre, 0 at either resting pose) — NOT a per-section resting-state
    // system. An earlier version of this site had each section's own
    // identity be a reassembled shape (data-driven node counts, flat cards,
    // etc.) via a 60-fragment InstancedMesh and a continuous scrollCurrent
    // value; it was built and then explicitly reverted. This is a
    // deliberately different, much smaller use of the same "fragments"
    // idea: the shards always explode out of and reform back into a plain
    // sphere, regardless of which shape is arriving on the other side —
    // they never need to know what Skills or Work or Contact look like.
    const fragmentMaterial = new THREE.MeshPhysicalMaterial({
        // Matches the orb's new pearl-pink palette (uColorA) — these shards
        // represent the orb breaking apart more often than they represent
        // the (still brand-blue, unchanged) gem/discs, so cohesion with the
        // orb wins.
        color: new THREE.Color('#e8a0bc'),
        metalness: 0.12,
        roughness: 0.25,
        clearcoat: 1,
        clearcoatRoughness: 0.15,
        transparent: true,
        opacity: 0,
    });

    // A random direction weighted toward a stronger z-component than a true
    // uniform sphere sample would give — plain randomDirection() reads as
    // mostly left/right/up/down from a head-on camera, since z-heavy samples
    // are just as common but far less visually obvious than xy-heavy ones.
    // Exaggerating z here is what actually makes fragments visibly fly
    // toward and away from the camera, not just sideways — the "reform in
    // depth" the flat version was missing.
    function randomExplodeDir() {
        return new THREE.Vector3(Math.random() * 2 - 1, Math.random() * 2 - 1, (Math.random() * 2 - 1) * 1.8).normalize();
    }

    function createFragmentData(count) {
        return Array.from({ length: count }, () => ({
            dir: randomExplodeDir(),
            spinAxisX: Math.random() * 2 - 1,
            spinAxisY: Math.random() * 2 - 1,
            spinSpeed: 2 + Math.random() * 4,
            explodeDist: 1.1 + Math.random() * 1.9,
            phase: Math.random() * Math.PI * 2,
            sizeScale: 0.5 + Math.random() * 1.0,
            // Raises explodeAmount to a per-fragment power before using it —
            // below 1, a fragment races ahead of the pack; above 1, it lags.
            // Without this every piece moves in perfect lockstep, which
            // reads as one synchronised pulse rather than a proper shatter.
            easePower: 0.6 + Math.random() * 1.0,
        }));
    }

    // Two batches, not one — chunkier tetrahedra plus thin angular slivers.
    // Real fracture debris is a mix of sizes and silhouettes, not one
    // uniform shape repeated; this is the cheapest way to get that variety
    // without hand-authoring custom geometry.
    const CHUNK_COUNT = 56;
    const SHARD_COUNT = 56;
    const chunkGeometry = new THREE.TetrahedronGeometry(0.1);
    const shardGeometry = new THREE.ConeGeometry(0.032, 0.24, 4);

    const chunkMesh = new THREE.InstancedMesh(chunkGeometry, fragmentMaterial, CHUNK_COUNT);
    const shardMesh = new THREE.InstancedMesh(shardGeometry, fragmentMaterial, SHARD_COUNT);
    chunkMesh.visible = false;
    shardMesh.visible = false;
    sphere.add(chunkMesh);
    sphere.add(shardMesh);

    const chunkData = createFragmentData(CHUNK_COUNT);
    const shardData = createFragmentData(SHARD_COUNT);
    const fragmentDummy = new THREE.Object3D();
    const fragmentScratch = new THREE.Vector3();

    function updateFragmentBatch(mesh, data, explodeAmount) {
        for (let i = 0; i < data.length; i += 1) {
            const f = data[i];
            const localAmount = Math.pow(explodeAmount, f.easePower);

            fragmentScratch.copy(f.dir).multiplyScalar(0.95 + f.explodeDist * localAmount);
            fragmentDummy.position.copy(fragmentScratch);
            fragmentDummy.rotation.set(
                f.phase + uniforms.uTime.value * f.spinSpeed * f.spinAxisX * localAmount,
                f.phase * 1.3 + uniforms.uTime.value * f.spinSpeed * f.spinAxisY * localAmount,
                f.phase * 0.7
            );
            fragmentDummy.scale.setScalar((0.45 + localAmount * 0.55) * f.sizeScale);
            fragmentDummy.updateMatrix();
            mesh.setMatrixAt(i, fragmentDummy.matrix);
        }
        mesh.instanceMatrix.needsUpdate = true;
    }

    scene.add(sphere);

    // About's wave intensity gets a one-time spring "bloom" the first time
    // the section scrolls into view, layered on top of the normal scroll-
    // driven fade — a brief overshoot-then-settle rather than the flat,
    // linear ease every other value on this sphere uses. Powered by vanilla
    // Motion (the non-React `motion` package) rather than GSAP specifically
    // for its spring physics shorthand; dynamically imported since it's only
    // ever needed once, well after the initial page load.
    let aboutBloom = 1;
    const aboutSection = document.getElementById('about');

    if (aboutSection) {
        const bloomObserver = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (!entry.isIntersecting) {
                        return;
                    }

                    aboutBloom = 0;
                    import('motion').then(({ animate }) => {
                        animate(0, 1, {
                            type: 'spring',
                            stiffness: 90,
                            damping: 9,
                            onUpdate: (value) => {
                                aboutBloom = value;
                            },
                        });
                    });
                    bloomObserver.unobserve(entry.target);
                });
            },
            { threshold: 0.4 }
        );

        bloomObserver.observe(aboutSection);
    }

    // The one-time "opening curtain": idle (hero at rest) it's fully hidden;
    // a modest amount of scrolling grows it from nothing to full coverage;
    // it then becomes the PERMANENT background for the rest of the page —
    // every section from here on (Services, Skills, Work, Contact) sits on
    // this blue floor, not the pale wash/ambient theme. It never fades back.
    // The footer still takes over normally at the very bottom, since its own
    // solid background simply paints over whatever is behind it regardless.
    //
    // Two things change at the same moment growth finishes, and the order
    // matters: (1) z-index drops from 50 (above <main>, needed while growing
    // so it can cover the hero text) to -1 (*below* everything, including the
    // canvas) — not some middle value. A middle z-index like 5 would still
    // sit above the z:0 canvas and permanently hide the orb/gem/discs behind
    // an opaque layer forever, which is the opposite of the goal: the orb
    // should keep rendering normally, just against a blue floor instead of a
    // pale one. (2) heroWipeDissolve, which fades the orb out early via the
    // existing uGlobalAlpha uniform (same one the gem/discs crossfade uses)
    // so it reads as "the orb became the colour," rises through the grow
    // phase and then falls back to 0 over a second, equal-length phase right
    // after — the orb re-emerges on top of the now-settled blue floor,
    // exactly like the reference screenshots, rather than staying hidden.
    let heroWipeDissolve = 0;
    const wipeEl = document.getElementById('scene-wipe');

    if (wipeEl) {
        const projectedPos = new THREE.Vector3();
        let wipeOriginX = '70%';
        let wipeOriginY = '35%';
        // GSAP fires an initial onUpdate synchronously when a ScrollTrigger
        // is created — before tick()'s first renderer.render() call, which is
        // what actually computes the camera's/sphere's world matrices. A
        // capture at that moment projects through stale (effectively
        // uninitialized) matrices and yields NaN. Capturing lazily on the
        // first onUpdate where progress has genuinely moved off 0 guarantees
        // real scrolling — and therefore at least one render — has already
        // happened, and the isFinite guard is a second line of defence.
        let originCaptured = false;

        const captureWipeOrigin = () => {
            camera.updateMatrixWorld();
            sphere.updateWorldMatrix(true, false);
            sphere.getWorldPosition(projectedPos);
            projectedPos.project(camera);

            if (!Number.isFinite(projectedPos.x) || !Number.isFinite(projectedPos.y)) {
                return;
            }

            wipeOriginX = `${((projectedPos.x * 0.5 + 0.5) * 100).toFixed(2)}%`;
            wipeOriginY = `${((1 - (projectedPos.y * 0.5 + 0.5)) * 100).toFixed(2)}%`;
        };

        // A fixed 900px of scroll, wherever it happens to start relative to
        // About — "scrolling a bit" shouldn't depend on how far down the
        // page About sits, and once covering, nothing here depends on
        // Services' or any other section's position either, since the
        // curtain never needs to react to anything again after settling.
        ScrollTrigger.create({
            trigger: '#about',
            start: 'top 95%',
            end: '+=900',
            scrub: true,
            onUpdate: (self) => {
                // GSAP fires this synchronously once at ScrollTrigger.create()
                // time, before fonts/layout/the hero's own intro animation
                // have necessarily settled — that premature call can measure
                // a small non-zero progress (observed: ~0.07) even though the
                // real scroll position is 0, and since nothing re-fires
                // onUpdate until the user actually scrolls, that faint
                // leftover circle just sits there at idle forever. Forcing
                // progress to 0 whenever the real scroll position is 0
                // sidesteps the quirk entirely rather than chasing its exact
                // cause — idle is idle, regardless of what GSAP measured
                // before the page had fully settled.
                const p = window.scrollY > 0 ? self.progress : 0;
                // First half: grow + dissolve the orb out. Second half: hold
                // fully covered, re-emerge the orb. opacity/clip-path/
                // background are only ever touched by growP, and growP is
                // permanently clamped at 1 once p passes 0.5 (scrub progress
                // itself holds at 1 past this trigger's end too) — so the
                // curtain's visible state, once settled, truly never changes
                // again for the rest of the scrollable page.
                const growP = Math.min(1, p / 0.5);
                const reappearP = Math.max(0, Math.min(1, (p - 0.5) / 0.5));

                if (growP > 0 && !originCaptured) {
                    captureWipeOrigin();
                    originCaptured = true;
                } else if (growP <= 0) {
                    originCaptured = false;
                }

                heroWipeDissolve = Math.max(0, growP - reappearP);
                wipeEl.style.zIndex = growP >= 1 ? '-1' : '50';
                wipeEl.style.clipPath = `circle(${(growP * 80).toFixed(2)}vmax at ${wipeOriginX} ${wipeOriginY})`;
                wipeEl.style.opacity = growP.toFixed(3);
                wipeEl.style.background = `radial-gradient(circle at ${wipeOriginX} ${wipeOriginY}, #1557e8 0%, #168bff 60%, #27c9f2 100%)`;
            },
        });
    }

    const intro = { y: -3.4, scale: 0.72, rotZ: -0.5, opacity: 0 };

    // Cursor-reactive drift, hero-only: the orb is otherwise static until
    // you scroll, so this is what gives the first screen something to
    // discover immediately. Strength fades to zero as the hero scrolls out
    // of view, via heroPresence below, so it never fights the scroll-driven
    // pose used by every other section.
    const pointerTarget = { x: 0, y: 0 };
    const pointerCurrent = { x: 0, y: 0 };

    if (!window.matchMedia('(pointer: coarse)').matches) {
        window.addEventListener('mousemove', (event) => {
            pointerTarget.x = (event.clientX / window.innerWidth) * 2 - 1;
            pointerTarget.y = (event.clientY / window.innerHeight) * 2 - 1;
        });
    }
    const scrollTarget = { x: 0, y: 0, scale: 1, rotZ: 0, spike: 0, bands: 0, fade: 1, gem: 0, discs: 0, beacon: 0, ...moodKeysFromHex() };
    const scrollCurrent = { x: 0, y: 0, scale: 1, rotZ: 0, spike: 0, bands: 0, fade: 1, gem: 0, discs: 0, beacon: 0, ...moodKeysFromHex() };

    // Waypoints are measured from the live DOM every time the layout can have
    // changed, rather than baked into fixed scroll percentages.
    let waypoints = [];

    // Below the sidebar breakpoint the sphere sits centred behind the copy
    // instead of beside it, so it is held back to keep text legible.
    let compactView = window.innerWidth < 1024;

    function measureWaypoints() {
        const list = [];
        const docTop = window.scrollY;
        const compact = window.innerWidth < 1024;
        const adapt = (pose) => (compact ? { ...pose, x: 0, scale: pose.scale * 0.62 } : pose);

        compactView = compact;

        const hero = document.querySelector('[data-sphere-hero]');

        if (hero) {
            const rect = hero.getBoundingClientRect();
            list.push({
                center: rect.top + docTop + rect.height / 2,
                caption: 'A journey of clean, purposeful code',
                pose: adapt({ x: 1.62, y: 0, scale: 1, rotZ: 0, spike: 0, bands: 0, fade: 1, gem: 0, discs: 0, beacon: 0, ...moodKeysFromHex(hero.dataset.sphereMood) }),
            });
        }

        document.querySelectorAll('[data-sphere-x]').forEach((el) => {
            const rect = el.getBoundingClientRect();
            list.push({
                center: rect.top + docTop + rect.height / 2,
                caption: el.dataset.caption || '',
                pose: adapt({
                    x: parseFloat(el.dataset.sphereX || '0'),
                    y: parseFloat(el.dataset.sphereY || '0'),
                    scale: parseFloat(el.dataset.sphereScale || '1'),
                    rotZ: parseFloat(el.dataset.sphereRot || '0'),
                    spike: parseFloat(el.dataset.sphereSpike || '0'),
                    bands: parseFloat(el.dataset.sphereBands || '0'),
                    fade: parseFloat(el.dataset.sphereFade || '1'),
                    gem: parseFloat(el.dataset.sphereGem || '0'),
                    discs: parseFloat(el.dataset.sphereDiscs || '0'),
                    beacon: parseFloat(el.dataset.sphereBeacon || '0'),
                    ...moodKeysFromHex(el.dataset.sphereMood),
                }),
            });
        });

        waypoints = list;
    }

    const railLinks = Array.from(document.querySelectorAll('[data-rail]'));
    const captionEl = document.getElementById('section-caption');
    let activeIndex = -1;

    function setActive(index) {
        if (index === activeIndex) {
            return;
        }

        activeIndex = index;

        railLinks.forEach((link) => {
            link.setAttribute('aria-current', String(Number(link.dataset.rail) === index));
        });

        const waypoint = waypoints[index];

        if (captionEl && waypoint && waypoint.caption) {
            captionEl.textContent = waypoint.caption;
        }
    }

    // Hold the pose either side of a waypoint, then hand off smoothly, so the
    // sphere rests while a section is read instead of drifting the whole time.
    const DWELL = 0.28;

    function segmentEase(t) {
        if (t <= DWELL) {
            return 0;
        }

        if (t >= 1 - DWELL) {
            return 1;
        }

        const k = (t - DWELL) / (1 - 2 * DWELL);

        return k * k * (3 - 2 * k);
    }

    function updateScrollTarget() {
        if (!waypoints.length) {
            return;
        }

        const focus = window.scrollY + window.innerHeight / 2;
        const first = waypoints[0];
        const last = waypoints[waypoints.length - 1];

        if (focus <= first.center) {
            Object.assign(scrollTarget, first.pose);
            setActive(0);

            return;
        }

        if (focus >= last.center) {
            Object.assign(scrollTarget, last.pose);
            setActive(waypoints.length - 1);

            return;
        }

        for (let i = 0; i < waypoints.length - 1; i += 1) {
            const a = waypoints[i];
            const b = waypoints[i + 1];

            if (focus >= a.center && focus <= b.center) {
                const span = Math.max(1, b.center - a.center);
                const raw = (focus - a.center) / span;
                const t = segmentEase(raw);

                Object.keys(scrollTarget).forEach((key) => {
                    scrollTarget[key] = a.pose[key] + (b.pose[key] - a.pose[key]) * t;
                });

                setActive(raw < 0.5 ? i : i + 1);

                return;
            }
        }
    }

    const clock = new THREE.Clock();
    let smoothedVelocity = 0;
    let lastScrollY = window.scrollY;
    let motionPaused = false;

    const motionToggle = document.getElementById('motion-toggle');

    if (motionToggle) {
        const renderToggle = () => {
            motionToggle.textContent = motionPaused ? '▶ Resume motion' : '⏸ Pause motion';
            motionToggle.setAttribute('aria-pressed', String(motionPaused));
        };

        motionToggle.addEventListener('click', () => {
            motionPaused = !motionPaused;
            renderToggle();
        });

        renderToggle();
    }

    function tick() {
        const raw = Math.min(clock.getDelta(), 0.1);
        // Scroll response keeps working while paused; only the ambient,
        // self-running animation stops.
        const delta = motionPaused ? 0 : raw;
        uniforms.uTime.value += delta;

        const currentScrollY = window.scrollY;
        smoothedVelocity += (Math.abs(currentScrollY - lastScrollY) - smoothedVelocity) * 0.08;
        lastScrollY = currentScrollY;

        const idleBreath = 0.055 + Math.sin(uniforms.uTime.value * 0.6) * 0.015;
        uniforms.uDistort.value = idleBreath + Math.min(smoothedVelocity * 0.006, 0.13);

        const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
        uniforms.uProgress.value = Math.min(1, currentScrollY / maxScroll);
        document.documentElement.style.setProperty('--scroll-progress', uniforms.uProgress.value.toFixed(4));

        updateScrollTarget();

        const damp = 1 - Math.exp(-raw * 6);
        Object.keys(scrollTarget).forEach((key) => {
            scrollCurrent[key] += (scrollTarget[key] - scrollCurrent[key]) * damp;
        });

        uniforms.uSpike.value = scrollCurrent.spike * aboutBloom;
        uniforms.uBeacon.value = scrollCurrent.beacon;

        // Per-section atmosphere: the ambient glow and the scroll-parallax
        // blob (both in app.css) read these every frame, so the background
        // tint drifts through each section's mood colour in step with the
        // sphere's own pose change, instead of staying one fixed brand hue
        // for the whole page.
        const root = document.documentElement.style;
        root.setProperty('--mood-r', scrollCurrent.moodR.toFixed(1));
        root.setProperty('--mood-g', scrollCurrent.moodG.toFixed(1));
        root.setProperty('--mood-b', scrollCurrent.moodB.toFixed(1));

        // The orb fades out whenever the gem or the discs take over — only
        // one "shape" is ever meant to be on screen at a time. Nothing else
        // (rings, orbit markers) is tied to this; they stay constant across
        // every section so there's a visual throughline underneath whichever
        // central object is active.
        const shapeSwap = Math.min(1, scrollCurrent.gem + scrollCurrent.discs);
        uniforms.uGlobalAlpha.value = (1 - shapeSwap) * (1 - heroWipeDissolve);
        sphereMesh.visible = shapeSwap < 0.99;

        // Materialising rather than a flat opacity fade: the shape grows in
        // from slightly undersized as it appears, so the reveal itself reads
        // as an intentional move instead of a translucent object just
        // fading into view.
        gemCluster.visible = scrollCurrent.gem > 0.01;
        gemCluster.scale.setScalar(0.55 + scrollCurrent.gem * 0.45);
        // A slow idle drift for the whole cluster — each ring's own
        // precession (below) is the main motion, this just keeps the whole
        // formation from looking like a static diagram.
        gemCluster.rotation.y += delta * 0.08;
        // Pulse is additive on top of the base emissive intensity, not a
        // full 0-to-max swing — a core that fully dims between beats reads
        // as flickering/broken, not breathing.
        const corePulse = 1.3 + Math.sin(uniforms.uTime.value * 1.6) * 0.5;
        gemCoreMaterial.emissiveIntensity = corePulse;
        gemCoreMaterial.opacity = scrollCurrent.gem * 0.85;

        // Hovering a skill brightens and slows whichever ring that skill is
        // grouped into — same "slow down rather than reposition" idea as
        // the previous orbiting-shard version, applied to a ring instead of
        // a single piece, since several skills share each ring here.
        gemRings.forEach((r) => {
            const isActive = r.skillIndices.includes(activeSkillIndex);
            const targetSpin = isActive ? r.spin * 0.1 : r.spin;
            const targetGlow = isActive ? 1 : 0;

            r.spinCurrent += (targetSpin - r.spinCurrent) * Math.min(1, delta * 4);
            r.glowCurrent += (targetGlow - r.glowCurrent) * Math.min(1, delta * 6);

            r.ring.rotation.z += delta * r.spinCurrent;

            r.ringMaterial.opacity = scrollCurrent.gem * 0.92;
            r.ringMaterial.emissiveIntensity = r.glowCurrent * 2;
        });

        discMaterial.opacity = scrollCurrent.discs * 0.95;
        discGroup.visible = scrollCurrent.discs > 0.01;
        discGroup.scale.setScalar(0.55 + scrollCurrent.discs * 0.45);
        discGroup.rotation.y += delta * 0.08;
        discs.forEach((d) => {
            d.block.position.y = d.base.y + Math.sin(uniforms.uTime.value * d.bobSpeed + d.phase) * d.bobHeight;
            d.block.rotation.x += delta * d.spinX;
            d.block.rotation.y += delta * d.spinY;
        });

        const bandOpacity = scrollCurrent.bands * scrollCurrent.fade * 0.92;
        bandMaterials.forEach((bandMaterial) => {
            bandMaterial.opacity = bandOpacity * bandMaterial.userData.scale;
        });
        bands.forEach((band) => {
            band.visible = bandOpacity > 0.01;
        });

        bandSide.rotation.y += delta * 0.12;
        bandTop.rotation.y -= delta * 0.09;
        bandSideTexture.offset.x -= delta * 0.055;
        bandTopTexture.offset.x += delta * 0.045;

        ringDots.forEach((pivot) => {
            pivot.rotation.z += delta * pivot.userData.spin;
        });
        rings.forEach((ring) => {
            ring.rotation.z += delta * ring.userData.spin;
        });

        pointerCurrent.x += (pointerTarget.x - pointerCurrent.x) * damp;
        pointerCurrent.y += (pointerTarget.y - pointerCurrent.y) * damp;

        // 1 at the very top of the page, eased to 0 by one viewport height of
        // scroll — the same distance the hero occupies before the first
        // section waypoint takes over.
        const heroPresence = Math.max(0, 1 - window.scrollY / window.innerHeight);

        // Left-right section swaps used to be a flat lerp straight through the
        // middle of the screen. "crossing" is 1 right at the horizontal
        // centre and fades to 0 at either side's resting pose (1.6ish); it
        // drives a genuine swing-through-depth arc rather than a scale trick
        // standing in for one:
        //   - arcDepth pushes it back substantially in z, so most of the
        //     apparent shrink comes from real perspective falloff (the
        //     camera is genuinely farther from it), not an artificial scale
        //     multiplier doing all the work — arcScale now only tops up a
        //     little, rather than carrying the whole effect.
        //   - arcLift raises it vertically mid-crossing, so it traces an
        //     actual arc/swing trajectory instead of a flat horizontal slide
        //     that merely shrinks and grows in place.
        //   - bank/pitch/tumble combine roll (z), a touch of coupled pitch
        //     (x), and yaw (y) — a tumble through three axes reads as
        //     genuinely three-dimensional, where a lone z-axis roll reads as
        //     flat. All are signed by travelRemaining (scrollTarget.x minus
        //     scrollCurrent.x), so the direction of travel is legible.
        //   - stretch squashes/elongates sphereMesh itself (not the group —
        //     see below) along its own local x, peaking at the same moment
        //     as everything else, so the orb reads as a soft, flung object
        //     rather than a rigid shape that merely shrinks and rotates.
        // Every one of these is a product of crossing and/or travelRemaining,
        // both of which shrink to 0 together as it settles — so the whole
        // arc dissolves away cleanly at rest, same as before.
        //
        // Forced to 0 in compact/mobile view specifically — measureWaypoints'
        // adapt() zeroes out every waypoint's own x there (the sphere sits
        // centred on mobile, not alternating sides), so scrollCurrent.x never
        // moves away from 0 and crossing's formula would otherwise read that
        // as PERMANENTLY at the crossing peak (1, forever) rather than at
        // rest. That silently left mobile with fragments permanently
        // exploded and the orb/gem/discs permanently dissolved for the
        // entire page — caught via an actual mobile-viewport screenshot
        // audit, not something that showed up at any desktop width.
        const crossing = compactView ? 0 : THREE.MathUtils.clamp(1 - Math.abs(scrollCurrent.x) / 1.6, 0, 1);
        const travelRemaining = scrollTarget.x - scrollCurrent.x;
        const bank = THREE.MathUtils.clamp(travelRemaining * 0.8, -0.55, 0.55) * crossing;
        const tumble = THREE.MathUtils.clamp(travelRemaining * 0.35, -0.45, 0.45) * crossing;
        const pitch = bank * 0.35;
        const arcScale = 1 - crossing * 0.07;
        const arcDepth = -crossing * 1.1;
        const arcLift = crossing * 0.45;
        const stretch = crossing * 0.22;

        sphere.position.x = scrollCurrent.x + pointerCurrent.x * 0.32 * heroPresence;
        sphere.position.y = scrollCurrent.y + intro.y - pointerCurrent.y * 0.22 * heroPresence + arcLift;
        sphere.position.z = arcDepth;
        sphere.scale.setScalar(scrollCurrent.scale * intro.scale * arcScale);
        sphere.rotation.z = scrollCurrent.rotZ + intro.rotZ + bank;
        sphere.rotation.x = -pointerCurrent.y * 0.14 * heroPresence + pitch;
        sphere.rotation.y = pointerCurrent.x * 0.14 * heroPresence + tumble;
        sphereMesh.rotation.y += delta * 0.18;
        // Deliberately on sphereMesh, not the parent "sphere" group — the
        // group also carries the gem/discs/bands/rings, and a non-uniform
        // group scale would stretch the gem's hard facets and the discs'
        // crisp edges into a smeared ellipsoid whenever a shape-swap happens
        // to overlap a crossing. The blobby orb is the only thing here it
        // reads as organic on.
        sphereMesh.scale.set(1 + stretch, 1 - stretch * 0.5, 1 - stretch * 0.5);

        // Explode-and-rebuild, using the same `crossing` value as the arc
        // above (so the burst peaks at exactly the same moment everything
        // else does). Dissolves whichever shape would otherwise be showing
        // — orb, gem, or discs — multiplicatively on top of their existing
        // opacity, so the shards read as having taken that shape's place
        // rather than sitting on top of it as an overlay.
        const explodeAmount = crossing;
        uniforms.uGlobalAlpha.value *= 1 - explodeAmount;
        gemCoreMaterial.opacity *= 1 - explodeAmount;
        gemRings.forEach((r) => {
            r.ringMaterial.opacity *= 1 - explodeAmount;
        });
        discMaterial.opacity *= 1 - explodeAmount;

        const fragmentsVisible = explodeAmount > 0.02;
        chunkMesh.visible = fragmentsVisible;
        shardMesh.visible = fragmentsVisible;
        fragmentMaterial.opacity = explodeAmount * 0.92;

        if (fragmentsVisible) {
            updateFragmentBatch(chunkMesh, chunkData, explodeAmount);
            updateFragmentBatch(shardMesh, shardData, explodeAmount);
        }

        canvas.style.opacity = (scrollCurrent.fade * (compactView ? 0.4 : 1) * intro.opacity).toFixed(3);

        renderer.render(scene, camera);
        requestAnimationFrame(tick);
    }

    let measureTimer;
    function scheduleMeasure() {
        window.clearTimeout(measureTimer);
        measureTimer = window.setTimeout(measureWaypoints, 150);
    }

    resize();
    measureWaypoints();
    tick();

    gsap.to(intro, { y: 0, scale: 1, rotZ: 0, duration: 1.5, ease: 'power3.out', delay: 0.2 });
    // Fades in on its own, faster timeline than the rise — masks the one
    // blank beat between page paint and the first WebGL frame actually
    // landing, rather than popping in abruptly once it does.
    gsap.to(intro, { opacity: 1, duration: 0.7, ease: 'power2.out', delay: 0.1 });

    window.addEventListener('resize', () => {
        resize();
        scheduleMeasure();
    });

    if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(measureWaypoints);
    }

    if (window.ResizeObserver) {
        new ResizeObserver(scheduleMeasure).observe(document.body);
    }
}

function initCustomCursor() {
    const ring = document.getElementById('cursor-ring');
    const label = document.getElementById('cursor-ring-label');

    if (!ring || !label || prefersReducedMotion || window.matchMedia('(pointer: coarse)').matches) {
        return;
    }

    document.documentElement.classList.add('custom-cursor-active');

    const setRingX = gsap.quickTo(ring, 'x', { duration: 0.2, ease: 'power3' });
    const setRingY = gsap.quickTo(ring, 'y', { duration: 0.2, ease: 'power3' });

    document.addEventListener('mousemove', (event) => {
        setRingX(event.clientX);
        setRingY(event.clientY);
        ring.classList.add('is-visible');
    });

    document.addEventListener('mouseleave', () => {
        ring.classList.remove('is-visible');
    });

    document.addEventListener('mouseover', (event) => {
        const labelTarget = event.target.closest('[data-cursor-text]');
        const hoverTarget = event.target.closest('a, button, input, textarea, select, [data-dot]');

        if (labelTarget) {
            label.textContent = labelTarget.dataset.cursorText;
            ring.classList.add('is-labelled');
        } else if (hoverTarget) {
            ring.classList.add('is-hovering');
        }
    });

    document.addEventListener('mouseout', (event) => {
        const labelTarget = event.target.closest('[data-cursor-text]');
        const hoverTarget = event.target.closest('a, button, input, textarea, select, [data-dot]');

        if (labelTarget) {
            ring.classList.remove('is-labelled');
            label.textContent = '';
        } else if (hoverTarget) {
            ring.classList.remove('is-hovering');
        }
    });
}

function initHeroLens() {
    const container = document.querySelector('[data-lens-text]');
    const layers = container?.querySelectorAll('[data-lens-layer]');

    if (!container || !layers?.length || prefersReducedMotion || window.matchMedia('(pointer: coarse)').matches) {
        return;
    }

    const radius = 70;
    const hero = container.closest('section') ?? container;

    const updatePosition = (event) => {
        const rect = container.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        layers.forEach((layer) => {
            layer.style.clipPath = `circle(${radius}px at ${x}px ${y}px)`;
        });
    };

    const hide = () => {
        layers.forEach((layer) => {
            layer.style.clipPath = 'circle(0px at 0px 0px)';
        });
    };

    hero.addEventListener('mousemove', updatePosition);
    hero.addEventListener('mouseleave', hide);
}

function initGrainTexture() {
    const grain = document.querySelector('.stage-grain');

    if (!grain) {
        return;
    }

    // Independent per-pixel noise, not feTurbulence's fractal blotches — this
    // is what makes it read as fine photographic grain instead of a tiled
    // smooth-noise filter. Three averaged samples per pixel softens the
    // harsh look of raw white noise into something closer to film stock.
    const size = 200;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;

    const ctx = canvas.getContext('2d');
    const imageData = ctx.createImageData(size, size);

    // Biased toward the light end (150-255, not 0-255): this layer sits under
    // mix-blend-mode: multiply, where a dark pixel visibly darkens whatever
    // is underneath it. Full-range noise multiplied over real content reads
    // as harsh static; keeping it light makes the multiply only ever subtly
    // dim, which is what actually looks like film grain.
    for (let i = 0; i < imageData.data.length; i += 4) {
        const v = Math.round(150 + ((Math.random() + Math.random() + Math.random()) / 3) * 105);
        imageData.data[i] = v;
        imageData.data[i + 1] = v;
        imageData.data[i + 2] = v;
        imageData.data[i + 3] = 255;
    }

    ctx.putImageData(imageData, 0, 0);
    grain.style.backgroundImage = `url(${canvas.toDataURL()})`;
}

function initMagneticButtons() {
    const targets = document.querySelectorAll('[data-magnetic]');

    if (!targets.length || prefersReducedMotion || window.matchMedia('(pointer: coarse)').matches) {
        return;
    }

    const STRENGTH = 0.35;
    const MAX_PULL = 14;

    targets.forEach((el) => {
        // CSS transforms have no visual effect on default `display: inline`
        // elements — several of these CTAs don't carry an explicit Tailwind
        // display utility, so without this the listener would fire and GSAP
        // would set the transform, but nothing would actually move.
        if (getComputedStyle(el).display === 'inline') {
            el.style.display = 'inline-block';
        }

        const moveX = gsap.quickTo(el, 'x', { duration: 0.45, ease: 'power3.out' });
        const moveY = gsap.quickTo(el, 'y', { duration: 0.45, ease: 'power3.out' });

        el.addEventListener('mousemove', (event) => {
            const rect = el.getBoundingClientRect();
            const relX = event.clientX - (rect.left + rect.width / 2);
            const relY = event.clientY - (rect.top + rect.height / 2);

            moveX(Math.max(-MAX_PULL, Math.min(MAX_PULL, relX * STRENGTH)));
            moveY(Math.max(-MAX_PULL, Math.min(MAX_PULL, relY * STRENGTH)));
        });

        el.addEventListener('mouseleave', () => {
            moveX(0);
            moveY(0);
        });
    });
}

function initFormSubmitGuard() {
    document.querySelectorAll('form').forEach((form) => {
        form.addEventListener('submit', () => {
            const button = form.querySelector('button[type="submit"]');

            if (!button || button.disabled) {
                return;
            }

            button.dataset.originalText = button.textContent;
            button.disabled = true;
            button.textContent = 'Please wait…';
        });
    });
}

function initFocusFirstError() {
    document.querySelector('[aria-invalid="true"]')?.focus();
}

// Pairs with the scroll-to-0 + manual scrollRestoration guard near the top
// of this file. Called once, after Lenis exists, so the hash resolves
// through the same single scroll path everything else (ScrollTrigger, the
// sphere's waypoints, the hero wipe curtain) observes — instead of a native
// browser jump none of them were coordinated with.
function resolveInitialHash() {
    if (!window.location.hash) {
        return;
    }

    const target = document.querySelector(window.location.hash);

    if (!target) {
        return;
    }

    if (lenis) {
        lenis.scrollTo(target, { immediate: true, offset: -16 });
    } else {
        target.scrollIntoView({ block: 'start' });
    }
}

function initNav() {
    const toggle = document.getElementById('nav-toggle');
    const menu = document.getElementById('nav-menu');
    const iconOpen = document.getElementById('nav-icon-open');
    const iconClose = document.getElementById('nav-icon-close');

    const closeMenu = () => {
        menu?.classList.add('hidden');
        iconOpen?.classList.remove('hidden');
        iconClose?.classList.add('hidden');
        toggle?.setAttribute('aria-expanded', 'false');
    };

    if (toggle && menu) {
        toggle.addEventListener('click', () => {
            const isOpen = !menu.classList.contains('hidden');

            menu.classList.toggle('hidden');
            iconOpen?.classList.toggle('hidden');
            iconClose?.classList.toggle('hidden');
            toggle.setAttribute('aria-expanded', String(!isOpen));
        });
    }

    document.querySelectorAll('a[href^="#"], a[href*="#"]').forEach((link) => {
        link.addEventListener('click', (event) => {
            const url = new URL(link.href, window.location.href);

            if (url.pathname !== window.location.pathname || !url.hash) {
                return;
            }

            const target = document.querySelector(url.hash);

            if (!target) {
                return;
            }

            event.preventDefault();
            closeMenu();

            if (lenis) {
                lenis.scrollTo(target, { offset: -16 });
            } else {
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });
}

document.addEventListener('DOMContentLoaded', () => {
    initPageLoader();
    initSmoothScroll();
    resolveInitialHash();
    initNav();
    initScrollReveal();
    initScrambleReveal();
    initHeroSphere();
    initGrainTexture();
    initHeroLens();
    initCustomCursor();
    initMagneticButtons();
    initFormSubmitGuard();
    initFocusFirstError();

    requestAnimationFrame(() => ScrollTrigger.refresh());

    if ('fonts' in document) {
        document.fonts.ready.then(() => ScrollTrigger.refresh());
    }
});
