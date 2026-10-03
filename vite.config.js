import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
    plugins: [
        laravel({
            input: ['resources/css/app.css', 'resources/js/app.js'],
            refresh: true,
        }),
        tailwindcss(),
    ],
    server: {
        watch: {
            ignored: ['**/storage/framework/views/**'],
        },
    },
    build: {
        // three.js (~736KB) is the whole reason this warning fires on every
        // build. It's already as split as it can usefully be — dynamically
        // imported only on the homepage, in its own chunk, never part of
        // the initial page load — so the warning was noise, not a real
        // problem to chase. Raised the threshold rather than silencing it
        // outright, so a genuinely oversized *new* chunk still gets flagged.
        chunkSizeWarningLimit: 800,
    },
});
