<?php

namespace Database\Factories;

use App\Models\Post;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Post>
 */
class PostFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $title = $this->faker->sentence(6);

        return [
            'title' => rtrim($title, '.'),
            'slug' => Str::slug($title).'-'.$this->faker->unique()->numberBetween(1, 100000),
            'excerpt' => $this->faker->sentence(20),
            'body' => $this->faker->paragraphs(5, true),
            'image' => null,
            'faqs' => [
                ['question' => $this->faker->sentence().'?', 'answer' => $this->faker->sentence(15)],
                ['question' => $this->faker->sentence().'?', 'answer' => $this->faker->sentence(15)],
            ],
            'published_at' => $this->faker->dateTimeBetween('-6 months', 'now'),
        ];
    }
}
