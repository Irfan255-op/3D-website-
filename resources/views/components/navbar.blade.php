<header class="sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur">
    <nav class="mx-auto flex max-w-6xl items-center justify-between px-6 py-5 sm:px-8">
        <a href="{{ route('home') }}" class="flex items-baseline gap-2">
            <span class="font-serif text-xl font-semibold tracking-tight text-slate-900">Corefolio</span>
            <span class="hidden font-mono text-xs uppercase tracking-widest text-slate-400 sm:inline">Est. 2026</span>
        </a>

        <button
            id="nav-toggle"
            type="button"
            class="inline-flex items-center justify-center rounded-md p-2.5 text-slate-700 md:hidden"
            aria-controls="nav-menu"
            aria-expanded="false"
            aria-label="Toggle navigation menu"
        >
            <svg id="nav-icon-open" aria-hidden="true" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5" />
            </svg>
            <svg id="nav-icon-close" aria-hidden="true" class="hidden h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
        </button>

        <ul class="hidden items-center gap-8 text-sm font-medium text-slate-700 md:flex">
            <li><a href="{{ route('home') }}#about" class="transition hover:text-blue-600">About</a></li>
            <li><a href="{{ route('home') }}#services" class="transition hover:text-blue-600">Services</a></li>
            <li><a href="{{ route('home') }}#skills" class="transition hover:text-blue-600">Skills</a></li>
            <li><a href="{{ route('work.index') }}" class="transition hover:text-blue-600">Work</a></li>
            <li><a href="{{ route('blog.index') }}" class="transition hover:text-blue-600">Blog</a></li>
        </ul>

        <a href="{{ route('contact') }}" class="hidden rounded-full border border-slate-300 px-5 py-2 text-sm font-medium text-slate-700 transition hover:border-blue-600 hover:text-blue-600 md:inline-block">
            Let's talk <span aria-hidden="true">&rarr;</span>
        </a>
    </nav>

    <ul id="nav-menu" class="hidden flex-col gap-1 border-t border-slate-200 px-6 pb-4 text-sm font-medium text-slate-700 sm:px-8 md:hidden">
        <li><a href="{{ route('home') }}#about" class="block py-2">About</a></li>
        <li><a href="{{ route('home') }}#services" class="block py-2">Services</a></li>
        <li><a href="{{ route('home') }}#skills" class="block py-2">Skills</a></li>
        <li><a href="{{ route('work.index') }}" class="block py-2">Work</a></li>
        <li><a href="{{ route('blog.index') }}" class="block py-2">Blog</a></li>
        <li><a href="{{ route('contact') }}" class="block py-2">Let's talk</a></li>
    </ul>
</header>
