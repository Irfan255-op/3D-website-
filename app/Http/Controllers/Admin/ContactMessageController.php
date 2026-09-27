<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ContactMessage;
use Illuminate\Contracts\View\View;
use Illuminate\Http\RedirectResponse;

class ContactMessageController extends Controller
{
    public function index(): View
    {
        $messages = ContactMessage::query()->latest()->paginate(20);

        return view('admin.messages.index', [
            'messages' => $messages,
        ]);
    }

    public function markAsRead(ContactMessage $message): RedirectResponse
    {
        $message->update(['read_at' => now()]);

        return back();
    }

    public function destroy(ContactMessage $message): RedirectResponse
    {
        $message->delete();

        return redirect()
            ->route('admin.messages.index')
            ->with('status', 'Message deleted.');
    }
}
