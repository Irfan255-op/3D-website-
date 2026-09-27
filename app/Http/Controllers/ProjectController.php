<?php

namespace App\Http\Controllers;

use App\Models\Project;
use Illuminate\Contracts\View\View;

class ProjectController extends Controller
{
    public function index(): View
    {
        $projects = Project::query()
            ->with('tags')
            ->latest()
            ->paginate(9);

        return view('projects.index', [
            'projects' => $projects,
        ]);
    }

    public function show(Project $project): View
    {
        $project->load('tags');

        return view('projects.show', [
            'project' => $project,
        ]);
    }
}
