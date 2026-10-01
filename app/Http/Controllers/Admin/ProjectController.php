<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Project;
use App\Models\Tag;
use Illuminate\Contracts\View\View;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ProjectController extends Controller
{
    public function index(): View
    {
        $projects = Project::query()->latest()->paginate(15);

        return view('admin.projects.index', [
            'projects' => $projects,
        ]);
    }

    public function create(): View
    {
        return view('admin.projects.create', [
            'project' => new Project,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $this->validateProject($request);

        $project = Project::create($this->projectAttributes($data));

        $this->syncTags($project, $data['tags'] ?? '');

        return redirect()
            ->route('admin.projects.index')
            ->with('status', 'Case study created.');
    }

    public function edit(Project $project): View
    {
        return view('admin.projects.edit', [
            'project' => $project->load('tags'),
        ]);
    }

    public function update(Request $request, Project $project): RedirectResponse
    {
        $data = $this->validateProject($request, $project);

        $project->update($this->projectAttributes($data));

        $this->syncTags($project, $data['tags'] ?? '');

        return redirect()
            ->route('admin.projects.index')
            ->with('status', 'Case study updated.');
    }

    public function destroy(Project $project): RedirectResponse
    {
        $project->delete();

        return redirect()
            ->route('admin.projects.index')
            ->with('status', 'Case study deleted.');
    }

    /**
     * @return array<string, mixed>
     */
    private function validateProject(Request $request, ?Project $project = null): array
    {
        return $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'tech_stack' => ['required', 'string', 'max:255'],
            'body' => ['required', 'string'],
            'image' => ['nullable', 'image', 'max:4096'],
            'tags' => ['nullable', 'string'],
            'url' => ['nullable', 'url', 'max:255'],
            'is_embeddable' => ['nullable', 'boolean'],
        ]);
    }

    /**
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    private function projectAttributes(array $data): array
    {
        $attributes = [
            'title' => $data['title'],
            'slug' => Str::slug($data['title']),
            'tech_stack' => $data['tech_stack'],
            'body' => $data['body'],
            'url' => $data['url'] ?? null,
            'is_embeddable' => $data['is_embeddable'] ?? false,
        ];

        if (request()->hasFile('image')) {
            $attributes['image'] = request()->file('image')->store('projects', 'public');
        }

        return $attributes;
    }

    private function syncTags(Project $project, string $tags): void
    {
        $tagIds = collect(explode(',', $tags))
            ->map(fn (string $name) => trim($name))
            ->filter()
            ->map(function (string $name) {
                $tag = Tag::firstOrCreate(
                    ['slug' => Str::slug($name)],
                    ['name' => Str::title($name)]
                );

                return $tag->id;
            });

        $project->tags()->sync($tagIds);
    }
}
