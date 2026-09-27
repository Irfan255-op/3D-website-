@extends('layouts.app')

@section('title', $project->title.' | Case Study')
@section('description', \Illuminate\Support\Str::limit(strip_tags($project->body), 155))

@section('content')
    <article class="mx-auto max-w-3xl px-6 py-28 sm:px-8 sm:py-32">
        <a href="{{ route('work.index') }}" class="text-sm font-semibold text-slate-500 hover:text-blue-600">
            <span aria-hidden="true">&larr;</span> Back to work
        </a>

        <h1 class="mt-4 font-serif text-3xl font-medium text-slate-900 sm:text-4xl">{{ $project->title }}</h1>

        @if ($project->image)
            <img src="{{ Storage::url($project->image) }}" alt="{{ $project->title }}" loading="lazy" class="mt-8 w-full rounded-xl border border-slate-200 object-cover">
        @else
            <x-media-placeholder :seed="$project->id" class="mt-8 aspect-video w-full rounded-xl" />
        @endif

        <section class="mt-10" aria-label="Technology stack">
            <h2 class="font-mono text-sm font-medium uppercase tracking-wide text-slate-500">Tech stack</h2>
            <ul class="mt-3 flex flex-wrap gap-2">
                @foreach (explode(',', $project->tech_stack) as $tech)
                    <li class="rounded-full bg-slate-100 px-3 py-1 font-mono text-xs text-slate-700">{{ trim($tech) }}</li>
                @endforeach
            </ul>
        </section>

        @if ($project->tags->isNotEmpty())
            <ul class="mt-4 flex flex-wrap gap-2">
                @foreach ($project->tags as $tag)
                    <li class="font-mono text-xs font-medium uppercase tracking-wide text-slate-400">#{{ $tag->name }}</li>
                @endforeach
            </ul>
        @endif

        <div class="prose prose-slate mt-10 max-w-none">
            {!! nl2br(e($project->body)) !!}
        </div>
    </article>
@endsection
