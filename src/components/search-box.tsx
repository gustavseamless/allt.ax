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
}: SearchBoxProps) {
  return (
    <form action="/sok" method="get" className="w-full" role="search">
      <div className={`flex w-full flex-col gap-2 sm:flex-row ${large ? "sm:gap-3" : ""}`}>
        <input
          type="search"
          name="q"
          defaultValue={defaultQuery}
          placeholder="Sök företag, tjänst eller kategori …"
          aria-label="Sök på Åland"
          autoComplete="off"
          maxLength={120}
          className={`w-full flex-1 rounded-lg border border-border bg-white px-4 text-foreground placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-light ${
            large ? "py-3.5 text-lg" : "py-2.5 text-sm"
          }`}
        />
        <select
          name="kommun"
          defaultValue={defaultMunicipality}
          aria-label="Välj kommun"
          className={`rounded-lg border border-border bg-white px-3 text-foreground focus:border-primary focus:outline-none ${
            large ? "py-3.5" : "py-2.5 text-sm"
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
          className={`rounded-lg bg-primary font-semibold text-white hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary ${
            large ? "px-8 py-3.5 text-lg" : "px-6 py-2.5 text-sm"
          }`}
        >
          Sök
        </button>
      </div>
      <label className="mt-2 inline-flex cursor-pointer items-center gap-2 text-sm text-muted">
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
