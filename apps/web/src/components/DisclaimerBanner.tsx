export function DisclaimerBanner({ compact }: { compact?: boolean }) {
  if (compact) {
    return (
      <p className="text-xs leading-relaxed text-ink/45">
        Preparation tool only — official submission is to the Borough Planning Department.
      </p>
    );
  }
  return (
    <aside className="border-l-2 border-brass/70 bg-board/20 px-4 py-3 text-sm text-ink/70">
      <p className="font-semibold text-ink">Preparation tool — not a borough filing</p>
      <p className="mt-1.5 leading-relaxed">
        Official submission is to the Ketchikan Gateway Borough Planning Department. This hub is
        operated by Mitchel Turner Dev, LLC and is not a borough property. Confirm requirements with
        the Zoning Administrator before you file.
      </p>
    </aside>
  );
}
