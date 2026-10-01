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
@endphp

@section('content')
    {{-- The stage: ambient wash, drifting blobs, the WebGL sphere, and grain.
         All fixed, all behind <main>, which carries its own stacking context. --}}
    <div aria-hidden="true" class="stage-wash"></div>
    <div aria-hidden="true" class="stage-ambient"></div>
    <div aria-hidden="true" class="stage-blob stage-blob--a"></div>
    <div aria-hidden="true" class="stage-blob stage-blob--b"></div>
    <canvas id="hero-sphere" aria-hidden="true" class="stage-canvas"></canvas>
    <div aria-hidden="true" class="stage-grain"></div>

    <nav class="chapter-rail" aria-label="Section progress">
        <a href="#top" data-rail="0">00</a>
        <a href="#about" data-rail="1">01</a>
        <a href="#services" data-rail="2">02</a>
        <a href="#skills" data-rail="3">03</a>
        <a href="#work" data-rail="4">04</a>
        <a href="#start" data-rail="5">05</a>
    </nav>

    <p class="section-caption" id="section-caption">A journey of clean, purposeful code</p>

    <button type="button" class="motion-toggle" id="motion-toggle" aria-pressed="false">&#9208; Pause motion</button>

    <x-section bleed id="top" data-sphere-hero class="relative min-h-[88vh] sm:min-h-[92vh]">
        <div class="relative z-10 flex min-h-[88vh] items-center px-6 py-24 sm:min-h-[92vh] sm:px-8 lg:px-16">
            <div class="w-full max-w-2xl text-center lg:text-left">
                <p data-animate class="font-mono text-sm font-medium uppercase tracking-widest text-slate-500">A journey of clean, purposeful code</p>
                <h1 data-animate data-lens-text class="relative mt-4 font-serif text-4xl font-medium leading-[1.05] tracking-tight text-slate-900 sm:text-6xl">
                    <span>Minimal design, <em class="italic">maximum</em> impact</span>
                    <span aria-hidden="true" data-lens-layer class="pointer-events-none absolute inset-0 mix-blend-multiply text-red-500" style="clip-path: circle(0px at 0px 0px); transform: translateX(-3px);">Minimal design, <em class="italic">maximum</em> impact</span>
                    <span aria-hidden="true" data-lens-layer class="pointer-events-none absolute inset-0 mix-blend-multiply text-brand-500" style="clip-path: circle(0px at 0px 0px); transform: translateX(3px);">Minimal design, <em class="italic">maximum</em> impact</span>
                </h1>
                <p data-animate class="mx-auto mt-6 max-w-xl text-lg text-slate-600 lg:mx-0">
                    I build clean, scalable web applications that cut through the noise &mdash; shipped with Laravel, PHP, and TailwindCSS.
                </p>

                <div data-animate class="mt-6 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 font-mono text-xs uppercase tracking-wide text-slate-500 lg:justify-start">
                    <span>Available for freelance work</span>
                    <span aria-hidden="true">&middot;</span>
                    <span>Based in Mumbra, Maharashtra</span>
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
        data-sphere-x="-1.62"
        data-sphere-y="0.2"
        data-sphere-scale="0.95"
        data-sphere-rot="0.35"
        data-sphere-spike="1"
        data-sphere-bands="0"
    >
        <div data-animate class="stage-card" data-side="right">
            <p class="font-mono text-xs uppercase tracking-[0.14em] text-brand-600">01 &mdash; The developer</p>
            <h2 data-scramble class="mt-3 font-serif text-4xl font-medium text-slate-900 sm:text-5xl">Hi, I'm Shaikh Shoeb Akhtar</h2>
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
        data-sphere-x="1.62"
        data-sphere-y="-0.15"
        data-sphere-scale="1.05"
        data-sphere-rot="-0.4"
        data-sphere-spike="0"
        data-sphere-bands="1"
    >
        <div data-animate class="stage-card">
            <p class="font-mono text-xs uppercase tracking-[0.14em] text-brand-600">02 &mdash; What I offer</p>
            <h2 data-scramble class="mt-3 font-serif text-4xl font-medium text-slate-900 sm:text-5xl">Services</h2>

            <div class="mt-6 grid gap-5">
                @foreach ($services as $service)
                    <div class="border-t border-slate-200 pt-4">
                        <h3 class="font-semibold text-slate-900">{{ $service['title'] }}</h3>
                        <p class="mt-1 text-sm leading-relaxed text-slate-600">{!! $service['description'] !!}</p>
                        <ul class="mt-3 flex flex-wrap gap-2">
                            @foreach ($service['tags'] as $tag)
                                <li class="rounded-full bg-brand-50 px-3 py-1 font-mono text-[11px] uppercase tracking-wide text-brand-600 ring-1 ring-brand-100">{{ $tag }}</li>
                            @endforeach
                        </ul>
                    </div>
                @endforeach
            </div>
        </div>
    </x-section>

    <x-section
        bleed
        id="skills"
        class="stage-section"
        data-caption="Tools &amp; stack"
        data-sphere-x="-1.58"
        data-sphere-y="0.25"
        data-sphere-scale="0.92"
        data-sphere-rot="0.5"
        data-sphere-spike="0.5"
        data-sphere-bands="0"
    >
        <div data-animate class="stage-card" data-side="right">
            <p class="font-mono text-xs uppercase tracking-[0.14em] text-brand-600">03 &mdash; Core skills</p>
            <h2 data-scramble class="mt-3 font-serif text-4xl font-medium text-slate-900 sm:text-5xl">Tools I build with</h2>

            <ul class="mt-6 flex flex-wrap gap-2">
                @foreach ($skills as $skill)
                    <li class="rounded-full border border-brand-100 bg-brand-50 px-3 py-1.5 font-mono text-[11px] uppercase tracking-wide text-brand-600">
                        {{ $skill['title'] }}
                    </li>
                @endforeach
            </ul>

            <p class="mt-5 text-slate-600">
                A focused stack, used deeply &mdash; LiveKit and Laravel Reverb for low-latency streaming, Razorpay and Paystack for billing, and dependency-free front ends that stay fast on any device.
            </p>
        </div>
    </x-section>

    <x-section
        bleed
        id="work"
        class="stage-section"
        data-caption="Selected work"
        data-sphere-x="1.6"
        data-sphere-y="-0.2"
        data-sphere-scale="1.02"
        data-sphere-rot="-0.5"
        data-sphere-spike="0"
        data-sphere-bands="1"
    >
        <div data-animate class="stage-card">
            <p class="font-mono text-xs uppercase tracking-[0.14em] text-brand-600">04 &mdash; Selected work</p>
            <h2 data-scramble class="mt-3 font-serif text-4xl font-medium text-slate-900 sm:text-5xl">The digital experiences</h2>

            @if ($projects->isEmpty())
                <p class="mt-6 text-slate-500">Case studies are coming soon.</p>
            @else
                <div class="mt-6 grid gap-5">
                    @foreach ($projects as $project)
                        <a href="{{ route('work.show', $project) }}" data-cursor-text="View" class="group block border-t border-slate-200 pt-4">
                            <div class="flex items-baseline gap-3">
                                <span class="font-mono text-xs text-slate-300">{{ sprintf('%02d', $loop->iteration) }}</span>
                                <h3 class="font-serif text-lg font-medium text-slate-900 transition group-hover:text-brand-600">
                                    {{ $project->title }}
                                </h3>
                            </div>
                            <p class="mt-1 font-mono text-[11px] uppercase tracking-wide text-slate-400">{{ $project->tech_stack }}</p>
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
        data-sphere-x="-1.55"
        data-sphere-y="0.1"
        data-sphere-scale="0.98"
        data-sphere-rot="0.3"
        data-sphere-spike="0"
        data-sphere-bands="0"
    >
        <div data-animate class="stage-card" data-side="right">
            <p class="font-mono text-xs uppercase tracking-[0.14em] text-brand-600">05 &mdash; Let's build</p>
            <h2 data-scramble class="mt-3 font-serif text-4xl font-medium text-slate-900 sm:text-5xl">Have a project in mind?</h2>
            <p class="mt-5 text-slate-600">
                Tell me what you're building and I'll come back with next steps &mdash; usually within a day.
            </p>
            <a href="{{ route('contact') }}" data-magnetic class="mt-6 inline-flex rounded-full bg-brand-600 px-7 py-3 text-sm font-semibold text-white transition hover:bg-brand-700">
                Start a project
            </a>
        </div>
    </x-section>
@endsection
