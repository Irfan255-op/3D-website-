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

// Resolves the moment the page loader starts fading out (immediately if the
// page has no loader). Intro choreography — the hero copy's staged rise, the
// orb's entrance — waits on this so it plays in view instead of finishing
// unseen behind the loader.
let pageReady = Promise.resolve();

// Where the orb currently is in viewport pixels, published by the 3D loop so
// DOM-side effects can aim at it. `ready` stays false until the scene has
// actually rendered, so anything reading this has a way to tell the
// difference between "centre of the screen" and "no scene running".
const orbScreen = { x: 0, y: 0, ready: false };

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

    // Capped at the same 3s as the CSS auto-hide fallback on #page-loader:
    // the hero copy now starts hidden and waits on this, so a `load` event
    // held up by one slow third-party request must never mean a blank hero.
    const timeout = new Promise((resolve) => window.setTimeout(resolve, 3000));

    pageReady = Promise.race([ready, timeout]).then(hide, hide);
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

    // Hero: one staged sequence timed to the loader lifting, rather than five
    // independent scroll triggers that all fired on the same first frame (and
    // usually finished behind the loader, unseen).
    const heroItems = gsap.utils.toArray('[data-sphere-hero] [data-animate]');

    if (heroItems.length) {
        gsap.set(heroItems, { opacity: 0, y: 40 });
        pageReady.then(() => {
            gsap.to(heroItems, {
                opacity: 1,
                y: 0,
                duration: 1.3,
                ease: 'expo.out',
                stagger: 0.09,
                clearProps: 'transform',
            });
        });
    }

    // The hero copy drifts up and dims as you leave it, a beat ahead of the
    // blue curtain swallowing the frame — so the handoff reads as depth (copy
    // nearer the camera than the orb) instead of everything being covered at
    // one flat rate.
    const heroContent = document.querySelector('[data-hero-content]');

    if (heroContent) {
        gsap.to(heroContent, {
            yPercent: -14,
            opacity: 0.15,
            ease: 'none',
            scrollTrigger: {
                trigger: '[data-sphere-hero]',
                start: 'top top',
                end: 'bottom 25%',
                scrub: true,
            },
        });
    }

    // Homepage stage cards enter from the side they sit on — the side the orb
    // has just vacated — with a slight swing through depth, then their
    // contents settle in one after another. [data-stagger] containers (tag
    // lists, the services accordion, project rows, process steps) stagger per
    // child instead of arriving as one block.
    const stageCards = gsap.utils.toArray('[data-sphere-x] > .stage-card[data-animate]');
    const wide = window.innerWidth >= 1024;

    stageCards.forEach((card) => {
        const fromRight = card.dataset.side === 'right';
        const items = card.querySelectorAll(':scope > :not([data-stagger]), [data-stagger] > *');
        const timeline = gsap.timeline({
            scrollTrigger: { trigger: card, start: 'top 85%', once: true, invalidateOnRefresh: true },
        });

        timeline
            .fromTo(
                card,
                wide
                    ? {
                          opacity: 0,
                          x: fromRight ? 90 : -90,
                          rotationY: fromRight ? -9 : 9,
                          transformPerspective: 1400,
                          transformOrigin: fromRight ? '100% 50%' : '0% 50%',
                      }
                    : { opacity: 0, y: 56 },
                { opacity: 1, x: 0, y: 0, rotationY: 0, duration: 1.25, ease: 'expo.out', clearProps: 'transform,opacity' }
            )
            .fromTo(
                items,
                { opacity: 0, y: 22 },
                { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out', stagger: 0.055, clearProps: 'transform,opacity' },
                0.18
            );
    });

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
        .filter((el) => !el.closest('[data-animate-group]') && !heroItems.includes(el) && !stageCards.includes(el));

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
                // The text melt splits this heading into per-character
                // spans, which a still-running scramble would overwrite on
                // its very next frame. This is the all-clear.
                el.dataset.scrambleDone = 'true';
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

    Promise.all([import('three'), import('three/addons/environments/RoomEnvironment.js')])
        .then(([THREE, { RoomEnvironment }]) => buildHeroSphere(THREE, canvas, RoomEnvironment))
        .catch((error) => {
            console.error('Hero sphere failed to load:', error);
            canvas.remove();
            // The finale section is nothing but a stage for the 3D logo
            // forming — without WebGL it would just be an empty band.
            document.getElementById('finale')?.remove();
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

function buildHeroSphere(THREE, canvas, RoomEnvironment) {
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
    camera.position.set(0, 0, 6.2);

    // Image-based lighting for every physical material in the scene (the
    // gyroscope rings, the floating blocks, the burst shards): a prefiltered
    // studio "room" they reflect, so clearcoat and iridescence have actual
    // surroundings to catch instead of one lone directional highlight on
    // otherwise flat colour — the difference between a lit object and a
    // tinted silhouette. The orb, its halo rings and the text bands use
    // their own shaders/basic materials and are unaffected by design.
    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environmentIntensity = 0.85;
    pmrem.dispose();

    // Real scene lights, used only by the physical-material shapes below —
    // the main orb and everything else fake their own lighting inside a
    // custom shader and ignore these entirely. Matches the orb's existing
    // top-right light direction so the two families read as lit by the same
    // source. Ambient lowered now the environment map carries the fill.
    const keyLight = new THREE.DirectionalLight(0xffffff, 2.2);
    keyLight.position.set(3, 3.5, 3);
    scene.add(keyLight);
    scene.add(new THREE.AmbientLight(0xbfe0ff, 0.25));

    // Cached rather than read per frame: tick() writes CSS custom properties
    // on <html> every frame, so a per-frame getBoundingClientRect() would
    // force a full synchronous style recalc each time. The canvas is
    // position:fixed, so its rect only ever changes on resize.
    let canvasRect = canvas.getBoundingClientRect();

    function resize() {
        const width = canvas.clientWidth || window.innerWidth;
        const height = canvas.clientHeight || window.innerHeight;

        renderer.setSize(width, height, false);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        canvasRect = canvas.getBoundingClientRect();
        uniforms.uResolution.value.set(width * renderer.getPixelRatio(), height * renderer.getPixelRatio());
    }

    // Touch ripples: a small ring buffer of impacts that the orb's vertex
    // shader turns into waves travelling across its surface — your clicks,
    // and the Services data packets landing. Written by triggerRipple().
    const RIPPLE_SLOTS = 8;

    // One breath for the whole page. Everything that idles — the orb's
    // swell, the gem core, Contact's beacon, the "available" status dot, the
    // scroll cue, the finale's glow — runs on this period or a clean
    // multiple of it, so the site reads as one organism rather than six
    // things each ticking to their own timer. The CSS side reads the same
    // number from --breath-duration (app.css); JS uses the matching angular
    // rate. 3.6s is a slow, calm human breath — faster read as nervous.
    const BREATH_SECONDS = 3.6;
    const BREATH_RATE = (Math.PI * 2) / BREATH_SECONDS;

    const uniforms = {
        uTime: { value: 0 },
        // Real elapsed time. Unlike uTime it keeps running while motion is
        // paused, so things you *do* to the orb (ripples) still respond —
        // same rule as scroll, which also keeps working while paused.
        uClock: { value: 0 },
        uRipples: { value: Array.from({ length: RIPPLE_SLOTS }, () => new THREE.Vector4(0, 0, 1, -100)) },
        uRippleAmp: { value: new Float32Array(RIPPLE_SLOTS) },
        // The cursor pressing a soft dent into the surface beneath it.
        uTouchDir: { value: new THREE.Vector3(0, 0, 1) },
        uTouch: { value: 0 },
        uDistort: { value: 0.07 },
        uProgress: { value: 0 },
        uSpike: { value: 0 },
        uBeacon: { value: 0 },
        uGlobalAlpha: { value: 1 },
        // --- Refraction of the page behind the orb ---------------------
        // There is no way to sample the real backdrop from here: the page
        // background is CSS, painted by the browser *under* a transparent
        // WebGL canvas, so it never exists as a texture this shader could
        // read. But we author that background ourselves and know its exact
        // formula — the blue curtain is one radial gradient whose origin
        // and colours app.js sets — so the shader rebuilds it procedurally
        // and refracts *that*. Accurate because it's the same gradient,
        // and free because there's no render-to-texture pass.
        uResolution: { value: new THREE.Vector2(1, 1) },
        uBgOrigin: { value: new THREE.Vector2(0.7, 0.35) },
        // 0 = pale hero wash, 1 = the settled blue curtain.
        uBgBlue: { value: 0 },
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
        uniform float uClock;
        uniform float uDistort;
        uniform float uSpike;
        uniform vec4 uRipples[${RIPPLE_SLOTS}];
        uniform float uRippleAmp[${RIPPLE_SLOTS}];
        uniform vec3 uTouchDir;
        uniform float uTouch;
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

        // Each ripple slot is a wave packet spreading out from an impact
        // (xyz = impact direction in the orb's own space, w = uClock at the
        // moment of impact). Distance is measured as an angle, so the ring
        // travels over the curve of the surface instead of through it, and
        // it fades as it spreads.
        float rippleField(vec3 dir) {
            float sum = 0.0;
            for (int i = 0; i < ${RIPPLE_SLOTS}; i++) {
                float age = uClock - uRipples[i].w;
                if (age < 0.0 || age > 3.5) continue;
                float d = acos(clamp(dot(dir, uRipples[i].xyz), -1.0, 1.0)) - age * 1.7;
                sum += sin(d * 13.0) * exp(-d * d * 9.0) * exp(-age * 1.3) * uRippleAmp[i];
            }
            return sum;
        }

        // The cursor pressing in: a soft dimple centred under the pointer.
        float touchDent(vec3 dir) {
            return -uTouch * pow(max(dot(dir, uTouchDir), 0.0), 22.0);
        }

        float surfaceOffset(vec3 dir) {
            return wave(dir * 2.0) * uDistort
                 + spikeField(dir) * uSpike * 0.34
                 + rippleField(dir) * 0.055
                 + touchDent(dir) * 0.09;
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
        uniform vec2 uResolution;
        uniform vec2 uBgOrigin;
        uniform float uBgBlue;
        varying vec3 vNormal;
        varying vec3 vWorldPos;
        varying float vWave;
        varying float vSpike;

        // The page's own background, rebuilt in shader space so the orb has
        // something real to bend. Blue state mirrors the curtain's gradient
        // exactly (#1557e8 -> #168bff at 60% -> #27c9f2); pale state
        // approximates the hero's wash (near-white, cyan low-right).
        vec3 pageBackground(vec2 uv) {
            float d = distance(uv * vec2(uResolution.x / uResolution.y, 1.0),
                               uBgOrigin * vec2(uResolution.x / uResolution.y, 1.0));

            vec3 blue = mix(vec3(0.082, 0.341, 0.910), vec3(0.086, 0.545, 1.0), smoothstep(0.0, 0.6, d));
            blue = mix(blue, vec3(0.153, 0.788, 0.949), smoothstep(0.6, 1.1, d));

            vec3 pale = mix(vec3(0.97, 0.98, 1.0), vec3(0.72, 0.90, 0.99), smoothstep(0.35, 1.0, uv.x * 0.35 + (1.0 - uv.y) * 0.65));

            return mix(pale, blue, uBgBlue);
        }

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
            // Ambient raised from 0.62: the unlit lower-left of the orb was
            // sinking to a muddy mauve, which read as a dirty plastic ball
            // rather than a pearl — a pearl's shadow side stays luminous.
            // Wrapped (half-Lambert-style) falloff, so the terminator rolls
            // off softly the way light does through a translucent shell,
            // and shadows tinted a cool lavender instead of just darkened —
            // nacre's shadow side is a colour, not grey.
            float diffuse = clamp(dot(n, lightDir) * 0.6 + 0.4, 0.0, 1.0);
            float ambient = 0.78;
            vec3 shadowTint = vec3(0.9, 0.86, 1.0);
            vec3 shaded = base * mix(shadowTint * ambient, vec3(1.0), diffuse);

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
            color = mix(color, vec3(0.98, 0.93, 0.95), (1.0 - fresnel) * 0.3);

            // Nacre: a thin-film hue drift (cosine palette) that only lives
            // toward the rim and shifts with the surface's tilt, so the edge
            // shimmers lilac -> peach -> mint as the waves roll, the way real
            // mother-of-pearl does. Kept faint and rim-masked — the body
            // colour stays the pearl-pink the user signed off on.
            vec3 nacre = 0.5 + 0.5 * cos(6.28318 * (fresnel * 1.15 + n.y * 0.18 + vWave * 0.25 + vec3(0.0, 0.33, 0.67)));
            color = mix(color, color + nacre * 0.24, smoothstep(0.2, 0.95, fresnel) * 0.6);

            // Cool bounce light from below-left: once the page is blue, the
            // orb sits inside a blue world, and a rim that picks up a little
            // of that colour is what makes it look lit by its surroundings
            // instead of pasted on top of them.
            float bounce = pow(fresnel, 1.5) * clamp(dot(n, normalize(vec3(-0.55, -0.7, 0.35))), 0.0, 1.0);
            color += vec3(0.32, 0.7, 1.0) * bounce * 0.38;

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
            // Refraction. The ray bends on the way through, so what you see
            // behind the orb is displaced — most at the rim, where you look
            // through the most glass at the steepest angle, and barely at
            // all dead centre. Red, green and blue bend by slightly
            // different amounts (dispersion), which is what gives real glass
            // its coloured fringing at the edges.
            vec2 screenUv = gl_FragCoord.xy / uResolution;
            screenUv.y = 1.0 - screenUv.y;
            vec2 bend = refract(-viewDir, n, 0.82).xy * (0.06 + 0.1 * fresnel);
            bend.y = -bend.y;

            vec3 behind = vec3(
                pageBackground(screenUv + bend * 1.08).r,
                pageBackground(screenUv + bend).g,
                pageBackground(screenUv + bend * 0.92).b
            );

            // Mixed into the body rather than left to alpha blending: the orb
            // is deliberately near-opaque (so the blue backdrop can't wash
            // out its pearl colour), which means the only way light can
            // appear to pass *through* it is to paint the refracted image on
            // ourselves. Suppressed on the wave crests, which read as a
            // denser material.
            //
            // Kept deliberately light. A first pass at 0.42 let 40% of the
            // backdrop through face-on, which over the blue sections turned
            // the pearl lavender — exactly the "orb isn't pink any more"
            // problem that the recolour was meant to end. Refraction is a
            // secondary cue here: enough to see the background bend and
            // split into colour at the edge, never enough to repaint the orb.
            float clarity = (1.0 - fresnel) * 0.18 * (1.0 - ferro);
            color = mix(color, color * 0.78 + behind * 0.5, clarity);

            float glassAlpha = mix(0.9, 0.99, pow(fresnel, 0.6));
            float alpha = mix(glassAlpha, 1.0, ferro);

            // Contact's "breathing beacon" — a slow pulsing inner light,
            // strongest facing the camera (not at the rim, which already has
            // its own fresnel sheen) so it reads as light coming from inside
            // the glass rather than another rim highlight.
            float pulse = sin(uTime * ${BREATH_RATE.toFixed(5)}) * 0.5 + 0.5;
            color += vec3(1.0, 0.85, 0.92) * pulse * 0.4 * uBeacon * (1.0 - fresnel);

            gl_FragColor = vec4(color, alpha * uGlobalAlpha);
        }
    `;

    // Fewer segments in compact view: the vertex shader now also sums the
    // ripple slots three times per vertex (for the rebuilt normal), and
    // phones are where that cost would show first.
    const ORB_SEGMENTS = window.innerWidth < 1024 ? 110 : 150;

    const sphereMesh = new THREE.Mesh(
        new THREE.SphereGeometry(0.95, ORB_SEGMENTS, ORB_SEGMENTS),
        new THREE.ShaderMaterial({ uniforms, vertexShader, fragmentShader, transparent: true })
    );

    // The group carries position/scale/roll for the whole assembly. `spinner`
    // sits inside it and holds everything that turns when you grab and spin
    // the orb — the orb itself, every section's shape, the text bands and the
    // particle swarm — while the halo rings stay outside it, a fixed frame of
    // reference that makes the spin readable.
    const sphere = new THREE.Group();
    const spinner = new THREE.Group();
    sphere.add(spinner);
    spinner.add(sphereMesh);

    let rippleCursor = 0;

    // Starts a ripple at `dir` (a unit direction in sphereMesh's own space)
    // in the next ring-buffer slot, overwriting the oldest.
    function triggerRipple(dir, amplitude) {
        uniforms.uRipples.value[rippleCursor].set(dir.x, dir.y, dir.z, uniforms.uClock.value);
        uniforms.uRippleAmp.value[rippleCursor] = amplitude;
        rippleCursor = (rippleCursor + 1) % RIPPLE_SLOTS;
    }

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
        spinner.add(band);
    });

    // Services: glowing data packets race around the two text bands, then
    // spiral down into the orb. Each landing sends a small ripple across the
    // orb's surface (the same ripple system a click uses), so it visibly
    // takes the traffic in — a picture of the real-time work this section
    // sells. Simulated on the CPU (only a few dozen points), so every
    // impact's exact position is known when it's time to ripple. Each band's
    // packets live inside that band's group and inherit its tilt and spin;
    // positions below are in band space, where the band is a ring of radius
    // 1.4 around the y axis.
    const PACKETS_PER_BAND = 5;
    const PACKET_TRAIL = 10;
    const PACKET_RIDE_RADIUS = 1.43;
    const PACKET_LAND_RADIUS = 0.97;

    const packetMaterial = new THREE.ShaderMaterial({
        uniforms: {
            uAlpha: { value: 0 },
            uPixelRatio: { value: renderer.getPixelRatio() },
        },
        vertexShader: `
            attribute float aTrail;
            attribute float aAlpha;
            uniform float uPixelRatio;
            uniform float uAlpha;
            varying float vAlpha;
            varying float vTrail;

            void main() {
                vec4 mv = modelViewMatrix * vec4(position, 1.0);
                gl_Position = projectionMatrix * mv;
                gl_PointSize = mix(17.0, 3.0, aTrail) * uPixelRatio * (6.0 / -mv.z);
                vAlpha = aAlpha * uAlpha;
                vTrail = aTrail;
            }
        `,
        fragmentShader: `
            varying float vAlpha;
            varying float vTrail;

            void main() {
                float core = smoothstep(0.5, 0.0, length(gl_PointCoord - 0.5));
                vec3 color = mix(vec3(0.88, 0.99, 1.0), vec3(0.22, 0.78, 1.0), vTrail);
                gl_FragColor = vec4(color, core * core * vAlpha);
            }
        `,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
    });

    function launchPacket(packet, now) {
        packet.start = now + Math.random() * 1.4;
        packet.theta = Math.random() * Math.PI * 2;
        packet.speed = (Math.random() < 0.5 ? -1 : 1) * (1.1 + Math.random() * 1.1);
        packet.ride = 1.4 + Math.random() * 2.8;
        packet.dive = 0.6;
        packet.lane = (Math.random() * 2 - 1) * 0.11;
    }

    // Where a packet is, `age` seconds after launch: riding the band, then
    // diving in a tightening spiral onto the orb's surface.
    function packetPosition(packet, age, out) {
        if (age <= packet.ride) {
            const theta = packet.theta + packet.speed * age;

            return out.set(PACKET_RIDE_RADIUS * Math.cos(theta), packet.lane, PACKET_RIDE_RADIUS * Math.sin(theta));
        }

        const u = Math.min(1, (age - packet.ride) / packet.dive);
        const radius = PACKET_RIDE_RADIUS + (PACKET_LAND_RADIUS - PACKET_RIDE_RADIUS) * u * u;
        const theta = packet.theta + packet.speed * packet.ride + packet.speed * 1.5 * (age - packet.ride);

        return out.set(radius * Math.cos(theta), packet.lane * (1 - u), radius * Math.sin(theta));
    }

    const packetSystems = bands.map((band) => {
        const count = PACKETS_PER_BAND * PACKET_TRAIL;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(count * 3);
        const alphas = new Float32Array(count);
        const trail = new Float32Array(count);

        for (let i = 0; i < count; i += 1) {
            trail[i] = (i % PACKET_TRAIL) / (PACKET_TRAIL - 1);
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3).setUsage(THREE.DynamicDrawUsage));
        geometry.setAttribute('aAlpha', new THREE.BufferAttribute(alphas, 1).setUsage(THREE.DynamicDrawUsage));
        geometry.setAttribute('aTrail', new THREE.BufferAttribute(trail, 1));

        const points = new THREE.Points(geometry, packetMaterial);
        points.frustumCulled = false;
        points.visible = false;
        band.add(points);

        const packets = Array.from({ length: PACKETS_PER_BAND }, () => {
            const packet = {};
            launchPacket(packet, 0);

            return packet;
        });

        return { band, points, geometry, positions, alphas, packets };
    });

    const packetScratch = new THREE.Vector3();

    function updatePackets(alpha, now) {
        packetMaterial.uniforms.uAlpha.value = alpha;

        packetSystems.forEach((system) => {
            system.points.visible = alpha > 0.01;

            if (!system.points.visible) {
                return;
            }

            system.packets.forEach((packet, p) => {
                let age = now - packet.start;

                if (age > packet.ride + packet.dive) {
                    // Landed: ripple the orb where it touched down (band
                    // space -> world -> the orb mesh's own space), then
                    // relaunch it from somewhere else on a band.
                    if (alpha > 0.5) {
                        packetPosition(packet, packet.ride + packet.dive, packetScratch);
                        system.band.localToWorld(packetScratch);
                        sphereMesh.worldToLocal(packetScratch);
                        triggerRipple(packetScratch.normalize(), 0.45);
                    }

                    launchPacket(packet, now);
                    age = now - packet.start;
                }

                const fadeIn = THREE.MathUtils.clamp(age / 0.3, 0, 1);

                for (let k = 0; k < PACKET_TRAIL; k += 1) {
                    const index = p * PACKET_TRAIL + k;
                    const trailAge = age - k * 0.03;

                    if (trailAge < 0) {
                        system.alphas[index] = 0;
                        continue;
                    }

                    packetPosition(packet, trailAge, packetScratch).toArray(system.positions, index * 3);
                    system.alphas[index] = fadeIn * Math.pow(1 - k / PACKET_TRAIL, 1.5);
                }
            });

            system.geometry.attributes.position.needsUpdate = true;
            system.geometry.attributes.aAlpha.needsUpdate = true;
        });
    }

    // Skills: gyroscope rings — several thin rings at different fixed tilts
    // (not one shared axis), each independently precessing around its own
    // local z, interlocking around a small glowing core. Third design for
    // this section: the first was one solid faceted gem, the second was
    // orbiting discrete shards — this one is deliberately a different
    // *texture* again, wireframe-ish rotating bands rather than solid
    // chunks, closer to an armillary sphere/gyroscope mechanism than an
    // object made of parts. Lit by the real scene lights + environment map.
    const gemCluster = new THREE.Group();
    gemCluster.visible = false;
    spinner.add(gemCluster);

    const gemCoreMaterial = new THREE.MeshStandardMaterial({
        color: new THREE.Color('#bfe9ff'),
        emissive: new THREE.Color('#27c9f2'),
        emissiveIntensity: 1.6,
        transparent: true,
        opacity: 0,
        // Never writes depth: while it's fading, a half-visible core would
        // otherwise hide the swarm particles passing behind it.
        depthWrite: false,
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
        // Pearl with a thin-film (iridescent) coat, matching the orb's
        // family — these were brand blue, which on the permanently blue
        // canvas read as dark navy bands with almost no edge definition,
        // the same visibility problem the orb itself had before its
        // pearl-pink recolour. The cyan core and cyan hover glow stay as
        // the accent.
        const ringMaterial = new THREE.MeshPhysicalMaterial({
            color: new THREE.Color('#f6d9e6'),
            emissive: new THREE.Color('#27c9f2'),
            emissiveIntensity: 0,
            metalness: 0.15,
            roughness: 0.2,
            clearcoat: 1,
            clearcoatRoughness: 0.1,
            iridescence: 0.9,
            iridescenceIOR: 1.35,
            iridescenceThicknessRange: [180, 420],
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
    // Cool pearl (a lilac-white, a step away from the Skills rings' pink so
    // the two sections don't read as the same object) — was #168bff, which
    // sank into the blue canvas as near-black silhouettes.
    const discMaterial = new THREE.MeshPhysicalMaterial({
        color: new THREE.Color('#ece6f7'),
        metalness: 0.12,
        roughness: 0.18,
        clearcoat: 1,
        clearcoatRoughness: 0.08,
        iridescence: 0.8,
        iridescenceIOR: 1.3,
        iridescenceThicknessRange: [220, 480],
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
                    // The idle self-rotation, kept separately so a block can
                    // leave it to become a device tile and come back to it.
                    free: new THREE.Euler(),
                    // How quickly this block follows its target — staggered,
                    // so the blocks arrive one after another, not in lockstep.
                    rate: 3.4 + discs.length * 0.4,
                });
            });
        });
    });
    discGroup.visible = false;
    spinner.add(discGroup);

    // Work: hover a project row and the eight blocks fly together into a
    // device for that project — phone, laptop, monitor or tablet (each row's
    // data-device in home.blade.php) — with its name lit up on the screen.
    // Each block becomes one tile of the device. Layouts are in device space
    // with the screen facing +z; DEVICE_TURN then angles the whole device
    // toward the card on the left.
    const TILE = 0.24;
    const LAPTOP_TILT = -0.24;
    const tile = (x, y, z, w, h, d, tilt = 0) => ({ p: [x, y, z], s: [w, h, d], tilt });

    // A point on the laptop lid, given in the lid's own frame (`up` along
    // the lid from its hinge, `out` off its face), leaned back about the
    // hinge line at the base's rear edge.
    const lid = (x, up, out) => [
        x,
        -0.32 + up * Math.cos(LAPTOP_TILT) - out * Math.sin(LAPTOP_TILT),
        -0.19 + up * Math.sin(LAPTOP_TILT) + out * Math.cos(LAPTOP_TILT),
    ];

    // Each screen floats SCREEN_STANDOFF in front of its tiles' faces. Any
    // closer and the tiles' steep side faces at the seams between them —
    // whose depth multisampling can extrapolate up to half a pixel past
    // their true edge — poked through the screen as thin lines. Still well
    // under 2px of parallax at the angle the devices sit at.
    const SCREEN_STANDOFF = 0.015;

    const DEVICE_LAYOUTS = {
        phone: {
            tiles: [-0.45, -0.15, 0.15, 0.45].flatMap((y) => [-0.15, 0.15].map((x) => tile(x, y, 0, 0.3, 0.3, 0.07))),
            screen: { p: [0, 0, 0.035 + SCREEN_STANDOFF], s: [0.52, 1.08], tilt: 0 },
            canvas: [512, 1024],
        },
        laptop: {
            tiles: [
                ...[-0.05, 0.25].flatMap((z) => [-0.22, 0.22].map((x) => tile(x, -0.34, z, 0.44, 0.035, 0.3))),
                ...[0.145, 0.435].flatMap((up) => [-0.22, 0.22].map((x) => tile(...lid(x, up, 0), 0.44, 0.29, 0.03, LAPTOP_TILT))),
            ],
            screen: { p: lid(0, 0.29, 0.015 + SCREEN_STANDOFF), s: [0.82, 0.52], tilt: LAPTOP_TILT },
            canvas: [1024, 640],
        },
        monitor: {
            tiles: [
                ...[0.02, 0.36].flatMap((y) => [-0.38, 0, 0.38].map((x) => tile(x, y, 0, 0.38, 0.34, 0.05))),
                tile(0, -0.27, -0.03, 0.08, 0.26, 0.05),
                tile(0, -0.415, 0, 0.46, 0.03, 0.26),
            ],
            screen: { p: [0, 0.19, 0.025 + SCREEN_STANDOFF], s: [1.08, 0.62], tilt: 0 },
            canvas: [1024, 600],
        },
        tablet: {
            tiles: [-0.15, 0.15].flatMap((y) => [-0.435, -0.145, 0.145, 0.435].map((x) => tile(x, y, 0, 0.29, 0.3, 0.06))),
            screen: { p: [0, 0, 0.03 + SCREEN_STANDOFF], s: [1.08, 0.52], tilt: 0 },
            canvas: [1024, 512],
        },
    };
    const DEVICE_TURN = new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.04, -0.38, 0));
    // Devices read best a little larger than the block grid they come from.
    const DEVICE_SCALE = 1.3;
    const AXIS_X = new THREE.Vector3(1, 0, 0);
    const AXIS_Y = new THREE.Vector3(0, 1, 0);
    const AXIS_Z = new THREE.Vector3(0, 0, 1);

    const workRows = Array.from(document.querySelectorAll('#work .work-row'));
    let hoveredProject = -1;
    let hoverClearTimer = 0;

    workRows.forEach((row, index) => {
        const enter = () => {
            window.clearTimeout(hoverClearTimer);
            hoveredProject = index;
            // Fetched the moment you touch the row, not when the device
            // finishes assembling — that head start is usually enough for
            // the photo to be ready before the screen first lights up.
            screenshotFor(index);
        };
        // A short grace period, so sliding from one row to the next morphs
        // straight between devices instead of collapsing to the grid between.
        const leave = () => {
            hoverClearTimer = window.setTimeout(() => {
                hoveredProject = -1;
            }, 160);
        };

        row.addEventListener('mouseenter', enter);
        row.addEventListener('mouseleave', leave);
        row.addEventListener('focus', enter);
        row.addEventListener('blur', leave);
    });

    const deviceFor = (index) => DEVICE_LAYOUTS[workRows[index]?.dataset.device] || DEVICE_LAYOUTS.laptop;

    function roundedRect(ctx, x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.arcTo(x + w, y, x + w, y + h, r);
        ctx.arcTo(x + w, y + h, x, y + h, r);
        ctx.arcTo(x, y + h, x, y, r);
        ctx.arcTo(x, y, x + w, y, r);
        ctx.closePath();
    }

    // Word-wraps onto the canvas, ellipsising past maxLines; returns the y
    // just below the last line drawn.
    function wrapText(ctx, text, x, y, maxWidth, lineHeight, maxLines) {
        const lines = [];
        let line = '';

        text.split(/\s+/)
            .filter(Boolean)
            .forEach((word) => {
                const candidate = line ? `${line} ${word}` : word;

                if (line && ctx.measureText(candidate).width > maxWidth) {
                    lines.push(line);
                    line = word;
                } else {
                    line = candidate;
                }
            });

        if (line) {
            lines.push(line);
        }

        const shown = lines.slice(0, maxLines);

        if (lines.length > maxLines) {
            shown[maxLines - 1] = `${shown[maxLines - 1].replace(/[\s,—-]+$/, '')}…`;
        }

        shown.forEach((lineText, i) => ctx.fillText(lineText, x, y + i * lineHeight));

        return y + shown.length * lineHeight;
    }

    // The lit screen for one project: a screenshot of the real site where
    // one exists (data-shot), otherwise a drawn "interface" carrying the
    // project's title and stack. Built once per project and cached.
    const screenTextures = new Map();
    const screenShots = new Map();

    // Screenshots are fetched on first hover rather than upfront — four
    // full-page JPEGs is real weight to put on a homepage that may never
    // show them. Until one arrives the drawn version stands in, and the
    // cached texture is dropped so the next frame rebuilds with the photo.
    function screenshotFor(index) {
        if (screenShots.has(index)) {
            return screenShots.get(index);
        }

        const source = workRows[index]?.dataset.shot;

        if (!source) {
            screenShots.set(index, null);

            return null;
        }

        screenShots.set(index, null);

        const image = new Image();
        image.onload = () => {
            screenShots.set(index, image);
            screenTextures.delete(index);

            // Dropping the cached texture is not enough on its own: the
            // screen is only ever rebuilt while it is invisible, so a photo
            // that arrives after the device has assembled would be ignored
            // until the next hover. Resetting the displayed project forces
            // it back through that path with the photo.
            if (screenProject === index) {
                screenProject = -1;
                screenMaterial.opacity = 0;
            }
        };
        image.onerror = () => console.warn('Project screenshot failed to load, using the drawn screen instead.');
        image.src = source;

        return null;
    }

    // Draws `image` to fill w×h without distorting it (object-fit: cover),
    // anchored to the top so a site's header and hero stay in frame.
    function drawCover(ctx, image, width, height) {
        const scale = Math.max(width / image.width, height / image.height);
        const w = image.width * scale;
        const h = image.height * scale;
        ctx.drawImage(image, (width - w) / 2, 0, w, h);
    }

    function screenTexture(index, layout) {
        if (screenTextures.has(index)) {
            return screenTextures.get(index);
        }

        const row = workRows[index];
        const title = row?.querySelector('h3')?.textContent.trim() || '';
        const stack = row?.querySelector('[title]')?.getAttribute('title') || '';
        const [width, height] = layout.canvas;
        const portrait = height > width;
        const unit = Math.min(width, height);
        const pad = unit * 0.09;

        const screenCanvas = document.createElement('canvas');
        screenCanvas.width = width;
        screenCanvas.height = height;
        const ctx = screenCanvas.getContext('2d');

        const shot = screenshotFor(index);

        if (shot) {
            drawCover(ctx, shot, width, height);

            // A brand-tinted scrim at the foot carrying the project's name,
            // so the device still says which project it is at a glance —
            // a bare screenshot at this size is unreadable.
            const scrim = ctx.createLinearGradient(0, height * 0.55, 0, height);
            scrim.addColorStop(0, 'rgba(6, 20, 56, 0)');
            scrim.addColorStop(1, 'rgba(6, 20, 56, 0.93)');
            ctx.fillStyle = scrim;
            ctx.fillRect(0, height * 0.55, width, height * 0.45);

            ctx.textBaseline = 'alphabetic';
            ctx.font = `500 ${Math.round(unit * 0.036)}px "JetBrains Mono", ui-monospace, monospace`;
            ctx.fillStyle = 'rgba(159, 233, 255, 0.95)';
            ctx.fillText(`CASE STUDY ${String(index + 1).padStart(2, '0')}`, pad, height - pad - unit * 0.17);

            ctx.font = `500 ${Math.round(unit * (portrait ? 0.085 : 0.07))}px "Playfair Display", Georgia, serif`;
            ctx.fillStyle = '#ffffff';
            ctx.textBaseline = 'top';
            wrapText(ctx, title, pad, height - pad - unit * 0.13, width - pad * 2, unit * 0.085, 2);

            const texture = new THREE.CanvasTexture(screenCanvas);
            texture.colorSpace = THREE.SRGBColorSpace;
            texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
            screenTextures.set(index, texture);

            return texture;
        }

        const base = ctx.createLinearGradient(0, 0, width * 0.7, height);
        base.addColorStop(0, '#0a1a4a');
        base.addColorStop(0.55, '#1043b8');
        base.addColorStop(1, '#1f8fe6');
        ctx.fillStyle = base;
        ctx.fillRect(0, 0, width, height);

        const glow = ctx.createRadialGradient(width * 0.85, height * 0.1, 0, width * 0.85, height * 0.1, Math.max(width, height) * 0.7);
        glow.addColorStop(0, 'rgba(39, 201, 242, 0.5)');
        glow.addColorStop(1, 'rgba(39, 201, 242, 0)');
        ctx.fillStyle = glow;
        ctx.fillRect(0, 0, width, height);

        // Window chrome: traffic-light dots, or a phone's speaker slot.
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';

        if (portrait) {
            roundedRect(ctx, width / 2 - unit * 0.12, pad * 0.5, unit * 0.24, unit * 0.035, unit * 0.0175);
            ctx.fill();
        } else {
            [0, 1, 2].forEach((i) => {
                ctx.beginPath();
                ctx.arc(pad + i * unit * 0.05, pad * 0.75, unit * 0.013, 0, Math.PI * 2);
                ctx.fill();
            });
        }

        const top = portrait ? height * 0.2 : height * 0.22;
        ctx.textBaseline = 'top';
        ctx.font = `500 ${Math.round(unit * 0.036)}px "JetBrains Mono", ui-monospace, monospace`;
        ctx.fillStyle = 'rgba(159, 233, 255, 0.95)';
        ctx.fillText(`CASE STUDY ${String(index + 1).padStart(2, '0')}`, pad, top);

        const titleSize = Math.round(unit * (portrait ? 0.11 : 0.09));
        ctx.font = `500 ${titleSize}px "Playfair Display", Georgia, serif`;
        ctx.fillStyle = '#ffffff';
        const afterTitle = wrapText(ctx, title, pad, top + unit * 0.075, width - pad * 2, titleSize * 1.12, portrait ? 4 : 2);

        ctx.font = `500 ${Math.round(unit * 0.034)}px "JetBrains Mono", ui-monospace, monospace`;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.72)';
        wrapText(ctx, stack.toUpperCase(), pad, afterTitle + unit * 0.045, width - pad * 2, unit * 0.055, 2);

        // A suggestion of an interface along the bottom: soft cards.
        const cards = portrait ? 2 : 3;
        const gap = unit * 0.035;
        const cardWidth = (width - pad * 2 - gap * (cards - 1)) / cards;
        const cardHeight = unit * (portrait ? 0.32 : 0.2);

        for (let i = 0; i < cards; i += 1) {
            ctx.fillStyle = i === 0 ? 'rgba(39, 201, 242, 0.28)' : 'rgba(255, 255, 255, 0.1)';
            roundedRect(ctx, pad + i * (cardWidth + gap), height - pad - cardHeight, cardWidth, cardHeight, unit * 0.025);
            ctx.fill();
        }

        const texture = new THREE.CanvasTexture(screenCanvas);
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
        screenTextures.set(index, texture);

        return texture;
    }

    // Drawn last (renderOrder) so the tiles behind it — which don't write
    // depth while fading — can never paint over it. See SCREEN_STANDOFF for
    // why it sits clear of the tile faces rather than flush on them.
    const screenMaterial = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false, toneMapped: false });
    const deviceScreen = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), screenMaterial);
    deviceScreen.renderOrder = 5;
    deviceScreen.visible = false;
    discGroup.add(deviceScreen);
    let screenProject = -1;

    const blockPosition = new THREE.Vector3();
    const blockQuaternion = new THREE.Quaternion();
    const blockScale = new THREE.Vector3();
    const tiltQuaternion = new THREE.Quaternion();
    // Work's waypoint rolls the whole assembly (data-sphere-rot) — invisible
    // on a round orb or a loose cube cloud, but it tipped every device ~30°
    // off upright. Each frame this cancels whatever roll the group carries.
    const levelQuaternion = new THREE.Quaternion();

    function placeOnDevice(spec, bob, outPosition, outQuaternion) {
        outPosition
            .set(spec.p[0], spec.p[1] + bob, spec.p[2])
            .multiplyScalar(DEVICE_SCALE)
            .applyQuaternion(DEVICE_TURN)
            .applyQuaternion(levelQuaternion);
        outQuaternion.copy(levelQuaternion).multiply(DEVICE_TURN).multiply(tiltQuaternion.setFromAxisAngle(AXIS_X, spec.tilt));
    }

    // Per frame: every block eases toward either its idle grid pose or its
    // tile on the active device; the screen swaps texture only while
    // invisible and fades in once every tile has arrived.
    function updateBlocks(deviceProject, raw, delta, time) {
        const layout = deviceProject >= 0 ? deviceFor(deviceProject) : null;
        const bob = Math.sin(time * 0.9) * 0.025;
        levelQuaternion.setFromAxisAngle(AXIS_Z, -sphere.rotation.z);

        // With a device up, ease the formation's slow drift back to a whole
        // turn so the device faces where its layout says; otherwise drift.
        if (layout) {
            const front = Math.round(discGroup.rotation.y / (Math.PI * 2)) * Math.PI * 2;
            discGroup.rotation.y += (front - discGroup.rotation.y) * (1 - Math.exp(-raw * 4));
        } else {
            discGroup.rotation.y += delta * 0.08;
        }

        let gap = 0;

        discs.forEach((d, i) => {
            if (layout) {
                const spec = layout.tiles[i];
                placeOnDevice(spec, bob, blockPosition, blockQuaternion);
                blockScale.set(spec.s[0], spec.s[1], spec.s[2]).multiplyScalar(DEVICE_SCALE / TILE);
            } else {
                d.free.x += delta * d.spinX;
                d.free.y += delta * d.spinY;
                blockPosition.set(d.base.x, d.base.y + Math.sin(time * d.bobSpeed + d.phase) * d.bobHeight, d.base.z);
                blockQuaternion.setFromEuler(d.free);
                blockScale.set(1, 1, 1);
            }

            const follow = 1 - Math.exp(-raw * d.rate);
            d.block.position.lerp(blockPosition, follow);
            d.block.quaternion.slerp(blockQuaternion, follow);
            d.block.scale.lerp(blockScale, follow);
            gap = Math.max(gap, d.block.position.distanceTo(blockPosition));
        });

        const assembled = layout !== null && gap < 0.03;

        if (assembled && screenProject !== deviceProject && screenMaterial.opacity < 0.02) {
            screenMaterial.map = screenTexture(deviceProject, layout);
            screenMaterial.needsUpdate = true;
            screenProject = deviceProject;
        }

        if (screenProject >= 0) {
            const screen = deviceFor(screenProject).screen;
            placeOnDevice(screen, bob, deviceScreen.position, deviceScreen.quaternion);
            deviceScreen.scale.set(screen.s[0] * DEVICE_SCALE, screen.s[1] * DEVICE_SCALE, 1);
        }

        const screenTarget = assembled && screenProject === deviceProject ? discMaterial.opacity : 0;
        const screenRate = screenTarget > screenMaterial.opacity ? 5 : 14;
        screenMaterial.opacity += (screenTarget - screenMaterial.opacity) * (1 - Math.exp(-raw * screenRate));
        deviceScreen.visible = screenMaterial.opacity > 0.01;
    }

    // Finale: the shaikh.labs mark in 3D — the same three polygons as
    // public/images/logo-icon.svg, copied in as plain points (the icon is
    // all straight lines, so no SVG loader or fetch is needed) and extruded
    // with a small bevel for the clearcoat to catch. Centred and ~1.75 units
    // tall; SVG's y axis points down, hence the flip.
    const LOGO_POLYGONS = [
        [[455, 330], [600, 245], [745, 330], [745, 410], [600, 325], [505, 380], [610, 442], [610, 535], [455, 445]],
        [[600, 360], [680, 407], [680, 590], [745, 552], [800, 645], [600, 760], [600, 670], [680, 624], [680, 470], [600, 424]],
        [[600, 670], [745, 585], [800, 675], [600, 790], [455, 705], [455, 620], [600, 705]],
    ];
    const LOGO_SCALE = 1.75 / 545;

    const logoMaterial = new THREE.MeshPhysicalMaterial({
        color: new THREE.Color('#f3ecfb'),
        metalness: 0.25,
        roughness: 0.16,
        clearcoat: 1,
        clearcoatRoughness: 0.08,
        iridescence: 1,
        iridescenceIOR: 1.4,
        iridescenceThicknessRange: [200, 520],
        transparent: true,
        opacity: 0,
        depthWrite: false,
    });

    const logoGroup = new THREE.Group();
    const logoGeometries = LOGO_POLYGONS.map((points, i) => {
        const shape = new THREE.Shape(points.map(([x, y]) => new THREE.Vector2((x - 627.5) * LOGO_SCALE, (517.5 - y) * LOGO_SCALE)));
        const geometry = new THREE.ExtrudeGeometry(shape, {
            depth: 0.16,
            bevelEnabled: true,
            bevelThickness: 0.022,
            bevelSize: 0.012,
            bevelSegments: 3,
            curveSegments: 1,
        });
        // Centred on z, with a hair of separation between the three pieces
        // so where their bevels touch they never z-fight.
        geometry.translate(0, 0, -0.08 + i * 0.002);
        logoGroup.add(new THREE.Mesh(geometry, logoMaterial));

        return geometry;
    });
    logoGroup.visible = false;
    spinner.add(logoGroup);

    // Contact: the orb is revealed as a pearl. A scalloped oyster shell
    // closes around it and opens as the section settles — the one object on
    // the page that explains the orb rather than replacing it, which is why
    // Contact keeps its orb (and its beacon pulse) instead of swapping to
    // something else like Skills and Work do.
    //
    // Built here rather than from a model file: an oyster is a squashed
    // dome with radial ridges, which is a dozen lines of parametric
    // geometry and no download, no loader, no licence to track.
    // Sized to frame a 0.95 orb, not to contain it: a first pass at 1.46 with
    // deep bowls swallowed the pearl entirely and read as two white blobs.
    // The shell wants to be a shallow setting the orb sits proud of.
    const SHELL_RADIUS = 1.32;
    const SHELL_RIDGES = 17;

    function buildShellGeometry(height, ridgeDepth) {
        const rings = 26;
        const radials = 132;
        const positions = [];
        const uvs = [];
        const indices = [];

        for (let i = 0; i <= rings; i += 1) {
            // Biased toward the rim, where the scalloping needs the detail.
            const t = Math.pow(i / rings, 0.85);
            const theta = t * (Math.PI / 2);

            for (let j = 0; j <= radials; j += 1) {
                const phi = (j / radials) * Math.PI * 2;
                // Ridges fade out toward the centre of the shell, the way
                // real growth ridges radiate from the hinge.
                const ridge = 1 + Math.sin(phi * SHELL_RIDGES) * ridgeDepth * t;
                const r = SHELL_RADIUS * Math.sin(theta) * ridge;

                positions.push(r * Math.cos(phi), height * Math.cos(theta), r * Math.sin(phi));
                uvs.push(j / radials, t);

                if (i < rings && j < radials) {
                    const a = i * (radials + 1) + j;
                    const b = a + radials + 1;
                    indices.push(a, b, a + 1, b, b + 1, a + 1);
                }
            }
        }

        const geometry = new THREE.BufferGeometry();
        geometry.setIndex(indices);
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
        geometry.computeVertexNormals();

        return geometry;
    }

    // Outer face is chalky and matte, inner face is nacre — the same split a
    // real shell has, and the reason the opening is worth watching. One
    // geometry rendered twice (front faces outside, back faces inside) gets
    // both without needing two meshes' worth of vertices or a custom shader.
    const shellOuterMaterial = new THREE.MeshPhysicalMaterial({
        color: new THREE.Color('#e6ddd9'),
        metalness: 0.05,
        roughness: 0.66,
        clearcoat: 0.3,
        side: THREE.FrontSide,
        transparent: true,
        opacity: 0,
        depthWrite: false,
    });

    const shellInnerMaterial = new THREE.MeshPhysicalMaterial({
        color: new THREE.Color('#fbeaf2'),
        metalness: 0.3,
        roughness: 0.12,
        clearcoat: 1,
        clearcoatRoughness: 0.06,
        iridescence: 1,
        iridescenceIOR: 1.45,
        iridescenceThicknessRange: [120, 560],
        side: THREE.BackSide,
        transparent: true,
        opacity: 0,
        depthWrite: false,
    });

    const shellMaterials = [shellOuterMaterial, shellInnerMaterial];

    // The lower half is deeper (it cups the pearl), the lid shallower.
    const shellBottomGeometry = buildShellGeometry(-0.42, 0.045);
    const shellTopGeometry = buildShellGeometry(0.3, 0.04);

    const shellGroup = new THREE.Group();
    shellGroup.visible = false;
    spinner.add(shellGroup);

    shellMaterials.forEach((material) => {
        shellGroup.add(new THREE.Mesh(shellBottomGeometry, material));
    });

    // Hinged at the back rim, not at the centre — rotating the lid about its
    // own origin would make it pass straight through the lower shell.
    const shellHinge = new THREE.Object3D();
    shellHinge.position.z = -SHELL_RADIUS;
    shellGroup.add(shellHinge);

    const shellLid = new THREE.Group();
    shellLid.position.z = SHELL_RADIUS;
    shellHinge.add(shellLid);

    shellMaterials.forEach((material) => {
        shellLid.add(new THREE.Mesh(shellTopGeometry, material));
    });

    // Fling burst: throw the orb (or whichever shape is showing) hard enough
    // and it shatters — a cloud of pearl shards bursts outward through depth
    // while the solid shape dissolves, then they collapse back together and
    // it reforms. These shards used to carry every left-right section
    // crossing too; the particle swarm (below) has taken that job over, so
    // a physical shatter is now reserved for the one moment that's
    // physical: you throwing it.
    const fragmentMaterial = new THREE.MeshPhysicalMaterial({
        // The orb's pearl-pink (uColorA) — the orb is what gets thrown most.
        color: new THREE.Color('#e8a0bc'),
        metalness: 0.12,
        roughness: 0.25,
        clearcoat: 1,
        clearcoatRoughness: 0.15,
        // Same thin-film coat as the rings/blocks, so mid-burst the shards
        // flash the orb's nacre colours as they tumble through the light.
        iridescence: 0.7,
        iridescenceIOR: 1.3,
        transparent: true,
        opacity: 0,
        // Same lesson as the gem/discs fade: a near-invisible shard that
        // still writes depth punches a shard-shaped hole straight through
        // whatever draws after it — once seen as blue triangular holes
        // scattered across the resting Contact orb.
        depthWrite: false,
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

    // One swarm, many shapes: every section-to-section transition is a morph
    // carried by a cloud of glowing particles. Each particle has a home on
    // every shape — the orb's surface, the gyroscope's rings, the blocks'
    // faces, the logo — and during a transition it peels off the outgoing
    // shape, bursts out through depth and settles into its place on the
    // incoming one, while the solid shapes dissolve out and back in around
    // it. All motion is in the vertex shader; per frame the CPU only says
    // which two shapes are involved and how far along the morph is.
    // (A much rougher "shapes from fragments" idea was built and reverted
    // early in this project — that one replaced each section's resting
    // object; this one only ever exists between them.)
    const SHAPE = { orb: 0, gyro: 1, blocks: 2, logo: 3, portrait: 4 };
    const SWARM_COUNT = window.innerWidth < 1024 ? 5000 : 14000;

    function randomUnitVector() {
        const z = Math.random() * 2 - 1;
        const angle = Math.random() * Math.PI * 2;
        const r = Math.sqrt(1 - z * z);

        return new THREE.Vector3(r * Math.cos(angle), z, r * Math.sin(angle));
    }

    // A Fibonacci lattice: an even spread over the sphere, no clumps.
    function sampleOrb(count) {
        const golden = Math.PI * (3 - Math.sqrt(5));

        return Array.from({ length: count }, (_, i) => {
            const y = 1 - ((i + 0.5) / count) * 2;
            const r = Math.sqrt(1 - y * y);

            return new THREE.Vector3(Math.cos(golden * i) * r, y, Math.sin(golden * i) * r).multiplyScalar(0.96);
        });
    }

    // Points on the four tilted tori (same radii/tilts as gemRings — their
    // per-frame precession spins each ring about its own axis, which maps
    // the ring onto itself, so it can be ignored), plus a few on the core.
    function sampleGyro(count) {
        const tilt = new THREE.Euler();

        return Array.from({ length: count }, (_, i) => {
            if (i % 16 === 0) {
                return randomUnitVector().multiplyScalar(0.2);
            }

            const ring = Math.floor(Math.random() * GYRO_RING_COUNT);
            const around = Math.random() * Math.PI * 2;
            const tube = Math.random() * Math.PI * 2;
            const radius = 0.66 + ring * 0.03 + 0.028 * Math.cos(tube);
            tilt.set(GYRO_TILTS[ring].x, GYRO_TILTS[ring].y, 0);

            return new THREE.Vector3(radius * Math.cos(around), radius * Math.sin(around), 0.028 * Math.sin(tube)).applyEuler(tilt);
        });
    }

    // Points on the faces of the eight blocks at their grid positions.
    function sampleBlocks(count) {
        const half = TILE / 2;

        return Array.from({ length: count }, (_, i) => {
            const face = Math.floor(Math.random() * 6);
            const point = new THREE.Vector3(
                (Math.random() * 2 - 1) * half,
                (Math.random() * 2 - 1) * half,
                (Math.random() * 2 - 1) * half
            );
            point.setComponent(face >> 1, face & 1 ? half : -half);

            return point.add(discs[i % discs.length].base);
        });
    }

    // Area-weighted random points across the triangles of some geometries
    // (the logo's three extrusions) — what three's MeshSurfaceSampler does,
    // without pulling in another addon for one use.
    function sampleSurface(geometries, count) {
        const a = new THREE.Vector3();
        const b = new THREE.Vector3();
        const c = new THREE.Vector3();
        const edge1 = new THREE.Vector3();
        const edge2 = new THREE.Vector3();
        const triangles = [];
        let total = 0;

        const corners = (triangle) => {
            a.fromBufferAttribute(triangle.position, triangle.i0);
            b.fromBufferAttribute(triangle.position, triangle.i1);
            c.fromBufferAttribute(triangle.position, triangle.i2);
        };

        geometries.forEach((geometry) => {
            const position = geometry.attributes.position;
            const index = geometry.index;
            const triangleCount = (index ? index.count : position.count) / 3;

            for (let t = 0; t < triangleCount; t += 1) {
                const triangle = {
                    position,
                    i0: index ? index.getX(t * 3) : t * 3,
                    i1: index ? index.getX(t * 3 + 1) : t * 3 + 1,
                    i2: index ? index.getX(t * 3 + 2) : t * 3 + 2,
                };
                corners(triangle);
                const area = edge1.subVectors(b, a).cross(edge2.subVectors(c, a)).length() / 2;

                if (area > 0) {
                    total += area;
                    triangle.cumulative = total;
                    triangles.push(triangle);
                }
            }
        });

        return Array.from({ length: count }, () => {
            const pick = Math.random() * total;
            let lo = 0;
            let hi = triangles.length - 1;

            while (lo < hi) {
                const mid = (lo + hi) >> 1;

                if (triangles[mid].cumulative < pick) {
                    lo = mid + 1;
                } else {
                    hi = mid;
                }
            }

            corners(triangles[lo]);
            let u = Math.random();
            let v = Math.random();

            if (u + v > 1) {
                u = 1 - u;
                v = 1 - v;
            }

            return a.clone().addScaledVector(edge1.subVectors(b, a), u).addScaledVector(edge2.subVectors(c, a), v);
        });
    }

    // One fixed shuffle applied to every shape after its flow sort. The
    // adaptive quality system (below) thins the swarm with setDrawRange,
    // which can only ever draw a *contiguous* prefix — and a prefix of
    // flow-sorted points is the bottom of the shape, not a sample of it.
    // Shuffling first makes any prefix a representative scatter of the
    // whole form. Shared across all shapes, so particle i still corresponds
    // to the same place on each and morphs stay coherent.
    const SWARM_SHUFFLE = Array.from({ length: SWARM_COUNT }, (_, i) => i);

    for (let i = SWARM_SHUFFLE.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [SWARM_SHUFFLE[i], SWARM_SHUFFLE[j]] = [SWARM_SHUFFLE[j], SWARM_SHUFFLE[i]];
    }

    // Every shape's points sorted the same way — by height band, then by
    // bearing around the vertical axis — so particle i sits at roughly the
    // same height and bearing on every shape. A morph then reads as one
    // coherent flow instead of thousands of particles crossing at random.
    function flowOrder(points) {
        const sorted = points
            .map((p) => ({ p, key: Math.round((p.y + 2) * 6) * 10 + Math.atan2(p.z, p.x) + Math.PI }))
            .sort((x, y) => x.key - y.key)
            .map((entry) => entry.p);

        return SWARM_SHUFFLE.map((i) => sorted[i]);
    }

    function toAttribute(points) {
        const array = new Float32Array(points.length * 3);
        points.forEach((p, i) => p.toArray(array, i * 3));

        return new THREE.BufferAttribute(array, 3);
    }

    const swarmGeometry = new THREE.BufferGeometry();
    // The orb doubles as `position` (three needs one to know the draw count).
    swarmGeometry.setAttribute('position', toAttribute(flowOrder(sampleOrb(SWARM_COUNT))));
    swarmGeometry.setAttribute('aGyro', toAttribute(flowOrder(sampleGyro(SWARM_COUNT))));
    swarmGeometry.setAttribute('aBlocks', toAttribute(flowOrder(sampleBlocks(SWARM_COUNT))));
    swarmGeometry.setAttribute('aLogo', toAttribute(flowOrder(sampleSurface(logoGeometries, SWARM_COUNT))));

    // The portrait starts as a copy of the orb and a flat brightness, so if
    // no photo is present the shape simply never differs from the orb and
    // nothing can look broken. loadPortrait() overwrites both in place once
    // an image actually decodes.
    const portraitPositions = swarmGeometry.attributes.position.array.slice();
    const portraitLuma = new Float32Array(SWARM_COUNT).fill(1);
    swarmGeometry.setAttribute('aPortrait', new THREE.BufferAttribute(portraitPositions, 3));
    swarmGeometry.setAttribute('aPortraitLuma', new THREE.BufferAttribute(portraitLuma, 1));

    let portraitReady = false;

    // About's "particle portrait": the swarm briefly resolves into a relief
    // of a real photograph, then dissolves back into the orb. Depth comes
    // from luminance (a bas-relief, not a true 3D scan) and brightness is
    // carried per particle, so a dark or plain background falls away on its
    // own and the lit subject is what stays — which is why this works from
    // one ordinary photo instead of needing a model.
    //
    // Drop a file at public/images/portrait.(jpg|png|webp) to switch it on.
    // Best results: head and shoulders, well lit, plain dark background.
    // The layout resolves which (if any) exists and passes it as
    // data-portrait, so nothing is requested speculatively.
    function loadPortrait(source) {
        const image = new Image();

        image.onerror = () => console.warn('Portrait image could not be loaded, skipping the effect.');
        image.onload = () => {
            try {
                buildPortrait(image);
                portraitReady = true;
            } catch (error) {
                // Most likely a cross-origin image tainting the canvas —
                // the effect is optional, so it just stays off.
                console.error('Portrait sampling failed, skipping the effect:', error);
            }
        };

        image.src = source;
    }

    function buildPortrait(image) {
        const aspect = image.width / Math.max(1, image.height);
        // A grid whose cell count lands near the swarm size, at the photo's
        // own aspect, so every particle gets its own pixel to stand on.
        const columns = Math.max(2, Math.round(Math.sqrt(SWARM_COUNT * aspect)));
        const rows = Math.max(2, Math.round(SWARM_COUNT / columns));

        const sampleCanvas = document.createElement('canvas');
        sampleCanvas.width = columns;
        sampleCanvas.height = rows;

        const ctx = sampleCanvas.getContext('2d', { willReadFrequently: true });
        ctx.drawImage(image, 0, 0, columns, rows);
        const pixels = ctx.getImageData(0, 0, columns, rows).data;

        const height = 2.45;
        const width = height * aspect;
        const points = [];
        const luma = [];

        for (let i = 0; i < SWARM_COUNT; i += 1) {
            const cell = i % (columns * rows);
            const cx = cell % columns;
            const cy = Math.floor(cell / columns);
            const p = cell * 4;
            const l = (pixels[p] * 0.299 + pixels[p + 1] * 0.587 + pixels[p + 2] * 0.114) / 255;

            points.push(
                new THREE.Vector3(
                    (cx / (columns - 1) - 0.5) * width,
                    (0.5 - cy / (rows - 1)) * height,
                    (l - 0.45) * 0.55
                )
            );
            luma.push(l);
        }

        // Sorted the same way as every other shape — including the shared
        // shuffle, without which this shape alone would be mismatched
        // against the rest and thinned to its bottom edge at low quality.
        const sorted = points
            .map((p, i) => ({ p, l: luma[i], key: Math.round((p.y + 2) * 6) * 10 + Math.atan2(p.z, p.x) + Math.PI }))
            .sort((a, b) => a.key - b.key);
        const order = SWARM_SHUFFLE.map((i) => sorted[i]);

        order.forEach((entry, i) => {
            entry.p.toArray(portraitPositions, i * 3);
            // Lifted off zero so even the darkest particles stay faintly
            // present — a hard cut to invisible reads as missing data.
            portraitLuma[i] = 0.12 + Math.pow(entry.l, 1.35) * 0.88;
        });

        swarmGeometry.attributes.aPortrait.needsUpdate = true;
        swarmGeometry.attributes.aPortraitLuma.needsUpdate = true;
    }

    if (canvas.dataset.portrait) {
        loadPortrait(canvas.dataset.portrait);
    }

    const swarmBursts = new Float32Array(SWARM_COUNT * 3);
    // x: start delay, y: burst strength, z: size (top 10% become cyan
    // sparks), w: swirl/twinkle phase (and which formation it joins the
    // finale from).
    const swarmSeeds = new Float32Array(SWARM_COUNT * 4);

    for (let i = 0; i < SWARM_COUNT; i += 1) {
        randomExplodeDir().toArray(swarmBursts, i * 3);

        for (let k = 0; k < 4; k += 1) {
            swarmSeeds[i * 4 + k] = Math.random();
        }
    }

    swarmGeometry.setAttribute('aBurst', new THREE.BufferAttribute(swarmBursts, 3));
    swarmGeometry.setAttribute('aSeed', new THREE.BufferAttribute(swarmSeeds, 4));

    const swarmUniforms = {
        uTime: uniforms.uTime,
        uMorph: { value: 0 },
        uShapeA: { value: SHAPE.orb },
        uShapeB: { value: SHAPE.orb },
        uRotA: { value: 0 },
        uRotB: { value: 0 },
        uSpread: { value: 1 },
        uAlpha: { value: 0 },
        uPixelRatio: { value: renderer.getPixelRatio() },
    };

    const swarm = new THREE.Points(
        swarmGeometry,
        new THREE.ShaderMaterial({
            uniforms: swarmUniforms,
            vertexShader: `
                attribute vec3 aGyro;
                attribute vec3 aBlocks;
                attribute vec3 aLogo;
                attribute vec3 aPortrait;
                attribute float aPortraitLuma;
                attribute vec3 aBurst;
                attribute vec4 aSeed;
                uniform float uTime;
                uniform float uMorph;
                uniform float uShapeA;
                uniform float uShapeB;
                uniform float uRotA;
                uniform float uRotB;
                uniform float uSpread;
                uniform float uPixelRatio;
                varying float vFlight;
                varying float vSpark;
                varying float vTwinkle;
                varying float vLuma;

                vec3 shapePosition(float id) {
                    if (id < 0.5) return position;
                    if (id < 1.5) return aGyro;
                    if (id < 2.5) return aBlocks;
                    if (id < 3.5) return aLogo;
                    return aPortrait;
                }

                float isPortrait(float id) {
                    return step(3.5, id);
                }

                vec3 rotateY(vec3 p, float angle) {
                    float c = cos(angle);
                    float s = sin(angle);
                    return vec3(c * p.x + s * p.z, p.y, -s * p.x + c * p.z);
                }

                void main() {
                    vec3 from = rotateY(shapePosition(uShapeA), uRotA);
                    vec3 to = rotateY(shapePosition(uShapeB), uRotB);

                    // The finale isn't built from the orb alone: a third of
                    // the swarm streams in as the Skills gyroscope from the
                    // upper left, a third as the Work blocks from the lower
                    // right, so every shape from the journey flies together
                    // into the mark.
                    if (uShapeB > 2.5 && uShapeA < 0.5) {
                        if (aSeed.w < 0.3) {
                            from = aGyro * 0.9 + vec3(-3.6, 1.5, -1.8);
                        } else if (aSeed.w < 0.6) {
                            from = aBlocks + vec3(3.6, -1.3, -1.8);
                        }
                    }

                    // Each particle travels inside its own window of the
                    // morph, so the swarm peels off the old shape and settles
                    // onto the new one in a ripple, not all at once.
                    float t = clamp((uMorph - aSeed.x * 0.3) / 0.7, 0.0, 1.0);
                    float e = t * t * (3.0 - 2.0 * t);
                    float flight = sin(3.14159265 * e);

                    vec3 p = mix(from, to, e);
                    p += aBurst * flight * (0.45 + aSeed.y * 1.25) * uSpread;
                    p = rotateY(p, flight * (aSeed.w - 0.5) * 2.2);

                    vec4 mv = modelViewMatrix * vec4(p, 1.0);
                    gl_Position = projectionMatrix * mv;
                    gl_PointSize = (1.3 + aSeed.z * 2.4) * (1.0 + flight * 0.7) * uPixelRatio * (6.0 / -mv.z);

                    vFlight = flight;
                    vSpark = step(0.9, aSeed.z);
                    vTwinkle = 0.65 + 0.35 * sin(uTime * 4.0 + aSeed.w * 40.0);
                    // Carries the photograph's own light: only in play while
                    // the portrait is part of the blend, so every other morph
                    // is unaffected.
                    vLuma = mix(1.0, aPortraitLuma, mix(isPortrait(uShapeA), isPortrait(uShapeB), e));
                }
            `,
            fragmentShader: `
                uniform float uAlpha;
                varying float vFlight;
                varying float vSpark;
                varying float vTwinkle;
                varying float vLuma;

                void main() {
                    float core = smoothstep(0.5, 0.0, length(gl_PointCoord - 0.5));
                    vec3 tint = mix(vec3(1.0, 0.82, 0.91), vec3(0.62, 0.92, 1.0), vSpark);
                    vec3 color = mix(tint, vec3(1.0), core * 0.55);
                    gl_FragColor = vec4(color, core * core * uAlpha * vLuma * mix(1.0, vTwinkle, vFlight));
                }
            `,
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
        })
    );
    // Positions are computed in the shader; the CPU bounding sphere (the
    // orb's) would cull the swarm mid-burst.
    swarm.frustumCulled = false;
    swarm.visible = false;
    spinner.add(swarm);

    scene.add(sphere);

    // Ground contact. There is no literal floor in this scene, and a plane
    // laid flat would be edge-on to a camera that looks straight down -z —
    // invisible. So the floor is implied instead: a soft ellipse that sits
    // at a fixed height below whatever the orb is doing, spreading and
    // fading as the orb rises through a crossing and tightening as it
    // settles. That one cue is what stops the shapes reading as stickers
    // floating on a flat backdrop. A ring of light then pulses outward each
    // time the orb arrives somewhere, so landings land.
    const FLOOR_Y = -1.5;

    const groundMaterial = new THREE.ShaderMaterial({
        uniforms: { uAlpha: { value: 0 }, uRing: { value: 0 } },
        vertexShader: `
            varying vec2 vUv;
            void main() {
                vUv = uv;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: `
            uniform float uAlpha;
            uniform float uRing;
            varying vec2 vUv;

            void main() {
                float d = length(vUv - 0.5) * 2.0;
                // Soft-edged core, plus a thin expanding ring on landing.
                // A tight falloff read as a hard dirty smudge rather than a
                // shadow, so this stays broad and very diffuse.
                float core = pow(1.0 - clamp(d, 0.0, 1.0), 1.35);
                float ring = smoothstep(0.1, 0.0, abs(d - uRing)) * (1.0 - uRing);
                vec3 color = mix(vec3(0.03, 0.11, 0.3), vec3(0.55, 0.88, 1.0), ring);
                gl_FragColor = vec4(color, (core * uAlpha + ring * 0.42) * clamp(1.0 - d, 0.0, 1.0));
            }
        `,
        transparent: true,
        depthWrite: false,
    });

    const groundMesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), groundMaterial);
    groundMesh.visible = false;
    scene.add(groundMesh);

    // 0 right as the orb lands, easing to 1 as the ring finishes expanding.
    let landingRing = 1;
    // True while the swarm is carrying a transition, so the moment it clears
    // can be read as an arrival.
    let settling = false;

    // Light-dust: a few hundred soft specks spread through a deep volume
    // (z -6..2) around the orb, so the blue world past the curtain reads as a
    // space with depth rather than a flat coloured backdrop. Everything that
    // moves them happens in the vertex shader — scroll parallax (nearer specks
    // travel further per pixel scrolled, wrapped in a 9-unit band so they
    // never run out), a slow idle drift, and a pointer offset scaled by depth —
    // so the CPU only updates four uniforms a frame. A cubed size distribution
    // keeps most specks pin-sharp and lets a rare few swell into soft, dim
    // bokeh, which is what sells the depth of field. Additive blending means
    // they simply vanish against the pale hero, and they're also gated on
    // `dustPresence` so they only exist once the page has gone blue.
    const DUST_COUNT = window.innerWidth < 1024 ? 260 : 720;
    const dustPositions = new Float32Array(DUST_COUNT * 3);
    const dustSeeds = new Float32Array(DUST_COUNT * 2);

    for (let i = 0; i < DUST_COUNT; i += 1) {
        dustPositions[i * 3] = (Math.random() * 2 - 1) * 7.5;
        dustPositions[i * 3 + 1] = (Math.random() * 2 - 1) * 4.5;
        dustPositions[i * 3 + 2] = -6 + Math.random() * 8;
        dustSeeds[i * 2] = Math.random();
        dustSeeds[i * 2 + 1] = Math.random();
    }

    const dustGeometry = new THREE.BufferGeometry();
    dustGeometry.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3));
    dustGeometry.setAttribute('aSeed', new THREE.BufferAttribute(dustSeeds, 2));

    const dustUniforms = {
        uTime: uniforms.uTime,
        uScroll: { value: 0 },
        uPointer: { value: new THREE.Vector2() },
        uAlpha: { value: 0 },
        uPixelRatio: { value: renderer.getPixelRatio() },
    };

    const dust = new THREE.Points(
        dustGeometry,
        new THREE.ShaderMaterial({
            uniforms: dustUniforms,
            vertexShader: `
                attribute vec2 aSeed;
                uniform float uTime;
                uniform float uScroll;
                uniform vec2 uPointer;
                uniform float uPixelRatio;
                varying float vTwinkle;
                varying float vDepth;
                varying float vBokeh;

                void main() {
                    vec3 p = position;
                    float depth = clamp((p.z + 6.0) / 8.0, 0.0, 1.0);

                    p.y = mod(p.y + 4.5 + uScroll * (0.25 + depth * 0.95) + uTime * 0.035 * (0.4 + aSeed.y), 9.0) - 4.5;
                    p.x += sin(uTime * 0.18 + aSeed.y * 6.2831) * 0.14;
                    p.xy += uPointer * (0.06 + depth * 0.32);

                    vec4 mv = modelViewMatrix * vec4(p, 1.0);
                    gl_Position = projectionMatrix * mv;

                    vBokeh = pow(aSeed.x, 3.0);
                    gl_PointSize = (1.6 + vBokeh * 11.0) * uPixelRatio * (6.0 / -mv.z);
                    vTwinkle = 0.6 + 0.4 * sin(uTime * (0.7 + aSeed.y * 1.3) + aSeed.y * 40.0);
                    vDepth = depth;
                }
            `,
            fragmentShader: `
                uniform float uAlpha;
                varying float vTwinkle;
                varying float vDepth;
                varying float vBokeh;

                void main() {
                    float d = length(gl_PointCoord - 0.5);
                    float soft = smoothstep(0.5, 0.0, d);
                    vec3 tint = mix(vec3(0.72, 0.87, 1.0), vec3(1.0, 0.86, 0.94), vDepth);
                    float alpha = soft * soft * vTwinkle * (0.3 + vDepth * 0.55) * mix(1.0, 0.32, vBokeh);
                    gl_FragColor = vec4(tint, alpha * uAlpha);
                }
            `,
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
        })
    );
    // Positions are rewritten in the shader, so the CPU-side bounding sphere
    // is meaningless — never let three.js cull the whole field by it.
    dust.frustumCulled = false;
    dust.visible = false;
    scene.add(dust);

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

    // The portrait plays once, the first time About has properly settled.
    // Timed rather than scrubbed: it's a moment the page performs for you,
    // and tying it to scroll position would let you scrub the face back and
    // forth, which turns a reveal into a toy.
    let portraitStart = -1;
    let portraitDone = false;

    // Seconds, cumulative: dissolve the orb, form the face, hold it, return.
    const PORTRAIT_DISSOLVE = 0.45;
    const PORTRAIT_FORM = 2.0;
    const PORTRAIT_HOLD = 3.6;
    const PORTRAIT_RETURN = 5.1;
    const PORTRAIT_END = 5.55;

    function portraitState(t) {
        if (t < 0 || t > PORTRAIT_END) {
            return null;
        }

        const presence =
            t < PORTRAIT_DISSOLVE
                ? THREE.MathUtils.smoothstep(t, 0, PORTRAIT_DISSOLVE)
                : 1 - THREE.MathUtils.smoothstep(t, PORTRAIT_RETURN, PORTRAIT_END);

        let blend = 1;

        if (t < PORTRAIT_FORM) {
            blend = THREE.MathUtils.smoothstep(t, PORTRAIT_DISSOLVE, PORTRAIT_FORM);
        } else if (t > PORTRAIT_HOLD) {
            blend = 1 - THREE.MathUtils.smoothstep(t, PORTRAIT_HOLD, PORTRAIT_RETURN);
        }

        return { presence, blend };
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
    // How present the blue world's floating light-dust is — 0 over the pale
    // hero, rising with the orb's own re-emergence once the curtain settles.
    let dustPresence = 0;
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
            // The orb's refraction rebuilds this same gradient, so it needs
            // the same origin the curtain is drawn from.
            uniforms.uBgOrigin.value.set(projectedPos.x * 0.5 + 0.5, 1 - (projectedPos.y * 0.5 + 0.5));
        };

        // A fixed 700px of scroll, wherever it happens to start relative to
        // About — "scrolling a bit" shouldn't depend on how far down the
        // page About sits, and once covering, nothing here depends on
        // Services' or any other section's position either, since the
        // curtain never needs to react to anything again after settling.
        // Was 900px with the orb's return spread across the whole second
        // half — which meant that with About centred on screen (the moment
        // you'd actually read it) the orb was still only ~50% re-emerged,
        // reading as a washed-out lavender ghost. Shorter, with the return
        // finishing by 85%, puts it fully back before About is centred.
        const applyCurtain = (p) => {
            // First half: grow + dissolve the orb out. Second half: hold
            // fully covered, re-emerge the orb. opacity/clip-path/
            // background are only ever touched by growP, and growP is
            // permanently clamped at 1 once p passes 0.5 (scrub progress
            // itself holds at 1 past this trigger's end too) — so the
            // curtain's visible state, once settled, truly never changes
            // again for the rest of the scrollable page.
            const growP = Math.min(1, p / 0.5);
            const reappearP = Math.max(0, Math.min(1, (p - 0.5) / 0.35));

            if (growP > 0 && !originCaptured) {
                captureWipeOrigin();
                originCaptured = true;
            } else if (growP <= 0) {
                originCaptured = false;
            }

            heroWipeDissolve = Math.max(0, growP - reappearP);
            dustPresence = reappearP;
            // What the orb refracts: pale hero wash below, blue curtain above.
            uniforms.uBgBlue.value = growP;
            // Lets the fixed UI chrome (chapter rail, caption, card edges)
            // switch to light-on-blue styling the moment the canvas turns
            // blue — slate-on-blue was close to invisible.
            document.documentElement.classList.toggle('is-blue', growP >= 1);
            wipeEl.style.zIndex = growP >= 1 ? '-1' : '50';
            wipeEl.style.clipPath = `circle(${(growP * 80).toFixed(2)}vmax at ${wipeOriginX} ${wipeOriginY})`;
            wipeEl.style.opacity = growP.toFixed(3);
            wipeEl.style.background = `radial-gradient(circle at ${wipeOriginX} ${wipeOriginY}, #1557e8 0%, #168bff 60%, #27c9f2 100%)`;
        };

        // GSAP fires onUpdate synchronously once at ScrollTrigger.create()
        // time, before fonts/layout/the hero's own intro animation have
        // necessarily settled — that premature call can measure a small
        // non-zero progress (observed: ~0.07) even though the real scroll
        // position is 0, and since nothing re-fires onUpdate until the user
        // actually scrolls, that faint leftover circle just sits there at
        // idle forever. Forcing progress to 0 whenever the real scroll
        // position is 0 sidesteps the quirk entirely — idle is idle,
        // regardless of what GSAP measured before the page had settled.
        const realProgress = (self) => (window.scrollY > 0 ? self.progress : 0);

        const curtain = ScrollTrigger.create({
            trigger: '#about',
            start: 'top 95%',
            end: '+=700',
            scrub: true,
            onUpdate: (self) => {
                // A global ScrollTrigger.refresh() (window resize, the
                // fonts-ready refresh, a Services accordion toggle) scrolls
                // the page to 0 mid-way to re-measure, updates triggers while
                // it's there, then restores the scroll — and since progress
                // ends where it started, onUpdate never fires again. The
                // scrollY gate above read that transient 0 as "idle" and left
                // the whole blue world switched off. Ignore updates during a
                // refresh; the 'refresh' listener below re-applies the real
                // state once scroll is back where it belongs.
                if (ScrollTrigger.isRefreshing) {
                    return;
                }

                applyCurtain(realProgress(self));
            },
        });

        ScrollTrigger.addEventListener('refresh', () => applyCurtain(realProgress(curtain)));
    }

    const intro = { y: -3.4, scale: 0.72, rotZ: -0.5, opacity: 0 };

    // Cursor-reactive drift, hero-only: the orb is otherwise static until
    // you scroll, so this is what gives the first screen something to
    // discover immediately. Strength fades to zero as the hero scrolls out
    // of view, via heroPresence below, so it never fights the scroll-driven
    // pose used by every other section.
    const pointerTarget = { x: 0, y: 0 };
    const pointerCurrent = { x: 0, y: 0 };
    // Raw client position too, for hit-testing the orb — pointerTarget is
    // normalised to the whole window, but the canvas starts 5rem in from the
    // left on desktop (it clears the sidebar rail), so a ray cast from
    // window-normalised coordinates would land ~40px off target.
    const pointerClient = { x: 0, y: 0, active: false };
    const coarsePointer = window.matchMedia('(pointer: coarse)').matches;

    if (!coarsePointer) {
        window.addEventListener('mousemove', (event) => {
            pointerTarget.x = (event.clientX / window.innerWidth) * 2 - 1;
            pointerTarget.y = (event.clientY / window.innerHeight) * 2 - 1;
            pointerClient.x = event.clientX;
            pointerClient.y = event.clientY;
            pointerClient.active = true;
        });
        document.addEventListener('mouseleave', () => {
            pointerClient.active = false;
        });
    }

    // Device tilt, as the touch counterpart to cursor drift: tipping the
    // phone leans the shape, so phones get the same "it reacts to me"
    // discovery that a mouse gets for free. Feeds the same pointerTarget the
    // cursor does, so it inherits the existing damping and hero fade.
    let tiltRequested = false;

    function startTilt() {
        window.addEventListener('deviceorientation', (event) => {
            if (event.gamma === null || event.beta === null) {
                return;
            }

            // gamma is left/right tilt, beta front/back. Clamped to a gentle
            // range: a full 90deg would fling the shape off screen, and
            // people hold phones at maybe 40deg from flat anyway.
            pointerTarget.x = THREE.MathUtils.clamp(event.gamma / 35, -1, 1);
            pointerTarget.y = THREE.MathUtils.clamp((event.beta - 45) / 35, -1, 1);
        });
    }

    function requestTilt() {
        if (tiltRequested || !window.DeviceOrientationEvent) {
            return;
        }

        tiltRequested = true;

        // iOS requires an explicit grant from inside a user gesture;
        // everywhere else the event just works.
        if (typeof window.DeviceOrientationEvent.requestPermission === 'function') {
            window.DeviceOrientationEvent.requestPermission()
                .then((state) => state === 'granted' && startTilt())
                .catch(() => {});

            return;
        }

        startTilt();
    }

    if (coarsePointer) {
        requestTilt();
    }

    // Touching the orb: hovering presses a soft dent into the surface right
    // under the cursor (and livens it up a little overall); a click sends a
    // splash ripple out from that point; dragging grabs it and spins it, and
    // letting go mid-swing leaves it spinning until it settles back. Throw it
    // hard enough and it shatters and reforms. Works on whichever shape is
    // showing (the dent and splash are the orb's alone — the gyroscope,
    // blocks and logo are rigid, so a click gives them a spin instead).
    // Hit-tested with a ray-vs-bounding-sphere check each frame rather than
    // on mousemove, so it also responds when scrolling carries the shape
    // under a stationary cursor. Touch gets the same drag, fling and tap
    // (hit-tested on contact instead, since a finger has no hover) now that
    // the shape has its own space on phones rather than hiding behind copy.
    const orbRaycaster = new THREE.Raycaster();
    const orbNdc = new THREE.Vector2();
    const orbBounds = new THREE.Sphere();
    const orbHit = new THREE.Vector3();
    const orbHitLocal = new THREE.Vector3(0, 0, 1);
    const cursorRing = document.getElementById('cursor-ring');
    const cursorLabel = document.getElementById('cursor-ring-label');
    let orbHover = 0;
    let orbHovered = false;
    let orbIsShowing = true;
    // How present whatever shape is showing actually is — written each
    // frame, read by the hit test so neither a mid-morph swarm nor the
    // covering curtain can be grabbed.
    let solidPresence = 1;

    const SPIN_PER_PX = 0.008;
    // Release speed (rad/s) above which a throw shatters the shape. An
    // unhurried spin releases at ~5-12; a real flick at 30+.
    const FLING_SPEED = 18;
    const spinVelocity = new THREE.Vector2();
    const spinStep = new THREE.Quaternion();
    const IDENTITY = new THREE.Quaternion();
    // Where the shape drifts back to between interactions. Starts at
    // identity and keeps a fraction of wherever you last left it, so your
    // handling persists through the rest of the page.
    const restQuaternion = new THREE.Quaternion();
    // About 34 degrees: a lean you can clearly see, never a reorientation.
    const MAX_REST_DRIFT = 0.6;
    const drag = { active: false, moved: 0, x: 0, y: 0, time: 0 };
    let burstStart = -1;

    // Turn the spinner about the (near enough camera-aligned) x and y axes —
    // a vertical drag tips it, a horizontal one turns it.
    function applySpin(aboutX, aboutY) {
        spinner.quaternion.premultiply(spinStep.setFromAxisAngle(AXIS_Y, aboutY));
        spinner.quaternion.premultiply(spinStep.setFromAxisAngle(AXIS_X, aboutX));
    }

    // 0 -> 1 -> 0 over ~1.9s: a fast shatter, a beat held apart, then a
    // slower pull back together.
    function burstAmountAt(clockNow) {
        if (burstStart < 0) {
            return 0;
        }

        const t = clockNow - burstStart;

        if (t < 0.3) {
            return 1 - (1 - t / 0.3) ** 3;
        }

        if (t < 0.5) {
            return 1;
        }

        if (t < 1.9) {
            const k = (t - 0.5) / 1.4;

            return 1 - k * k * (3 - 2 * k);
        }

        burstStart = -1;

        return 0;
    }

    // Hit-tests the shape directly at a screen point. Touch has no hover, so
    // a finger has to find out on contact what a mouse knows from hovering.
    function pointerHitsOrb(clientX, clientY) {
        if (solidPresence < 0.6) {
            return false;
        }

        orbNdc.set(
            ((clientX - canvasRect.left) / canvasRect.width) * 2 - 1,
            -((clientY - canvasRect.top) / canvasRect.height) * 2 + 1
        );
        orbRaycaster.setFromCamera(orbNdc, camera);
        sphere.getWorldPosition(orbBounds.center);
        // A more forgiving radius on touch: a fingertip is far less precise
        // than a cursor, and a miss feels like the page is broken.
        orbBounds.radius = (coarsePointer ? 1.35 : 1.02) * sphere.scale.x;

        return orbRaycaster.ray.intersectsSphere(orbBounds);
    }

    {
        window.addEventListener('pointerdown', (event) => {
            if (event.button !== 0 || event.target.closest('a, button, input, textarea, select, summary, label, [tabindex]')) {
                return;
            }

            // Mouse: trust the hover state the loop already tracks. Touch:
            // test this exact contact point.
            if (!(coarsePointer ? pointerHitsOrb(event.clientX, event.clientY) : orbHovered)) {
                return;
            }

            // iOS gates device orientation behind a user gesture, so this
            // first deliberate touch of the orb is the only honest moment to
            // ask. Nothing is requested on devices that don't gate it.
            requestTilt();

            Object.assign(drag, { active: true, moved: 0, x: event.clientX, y: event.clientY, time: performance.now() });
            spinVelocity.set(0, 0);
            // Added before the browser's own mousedown handling runs, so its
            // user-select: none (app.css) is what stops a drag from selecting
            // text. Deliberately no preventDefault() here: on pointerdown that
            // also suppresses every mousemove until release, which froze the
            // custom cursor ring in place mid-drag.
            document.documentElement.classList.add('is-dragging-orb');
            cursorRing?.classList.add('is-grabbing');
        });

        window.addEventListener('pointermove', (event) => {
            if (!drag.active) {
                return;
            }

            const now = performance.now();
            const seconds = Math.max(8, now - drag.time) / 1000;
            const dx = event.clientX - drag.x;
            const dy = event.clientY - drag.y;

            drag.moved += Math.abs(dx) + Math.abs(dy);
            applySpin(dy * SPIN_PER_PX, dx * SPIN_PER_PX);
            spinVelocity.x += ((dy * SPIN_PER_PX) / seconds - spinVelocity.x) * 0.45;
            spinVelocity.y += ((dx * SPIN_PER_PX) / seconds - spinVelocity.y) * 0.45;
            Object.assign(drag, { x: event.clientX, y: event.clientY, time: now });
        });

        const release = () => {
            if (!drag.active) {
                return;
            }

            drag.active = false;
            document.documentElement.classList.remove('is-dragging-orb');
            cursorRing?.classList.remove('is-grabbing');

            // Barely moved: that was a click, not a drag.
            if (drag.moved < 6) {
                if (orbIsShowing) {
                    spinVelocity.set(0, 0);
                    triggerRipple(orbHitLocal, 1.6);
                } else {
                    spinVelocity.set(0, 4);
                }

                return;
            }

            // The pointer stopped before letting go — that's a placement,
            // not a throw. (A deliberate pause is 150ms+; a slow frame on a
            // busy device can already put 80-100ms between the last move
            // and the release, so the cut-off can't be much tighter.)
            if (performance.now() - drag.time > 150) {
                spinVelocity.multiplyScalar(0.15);
            }

            if (spinVelocity.length() > FLING_SPEED && burstStart < 0) {
                burstStart = uniforms.uClock.value;
                spinVelocity.multiplyScalar(0.35);
            }

            // Remember roughly a third of where this left it, so the shape
            // visibly carries your handling for the rest of the scroll.
            restQuaternion.slerp(spinner.quaternion, 0.34);

            // Then cap the total drift. Each release moves the resting pose
            // a third of the way toward the current one, which compounds —
            // enough drags and the logo would spend the finale facing
            // backwards. This holds the memory to a visible lean.
            const drift = restQuaternion.angleTo(IDENTITY);

            if (drift > MAX_REST_DRIFT) {
                restQuaternion.slerp(IDENTITY, 1 - MAX_REST_DRIFT / drift);
            }
        };

        window.addEventListener('pointerup', release);
        window.addEventListener('pointercancel', release);
    }

    // `logo` and `morph` are new keys: `logo` drives the finale's mark the
    // way gem/discs drive Skills/Work, and `morph` is simply each waypoint's
    // index — interpolated by the same generic lerp as everything else, so
    // its integer part says which two waypoints the page is between and its
    // fraction how far the swarm morph has got.
    const scrollTarget = { x: 0, y: 0, scale: 1, rotZ: 0, spike: 0, bands: 0, fade: 1, gem: 0, discs: 0, beacon: 0, logo: 0, morph: 0, ...moodKeysFromHex() };
    const scrollCurrent = { x: 0, y: 0, scale: 1, rotZ: 0, spike: 0, bands: 0, fade: 1, gem: 0, discs: 0, beacon: 0, logo: 0, morph: 0, ...moodKeysFromHex() };

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
        // On phones the shape used to be centred behind the copy and dimmed
        // to 40% — the one thing the whole site is built around, reduced to
        // a smudge for most of its audience. It now sits in its own space
        // above the card (the card gets matching top padding in app.css) at
        // close to full strength, which is also what makes it worth letting
        // touch visitors drag and tilt it.
        const adapt = (pose) => (compact ? { ...pose, x: 0, y: pose.y + 1.5, scale: pose.scale * 0.72 } : pose);

        compactView = compact;

        const hero = document.querySelector('[data-sphere-hero]');

        if (hero) {
            const rect = hero.getBoundingClientRect();
            list.push({
                center: rect.top + docTop + rect.height / 2,
                // Doubles as the scroll cue while the hero is active (see
                // .section-caption.is-cue) — the old caption just repeated
                // the hero's own eyebrow line word for word.
                caption: 'Scroll to explore',
                shape: SHAPE.orb,
                pose: adapt({ x: 1.62, y: 0, scale: 1, rotZ: 0, spike: 0, bands: 0, fade: 1, gem: 0, discs: 0, beacon: 0, logo: 0, morph: 0, ...moodKeysFromHex(hero.dataset.sphereMood) }),
            });
        }

        document.querySelectorAll('[data-sphere-x]').forEach((el) => {
            const rect = el.getBoundingClientRect();
            const gem = parseFloat(el.dataset.sphereGem || '0');
            const discs = parseFloat(el.dataset.sphereDiscs || '0');
            const logo = parseFloat(el.dataset.sphereLogo || '0');

            list.push({
                center: rect.top + docTop + rect.height / 2,
                caption: el.dataset.caption || '',
                // Which shape the swarm forms when resting here.
                shape: gem > 0.5 ? SHAPE.gyro : discs > 0.5 ? SHAPE.blocks : logo > 0.5 ? SHAPE.logo : SHAPE.orb,
                pose: adapt({
                    x: parseFloat(el.dataset.sphereX || '0'),
                    y: parseFloat(el.dataset.sphereY || '0'),
                    scale: parseFloat(el.dataset.sphereScale || '1'),
                    rotZ: parseFloat(el.dataset.sphereRot || '0'),
                    spike: parseFloat(el.dataset.sphereSpike || '0'),
                    bands: parseFloat(el.dataset.sphereBands || '0'),
                    fade: parseFloat(el.dataset.sphereFade || '1'),
                    gem,
                    discs,
                    beacon: parseFloat(el.dataset.sphereBeacon || '0'),
                    logo,
                    morph: list.length,
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

        // The finale is a waypoint without a chapter of its own; it keeps
        // the last chapter (Contact) lit rather than leaving the rail blank.
        const railIndex = Math.min(index, railLinks.length - 1);

        railLinks.forEach((link) => {
            link.setAttribute('aria-current', String(Number(link.dataset.rail) === railIndex));
        });

        const waypoint = waypoints[index];

        if (captionEl && waypoint && waypoint.caption) {
            captionEl.textContent = waypoint.caption;
            captionEl.classList.toggle('is-cue', index === 0);
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

    // Every transition used to take the same journey: slide across, dip back
    // a little, arrive. Six times. The shapes varied, the path never did —
    // and a path repeated six times stops being motion and becomes a
    // mechanism. Each handoff now gets its own flight through the scene,
    // peaking mid-transition and resolving to nothing at either end, so the
    // page reads as one object moving through a real space rather than a
    // sprite being swapped between two marks.
    //
    // x/y/z are the detour at the peak, in world units (the camera sits at
    // z 6.2, so positive z comes at you and negative recedes); roll/pitch/yaw
    // are the attitude it flies in. Indexed by segment, so transition 1 is
    // always the vault and transition 3 is always the long fall back.
    const FLIGHT_PATHS = [
        // Hero -> About. Mostly hidden behind the curtain, so: restrained.
        { x: 0, y: 0.35, z: -0.9, roll: 0.12, pitch: 0.1, yaw: 0.2 },
        // About -> Services. Vaults over the top and away.
        { x: 0, y: 1.75, z: -2.6, roll: -0.5, pitch: -0.42, yaw: 0.7 },
        // Services -> Skills. Swings low and close, passing the camera.
        { x: 0, y: -1.15, z: 1.5, roll: 0.55, pitch: 0.3, yaw: -0.8 },
        // Skills -> Work. Falls a long way back, small and distant.
        { x: 0.5, y: 0.5, z: -4.2, roll: -0.3, pitch: 0.18, yaw: 1.3 },
        // Work -> Contact. A wide spiral out toward the viewer.
        { x: 1.3, y: 0.95, z: 0.9, roll: 0.7, pitch: -0.25, yaw: -0.55 },
        // Contact -> finale. Rises and settles: the journey resolving.
        { x: 0, y: 1.3, z: -1.8, roll: 0, pitch: -0.3, yaw: 0.4 },
    ];

    // --- Adaptive quality -------------------------------------------------
    // This scene asks a lot: a 14k-particle swarm, a dust field, a 150-
    // segment shader orb evaluating eight ripple slots three times per
    // vertex, two instanced shard batches, an environment map and a
    // refraction pass. On a mid-range phone that is a slideshow, and a
    // beautiful site that stutters is worse than a plain one that doesn't.
    //
    // So the page measures itself. If sustained frame time says it can't
    // hold up, it steps down — pixel ratio first (by far the biggest win
    // per unit of lost fidelity), then particle counts, then the orb's
    // tessellation. Downgrades only, never back up: a scene that keeps
    // re-crossing the threshold would visibly pulse between qualities.
    const QUALITY_TIERS = [
        { name: 'high', pixelRatio: 2, swarm: 1, dust: 1, segments: 150 },
        { name: 'medium', pixelRatio: 1.5, swarm: 0.5, dust: 0.6, segments: 118 },
        { name: 'low', pixelRatio: 1, swarm: 0.22, dust: 0.35, segments: 84 },
    ];

    // Roughly 45fps. Below this sustained, something has to give.
    const SLOW_FRAME_MS = 22;
    // Measured in seconds of wall time, deliberately not in frames: a frame
    // count makes the system react slowest on exactly the devices that need
    // it most. At 45 frames, a phone managing 3fps would have struggled for
    // 15 seconds before the first step down. Verified — under heavy CPU
    // throttling the frame-counted version never downgraded at all.
    const SLOW_SECONDS_BEFORE_DROP = 1.2;

    let qualityTier = 0;
    let slowSeconds = 0;
    let averageFrameMs = 16;
    // Shader compilation, texture upload and the intro animation all land in
    // the first second or so and would be misread as a slow device.
    let qualityWarmup = 1.5;

    function applyQuality() {
        const tier = QUALITY_TIERS[qualityTier];

        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, tier.pixelRatio));
        dustUniforms.uPixelRatio.value = renderer.getPixelRatio();
        swarmUniforms.uPixelRatio.value = renderer.getPixelRatio();
        packetMaterial.uniforms.uPixelRatio.value = renderer.getPixelRatio();

        swarmGeometry.setDrawRange(0, Math.floor(SWARM_COUNT * tier.swarm));
        dustGeometry.setDrawRange(0, Math.floor(DUST_COUNT * tier.dust));

        if (sphereMesh.geometry.parameters.widthSegments !== tier.segments) {
            sphereMesh.geometry.dispose();
            sphereMesh.geometry = new THREE.SphereGeometry(0.95, tier.segments, tier.segments);
        }

        resize();
    }

    // `seconds` here is the *uncapped* frame time. Everything else in the
    // loop clamps delta to 0.1s so a backgrounded tab can't jump the
    // animation — but feeding that clamp to the watchdog would make it
    // systematically underestimate how slow a struggling device is, which
    // is the one place the truth matters. Verified: with the clamped value,
    // a 20x-throttled device took longer than 14 seconds to react.
    function watchQuality(seconds) {
        // Smoothed over roughly half a second of wall time rather than a
        // fixed number of frames, so it converges just as quickly at 3fps
        // as at 60 — one long frame is still never a verdict on its own.
        averageFrameMs += (seconds * 1000 - averageFrameMs) * Math.min(1, seconds / 0.5);

        if (qualityWarmup > 0 || qualityTier >= QUALITY_TIERS.length - 1) {
            return;
        }

        // Recovers twice as fast as it accumulates, so a brief rough patch
        // doesn't eventually add up to a downgrade on a capable machine.
        slowSeconds = averageFrameMs > SLOW_FRAME_MS
            ? slowSeconds + seconds
            : Math.max(0, slowSeconds - seconds * 2);

        if (slowSeconds >= SLOW_SECONDS_BEFORE_DROP) {
            qualityTier += 1;
            slowSeconds = 0;
            // A fresh grace period: the step itself costs a frame or two,
            // and the new tier needs a moment to show what it can do.
            qualityWarmup = 1;
            applyQuality();
        }
    }

    const clock = new THREE.Clock();
    const orbProjected = new THREE.Vector3();
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

    // The angle the swarm should use for a shape's points, so a morph lands
    // exactly where that shape's solid version currently is.
    const shapeRotation = (shape) => {
        if (shape === SHAPE.gyro) {
            return gemCluster.rotation.y;
        }

        if (shape === SHAPE.blocks) {
            return discGroup.rotation.y;
        }

        return shape === SHAPE.logo ? logoGroup.rotation.y : 0;
    };

    function tick() {
        const elapsed = clock.getDelta();
        const raw = Math.min(elapsed, 0.1);
        // Scroll response keeps working while paused; only the ambient,
        // self-running animation stops. uClock — interaction time, which
        // drives ripples — keeps running too.
        const delta = motionPaused ? 0 : raw;
        uniforms.uTime.value += delta;
        uniforms.uClock.value += raw;
        const time = uniforms.uTime.value;

        if (qualityWarmup > 0) {
            qualityWarmup -= elapsed;
        }

        watchQuality(elapsed);

        const currentScrollY = window.scrollY;
        smoothedVelocity += (Math.abs(currentScrollY - lastScrollY) - smoothedVelocity) * 0.08;
        lastScrollY = currentScrollY;

        // The shared breath — see BREATH_SECONDS. 0..1, written to CSS so the
        // status dot, the scroll cue and the finale's glow inhale on exactly
        // the same beat as the orb rather than merely at the same tempo.
        const breath = 0.5 + 0.5 * Math.sin(time * BREATH_RATE);
        document.documentElement.style.setProperty('--breath', breath.toFixed(4));

        const idleBreath = 0.055 + (breath - 0.5) * 0.03;
        uniforms.uDistort.value = idleBreath + Math.min(smoothedVelocity * 0.006, 0.13) + orbHover * 0.04;

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

        // Where the swarm morph is. `morph` is the waypoint index, eased like
        // every other pose value: its integer part picks the two waypoints
        // the page is between, its fraction (m) how far the transition has
        // got. segmentEase's DWELL hold pins m to exactly 0 or 1 while a
        // section is being read, so the swarm only ever exists between
        // sections.
        const lastWaypoint = Math.max(0, waypoints.length - 1);
        const morphValue = THREE.MathUtils.clamp(scrollCurrent.morph, 0, lastWaypoint);
        const segment = Math.min(Math.floor(morphValue), Math.max(0, lastWaypoint - 1));
        const m = THREE.MathUtils.clamp(morphValue - segment, 0, 1);
        const fromWaypoint = waypoints[segment];
        const toWaypoint = waypoints[segment + 1] || fromWaypoint;
        const shapeA = fromWaypoint ? fromWaypoint.shape : SHAPE.orb;
        const shapeB = toWaypoint ? toWaypoint.shape : shapeA;
        // Solid shapes dissolve into the swarm over the first 14% of a morph
        // and condense back out of it over the last 14%.
        const morphPresence = THREE.MathUtils.smoothstep(m, 0, 0.14) * (1 - THREE.MathUtils.smoothstep(m, 0.86, 1));
        const burst = burstAmountAt(uniforms.uClock.value);

        // About's particle portrait. `spike` is 1 only at About's waypoint,
        // so it doubles as "how much is this section the one being read" —
        // using it rather than a hardcoded waypoint index means the gate
        // follows the section automatically if the order ever changes.
        const aboutFocus = THREE.MathUtils.clamp(scrollCurrent.spike, 0, 1);

        if (!portraitDone && portraitReady && portraitStart < 0 && aboutFocus > 0.85) {
            // A beat after arriving, so the section's own entrance lands first.
            portraitStart = uniforms.uClock.value + 1.1;
        }

        const portrait = portraitStart < 0 ? null : portraitState(uniforms.uClock.value - portraitStart);

        if (portraitStart >= 0 && !portrait && uniforms.uClock.value - portraitStart > PORTRAIT_END) {
            portraitDone = true;
        }

        // Faded out if you scroll away mid-play rather than cut, so leaving
        // early never strands the orb dissolved.
        const portraitPresence = portrait ? portrait.presence * aboutFocus : 0;
        const presence = Math.max(morphPresence, portraitPresence);
        // How much of whichever solid shape is due to be showing actually is.
        const solid = (1 - presence) * (1 - burst);

        // Only one central shape at a time: the orb gives way whenever the
        // gyroscope, blocks or logo take over. The halo rings and their
        // markers are never part of this — they stay constant across every
        // section, the throughline beneath whichever object is active.
        const shapeSwap = Math.min(1, scrollCurrent.gem + scrollCurrent.discs + scrollCurrent.logo);
        uniforms.uGlobalAlpha.value = (1 - shapeSwap) * (1 - heroWipeDissolve) * solid;
        // Not just transparent but skipped: a fully faded orb would still
        // write depth and hide the swarm passing behind it.
        sphereMesh.visible = uniforms.uGlobalAlpha.value > 0.005;
        orbIsShowing = shapeSwap < 0.5;

        // Each shape settles in from very slightly undersized as it condenses
        // out of the swarm, rather than only fading up.
        const gemShown = scrollCurrent.gem * solid;
        gemCluster.visible = gemShown > 0.01;
        gemCluster.scale.setScalar(0.9 + scrollCurrent.gem * 0.1);
        // A slow idle drift for the whole cluster — each ring's own
        // precession (below) is the main motion, this just keeps the whole
        // formation from looking like a static diagram.
        gemCluster.rotation.y += delta * 0.08;
        // Pulse is additive on top of the base emissive intensity, not a
        // full 0-to-max swing — a core that fully dims between beats reads
        // as flickering/broken, not breathing.
        // Double-time against the shared breath — a core beating twice per
        // breath reads as alive and still belongs to the same rhythm.
        const corePulse = 1.3 + Math.sin(time * BREATH_RATE * 2) * 0.5;
        gemCoreMaterial.emissiveIntensity = corePulse;
        gemCoreMaterial.opacity = gemShown * 0.85;

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

            r.ringMaterial.opacity = gemShown * 0.92;
            // Depth only once solid, so the interlocking rings occlude each
            // other properly at rest — never while fading (see the shards).
            r.ringMaterial.depthWrite = gemShown > 0.9;
            r.ringMaterial.emissiveIntensity = r.glowCurrent * 2;
        });

        discMaterial.opacity = scrollCurrent.discs * solid;
        discMaterial.depthWrite = discMaterial.opacity > 0.97;
        discGroup.visible = discMaterial.opacity > 0.01;
        discGroup.scale.setScalar(0.9 + scrollCurrent.discs * 0.1);
        // A device only forms while Work is fully settled — never mid-morph
        // or mid-burst, so the swarm always peels off the plain grid.
        const deviceProject =
            !compactView && hoveredProject >= 0 && scrollCurrent.discs > 0.92 && presence < 0.01 && burst < 0.01 ? hoveredProject : -1;
        updateBlocks(deviceProject, raw, delta, time);

        logoMaterial.opacity = scrollCurrent.logo * solid;
        logoMaterial.depthWrite = logoMaterial.opacity > 0.97;
        logoGroup.visible = logoMaterial.opacity > 0.01;
        // A slow swing, so the extrusion and bevels read as 3D.
        logoGroup.rotation.y = Math.sin(time * 0.55) * 0.5;

        // Contact's oyster. Opens as the section settles, and keeps breathing
        // a few degrees once open so it never freezes into a prop. The lid
        // leads the lower shell slightly — both halves moving identically
        // reads mechanical, like a hinge rather than something alive.
        const shellShown = scrollCurrent.beacon * solid;
        shellGroup.visible = shellShown > 0.01;
        shellOuterMaterial.opacity = shellShown;
        shellInnerMaterial.opacity = shellShown;
        shellOuterMaterial.depthWrite = shellShown > 0.97;
        shellInnerMaterial.depthWrite = shellShown > 0.97;

        const shellOpen = THREE.MathUtils.smoothstep(scrollCurrent.beacon, 0.15, 0.95);
        // Opened far enough to show the nacre, not so far that the lid swings
        // round into the frame and becomes the subject.
        shellHinge.rotation.x = -shellOpen * (0.82 + breath * 0.05);
        shellGroup.rotation.x = shellOpen * (0.3 + breath * 0.02);
        // Settles down and back, so the pearl sits proud of the setting.
        shellGroup.position.y = -0.36 * shellOpen;
        shellGroup.position.z = -0.26 * shellOpen;

        const bandOpacity = scrollCurrent.bands * scrollCurrent.fade * 0.92 * solid;
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
        updatePackets(bandOpacity, time);

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
        // middle of the screen. "crossing" peaks halfway through a transition
        // and is 0 at rest; it drives a genuine swing-through-depth arc
        // rather than a scale trick standing in for one:
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
        // arc dissolves away cleanly at rest.
        //
        // Measured from the morph's progress, scaled by how far this
        // transition actually travels sideways (a full side-to-side swap is
        // 1; Contact -> finale, side to centre, about half). It used to be
        // read off the orb's distance from screen centre (1 - |x| / 1.6),
        // which mistook any shape *resting* near the centre for one
        // mid-crossing: on mobile (every pose centred) that once left the
        // whole page permanently exploded, and the centred finale would
        // have done the same. Still 0 in compact view, where nothing swaps
        // sides at all.
        const travel = fromWaypoint && toWaypoint ? Math.min(1, Math.abs(toWaypoint.pose.x - fromWaypoint.pose.x) / 3.2) : 0;
        const crossing = compactView ? 0 : Math.sin(Math.PI * m) * travel;
        const travelRemaining = scrollTarget.x - scrollCurrent.x;

        // The flight path for this particular transition (see FLIGHT_PATHS).
        // `bump` peaks mid-transition and is 0 at both ends, so the detour
        // always dissolves cleanly back onto the resting pose.
        const path = FLIGHT_PATHS[segment % FLIGHT_PATHS.length];
        const bump = Math.sin(Math.PI * m) ** 1.15;
        // Scrolling hard throws it further. The same journey taken slowly
        // stays composed — the motion answers to how you move, which is what
        // separates a system that feels alive from a canned animation.
        const vigour = 1 + Math.min(smoothedVelocity * 0.012, 0.85);
        // Compact view keeps the depth and height of each path but drops the
        // sideways swing, where there is no room for it.
        const reach = bump * vigour * (compactView ? 0.55 : 1);

        const bank = (THREE.MathUtils.clamp(travelRemaining * 0.8, -0.55, 0.55) * crossing) + path.roll * reach;
        const tumble = (THREE.MathUtils.clamp(travelRemaining * 0.35, -0.45, 0.45) * crossing) + path.yaw * reach;
        const pitch = bank * 0.35 + path.pitch * reach;
        // Depth does the shrinking, not an artificial scale multiplier: the
        // object is genuinely further from the camera.
        const arcScale = 1 - crossing * 0.05;
        const arcLift = path.y * reach;
        const arcDepth = path.z * reach;
        const stretch = crossing * 0.22;

        sphere.position.x = scrollCurrent.x + path.x * reach * (compactView ? 0 : 1) + pointerCurrent.x * 0.32 * heroPresence;
        sphere.position.y = scrollCurrent.y + intro.y - pointerCurrent.y * 0.22 * heroPresence + arcLift;
        sphere.position.z = arcDepth;
        sphere.scale.setScalar(scrollCurrent.scale * intro.scale * arcScale);
        sphere.rotation.z = scrollCurrent.rotZ + intro.rotZ + bank;
        sphere.rotation.x = -pointerCurrent.y * 0.14 * heroPresence + pitch;
        sphere.rotation.y = pointerCurrent.x * 0.14 * heroPresence + tumble;
        sphereMesh.rotation.y += delta * 0.18 * (1 + orbHover * 2.2);
        // Deliberately on sphereMesh, not the parent "sphere" group — the
        // group also carries the gem/discs/bands/rings, and a non-uniform
        // group scale would stretch the gem's hard facets and the discs'
        // crisp edges into a smeared ellipsoid whenever a shape-swap happens
        // to overlap a crossing. The blobby orb is the only thing here it
        // reads as organic on.
        sphereMesh.scale.set(1 + stretch, 1 - stretch * 0.5, 1 - stretch * 0.5);

        // Ground contact. Rising through a crossing spreads and thins the
        // shadow; settling tightens and darkens it. That inverse relationship
        // is the whole cue — a shadow that merely followed the orb around at
        // a fixed size would read as a decal stuck beneath it.
        const lift = THREE.MathUtils.clamp(arcLift / 0.45, 0, 1);
        const groundWidth = (3.1 + lift * 1.5) * sphere.scale.x;

        groundMesh.position.set(sphere.position.x, FLOOR_Y, sphere.position.z - 0.25);
        groundMesh.scale.set(groundWidth, groundWidth * 0.34, 1);

        // Fires once each time the orb finishes arriving somewhere.
        if (landingRing < 1) {
            landingRing = Math.min(1, landingRing + raw * 1.15);
        }

        if (presence > 0.3) {
            settling = true;
        } else if (settling && presence < 0.02) {
            settling = false;
            landingRing = 0;
        }

        // Published for the DOM-side text melt, which flies each heading's
        // characters into wherever the orb actually is.
        sphere.getWorldPosition(orbProjected);
        orbProjected.project(camera);

        if (Number.isFinite(orbProjected.x) && Number.isFinite(orbProjected.y)) {
            orbScreen.x = canvasRect.left + (orbProjected.x * 0.5 + 0.5) * canvasRect.width;
            orbScreen.y = canvasRect.top + (1 - (orbProjected.y * 0.5 + 0.5)) * canvasRect.height;
            orbScreen.ready = true;
        }

        groundMaterial.uniforms.uRing.value = landingRing;
        groundMaterial.uniforms.uAlpha.value = (0.3 - lift * 0.18) * intro.opacity * (1 - heroWipeDissolve);
        groundMesh.visible = intro.opacity > 0.02;

        // The swarm: between sections, or holding About's portrait.
        swarm.visible = presence > 0.002;

        if (swarm.visible) {
            if (portraitPresence > morphPresence) {
                swarmUniforms.uMorph.value = portrait.blend;
                swarmUniforms.uShapeA.value = SHAPE.orb;
                swarmUniforms.uShapeB.value = SHAPE.portrait;
                swarmUniforms.uRotA.value = 0;
                swarmUniforms.uRotB.value = 0;
                // Barely any scatter: the face has to resolve cleanly, where
                // a section crossing wants the opposite.
                swarmUniforms.uSpread.value = 0.18;
            } else {
                swarmUniforms.uMorph.value = m;
                swarmUniforms.uShapeA.value = shapeA;
                swarmUniforms.uShapeB.value = shapeB;
                swarmUniforms.uRotA.value = shapeRotation(shapeA);
                swarmUniforms.uRotB.value = shapeRotation(shapeB);
                // Orb-to-orb crossings have no new shape to show off, so they
                // burst wider; shape changes keep the flow tighter and legible.
                swarmUniforms.uSpread.value = shapeA === shapeB ? 1.15 : 0.8;
            }

            swarmUniforms.uAlpha.value = presence;
        }

        // The fling burst's shards.
        const shardsVisible = burst > 0.02;
        chunkMesh.visible = shardsVisible;
        shardMesh.visible = shardsVisible;
        fragmentMaterial.opacity = burst * 0.92;

        if (shardsVisible) {
            updateFragmentBatch(chunkMesh, chunkData, burst);
            updateFragmentBatch(shardMesh, shardData, burst);
        }

        // Hover: only where a shape is genuinely the thing under the cursor
        // — desktop layout, and only while it's solidly there (not mid-morph,
        // mid-burst or under the curtain).
        solidPresence = solid * (1 - heroWipeDissolve);

        let hovering = false;

        if (pointerClient.active && solidPresence > 0.6) {
            orbNdc.set(
                ((pointerClient.x - canvasRect.left) / canvasRect.width) * 2 - 1,
                -((pointerClient.y - canvasRect.top) / canvasRect.height) * 2 + 1
            );
            orbRaycaster.setFromCamera(orbNdc, camera);
            sphere.getWorldPosition(orbBounds.center);
            orbBounds.radius = 1.02 * sphere.scale.x;

            if (orbRaycaster.ray.intersectSphere(orbBounds, orbHit)) {
                hovering = true;
                orbHitLocal.copy(orbHit);
                sphereMesh.worldToLocal(orbHitLocal).normalize();
            }
        }

        // Keep hold of it while dragging, even if the cursor slips off the edge.
        hovering = hovering || drag.active;
        orbHover += ((hovering ? 1 : 0) - orbHover) * (1 - Math.exp(-raw * 5));

        // The dent follows the cursor across the surface, and recedes in
        // place when it leaves.
        uniforms.uTouchDir.value.copy(orbHitLocal);
        uniforms.uTouch.value += ((hovering && orbIsShowing ? 1 : 0) - uniforms.uTouch.value) * (1 - Math.exp(-raw * 8));

        if (hovering !== orbHovered) {
            orbHovered = hovering;
            cursorRing?.classList.toggle('is-orb', hovering);

            // A [data-cursor-text] label (e.g. "View" on project rows) wins.
            if (cursorLabel && !cursorRing.classList.contains('is-labelled')) {
                cursorLabel.textContent = hovering ? 'Drag' : '';
            }
        }

        // After a drag: carry on spinning with the release momentum, then
        // drift back to rest — the pull home strengthening as the spin dies.
        if (!drag.active) {
            const speed = spinVelocity.length();

            if (speed > 0.001) {
                applySpin(spinVelocity.x * raw, spinVelocity.y * raw);
            }

            spinVelocity.multiplyScalar(Math.exp(-raw * 1.4));
            const settle = 0.15 + 1.5 * (1 - THREE.MathUtils.smoothstep(speed, 0.3, 2.5));
            // Settles toward restQuaternion, not straight back to identity:
            // that keeps part of however you last left it, so the rest of
            // the scroll is visibly the orb *you* handled. Never all the way
            // (see release()) — the logo and the gyroscope have a front, and
            // a shape that kept an arbitrary rotation forever would spend
            // the finale facing backwards.
            spinner.quaternion.slerp(restQuaternion, 1 - Math.exp(-raw * settle));
        }

        dust.visible = dustPresence > 0.01;
        dustUniforms.uAlpha.value = dustPresence;
        dustUniforms.uScroll.value = currentScrollY * 0.0024;
        dustUniforms.uPointer.value.set(pointerCurrent.x, -pointerCurrent.y);

        // Compact view no longer hides the scene behind the copy: the shape
        // has its own space above the card, and the card's own backdrop is
        // what keeps text legible.
        const compactDim = 0.88 + 0.12 * scrollCurrent.logo;
        canvas.style.opacity = (scrollCurrent.fade * (compactView ? compactDim : 1) * intro.opacity).toFixed(3);

        renderer.render(scene, camera);
        requestAnimationFrame(tick);
    }

    let measureTimer;
    function scheduleMeasure() {
        window.clearTimeout(measureTimer);
        measureTimer = window.setTimeout(measureWaypoints, 150);
    }

    // Hands the CSS pulses over from their own keyframes to the live
    // --breath value (app.css). Set here, not at module load, so it only
    // applies once the scene is genuinely running.
    document.documentElement.classList.add('has-breath');

    // Compact devices start a tier down rather than discovering it the slow
    // way: a phone has both the weakest GPU and the highest pixel ratio, so
    // it is the one case where the first seconds are reliably the worst.
    if (compactView) {
        qualityTier = 1;
    }

    applyQuality();
    measureWaypoints();
    tick();

    // Waits for the loader to lift (same signal as the hero copy's staged
    // rise), so the orb's entrance is something you actually see — it used
    // to start on module load and could finish entirely behind the loader.
    pageReady.then(() => {
        gsap.to(intro, { y: 0, scale: 1, rotZ: 0, duration: 1.6, ease: 'expo.out', delay: 0.15 });
        // Fades in on its own, faster timeline than the rise — masks the one
        // blank beat between page paint and the first WebGL frame actually
        // landing, rather than popping in abruptly once it does.
        gsap.to(intro, { opacity: 1, duration: 0.7, ease: 'power2.out', delay: 0.1 });
    });

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

// Nothing about the orb says you can touch it, so most visitors never
// discover the drag, the fling or the ripple. A single hint appears beside
// it shortly after arriving, and never again on this device once it has
// been seen or acted on.
function initOrbHint() {
    const hint = document.getElementById('orb-hint');

    if (!hint || prefersReducedMotion) {
        return;
    }

    const KEY = 'shaikh-labs:orb-hint-seen';
    const coarse = window.matchMedia('(pointer: coarse)').matches;

    // Storage throws in some privacy modes; a hint is not worth an error,
    // and showing it again to someone whose browser forgets is harmless.
    const seen = () => {
        try {
            return localStorage.getItem(KEY) === '1';
        } catch (error) {
            return false;
        }
    };

    const remember = () => {
        try {
            localStorage.setItem(KEY, '1');
        } catch (error) {
            /* not worth reporting */
        }
    };

    if (seen()) {
        hint.remove();

        return;
    }

    hint.textContent = coarse ? 'Drag the orb' : 'Drag it. Throw it.';

    let visible = false;
    let frame = 0;

    const place = () => {
        if (!visible) {
            return;
        }

        // Also clears itself once the hero is behind you. The interaction
        // listeners below cover wheel and touch, but keyboard navigation and
        // the rail scrubber move the page without either — and a hint
        // pointing at an orb you have already left reads as a stuck label.
        if (window.scrollY > window.innerHeight * 0.5) {
            dismiss();

            return;
        }

        if (orbScreen.ready) {
            hint.style.transform = `translate(calc(${orbScreen.x.toFixed(0)}px - 50%), ${(orbScreen.y + 96).toFixed(0)}px)`;
        }

        frame = requestAnimationFrame(place);
    };

    const dismiss = () => {
        if (!visible) {
            return;
        }

        visible = false;
        cancelAnimationFrame(frame);
        hint.classList.remove('is-visible');
        remember();
        window.setTimeout(() => hint.remove(), 600);
    };

    const show = () => {
        // Only while the hero is still the thing on screen — pointing at an
        // orb that has already scrolled away would be nonsense.
        if (seen() || window.scrollY > window.innerHeight * 0.3) {
            return;
        }

        visible = true;
        hint.classList.add('is-visible');
        place();
        window.setTimeout(dismiss, 6000);
    };

    pageReady.then(() => window.setTimeout(show, 2600));

    ['pointerdown', 'wheel', 'touchstart', 'keydown'].forEach((type) => {
        window.addEventListener(type, dismiss, { once: true, passive: true });
    });
}

// Section-to-section keyboard navigation. Developers try arrow keys; J/K
// mirrors the convention their editors and terminals already use. Scrolls
// rather than jumping, so the full transition plays either way.
function initKeyboardNav() {
    const sections = Array.from(document.querySelectorAll('[data-sphere-hero], [data-sphere-x]'));

    if (sections.length < 2) {
        return;
    }

    const goTo = (index) => {
        const target = sections[Math.max(0, Math.min(sections.length - 1, index))];

        if (lenis) {
            lenis.scrollTo(target, { offset: -16 });
        } else {
            target.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'start' });
        }
    };

    // Whichever section currently owns the middle of the viewport.
    const current = () => {
        const focus = window.scrollY + window.innerHeight / 2;
        let best = 0;
        let bestDistance = Infinity;

        sections.forEach((section, i) => {
            const rect = section.getBoundingClientRect();
            const distance = Math.abs(rect.top + window.scrollY + rect.height / 2 - focus);

            if (distance < bestDistance) {
                bestDistance = distance;
                best = i;
            }
        });

        return best;
    };

    window.addEventListener('keydown', (event) => {
        // Never steal keys from a form, a contenteditable, or a shortcut.
        if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey) {
            return;
        }

        const el = document.activeElement;

        if (el && (el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName))) {
            return;
        }

        const forward = event.key === 'ArrowDown' || event.key === 'j' || event.key === 'J';
        const back = event.key === 'ArrowUp' || event.key === 'k' || event.key === 'K';

        if (!forward && !back) {
            return;
        }

        event.preventDefault();
        goTo(current() + (forward ? 1 : -1));
    });
}

