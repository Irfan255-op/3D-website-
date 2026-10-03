@extends('layouts.app')

@section('title', $post->title)
@section('description', $post->excerpt)

@section('content')
    <x-section class="stage-section">
        <article class="stage-card stage-card--wide mx-auto">
            <a href="{{ route('blog.index') }}" data-magnetic class="inline-flex text-sm font-semibold text-slate-500 hover:text-brand-600">
                <span aria-hidden="true">&larr;</span>&nbsp;Back to blog
            </a>

            <h1 data-scramble class="mt-4 font-serif text-4xl font-medium text-slate-900 sm:text-5xl">{{ $post->title }}</h1>
            <p class="mt-1 font-mono text-xs text-slate-400">{{ $post->published_at->format('F j, Y') }}</p>

            @if ($post->image)
                <img src="{{ Storage::url($post->image) }}" alt="{{ $post->title }}" loading="lazy" class="mt-8 w-full rounded-xl border border-slate-200 object-cover">
            @endif

            <div class="prose prose-slate mt-10 max-w-none">
                {!! nl2br(e($post->body)) !!}
            </div>

            @if (! empty($post->faqs))
                <section class="mt-12 border-t border-slate-200 pt-8" aria-label="Frequently asked questions">
                    <h2 class="font-serif text-xl font-medium text-slate-900">FAQs</h2>
                    <dl class="mt-4 space-y-6">
                        @foreach ($post->faqs as $faq)
                            <div>
                                <dt class="font-semibold text-slate-900">{{ $faq['question'] }}</dt>
                                <dd class="mt-1 text-slate-600">{{ $faq['answer'] }}</dd>
                            </div>
                        @endforeach
                    </dl>
                </section>

                <script type="application/ld+json">
                    {!! json_encode([
                        '@context' => 'https://schema.org',
                        '@type' => 'FAQPage',
                        'mainEntity' => collect($post->faqs)->map(fn ($faq) => [
                            '@type' => 'Question',
                            'name' => $faq['question'],
                            'acceptedAnswer' => [
                                '@type' => 'Answer',
                                'text' => $faq['answer'],
                            ],
                        ])->all(),
                    ], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE) !!}
                </script>
            @endif
        </article>
    </x-section>
@endsection
