import { prisma } from "@/lib/db";
import { toggleCategoryAction } from "../actions";
import { NewCategoryForm } from "./new-category-form";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin – kategorier", robots: { index: false } };

export default async function AdminCategoriesPage() {
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { businessCategories: true } } },
  });

  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-lg font-bold">Kategorier ({categories.length})</h2>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {categories.map((c) => (
            <div
              key={c.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2 text-sm"
            >
              <span className={c.active ? "" : "text-muted line-through"}>
                {c.icon} {c.name}{" "}
                <span className="text-xs text-muted">({c._count.businessCategories} företag)</span>
              </span>
              <form action={toggleCategoryAction.bind(null, c.id)}>
                <button
                  type="submit"
                  className="rounded-md border border-border px-2 py-0.5 text-xs hover:border-primary hover:text-primary"
                >
                  {c.active ? "Inaktivera" : "Aktivera"}
                </button>
              </form>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-xl border-t border-border pt-6">
        <h2 className="text-lg font-bold">Ny kategori</h2>
        <NewCategoryForm />
      </section>
    </div>
  );
}
