export type PostSeed = {
    title: string
    body?: string
    url?: string
}

export type CommunitySeed = {
    name: string
    description: string
    posts: PostSeed[]
}

export const USERS = [
    'kmartell', 'anna_ldn', 'tobias_r', 'nadia_k', 'perekhod',
    'mgrimes', 'sara_v', 'davidlin', 'yulia_o', 'hnwatcher',
    'rustaceous', 'p_okonkwo', 'lena_b', 'marcus_t', 'ivan_dev',
    'clarissa', 'ops_goblin', 'jrose'
]

export const COMMUNITIES: CommunitySeed[] = [
    {
        name: 'programming',
        description:
            'Computer programming: languages, tools, war stories, and the occasional ' +
            'argument about tabs. Read the posting rules before submitting.',
        posts: [
            {
                title: 'We cut p99 latency by 40% by deleting a cache',
                body:
                    'The cache was added four years ago for an endpoint that has since been ' +
                    'rewritten twice. It had a 3% hit rate and every miss cost us a round trip ' +
                    'to Redis before the query even started.\n\n' +
                    'The lesson is not "caches are bad". It is that nobody owned this one, so ' +
                    'nobody ever checked whether it still earned its keep.'
            },
            {
                title: 'The Go 1.26 release notes are worth reading in full',
                url: 'https://go.dev/doc/devel/release'
            },
            {
                title: 'After twelve years I still write the dumbest possible code first',
                body:
                    'A for loop and three local variables. If it turns out to be hot, the ' +
                    'profiler will say so and I will make it clever then.\n\n' +
                    'Most of it never gets touched again, and the dumb version is the one my ' +
                    'colleagues can fix at 3am.'
            },
            {
                title: 'Code review is mostly a scheduling problem, not a technical one',
                body:
                    'We measured it: the median review took 31 hours, of which 26 minutes were ' +
                    'spent reading code. Everything else was waiting.\n\n' +
                    'Two hours of agreed review time per day fixed more than any checklist we ' +
                    'ever wrote.'
            },
            {
                title: 'A visual guide to how a CPU actually executes your loop',
                url: 'https://cpu.land'
            },
            {
                title: 'Our incident postmortem template, after 40 incidents',
                body:
                    'Three sections survived every revision: what a customer would have seen, ' +
                    'the timeline in UTC, and what we changed so the same detection gap does ' +
                    'not repeat.\n\n' +
                    'Root cause is deliberately not a field. It invites one answer to a question ' +
                    'that usually has four.'
            },
            {
                title: 'What finally made me comfortable with concurrency',
                body:
                    'Stop thinking about threads and start thinking about which pieces of state ' +
                    'two of them can touch at once. The list is always shorter than it feels, ' +
                    'and once it is written down the design mostly falls out.'
            },
            {
                title: 'Falsehoods programmers believe about time, revisited for 2026',
                url: 'https://infiniteundo.com/post/25326999628/falsehoods-programmers-believe-about-time'
            },
            {
                title: 'The refactor nobody asked for paid off two years later',
                body:
                    'I split a 4000 line module into six and got a lot of grumbling in review. ' +
                    'Last month a junior shipped a feature in that area on their second day ' +
                    'without asking anyone a single question. That is the whole return.'
            },
            {
                title: 'Reading the source of your dependencies is a superpower',
                body:
                    'Half the bugs I have chased this year were documented behaviour that the ' +
                    'README did not mention. The code was right there the entire time.'
            }
        ]
    },
    {
        name: 'webdev',
        description: 'Building for the browser. Frameworks, standards, and shipping.',
        posts: [
            {
                title: 'We removed 400KB of JavaScript and nobody noticed except our metrics',
                body:
                    'Two date libraries, a carousel used on one page, and a state manager that ' +
                    'held four booleans. Interaction to next paint dropped by 180ms on the ' +
                    'median mobile session.\n\n' +
                    'No visual change, no support tickets. The bundle had simply never been ' +
                    'anyone job.'
            },
            {
                title: 'Baseline 2026: what is finally safe to use everywhere',
                url: 'https://web.dev/baseline'
            },
            {
                title: 'Server components made our data fetching boring, which is the point',
                body:
                    'No loading state machine, no cache invalidation library, no waterfall we ' +
                    'had to draw on a whiteboard. Just a function that awaits the database and ' +
                    'returns markup.\n\n' +
                    'The parts that genuinely need interactivity are still client components, ' +
                    'and now they are small enough to reason about.'
            },
            {
                title: 'Accessibility audit findings from a real product, all 31 of them',
                body:
                    'Nineteen were missing labels on icon buttons. Six were focus order in ' +
                    'modals. Four were contrast on disabled text that design had signed off on.\n\n' +
                    'Almost nothing required a redesign. It required someone to press Tab.'
            },
            {
                title: 'CSS anchor positioning is shipping in every browser',
                url: 'https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_anchor_positioning'
            },
            {
                title: 'Our forms stopped breaking when we deleted the state library',
                body:
                    'Uncontrolled inputs, a server action, and the validation errors rendered ' +
                    'from whatever the server said. Turns out the platform had this covered ' +
                    'before we started helping it.'
            },
            {
                title: 'Lighthouse score went up, users did not care. Here is what did move',
                body:
                    'Real user monitoring showed our worst sessions were on three year old ' +
                    'Android devices on hotel wifi. Lighthouse on a developer laptop had ' +
                    'nothing to say about them.'
            },
            {
                title: 'The View Transitions examples I keep coming back to',
                url: 'https://developer.chrome.com/docs/web-platform/view-transitions'
            },
            {
                title: 'Hard-won lessons from migrating 200 pages to the app router',
                body:
                    'Do it route by route behind the same nav. Do not try to keep the old data ' +
                    'layer alive in parallel, that is where the two weeks went.'
            },
            {
                title: 'Do not put your CDN in front of your auth endpoints',
                body:
                    'A cached response on a login route is a very short outage followed by a ' +
                    'very long incident review. Ask me how I know.'
            }
        ]
    },
    {
        name: 'rust',
        description: 'A language empowering everyone to build reliable software.',
        posts: [
            {
                title: 'The borrow checker clicked when I stopped fighting lifetimes',
                body:
                    'I spent a month adding annotations until things compiled. Then I started ' +
                    'asking who owns this value, and the annotations mostly stopped being ' +
                    'necessary. The compiler was describing a design problem, not a syntax one.'
            },
            {
                title: 'Rust 1.94 released',
                url: 'https://blog.rust-lang.org/'
            },
            {
                title: 'Rewrote a Python data pipeline in Rust: numbers inside',
                body:
                    'Runtime went from 41 minutes to 96 seconds, memory from 6GB to 380MB. ' +
                    'It also took eleven days instead of the two I promised, and the Python ' +
                    'version was still correct the whole time. Both facts matter.'
            },
            {
                title: 'Async Rust is fine once you accept it is a different language',
                body:
                    'The rules you learned for sync code still apply, but ownership across an ' +
                    'await point is its own topic and pretending otherwise cost me a week.'
            },
            {
                title: 'A gentle introduction to pinning, with pictures',
                url: 'https://doc.rust-lang.org/std/pin/index.html'
            },
            {
                title: 'Cargo workspaces cut our build times in half, here is the layout',
                body:
                    'One crate per bounded context, a thin binary at the top, and shared types ' +
                    'in a leaf crate that depends on nothing. Incremental builds stopped ' +
                    'touching everything on every change.'
            },
            {
                title: 'Unsafe is not a swear word, but it is a promise',
                body:
                    'Every unsafe block in our codebase has a comment above it stating the ' +
                    'invariant the caller must uphold. Writing that sentence has killed more ' +
                    'unsafe blocks than any review ever did.'
            },
            {
                title: 'Comparing serde alternatives for very large payloads',
                url: 'https://serde.rs'
            },
            {
                title: 'Error handling that survived three years in production',
                body:
                    'thiserror in libraries, anyhow at the edges, and one rule: if the error ' +
                    'text cannot tell an on-call engineer what to do next, it is not finished.'
            },
            {
                title: 'What I wish I knew before writing my first proc macro',
                body:
                    'That the compile error your users see is your user interface, and that ' +
                    'you can test the whole thing with trybuild instead of by hand.'
            }
        ]
    },
    {
        name: 'selfhosted',
        description: 'Running your own services on your own hardware.',
        posts: [
            {
                title: 'My whole stack now runs on one mini PC and 40 watts',
                body:
                    'Photos, notes, media, DNS, and a small git host. Idle draw is 11W and it ' +
                    'peaks around 40W during transcodes.\n\n' +
                    'The hard part was never CPU. It was deciding what I was willing to lose ' +
                    'if the disk died on a Tuesday.'
            },
            {
                title: 'Immich 2.0 is out and the migration is painless',
                url: 'https://immich.app'
            },
            {
                title: 'Backups you never restore are not backups. Here is my drill',
                body:
                    'Once a quarter I restore the whole thing to a spare disk and boot it. ' +
                    'Twice now that has caught a broken database dump that had been silently ' +
                    'failing for weeks.'
            },
            {
                title: 'Moved the family off Google Photos and nobody complained',
                body:
                    'The trick was doing the migration quietly over a weekend and making the ' +
                    'app icon look the same on their phones. Nobody has asked a single question ' +
                    'in eight months.'
            },
            {
                title: 'A Tailscale and Caddy config that finally made sense to me',
                url: 'https://tailscale.com/kb'
            },
            {
                title: 'Six months with a homemade NAS: what broke',
                body:
                    'One fan, one SATA cable, and my own assumption that ZFS scrubs were ' +
                    'running because I had written the cron line. I had not enabled the timer.'
            },
            {
                title: 'Monitoring for people who do not want to run Prometheus',
                body:
                    'A shell script, a text file of checks, and an email when something has ' +
                    'been wrong for ten minutes. It has caught every real outage I have had.'
            },
            {
                title: 'A shopping list for a quiet, low power home server',
                url: 'https://www.servethehome.com'
            },
            {
                title: 'I stopped exposing anything to the internet and slept better',
                body:
                    'Everything is on the tailnet now. My reverse proxy logs went from ' +
                    'thousands of probe requests a day to zero, and my threat model got a lot ' +
                    'shorter.'
            },
            {
                title: 'Compose files I actually reuse across machines',
                body:
                    'One file per service, environment in a .env next to it, and no bind mounts ' +
                    'outside a single data directory. Moving a service to a new box is now a ' +
                    'copy and a docker compose up.'
            }
        ]
    },
    {
        name: 'databases',
        description: 'Query plans, indexes, and the people who read them for fun.',
        posts: [
            {
                title: 'The index existed, the planner ignored it, here is why',
                body:
                    'Our sort was on (created_at DESC, id DESC) and the index was on ' +
                    '(created_at, id) ascending. Postgres can walk an index backwards, but not ' +
                    'when the two columns disagree about direction.\n\n' +
                    'One CREATE INDEX later the plan went from a sequential scan over 280k rows ' +
                    'to an index scan returning 21.'
            },
            {
                title: 'PostgreSQL 18 released',
                url: 'https://www.postgresql.org/about/news/'
            },
            {
                title: 'We replaced OFFSET pagination with keyset and the p99 halved',
                body:
                    'OFFSET 10000 still reads ten thousand rows and throws them away. Row value ' +
                    'comparison, (created_at, id) < (:cursor_time, :cursor_id), reads exactly ' +
                    'the page you asked for.\n\n' +
                    'Writing it as separate OR clauses looks equivalent and is not. The tuple ' +
                    'form becomes an index condition, the OR form becomes a filter.'
            },
            {
                title: 'Deadlocks were not the problem, our retry loop was',
                body:
                    'Two transactions taking the same two rows in different orders is a bug you ' +
                    'fix once. Retrying immediately, forever, with no jitter, is a bug that ' +
                    'takes the database with it.'
            },
            {
                title: 'A practical guide to reading EXPLAIN ANALYZE',
                url: 'https://www.postgresql.org/docs/current/using-explain.html'
            },
            {
                title: 'Partitioning a 400 million row table without downtime',
                body:
                    'Attach the old table as a partition, write to the new ones, backfill in ' +
                    'batches small enough that autovacuum keeps up. It took three weeks and the ' +
                    'application never knew.'
            },
            {
                title: 'Full text search in Postgres carried us to a million documents',
                body:
                    'A tsvector column, setweight so the title outranks the body, and a GIN ' +
                    'index. Queries that took 90ms with ILIKE now take under a millisecond ' +
                    'when nothing matches, which is most of the time.\n\n' +
                    'We will move to a real search engine eventually. That day is not close.'
            },
            {
                title: 'Why connection poolers matter more than you think',
                url: 'https://www.pgbouncer.org'
            },
            {
                title: 'Counting rows is harder than it looks at scale',
                body:
                    'Exact counts mean reading every row. Almost every count in a product UI ' +
                    'is decoration, and an estimate from the statistics tables is both free and ' +
                    'good enough.'
            },
            {
                title: 'Our migration checklist after one very bad Friday',
                body:
                    'Nothing that takes an ACCESS EXCLUSIVE lock on a hot table without a lock ' +
                    'timeout. Nothing that both adds a column and backfills it in one statement. ' +
                    'And no deploys after 15:00 local time.'
            }
        ]
    }
]

