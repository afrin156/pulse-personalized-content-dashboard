import type { ContentItem } from './types';

/**
 * Built-in sample data. It is used when no API keys are configured (or when a
 * live API fails), so the dashboard always has something to show.
 * Times are expressed as "minutes ago" and resolved at request time.
 */

interface RawNews {
  title: string;
  description: string;
  source: string;
  minutesAgo: number;
  score: number;
}

const NEWS: Record<string, RawNews[]> = {
  technology: [
    { title: 'Open-source browser engine reaches a major performance milestone', description: 'Contributors report double-digit gains in layout and scripting benchmarks after a year-long rewrite of the rendering pipeline.', source: 'Byte Ledger', minutesAgo: 35, score: 92 },
    { title: 'Chipmakers race to ship low-power AI accelerators for laptops', description: 'New designs promise all-day battery life while running language models locally, shifting work away from the cloud.', source: 'Circuit Daily', minutesAgo: 150, score: 88 },
    { title: 'Developers adopt typed APIs to cut production bugs', description: 'A survey of engineering teams finds end-to-end type safety is now the top reason for framework choice.', source: 'Stack Weekly', minutesAgo: 410, score: 71 },
    { title: 'Quantum networking test links two campuses with entangled photons', description: 'Researchers demonstrate a stable link over existing fibre, a step toward practical secure communication.', source: 'Signal & Noise', minutesAgo: 900, score: 66 },
    { title: 'Cities pilot open data portals for real-time transit', description: 'Open feeds let independent developers build apps that predict delays more accurately than official boards.', source: 'Civic Tech Post', minutesAgo: 1700, score: 54 },
  ],
  sports: [
    { title: 'Late goal seals dramatic comeback in the championship semi-final', description: 'A stoppage-time header turned a one-goal deficit into a famous win in front of a sell-out crowd.', source: 'Matchday', minutesAgo: 55, score: 95 },
    { title: 'Marathon record falls on a fast, flat course', description: 'The winner shaved nearly a minute off the previous best, crediting new pacing strategy and cool weather.', source: 'Track & Road', minutesAgo: 200, score: 84 },
    { title: 'Young prospect signs landmark deal with home-town club', description: 'The 19-year-old midfielder commits to a five-year contract after a breakout season.', source: 'Transfer Desk', minutesAgo: 520, score: 69 },
    { title: 'Cricket board announces expanded women\'s league calendar', description: 'More fixtures and bigger prize money are planned as attendance and viewership keep growing.', source: 'Boundary Line', minutesAgo: 1100, score: 62 },
    { title: 'Tennis veteran announces farewell season', description: 'After two decades on tour, the former world number one will retire at the end of the year.', source: 'Court Report', minutesAgo: 2000, score: 58 },
  ],
  finance: [
    { title: 'Central bank holds rates steady, signals cautious path ahead', description: 'Policymakers cited cooling inflation but warned that services prices remain stubborn.', source: 'Market Ledger', minutesAgo: 45, score: 90 },
    { title: 'Small-cap stocks rally as investors rotate out of mega-caps', description: 'Analysts say broader participation in the rally is a healthy sign for the market.', source: 'Street Wire', minutesAgo: 240, score: 79 },
    { title: 'Retail investors embrace low-cost index funds in record numbers', description: 'Fund flows show steady monthly contributions, even through volatile weeks.', source: 'Capital Notes', minutesAgo: 600, score: 64 },
    { title: 'Startups see funding shift toward profitability over growth', description: 'Investors now ask for a clear path to break-even before committing to later-stage rounds.', source: 'Venture Brief', minutesAgo: 1300, score: 57 },
    { title: 'Digital payments volume climbs as cash use declines again', description: 'Merchants report faster checkout and lower handling costs after adopting contactless terminals.', source: 'Pay Review', minutesAgo: 2300, score: 52 },
  ],
  health: [
    { title: 'Large study links daily walking to lower risk of heart disease', description: 'Even modest step counts showed benefit, with returns levelling off at around eight thousand steps.', source: 'Health Journal', minutesAgo: 70, score: 86 },
    { title: 'Sleep researchers urge schools to start the day later', description: 'Evidence suggests teenagers perform better on tests when classes begin after 8:30 a.m.', source: 'Wellness Today', minutesAgo: 330, score: 74 },
    { title: 'New guidance simplifies advice on balanced eating', description: 'The updated framework focuses on whole foods and flexible portions rather than strict rules.', source: 'Nutrition Weekly', minutesAgo: 780, score: 61 },
    { title: 'Hospitals trial AI note-taking to give clinicians time back', description: 'Early results show less after-hours paperwork and higher patient satisfaction.', source: 'Care Tech', minutesAgo: 1500, score: 68 },
    { title: 'Community clinics expand mental-health walk-in hours', description: 'Longer opening times aim to cut waiting lists and offer earlier support.', source: 'Public Health Post', minutesAgo: 2600, score: 50 },
  ],
  entertainment: [
    { title: 'Indie festival favourite lands a wide theatrical release', description: 'The low-budget drama won audience awards and will now open in hundreds of cinemas.', source: 'Screen Daily', minutesAgo: 85, score: 83 },
    { title: 'Streaming services experiment with shorter seasons', description: 'Producers say tighter scripts and lower costs are making limited runs more attractive.', source: 'Stream Watch', minutesAgo: 360, score: 72 },
    { title: 'Orchestra premieres a score built from field recordings', description: 'The composer collected sounds from rivers, markets and railways across three countries.', source: 'Culture Desk', minutesAgo: 840, score: 59 },
    { title: 'Video game studio shares a behind-the-scenes look at its next release', description: 'A developer diary shows how animators and designers built the open world over four years.', source: 'Pixel Press', minutesAgo: 1600, score: 77 },
    { title: 'Touring bands turn to smaller venues for closer shows', description: 'Fans respond to cheaper tickets and intimate sets with sell-outs across the circuit.', source: 'Live Notes', minutesAgo: 2700, score: 55 },
  ],
  science: [
    { title: 'Telescope captures the clearest image yet of a forming planetary system', description: 'The new data reveals gaps in the dust disc that astronomers say are carved by young planets.', source: 'Cosmos Letter', minutesAgo: 60, score: 91 },
    { title: 'Deep-sea expedition catalogues dozens of previously unknown species', description: 'Remote cameras recorded translucent fish and glowing invertebrates at record depths.', source: 'Ocean Review', minutesAgo: 280, score: 80 },
    { title: 'Battery chemistry breakthrough promises faster charging', description: 'Lab cells recovered most of their capacity in minutes while surviving thousands of cycles.', source: 'Lab Notes', minutesAgo: 700, score: 76 },
    { title: 'Climate models improve regional rainfall forecasts', description: 'Higher resolution and better ocean data helped predict monsoon timing more reliably.', source: 'Earth Science Weekly', minutesAgo: 1400, score: 63 },
    { title: 'Ancient genome study rewrites a chapter of early farming', description: 'DNA from burial sites shows farming spread through migration as well as shared ideas.', source: 'Origins Journal', minutesAgo: 2400, score: 56 },
  ],
};

