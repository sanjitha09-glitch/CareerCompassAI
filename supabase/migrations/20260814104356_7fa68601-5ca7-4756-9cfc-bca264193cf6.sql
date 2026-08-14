
-- ROLES
CREATE TYPE public.app_role AS ENUM ('student','mentor','admin');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL DEFAULT 'student',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- PROFILES
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  avatar_url text,
  headline text,
  college text,
  degree text,
  branch text,
  year text,
  cgpa numeric,
  location text,
  bio text,
  skills text[] NOT NULL DEFAULT '{}',
  interests text[] NOT NULL DEFAULT '{}',
  languages text[] NOT NULL DEFAULT '{}',
  linkedin_url text,
  github_url text,
  portfolio_url text,
  onboarding_complete boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile" ON public.profiles FOR ALL TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "admins read profiles" ON public.profiles FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'), NEW.raw_user_meta_data->>'avatar_url')
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'student') ON CONFLICT DO NOTHING;
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- CATALOG: CAREER PATHS
CREATE TABLE public.career_paths (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text NOT NULL,
  salary_range text NOT NULL,
  demand text NOT NULL,
  growth text NOT NULL,
  required_skills text[] NOT NULL DEFAULT '{}',
  companies text[] NOT NULL DEFAULT '{}',
  learning_path text[] NOT NULL DEFAULT '{}',
  category text NOT NULL DEFAULT 'Technology',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.career_paths TO anon, authenticated;
GRANT ALL ON public.career_paths TO service_role;
ALTER TABLE public.career_paths ENABLE ROW LEVEL SECURITY;
CREATE POLICY "career paths public" ON public.career_paths FOR SELECT USING (true);

-- CATALOG: COURSES
CREATE TABLE public.courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  provider text NOT NULL,
  instructor text,
  url text NOT NULL,
  image_url text,
  rating numeric NOT NULL DEFAULT 4.5,
  duration text,
  difficulty text NOT NULL DEFAULT 'Beginner',
  price text NOT NULL DEFAULT 'Free',
  certificate boolean NOT NULL DEFAULT true,
  skills text[] NOT NULL DEFAULT '{}',
  category text NOT NULL DEFAULT 'Programming',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.courses TO anon, authenticated;
GRANT ALL ON public.courses TO service_role;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "courses public" ON public.courses FOR SELECT USING (true);

-- CATALOG: INTERNSHIPS
CREATE TABLE public.internships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role text NOT NULL,
  company text NOT NULL,
  source text NOT NULL,
  url text NOT NULL,
  logo_text text,
  location text NOT NULL DEFAULT 'Remote',
  work_mode text NOT NULL DEFAULT 'Remote',
  stipend text,
  duration text,
  experience text NOT NULL DEFAULT 'Fresher',
  skills text[] NOT NULL DEFAULT '{}',
  posted_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.internships TO anon, authenticated;
GRANT ALL ON public.internships TO service_role;
ALTER TABLE public.internships ENABLE ROW LEVEL SECURITY;
CREATE POLICY "internships public" ON public.internships FOR SELECT USING (true);

CREATE TABLE public.saved_internships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  internship_id uuid NOT NULL REFERENCES public.internships(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, internship_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.saved_internships TO authenticated;
GRANT ALL ON public.saved_internships TO service_role;
ALTER TABLE public.saved_internships ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own saved internships" ON public.saved_internships FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- USER SKILLS
CREATE TABLE public.user_skills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  category text NOT NULL DEFAULT 'Programming',
  level int NOT NULL DEFAULT 50,
  status text NOT NULL DEFAULT 'moderate',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, name)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_skills TO authenticated;
GRANT ALL ON public.user_skills TO service_role;
ALTER TABLE public.user_skills ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own skills" ON public.user_skills FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- CAREER MATCHES
CREATE TABLE public.career_matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  match_score int NOT NULL DEFAULT 0,
  confidence int NOT NULL DEFAULT 0,
  salary_range text,
  demand text,
  growth text,
  description text,
  required_skills text[] NOT NULL DEFAULT '{}',
  missing_skills text[] NOT NULL DEFAULT '{}',
  companies text[] NOT NULL DEFAULT '{}',
  learning_path text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.career_matches TO authenticated;
GRANT ALL ON public.career_matches TO service_role;
ALTER TABLE public.career_matches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own matches" ON public.career_matches FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ROADMAP
CREATE TABLE public.roadmap_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  step_order int NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'upcoming',
  resources text[] NOT NULL DEFAULT '{}',
  target_career text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.roadmap_steps TO authenticated;
GRANT ALL ON public.roadmap_steps TO service_role;
ALTER TABLE public.roadmap_steps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own roadmap" ON public.roadmap_steps FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER roadmap_updated BEFORE UPDATE ON public.roadmap_steps FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RESUMES
CREATE TABLE public.resumes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_path text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.resumes TO authenticated;
GRANT ALL ON public.resumes TO service_role;
ALTER TABLE public.resumes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own resumes" ON public.resumes FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.resume_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  resume_id uuid REFERENCES public.resumes(id) ON DELETE CASCADE,
  ats_score int NOT NULL DEFAULT 0,
  grammar_score int NOT NULL DEFAULT 0,
  formatting_score int NOT NULL DEFAULT 0,
  keyword_score int NOT NULL DEFAULT 0,
  summary text,
  strengths text[] NOT NULL DEFAULT '{}',
  suggestions text[] NOT NULL DEFAULT '{}',
  missing_keywords text[] NOT NULL DEFAULT '{}',
  missing_sections text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.resume_scores TO authenticated;
GRANT ALL ON public.resume_scores TO service_role;
ALTER TABLE public.resume_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own resume scores" ON public.resume_scores FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ASSESSMENTS
CREATE TABLE public.assessment_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL,
  difficulty text NOT NULL DEFAULT 'Easy',
  question text NOT NULL,
  options text[] NOT NULL,
  correct_index int NOT NULL,
  explanation text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.assessment_questions TO authenticated;
GRANT ALL ON public.assessment_questions TO service_role;
ALTER TABLE public.assessment_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "questions readable" ON public.assessment_questions FOR SELECT TO authenticated USING (true);

CREATE TABLE public.assessment_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category text NOT NULL,
  score int NOT NULL,
  total int NOT NULL,
  duration_seconds int NOT NULL DEFAULT 0,
  weak_areas text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.assessment_results TO authenticated;
GRANT ALL ON public.assessment_results TO service_role;
ALTER TABLE public.assessment_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own results" ON public.assessment_results FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- CERTIFICATES
CREATE TABLE public.certificates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  issuer text NOT NULL,
  category text NOT NULL DEFAULT 'Course',
  issue_date date,
  credential_url text,
  file_path text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.certificates TO authenticated;
GRANT ALL ON public.certificates TO service_role;
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own certificates" ON public.certificates FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- NOTIFICATIONS
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  body text,
  type text NOT NULL DEFAULT 'info',
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own notifications" ON public.notifications FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- CHAT
CREATE TABLE public.chat_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL,
  content text NOT NULL,
  thread text NOT NULL DEFAULT 'career',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.chat_history TO authenticated;
GRANT ALL ON public.chat_history TO service_role;
ALTER TABLE public.chat_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own chat" ON public.chat_history FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- INTERVIEWS
CREATE TABLE public.interview_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category text NOT NULL,
  transcript jsonb NOT NULL DEFAULT '[]'::jsonb,
  score int,
  feedback text,
  completed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.interview_sessions TO authenticated;
GRANT ALL ON public.interview_sessions TO service_role;
ALTER TABLE public.interview_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own interviews" ON public.interview_sessions FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ACTIVITY
CREATE TABLE public.activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action text NOT NULL,
  detail text,
  minutes int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.activity_logs TO authenticated;
GRANT ALL ON public.activity_logs TO service_role;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own activity" ON public.activity_logs FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- SETTINGS
CREATE TABLE public.user_settings (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  theme text NOT NULL DEFAULT 'dark',
  language text NOT NULL DEFAULT 'en',
  email_notifications boolean NOT NULL DEFAULT true,
  push_notifications boolean NOT NULL DEFAULT true,
  profile_public boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_settings TO authenticated;
GRANT ALL ON public.user_settings TO service_role;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own settings" ON public.user_settings FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- SEED CAREER PATHS
INSERT INTO public.career_paths (title, slug, description, salary_range, demand, growth, required_skills, companies, learning_path, category) VALUES
('Software Engineer','software-engineer','Design, build and maintain scalable software products across web and cloud platforms.','₹6L - ₹28L','Very High','+22% by 2030','{"Data Structures","Algorithms","JavaScript","React","Node.js","SQL","Git"}','{"Google","Microsoft","Amazon","Atlassian","Zoho"}','{"Programming Fundamentals","DSA","Web Development","Databases","System Design","Projects"}','Engineering'),
('Data Scientist','data-scientist','Turn raw data into predictive insight using statistics and machine learning.','₹8L - ₹32L','High','+35% by 2030','{"Python","Statistics","Pandas","Machine Learning","SQL","Visualization"}','{"Netflix","Flipkart","Swiggy","IBM","Fractal"}','{"Python","Math & Statistics","Pandas/Numpy","ML Algorithms","Deployment","Capstone"}','Data'),
('AI/ML Engineer','ai-ml-engineer','Ship production machine learning and generative AI systems.','₹10L - ₹45L','Very High','+40% by 2030','{"Python","PyTorch","Deep Learning","MLOps","LLMs","Vector Databases"}','{"OpenAI","Nvidia","Google DeepMind","Adobe","Sarvam AI"}','{"Python","Math for ML","Deep Learning","LLM Engineering","MLOps","Portfolio"}','AI'),
('Cloud Engineer','cloud-engineer','Architect and operate reliable cloud infrastructure.','₹7L - ₹30L','High','+25% by 2030','{"AWS","Linux","Networking","Terraform","Docker","Kubernetes"}','{"AWS","Microsoft","Accenture","Infosys","TCS"}','{"Linux","Networking","AWS Core","IaC","Containers","Certification"}','Cloud'),
('Cybersecurity Analyst','cybersecurity-analyst','Defend systems and data against evolving security threats.','₹6L - ₹26L','High','+32% by 2030','{"Networking","Linux","SIEM","Threat Analysis","Cryptography"}','{"Palo Alto","Cisco","Deloitte","EY","Wipro"}','{"Networking","Operating Systems","Security Fundamentals","Blue Team Tools","Certifications"}','Security'),
('DevOps Engineer','devops-engineer','Automate build, deploy and observability pipelines.','₹8L - ₹30L','High','+24% by 2030','{"CI/CD","Docker","Kubernetes","Terraform","Monitoring","Scripting"}','{"Razorpay","Zerodha","Red Hat","Oracle","Cred"}','{"Linux","Git & CI/CD","Containers","Kubernetes","Observability","Projects"}','Cloud'),
('UI/UX Designer','ui-ux-designer','Design intuitive, accessible and delightful product experiences.','₹5L - ₹22L','Medium','+18% by 2030','{"Figma","User Research","Wireframing","Design Systems","Prototyping"}','{"Zomato","Freshworks","Adobe","Postman","Meesho"}','{"Design Principles","Figma","User Research","Design Systems","Portfolio"}','Design'),
('Blockchain Developer','blockchain-developer','Build decentralized applications and smart contracts.','₹8L - ₹35L','Medium','+28% by 2030','{"Solidity","Ethereum","Web3.js","Cryptography","Smart Contracts"}','{"Polygon","CoinDCX","ConsenSys","WazirX"}','{"Programming","Blockchain Basics","Solidity","dApps","Security Audits"}','Web3');

-- SEED COURSES
INSERT INTO public.courses (title, provider, instructor, url, rating, duration, difficulty, price, skills, category) VALUES
('CS50: Introduction to Computer Science','Harvard / edX','David J. Malan','https://cs50.harvard.edu/x/',4.9,'12 weeks','Beginner','Free','{"C","Python","Algorithms"}','Programming'),
('Python for Everybody','Coursera','Dr. Charles Severance','https://www.coursera.org/specializations/python',4.8,'8 months','Beginner','Free to audit','{"Python","SQL","APIs"}','Programming'),
('Machine Learning Specialization','Coursera','Andrew Ng','https://www.coursera.org/specializations/machine-learning-introduction',4.9,'3 months','Intermediate','Free to audit','{"Machine Learning","Python","TensorFlow"}','AI'),
('Responsive Web Design','freeCodeCamp','freeCodeCamp','https://www.freecodecamp.org/learn/2022/responsive-web-design/',4.8,'300 hours','Beginner','Free','{"HTML","CSS","Accessibility"}','Frontend'),
('The Complete Web Development Bootcamp','Udemy','Dr. Angela Yu','https://www.udemy.com/course/the-complete-web-development-bootcamp/',4.7,'62 hours','Beginner','Paid','{"HTML","CSS","JavaScript","Node.js","React"}','Frontend'),
('Data Structures & Algorithms','Udemy','Colt Steele','https://www.udemy.com/course/js-algorithms-and-data-structures-masterclass/',4.7,'22 hours','Intermediate','Paid','{"Data Structures","Algorithms","JavaScript"}','Programming'),
('Azure Fundamentals AZ-900','Microsoft Learn','Microsoft','https://learn.microsoft.com/en-us/training/paths/microsoft-azure-fundamentals-describe-cloud-concepts/',4.7,'10 hours','Beginner','Free','{"Cloud","Azure"}','Cloud'),
('Google Cloud Skills Boost: Cloud Engineer','Google','Google Cloud','https://www.cloudskillsboost.google/paths/11',4.6,'40 hours','Intermediate','Free tier','{"GCP","Kubernetes","Networking"}','Cloud'),
('SQL for Data Science','Coursera','UC Davis','https://www.coursera.org/learn/sql-for-data-science',4.6,'4 weeks','Beginner','Free to audit','{"SQL","Databases"}','Database'),
('Programming in Java','NPTEL','IIT Kharagpur','https://nptel.ac.in/courses/106105191',4.5,'12 weeks','Beginner','Free','{"Java","OOP"}','Programming'),
('Intro to Statistics','Khan Academy','Khan Academy','https://www.khanacademy.org/math/statistics-probability',4.7,'Self paced','Beginner','Free','{"Statistics","Probability"}','Data'),
('Software Engineering Fundamentals','Infosys Springboard','Infosys','https://infyspringboard.onwingspan.com/',4.4,'20 hours','Beginner','Free','{"SDLC","Testing"}','Programming');

-- SEED INTERNSHIPS
INSERT INTO public.internships (role, company, source, url, logo_text, location, work_mode, stipend, duration, experience, skills) VALUES
('Software Developer Intern','Microsoft','Microsoft Careers','https://careers.microsoft.com/','MS','Hyderabad','Hybrid','₹80,000/mo','6 months','Fresher','{"C#","Data Structures","Algorithms"}'),
('AI/ML Intern','Google','Google Careers','https://careers.google.com/students/','G','Bengaluru','Onsite','₹1,00,000/mo','6 months','Fresher','{"Python","Machine Learning","TensorFlow"}'),
('Data Science Intern','TCS','TCS Careers','https://www.tcs.com/careers','TCS','Pune','Hybrid','₹25,000/mo','3 months','Fresher','{"Python","SQL","Statistics"}'),
('Frontend Engineering Intern','Wellfound Startup','Wellfound','https://wellfound.com/jobs','WF','Remote','Remote','₹30,000/mo','4 months','Fresher','{"React","TypeScript","CSS"}'),
('Cloud Engineering Intern','IBM','IBM Careers','https://www.ibm.com/careers/internships','IBM','Bengaluru','Hybrid','₹40,000/mo','6 months','Fresher','{"Cloud","Linux","Docker"}'),
('Backend Developer Intern','Infosys','Infosys Careers','https://www.infosys.com/careers/','INFY','Mysuru','Onsite','₹20,000/mo','6 months','Fresher','{"Java","Spring","SQL"}'),
('Cybersecurity Intern','Accenture','Accenture Careers','https://www.accenture.com/in-en/careers','ACN','Gurugram','Hybrid','₹35,000/mo','6 months','Fresher','{"Networking","Security","Linux"}'),
('SDE Intern','Amazon','Amazon Jobs','https://www.amazon.jobs/en/teams/internships-for-students','AMZ','Chennai','Onsite','₹1,10,000/mo','6 months','Fresher','{"Data Structures","Algorithms","Java"}'),
('Product Design Intern','Internshala Partner','Internshala','https://internshala.com/internships','IS','Remote','Remote','₹15,000/mo','3 months','Fresher','{"Figma","User Research"}'),
('Full Stack Intern','LinkedIn Partner','LinkedIn','https://www.linkedin.com/jobs/','LI','Remote','Remote','₹45,000/mo','6 months','Fresher','{"React","Node.js","MongoDB"}');