export const OPENERS = [
    'This matches what we saw. The tricky part was that the fix only helped under load, so it looked useless in staging.',
    'Good writeup. Do you have numbers for the p50 as well, or did that stay flat?',
    'We tried something similar last year and rolled it back. Our traffic pattern was much spikier than yours, which I suspect is the whole difference.',
    'The part about ownership is the real lesson here. Every system I have worked on had at least one component nobody would admit to.',
    'Saving this for the next time someone on my team proposes the clever version first.',
    'Honest question: how long did this take end to end, including the parts that did not work?',
    'I disagree with the framing but not the conclusion. The measurement is what convinced me.',
    'We have the exact opposite experience at a much smaller scale, which probably says more about scale than about the approach.',
    'Anyone got a link to the earlier discussion on this? I remember a thread from about a year ago with better benchmarks.',
    'This is the third time this month I have read a version of this and I am starting to think it is just true.',
    'What did your rollback plan look like? That is usually the part people leave out.',
    'Great, now I have to go look at our own config and I already know what I am going to find.',
    'Counterpoint: most teams do not have the headroom to do this properly, and the half-finished version is worse than not starting.',
    'Been running this in production for about eight months. No regrets, but the first two weeks were rough.',
    'The diagram helped more than the text, which I mean as a compliment.',
    'Slightly off topic, but which tool did you use for the graphs?',
    'I would add one thing: write down the assumption before you test it, otherwise you will remember having predicted whatever happened.',
    'This is good advice for a team of five and terrible advice for a team of fifty. Worth saying which one you are.',
    'Our postmortem for a nearly identical outage came to the same conclusion, right down to the retry loop.',
    'Thanks for including the failures. Those are the useful half and almost nobody publishes them.',
    'How does this hold up when the data does not fit in memory anymore? That is where our version fell over.',
    'I have been the person arguing against this for two years and I am now fairly sure I was wrong.',
    'Small correction: the default changed in the last release, so the second paragraph is out of date.',
    'The 3am test is the only benchmark that has ever mattered to me.',
    'What surprised me most is how boring the fix turned out to be.'
]

