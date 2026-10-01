import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

if (import.meta.env.DEV) {
    window.gsap = gsap;
    window.ScrollTrigger = ScrollTrigger;
}

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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

function buildHeroSphere(THREE, canvas) {
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
    camera.position.set(0, 0, 6.2);

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
        uColorA: { value: new THREE.Color('#1557e8') },
        uColorB: { value: new THREE.Color('#168bff') },
        uColorC: { value: new THREE.Color('#27c9f2') },
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

        // Ferrofluid: a lattice of lobes, kept short and rounded by the low exponent.
        float spikeField(vec3 d) {
            float s = sin(d.x * 9.5 + uTime * 0.25)
                    * sin(d.y * 9.5 + uTime * 0.2)
                    * sin(d.z * 9.5 + uTime * 0.3);
            return pow(abs(s), 1.9);
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
            // toward the brand colour at the rim.
            color = mix(color, vec3(0.94, 0.97, 1.0), (1.0 - fresnel) * 0.2);

            float ferro = clamp(vSpike * 2.4, 0.0, 1.0);
            color = mix(color, color * 0.45 + specular * 0.9, ferro);

            // Fresnel-driven transparency: see-through near the centre, solid
            // and bright right at the rim, the way light catches a glass
            // edge. Ferrofluid spikes stay fully opaque so they read as a
            // distinct wet material, not glass.
            float glassAlpha = mix(0.48, 0.95, pow(fresnel, 0.6));
            float alpha = mix(glassAlpha, 1.0, ferro);

            gl_FragColor = vec4(color, alpha);
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

    [1.62, 2.12].forEach((radius, i) => {
        const ringOpacity = 0.18 - i * 0.06;
        const ring = new THREE.Mesh(
            new THREE.TorusGeometry(radius, 0.005, 8, 200),
            new THREE.MeshBasicMaterial({ color: new THREE.Color('#1557e8'), transparent: true, opacity: ringOpacity })
        );
        ring.userData.spin = i === 0 ? 0.06 : -0.04;
        ring.userData.baseOpacity = ringOpacity;
        rings.push(ring);
        sphere.add(ring);

        // A marker riding each ring, so the orbits read as moving rather than drawn.
        const pivot = new THREE.Object3D();
        const accent = new THREE.Color(i === 0 ? '#1557e8' : '#27c9f2');

        const dot = new THREE.Mesh(
            new THREE.SphereGeometry(i === 0 ? 0.042 : 0.03, 16, 16),
            new THREE.MeshBasicMaterial({ color: accent, transparent: true, opacity: 0.9 })
        );
        dot.position.x = radius;
        dot.userData.baseOpacity = 0.9;

        const trail = new THREE.Mesh(
            new THREE.TorusGeometry(radius, i === 0 ? 0.018 : 0.013, 8, 60, 0.6),
            new THREE.MeshBasicMaterial({ color: accent, transparent: true, opacity: 0.22 })
        );
        trail.rotation.z = -0.6;
        trail.userData.baseOpacity = 0.22;

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

    // --- Explode & reassemble -------------------------------------------
    // The orb breaks apart into shapes that mirror the real content of each
    // section, instead of staying one static object throughout. Services ->
    // one node per service. Skills -> one facet per skill. Work -> one card
    // per real project. Driven by scrollCurrent.form, a continuous value
    // (0 orb, 1 services, 2 skills, 3 work, back to 0) that comes from the
    // same waypoint system already driving x/y/scale, so it eases and
    // dwells exactly like everything else already does — no separate
    // timeline to keep in sync.

    function smoothstep(edge0, edge1, x) {
        const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));

        return t * t * (3 - 2 * t);
    }

    function fibonacciPoint(i, count, radius) {
        const golden = Math.PI * (3 - Math.sqrt(5));
        const y = count > 1 ? 1 - (i / (count - 1)) * 2 : 0;
        const r = Math.sqrt(Math.max(0, 1 - y * y));
        const theta = golden * i;

        return new THREE.Vector3(Math.cos(theta) * r, y, Math.sin(theta) * r).multiplyScalar(radius);
    }

    function clusterPoint(i, clusterCount, clusterRadius, spreadRadius, perCluster) {
        const clusterIndex = i % clusterCount;
        const withinCluster = Math.floor(i / clusterCount);
        const angle = (clusterIndex / clusterCount) * Math.PI * 2 - Math.PI / 2;
        const center = new THREE.Vector3(Math.cos(angle) * clusterRadius, Math.sin(angle) * clusterRadius, 0);

        return center.add(fibonacciPoint(withinCluster, perCluster, spreadRadius));
    }

    const FRAGMENT_COUNT = 60;
    const serviceCount = Math.max(1, document.querySelectorAll('[data-service-item]').length);
    const skillCount = Math.max(1, document.querySelectorAll('[data-skill-item]').length);

    const kfSphere = [];
    const kfServices = [];
    const kfSkills = [];

    for (let i = 0; i < FRAGMENT_COUNT; i += 1) {
        kfSphere.push(fibonacciPoint(i, FRAGMENT_COUNT, 1.0));
        kfServices.push(clusterPoint(i, serviceCount, 1.5, 0.26, Math.ceil(FRAGMENT_COUNT / serviceCount)));
        kfSkills.push(clusterPoint(i, skillCount, 1.7, 0.2, Math.ceil(FRAGMENT_COUNT / skillCount)));
    }

    // Reuses the sphere layout for the return leg too — fragments collapse
    // back toward the orb shape (invisible by then) rather than toward a
    // separate "work" particle layout, since cards take over visually.
    const formKeyframes = [kfSphere, kfServices, kfSkills, kfSphere];

    const fragmentGeometry = new THREE.SphereGeometry(0.045, 8, 8);
    const fragmentMaterial = new THREE.MeshBasicMaterial({
        color: new THREE.Color('#1557e8'),
        transparent: true,
        opacity: 0,
    });
    const fragments = new THREE.InstancedMesh(fragmentGeometry, fragmentMaterial, FRAGMENT_COUNT);
    fragments.visible = false;
    const fragmentDummy = new THREE.Object3D();
    sphere.add(fragments);

    // Services: thin spokes from the centre to each node — "one practice,
    // several services," not four disconnected dots.
    const serviceLinePositions = new Float32Array(serviceCount * 6);

    for (let c = 0; c < serviceCount; c += 1) {
        const angle = (c / serviceCount) * Math.PI * 2 - Math.PI / 2;
        const idx = c * 6;
        serviceLinePositions[idx] = 0;
        serviceLinePositions[idx + 1] = 0;
        serviceLinePositions[idx + 2] = 0;
        serviceLinePositions[idx + 3] = Math.cos(angle) * 1.5;
        serviceLinePositions[idx + 4] = Math.sin(angle) * 1.5;
        serviceLinePositions[idx + 5] = 0;
    }

    const serviceLineGeometry = new THREE.BufferGeometry();
    serviceLineGeometry.setAttribute('position', new THREE.BufferAttribute(serviceLinePositions, 3));
    const serviceLineMaterial = new THREE.LineBasicMaterial({
        color: new THREE.Color('#1557e8'),
        transparent: true,
        opacity: 0,
    });
    const serviceLines = new THREE.LineSegments(serviceLineGeometry, serviceLineMaterial);
    serviceLines.visible = false;
    sphere.add(serviceLines);

    // Skills: one ring threading through every facet — the same "many, one
    // practice" idea as the services spokes, drawn as a circle instead.
    const skillRingMaterial = new THREE.MeshBasicMaterial({
        color: new THREE.Color('#27c9f2'),
        transparent: true,
        opacity: 0,
    });
    const skillRing = new THREE.Mesh(new THREE.TorusGeometry(1.7, 0.004, 8, 64), skillRingMaterial);
    skillRing.visible = false;
    sphere.add(skillRing);

    // Work: one flat card per real project, fanned out like a hand of
    // cards, each labelled with that project's actual title.
    function makeCardTexture(title) {
        const cardCanvas = document.createElement('canvas');
        cardCanvas.width = 512;
        cardCanvas.height = 336;

        const ctx = cardCanvas.getContext('2d');
        const radius = 28;
        const w = cardCanvas.width;
        const h = cardCanvas.height;

        ctx.beginPath();
        ctx.moveTo(radius, 0);
        ctx.arcTo(w, 0, w, h, radius);
        ctx.arcTo(w, h, 0, h, radius);
        ctx.arcTo(0, h, 0, 0, radius);
        ctx.arcTo(0, 0, w, 0, radius);
        ctx.closePath();
        ctx.clip();

        const gradient = ctx.createLinearGradient(0, 0, w, h);
        gradient.addColorStop(0, 'rgba(21, 87, 232, 0.92)');
        gradient.addColorStop(1, 'rgba(39, 201, 242, 0.85)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, w, h);

        ctx.fillStyle = 'rgba(255, 255, 255, 0.97)';
        ctx.font = '600 34px ui-serif, Georgia, serif';
        ctx.textBaseline = 'top';

        const words = title.split(' ');
        let line = '';
        let y = 36;
        const maxWidth = w - 64;

        words.forEach((word) => {
            const test = line ? `${line} ${word}` : word;

            if (ctx.measureText(test).width > maxWidth && line) {
                ctx.fillText(line, 32, y);
                line = word;
                y += 42;
            } else {
                line = test;
            }
        });
        ctx.fillText(line, 32, y);

        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.font = '500 16px ui-monospace, Menlo, Consolas, monospace';
        ctx.fillText('SELECTED WORK', 32, h - 44);

        const texture = new THREE.CanvasTexture(cardCanvas);
        texture.anisotropy = renderer.capabilities.getMaxAnisotropy();

        return texture;
    }

    const workTitles = Array.from(document.querySelectorAll('[data-work-item]')).map(
        (el) => el.dataset.workTitle || 'Project'
    );

    if (!workTitles.length) {
        workTitles.push('Selected work');
    }

    const cardGeometry = new THREE.PlaneGeometry(1.3, 0.85);
    const workCards = workTitles.map((title, i) => {
        const material = new THREE.MeshBasicMaterial({
            map: makeCardTexture(title),
            transparent: true,
            opacity: 0,
        });
        const card = new THREE.Mesh(cardGeometry, material);
        const spread = workTitles.length > 1 ? (i / (workTitles.length - 1)) * 2 - 1 : 0;
        const angle = spread * 0.42;

        card.position.set(Math.sin(angle) * 1.55, -Math.sin(angle * 0.6) * 0.15, Math.cos(angle) * 0.15 - 0.15);
        card.rotation.z = angle * 0.55;
        card.rotation.y = angle * 0.35;
        card.visible = false;
        sphere.add(card);

        return card;
    });

    scene.add(sphere);

    const intro = { y: -3.4, scale: 0.72, rotZ: -0.5, opacity: 0 };
    const scrollTarget = { x: 0, y: 0, scale: 1, rotZ: 0, spike: 0, bands: 0, fade: 1, form: 0 };
    const scrollCurrent = { x: 0, y: 0, scale: 1, rotZ: 0, spike: 0, bands: 0, fade: 1, form: 0 };

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
                pose: adapt({ x: 1.62, y: 0, scale: 1, rotZ: 0, spike: 0, bands: 0, fade: 1, form: 0 }),
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
                    form: parseFloat(el.dataset.sphereForm || '0'),
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

        uniforms.uSpike.value = scrollCurrent.spike;

        // Explode & reassemble: a single continuous value drives everything
        // below — which shape the fragments are blending toward, and which
        // of the orb / fragments / cards gets to be visible right now.
        const formClamped = Math.max(0, Math.min(3, scrollCurrent.form));
        const orbVisible = 1 - smoothstep(0.0, 0.55, formClamped);
        const fragmentVisible = smoothstep(0.0, 0.4, formClamped) * (1 - smoothstep(2.6, 3.0, formClamped));
        const servicesWindow = smoothstep(0.55, 1.0, formClamped) * (1 - smoothstep(1.3, 1.75, formClamped));
        const skillsWindow = smoothstep(1.25, 1.7, formClamped) * (1 - smoothstep(2.3, 2.75, formClamped));
        const cardsVisible = smoothstep(2.6, 3.0, formClamped);

        uniforms.uGlobalAlpha.value = orbVisible;
        sphereMesh.visible = orbVisible > 0.01;

        const segIndex = Math.min(2, Math.floor(formClamped));
        const segT = formClamped - segIndex;
        const fromKf = formKeyframes[segIndex];
        const toKf = formKeyframes[segIndex + 1];

        for (let i = 0; i < FRAGMENT_COUNT; i += 1) {
            const a = fromKf[i];
            const b = toKf[i];
            fragmentDummy.position.set(a.x + (b.x - a.x) * segT, a.y + (b.y - a.y) * segT, a.z + (b.z - a.z) * segT);
            fragmentDummy.updateMatrix();
            fragments.setMatrixAt(i, fragmentDummy.matrix);
        }
        fragments.instanceMatrix.needsUpdate = true;
        fragmentMaterial.opacity = fragmentVisible * 0.95;
        fragments.visible = fragmentVisible > 0.01;

        serviceLineMaterial.opacity = servicesWindow * 0.5;
        serviceLines.visible = servicesWindow > 0.01;

        skillRingMaterial.opacity = skillsWindow * 0.35;
        skillRing.visible = skillsWindow > 0.01;
        skillRing.rotation.z += delta * 0.08;

        workCards.forEach((card) => {
            card.material.opacity = cardsVisible * 0.98;
            card.visible = cardsVisible > 0.01;
            card.scale.setScalar(0.82 + 0.18 * cardsVisible);
        });

        const bandOpacity = scrollCurrent.bands * scrollCurrent.fade * 0.92 * orbVisible;
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
            pivot.visible = orbVisible > 0.01;
            pivot.children.forEach((child) => {
                child.material.opacity = child.userData.baseOpacity * orbVisible;
            });
        });
        rings.forEach((ring) => {
            ring.rotation.z += delta * ring.userData.spin;
            ring.visible = orbVisible > 0.01;
            ring.material.opacity = ring.userData.baseOpacity * orbVisible;
        });

        sphere.position.x = scrollCurrent.x;
        sphere.position.y = scrollCurrent.y + intro.y;
        sphere.scale.setScalar(scrollCurrent.scale * intro.scale);
        sphere.rotation.z = scrollCurrent.rotZ + intro.rotZ;
        sphereMesh.rotation.y += delta * 0.18;

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
