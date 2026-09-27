<?php

namespace App\Http\Controllers;

use App\Models\Post;
use App\Models\Project;
use Illuminate\Http\Response;

class SitemapController extends Controller
{
    public function __invoke(): Response
    {
        $urls = collect([
            ['loc' => route('home'), 'lastmod' => now()],
            ['loc' => route('work.index'), 'lastmod' => now()],
            ['loc' => route('blog.index'), 'lastmod' => now()],
        ])
            ->concat(Project::query()->get(['slug', 'updated_at'])->map(fn (Project $project) => [
                'loc' => route('work.show', $project),
                'lastmod' => $project->updated_at,
            ]))
            ->concat(
                Post::query()
                    ->whereNotNull('published_at')
                    ->where('published_at', '<=', now())
                    ->get(['slug', 'updated_at'])
                    ->map(fn (Post $post) => [
                        'loc' => route('blog.show', $post),
                        'lastmod' => $post->updated_at,
                    ])
            );

        return response()
            ->view('sitemap', ['urls' => $urls])
            ->header('Content-Type', 'text/xml');
    }
}
