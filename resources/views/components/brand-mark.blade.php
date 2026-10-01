@props(['iconClass' => 'h-8 w-8'])

<span {{ $attributes->merge(['class' => 'flex items-center gap-2.5']) }}>
    <img src="{{ asset('images/logo-icon.svg') }}" alt="" class="{{ $iconClass }}" width="32" height="32">
    <span class="font-serif text-xl font-semibold tracking-tight">
        <span class="text-slate-900">shaikh</span><span class="text-brand-gradient">.labs</span>
    </span>
</span>
