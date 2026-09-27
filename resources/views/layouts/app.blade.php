<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="theme-color" content="#ffffff">

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
<body class="bg-white font-sans text-slate-900 antialiased">
    <x-navbar />

    <main>
        {{ $slot ?? '' }}
        @yield('content')
    </main>

    <x-footer />

    @stack('scripts')
</body>
</html>
