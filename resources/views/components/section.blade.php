@props(['id' => null, 'bleed' => false, 'class' => ''])

<section
    @if ($id) id="{{ $id }}" @endif
    {{ $attributes->merge(['class' => trim(($bleed ? '' : 'py-28 sm:py-32 ').$class)]) }}
>
    @if ($bleed)
        {{ $slot }}
    @else
        <div class="mx-auto w-full max-w-[1920px] px-6 sm:px-8 lg:px-16">
            {{ $slot }}
        </div>
    @endif
</section>