interface RawMovie {
  title: string;
  description: string;
  genre: string;
  score: number;
  year: number;
}

const MOVIES: RawMovie[] = [
  { title: 'Orbital Drift', description: 'A salvage crew finds a silent station at the edge of the solar system and a message meant for someone else.', genre: 'Sci-Fi', score: 94, year: 2025 },
  { title: 'The Last Lighthouse', description: 'A keeper and a stranded sailor hold out through one storm that refuses to end.', genre: 'Drama', score: 87, year: 2024 },
  { title: 'Neon Alley', description: 'A courier takes one job too many in a city that never turns the lights off.', genre: 'Thriller', score: 82, year: 2025 },
  { title: 'Paper Moons', description: 'Two animators from rival studios team up to rescue their hand-drawn film.', genre: 'Animation', score: 90, year: 2025 },
  { title: 'Summit Fever', description: 'A guide must choose between a record attempt and the safety of her team.', genre: 'Adventure', score: 78, year: 2023 },
  { title: 'Second Spring', description: 'Two widowed neighbours begin a garden, and something more, in the shade of an old orchard.', genre: 'Romance', score: 73, year: 2024 },
  { title: 'Laugh Track', description: 'A struggling comedian discovers her late-night set is being broadcast to the whole town.', genre: 'Comedy', score: 80, year: 2025 },
  { title: 'The Quiet Floor', description: 'Night staff at a hospital notice that the empty ward has started to keep its own schedule.', genre: 'Horror', score: 68, year: 2024 },
  { title: 'Dragon of Saltmere', description: 'A fisherman\'s daughter befriends a sea dragon and sets out to bring it home.', genre: 'Fantasy', score: 85, year: 2025 },
  { title: 'Static', description: 'An engineer decodes a radio signal that predicts tomorrow\'s news with perfect accuracy.', genre: 'Sci-Fi', score: 89, year: 2024 },
  { title: 'High Stakes Kitchen', description: 'A chef takes over a failing restaurant with one week before the critics arrive.', genre: 'Comedy', score: 71, year: 2023 },
  { title: 'Longitude', description: 'A cartographer\'s apprentice follows a faulty map into a forgotten kingdom.', genre: 'Adventure', score: 76, year: 2024 },
  { title: 'Ashes of Summer', description: 'Three siblings return to a family home to settle an estate and old arguments.', genre: 'Drama', score: 84, year: 2025 },
  { title: 'Cold Signal', description: 'A detective with a failing memory races to solve her own case before it fades.', genre: 'Thriller', score: 79, year: 2023 },
  { title: 'Moonwalkers', description: 'A group of kids builds a rocket from scrap and attempts to reach the edge of the sky.', genre: 'Animation', score: 75, year: 2024 },
];

