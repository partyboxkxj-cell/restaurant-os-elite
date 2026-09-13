-- ============ ENUMS ============
CREATE TYPE public.app_role AS ENUM (
  'Restaurant Manager','Area Manager','Operations Manager','Country Manager',
  'HR Officer','HR Supervisor','HR Manager','Head HR','MD','COO','CEO','System Owner'
);
CREATE TYPE public.audit_severity AS ENUM ('Minor','Critical');
CREATE TYPE public.audit_status AS ENUM ('Open','Acknowledged','In Progress','Resolved','Closed');

-- ============ LOCATIONS ============
CREATE TABLE public.locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  city text NOT NULL,
  area text NOT NULL,
  country text NOT NULL,
  currency text NOT NULL DEFAULT 'USD',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.locations TO authenticated;
GRANT ALL ON public.locations TO service_role;
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "locations readable" ON public.locations FOR SELECT TO authenticated USING (true);

-- ============ PROFILES ============
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  name text NOT NULL DEFAULT 'New User',
  email text,
  location_id uuid REFERENCES public.locations(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles readable" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "own profile insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- ============ USER ROLES ============
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "roles readable" ON public.user_roles FOR SELECT TO authenticated USING (true);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _role public.app_role;
  _loc uuid;
BEGIN
  BEGIN
    _role := COALESCE((NEW.raw_user_meta_data ->> 'role')::public.app_role, 'Restaurant Manager');
  EXCEPTION WHEN others THEN
    _role := 'Restaurant Manager';
  END;
  SELECT id INTO _loc FROM public.locations
   WHERE code = COALESCE(NEW.raw_user_meta_data ->> 'location_code', '') LIMIT 1;
  IF _loc IS NULL THEN
    SELECT id INTO _loc FROM public.locations ORDER BY code LIMIT 1;
  END IF;
  INSERT INTO public.profiles (id, name, email, location_id)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data ->> 'name', split_part(NEW.email,'@',1)), NEW.email, _loc);
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, _role) ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============ SALES POS ============
CREATE TABLE public.sales_pos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id uuid NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
  cashier text NOT NULL DEFAULT 'Unassigned',
  ticket_no text NOT NULL,
  ticket_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  total_amount numeric(12,2) NOT NULL DEFAULT 0,
  voided boolean NOT NULL DEFAULT false,
  discount_amount numeric(12,2) NOT NULL DEFAULT 0,
  "timestamp" timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX sales_pos_loc_ts ON public.sales_pos(location_id, "timestamp");
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sales_pos TO authenticated;
GRANT ALL ON public.sales_pos TO service_role;
ALTER TABLE public.sales_pos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sales readable" ON public.sales_pos FOR SELECT TO authenticated USING (true);
CREATE POLICY "sales insert" ON public.sales_pos FOR INSERT TO authenticated WITH CHECK (true);

-- ============ INVENTORY LEDGER ============
CREATE TABLE public.inventory_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id uuid NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
  item_name text NOT NULL,
  unit text NOT NULL DEFAULT 'pcs',
  unit_cost numeric(12,2) NOT NULL DEFAULT 0,
  theoretical_qty numeric(12,2) NOT NULL DEFAULT 0,
  actual_qty numeric(12,2) NOT NULL DEFAULT 0,
  variance_alert boolean NOT NULL DEFAULT false,
  period_date date NOT NULL DEFAULT current_date,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.inventory_ledger TO authenticated;
GRANT ALL ON public.inventory_ledger TO service_role;
ALTER TABLE public.inventory_ledger ENABLE ROW LEVEL SECURITY;
CREATE POLICY "inventory readable" ON public.inventory_ledger FOR SELECT TO authenticated USING (true);
CREATE POLICY "inventory write" ON public.inventory_ledger FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.flag_inventory_variance()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.variance_alert := (NEW.actual_qty - NEW.theoretical_qty) <= -2
    OR ABS(NEW.actual_qty - NEW.theoretical_qty) > GREATEST(NEW.theoretical_qty * 0.03, 1);
  RETURN NEW;