// The chapter rail doubles as a scrubber: drag it and the whole journey —
// every morph, burst and shape change — runs under your hand at whatever
// speed you choose. Clicks still work; a drag is only a drag once it has
// actually moved.
function initRailScrub() {
    const rail = document.querySelector('.chapter-rail');

    if (!rail || prefersReducedMotion) {
        return;
    }

    let scrubbing = false;
    let moved = false;
    let startX = 0;
    let startY = 0;

    const scrollTo = (clientY) => {
        const rect = rail.getBoundingClientRect();
        const fraction = Math.min(1, Math.max(0, (clientY - rect.top) / Math.max(1, rect.height)));
        const max = document.documentElement.scrollHeight - window.innerHeight;

        if (lenis) {
            lenis.scrollTo(fraction * max, { immediate: true });
        } else {
            window.scrollTo(0, fraction * max);
        }
    };

    // Pressing on a link and moving starts the browser's own link drag,
    // which fires pointercancel and swallows every pointermove after it —
    // the scrub died on its second event and released as an ordinary click,
    // navigating instead of scrubbing. Refusing the native drag is what
    // makes the gesture reach our handlers at all.
    rail.addEventListener('dragstart', (event) => event.preventDefault());

    rail.addEventListener('pointerdown', (event) => {
        scrubbing = true;
        moved = false;
        startX = event.clientX;
        startY = event.clientY;
        rail.classList.add('is-scrubbing');
    });

    // Tracked on the window, not the rail. The rail is a ~140px sliver and a
    // scrub immediately leaves it, so listening on the element only would
    // drop the gesture the moment it got going — setPointerCapture is not
    // reliable enough here to lean on instead.
    window.addEventListener('pointermove', (event) => {
        if (!scrubbing) {
            return;
        }

        // Measured from where the press started rather than from per-event
        // deltas: movementX/Y are not populated consistently, which made
        // every drag read as a click and navigate instead of scrubbing.
        if (!moved && Math.abs(event.clientY - startY) + Math.abs(event.clientX - startX) < 4) {
            return;
        }

        moved = true;
        scrollTo(event.clientY);
    });

    const end = () => {
        if (!scrubbing) {
            return;
        }

        scrubbing = false;
        rail.classList.remove('is-scrubbing');
    };

    window.addEventListener('pointerup', end);
    window.addEventListener('pointercancel', end);

    // Suppresses the link navigation that would otherwise fire at the end
    // of a drag that happened to finish over a different chapter.
    rail.addEventListener(
        'click',
        (event) => {
            if (moved) {
                event.preventDefault();
                event.stopPropagation();
                moved = false;
            }
        },
        true
    );
}

