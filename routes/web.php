<?php

use App\Http\Controllers\Admin\AuthController as AdminAuthController;
use App\Http\Controllers\Admin\ContactMessageController as AdminContactMessageController;
use App\Http\Controllers\Admin\ProjectController as AdminProjectController;
use App\Http\Controllers\ContactController;
use App\Http\Controllers\HomeController;
use App\Http\Controllers\PostController;
use App\Http\Controllers\ProjectController;
use App\Http\Controllers\SitemapController;
use Illuminate\Support\Facades\Route;

Route::get('/', [HomeController::class, 'index'])->name('home');

Route::get('/sitemap.xml', SitemapController::class)->name('sitemap');

Route::get('/work', [ProjectController::class, 'index'])->name('work.index');
Route::get('/work/{project}', [ProjectController::class, 'show'])->name('work.show');

Route::get('/blog', [PostController::class, 'index'])->name('blog.index');
Route::get('/blog/{post}', [PostController::class, 'show'])->name('blog.show');

Route::get('/contact', [ContactController::class, 'create'])->name('contact');
Route::post('/contact', [ContactController::class, 'store'])
    ->middleware('throttle:5,1')
    ->name('contact.store');

Route::prefix('admin')->name('admin.')->group(function () {
    Route::get('login', [AdminAuthController::class, 'create'])->name('login')->middleware('guest');
    Route::post('login', [AdminAuthController::class, 'store'])->middleware('guest');
    Route::post('logout', [AdminAuthController::class, 'destroy'])->name('logout')->middleware('auth');

    Route::middleware('auth')->group(function () {
        Route::resource('projects', AdminProjectController::class)->except('show');

        Route::get('messages', [AdminContactMessageController::class, 'index'])->name('messages.index');
        Route::post('messages/{message}/read', [AdminContactMessageController::class, 'markAsRead'])->name('messages.read');
        Route::delete('messages/{message}', [AdminContactMessageController::class, 'destroy'])->name('messages.destroy');
    });
});
