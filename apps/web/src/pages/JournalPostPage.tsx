import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { DisclaimerBanner } from '../components/DisclaimerBanner';
import { api, type JournalPostDetail } from '../lib/api';

function EmbedBlock({
  embed,
}: {
  embed: JournalPostDetail['embeds'][number];
}) {
  const [broken, setBroken] = useState(false);
  const showPhoto = embed.kind === 'photo' && embed.imageUrl && !broken;

  return (
    <figure className="my-10">
      {showPhoto ? (
        <a
          href={embed.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block overflow-hidden"
        >
          <img
            src={embed.imageUrl}
            alt=""
            className="max-h-[28rem] w-full object-cover"
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={() => setBroken(true)}
          />
        </a>
      ) : (
        <a
          href={embed.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block border border-ink/10 bg-gradient-to-br from-foam to-mist/50 px-5 py-6 transition hover:border-creek/40"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink/40">Source article</p>
          <p className="mt-2 font-display text-xl font-semibold text-creek">{embed.sourceTitle}</p>
          <p className="mt-2 text-sm text-ink/60">{embed.caption}</p>
        </a>
      )}
      <figcaption className="mt-3 text-xs leading-relaxed text-ink/50">
        {embed.caption}
        {' · '}
        <a href={embed.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-creek underline">
          {embed.sourceTitle}
        </a>
        {' · '}
        {embed.credit}
      </figcaption>
    </figure>
  );
}

export function JournalPostPage() {
  const { slug = '' } = useParams();
  const [post, setPost] = useState<JournalPostDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    api
      .journalPost(slug)
      .then(setPost)
      .catch((e: Error) => setError(e.message));
  }, [slug]);

  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <p className="text-sm text-cedar-deep">{error}</p>
        <Link to="/journal" className="mt-4 inline-block text-sm font-semibold text-creek">
          ← Back to Journal
        </Link>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-sm text-ink/50" role="status">
        Loading…
      </div>
    );
  }

  const photos = post.embeds.filter((e) => e.kind === 'photo');
  const articles = post.embeds.filter((e) => e.kind === 'article');

  return (
    <article className="mx-auto max-w-3xl px-4 py-10 md:px-6 md:py-14">
      <Link to="/journal" className="text-sm font-semibold text-creek hover:underline">
        ← Journal
      </Link>
      <p className="mt-8 text-xs font-semibold uppercase tracking-[0.16em] text-ink/40">
        {post.publishDateAlaska} · {post.place} · {post.region}
      </p>
      <h1 className="mt-3 font-display text-[clamp(1.8rem,4vw,2.75rem)] font-semibold tracking-tight text-ink text-balance">
        {post.title}
      </h1>
      <p className="mt-4 text-lg leading-relaxed text-ink/65">{post.lede}</p>
      <div className="accent-line mt-6 h-px w-20" aria-hidden="true" />

      <div className="mt-8">
        <DisclaimerBanner compact />
      </div>

      {photos[0] && <EmbedBlock embed={photos[0]} />}

      <div className="mt-8 space-y-5 text-base leading-relaxed text-ink/75">
        {post.body.map((para) => (
          <p key={para.slice(0, 48)}>{para}</p>
        ))}
      </div>

      {photos.slice(1).map((embed) => (
        <EmbedBlock key={embed.sourceUrl + embed.caption} embed={embed} />
      ))}

      <section className="mt-12 border-t border-ink/10 pt-10">
        <h2 className="font-display text-xl font-semibold">Takeaways for Creek Street</h2>
        <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-relaxed text-ink/70">
          {post.takeaways.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
        <p className="mt-6 text-sm font-semibold text-creek">{post.creekStreetHook}</p>
        <div className="mt-6 flex flex-wrap gap-4 text-sm font-semibold">
          <Link to="/ideas" className="text-creek hover:underline">
            Civic ideas →
          </Link>
          <Link to="/triage" className="text-creek hover:underline">
            Triage →
          </Link>
          <Link to="/filing" className="text-creek hover:underline">
            Filing pathway →
          </Link>
        </div>
      </section>

      {articles.length > 0 && (
        <section className="mt-12 border-t border-ink/10 pt-10">
          <h2 className="font-display text-xl font-semibold">Source articles</h2>
          <p className="mt-2 text-sm text-ink/55">
            Deeper reading — open the originals. We embed media from these pages; we do not host the
            photos.
          </p>
          <div className="mt-6 space-y-4">
            {articles.map((embed) => (
              <EmbedBlock key={embed.sourceUrl} embed={embed} />
            ))}
          </div>
        </section>
      )}

      <p className="mt-12 text-xs leading-relaxed text-ink/45">{post.disclaimer}</p>
      <p className="mt-2 text-xs text-ink/35">
        Generated via {post.source}
        {post.model ? ` · ${post.model}` : ''}
      </p>
    </article>
  );
}