// Headings melt into the orb. As a section scrolls away its heading breaks
// into individual characters that stream toward wherever the orb is and
// dissolve; scrolling back reassembles them. Timed against the same scroll
// the swarm erupts on, so the letters appear to *become* the particle cloud
// — the copy and the 3D stop being two separate layers.
//
// Characters rather than sampled pixels on a canvas: a canvas would have to
// re-implement the browser's own font shaping and line breaking to know
// where each glyph sits, and would go wrong on every wrap, weight and
// breakpoint. Real spans stay in normal flow, so wrapping, resizing and
// selection keep working, and the split is done lazily — long after the
// scramble reveal has finished writing to textContent, which would
// otherwise destroy the spans.
function initTextMelt() {
    const targets = Array.from(document.querySelectorAll('[data-melt]'));

    if (!targets.length || prefersReducedMotion) {
        return;
    }

    const clamp01 = (value) => Math.min(1, Math.max(0, value));

    const split = (el) => {
        if (el.dataset.meltSplit) {
            return el.__meltChars;
        }

        // A scramble reveal still in flight rewrites textContent every
        // frame, which would throw away the spans the moment they are made.
        // Splitting is deferred rather than abandoned — the next scroll
        // tick tries again.
        if (el.hasAttribute('data-scramble') && !el.dataset.scrambleDone) {
            return [];
        }

        const text = el.textContent;
        const chars = [];
        const fragment = document.createDocumentFragment();

        // Word wrappers keep whole words together so the heading still wraps
        // the way it did before being split.
        text.split(/(\s+)/).forEach((chunk) => {
            if (!chunk.trim()) {
                fragment.appendChild(document.createTextNode(chunk));

                return;
            }

            const word = document.createElement('span');
            word.style.display = 'inline-block';
            word.style.whiteSpace = 'nowrap';

            Array.from(chunk).forEach((character) => {
                const span = document.createElement('span');
                span.textContent = character;
                span.style.display = 'inline-block';
                span.style.willChange = 'transform, opacity';
                word.appendChild(span);
                chars.push(span);
            });

            fragment.appendChild(word);
        });

        // The accessible name is already pinned by the scramble reveal; set
        // it here too for headings that never scrambled, so the split is
        // invisible to assistive tech either way.
        if (!el.hasAttribute('aria-label')) {
            el.setAttribute('aria-label', text);
        }

        el.textContent = '';
        el.appendChild(fragment);
        el.dataset.meltSplit = 'true';
        el.__meltChars = chars;

        return chars;
    };

    targets.forEach((el) => {
        const section = el.closest('section');

        if (!section) {
            return;
        }

        let painted = -1;
        let bases = null;

        // Each character's resting centre, in *document* coordinates. Must be
        // measured with transforms cleared, and must not be re-measured from
        // a transformed span — reading a moved box and then moving it again
        // by that distance makes the letters accelerate away instead of
        // landing on the orb. Document space rather than viewport space so
        // one measurement stays valid for the whole scroll.
        const measure = (chars) => {
            chars.forEach((span) => {
                span.style.transform = '';
                span.style.opacity = '';
            });

            bases = chars.map((span) => {
                const box = span.getBoundingClientRect();

                return {
                    x: box.left + box.width / 2 + window.scrollX,
                    y: box.top + box.height / 2 + window.scrollY,
                };
            });
        };

        const paint = (progress) => {
            // Rounded before comparing: scrub fires far more often than the
            // result actually changes, and each paint touches every span.
            const quantised = Math.round(progress * 120) / 120;

            if (quantised === painted) {
                return;
            }

            const chars = split(el);

            if (!chars.length) {
                // Deferred (scramble still running) — don't record this
                // progress as painted, so the next tick retries.
                return;
            }

            if (quantised <= 0) {
                if (painted !== 0) {
                    chars.forEach((span) => {
                        span.style.transform = '';
                        span.style.opacity = '';
                    });
                }

                painted = quantised;

                return;
            }

            if (!bases) {
                measure(chars);
            }

            painted = quantised;

            // Falls back to the far side of the viewport if the 3D scene
            // isn't running, so the letters still drift somewhere sensible.
            const targetX = orbScreen.ready ? orbScreen.x + window.scrollX : window.innerWidth * 0.75 + window.scrollX;
            const targetY = orbScreen.ready ? orbScreen.y + window.scrollY : bases[0].y;

            chars.forEach((span, i) => {
                // Staggered so the line comes apart letter by letter instead
                // of sliding away as one block.
                const delay = (i / chars.length) * 0.4;
                const local = clamp01((quantised - delay) / 0.6);

                if (local <= 0) {
                    span.style.transform = '';
                    span.style.opacity = '';

                    return;
                }

                const base = bases[i];
                const eased = local * local;
                const dx = (targetX - base.x) * eased;
                const dy = (targetY - base.y) * eased;

                span.style.transform = `translate(${dx.toFixed(1)}px, ${dy.toFixed(1)}px) scale(${(1 - local * 0.75).toFixed(3)}) rotate(${((i % 2 ? 1 : -1) * local * 38).toFixed(1)}deg)`;
                // Faded out well before the letter finishes its flight: the
                // journey is the effect, but legible characters drifting
                // across the body copy below just read as a layout bug.
                // Quicker than it was, now that the flight paths carry the
                // orb much further and the letters have further to travel.
                span.style.opacity = (1 - clamp01(local * 2.1)).toFixed(3);
            });
        };

        ScrollTrigger.create({
            trigger: section,
            // Starts once the section is already on its way out, so the
            // heading is never coming apart while you are still reading it.
            start: 'center 38%',
            end: 'bottom 15%',
            scrub: true,
            onUpdate: (self) => paint(self.progress),
            onRefresh: () => {
                // Layout moved under us, so the cached rest positions are
                // stale. Dropped rather than re-measured now: measuring mid
                // refresh would read a page that GSAP has scrolled to 0.
                bases = null;
                painted = -1;
            },
        });
    });
}

