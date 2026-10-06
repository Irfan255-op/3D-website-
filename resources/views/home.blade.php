@extends('layouts.app')

@section('title', 'Full Stack Developer in Thane | Laravel, PHP & TailwindCSS')
@section('description', 'Freelance full-stack developer building fast, scalable web applications and APIs with Laravel, PHP, MySQL, and TailwindCSS.')

@php
    $skills = [
        ['title' => 'Laravel & PHP', 'description' => 'Robust backends, clean architecture, and RESTful APIs built to scale.'],
        ['title' => 'Real-time & WebSockets', 'description' => 'LiveKit (WebRTC) and Laravel Reverb for low-latency streaming and live chat.'],
        ['title' => 'MySQL & REST APIs', 'description' => 'Schema design, query optimization, and documented APIs for mobile parity.'],
        ['title' => 'Payments & Webhooks', 'description' => 'Razorpay and Paystack integrations with automated subscription billing.'],
        ['title' => 'TailwindCSS & Vite', 'description' => 'Pixel-perfect, responsive interfaces with lean, fast-loading assets.'],
        ['title' => 'Vanilla JavaScript', 'description' => 'Interactive, dependency-free front ends that stay fast on any device.'],
        ['title' => 'GSAP & Motion Design', 'description' => 'Scroll-driven animation, custom easing, and interactive 3D/WebGL built with GSAP and Three.js.'],
    ];

    $services = [
        [
            'title' => 'Web Application Development',
            'description' => 'Full-stack Laravel and PHP applications with clean architecture, RESTful APIs, and MySQL data layers built to scale.',
            'tags' => ['Laravel', 'PHP', 'MySQL', 'REST API'],
        ],
        [
            'title' => 'Real-Time & Streaming Infrastructure',
            'description' => 'Low-latency audio and chat features using WebRTC and WebSockets &mdash; co-host workflows, live reactions, session recording.',
            'tags' => ['LiveKit', 'WebRTC', 'Laravel Reverb'],
        ],
        [
            'title' => 'Payments & Subscription Systems',
            'description' => 'Checkout integrations with automated billing, webhook-driven access control, and plan-based feature gating.',
            'tags' => ['Razorpay', 'Paystack', 'Webhooks'],
        ],
        [
            'title' => 'Frontend & UI Development',
            'description' => 'Responsive, fast-loading interfaces built with TailwindCSS and dependency-free JavaScript, tuned for real devices.',
            'tags' => ['TailwindCSS', 'Vite', 'JavaScript'],
        ],
    ];

    // "How we'll work" — the Contact section's what-happens-next. Process
    // description, not a claim about past results; edit freely.
    $process = [
        ['title' => 'Discover', 'description' => 'A short call to understand your goals, your users and your constraints.'],
        ['title' => 'Plan', 'description' => 'Clear scope, architecture and a realistic timeline before any code is written.'],
        ['title' => 'Build', 'description' => 'Iterative delivery with regular check-ins, so nothing arrives as a surprise.'],
        ['title' => 'Launch', 'description' => 'Deploy, monitor and keep improving once real users arrive.'],
    ];
@endphp

