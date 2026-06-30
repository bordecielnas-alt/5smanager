
-- Sites / UAP / GAP hierarchy
CREATE TABLE public.sites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE public.uaps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE public.gaps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  uap_id UUID NOT NULL REFERENCES public.uaps(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Categories and items (5S grid)
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  position INT NOT NULL
);
CREATE TABLE public.items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  position INT NOT NULL
);

-- Audits
CREATE TABLE public.audits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  auditor_name TEXT NOT NULL,
  site_id UUID REFERENCES public.sites(id) ON DELETE SET NULL,
  uap_id UUID REFERENCES public.uaps(id) ON DELETE SET NULL,
  gap_id UUID REFERENCES public.gaps(id) ON DELETE SET NULL,
  site_name TEXT,
  uap_name TEXT,
  gap_name TEXT,
  category_totals JSONB NOT NULL DEFAULT '{}'::jsonb,
  total_score INT NOT NULL DEFAULT 0
);
CREATE TABLE public.audit_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_id UUID NOT NULL REFERENCES public.audits(id) ON DELETE CASCADE,
  item_id UUID REFERENCES public.items(id) ON DELETE SET NULL,
  category_name TEXT NOT NULL,
  item_label TEXT NOT NULL,
  score INT NOT NULL DEFAULT 0
);

-- Grants (public app, no auth)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sites, public.uaps, public.gaps, public.categories, public.items, public.audits, public.audit_scores TO anon, authenticated;
GRANT ALL ON public.sites, public.uaps, public.gaps, public.categories, public.items, public.audits, public.audit_scores TO service_role;

ALTER TABLE public.sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.uaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public all sites" ON public.sites FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public all uaps" ON public.uaps FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public all gaps" ON public.gaps FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public all categories" ON public.categories FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public all items" ON public.items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public all audits" ON public.audits FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public all audit_scores" ON public.audit_scores FOR ALL USING (true) WITH CHECK (true);

-- Seed categories and items
DO $$
DECLARE
  c_tri UUID := gen_random_uuid();
  c_rgt UUID := gen_random_uuid();
  c_net UUID := gen_random_uuid();
  c_std UUID := gen_random_uuid();
  c_sui UUID := gen_random_uuid();
BEGIN
  INSERT INTO public.categories(id,name,position) VALUES
    (c_tri,'Tri',1),(c_rgt,'Rangement',2),(c_net,'Nettoyage',3),(c_std,'Standard',4),(c_sui,'Suivi',5);

  INSERT INTO public.items(category_id,label,position) VALUES
    (c_tri,'Il n''y a pas d''éléments inutiles sur les postes de travail dans les zones de stockage',1),
    (c_tri,'Il n''y a pas de documentations en excès ou obsolètes',2),
    (c_tri,'Il n''y a pas d''éléments en mauvais état/hors d''état de fonctionnement pour lesquels aucune action n''est prévue',3),
    (c_tri,'Il n''y a pas d''éléments inutiles dans le reste de l''atelier',4),

    (c_rgt,'Les documents et outils non utilisés sont rangés et clairement identifiés (Les tiroirs et armoires sont rangés et identifiés)',1),
    (c_rgt,'Les matières et produits semi-finis sont rangés correctement dans les zones correspondantes',2),
    (c_rgt,'Des poubelles sont disponibles et adaptées. Les règles de tri sont respectées',3),
    (c_rgt,'Il n''y a pas d''obstacles à la circulation ou de risque sécurité',4),

    (c_net,'Le poste de travail et les zones de stockage sont propres',1),
    (c_net,'Les abords du poste de travail sont propres',2),
    (c_net,'Il y a du matériel de nettoyage adapté et à disposition dans l''atelier pour les machines et postes de travail',3),
    (c_net,'Il n''y a pas de sources de salissure pour lesquels aucune action n''est lancée',4),

    (c_std,'Le standard de poste est affiché',1),
    (c_std,'Le standard de poste est respecté',2),
    (c_std,'Les écarts au standard sont justifiés',3),
    (c_std,'Le standard est revu',4),

    (c_sui,'L''ensemble du personnel de la zone est sensibilisé et impliqué aux 5S',1),
    (c_sui,'Des audits sont réalisés chaque mois',2),
    (c_sui,'Le plan d''action de la zone est suivi et les délais respectés',3),
    (c_sui,'Des propositions d''amélioration sont régulièrement émises autour du 5S et des conditions de travail',4);
END $$;
