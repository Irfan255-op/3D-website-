<!DOCTYPE html>
{{-- The homepage earns its way into the dark world: it opens on paper and
     the curtain takes it to ink as you scroll (app.js toggles .is-dark).
     Every other page is already in that world, so it starts there. --}}
<html lang="en" @class(['is-dark' => ! request()->routeIs('home')])>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="theme-color" content="{{ request()->routeIs('home') ? '#f6f6f7' : '#08080a' }}">

    <title>@yield('title', 'Full Stack Developer | Laravel & Tailwind')</title>
    <meta name="description" content="@yield('description', 'Building scalable web applications and APIs with Laravel, PHP, and TailwindCSS.')">
    <meta property="og:title" content="@yield('title', 'Full Stack Developer | Laravel & Tailwind')">
    <meta property="og:description" content="@yield('description', 'Building scalable web applications and APIs with Laravel, PHP, and TailwindCSS.')">
    <meta property="og:type" content="website">
    <meta property="og:url" content="{{ url()->current() }}">
    <meta property="og:image" content="{{ asset('images/og-image.png') }}">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="@yield('title', 'Full Stack Developer | Laravel & Tailwind')">
    <meta name="twitter:description" content="@yield('description', 'Building scalable web applications and APIs with Laravel, PHP, and TailwindCSS.')">
    <meta name="twitter:image" content="{{ asset('images/og-image.png') }}">

    <link rel="canonical" href="{{ url()->current() }}">
    <link rel="icon" type="image/png" sizes="32x32" href="{{ asset('favicon-32x32.png') }}">
    <link rel="icon" type="image/png" sizes="16x16" href="{{ asset('favicon-16x16.png') }}">
    <link rel="apple-touch-icon" sizes="180x180" href="{{ asset('apple-touch-icon.png') }}">

    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&family=Source+Serif+4:ital,wght@0,300;0,400;0,600;1,300&display=swap" rel="stylesheet">

    @vite(['resources/css/app.css', 'resources/js/app.js'])

    @stack('head')
</head>
<body class="font-sans text-slate-900 antialiased">
    {{-- The entry ritual: the mark, a counter that climbs to 100, and a
         hairline that fills beneath it. The wait is part of the work rather
         than something to apologise for — but it is capped at 3s by the CSS
         auto-hide, because a portfolio visitor wants to see the work, not
         prove their patience. --}}
    <div id="page-loader" aria-hidden="true">
        <img src="{{ asset('images/logo.svg') }}" alt="" class="page-loader-logo" width="120" height="120">
        <span class="page-loader-count" id="page-loader-count">00</span>
        <span class="page-loader-bar"><i id="page-loader-fill"></i></span>
    </div>

    {{-- Ambient stage background on every page — the slow wash, the drifting
         blobs, and the vignette. The WebGL sphere canvas joins them here too
         (not inside <main>) so they all stay true siblings at the same
         z-index:0 stacking level — <main> has its own z-index:10 context, and
         a canvas nested inside it would paint above them instead of under.
         The sphere itself (chapter rail, caption, motion toggle) stays
         homepage-only; it's wired to specific section waypoints that only
         exist there. --}}
    <div aria-hidden="true" class="stage-wash"></div>
    <div aria-hidden="true" class="stage-ambient"></div>
    <div aria-hidden="true" class="stage-blob stage-blob--a"></div>
    <div aria-hidden="true" class="stage-blob stage-blob--b"></div>
    {{-- Moves at its own rate against --scroll-progress (set every frame in
         app.js), independently of the two idle-drift blobs above, and is
         tinted by --mood-r/g/b — the per-section "mood" colour the hero
         sphere's waypoints also drive. The combination is what makes each
         section read as its own scene rather than one continuous backdrop. --}}
    <div aria-hidden="true" class="stage-blob stage-blob--c"></div>
    @if (request()->routeIs('home'))
        @php
            // About's particle-portrait effect is optional: drop a photo at
            // public/images/portrait.(jpg|png|webp) and it switches itself on.
            // Resolved here rather than probed from JS so a site without one
            // doesn't fire 404s into every visitor's console.
            $portrait = collect(['jpg', 'png', 'webp'])
                ->map(fn ($ext) => "images/portrait.{$ext}")
                ->first(fn ($path) => is_file(public_path($path)));
        @endphp
        <canvas
            id="hero-sphere"
            aria-hidden="true"
            class="stage-canvas"
            @if ($portrait) data-portrait="{{ asset($portrait) }}" @endif
        ></canvas>
    @endif
    {{-- Darkened corners once the page turns blue — see .stage-vignette.
         Last of the z-0 background siblings, so it sits over the rest. --}}
    <div aria-hidden="true" class="stage-vignette"></div>

    @if (request()->routeIs('home'))
        {{-- One-time "opening curtain": as you scroll from the hero into
             About, the orb dissolves into a flat colour circle expanding
             from its own screen position, covering the frame, then fades
             away to reveal About already settled in behind it. Driven
             entirely from app.js (GSAP ScrollTrigger + CSS custom
             properties) — see the scene-wipe setup in buildHeroSphere.
             z-50 so it sits above <main>'s z-10 during the transition;
             pointer-events none always, since nothing interactive lives
             in it. --}}
        <div id="scene-wipe" aria-hidden="true" class="scene-wipe"></div>
    @endif

    <x-navbar />
    <x-sidebar-nav />

    <main class="relative z-10 lg:pl-20">
        {{ $slot ?? '' }}
        @yield('content')
    </main>

    <x-footer />

    <div id="cursor-ring" aria-hidden="true">
        <div id="cursor-ring-inner">
            <span id="cursor-ring-label"></span>
        </div>
    </div>

    @stack('scripts')
</body>
</html>
