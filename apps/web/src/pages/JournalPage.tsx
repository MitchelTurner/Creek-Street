import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { DisclaimerBanner } from '../components/DisclaimerBanner';
import { api, type JournalPostCard } from '../lib/api';

function HeroThumb({ post }: { post: JournalPostCard }) {
  const [broken, setBroken] = useState(false);
  const img = post.heroEmbed?.imageUrl;
  if (!img || broken) {
    return (
      <div className="flex aspect-[16/10] items-end bg-gradient-to-br from-tide via-creek to-cedar-deep p-4">
        <p className="font-display text-lg font-semibold leading-tight text-foam">{post.place}</p>
      </div>
    );
  }
  return (
    <div className="relative aspect-[16/10] overflow-hidden bg-mist/40">
      <img
        src={img}
        alt=""
        className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
        loading="lazy"
        referrerPolicy="no-referrer"
        onError={() => setBroken(true)}
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/55 via-transparent to-transparent" />
      <p className="absolute bottom-3 left-3 right-3 font-display text-sm font-semibold text-foam">
        {post.place}
      </p>
    </div>
  );
}

export function JournalPage() {
  const [posts, setPosts] = useState<JournalPostCard[]>([]);
  const [disclaimer, setDisclaimer] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .journalList(40)
      .then((r) => {
        setPosts(r.posts);
        setDisclaimer(r.disclaimer);
      })
      .catch((e: Error) => setError(e.message));
  }, []);

  const featured = posts[0];
  const rest = posts.slice(1);

  return (
    <div>
      <section
        className="relative overflow-hidden border-b border-ink/10"
        style={{
          background:
            'radial-gradient(110% 80% at 0% 0%, rgba(26,138,132,0.2) 0%, transparent 55%), radial-gradient(80% 60% at 100% 10%, rgba(154,98,64,0.12) 0%, transparent 50%), linear-gradient(180deg, #e7f3f0 0%, #eef6f4 50%, #f7fbfa 100%)',
        }}
      >
        <div className="tide-sheen pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-creek/10 to-transparent" />
        <div className="relative mx-auto max-w-5xl px-4 py-14 md:px-6 md:py-20">
          <p className="animate-rise font-display text-[clamp(2.2rem,6vw,4rem)] font-semibold leading-[0.92] tracking-tight text-tide">
            Creek Street
          </p>
          <h1 className="animate-rise-delay mt-3 font-display text-[clamp(1.6rem,3.5vw,2.5rem)] font-semibold tracking-tight text-ink">
            Journal
          </h1>
          <p className="animate-rise-delay mt-4 max-w-xl text-base leading-relaxed text-ink/65 md:text-lg">
            Daily case studies from other historic districts — culture, business, and public revenue
            ideas for the boardwalk. Photos are embedded from the source articles.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-4 py-10 md:px-6 md:py-14">
        <DisclaimerBanner />
        {error && <p className="mt-6 text-sm text-cedar-deep">{error}</p>}

        {featured && (
          <Link
            to={`/journal/${featured.slug}`}
            className="group mt-10 grid gap-8 border-b border-ink/10 pb-12 md:grid-cols-2 md:items-end"
          >
            <HeroThumb post={featured} />
            <div className="animate-rise-delay">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink/40">
                Today · {featured.publishDateAlaska}
              </p>
              <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-ink transition-colors group-hover:text-creek md:text-4xl text-balance">
                {featured.title}
              </h2>
              <p className="mt-4 text-base leading-relaxed text-ink/65">{featured.lede}</p>
              <span className="mt-5 inline-block text-sm font-semibold text-creek">Read case study →</span>
            </div>
          </Link>
        )}

        <section className="mt-12" aria-labelledby="archive-heading">
          <h2 id="archive-heading" className="font-display text-2xl font-semibold tracking-tight">
            Recent posts
          </h2>
          <div className="mt-8 grid gap-10 sm:grid-cols-2">
            {rest.map((post, i) => (
              <Link
                key={post.id}
                to={`/journal/${post.slug}`}
                className={[
                  'group block',
                  i % 3 === 0 ? 'animate-rise' : i % 3 === 1 ? 'animate-rise-delay' : 'animate-rise-delay-2',
                ].join(' ')}
              >
                <HeroThumb post={post} />
                <p className="mt-3 text-xs uppercase tracking-[0.14em] text-ink/40">
                  {post.publishDateAlaska} · {post.region}
                </p>
                <h3 className="mt-2 font-display text-xl font-semibold tracking-tight transition-colors group-hover:text-creek">
                  {post.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-ink/60 line-clamp-3">{post.lede}</p>
              </Link>
            ))}
          </div>
        </section>

        {disclaimer && <p className="mt-14 text-xs leading-relaxed text-ink/45">{disclaimer}</p>}
      </div>
    </div>
  );
}