// Sidebar rail: one indicator bar that slides to whichever icon matches the
// section crossing the middle of the viewport (homepage), or the current
// route's link (Work/Blog pages). IntersectionObserver rather than the
// sphere's own waypoint loop, so it works under reduced motion too, where
// the sphere never runs.
function initSectionSpy() {
    const nav = document.querySelector('[data-sidebar-nav]');
    const indicator = nav?.querySelector('[data-sidebar-indicator]');

    if (!nav || !indicator) {
        return;
    }

    const links = Array.from(nav.querySelectorAll('[data-spy]'));
    const routeLink = nav.querySelector('[aria-current="page"]');

    const place = (link) => {
        if (!link) {
            indicator.style.opacity = '0';

            return;
        }

        const y = link.offsetTop + link.offsetHeight / 2 - indicator.offsetHeight / 2;
        indicator.style.transform = `translateY(${y}px)`;
        indicator.style.opacity = '1';
    };

    place(routeLink);

    const sections = links.map((link) => document.getElementById(link.dataset.spy)).filter(Boolean);

    if (!sections.length) {
        return;
    }

    let active = null;

    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    active = entry.target.id;
                } else if (active === entry.target.id) {
                    active = null;
                }
            });

            links.forEach((link) => link.toggleAttribute('data-spy-active', link.dataset.spy === active));
            place(links.find((link) => link.dataset.spy === active) || routeLink);
        },
        // A thin band across the middle of the viewport: whichever section
        // is crossing it is "the one being read".
        { rootMargin: '-48% 0px -48% 0px' }
    );

    sections.forEach((section) => observer.observe(section));
}

