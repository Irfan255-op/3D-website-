<?php

namespace App\Http\Controllers;

use App\Models\ContactMessage;
use Illuminate\Contracts\View\View;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class ContactController extends Controller
{
    public function create(): View
    {
        return view('contact');
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255'],
            'message' => ['required', 'string', 'max:5000'],
            'company' => ['prohibited'],
        ], [
            'company.prohibited' => 'Something went wrong. Please try again.',
        ]);

        ContactMessage::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'message' => $data['message'],
        ]);

        return back()
            ->with('status', 'Thanks for reaching out — I\'ll get back to you soon.');
    }
}