interface RawPost {
  author: string;
  handle: string;
  text: string;
  tags: string[];
  minutesAgo: number;
  score: number;
}

const POSTS: RawPost[] = [
  { author: 'Maya Chen', handle: 'mayabuilds', text: 'Shipped our new dashboard today. Moving server state into a typed store removed half of our bugs overnight.', tags: ['webdev', 'react'], minutesAgo: 12, score: 91 },
  { author: 'Arjun Nair', handle: 'arjun_codes', text: 'Hot take: a good loading skeleton does more for perceived speed than any amount of micro-optimising.', tags: ['webdev', 'ux'], minutesAgo: 40, score: 83 },
  { author: 'Lena Fischer', handle: 'lenaruns', text: 'Long run done. Ten kilometres before sunrise and the city was completely quiet. Highly recommend.', tags: ['fitness', 'running'], minutesAgo: 75, score: 66 },
  { author: 'Dev Patel', handle: 'devpatel_ai', text: 'Tried running a small language model fully on-device today. Latency is lower than my coffee order.', tags: ['ai', 'machinelearning'], minutesAgo: 130, score: 95 },
  { author: 'Sofia Rossi', handle: 'sofiacooks', text: 'Sunday batch cooking: lentil stew, roasted vegetables and a big pot of rice. Lunches sorted for the week.', tags: ['food', 'mealprep'], minutesAgo: 190, score: 58 },
  { author: 'Kenji Mori', handle: 'kenji_dev', text: 'Accessibility tip: tab through your app once with the mouse unplugged. You will find issues in minutes.', tags: ['a11y', 'webdev'], minutesAgo: 260, score: 87 },
  { author: 'Priya Raman', handle: 'priya_reads', text: 'Finished a novel that I could not put down. Two days, no notifications, zero regrets.', tags: ['books', 'reading'], minutesAgo: 340, score: 54 },
  { author: 'Tom Ellis', handle: 'tomtrades', text: 'Reminder: boring, regular contributions to index funds beat clever timing for most people.', tags: ['finance', 'investing'], minutesAgo: 420, score: 72 },
  { author: 'Aisha Khan', handle: 'aisha_ml', text: 'Evaluation sets are the unsung heroes of every AI project. Spend more time on yours.', tags: ['ai', 'data'], minutesAgo: 520, score: 81 },
  { author: 'Noah Berg', handle: 'noahphoto', text: 'Golden hour over the harbour this evening. The camera barely had to try.', tags: ['photography', 'travel'], minutesAgo: 640, score: 61 },
  { author: 'Ira Sen', handle: 'irasen', text: 'Our team switched to short design reviews with live prototypes. Decisions now take minutes, not days.', tags: ['ux', 'design'], minutesAgo: 760, score: 69 },
  { author: 'Carlos Vega', handle: 'carlos_fit', text: 'Strength day: slow reps, longer rests. My form has never felt better.', tags: ['fitness', 'strength'], minutesAgo: 900, score: 64 },
  { author: 'Hana Ito', handle: 'hana_codes', text: 'Wrote my first end-to-end test today. Watching the browser click through my app was oddly satisfying.', tags: ['webdev', 'testing'], minutesAgo: 1050, score: 77 },
  { author: 'Leo Martin', handle: 'leomusic', text: 'Rediscovered an old synth in the attic. Three hours later I had a new track.', tags: ['music', 'creative'], minutesAgo: 1200, score: 56 },
  { author: 'Zara Ali', handle: 'zara_future', text: 'The most useful AI feature is the one you stop noticing because it just saves you a click.', tags: ['ai', 'product'], minutesAgo: 1500, score: 85 },
];

