@props(['index' => null])

<p {{ $attributes->merge(['class' => 'inline-flex items-center gap-2 font-mono text-sm font-medium uppercase tracking-widest text-slate-400']) }}>
    @if ($index)
        <span class="text-slate-300">{{ $index }}</span>
    @endif
    <span aria-hidden="true">&#10022;</span>
    {{ $slot }}
</p>
