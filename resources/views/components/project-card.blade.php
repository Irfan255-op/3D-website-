@props(['project'])

<article class="group overflow-hidden rounded-xl border border-slate-200 bg-white transition hover:-translate-y-1 hover:shadow-lg">
    <a href="{{ route('work.show', $project) }}" class="block">
        <div class="aspect-video w-full overflow-hidden">
            @if ($project->image)
                <img src="{{ Storage::url($project->image) }}" alt="{{ $project->title }}" class="h-full w-full object-cover transition group-hover:scale-105" loading="lazy">
            @else
                <x-media-placeholder :seed="$project->id" :label="$project->title" class="h-full w-full transition group-hover:scale-105" />
            @endif
        </div>

        <div class="p-5">
            <h3 class="font-serif text-lg font-semibold text-slate-900">{{ $project->title }}</h3>
            <p class="mt-1 font-mono text-xs text-slate-500">{{ $project->tech_stack }}</p>
        </div>
    </a>
</article>