export const REPLIES = [
    'Yes, exactly this. We measured it and the difference was about 12%.',
    'Depends entirely on your write volume. Under 100 writes a second none of this shows up.',
    'Do you have a source for that? Not doubting, I would just like to read the details.',
    'Same, although we ended up going the other way for reasons that had nothing to do with performance.',
    'It is in the docs, though admittedly buried in a section nobody reads.',
    'That was true before, but it changed a couple of releases ago.',
    'Fair. I think we are actually agreeing and arguing about the word.',
    'This is the trade-off people miss. You are buying simplicity with a bill that arrives later.',
    'Have you tried it with the batch size lowered? That fixed it for us.',
    'In our case the bottleneck turned out to be the network, not the database at all.',
    'Right, and that is precisely why the naive version is fine for the first two years.',
    'I would push back on that a little. The failure mode is not that rare.',
    'We hit the same wall. The workaround is ugly but it has been stable for a year.',
    'Not in every case. If your keys are sequential the behaviour is completely different.',
    'Thanks, that explains something I have been confused about for months.',
    'The real answer is that it depends on your read to write ratio, which nobody ever states.',
    'This is only true if you are running the default configuration, which almost nobody is.',
    'Agreed on the principle, but the example is a bit of a strawman.',
    'Worth noting that this behaves differently on managed hosting.',
    'We profiled it and the time was going somewhere completely unexpected, which is the usual story.',
    'Fixed it by deleting the code. Best patch I have written all year.',
    'Careful with that, it silently truncates on older versions.',
    'That has not been my experience, but our workload is unusual enough that I would not generalise from it.',
    'Solid. Bookmarking this for the next design review.',
    'You can, but you probably should not. It works right up until the first schema change.'
]