@section('content')
    {{-- The stage background, including the WebGL sphere canvas, now renders
         via the shared layout (kept as true siblings for correct z-index
         stacking — see layouts/app.blade.php). --}}
    <nav class="chapter-rail" aria-label="Section progress">
        {{-- Overall page progress: a hairline beside the numbers that fills
             top-to-bottom off --scroll-progress (set every frame in app.js). --}}
        <span class="chapter-rail__track" aria-hidden="true"></span>
        <a href="#top" data-rail="0">00</a>
        <a href="#about" data-rail="1">01</a>
        <a href="#services" data-rail="2">02</a>
        <a href="#skills" data-rail="3">03</a>
        <a href="#work" data-rail="4">04</a>
        <a href="#start" data-rail="5">05</a>
    </nav>

    <p class="section-caption is-cue" id="section-caption">Scroll to explore</p>

    <button type="button" class="motion-toggle" id="motion-toggle" aria-pressed="false">&#9208; Pause motion</button>

    {{-- One-time nudge that the orb is interactive. Positioned beside it and
         removed for good after it's seen or acted on (initOrbHint). --}}
    <p class="orb-hint" id="orb-hint" aria-hidden="true"></p>

    <x-section bleed id="top" data-sphere-hero data-sphere-mood="#8a8c94" class="relative min-h-[88vh] sm:min-h-[92vh]">
        <div class="relative z-10 flex min-h-[88vh] items-center px-6 py-24 sm:min-h-[92vh] sm:px-8 lg:px-16">
            <div data-hero-content class="w-full max-w-2xl text-center lg:text-left">
                <p data-animate class="font-mono text-sm font-medium uppercase tracking-widest text-slate-500">A journey of clean, purposeful code</p>
                <h1 data-animate data-lens-text class="relative mt-4 font-serif text-[2.75rem] font-medium leading-[1.02] tracking-tight text-slate-900 sm:text-6xl xl:text-7xl">
                    <span>Minimal design, <em class="italic">maximum</em> impact</span>
                    <span aria-hidden="true" data-lens-layer class="pointer-events-none absolute inset-0 mix-blend-multiply text-red-500" style="clip-path: circle(0px at 0px 0px); transform: translateX(-3px);">Minimal design, <em class="italic">maximum</em> impact</span>
                    <span aria-hidden="true" data-lens-layer class="pointer-events-none absolute inset-0 mix-blend-multiply text-brand-500" style="clip-path: circle(0px at 0px 0px); transform: translateX(3px);">Minimal design, <em class="italic">maximum</em> impact</span>
                </h1>
                <p data-animate class="mx-auto mt-6 max-w-xl text-lg text-slate-600 lg:mx-0">
                    I build clean, scalable web applications that cut through the noise &mdash; shipped with Laravel, PHP, and TailwindCSS.
                </p>

                <div data-animate class="mt-6 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 font-mono text-xs uppercase tracking-wide text-slate-500 lg:justify-start">
                    <span class="inline-flex items-center gap-2 text-slate-700"><span class="status-dot" aria-hidden="true"></span>Available for freelance work</span>
                    <span aria-hidden="true">&middot;</span>
                    <span>Based in Mumbra, Maharashtra</span>
                    @if ($projectCount > 0)
                        <span aria-hidden="true">&middot;</span>
                        <span>{{ $projectCount }} {{ Str::plural('project', $projectCount) }} shipped</span>
                    @endif
                </div>

                <div data-animate class="mt-8 flex flex-wrap items-center justify-center gap-4 lg:justify-start">
                    <a href="{{ route('contact') }}" data-magnetic class="rounded-full bg-brand-600 px-7 py-3 text-sm font-semibold text-white transition hover:bg-brand-700">
                        Start a project
                    </a>
                    <a href="#work" class="text-sm font-semibold text-slate-700 hover:text-brand-600">
                        View my work <span aria-hidden="true">&darr;</span>
                    </a>
                </div>
            </div>
        </div>
    </x-section>

    <x-section
        bleed
        id="about"
        class="stage-section"
        data-caption="The developer"
        data-sphere-x="-2.15"
        data-sphere-y="0.2"
        data-sphere-scale="1.55"
        data-sphere-rot="0.35"
        data-sphere-spike="1"
        data-sphere-bands="0"
        data-sphere-mood="#7e8088"
    >
        <span class="section-numeral" aria-hidden="true">01</span>

        <div data-animate class="stage-card" data-side="right">
            <p class="section-eyebrow">The developer</p>
            <h2 data-scramble data-melt class="section-title mt-4">Hi, I'm Shaikh Shoeb Akhtar</h2>
            <p class="mt-5 text-slate-600">
                A full-stack developer specializing in responsive, scalable applications for startups and businesses &mdash; from real-time infrastructure and API architecture to the pixel-level details of the interface.
                I work directly with clients to turn ideas into production-ready products.
            </p>
            <a href="{{ route('contact') }}" class="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-900 hover:text-brand-600">
                Get in touch
                <svg aria-hidden="true" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
            </a>
        </div>
    </x-section>

    <x-section
        bleed
        id="services"
        class="stage-section"
        data-caption="What I offer"
        data-sphere-x="2.15"
        data-sphere-y="-0.15"
        data-sphere-scale="1.6"
        data-sphere-rot="-0.4"
        data-sphere-spike="0"
        data-sphere-bands="1"
        data-sphere-mood="#93959b"
    >
        <span class="section-numeral" aria-hidden="true">02</span>

        {{-- Nothing is boxed in a panel any more, so this section is no
             longer the exception it once was — it just runs wider. --}}
        <div data-animate class="stage-card stage-card--wide">
            <p class="section-eyebrow">What I offer</p>
            <h2 data-scramble data-melt class="section-title mt-4">Services</h2>

            {{-- An exclusive accordion (shared `name`: opening one closes the
                 others) built on native <details>, so it's keyboard- and
                 screen-reader-correct for free. The open/close height
                 animation is pure CSS (::details-content + interpolate-size,
                 in app.css); browsers without it just toggle instantly. --}}
            <div class="mt-6 border-b border-slate-900/10" data-stagger>
                @foreach ($services as $service)
                    <details class="service-item" name="services" data-accordion @if ($loop->first) open @endif>
                        <summary class="service-summary">
                            <span class="service-index" aria-hidden="true">{{ sprintf('%02d', $loop->iteration) }}</span>
                            <h3 class="flex-1 font-semibold text-slate-900">{{ $service['title'] }}</h3>
                            <span class="service-toggle" aria-hidden="true"></span>
                        </summary>
                        <div class="service-body">
                            <p class="text-sm leading-relaxed text-slate-600">{!! $service['description'] !!}</p>
                            <ul class="mt-3 flex flex-wrap gap-2">
                                @foreach ($service['tags'] as $tag)
                                    <li class="tag-pill">{{ $tag }}</li>
                                @endforeach
                            </ul>
                        </div>
                    </details>
                @endforeach
            </div>
        </div>
    </x-section>

    <x-section
        bleed
        id="skills"
        class="stage-section"
        data-caption="Tools &amp; stack"
        data-sphere-x="-2.1"
        data-sphere-y="0.25"
        data-sphere-scale="1.5"
        data-sphere-rot="0.5"
        data-sphere-spike="0"
        data-sphere-bands="0"
        data-sphere-gem="1"
        data-sphere-mood="#6e707a"
    >
        <span class="section-numeral" aria-hidden="true">03</span>

        {{-- Two columns rather than one, so the stack reads as a list beside
             its explanation instead of another single-column card. --}}
        <div data-animate class="stage-card stage-card--split" data-side="right">
            <p class="section-eyebrow">Core skills</p>
            <h2 data-scramble data-melt class="section-title mt-4">Tools I build with</h2>

            <div class="stage-card__columns">
                <ul class="flex flex-wrap content-start gap-2" data-stagger>
                    @foreach ($skills as $skill)
                        <li
                            class="tag-pill cursor-default outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
                            data-skill-index="{{ $loop->index }}"
                        >{{ $skill['title'] }}</li>
                    @endforeach
                </ul>

                <p class="text-slate-600">
                    A focused stack, used deeply &mdash; LiveKit and Laravel Reverb for low-latency streaming, Razorpay and Paystack for billing, and dependency-free front ends that stay fast on any device.
                </p>
            </div>
        </div>
    </x-section>

    <x-section
        bleed
        id="work"
        class="stage-section"
        data-caption="Selected work"
        data-sphere-x="2.1"
        data-sphere-y="-0.2"
        data-sphere-scale="1.6"
        data-sphere-rot="0"
        data-sphere-spike="0"
        data-sphere-bands="0"
        data-sphere-discs="1"
        data-sphere-mood="#9a9c9f"
    >
        <span class="section-numeral" aria-hidden="true">04</span>

        <div data-animate class="stage-card">
            <p class="section-eyebrow">Selected work</p>
            <h2 data-scramble data-melt class="section-title mt-4">The digital experiences</h2>

            @if ($projects->isEmpty())
                <p class="mt-6 text-slate-500">Case studies are coming soon.</p>
            @else
                <div class="mt-6 divide-y divide-slate-900/10 border-y border-slate-900/10" data-stagger>
                    @foreach ($projects as $project)
                        <a
                            href="{{ route('work.show', $project) }}"
                            data-cursor-text="View"
                            @if ($project->image) data-shot="{{ Storage::url($project->image) }}" @endif
                            class="work-row group"
                        >
                            <span class="work-row__index" aria-hidden="true">{{ sprintf('%02d', $loop->iteration) }}</span>
                            <div class="min-w-0 flex-1">
                                <h3 class="font-serif text-lg font-medium text-slate-900 transition-colors duration-300 group-hover:text-brand-700">
                                    {{ $project->title }}
                                </h3>
                                <p class="mt-1 truncate font-mono text-[11px] uppercase tracking-wide text-slate-500" title="{{ $project->tech_stack }}">{{ $project->tech_stack }}</p>
                            </div>
                            <svg aria-hidden="true" class="work-row__arrow" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" />
                            </svg>
                        </a>
                    @endforeach
                </div>
            @endif

            <a href="{{ route('work.index') }}" data-magnetic class="mt-7 inline-flex rounded-full border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-brand-600 hover:text-brand-600">
                View all projects
            </a>
        </div>
    </x-section>

    <x-section
        bleed
        id="start"
        class="stage-section"
        data-caption="Let's build"
        data-sphere-x="-2.05"
        data-sphere-y="0.1"
        data-sphere-scale="1.5"
        data-sphere-rot="0.3"
        data-sphere-spike="0"
        data-sphere-bands="0"
        data-sphere-beacon="1"
        data-sphere-mood="#aeb0b6"
    >
        <span class="section-numeral" aria-hidden="true">05</span>

        <div data-animate class="stage-card" data-side="right">
            <p class="section-eyebrow">Let's build</p>
            <h2 data-scramble data-melt class="section-title mt-4">Have a project in mind?</h2>
            <p class="mt-5 text-slate-600">
                Tell me what you're building and I'll come back with next steps &mdash; usually within a day.
            </p>

            <p class="mt-7 font-mono text-[11px] uppercase tracking-[0.14em] text-slate-500">How we'll work</p>
            {{-- The connector line (::before track / ::after fill) draws
                 itself as you scroll through the list, driven by a
                 --process-progress custom property from app.js; each step's
                 marker lights up as the line reaches it. --}}
            <ol class="process" data-process data-stagger>
                @foreach ($process as $step)
                    <li class="process__step" data-process-step>
                        <span class="process__dot" aria-hidden="true">{{ $loop->iteration }}</span>
                        <h3 class="font-semibold text-slate-900">{{ $step['title'] }}</h3>
                        <p class="mt-0.5 text-sm leading-relaxed text-slate-600">{{ $step['description'] }}</p>
                    </li>
                @endforeach
            </ol>

            <a href="{{ route('contact') }}" data-magnetic class="mt-8 inline-flex items-center gap-2 rounded-full bg-brand-600 px-7 py-3 text-sm font-semibold text-white transition hover:bg-brand-700">
                Start a project
                <svg aria-hidden="true" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
            </a>
        </div>
    </x-section>

    {{-- Finale: every shape from the journey streams together into the 3D
         shaikh.labs mark — the particle swarm's last morph (app.js). A
         waypoint with no card: the mark is the content. Hidden under
         reduced motion (app.css) and removed if WebGL fails to load, since
         without the scene it would be an empty band. --}}
    <x-section
        bleed
        id="finale"
        class="stage-section finale"
        data-caption="Thanks for scrolling"
        data-sphere-x="0"
        data-sphere-y="0.12"
        data-sphere-scale="1.7"
        data-sphere-rot="0"
        data-sphere-spike="0"
        data-sphere-bands="0"
        data-sphere-logo="1"
        data-sphere-mood="#8a8c94"
    >
        <p data-animate class="finale__colophon">shaikh.labs &mdash; designed &amp; built from scratch with Laravel, GSAP &amp; Three.js</p>
    </x-section>
@endsection
