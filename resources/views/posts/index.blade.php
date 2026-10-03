@extends('layouts.app')

@section('title', 'Blog | Full Stack Developer')
@section('description', 'Technical write-ups on Laravel, PHP, and building scalable web applications.')

@section('content')
    <x-section class="stage-section">
        <div data-animate class="max-w-2xl">
            <p class="font-mono text-xs uppercase tracking-[0.14em] text-brand-600">Blog</p>
            <h1 data-scramble class="mt-3 font-serif text-4xl font-medium text-slate-900 sm:text-5xl">Writing</h1>
            <p class="mt-4 text-slate-600">Technical write-ups and case studies.</p>
        </div>

        @if ($posts->isEmpty())
            <div data-animate class="stage-card mt-10">
                <p class="text-slate-500">No posts published yet.</p>
            </div>
        @else
            <div data-animate-group class="mt-12 grid gap-6">
                @foreach ($posts as $post)
                    <article data-animate class="stage-card">
                        <a href="{{ route('blog.show', $post) }}" data-cursor-text="Read" class="group block">
                            <h2 class="font-serif text-xl font-medium text-slate-900 transition group-hover:text-brand-600">{{ $post->title }}</h2>
                        </a>
                        <p class="mt-1 font-mono text-xs text-slate-400">{{ $post->published_at->format('F j, Y') }}</p>
                        <p class="mt-3 text-slate-600">{{ $post->excerpt }}</p>
                    </article>
                @endforeach
            </div>

            <div class="mt-10">
                {{ $posts->links() }}
            </div>
        @endif
    </x-section>
@endsection