// Velocity-reactive marquee: drifts on its own, then surges — in whichever
// direction you're scrolling — while the page is moving, easing back to its
// idle drift when you stop. Each [data-marquee] track holds two identical
// halves, so wrapping its offset at 50% loops seamlessly. Only ticks while
// on screen.
function initMarquees() {
    const tracks = document.querySelectorAll('[data-marquee]');

    if (!tracks.length || prefersReducedMotion) {
        return;
    }

    tracks.forEach((track) => {
        const base = parseFloat(track.dataset.marqueeSpeed || '1.6');
        let offset = 0;
        let boost = 0;
        let direction = 1;
        let onScreen = false;

        new IntersectionObserver(([entry]) => {
            onScreen = entry.isIntersecting;
        }).observe(track);

        lenis?.on('scroll', ({ velocity }) => {
            boost = Math.max(boost, Math.min(Math.abs(velocity) * 0.5, 12));

            if (Math.abs(velocity) > 0.5) {
                direction = velocity > 0 ? 1 : -1;
            }
        });

        gsap.ticker.add((time, deltaMs) => {
            if (!onScreen) {
                return;
            }

            const dt = Math.min(deltaMs, 100) / 1000;
            boost *= Math.exp(-dt * 2.4);
            offset = (offset + (base + boost) * direction * dt) % 50;

            if (offset < 0) {
                offset += 50;
            }

            track.style.transform = `translate3d(${-offset}%, 0, 0)`;
        });
    });
}

