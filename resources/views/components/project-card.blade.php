@props(['project'])

{{-- h-full plus a column layout so every card in the grid ends level,
     whatever its title wraps to — ragged card bottoms were invisible behind
     the old generated placeholders and obvious once real screenshots went in. --}}
<article class="group h-full overflow-hidden rounded-2xl border border-slate-200 bg-white/80 backdrop-blur-sm transition hover:-translate-y-1 hover:border-brand-200 hover:shadow-lg">
    <a href="{{ route('work.show', $project) }}" data-cursor-text="View" class="flex h-full flex-col">
        <div class="aspect-video w-full shrink-0 overflow-hidden">
            @if ($project->image)
                <img src="{{ Storage::url($project->image) }}" alt="{{ $project->title }}" class="h-full w-full object-cover transition group-hover:scale-105" loading="lazy">
            @else
                <x-media-placeholder :seed="$project->id" :label="$project->title" class="h-full w-full transition group-hover:scale-105" />
            @endif
        </div>

        <div class="flex flex-1 flex-col p-5">
            <h3 class="font-serif text-lg font-semibold text-slate-900 transition group-hover:text-brand-600">{{ $project->title }}</h3>
            <p class="mt-2 font-mono text-[11px] uppercase tracking-wide text-slate-400">{{ $project->tech_stack }}</p>
        </div>
    </a>
</article>