END;
$$;
CREATE TRIGGER inventory_variance_flag BEFORE INSERT OR UPDATE ON public.inventory_ledger
FOR EACH ROW EXECUTE FUNCTION public.flag_inventory_variance();

-- ============ CCTV AUDITS ============
CREATE TABLE public.cctv_audits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id uuid NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
  violation_type text NOT NULL,
  category text NOT NULL DEFAULT 'Safety',
  description text NOT NULL DEFAULT '',
  severity public.audit_severity NOT NULL DEFAULT 'Minor',
  status public.audit_status NOT NULL DEFAULT 'Open',
  escalation_level int NOT NULL DEFAULT 0,
  assigned_role public.app_role NOT NULL DEFAULT 'Restaurant Manager',
  confidence numeric(4,3) NOT NULL DEFAULT 0.9,
  camera text NOT NULL DEFAULT 'CAM-01',
  financial_impact numeric(12,2) NOT NULL DEFAULT 0,
  resolved_at timestamptz,
  "timestamp" timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cctv_audits TO authenticated;
GRANT ALL ON public.cctv_audits TO service_role;
ALTER TABLE public.cctv_audits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "audits readable" ON public.cctv_audits FOR SELECT TO authenticated USING (true);
CREATE POLICY "audits write" ON public.cctv_audits FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============ HR DISCIPLINARY ============
CREATE TABLE public.hr_disciplinary (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id text NOT NULL,
  employee_name text NOT NULL DEFAULT '',
  location_id uuid REFERENCES public.locations(id) ON DELETE SET NULL,
  audit_id uuid REFERENCES public.cctv_audits(id) ON DELETE SET NULL,
  warning_level text NOT NULL DEFAULT 'Verbal',
  status text NOT NULL DEFAULT 'Open',
  notes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.hr_disciplinary TO authenticated;
GRANT ALL ON public.hr_disciplinary TO service_role;
ALTER TABLE public.hr_disciplinary ENABLE ROW LEVEL SECURITY;
CREATE POLICY "hr readable" ON public.hr_disciplinary FOR SELECT TO authenticated USING (true);
CREATE POLICY "hr write" ON public.hr_disciplinary FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============ BUDGETS / P&L ============
CREATE TABLE public.pnl_periods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id uuid NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
  period_start date NOT NULL,
  period_type text NOT NULL DEFAULT 'month',
  revenue_actual numeric(14,2) NOT NULL DEFAULT 0,
  revenue_budget numeric(14,2) NOT NULL DEFAULT 0,
  revenue_ly numeric(14,2) NOT NULL DEFAULT 0,
  cogs_actual numeric(14,2) NOT NULL DEFAULT 0,
  cogs_budget numeric(14,2) NOT NULL DEFAULT 0,
  cogs_ly numeric(14,2) NOT NULL DEFAULT 0,
  labor_actual numeric(14,2) NOT NULL DEFAULT 0,
  labor_budget numeric(14,2) NOT NULL DEFAULT 0,
  labor_ly numeric(14,2) NOT NULL DEFAULT 0,
  opex_actual numeric(14,2) NOT NULL DEFAULT 0,
  opex_budget numeric(14,2) NOT NULL DEFAULT 0,
  opex_ly numeric(14,2) NOT NULL DEFAULT 0,
  UNIQUE (location_id, period_start, period_type)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pnl_periods TO authenticated;
GRANT ALL ON public.pnl_periods TO service_role;
ALTER TABLE public.pnl_periods ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pnl readable" ON public.pnl_periods FOR SELECT TO authenticated USING (true);

-- ============ BUSINESS CALENDAR ============
CREATE TABLE public.calendar_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  country text NOT NULL DEFAULT 'Global',
  start_date date NOT NULL,
  end_date date NOT NULL,
  multiplier numeric(5,2) NOT NULL DEFAULT 1.0
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.calendar_events TO authenticated;
GRANT ALL ON public.calendar_events TO service_role;
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "calendar readable" ON public.calendar_events FOR SELECT TO authenticated USING (true);
CREATE POLICY "calendar write" ON public.calendar_events FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============ AI CHAT ============
CREATE TABLE public.ai_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_messages TO authenticated;
GRANT ALL ON public.ai_messages TO service_role;
ALTER TABLE public.ai_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own messages" ON public.ai_messages FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============ SEED: LOCATIONS ============
INSERT INTO public.locations (code,name,city,area,country,currency) VALUES
('DXB-01','Marina Walk','Dubai','Dubai Marina','UAE','AED'),
('DXB-02','Downtown Boulevard','Dubai','Downtown','UAE','AED'),
('AUH-01','Corniche Central','Abu Dhabi','Corniche','UAE','AED'),
('RUH-01','Olaya Tower','Riyadh','Olaya','KSA','SAR'),
('JED-01','Tahlia Street','Jeddah','Tahlia','KSA','SAR'),
('DAC-01','Gulshan Avenue','Dhaka','Gulshan','Bangladesh','BDT'),
('DAC-02','Dhanmondi 27','Dhaka','Dhanmondi','Bangladesh','BDT'),
('LON-01','Shoreditch High','London','East London','UK','GBP'),
('NYC-01','Midtown 5th','New York','Manhattan','USA','USD'),
('SIN-01','Orchard Central','Singapore','Orchard','Singapore','SGD');

-- ============ SEED: P&L (12 months per location) ============
INSERT INTO public.pnl_periods (location_id, period_start, period_type, revenue_actual, revenue_budget, revenue_ly, cogs_actual, cogs_budget, cogs_ly, labor_actual, labor_budget, labor_ly, opex_actual, opex_budget, opex_ly)
SELECT l.id,
       (date_trunc('month', current_date) - (m || ' month')::interval)::date,
       'month',
       base, base * 1.04, base * 0.92,
       base * (0.29 + (m % 4) * 0.006), base * 0.285, base * 0.30,
       base * (0.21 + (m % 3) * 0.005), base * 0.205, base * 0.215,
       base * 0.17, base * 0.165, base * 0.175
FROM public.locations l
CROSS JOIN generate_series(0, 11) AS m
CROSS JOIN LATERAL (SELECT (180000 + (abs(hashtext(l.code || m::text)) % 90000))::numeric AS base) b;

-- ============ SEED: SALES TICKETS (last 14 days, hourly) ============
INSERT INTO public.sales_pos (location_id, cashier, ticket_no, ticket_data, total_amount, voided, discount_amount, "timestamp")
SELECT l.id,
  (ARRAY['A. Rahman','S. Fernandes','M. Osei','L. Chen','D. Kapoor'])[1 + (abs(hashtext(l.code||d::text||h::text)) % 5)],
  'T-' || upper(substr(md5(l.code||d::text||h::text), 1, 8)),
  jsonb_build_object(
    'items', jsonb_build_array(
      jsonb_build_object('sku','BURGER','name','Signature Burger','qty', 1 + (abs(hashtext(l.code||d::text||h::text||'q')) % 3),
        'modifiers', CASE WHEN (abs(hashtext(l.code||d::text||h::text||'m')) % 7) = 0
          THEN jsonb_build_array(jsonb_build_object('name','Extra Patty','qty',4)) ELSE '[]'::jsonb END),
      jsonb_build_object('sku','FRIES','name','Loaded Fries','qty', 1 + (abs(hashtext(l.code||d::text||h::text||'f')) % 2), 'modifiers','[]'::jsonb)
    ),
    'channel', (ARRAY['Dine-in','Takeaway','Delivery'])[1 + (abs(hashtext(l.code||d::text||h::text||'c')) % 3)]
  ),
  (45 + (abs(hashtext(l.code||d::text||h::text||'v')) % 210))::numeric,
  (abs(hashtext(l.code||d::text||h::text||'x')) % 23) = 0,
  (abs(hashtext(l.code||d::text||h::text||'dd')) % 12)::numeric,
  (current_date - d) + (h || ' hour')::interval + ((abs(hashtext(l.code||d::text||h::text)) % 59) || ' min')::interval
FROM public.locations l
CROSS JOIN generate_series(0, 13) AS d
CROSS JOIN generate_series(9, 23) AS h;

-- ============ SEED: INVENTORY LEDGER ============
INSERT INTO public.inventory_ledger (location_id, item_name, unit, unit_cost, theoretical_qty, actual_qty, period_date)
SELECT l.id, i.item, i.unit, i.cost,
  i.theo + (abs(hashtext(l.code||i.item)) % 40),
  i.theo + (abs(hashtext(l.code||i.item)) % 40) - i.gap,
  current_date
FROM public.locations l
CROSS JOIN (VALUES
  ('Beef Patty','pcs',2.40,420,1),
  ('Burger Bun','pcs',0.55,300,3),
  ('Cheese Slice','pcs',0.35,360,0),
  ('Chicken Fillet','pcs',1.90,280,2),
  ('Potato Fries','kg',1.20,150,0),
  ('Cooking Oil','ltr',2.10,90,4),
  ('Soft Drink Syrup','ltr',3.40,60,0),
  ('Lettuce','kg',1.80,45,1)
) AS i(item,unit,cost,theo,gap);

-- Signature theft case at DXB-01: buns short by 3 against patty depletion
UPDATE public.inventory_ledger SET theoretical_qty = 300, actual_qty = 297
WHERE item_name = 'Burger Bun' AND location_id = (SELECT id FROM public.locations WHERE code='DXB-01');
UPDATE public.inventory_ledger SET theoretical_qty = 425, actual_qty = 425
WHERE item_name = 'Beef Patty' AND location_id = (SELECT id FROM public.locations WHERE code='DXB-01');

-- ============ SEED: CCTV AUDITS ============
INSERT INTO public.cctv_audits (location_id, violation_type, category, description, severity, status, escalation_level, assigned_role, confidence, camera, financial_impact, "timestamp")
VALUES
((SELECT id FROM public.locations WHERE code='DXB-01'),'Cash Manipulation','Theft','Cashier voided 3 closed tickets after cash drawer open — no manager approval captured.','Critical','Open',3,'MD',0.972,'CAM-POS-02',1840, now() - interval '5 hour'),
((SELECT id FROM public.locations WHERE code='DAC-01'),'Theft','Theft','Back-door hand-off of unlogged packaged goods detected at 23:41.','Critical','Open',3,'COO',0.944,'CAM-BACK-01',960, now() - interval '20 hour'),
((SELECT id FROM public.locations WHERE code='RUH-01'),'No Hairnet','Safety','Kitchen staff operating fryer station without hairnet for 14 minutes.','Minor','Open',0,'Restaurant Manager',0.912,'CAM-KIT-03',0, now() - interval '9 hour'),
((SELECT id FROM public.locations WHERE code='LON-01'),'Slow Service','Speed of Service','Drive-thru window time averaged 6m12s vs 3m00s standard across peak hour.','Minor','Open',1,'Area Manager',0.887,'CAM-DT-01',420, now() - interval '61 hour'),
((SELECT id FROM public.locations WHERE code='NYC-01'),'Wet Floor Unmarked','Safety','Spill left unmarked in guest area for 22 minutes.','Minor','Open',2,'Operations Manager',0.903,'CAM-FOH-02',0, now() - interval '104 hour'),
((SELECT id FROM public.locations WHERE code='JED-01'),'Improper Portioning','Waste','Fries portion overweight by 38% across 17 consecutive orders.','Minor','In Progress',1,'Area Manager',0.861,'CAM-KIT-01',310, now() - interval '52 hour'),
((SELECT id FROM public.locations WHERE code='SIN-01'),'Unauthorised Discount','Theft','Staff discount applied to 9 guest tickets by one terminal.','Critical','Open',3,'Head HR',0.958,'CAM-POS-01',740, now() - interval '30 hour'),
((SELECT id FROM public.locations WHERE code='DXB-02'),'Uniform Violation','Safety','Two team members on shift out of uniform standard.','Minor','Resolved',0,'Restaurant Manager',0.834,'CAM-FOH-01',0, now() - interval '75 hour'),
((SELECT id FROM public.locations WHERE code='AUH-01'),'Food Safety Temp','Safety','Holding cabinet below 60C for 31 minutes without corrective log.','Critical','Acknowledged',3,'COO',0.921,'CAM-KIT-02',0, now() - interval '12 hour'),
((SELECT id FROM public.locations WHERE code='DAC-02'),'Till Shortage','Theft','Cash count variance of BDT 4,200 at shift close.','Critical','Open',3,'MD',0.966,'CAM-POS-03',420, now() - interval '46 hour');

-- ============ SEED: HR DISCIPLINARY ============
INSERT INTO public.hr_disciplinary (employee_id, employee_name, location_id, audit_id, warning_level, status, notes)
SELECT 'EMP-' || upper(substr(md5(a.id::text),1,5)),
       (ARRAY['A. Rahman','S. Fernandes','M. Osei','L. Chen','D. Kapoor'])[1 + (abs(hashtext(a.id::text)) % 5)],
       a.location_id, a.id,
       CASE WHEN a.severity = 'Critical' THEN 'Final Written' ELSE 'Verbal' END,
       CASE WHEN a.status = 'Resolved' THEN 'Closed' ELSE 'Open' END,
       'Auto-raised from CCTV audit: ' || a.violation_type
FROM public.cctv_audits a WHERE a.severity = 'Critical' OR a.escalation_level >= 1;

-- ============ SEED: CALENDAR ============
INSERT INTO public.calendar_events (name,country,start_date,end_date,multiplier) VALUES
('Ramadan','UAE', (date_trunc('year', current_date) + interval '2 month')::date, (date_trunc('year', current_date) + interval '3 month')::date, 0.78),
('Eid al-Fitr','UAE', (date_trunc('year', current_date) + interval '3 month')::date, (date_trunc('year', current_date) + interval '3 month 3 day')::date, 1.85),
('Eid al-Adha','KSA', (date_trunc('year', current_date) + interval '5 month')::date, (date_trunc('year', current_date) + interval '5 month 3 day')::date, 1.72),
('Durga Puja','Bangladesh', (date_trunc('year', current_date) + interval '9 month')::date, (date_trunc('year', current_date) + interval '9 month 5 day')::date, 1.64),
('Pohela Boishakh','Bangladesh', (date_trunc('year', current_date) + interval '3 month 13 day')::date, (date_trunc('year', current_date) + interval '3 month 14 day')::date, 1.48),
('National Day','UAE', (date_trunc('year', current_date) + interval '11 month 1 day')::date, (date_trunc('year', current_date) + interval '11 month 2 day')::date, 1.55),
('Christmas','UK', (date_trunc('year', current_date) + interval '11 month 24 day')::date, (date_trunc('year', current_date) + interval '11 month 25 day')::date, 1.35),
('Thanksgiving','USA', (date_trunc('year', current_date) + interval '10 month 27 day')::date, (date_trunc('year', current_date) + interval '10 month 28 day')::date, 1.42),
('Chinese New Year','Singapore', (date_trunc('year', current_date) + interval '1 month 9 day')::date, (date_trunc('year', current_date) + interval '1 month 12 day')::date, 1.68);