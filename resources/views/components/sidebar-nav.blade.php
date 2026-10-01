<aside class="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-40 lg:flex lg:w-64 lg:flex-col lg:border-r lg:border-slate-200 lg:bg-white lg:px-8 lg:py-12">
    <a href="{{ route('home') }}" class="block">
        <x-brand-mark />
    </a>
    <span class="mt-1 block font-mono text-xs uppercase tracking-widest text-slate-400">Est. 2026</span>

    <nav class="mt-16 flex flex-1 flex-col gap-2 text-sm font-medium text-slate-700">
        <a href="{{ route('home') }}#about" class="rounded-md px-4 py-3 transition hover:bg-slate-50 hover:text-brand-600">About</a>
        <a href="{{ route('home') }}#services" class="rounded-md px-4 py-3 transition hover:bg-slate-50 hover:text-brand-600">Services</a>
        <a href="{{ route('home') }}#skills" class="rounded-md px-4 py-3 transition hover:bg-slate-50 hover:text-brand-600">Skills</a>
        <a href="{{ route('work.index') }}" class="rounded-md px-4 py-3 transition hover:bg-slate-50 hover:text-brand-600">Work</a>
        <a href="{{ route('blog.index') }}" class="rounded-md px-4 py-3 transition hover:bg-slate-50 hover:text-brand-600">Blog</a>
    </nav>

    <a href="{{ route('contact') }}" data-magnetic class="mt-10 rounded-full border border-slate-300 px-5 py-3 text-center text-sm font-medium text-slate-700 transition hover:border-brand-600 hover:text-brand-600">
        Let's talk <span aria-hidden="true">&rarr;</span>
    </a>
</aside>
