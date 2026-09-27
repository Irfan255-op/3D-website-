<?php

namespace Database\Factories;

use App\Models\Project;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Project>
 */
class ProjectFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $title = $this->faker->words(3, true);

        return [
            'title' => Str::title($title),
            'slug' => Str::slug($title).'-'.$this->faker->unique()->numberBetween(1, 100000),
            'tech_stack' => implode(', ', $this->faker->randomElements(
                ['Laravel', 'PHP', 'MySQL', 'TailwindCSS', 'Vite', 'Alpine.js', 'JavaScript'],
                3
            )),
            'body' => $this->faker->paragraphs(3, true),
            'image' => null,
        ];
    }
}
