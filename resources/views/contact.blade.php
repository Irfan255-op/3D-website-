@extends('layouts.app')

@section('title', 'Contact | Full Stack Developer')
@section('description', 'Get in touch to discuss your next Laravel, PHP, or TailwindCSS project.')

@section('content')
    <x-section class="stage-section">
        <div class="stage-card stage-card--wide mx-auto">
            <div data-animate>
                <p class="font-mono text-xs uppercase tracking-[0.14em] text-brand-600">Contact</p>
                <h1 data-scramble class="mt-3 font-serif text-4xl font-medium text-slate-900 sm:text-5xl">Let's work together</h1>
                <p class="mt-4 text-slate-600">
                    Tell me a bit about your project and I'll get back to you within a couple of days.
                </p>
            </div>

            @if (session('status'))
                <div class="mt-8 rounded-md bg-green-50 px-4 py-3 text-sm text-green-700">
                    {{ session('status') }}
                </div>
            @endif

            <form method="POST" action="{{ route('contact.store') }}" class="mt-8 space-y-5" novalidate>
                @csrf

                <div class="hidden" aria-hidden="true">
                    <label for="company">Leave this field empty</label>
                    <input type="text" id="company" name="company" tabindex="-1" autocomplete="off">
                </div>

                <div>
                    <label for="name" class="block text-sm font-medium text-slate-700">Name</label>
                    <input id="name" type="text" name="name" value="{{ old('name') }}" required
                        autocomplete="name"
                        aria-invalid="{{ $errors->has('name') ? 'true' : 'false' }}"
                        aria-describedby="name-error"
                        class="mt-1 w-full rounded-md border bg-white/70 px-3 py-2 text-sm {{ $errors->has('name') ? 'border-red-400' : 'border-slate-300' }}">
                    @error('name')
                        <p id="name-error" class="mt-1 text-sm text-red-600">{{ $message }}</p>
                    @enderror
                </div>

                <div>
                    <label for="email" class="block text-sm font-medium text-slate-700">Email</label>
                    <input id="email" type="email" name="email" value="{{ old('email') }}" required
                        autocomplete="email" spellcheck="false"
                        aria-invalid="{{ $errors->has('email') ? 'true' : 'false' }}"
                        aria-describedby="email-error"
                        class="mt-1 w-full rounded-md border bg-white/70 px-3 py-2 text-sm {{ $errors->has('email') ? 'border-red-400' : 'border-slate-300' }}">
                    @error('email')
                        <p id="email-error" class="mt-1 text-sm text-red-600">{{ $message }}</p>
                    @enderror
                </div>

                <div>
                    <label for="message" class="block text-sm font-medium text-slate-700">Project details</label>
                    <textarea id="message" name="message" rows="6" required
                        placeholder="What are you looking to build&hellip;"
                        aria-invalid="{{ $errors->has('message') ? 'true' : 'false' }}"
                        aria-describedby="message-error"
                        class="mt-1 w-full rounded-md border bg-white/70 px-3 py-2 text-sm {{ $errors->has('message') ? 'border-red-400' : 'border-slate-300' }}">{{ old('message') }}</textarea>
                    @error('message')
                        <p id="message-error" class="mt-1 text-sm text-red-600">{{ $message }}</p>
                    @enderror
                </div>

                <button type="submit" data-magnetic class="w-full rounded-full bg-brand-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-700">
                    Send message
                </button>
            </form>

            <p class="mt-8 text-center text-sm text-slate-500">
                Prefer email? Reach me directly at
                <a href="mailto:shoeb4303@gmail.com" class="font-semibold text-slate-900 hover:text-brand-600">shoeb4303@gmail.com</a>
            </p>
        </div>
    </x-section>
@endsection
