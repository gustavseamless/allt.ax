-- Full-text search (Swedish) + trigram indexes for typo tolerance.
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS unaccent;

-- array_to_string is only STABLE; wrap it so it can be used in a generated column.
CREATE OR REPLACE FUNCTION f_textarr2text(text[])
  RETURNS text LANGUAGE sql IMMUTABLE AS $$ SELECT array_to_string($1, ' ') $$;

-- Generated tsvector column combining the most important searchable fields.
ALTER TABLE "Business"
  ADD COLUMN "searchVector" tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('swedish', coalesce("name", '')), 'A') ||
    setweight(to_tsvector('swedish', coalesce("shortDescription", '')), 'B') ||
    setweight(to_tsvector('swedish', coalesce("description", '')), 'C') ||
    setweight(to_tsvector('swedish', coalesce("city", '')), 'B') ||
    setweight(to_tsvector('swedish', f_textarr2text("tags")), 'B')
  ) STORED;

CREATE INDEX "Business_searchVector_idx" ON "Business" USING GIN ("searchVector");
CREATE INDEX "Business_name_trgm_idx" ON "Business" USING GIN ("name" gin_trgm_ops);
CREATE INDEX "Category_name_trgm_idx" ON "Category" USING GIN ("name" gin_trgm_ops);
