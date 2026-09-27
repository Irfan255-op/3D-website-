@extends('admin.layout')

@section('title', 'Contact Messages')

@section('content')
    <h1 class="text-xl font-bold">Contact messages</h1>

    <div class="mt-6 space-y-4">
        @forelse ($messages as $message)
            <div class="rounded-xl border bg-white p-5 {{ $message->read_at ? 'border-slate-200' : 'border-blue-300' }}">
                <div class="flex items-start justify-between gap-4">
                    <div>
                        <p class="font-semibold text-slate-900">
                            {{ $message->name }}
                            @unless ($message->read_at)
                                <span class="ml-2 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">New</span>
                            @endunless
                        </p>
                        <a href="mailto:{{ $message->email }}" class="text-sm text-slate-500 hover:text-blue-600">{{ $message->email }}</a>
                    </div>
                    <span class="shrink-0 text-xs text-slate-400">{{ $message->created_at->diffForHumans() }}</span>
                </div>

                <p class="mt-3 whitespace-pre-line text-sm text-slate-700">{{ $message->message }}</p>

                <div class="mt-4 flex gap-3 text-sm">
                    @unless ($message->read_at)
                        <form method="POST" action="{{ route('admin.messages.read', $message) }}">
                            @csrf
                            <button type="submit" class="font-medium text-slate-600 hover:text-slate-900">Mark as read</button>
                        </form>
                    @endunless
                    <form method="POST" action="{{ route('admin.messages.destroy', $message) }}" onsubmit="return confirm('Delete this message?');">
                        @csrf
                        @method('DELETE')
                        <button type="submit" class="font-medium text-red-600 hover:text-red-800">Delete</button>
                    </form>
                </div>
            </div>
        @empty
            <p class="text-slate-400">No messages yet.</p>
        @endforelse
    </div>

    <div class="mt-6">
        {{ $messages->links() }}
    </div>
@endsection