// "How we'll work" steps: a connector line that draws itself as you scroll
// through the list, each step's marker lighting up as the line reaches it.
// The line is the <ol>'s own ::before/::after (a <span> isn't valid as a
// direct child of <ol>), so this animates the --process-progress custom
// property the ::after's scaleY reads, rather than an element.
function initProcessTimeline() {
    const list = document.querySelector('[data-process]');

    if (!list) {
        return;
    }

    const steps = list.querySelectorAll('[data-process-step]');

    if (prefersReducedMotion) {
        steps.forEach((step) => step.classList.add('is-active'));
        list.style.setProperty('--process-progress', '1');

        return;
    }

    gsap.fromTo(
        list,
        { '--process-progress': 0 },
        {
            '--process-progress': 1,
            ease: 'none',
            scrollTrigger: { trigger: list, start: 'top 78%', end: 'bottom 62%', scrub: 0.6 },
        }
    );

    steps.forEach((step) => {
        ScrollTrigger.create({
            trigger: step,
            start: 'top 74%',
            onEnter: () => step.classList.add('is-active'),
            onLeaveBack: () => step.classList.remove('is-active'),
        });
    });
}

// Live local time in the footer — a small, honest "real person, real
// timezone" signal for international clients working out reply windows.
function initLocalTime() {
    const targets = document.querySelectorAll('[data-local-time]');

    if (!targets.length) {
        return;
    }

    const format = new Intl.DateTimeFormat('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        timeZone: 'Asia/Kolkata',
    });

    const render = () => {
        const now = format.format(new Date());
        targets.forEach((el) => {
            el.textContent = now;
        });
    };

    render();
    window.setInterval(render, 15000);
}

