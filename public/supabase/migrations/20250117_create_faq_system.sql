-- Create FAQ table for managing questions and answers
CREATE TABLE IF NOT EXISTS public.faq_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  is_popular BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  status TEXT DEFAULT 'published' CHECK (status IN ('published', 'draft')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.faq_items ENABLE ROW LEVEL SECURITY;

-- Public can read published FAQs
CREATE POLICY "Anyone can view published FAQs"
  ON public.faq_items
  FOR SELECT
  USING (status = 'published');

-- Marketing users can manage FAQs
CREATE POLICY "Marketing users can manage FAQs"
  ON public.faq_items
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'marketing'))
  WITH CHECK (public.has_role(auth.uid(), 'marketing'));

-- Create index for performance
CREATE INDEX idx_faq_popular ON public.faq_items(is_popular, display_order) WHERE status = 'published';
CREATE INDEX idx_faq_status ON public.faq_items(status);

-- Insert default FAQ data
INSERT INTO public.faq_items (question, answer, is_popular, display_order) VALUES
('What age groups do you cater for?', 'We welcome children aged 3-17 years. Our programs are designed with age-appropriate activities to ensure every child has a safe and engaging experience in nature.', true, 1),
('Where are your activities located?', 'All our programs take place at the beautiful Karura Forest in Nairobi. This urban forest provides the perfect setting for outdoor education and adventure activities.', true, 2),
('What should my child bring for activities?', 'We recommend comfortable outdoor clothing, closed shoes, a water bottle, and sun protection. We provide all necessary equipment for activities. Detailed packing lists are sent before each program.', true, 3),
('Do you offer birthday party packages?', 'Yes! We create memorable birthday celebrations in nature with age-appropriate games, forest exploration, and adventure activities. Contact us to customize a party package for your child.', true, 4),
('What safety measures do you have in place?', 'Safety is our top priority. All our instructors are trained in first aid, we maintain low instructor-to-child ratios, and we follow strict safety protocols for all activities in the forest environment.', false, 5),
('How do I register for programs?', 'You can register through our website, call us directly, or visit us at Karura Forest. We recommend booking in advance as our programs often fill up quickly.', false, 6),
('Do you offer school group programs?', 'Absolutely! We provide educational outdoor programs for schools, including curriculum-aligned activities that combine learning with adventure in the forest setting.', false, 7),
('What happens if it rains?', 'Light rain doesn''t stop the adventure! We have covered areas and rain-appropriate activities. In case of heavy rain or unsafe weather, we''ll reschedule your program.', false, 8);
