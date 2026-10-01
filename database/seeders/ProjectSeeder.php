<?php

namespace Database\Seeders;

use App\Models\Project;
use App\Models\Tag;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class ProjectSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        foreach ($this->projects() as $data) {
            $project = Project::updateOrCreate(
                ['slug' => Str::slug($data['title'])],
                [
                    'title' => $data['title'],
                    'tech_stack' => $data['tech_stack'],
                    'body' => trim($data['body']),
                    'url' => $data['url'],
                    'is_embeddable' => $data['is_embeddable'],
                ]
            );

            $tagIds = collect($data['tags'])->map(fn (string $name) => Tag::firstOrCreate(
                ['slug' => Str::slug($name)],
                ['name' => $name]
            )->id);

            $project->tags()->sync($tagIds);
        }
    }

    /**
     * @return list<array{title: string, tech_stack: string, tags: list<string>, body: string}>
     */
    private function projects(): array
    {
        return [
            [
                'title' => 'Trybestream — Live Audio Broadcasting Platform',
                'tech_stack' => 'Laravel, JavaScript, MySQL, LiveKit, WebRTC, Laravel Reverb, REST API',
                'tags' => ['SaaS', 'Real-time', 'Streaming'],
                'url' => 'https://trybestream.com',
                'is_embeddable' => true,
                'body' => <<<'BODY'
                    Situation
                    Trybestream needed a live audio broadcasting platform that could support community-driven, low-latency streaming at scale — without the production overhead of video — serving education, faith-based, and entertainment communities across global and Nigerian markets.

                    Task
                    As full-stack developer, I was responsible for the real-time streaming infrastructure, the interactive broadcast features, subscription billing, and the REST API layer powering the companion Flutter mobile app.

                    Action
                    I built the live audio and chat architecture using LiveKit (WebRTC) paired with Laravel Reverb (WebSockets), with RTMP ingress support for OBS Studio encoders so broadcasters could stream from professional tools. On top of that infrastructure I developed co-host invitation workflows, hand-raise queueing, live polls and reactions, session recording with on-demand replay, and adaptive audio fallback for unstable connections. For monetization, I implemented subscription-based plan limits with automated billing through Razorpay and Paystack webhooks, and built analytics dashboards tracking peak concurrency and geolocation metrics from a self-hosted IP lookup. Finally, I designed and documented the REST API layer that gives the Flutter mobile app full feature parity with the web platform.

                    Result
                    The platform scaled to support 2,000+ concurrent listeners per broadcast, with billing, mobile, and web all running on the same real-time backbone.
                    BODY,
            ],
            [
                'title' => 'AliveCRM Software',
                'tech_stack' => 'JavaScript, Bootstrap, MySQL, PHP',
                'tags' => ['CRM', 'Internal Tools'],
                'url' => 'https://alivecrm.com',
                'is_embeddable' => false,
                'body' => <<<'BODY'
                    Situation
                    Alive Inc. needed an internal CRM with a notes system that stayed in sync with the central database in real time, plus proper access boundaries between staff and admin accounts.

                    Task
                    Build a dynamically synced notes module and a role-based access control layer for the CRM.

                    Action
                    I built a real-time synchronized notes module that connects user input directly to central database records, and designed role-based access control (RBAC) to manage fine-grained privacy permissions across user and admin accounts.

                    Result
                    Staff can capture and update notes without manual save/refresh cycles, and sensitive records stay scoped to the right roles.
                    BODY,
            ],
            [
                'title' => 'Alive Inc. Official Website',
                'tech_stack' => 'HTML, CSS, JavaScript',
                'tags' => ['Corporate Website', 'Frontend'],
                'url' => 'https://aliveinc.in',
                'is_embeddable' => false,
                'body' => <<<'BODY'
                    Situation
                    Alive Inc. needed a corporate website that could clearly present its full service range — global IT services, AI/ML, OTT, and custom software — to an international client base.

                    Task
                    Engineer the core web structure for the site with responsive, cross-browser compatibility.

                    Action
                    I built out the site's core structure and layout, covering the company's IT, AI/ML, OTT, and custom software service pages, with responsive behavior tested across browsers.

                    Result
                    A consistent, working presence across devices for a company serving clients across India, UAE, Nigeria, Singapore, Kuwait, and Monaco.
                    BODY,
            ],
            [
                'title' => 'Terna Life Platform',
                'tech_stack' => 'WordPress, WooCommerce, PHP, Custom Themes',
                'tags' => ['E-commerce', 'WordPress'],
                'url' => 'https://ternalife.com',
                'is_embeddable' => true,
                'body' => <<<'BODY'
                    Situation
                    Terna Life Sciences, a premium cashew and dry-fruit supplier, needed an e-commerce platform to sell directly to consumers online, with an easy-to-manage product catalog spanning multiple grades and flavors.

                    Task
                    Develop a custom semi-e-commerce WordPress platform focused on content management efficiency and user engagement.

                    Action
                    I built a custom WordPress theme on top of WooCommerce to handle the product catalog — including multiple cashew grades and flavored varieties — along with the content management workflow the team uses to keep listings current.

                    Result
                    A working online storefront the Terna Life team can manage themselves, without needing a developer for routine catalog updates.
                    BODY,
            ],
        ];
    }
}
