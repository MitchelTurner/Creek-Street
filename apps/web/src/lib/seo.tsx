import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const SITE = 'Creek Street Design Review Hub';
const DEFAULT_DESC =
  'Independent public hub for the Creek Street Historic District Architectural Design Review Board (Ketchikan Gateway Borough HD zone). Operated by Mitchel Turner Dev, LLC — not a borough property.';

const ROUTES: Record<string, { title: string; description: string }> = {
  '/': {
    title: SITE,
    description: DEFAULT_DESC,
  },
  '/visit': {
    title: `Visit the boardwalk · ${SITE}`,
    description: 'Walkable structure stories for Creek Street boardwalk visitors — QR-ready public narratives from the NRHP inventory.',
  },
  '/construction': {
    title: `Build window planner · ${SITE}`,
    description: 'Plan filing timelines against Ketchikan cruise-ship density and mirrored design-review lead times.',
  },
  '/map': {
    title: `District map · ${SITE}`,
    description: 'Interactive map of the Creek Street Historic District HD zone structures and parcels.',
  },
  '/structures': {
    title: `Structures · ${SITE}`,
    description: 'NRHP nomination 14000454 structure inventory for the Creek Street Historic District.',
  },
  '/docket': {
    title: `Application docket · ${SITE}`,
    description: 'Public mirrored design-review applications. Drafts are never listed.',
  },
  '/decisions': {
    title: `Decision archive · ${SITE}`,
    description: 'Mirrored board recommendations and outcomes for Creek Street design review.',
  },
  '/meetings': {
    title: `Meetings · ${SITE}`,
    description: 'Upcoming and past Design Review Board meetings. AI summaries only after human review.',
  },
  '/guidance': {
    title: `HD guidance · ${SITE}`,
    description: 'Plain-language Creek Street HD zone guidance derived from KGBC 18.40.010(b)(13).',
  },
  '/board': {
    title: `Board seats · ${SITE}`,
    description: 'Architectural Design Review Board roster and vacancy watch.',
  },
  '/opendata': {
    title: `Open data · ${SITE}`,
    description: 'CC0 public mirror datasets — structures, applications, decisions, meetings, seats.',
  },
  '/triage': {
    title: `Triage wizard · ${SITE}`,
    description: 'Project-type triage for Creek Street design review. Always ends at the Zoning Administrator.',
  },
  '/permits': {
    title: `Permit triggers · ${SITE}`,
    description: 'Multi-agency permit trigger map with verifiedAt gating for unverified rows.',
  },
  '/precedents': {
    title: `Precedents · ${SITE}`,
    description: 'Visual precedent library and similarity search over public design-review decisions.',
  },
  '/notice': {
    title: `Notice lookup · ${SITE}`,
    description: 'Notice set helper citing KGBC 18.90.060 (600 ft) and 18.90.020 (HD district-wide).',
  },
  '/timelines': {
    title: `Timelines · ${SITE}`,
    description: 'Filing-to-recommendation timeline expectations. Buckets with n < 5 are suppressed.',
  },
  '/photos': {
    title: `Historic photos · ${SITE}`,
    description: 'Crowdsourced historic and contemporary photos of Creek Street structures (moderated).',
  },
  '/workspace': {
    title: `Applicant workspace · ${SITE}`,
    description: 'Private preparation drafts for design-review filings. Not board records.',
  },
  '/auth': {
    title: `Sign in · ${SITE}`,
    description: 'Sign in to the Creek Street applicant workspace.',
  },
  '/official': {
    title: `Board portal · ${SITE}`,
    description: 'Read-only board portal. Deliberation stays dark until processor agreement env is complete.',
  },
  '/subscriptions': {
    title: `Alerts · ${SITE}`,
    description: 'Email and RSS subscriptions for HD zone docket updates.',
  },
  '/admin/ingest': {
    title: `Ingest admin · ${SITE}`,
    description: 'Staff ingest console for watermarked source sync.',
  },
  '/compliance': {
    title: `Compliance & readiness · ${SITE}`,
    description:
      'Public Records Act posture, retention hooks, and processor-agreement checklist for the Creek Street hub.',
  },
};

function upsertMeta(attr: 'name' | 'property', key: string, content: string) {
  let el = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function matchRoute(pathname: string) {
  if (ROUTES[pathname]) return ROUTES[pathname];
  if (pathname.startsWith('/visit/')) {
    return {
      title: `Visit · ${SITE}`,
      description: 'Creek Street structure story for boardwalk visitors.',
    };
  }
  if (pathname.startsWith('/structures/')) {
    return {
      title: `Structure · ${SITE}`,
      description: 'Creek Street Historic District structure detail from the NRHP inventory.',
    };
  }
  if (pathname.startsWith('/workspace/')) {
    return {
      title: `Draft builder · ${SITE}`,
      description: 'Private pre-application package builder.',
    };
  }
  if (pathname.startsWith('/official/')) {
    return {
      title: `Board application · ${SITE}`,
      description: 'Read-only official application context for board members.',
    };
  }
  return { title: SITE, description: DEFAULT_DESC };
}

/** Sets document title + description + Open Graph tags from the current route. */
export function RouteSeo() {
  const { pathname } = useLocation();

  useEffect(() => {
    const meta = matchRoute(pathname);
    document.title = meta.title;
    upsertMeta('name', 'description', meta.description);
    upsertMeta('property', 'og:title', meta.title);
    upsertMeta('property', 'og:description', meta.description);
    upsertMeta('property', 'og:type', 'website');
    upsertMeta('property', 'og:site_name', SITE);
    upsertMeta('name', 'twitter:card', 'summary');
    upsertMeta('name', 'twitter:title', meta.title);
    upsertMeta('name', 'twitter:description', meta.description);

    let canonical = document.head.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = `${window.location.origin}${pathname === '/' ? '/' : pathname}`;
  }, [pathname]);

  return null;
}

export function JsonLd({ data }: { data: Record<string, unknown> }) {
  useEffect(() => {
    const id = 'creek-jsonld';
    let el = document.getElementById(id) as HTMLScriptElement | null;
    if (!el) {
      el = document.createElement('script');
      el.id = id;
      el.type = 'application/ld+json';
      document.head.appendChild(el);
    }
    el.textContent = JSON.stringify(data);
    return () => {
      el?.remove();
    };
  }, [data]);
  return null;
}

export { SITE, DEFAULT_DESC, ROUTES };
