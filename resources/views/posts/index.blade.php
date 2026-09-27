@extends('layouts.app')

@section('title', 'Blog | Full Stack Developer')
@section('description', 'Technical write-ups on Laravel, PHP, and building scalable web applications.')

@section('content')
    <section class="mx-auto max-w-3xl px-6 py-28 sm:px-8 sm:py-32">
        <div data-animate>
            <x-eyebrow>Blog</x-eyebrow>
            <h1 class="mt-4 font-serif text-3xl font-medium text-slate-900 sm:text-4xl">Writing</h1>
            <p class="mt-2 text-slate-600">Technical write-ups and case studies.</p>
        </div>

        @if ($posts->isEmpty())
            <p class="mt-10 text-slate-500">No posts published yet.</p>
        @else
            <div data-animate-group class="mt-12 divide-y divide-slate-200 border-t border-slate-200">
                @foreach ($posts as $post)
                    <article data-animate class="py-8">
                        <a href="{{ route('blog.show', $post) }}" class="group">
                            <h2 class="font-serif text-xl font-medium text-slate-900 transition group-hover:text-blue-600">{{ $post->title }}</h2>
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
    </section>
@endsection
