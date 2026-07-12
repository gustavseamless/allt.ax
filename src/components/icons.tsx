import {
  Anchor,
  Baby,
  BedDouble,
  Beer,
  Building2,
  Calculator,
  Camera,
  Car,
  CarFront,
  CarTaxiFront,
  Coffee,
  Dumbbell,
  Flower2,
  GraduationCap,
  Hammer,
  Handshake,
  House,
  Landmark,
  LifeBuoy,
  Megaphone,
  MonitorSmartphone,
  Music,
  PaintRoller,
  PartyPopper,
  Sailboat,
  Scale,
  Scissors,
  ShieldCheck,
  Shirt,
  ShoppingCart,
  Sparkles,
  Stethoscope,
  Store,
  Truck,
  UtensilsCrossed,
  Wrench,
  Zap,
  type LucideIcon,
} from "lucide-react";

/**
 * Consistent SVG iconography for categories (spec §13: "enhetlig ikonografi").
 * Maps category slugs to Lucide icons; unknown categories get a neutral store icon.
 */
const CATEGORY_ICONS: Record<string, LucideIcon> = {
  restauranger: UtensilsCrossed,
  cafeer: Coffee,
  barer: Beer,
  "hotell-och-boende": BedDouble,
  "bygg-och-renovering": Hammer,
  elektriker: Zap,
  vvs: Wrench,
  maleri: PaintRoller,
  stadning: Sparkles,
  fastighetsskotsel: House,
  bilverkstader: Car,
  bilforsaljning: CarFront,
  "dack-och-bilservice": LifeBuoy,
  frisorer: Scissors,
  "skonhet-och-halsa": Flower2,
  traning: Dumbbell,
  juridik: Scale,
  redovisning: Calculator,
  "banker-och-finans": Landmark,
  forsakring: ShieldCheck,
  butiker: Store,
  klader: Shirt,
  livsmedel: ShoppingCart,
  "batar-och-marina-tjanster": Sailboat,
  gasthamnar: Anchor,
  transport: Truck,
  taxi: CarTaxiFront,
  "it-och-teknik": MonitorSmartphone,
  marknadsforing: Megaphone,
  "foto-och-video": Camera,
  underhallning: PartyPopper,
  evenemangstjanster: Music,
  "barn-och-familj": Baby,
  vard: Stethoscope,
  utbildning: GraduationCap,
  foreningar: Handshake,
};

export function categoryIcon(slug: string | undefined | null): LucideIcon {
  return (slug && CATEGORY_ICONS[slug]) || Building2;
}

/** Round tinted icon badge used in cards and lists. */
export function CategoryIconBadge({
  slug,
  size = "md",
}: {
  slug: string | undefined | null;
  size?: "sm" | "md" | "lg";
}) {
  const Icon = categoryIcon(slug);
  const box = size === "lg" ? "h-16 w-16 rounded-2xl" : size === "sm" ? "h-9 w-9 rounded-lg" : "h-12 w-12 rounded-xl";
  const icon = size === "lg" ? "h-7 w-7" : size === "sm" ? "h-4 w-4" : "h-5 w-5";
  return (
    <div
      aria-hidden
      className={`flex shrink-0 items-center justify-center bg-primary-light text-primary ${box}`}
    >
      <Icon className={icon} strokeWidth={1.8} />
    </div>
  );
}
