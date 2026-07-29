export function DisclaimerBanner({ compact }: { compact?: boolean }) {
  if (compact) {
    return (
      <p className="text-xs text-ink/50">
        Preparation tool only — official submission is to the Borough Planning Department.
      </p>
    );
  }
  return (
    <div className="rounded-md border border-brass/35 bg-board/30 px-4 py-3 text-sm text-ink/75">
      <p className="font-medium text-ink">Preparation tool — not a borough filing</p>
      <p className="mt-1 leading-relaxed">
        Official submission is to the Ketchikan Gateway Borough Planning Department. This hub is
        operated by Mitchel Turner Dev, LLC and is not a borough property. Confirm requirements with
        the Zoning Administrator before you file.
      </p>
    </div>
  );
}
