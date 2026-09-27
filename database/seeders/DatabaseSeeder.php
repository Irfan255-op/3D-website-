<?php

namespace Database\Seeders;

use App\Models\Post;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        User::firstOrCreate(
            ['email' => 'shoeb4303@gmail.com'],
            [
                'name' => 'Admin',
                'password' => bcrypt('shoeb4303@##!#!'),
            ]
        );

        $this->call(ProjectSeeder::class);

        if (Post::count() === 0) {
            Post::factory(3)->create();
        }
    }
}
