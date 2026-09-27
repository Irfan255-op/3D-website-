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
                scale: 0.92,
                y: 16,
                duration: 0.45,
                ease: 'back.out(1.4)',
                stagger: isGrid
                    ? { each: 0.06, from: 'start', grid: 'auto' }
                    : { each: 0.06, from: 'start' },
                scrollTrigger: {
                    trigger: group,
                    start: 'top 85%',
                    once: true,
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
            { opacity: 0, y: 24 },
            {
                opacity: 1,
                y: 0,
                duration: 0.7,
                ease: 'power2.out',
                scrollTrigger: {
                    trigger: el,
                    start: 'top 85%',
                    once: true,
                },
            }
        );
    });
}

function initHeroShader() {
    if (prefersReducedMotion) {
        return;
    }

    const canvas = document.getElementById('hero-shader');

    if (!canvas) {
        return;
    }

    import('shaders/js')
        .then(({ createShader }) =>
            createShader(canvas, {
                components: [
                    {
                        type: 'MeshGradient',
                        props: {
                            colorA: '#f8fafc',
                            colorB: '#e0e7ff',
                            count: 4,
                            smoothness: 3,
                            swirl: 0.2,
                            drift: 0.3,
                            speed: 0.3,
                        },
                    },
                ],
            })
        )
        .catch((error) => console.error('Hero shader failed to load:', error));
}

function initStatsCounters() {
    const counters = document.querySelectorAll('[data-counter]');

    if (!counters.length) {
        return;
    }

    if (prefersReducedMotion) {
        counters.forEach((el) => {
            el.textContent = Number(el.dataset.target).toLocaleString();
        });

        return;
    }

    counters.forEach((el) => {
        const target = Number(el.dataset.target);
        const counter = { value: 0 };

        gsap.to(counter, {
            value: target,
            duration: 1.5,
            ease: 'power2.out',
            onUpdate: () => {
                el.textContent = Math.round(counter.value).toLocaleString();
            },
            scrollTrigger: {
                trigger: el,
                start: 'top 85%',
                once: true,
            },
        });
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

function initServicesCarousel() {
    const carousel = document.querySelector('[data-services-carousel]');
    const panels = carousel?.querySelectorAll('[data-service-panel]');
    const prevBtn = carousel?.querySelector('[data-service-prev]');
    const nextBtn = carousel?.querySelector('[data-service-next]');

    if (!carousel || !panels?.length || panels.length < 2 || !prevBtn || !nextBtn) {
        return;
    }

    let active = 0;

    const show = (index) => {
        panels.forEach((panel, i) => panel.classList.toggle('hidden', i !== index));

        if (!prefersReducedMotion) {
            gsap.fromTo(panels[index], { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' });
        }
    };

    prevBtn.addEventListener('click', () => {
        active = (active - 1 + panels.length) % panels.length;
        show(active);
    });

    nextBtn.addEventListener('click', () => {
        active = (active + 1) % panels.length;
        show(active);
    });
}

function initSkillsCarousel() {
    const section = document.querySelector('[data-pin-section]');
    const viewport = section?.querySelector('[data-carousel-viewport]');
    const track = section?.querySelector('[data-carousel-track]');
    const dots = section?.querySelectorAll('[data-dot]');

    if (!section || !viewport || !track || prefersReducedMotion) {
        return;
    }

    const cards = track.children;

    if (cards.length < 2) {
        return;
    }

    const mm = gsap.matchMedia();

    mm.add('(min-width: 1024px)', () => {
        viewport.classList.remove('overflow-x-auto');
        viewport.classList.add('overflow-hidden');

        const getScrollDistance = () => track.scrollWidth - viewport.clientWidth;

        const tween = gsap.to(track, {
            x: () => -getScrollDistance(),
            ease: 'none',
            scrollTrigger: {
                trigger: section,
                start: 'top top',
                end: () => '+=' + getScrollDistance(),
                scrub: 1,
                pin: true,
                invalidateOnRefresh: true,
                onUpdate: (self) => {
                    const activeIndex = Math.round(self.progress * (cards.length - 1));

                    dots?.forEach((dot, i) => {
                        dot.classList.toggle('bg-blue-600', i === activeIndex);
                        dot.classList.toggle('bg-slate-200', i !== activeIndex);
                    });
                },
            },
        });

        return () => {
            tween.scrollTrigger?.kill();
            tween.kill();
            gsap.set(track, { clearProps: 'transform' });
            viewport.classList.add('overflow-x-auto');
            viewport.classList.remove('overflow-hidden');
        };
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
    initSmoothScroll();
    initNav();
    initScrollReveal();
    initHeroShader();
    initHeroLens();
    initStatsCounters();
    initServicesCarousel();
    initSkillsCarousel();
    initFormSubmitGuard();
    initFocusFirstError();

    if ('fonts' in document) {
        document.fonts.ready.then(() => ScrollTrigger.refresh());
    }
});
