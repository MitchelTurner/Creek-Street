import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { DisclaimerBanner } from '../components/DisclaimerBanner';
import { api, type JournalPostDetail } from '../lib/api';

function EmbedBlock({
  embed,
  large,
}: {
  embed: JournalPostDetail['embeds'][number];
  large?: boolean;
}) {
  const [broken, setBroken] = useState(false);
  const showPhoto = embed.kind === 'photo' && embed.imageUrl && !broken;

  return (
    <figure className={large ? 'my-10' : 'my-6'}>
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
            className={large ? 'max-h-[32rem] w-full object-cover' : 'max-h-[22rem] w-full object-cover'}
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

function PhotoStrip({ photos }: { photos: JournalPostDetail['embeds'] }) {
  if (photos.length < 2) return null;
  return (
    <div className="my-10 grid gap-3 sm:grid-cols-2">
      {photos.slice(0, 4).map((embed) => (
        <a
          key={embed.imageUrl + embed.caption}
          href={embed.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="group relative aspect-[4/3] overflow-hidden bg-mist/40"
        >
          {embed.imageUrl ? (
            <img
              src={embed.imageUrl}
              alt=""
              className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
              loading="lazy"
              referrerPolicy="no-referrer"
            />
          ) : null}
          <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/70 to-transparent px-3 pb-2 pt-8 text-[11px] leading-snug text-foam">
            {embed.caption}
          </span>
        </a>
      ))}
    </div>
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
  const mid = Math.ceil(post.body.length / 2);
  const firstHalf = post.body.slice(0, mid);
  const secondHalf = post.body.slice(mid);

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
      <p className="mt-4 text-lg leading-relaxed text-ink/65 md:text-xl">{post.lede}</p>
      <div className="accent-line mt-6 h-px w-20" aria-hidden="true" />

      <div className="mt-8">
        <DisclaimerBanner compact />
      </div>

      {photos[0] && <EmbedBlock embed={photos[0]} large />}

      <div className="mt-8 space-y-5 text-base leading-relaxed text-ink/75 md:text-[1.05rem]">
        {firstHalf.map((para) => (
          <p key={para.slice(0, 48)}>{para}</p>
        ))}
      </div>

      {photos[1] && <EmbedBlock embed={photos[1]} />}

      <div className="mt-8 space-y-5 text-base leading-relaxed text-ink/75 md:text-[1.05rem]">
        {secondHalf.map((para) => (
          <p key={para.slice(0, 48)}>{para}</p>
        ))}
      </div>

      <PhotoStrip photos={photos.slice(2)} />

      {photos.slice(2, 3).map((embed) => (
        <EmbedBlock key={embed.sourceUrl + embed.caption} embed={embed} />
      ))}

      <section className="mt-12 border-t border-ink/10 pt-10">
        <h2 className="font-display text-xl font-semibold">Takeaways for Creek Street</h2>
        <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-relaxed text-ink/70">
          {post.takeaways.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
        <p className="mt-6 text-sm font-semibold text-creek md:text-base">{post.creekStreetHook}</p>
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

      {photos.length > 3 && (
        <section className="mt-12 border-t border-ink/10 pt-10">
          <h2 className="font-display text-xl font-semibold">More from the sources</h2>
          <p className="mt-2 text-sm text-ink/55">
            Additional embeds from the linked articles — click any image to open the original.
          </p>
          <div className="mt-6 space-y-2">
            {photos.slice(3).map((embed) => (
              <EmbedBlock key={embed.imageUrl + embed.caption} embed={embed} />
            ))}
          </div>
        </section>
      )}

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
