@props(['seed' => 0, 'label' => null, 'class' => ''])

@php
    $palettes = [
        'from-slate-800 via-slate-700 to-slate-900',
        'from-stone-800 via-stone-700 to-stone-900',
        'from-zinc-800 via-neutral-700 to-zinc-900',
        'from-slate-900 via-stone-800 to-slate-800',
    ];

    $palette = $palettes[$seed % count($palettes)];
@endphp

<div {{ $attributes->merge(['class' => "relative flex items-center justify-center overflow-hidden bg-gradient-to-br $palette $class"]) }}>
    <div
        class="absolute inset-0 opacity-[0.15]"
        style="background-image: radial-gradient(circle at 1px 1px, white 1px, transparent 0); background-size: 22px 22px;"
    ></div>

    @if ($label)
        <span class="relative font-serif text-2xl italic text-white/70">{{ $label }}</span>
    @endif
</div>
