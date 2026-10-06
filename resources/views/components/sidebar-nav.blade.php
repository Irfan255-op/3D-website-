@php
    $navItems = [
        ['href' => route('home') . '#about', 'label' => 'About', 'active' => false],
        ['href' => route('home') . '#services', 'label' => 'Services', 'active' => false],
        ['href' => route('home') . '#skills', 'label' => 'Skills', 'active' => false],
        ['href' => route('work.index'), 'label' => 'Work', 'active' => request()->routeIs('work.*')],
        ['href' => route('blog.index'), 'label' => 'Blog', 'active' => request()->routeIs('blog.*')],
    ];
@endphp

{{-- Replaces the old 256px text-link sidebar with an 80px icon-only rail —
     tooltips carry the labels instead, so the accessible name on each link
     still matches what a sighted user sees on hover (aria-label mirrors the
     tooltip text exactly). Desktop-only (lg:), same as before; mobile still
     gets its own <x-navbar/> with full text labels. --}}
<aside class="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-40 lg:flex lg:w-20 lg:flex-col lg:items-center lg:border-r lg:border-slate-200 lg:bg-white lg:py-8">
    <a href="{{ route('home') }}" class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition hover:bg-brand-50/70" aria-label="shaikh.labs home">
        <img src="{{ asset('images/logo-icon.svg') }}" alt="" class="h-7 w-7" width="28" height="28">
    </a>

    <nav class="relative mt-10 flex flex-1 flex-col items-center gap-2" aria-label="Primary" data-sidebar-nav>
        {{-- One bar that slides between icons: the section you're reading
             on the homepage (scroll-spy), or the current route elsewhere.
             Positioned by initSectionSpy() in app.js. --}}
        <span class="sidebar-indicator" aria-hidden="true" data-sidebar-indicator></span>

        <a
            href="{{ $navItems[0]['href'] }}"
            aria-label="About"
            data-spy="about"
            class="group relative flex h-11 w-11 items-center justify-center rounded-xl text-slate-500 transition-all duration-200 hover:bg-brand-50/70 hover:text-brand-600"
        >
            <svg aria-hidden="true" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span class="sidebar-tooltip">About</span>
        </a>

        <a
            href="{{ $navItems[1]['href'] }}"
            aria-label="Services"
            data-spy="services"
            class="group relative flex h-11 w-11 items-center justify-center rounded-xl text-slate-500 transition-all duration-200 hover:bg-brand-50/70 hover:text-brand-600"
        >
            <svg aria-hidden="true" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0" />
            </svg>
            <span class="sidebar-tooltip">Services</span>
        </a>

        <a
            href="{{ $navItems[2]['href'] }}"
            aria-label="Skills"
            data-spy="skills"
            class="group relative flex h-11 w-11 items-center justify-center rounded-xl text-slate-500 transition-all duration-200 hover:bg-brand-50/70 hover:text-brand-600"
        >
            <svg aria-hidden="true" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3-4.5 16.5" />
            </svg>
            <span class="sidebar-tooltip">Skills</span>
        </a>

        <a
            href="{{ $navItems[3]['href'] }}"
            aria-label="Work"
            data-spy="work"
            @if ($navItems[3]['active']) aria-current="page" @endif
            class="group relative flex h-11 w-11 items-center justify-center rounded-xl transition-all duration-200 hover:bg-brand-50/70 hover:text-brand-600 {{ $navItems[3]['active'] ? 'bg-brand-50/70 text-brand-600' : 'text-slate-500' }}"
        >
            <svg aria-hidden="true" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
            </svg>
            <span class="sidebar-tooltip">Work</span>
        </a>

        <a
            href="{{ $navItems[4]['href'] }}"
            aria-label="Blog"
            @if ($navItems[4]['active']) aria-current="page" @endif
            class="group relative flex h-11 w-11 items-center justify-center rounded-xl transition-all duration-200 hover:bg-brand-50/70 hover:text-brand-600 {{ $navItems[4]['active'] ? 'bg-brand-50/70 text-brand-600' : 'text-slate-500' }}"
        >
            <svg aria-hidden="true" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
            <span class="sidebar-tooltip">Blog</span>
        </a>
    </nav>

    <span class="mb-3 font-mono text-[10px] uppercase tracking-widest text-slate-300 [writing-mode:vertical-rl]">Est. 2026</span>

    <a
        href="{{ route('contact') }}"
        data-magnetic
        aria-label="Let's talk"
        class="group relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-600 text-white transition hover:bg-brand-700"
    >
        <svg aria-hidden="true" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 12 3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.269 20.874L5.999 12Zm0 0h7.5" />
        </svg>
        <span class="sidebar-tooltip">Let's talk</span>
    </a>
</aside>
