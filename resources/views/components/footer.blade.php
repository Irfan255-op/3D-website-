{{-- relative + z-10 matches <main>'s treatment in layouts/app.blade.php: a
     non-positioned element paints BELOW position:fixed z-index:0 siblings
     (the stage canvas/wash/blobs) regardless of DOM order, which is exactly
     why the sphere was bleeding over this section's content before this. --}}
<footer id="contact" class="relative z-10 bg-slate-950 text-white lg:pl-20">
    <div data-animate class="mx-auto max-w-7xl px-6 py-24 text-center sm:px-8 lg:px-12">
        <p class="font-mono text-sm font-medium uppercase tracking-widest text-white/40"><span aria-hidden="true">&#10022;</span> Let's build something great</p>
        {{-- Deliberately different copy from the Contact section's own
             "Have a project in mind?" heading right above this — with the
             sphere no longer bleeding through, the two sit close enough
             together on screen that repeating the same line read as a
             content bug once it was actually visible. --}}
        <h2 data-scramble class="mx-auto mt-4 max-w-2xl font-serif text-3xl font-medium sm:text-5xl">
            Ready when you are.
        </h2>
        <a href="mailto:shoeb4303@gmail.com" data-magnetic data-cursor-text="Email" class="mt-8 inline-flex items-center gap-2 rounded-full bg-white px-7 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-200">
            shoeb4303@gmail.com
        </a>
    </div>

    <div class="border-t border-white/10 bg-gradient-to-b from-brand-900/10 to-transparent">
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
                    <li><a href="{{ route('home') }}#about" class="inline-block transition-all duration-200 hover:translate-x-1 hover:text-brand-400">About</a></li>
                    <li><a href="{{ route('work.index') }}" class="inline-block transition-all duration-200 hover:translate-x-1 hover:text-brand-400">Work</a></li>
                    <li><a href="{{ route('blog.index') }}" class="inline-block transition-all duration-200 hover:translate-x-1 hover:text-brand-400">Blog</a></li>
                </ul>
            </div>

            <div>
                <p class="font-mono text-sm font-medium uppercase tracking-wide text-white/40">Contact</p>
                <p class="mt-3 text-sm text-white/70">
                    Based in Mumbra, Maharashtra, India.<br>
                    <a href="mailto:shoeb4303@gmail.com" class="hover:text-brand-400">shoeb4303@gmail.com</a>
                </p>
                <ul class="mt-3 flex gap-4 text-sm text-white/70">
                    <li><a href="https://linkedin.com/in/shaikh-shoeb-20893a334" target="_blank" rel="noopener noreferrer" class="inline-block transition-all duration-200 hover:-translate-y-0.5 hover:text-brand-400">LinkedIn</a></li>
                    <li><a href="https://github.com/irfan255-" target="_blank" rel="noopener noreferrer" class="inline-block transition-all duration-200 hover:-translate-y-0.5 hover:text-brand-400">GitHub</a></li>
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