const isoMinutesAgo = (minutes: number) => new Date(Date.now() - minutes * 60_000).toISOString();

export const MOVIE_GENRE_IDS: Record<string, number> = {
  Action: 28,
  Adventure: 12,
  Animation: 16,
  Comedy: 35,
  Drama: 18,
  Fantasy: 14,
  Horror: 27,
  Romance: 10749,
  'Sci-Fi': 878,
  Thriller: 53,
};

export function getMockNews(categories: string[]): ContentItem[] {
  const keys = categories.length ? categories.filter((c) => c in NEWS) : Object.keys(NEWS);
  const chosen = keys.length ? keys : Object.keys(NEWS);
  const result: ContentItem[] = [];
  chosen.forEach((category) => {
    NEWS[category].forEach((n, i) => {
      result.push({
        id: `news-${category}-${i + 1}`,
        type: 'news',
        title: n.title,
        description: n.description,
        image: null,
        url: `https://example.com/news/${category}/${i + 1}`,
        source: n.source,
        category,
        publishedAt: isoMinutesAgo(n.minutesAgo),
        ctaLabel: 'Read More',
        score: n.score,
      });
    });
  });
  return result;
}

export function getMockMovies(preferredGenres: string[]): ContentItem[] {
  const items = MOVIES.map<ContentItem>((m, i) => ({
    id: `movie-${i + 1}`,
    type: 'movie',
    title: m.title,
    description: m.description,
    image: null,
    url: `https://example.com/movies/${i + 1}`,
    source: `${m.genre} · ${m.year}`,
    category: m.genre,
    publishedAt: new Date(Date.UTC(m.year, 5, 1)).toISOString(),
    ctaLabel: 'Play Now',
    score: m.score,
  }));
  const wanted = new Set(preferredGenres);
  // Stable: preferred genres first, otherwise highest rated first.
  return items.sort((a, b) => {
    const am = wanted.has(a.category) ? 1 : 0;
    const bm = wanted.has(b.category) ? 1 : 0;
    return bm - am || b.score - a.score;
  });
}

export function getMockPosts(hashtags: string[]): ContentItem[] {
  const toItem = (p: RawPost, i: number): ContentItem => ({
    id: `social-${i + 1}`,
    type: 'social',
    title: `${p.author} (@${p.handle})`,
    description: p.text,
    image: null,
    url: `https://example.com/@${p.handle}`,
    source: p.tags.map((t) => `#${t}`).join(' '),
    category: p.tags[0],
    publishedAt: isoMinutesAgo(p.minutesAgo),
    ctaLabel: 'View Post',
    score: p.score,
    author: p.author,
  });
  const all = POSTS.map(toItem);
  if (!hashtags.length) return all;
  const wanted = new Set(hashtags);
  const matches = all.filter((_, i) => POSTS[i].tags.some((t) => wanted.has(t)));
  return matches.length ? matches : all;
}

export function getAllMockPosts(): ContentItem[] {
  return getMockPosts([]);
}

export function matchesQuery(item: ContentItem, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return [item.title, item.description, item.source, item.category, item.author ?? '']
    .join(' ')
    .toLowerCase()
    .includes(q);
}
