<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>@yield('title', 'Admin')</title>
    <meta name="robots" content="noindex, nofollow">
    <link rel="icon" type="image/png" sizes="32x32" href="{{ asset('favicon-32x32.png') }}">
    @vite(['resources/css/app.css', 'resources/js/app.js'])
</head>
<body class="min-h-screen bg-slate-100 font-[ui-sans-serif,system-ui,sans-serif] text-slate-900 antialiased">
    @auth
        <header class="border-b border-slate-200 bg-white">
            <div class="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
                <a href="{{ route('admin.projects.index') }}" class="flex items-center gap-2 font-bold">
                    <img src="{{ asset('images/logo-icon.svg') }}" alt="" class="h-6 w-6" width="24" height="24">
                    shaikh.labs Admin
                </a>
                <nav class="flex items-center gap-6 text-sm font-medium text-slate-600">
                    <a href="{{ route('admin.projects.index') }}" class="hover:text-slate-900">Case studies</a>
                    <a href="{{ route('admin.messages.index') }}" class="hover:text-slate-900">Messages</a>
                    <form method="POST" action="{{ route('admin.logout') }}">
                        @csrf
                        <button type="submit" class="hover:text-slate-900">Log out</button>
                    </form>
                </nav>
            </div>
        </header>
    @endauth

    <main class="mx-auto max-w-5xl px-6 py-10">
        @if (session('status'))
            <div class="mb-6 rounded-md bg-green-50 px-4 py-3 text-sm text-green-700">
                {{ session('status') }}
            </div>
        @endif

        @yield('content')
    </main>
</body>
</html>
