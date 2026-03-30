import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import {
  admins, categories, tags, countries,
  articles, articleTags, videoPosts, videoPostTags,
} from "../lib/db/schema";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) { console.error("DATABASE_URL not set"); process.exit(1); }

const conn = postgres(connectionString, { max: 1 });
const db = drizzle(conn);

const now = new Date();
const daysAgo = (n: number) => new Date(now.getTime() - n * 86_400_000);

async function main() {
  console.log("🌱 Seeding database...");

  // ── Admin ──────────────────────────────────────────────────────────────────
  const existingAdmin = await db.select().from(admins).limit(1);
  if (existingAdmin.length === 0) {
    const hash = await bcrypt.hash("admin123", 12);
    await db.insert(admins).values({ username: "admin", passwordHash: hash });
    console.log("  ✓ Admin created  (username: admin / password: admin123)");
  } else {
    console.log("  · Admin already exists, skipping");
  }

  // ── Categories ─────────────────────────────────────────────────────────────
  await db.insert(categories).values([
    { name: "Politics",   slug: "politics",   description: "Government, elections, and policy news from around the world." },
    { name: "Business",   slug: "business",   description: "Markets, economy, companies, and financial news." },
    { name: "Technology", slug: "technology", description: "Innovation, startups, AI, and the digital world." },
    { name: "Sports",     slug: "sports",     description: "Football, cricket, tennis, and all major sporting events." },
    { name: "Culture",    slug: "culture",    description: "Arts, entertainment, film, music, and lifestyle." },
    { name: "Science",    slug: "science",    description: "Discoveries, research, space, and the natural world." },
  ]).onConflictDoNothing();

  const allCats = await db.select().from(categories);
  const cat = Object.fromEntries(allCats.map(c => [c.slug, c.id]));
  console.log(`  ✓ Categories ready (${allCats.length})`);

  // ── Tags ───────────────────────────────────────────────────────────────────
  await db.insert(tags).values([
    { name: "Breaking",       slug: "breaking" },
    { name: "Climate",        slug: "climate" },
    { name: "AI",             slug: "ai" },
    { name: "Elections",      slug: "elections" },
    { name: "Economy",        slug: "economy" },
    { name: "Space",          slug: "space" },
    { name: "Health",         slug: "health" },
    { name: "War & Conflict", slug: "war-conflict" },
    { name: "Human Rights",   slug: "human-rights" },
    { name: "Innovation",     slug: "innovation" },
  ]).onConflictDoNothing();

  const allTags = await db.select().from(tags);
  const tag = Object.fromEntries(allTags.map(t => [t.slug, t.id]));
  console.log(`  ✓ Tags ready (${allTags.length})`);

  // ── Countries ──────────────────────────────────────────────────────────────
  await db.insert(countries).values([
    { name: "United States",  slug: "united-states",  isoCode: "US" },
    { name: "United Kingdom", slug: "united-kingdom", isoCode: "GB" },
    { name: "Germany",        slug: "germany",        isoCode: "DE" },
    { name: "France",         slug: "france",         isoCode: "FR" },
    { name: "Japan",          slug: "japan",          isoCode: "JP" },
    { name: "India",          slug: "india",          isoCode: "IN" },
    { name: "Brazil",         slug: "brazil",         isoCode: "BR" },
    { name: "Australia",      slug: "australia",      isoCode: "AU" },
  ]).onConflictDoNothing();

  const allCountries = await db.select().from(countries);
  const country = Object.fromEntries(allCountries.map(c => [c.slug, c.id]));
  console.log(`  ✓ Countries ready (${allCountries.length})`);

  // ── Articles ───────────────────────────────────────────────────────────────
  type ArticleSeed = {
    title: string; slug: string; excerpt: string; body: string;
    status: "published" | "draft" | "archived";
    isBreakingNews: boolean; isFeatured: boolean;
    categoryId: number; countryId: number | null;
    authorName: string; publishedAt: Date | null;
    tagSlugs: string[];
  };

  const articleSeeds: ArticleSeed[] = [
    {
      title: "Global Leaders Reach Historic Climate Agreement at Summit",
      slug: "global-leaders-climate-agreement-summit",
      excerpt: "World leaders signed a landmark accord pledging net-zero emissions by 2045, the most ambitious climate deal in history.",
      body: `## A Turning Point for the Planet\n\nIn an unprecedented show of unity, representatives from 190 nations gathered in Geneva to sign the **Global Climate Accord of 2025**.\n\n### Key Commitments\n\n- Net-zero carbon emissions by 2045\n- $500 billion annual green energy fund\n- Phased elimination of coal power by 2035\n\n> "This is the moment history will remember," said the UN Secretary-General.\n\nThe agreement includes binding enforcement mechanisms for the first time, a major departure from previous voluntary frameworks.\n\n### What Happens Next\n\nEach signatory must submit a national implementation plan within 90 days. An independent monitoring body will publish annual progress reports.`,
      status: "published", isBreakingNews: true, isFeatured: true,
      categoryId: cat["politics"], countryId: null,
      authorName: "Sarah Mitchell", publishedAt: daysAgo(0),
      tagSlugs: ["breaking", "climate"],
    },
    {
      title: "Federal Reserve Signals Rate Cuts Amid Cooling Inflation",
      slug: "federal-reserve-rate-cuts-inflation",
      excerpt: "The Fed hinted at three rate cuts in 2025 as inflation data showed a sustained decline toward the 2% target.",
      body: `## Markets Rally on Fed Signals\n\nThe Federal Reserve's latest meeting minutes revealed a growing consensus among policymakers that the time for monetary easing is approaching.\n\n### Inflation Data\n\nThe Consumer Price Index rose just **2.1%** year-over-year in December, the lowest reading since early 2021.\n\n- Core CPI: 2.3%\n- Energy prices: down 4.2%\n- Food prices: up 1.8%\n\n### Market Reaction\n\nThe S&P 500 surged 1.8% on the news, while the 10-year Treasury yield fell to 3.9%.\n\n> "We are confident inflation is on a sustainable path to our target," said the Fed Chair.`,
      status: "published", isBreakingNews: false, isFeatured: true,
      categoryId: cat["business"], countryId: country["united-states"],
      authorName: "James Thornton", publishedAt: daysAgo(1),
      tagSlugs: ["economy", "breaking"],
    },
    {
      title: "OpenAI Unveils GPT-5 with Reasoning Capabilities That Stun Researchers",
      slug: "openai-gpt5-reasoning-capabilities",
      excerpt: "The latest model demonstrates near-human performance on complex multi-step reasoning tasks, raising both excitement and concern.",
      body: `## The Next Leap in AI\n\nOpenAI released GPT-5 to widespread astonishment, with benchmark scores that surpass previous models by a significant margin.\n\n### Benchmark Performance\n\n- Math Olympiad: GPT-4 32% → GPT-5 **87%**\n- Bar Exam: GPT-4 90% → GPT-5 **97%**\n- Medical Diagnosis: GPT-4 72% → GPT-5 **91%**\n\nGPT-5 uses a novel **chain-of-thought reinforcement** architecture that allows it to verify its own reasoning steps before producing output.\n\n> "We've crossed a threshold we didn't expect to reach this decade," said one researcher.\n\n### Safety Concerns\n\nCritics warn that more capable models require more robust alignment research. OpenAI says it conducted 18 months of safety testing before release.`,
      status: "published", isBreakingNews: true, isFeatured: true,
      categoryId: cat["technology"], countryId: country["united-states"],
      authorName: "Priya Nair", publishedAt: daysAgo(1),
      tagSlugs: ["ai", "innovation", "breaking"],
    },
    {
      title: "England Win the Ashes in Dramatic Final Day Comeback",
      slug: "england-win-ashes-final-day-comeback",
      excerpt: "England chased down 387 in the final innings to reclaim the Ashes in one of cricket's greatest ever Test victories.",
      body: `## The Greatest Chase in Ashes History\n\nIn scenes that will be replayed for generations, England completed a stunning run chase at The Oval to win the Ashes series 3-2.\n\n### The Final Day\n\nNeeding 387 to win, England began the final day at 142-3.\n\n- **Ben Stokes**: 149 not out (167 balls)\n- **Joe Root**: 112 (134 balls)\n- Partnership: 241 runs in 47 overs\n\n> "I've never seen anything like it in 30 years of watching cricket," said former captain Michael Vaughan.`,
      status: "published", isBreakingNews: false, isFeatured: true,
      categoryId: cat["sports"], countryId: country["united-kingdom"],
      authorName: "Tom Hargreaves", publishedAt: daysAgo(2),
      tagSlugs: ["breaking"],
    },
    {
      title: "Cannes Palme d'Or Goes to Iranian Director's Debut Feature",
      slug: "cannes-palme-dor-iranian-director-debut",
      excerpt: "A first-time filmmaker from Tehran took the festival's top prize with a haunting portrait of life under authoritarian rule.",
      body: `## A Triumph for Independent Cinema\n\nThe 78th Cannes Film Festival concluded with a surprise: the Palme d'Or was awarded to *The Weight of Silence*, a debut feature by Iranian director Leila Ahmadi.\n\nShot clandestinely over two years in Tehran, the film follows a young woman navigating censorship, family pressure, and political surveillance.\n\n> "Cinema is the last free space," Ahmadi said through tears at the ceremony.\n\nJury president Cate Blanchett called it "a film that demands to be seen and cannot be unseen." A24 acquired worldwide rights immediately after the screening.`,
      status: "published", isBreakingNews: false, isFeatured: false,
      categoryId: cat["culture"], countryId: country["france"],
      authorName: "Isabelle Fontaine", publishedAt: daysAgo(2),
      tagSlugs: ["human-rights"],
    },
    {
      title: "NASA's Artemis IV Crew Lands on the Lunar South Pole",
      slug: "nasa-artemis-iv-lunar-south-pole-landing",
      excerpt: "Four astronauts touched down near Shackleton Crater, marking humanity's return to the Moon for the first time in over 50 years.",
      body: `## One Giant Leap, Again\n\nAt 14:32 UTC, the Artemis IV lunar module *Endurance* touched down on the Moon's south pole.\n\n### The Crew\n\n- Commander: Col. Diana Reyes (NASA)\n- Pilot: Maj. Kenji Watanabe (JAXA)\n- Mission Specialists: Dr. Amara Osei, Dr. Lars Eriksson\n\n### Mission Objectives\n\n1. Collect ice samples from permanently shadowed craters\n2. Deploy a solar power array\n3. Test habitat construction techniques\n\n> "The Moon is not a destination. It's a stepping stone to Mars," said NASA Administrator.`,
      status: "published", isBreakingNews: true, isFeatured: true,
      categoryId: cat["science"], countryId: country["united-states"],
      authorName: "Dr. Elena Vasquez", publishedAt: daysAgo(3),
      tagSlugs: ["space", "breaking", "innovation"],
    },
    {
      title: "Germany's Coalition Government Collapses After Budget Dispute",
      slug: "germany-coalition-government-collapses-budget",
      excerpt: "The three-party coalition fell apart after the Free Democrats withdrew over disagreements on deficit spending rules.",
      body: `## Political Crisis in Berlin\n\nGermany's governing coalition collapsed on Tuesday after the Free Democratic Party (FDP) withdrew its ministers from cabinet.\n\nThe immediate cause was a dispute over whether to invoke the constitutional debt brake to fund a €40 billion climate investment package.\n\n- SPD and Greens: wanted to suspend the debt brake\n- FDP: refused, citing fiscal responsibility\n\n> "Germany cannot afford political paralysis at this moment," said opposition leader Friedrich Merz.\n\nThe euro fell 0.4% against the dollar on the news.`,
      status: "published", isBreakingNews: true, isFeatured: false,
      categoryId: cat["politics"], countryId: country["germany"],
      authorName: "Klaus Weber", publishedAt: daysAgo(3),
      tagSlugs: ["elections", "economy", "breaking"],
    },
    {
      title: "India's Startup Ecosystem Surpasses $300 Billion in Total Valuation",
      slug: "india-startup-ecosystem-300-billion-valuation",
      excerpt: "India now hosts over 100 unicorns as its tech sector continues to attract record foreign investment.",
      body: `## India's Tech Boom\n\nIndia's startup ecosystem has crossed the $300 billion valuation milestone, cementing its position as the world's third-largest startup hub.\n\n### Key Numbers\n\n- Total unicorns: 108\n- New unicorns in 2024: 23\n- Foreign investment: $42 billion\n\n### Leading Sectors\n\n1. **Fintech** — $89 billion\n2. **SaaS** — $67 billion\n3. **E-commerce** — $54 billion\n\n> "India is no longer just an outsourcing destination. It's a product innovation powerhouse," said the Minister of Commerce.`,
      status: "published", isBreakingNews: false, isFeatured: false,
      categoryId: cat["business"], countryId: country["india"],
      authorName: "Arjun Mehta", publishedAt: daysAgo(4),
      tagSlugs: ["economy", "innovation"],
    },
    {
      title: "Amazon Rainforest Deforestation Hits 10-Year Low",
      slug: "amazon-rainforest-deforestation-10-year-low",
      excerpt: "Brazil's new enforcement policies and satellite monitoring have driven deforestation rates to their lowest level since 2012.",
      body: `## A Rare Win for the Environment\n\nBrazil's National Institute for Space Research (INPE) reported that Amazon deforestation fell **62%** in 2024 compared to the previous year.\n\n- 2024 deforestation: 4,200 km²\n- 2023 deforestation: 11,100 km²\n\nThe Lula government implemented real-time satellite monitoring, increased enforcement operations, and economic incentives for sustainable land use.\n\n> "The forest is not just Brazil's — it belongs to all of humanity," said President Lula.`,
      status: "published", isBreakingNews: false, isFeatured: false,
      categoryId: cat["science"], countryId: country["brazil"],
      authorName: "Carlos Mendes", publishedAt: daysAgo(5),
      tagSlugs: ["climate"],
    },
    {
      title: "Japan Unveils World's First Commercial Quantum Computer Network",
      slug: "japan-quantum-computer-network-commercial",
      excerpt: "NTT and Fujitsu launched a nationwide quantum internet backbone connecting 12 cities, a global first.",
      body: `## The Quantum Internet Arrives\n\nJapan became the first country to operate a commercial quantum communication network, connecting research institutions, banks, and government agencies across 12 cities.\n\n- Network length: 2,400 km\n- Technology: Quantum key distribution (QKD)\n- Security: Theoretically unbreakable encryption\n\n### Use Cases\n\n- **Banking**: Secure interbank settlements\n- **Government**: Classified communications\n- **Healthcare**: Patient data transmission\n\n> "This is the internet's next evolution," said NTT's CEO.`,
      status: "published", isBreakingNews: false, isFeatured: false,
      categoryId: cat["technology"], countryId: country["japan"],
      authorName: "Yuki Tanaka", publishedAt: daysAgo(5),
      tagSlugs: ["innovation", "ai"],
    },
    {
      title: "WHO Declares New Respiratory Virus a Public Health Emergency",
      slug: "who-respiratory-virus-public-health-emergency",
      excerpt: "A novel coronavirus variant spreading across Southeast Asia has prompted the WHO to issue its highest alert level.",
      body: `## Global Health Alert\n\nThe World Health Organization declared a Public Health Emergency of International Concern (PHEIC) after a novel respiratory virus spread to 14 countries within three weeks.\n\n- Designation: HCoV-NX1\n- Transmission: Airborne, R0 estimated at 3.2\n- Severity: Moderate — 2.1% hospitalization rate\n- Fatality rate: 0.3% (preliminary)\n\n> "We are not in 2020. Our tools and our knowledge are vastly better," said the WHO Director-General.\n\nThree pharmaceutical companies have begun Phase 1 trials. A vaccine could be available within 6 months.`,
      status: "published", isBreakingNews: true, isFeatured: false,
      categoryId: cat["science"], countryId: null,
      authorName: "Dr. Fatima Al-Hassan", publishedAt: daysAgo(0),
      tagSlugs: ["health", "breaking"],
    },
    {
      title: "UK General Election: Labour Wins Landslide Victory",
      slug: "uk-general-election-labour-landslide-victory",
      excerpt: "The Labour Party secured a 180-seat majority, ending 14 years of Conservative rule in the most decisive election result since 1997.",
      body: `## A New Era for Britain\n\nLabour won 412 seats in the House of Commons, giving the party its largest majority since Tony Blair's 1997 landslide.\n\n- Labour: 412 seats (+211)\n- Conservative: 121 seats (-251)\n- Liberal Democrats: 72 seats (+63)\n\n> "Change begins now," said new Prime Minister Keir Starmer outside Downing Street.\n\n### Policy Priorities\n\n1. Build 1.5 million new homes\n2. Create a publicly owned clean energy company\n3. Reform the NHS with a 10-year plan`,
      status: "published", isBreakingNews: false, isFeatured: false,
      categoryId: cat["politics"], countryId: country["united-kingdom"],
      authorName: "Oliver Pemberton", publishedAt: daysAgo(8),
      tagSlugs: ["elections"],
    },
    {
      title: "Australian Open: Alcaraz Wins Third Consecutive Grand Slam",
      slug: "australian-open-alcaraz-third-grand-slam",
      excerpt: "Carlos Alcaraz defeated Jannik Sinner in five sets to claim his third consecutive major title.",
      body: `## Alcaraz Cements His Legacy\n\nCarlos Alcaraz defeated Jannik Sinner 6-4, 3-6, 6-3, 4-6, 7-5 in a breathtaking Australian Open final lasting four hours and 22 minutes.\n\n- Aces: Alcaraz 18, Sinner 12\n- Winners: Alcaraz 67, Sinner 54\n\nAlcaraz saved three match points in the fifth set before breaking Sinner's serve at 5-5 to seal the victory.\n\n> "I don't know how I won that. My legs were gone in the fourth set," Alcaraz said.`,
      status: "published", isBreakingNews: false, isFeatured: false,
      categoryId: cat["sports"], countryId: country["australia"],
      authorName: "Maria Santos", publishedAt: daysAgo(6),
      tagSlugs: [],
    },
    {
      title: "Draft: Upcoming Tech Regulation Bill Analysis",
      slug: "draft-tech-regulation-bill-analysis",
      excerpt: "An in-depth look at the proposed Digital Markets Act amendments.",
      body: `## Draft Article\n\nThis article is still being written. Content coming soon.`,
      status: "draft", isBreakingNews: false, isFeatured: false,
      categoryId: cat["technology"], countryId: null,
      authorName: "Editorial Team", publishedAt: null,
      tagSlugs: [],
    },
  ];

  let articleCount = 0;
  for (const seed of articleSeeds) {
    const { tagSlugs, ...values } = seed;
    const existing = await db.select({ id: articles.id }).from(articles)
      .where(eq(articles.slug, seed.slug)).limit(1);
    if (existing.length > 0) continue;

    const [inserted] = await db.insert(articles).values({
      title: values.title, slug: values.slug, excerpt: values.excerpt,
      body: values.body, status: values.status,
      isBreakingNews: values.isBreakingNews, isFeatured: values.isFeatured,
      categoryId: values.categoryId, countryId: values.countryId,
      authorName: values.authorName, publishedAt: values.publishedAt,
    }).returning({ id: articles.id });

    if (tagSlugs.length > 0) {
      await db.insert(articleTags).values(
        tagSlugs.filter(s => tag[s]).map(s => ({ articleId: inserted.id, tagId: tag[s] }))
      );
    }
    articleCount++;
  }
  console.log(`  ✓ ${articleCount} articles inserted`);

  // ── Video Posts ────────────────────────────────────────────────────────────
  type VideoSeed = {
    title: string; slug: string; description: string;
    videoEmbedUrl: string; categoryId: number | null;
    countryId: number | null; tagSlugs: string[];
  };

  const videoSeeds: VideoSeed[] = [
    {
      title: "Inside the Climate Summit: World Leaders Speak",
      slug: "inside-climate-summit-world-leaders-speak",
      description: "Exclusive footage and interviews from the Geneva Climate Summit where 190 nations signed the landmark accord.",
      videoEmbedUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
      categoryId: cat["politics"], countryId: null,
      tagSlugs: ["climate", "breaking"],
    },
    {
      title: "GPT-5 Demo: Watch It Solve a Math Olympiad Problem",
      slug: "gpt5-demo-math-olympiad-problem",
      description: "OpenAI researchers demonstrate GPT-5's reasoning capabilities live, solving a problem that stumped previous models.",
      videoEmbedUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
      categoryId: cat["technology"], countryId: country["united-states"],
      tagSlugs: ["ai", "innovation"],
    },
    {
      title: "Artemis IV Moon Landing: Full Broadcast",
      slug: "artemis-iv-moon-landing-full-broadcast",
      description: "Watch the complete NASA broadcast of the Artemis IV lunar landing, including the first steps on the Moon's south pole.",
      videoEmbedUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
      categoryId: cat["science"], countryId: country["united-states"],
      tagSlugs: ["space", "breaking"],
    },
    {
      title: "Stokes & Root's Record Partnership — Every Ball",
      slug: "stokes-root-record-partnership-every-ball",
      description: "Relive the extraordinary 241-run partnership between Ben Stokes and Joe Root that won England the Ashes.",
      videoEmbedUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
      categoryId: cat["sports"], countryId: country["united-kingdom"],
      tagSlugs: [],
    },
  ];

  let videoCount = 0;
  for (const seed of videoSeeds) {
    const { tagSlugs, ...values } = seed;
    const existing = await db.select({ id: videoPosts.id }).from(videoPosts)
      .where(eq(videoPosts.slug, seed.slug)).limit(1);
    if (existing.length > 0) continue;

    const [inserted] = await db.insert(videoPosts).values({
      title: values.title, slug: values.slug, description: values.description,
      videoEmbedUrl: values.videoEmbedUrl, categoryId: values.categoryId,
      countryId: values.countryId, status: "published",
      publishedAt: daysAgo(videoCount),
    }).returning({ id: videoPosts.id });

    if (tagSlugs.length > 0) {
      await db.insert(videoPostTags).values(
        tagSlugs.filter(s => tag[s]).map(s => ({ videoPostId: inserted.id, tagId: tag[s] }))
      );
    }
    videoCount++;
  }
  console.log(`  ✓ ${videoCount} video posts inserted`);

  console.log("\n✅ Seed complete!");
  console.log("   Admin login → http://localhost:3000/admin");
  console.log("   Username: admin  |  Password: admin123");
}

main().catch(err => {
  console.error("Seed failed:", err);
  process.exit(1);
}).finally(() => conn.end());
