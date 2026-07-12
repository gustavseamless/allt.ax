import { Search } from "lucide-react";

interface MunicipalityOption {
  name: string;
  slug: string;
}

interface SearchBoxProps {
  municipalities: MunicipalityOption[];
  defaultQuery?: string;
  defaultMunicipality?: string;
  defaultOpenNow?: boolean;
  large?: boolean;
  /** Rendered on a dark hero background. */
  onDark?: boolean;
}

/**
 * Progressive-enhancement search form – plain GET form, works without JS.
 */
export function SearchBox({
  municipalities,
  defaultQuery = "",
  defaultMunicipality = "",
  defaultOpenNow = false,
  large = false,
  onDark = false,
}: SearchBoxProps) {
  return (
    <form action="/sok" method="get" className="w-full" role="search">
      <div
        className={
          large
            ? "rounded-2xl bg-white p-2 shadow-[var(--shadow-hero)]"
            : ""
        }
      >
        <div className={`flex w-full flex-col gap-2 sm:flex-row ${large ? "sm:items-stretch" : ""}`}>
          <div className="relative flex-1">
            <Search
              aria-hidden
              className={`pointer-events-none absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-muted ${
                large ? "" : ""
              }`}
            />
            <input
              type="search"
              name="q"
              defaultValue={defaultQuery}
              placeholder="Sök företag, tjänst eller kategori …"
              aria-label="Sök på Åland"
              autoComplete="off"
              maxLength={120}
              className={`w-full rounded-xl bg-white pl-10 pr-4 text-foreground placeholder:text-muted focus:outline-none ${
                large
                  ? "border-0 py-3.5 text-lg focus:ring-2 focus:ring-primary-light"
                  : "border border-border py-2.5 text-sm focus:border-primary focus:ring-2 focus:ring-primary-light"
              }`}
            />
          </div>
          <select
            name="kommun"
            defaultValue={defaultMunicipality}
            aria-label="Välj kommun"
            className={`rounded-xl bg-white px-3 text-foreground focus:outline-none ${
              large
                ? "border-0 py-3.5 sm:border-l sm:border-border sm:rounded-none"
                : "border border-border py-2.5 text-sm focus:border-primary"
            }`}
          >
            <option value="">Hela Åland</option>
            {municipalities.map((m) => (
              <option key={m.slug} value={m.slug}>
                {m.name}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className={`rounded-xl bg-primary font-semibold text-white transition-colors hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary ${
              large ? "px-8 py-3.5 text-lg" : "px-6 py-2.5 text-sm"
            }`}
          >
            Sök
          </button>
        </div>
      </div>
      <label
        className={`mt-3 inline-flex cursor-pointer items-center gap-2 text-sm ${
          onDark ? "text-white/80" : "text-muted"
        }`}
      >
        <input
          type="checkbox"
          name="oppet"
          value="1"
          defaultChecked={defaultOpenNow}
          className="h-4 w-4 rounded border-border accent-[var(--primary)]"
        />
        Visa bara det som är öppet nu
      </label>
    </form>
  );
}
