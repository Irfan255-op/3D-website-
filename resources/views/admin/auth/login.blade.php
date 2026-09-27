@extends('admin.layout')

@section('title', 'Admin Login')

@section('content')
    <div class="mx-auto max-w-sm rounded-xl border border-slate-200 bg-white p-8">
        <h1 class="text-xl font-bold">Admin login</h1>

        <form method="POST" action="{{ route('admin.login') }}" class="mt-6 space-y-4" novalidate>
            @csrf

            <div>
                <label for="email" class="block text-sm font-medium text-slate-700">Email</label>
                <input id="email" type="email" name="email" value="{{ old('email') }}" required autofocus
                    autocomplete="username" spellcheck="false"
                    aria-invalid="{{ $errors->has('email') ? 'true' : 'false' }}"
                    aria-describedby="email-error"
                    class="mt-1 w-full rounded-md border px-3 py-2 text-sm {{ $errors->has('email') ? 'border-red-400' : 'border-slate-300' }}">
                @error('email')
                    <p id="email-error" class="mt-1 text-sm text-red-600">{{ $message }}</p>
                @enderror
            </div>

            <div>
                <label for="password" class="block text-sm font-medium text-slate-700">Password</label>
                <input id="password" type="password" name="password" required
                    autocomplete="current-password"
                    aria-invalid="{{ $errors->has('password') ? 'true' : 'false' }}"
                    aria-describedby="password-error"
                    class="mt-1 w-full rounded-md border px-3 py-2 text-sm {{ $errors->has('password') ? 'border-red-400' : 'border-slate-300' }}">
                @error('password')
                    <p id="password-error" class="mt-1 text-sm text-red-600">{{ $message }}</p>
                @enderror
            </div>

            <label class="flex items-center gap-2 text-sm text-slate-600">
                <input type="checkbox" name="remember">
                Remember me
            </label>

            <button type="submit" class="w-full rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700">
                Log in
            </button>
        </form>
    </div>
@endsection
