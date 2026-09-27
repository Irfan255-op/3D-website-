@extends('layouts.app')

@section('title', 'Portfolio & Case Studies | Full Stack Developer')
@section('description', 'A collection of Laravel, PHP, and TailwindCSS projects built for real clients.')

@section('content')
    <x-section class="pt-16 pb-28 sm:pt-20 sm:pb-32">
        <div data-animate>
            <x-eyebrow>Work</x-eyebrow>
            <h1 class="mt-4 font-serif text-3xl font-medium text-slate-900 sm:text-4xl">Case studies</h1>
            <p class="mt-2 max-w-2xl text-slate-600">Projects I've built as a freelance full-stack developer.</p>
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