function initBackToTop() {
    document.querySelectorAll('[data-back-to-top]').forEach((button) => {
        button.addEventListener('click', () => {
            if (lenis) {
                lenis.scrollTo(0, { duration: 2.2 });
            } else {
                window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
            }
        });
    });
}

// Glass cards catch a soft light that follows the cursor across them (the
// gradient itself lives in .stage-card's background in app.css — this only
// feeds it the pointer position).
function initCardSpotlight() {
    if (window.matchMedia('(pointer: coarse)').matches) {
        return;
    }

    document.querySelectorAll('.stage-card').forEach((card) => {
        card.addEventListener('pointermove', (event) => {
            const rect = card.getBoundingClientRect();
            card.style.setProperty('--spot-x', `${event.clientX - rect.left}px`);
            card.style.setProperty('--spot-y', `${event.clientY - rect.top}px`);
        });
    });
}

// Opening/closing an accordion item changes the page height below it, which
// every ScrollTrigger start/end further down the page was measured against —
// re-measure once the height transition has finished.
function initAccordions() {
    const items = document.querySelectorAll('details[data-accordion]');
    let timer;

    items.forEach((item) => {
        item.addEventListener('toggle', () => {
            window.clearTimeout(timer);
            timer = window.setTimeout(() => ScrollTrigger.refresh(), 650);
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
    initHeroLens();
    initCustomCursor();
    initMagneticButtons();
    initFormSubmitGuard();
    initFocusFirstError();
    initSectionSpy();
    initMarquees();
    initProcessTimeline();
    initLocalTime();
    initBackToTop();
    initCardSpotlight();
    initAccordions();
    initTextMelt();
    initOrbHint();
    initKeyboardNav();
    initRailScrub();

    requestAnimationFrame(() => ScrollTrigger.refresh());

    if ('fonts' in document) {
        document.fonts.ready.then(() => ScrollTrigger.refresh());
    }
});
