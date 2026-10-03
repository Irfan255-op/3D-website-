@extends('layouts.app')

@section('title', 'Portfolio & Case Studies | Full Stack Developer')
@section('description', 'A collection of Laravel, PHP, and TailwindCSS projects built for real clients.')

@section('content')
    <x-section class="stage-section">
        <div data-animate class="max-w-2xl">
            <p class="font-mono text-xs uppercase tracking-[0.14em] text-brand-600">Work</p>
            <h1 data-scramble class="mt-3 font-serif text-4xl font-medium text-slate-900 sm:text-5xl">Case studies</h1>
            <p class="mt-4 text-slate-600">Projects I've built as a freelance full-stack developer.</p>
        </div>

        @if ($projects->isEmpty())
            <p class="mt-10 text-slate-500">No case studies published yet.</p>
        @else
            <div data-animate-group class="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                @foreach ($projects as $project)
                    <div data-animate>
                        <x-project-card :project="$project" />
                    </div>
                @endforeach
            </div>

            <div class="mt-10">
                {{ $projects->links() }}
            </div>
        @endif
    </x-section>
@endsection
