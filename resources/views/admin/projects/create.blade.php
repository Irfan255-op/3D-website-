@extends('admin.layout')

@section('title', 'New Case Study')

@section('content')
    <h1 class="text-xl font-bold">New case study</h1>

    <form method="POST" action="{{ route('admin.projects.store') }}" enctype="multipart/form-data" class="mt-6 rounded-xl border border-slate-200 bg-white p-6">
        @csrf
        @include('admin.projects._form')

        <button type="submit" class="mt-6 rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700">
            Publish
        </button>
    </form>
@endsection
