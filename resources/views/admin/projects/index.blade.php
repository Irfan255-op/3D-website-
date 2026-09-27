@extends('admin.layout')

@section('title', 'Manage Case Studies')

@section('content')
    <div class="flex items-center justify-between">
        <h1 class="text-xl font-bold">Case studies</h1>
        <a href="{{ route('admin.projects.create') }}" class="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700">
            New case study
        </a>
    </div>

    <div class="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table class="w-full text-left text-sm">
            <thead class="bg-slate-50 text-slate-500">
                <tr>
                    <th class="px-4 py-3">Title</th>
                    <th class="px-4 py-3">Tech stack</th>
                    <th class="px-4 py-3">Updated</th>
                    <th class="px-4 py-3"></th>
                </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
                @forelse ($projects as $project)
                    <tr>
                        <td class="px-4 py-3 font-medium text-slate-900">{{ $project->title }}</td>
                        <td class="px-4 py-3 text-slate-500">{{ $project->tech_stack }}</td>
                        <td class="px-4 py-3 text-slate-500">{{ $project->updated_at->diffForHumans() }}</td>
                        <td class="px-4 py-3 text-right">
                            <a href="{{ route('admin.projects.edit', $project) }}" class="font-medium text-slate-600 hover:text-slate-900">Edit</a>
                            <form method="POST" action="{{ route('admin.projects.destroy', $project) }}" class="inline"
                                onsubmit="return confirm('Delete this case study?');">
                                @csrf
                                @method('DELETE')
                                <button type="submit" class="ml-3 font-medium text-red-600 hover:text-red-800">Delete</button>
                            </form>
                        </td>
                    </tr>
                @empty
                    <tr>
                        <td colspan="4" class="px-4 py-6 text-center text-slate-400">No case studies yet.</td>
                    </tr>
                @endforelse
            </tbody>
        </table>
    </div>

    <div class="mt-6">
        {{ $projects->links() }}
    </div>
@endsection
