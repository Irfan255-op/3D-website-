<?php

namespace App\Http\Controllers;

use App\Models\Project;
use Illuminate\Contracts\View\View;

class HomeController extends Controller
{
    public function index(): View
    {
        return view('home', [
            'projects' => Project::query()->latest()->take(6)->get(),
            // Drives a small credibility line in the hero — a live count so
            // it stays accurate as projects are added, rather than a number
            // hand-typed into the view that quietly goes stale.
            'projectCount' => Project::query()->count(),
        ]);
    }
}
