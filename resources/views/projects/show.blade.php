@extends('layouts.app')

@section('title', $project->title.' | Case Study')
@section('description', \Illuminate\Support\Str::limit(strip_tags($project->body), 155))

@section('content')
    <x-section class="stage-section">
        <article class="stage-card stage-card--wide mx-auto">
            <a href="{{ route('work.index') }}" data-magnetic class="inline-flex text-sm font-semibold text-slate-500 hover:text-brand-600">
                <span aria-hidden="true">&larr;</span>&nbsp;Back to work
            </a>

            <h1 data-scramble class="mt-4 font-serif text-4xl font-medium text-slate-900 sm:text-5xl">{{ $project->title }}</h1>

            @if ($project->image)
                <img src="{{ Storage::url($project->image) }}" alt="{{ $project->title }}" loading="lazy" class="mt-8 w-full rounded-xl border border-slate-200 object-cover">
            @else
                <x-media-placeholder :seed="$project->id" class="mt-8 aspect-video w-full rounded-xl" />
            @endif

            <section class="mt-10" aria-label="Technology stack">
                <h2 class="font-mono text-xs font-medium uppercase tracking-wide text-slate-500">Tech stack</h2>
                <ul class="mt-3 flex flex-wrap gap-2">
                    @foreach (explode(',', $project->tech_stack) as $tech)
                        <li class="tag-pill">{{ trim($tech) }}</li>
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
    </x-section>
@endsection
