<div class="space-y-5">
    <div>
        <label for="title" class="block text-sm font-medium text-slate-700">Title</label>
        <input id="title" type="text" name="title" value="{{ old('title', $project->title) }}" required
            aria-invalid="{{ $errors->has('title') ? 'true' : 'false' }}"
            aria-describedby="title-error"
            class="mt-1 w-full rounded-md border px-3 py-2 text-sm {{ $errors->has('title') ? 'border-red-400' : 'border-slate-300' }}">
        @error('title')
            <p id="title-error" class="mt-1 text-sm text-red-600">{{ $message }}</p>
        @enderror
    </div>

    <div>
        <label for="tech_stack" class="block text-sm font-medium text-slate-700">Tech stack (comma separated)</label>
        <input id="tech_stack" type="text" name="tech_stack" value="{{ old('tech_stack', $project->tech_stack) }}" required
            placeholder="Laravel, PHP, MySQL, TailwindCSS&hellip;"
            aria-invalid="{{ $errors->has('tech_stack') ? 'true' : 'false' }}"
            aria-describedby="tech_stack-error"
            class="mt-1 w-full rounded-md border px-3 py-2 text-sm {{ $errors->has('tech_stack') ? 'border-red-400' : 'border-slate-300' }}">
        @error('tech_stack')
            <p id="tech_stack-error" class="mt-1 text-sm text-red-600">{{ $message }}</p>
        @enderror
    </div>

    <div>
        <label for="tags" class="block text-sm font-medium text-slate-700">Tags (comma separated)</label>
        <input id="tags" type="text" name="tags" value="{{ old('tags', $project->tags->pluck('name')->implode(', ')) }}"
            placeholder="API, E-commerce, SaaS&hellip;"
            aria-invalid="{{ $errors->has('tags') ? 'true' : 'false' }}"
            aria-describedby="tags-error"
            class="mt-1 w-full rounded-md border px-3 py-2 text-sm {{ $errors->has('tags') ? 'border-red-400' : 'border-slate-300' }}">
        @error('tags')
            <p id="tags-error" class="mt-1 text-sm text-red-600">{{ $message }}</p>
        @enderror
    </div>

    <div>
        <label for="body" class="block text-sm font-medium text-slate-700">Case study (STAR format works well)</label>
        <textarea id="body" name="body" rows="10" required
            aria-invalid="{{ $errors->has('body') ? 'true' : 'false' }}"
            aria-describedby="body-error"
            class="mt-1 w-full rounded-md border px-3 py-2 text-sm {{ $errors->has('body') ? 'border-red-400' : 'border-slate-300' }}">{{ old('body', $project->body) }}</textarea>
        @error('body')
            <p id="body-error" class="mt-1 text-sm text-red-600">{{ $message }}</p>
        @enderror
    </div>

    <div>
        <label for="url" class="block text-sm font-medium text-slate-700">Live project URL</label>
        <input id="url" type="url" name="url" value="{{ old('url', $project->url) }}"
            placeholder="https://example.com"
            aria-invalid="{{ $errors->has('url') ? 'true' : 'false' }}"
            aria-describedby="url-error"
            class="mt-1 w-full rounded-md border px-3 py-2 text-sm {{ $errors->has('url') ? 'border-red-400' : 'border-slate-300' }}">
        @error('url')
            <p id="url-error" class="mt-1 text-sm text-red-600">{{ $message }}</p>
        @enderror
    </div>

    <div class="flex items-start gap-2">
        <input id="is_embeddable" type="checkbox" name="is_embeddable" value="1" {{ old('is_embeddable', $project->is_embeddable) ? 'checked' : '' }}
            class="mt-1 rounded border-slate-300">
        <label for="is_embeddable" class="text-sm text-slate-700">
            Allow live preview embed
            <span class="block text-xs text-slate-400">Only enable if the site doesn't block iframes (check for X-Frame-Options / CSP headers first) &mdash; otherwise the preview will show blank.</span>
        </label>
    </div>

    <div>
        <label for="image" class="block text-sm font-medium text-slate-700">Cover image</label>
        <input id="image" type="file" name="image" accept="image/*"
            aria-invalid="{{ $errors->has('image') ? 'true' : 'false' }}"
            aria-describedby="image-error"
            class="mt-1 w-full text-sm">
        @error('image')
            <p id="image-error" class="mt-1 text-sm text-red-600">{{ $message }}</p>
        @enderror
        @if ($project->image)
            <img src="{{ Storage::url($project->image) }}" alt="Current cover image for {{ $project->title }}" class="mt-3 h-32 rounded-md border border-slate-200 object-cover">
        @endif
    </div>
</div>
