<footer id="contact" class="bg-slate-950 text-white">
    <div data-animate class="mx-auto max-w-7xl px-6 py-24 text-center sm:px-8 lg:px-12">
        <p class="font-mono text-sm font-medium uppercase tracking-widest text-white/40"><span aria-hidden="true">&#10022;</span> Let's build something great</p>
        <h2 class="mx-auto mt-4 max-w-2xl font-serif text-3xl font-medium sm:text-5xl">
            Have a project in mind? Let's work together.
        </h2>
        <a href="mailto:shoeb4303@gmail.com" class="mt-8 inline-flex items-center gap-2 rounded-full bg-white px-7 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-200">
            shoeb4303@gmail.com
        </a>
    </div>

    <div class="border-t border-white/10">
        <div class="mx-auto grid max-w-7xl gap-8 px-6 py-12 sm:grid-cols-3 sm:px-8 lg:px-12">
            <div>
                <span class="flex items-center gap-2.5">
                    <img src="{{ asset('images/logo-icon.svg') }}" alt="" class="h-7 w-7" width="28" height="28">
                    <span class="font-serif text-lg font-semibold text-white">shaikh<span class="text-brand-gradient">.labs</span></span>
                </span>
                <p class="mt-3 text-sm text-white/50">
                    Freelance full-stack developer building scalable web applications and APIs with Laravel, PHP, and TailwindCSS.
                </p>
            </div>

            <div>
                <p class="font-mono text-sm font-medium uppercase tracking-wide text-white/40">Explore</p>
                <ul class="mt-3 space-y-2 text-sm text-white/70">
                    <li><a href="{{ route('home') }}#about" class="hover:text-brand-400">About</a></li>
                    <li><a href="{{ route('work.index') }}" class="hover:text-brand-400">Work</a></li>
                    <li><a href="{{ route('blog.index') }}" class="hover:text-brand-400">Blog</a></li>
                </ul>
            </div>

            <div>
                <p class="font-mono text-sm font-medium uppercase tracking-wide text-white/40">Contact</p>
                <p class="mt-3 text-sm text-white/70">
                    Based in Mumbra, Maharashtra, India.<br>
                    <a href="mailto:shoeb4303@gmail.com" class="hover:text-brand-400">shoeb4303@gmail.com</a>
                </p>
                <ul class="mt-3 flex gap-4 text-sm text-white/70">
                    <li><a href="https://linkedin.com/in/shaikh-shoeb-20893a334" target="_blank" rel="noopener noreferrer" class="hover:text-brand-400">LinkedIn</a></li>
                    <li><a href="https://github.com/irfan255-" target="_blank" rel="noopener noreferrer" class="hover:text-brand-400">GitHub</a></li>
                </ul>
            </div>
        </div>

        <p class="border-t border-white/10 px-6 py-6 text-center text-xs text-white/30 sm:px-8">
            &copy; {{ now()->year }} shaikh.labs. All rights reserved.
        </p>
    </div>

    @if (request()->routeIs('home'))
        <script type="application/ld+json">
        {
            "@@context": "https://schema.org",
            "@@type": "LocalBusiness",
            "name": "Shaikh Shoeb Akhtar - Full Stack Developer",
            "description": "Freelance web development specializing in Laravel, PHP, and TailwindCSS.",
            "address": {
                "@@type": "PostalAddress",
                "addressLocality": "Mumbra",
                "addressRegion": "Maharashtra",
                "addressCountry": "IN"
            },
            "url": "{{ url('/') }}",
            "priceRange": "$$"
        }
        </script>
    @endif
</footer>
