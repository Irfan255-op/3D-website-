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

    $testimonials = [
        ['quote' => 'Placeholder testimonial — swap in real client feedback once your first few projects wrap up.', 'role' => 'Startup Founder'],
        ['quote' => 'Placeholder testimonial — swap in real client feedback once your first few projects wrap up.', 'role' => 'Product Manager'],
        ['quote' => 'Placeholder testimonial — swap in real client feedback once your first few projects wrap up.', 'role' => 'Small Business Owner'],
    ];
@endphp

@section('content')
    <x-section class="pt-16 pb-20 sm:pt-20">
        <div class="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
            <div class="text-center lg:text-left">
                <p data-animate class="font-mono text-sm font-medium uppercase tracking-widest text-slate-400">A journey of clean, purposeful code</p>
                <h1 data-animate data-lens-text class="relative mt-4 font-serif text-4xl font-medium leading-[1.05] tracking-tight text-slate-900 sm:text-6xl">
                    <span>Minimal design, <em class="italic">maximum</em> impact</span>
                    <span aria-hidden="true" data-lens-layer class="pointer-events-none absolute inset-0 mix-blend-multiply text-red-500" style="clip-path: circle(0px at 0px 0px); transform: translateX(-3px);">Minimal design, <em class="italic">maximum</em> impact</span>
                    <span aria-hidden="true" data-lens-layer class="pointer-events-none absolute inset-0 mix-blend-multiply text-blue-500" style="clip-path: circle(0px at 0px 0px); transform: translateX(3px);">Minimal design, <em class="italic">maximum</em> impact</span>
                </h1>
                <p data-animate class="mx-auto mt-6 max-w-xl text-lg text-slate-600 lg:mx-0">
                    I build clean, scalable web applications that cut through the noise &mdash; shipped with Laravel, PHP, and TailwindCSS.
                </p>

                <div data-animate class="mt-6 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 font-mono text-xs uppercase tracking-wide text-slate-400 lg:justify-start">
                    <span>Available for freelance work</span>
                    <span aria-hidden="true">&middot;</span>
                    <span>Based in Mumbra, Maharashtra</span>
                </div>

                <div data-animate class="mt-8 flex flex-wrap items-center justify-center gap-4 lg:justify-start">
                    <a href="{{ route('contact') }}" class="rounded-full bg-blue-600 px-7 py-3 text-sm font-semibold text-white transition hover:bg-blue-700">
                        Start a project
                    </a>
                    <a href="#work" class="text-sm font-semibold text-slate-700 hover:text-blue-600">
                        View my work <span aria-hidden="true">&darr;</span>
                    </a>
                </div>
            </div>

            <div data-animate class="relative aspect-[4/5] w-full overflow-hidden rounded-2xl sm:aspect-[16/10] lg:aspect-[4/5]">
                <canvas id="hero-shader" aria-hidden="true" class="pointer-events-none absolute inset-0 h-full w-full"></canvas>
                <div aria-hidden="true" class="pointer-events-none absolute inset-0 bg-white/20 backdrop-blur-xl"></div>
            </div>
        </div>
    </x-section>

    <x-section bleed class="overflow-hidden border-y border-slate-200 bg-slate-950 py-8">
        <div class="flex w-max animate-marquee items-center gap-10 whitespace-nowrap">
            @for ($i = 0; $i < 2; $i++)
                @foreach (['Building APIs', 'Shipping products', 'Solving problems', 'Writing clean code'] as $phrase)
                    <span class="font-serif text-2xl font-medium text-white/90">{{ $phrase }}</span>
                    <span aria-hidden="true" class="text-2xl text-white/30">&#10022;</span>
                @endforeach
            @endfor
        </div>
    </x-section>

    <x-section id="about">
        <div class="grid gap-12 md:grid-cols-2 md:items-center md:gap-16">
            <div data-animate>
                <x-eyebrow>The developer</x-eyebrow>
                <h2 class="mt-4 font-serif text-3xl font-medium text-slate-900 sm:text-4xl">
                    Hi, I'm Shaikh Shoeb Akhtar
                </h2>
                <p class="mt-6 text-slate-600">
                    A full-stack developer specializing in responsive, scalable applications for startups and businesses &mdash; from real-time infrastructure and API architecture to the pixel-level details of the interface.
                    I work directly with clients to turn ideas into production-ready products.
                </p>
                <a href="{{ route('contact') }}" class="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-900 hover:text-blue-600">
                    Get in touch
                    <svg aria-hidden="true" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                </a>
            </div>

            <x-media-placeholder data-animate :seed="2" class="aspect-square w-full rounded-2xl md:aspect-[4/5]" />
        </div>
    </x-section>

    <x-section id="services" class="relative border-t border-slate-200 bg-slate-50">
        <div data-animate class="text-center">
            <x-eyebrow>What I offer</x-eyebrow>
            <h2 class="mt-4 font-serif text-3xl font-medium text-slate-900 sm:text-4xl">Services</h2>
        </div>

        <div class="relative mt-16" data-services-carousel>
            @foreach ($services as $index => $service)
                <div class="grid gap-10 lg:grid-cols-2 lg:items-center {{ $index === 0 ? '' : 'hidden' }}" data-service-panel>
                    <div>
                        <p class="font-mono text-sm text-slate-400">
                            {{ sprintf('%02d', $index + 1) }} / {{ sprintf('%02d', count($services)) }}
                        </p>
                        <h3 class="mt-4 font-serif text-3xl font-medium text-slate-900">{{ $service['title'] }}</h3>
                        <p class="mt-4 max-w-md text-slate-600">{!! $service['description'] !!}</p>
                        <ul class="mt-6 flex flex-wrap gap-2">
                            @foreach ($service['tags'] as $tag)
                                <li class="rounded-full bg-white px-3 py-1 font-mono text-xs text-slate-600 ring-1 ring-slate-200">{{ $tag }}</li>
                            @endforeach
                        </ul>
                    </div>

                    <div class="relative mx-auto w-full max-w-md">
                        <div aria-hidden="true" class="absolute -right-4 -bottom-4 h-full w-full rounded-2xl bg-blue-100"></div>
                        <x-media-placeholder :seed="$index + 10" :label="$service['title']" class="relative aspect-[4/3] w-full rounded-2xl shadow-lg" />
                    </div>
                </div>
            @endforeach

            <div class="mt-10 flex justify-center gap-3 lg:justify-start">
                <button type="button" class="flex h-11 w-11 items-center justify-center rounded-md border border-slate-300 text-slate-500 transition hover:border-blue-600 hover:text-blue-600" data-service-prev aria-label="Previous service">
                    <svg aria-hidden="true" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
                    </svg>
                </button>
                <button type="button" class="flex h-11 w-11 items-center justify-center rounded-md border border-slate-300 text-slate-500 transition hover:border-blue-600 hover:text-blue-600" data-service-next aria-label="Next service">
                    <svg aria-hidden="true" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                </button>
            </div>
        </div>
    </x-section>

    <x-section id="work" class="border-t border-slate-200 bg-slate-50">
        <div data-animate class="text-center">
            <x-eyebrow>Selected work</x-eyebrow>
            <h2 class="mt-4 font-serif text-3xl font-medium text-slate-900 sm:text-4xl">The digital experiences</h2>
        </div>

        @if ($projects->isEmpty())
            <p class="mt-10 text-center text-slate-500">Case studies are coming soon.</p>
        @else
            <div data-animate-group class="relative mt-16 border-t border-slate-200">
                @foreach ($projects as $project)
                    <a
                        data-animate
                        href="{{ route('work.show', $project) }}"
                        class="group relative flex items-center justify-between gap-6 border-b border-slate-200 py-7 transition hover:bg-white sm:py-8"
                    >
                        <div class="flex min-w-0 items-baseline gap-4 sm:gap-6">
                            <span class="font-mono text-sm text-slate-300">{{ sprintf('%02d', $loop->iteration) }}</span>
                            <h3 class="truncate font-serif text-xl font-medium text-slate-900 transition group-hover:text-blue-600 sm:text-3xl">
                                {{ $project->title }}
                            </h3>
                        </div>

                        <div class="hidden shrink-0 font-mono text-xs uppercase tracking-wide text-slate-400 lg:block">
                            {{ $project->tech_stack }}
                        </div>

                        <span class="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-slate-300 text-slate-400 transition group-hover:border-blue-600 group-hover:bg-blue-600 group-hover:text-white">
                            <svg aria-hidden="true" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M7 17L17 7M17 7H8m9 0v9" />
                            </svg>
                        </span>

                        <div class="pointer-events-none absolute right-24 top-1/2 z-10 hidden w-40 -translate-y-1/2 scale-95 opacity-0 transition duration-300 ease-out group-hover:scale-100 group-hover:opacity-100 lg:block">
                            <x-media-placeholder :seed="$project->id" class="aspect-video w-full rounded-lg shadow-xl" />
                        </div>
                    </a>
                @endforeach
            </div>
        @endif

        <div class="mt-10 text-center">
            <a href="{{ route('work.index') }}" class="rounded-full border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:border-blue-600 hover:text-blue-600">
                View all projects
            </a>
        </div>
    </x-section>

    <x-section class="border-t border-slate-200 bg-slate-950">
        <div data-animate class="text-center">
            <x-eyebrow>Impact so far</x-eyebrow>
            <h2 class="mt-4 font-serif text-3xl font-medium text-white sm:text-4xl">Numbers that matter</h2>
        </div>

        <div data-animate-group class="mt-16 grid grid-cols-2 gap-10 lg:grid-cols-4">
            <div data-animate class="text-center">
                <p class="font-serif text-5xl font-medium tabular-nums text-white sm:text-6xl">
                    <span data-counter data-target="2000">0</span><span aria-hidden="true">+</span>
                </p>
                <p class="mt-3 font-mono text-xs uppercase tracking-widest text-white/50">Concurrent listeners handled</p>
            </div>

            <div data-animate class="text-center">
                <p class="font-serif text-5xl font-medium tabular-nums text-white sm:text-6xl">
                    <span data-counter data-target="4">0</span>
                </p>
                <p class="mt-3 font-mono text-xs uppercase tracking-widest text-white/50">Live projects shipped</p>
            </div>

            <div data-animate class="text-center">
                <p class="font-serif text-5xl font-medium tabular-nums text-white sm:text-6xl">
                    <span data-counter data-target="2">0</span>
                </p>
                <p class="mt-3 font-mono text-xs uppercase tracking-widest text-white/50">Payment gateways integrated</p>
            </div>

            <div data-animate class="text-center">
                <p class="font-serif text-5xl font-medium tabular-nums text-white sm:text-6xl">
                    <span data-counter data-target="5">0</span>
                </p>
                <p class="mt-3 font-mono text-xs uppercase tracking-widest text-white/50">Languages supported (i18n)</p>
            </div>
        </div>
    </x-section>

    <x-section id="skills" data-pin-section class="border-t border-slate-200">
        <div class="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div data-animate>
                <x-eyebrow>Core skills</x-eyebrow>
                <h2 class="mt-4 font-serif text-3xl font-medium text-slate-900 sm:text-4xl">Tools I build with</h2>
                <p class="mt-4 max-w-md text-slate-600">
                    A focused stack, used deeply &mdash; so every project ships fast without sacrificing quality.
                </p>

                <div class="mt-8 hidden items-center gap-2 lg:flex" data-carousel-dots>
                    @foreach ($skills as $index => $skill)
                        <span class="h-1.5 w-6 rounded-full transition-colors {{ $index === 0 ? 'bg-blue-600' : 'bg-slate-200' }}" data-dot></span>
                    @endforeach
                </div>
            </div>

            <div class="relative -mx-6 snap-x snap-mandatory overflow-x-auto sm:mx-0" data-carousel-viewport>
                <div class="flex gap-6 px-6 sm:px-0" data-carousel-track>
                    @foreach ($skills as $index => $skill)
                        <div class="relative flex aspect-[4/3] w-[80%] shrink-0 snap-start flex-col justify-between overflow-hidden rounded-2xl border border-slate-200 bg-white p-7 transition hover:border-blue-300 sm:w-[65%] lg:w-[75%]">
                            <span aria-hidden="true" class="pointer-events-none absolute -right-2 -top-6 select-none font-serif text-[8rem] font-medium leading-none text-slate-50">
                                {{ sprintf('%02d', $index + 1) }}
                            </span>

                            <span class="relative font-mono text-xs font-medium uppercase tracking-widest text-blue-600">
                                Skill {{ sprintf('%02d', $index + 1) }}
                            </span>

                            <div class="relative">
                                <h3 class="font-serif text-2xl font-medium text-slate-900">{{ $skill['title'] }}</h3>
                                <p class="mt-2 text-sm text-slate-600">{{ $skill['description'] }}</p>
                            </div>
                        </div>
                    @endforeach
                </div>
            </div>
        </div>
    </x-section>

    <x-section class="border-t border-slate-200 bg-slate-50">
        <div data-animate class="text-center">
            <x-eyebrow>What clients say</x-eyebrow>
            <h2 class="mt-4 font-serif text-3xl font-medium text-slate-900 sm:text-4xl">Client feedback</h2>
        </div>

        <div data-animate-group class="mt-16 grid gap-8 sm:grid-cols-3">
            @foreach ($testimonials as $testimonial)
                <div data-animate class="flex flex-col rounded-2xl bg-white p-6 text-left shadow-sm ring-1 ring-slate-100">
                    <p class="font-serif text-base italic text-slate-700">&ldquo;{{ $testimonial['quote'] }}&rdquo;</p>
                    <p class="mt-4 font-mono text-xs font-medium uppercase tracking-wide text-slate-400">{{ $testimonial['role'] }}</p>
                </div>
            @endforeach
        </div>
    </x-section>
@endsection
