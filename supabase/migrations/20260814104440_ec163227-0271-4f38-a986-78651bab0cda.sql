
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;

INSERT INTO public.assessment_questions (category, difficulty, question, options, correct_index, explanation) VALUES
('Programming','Easy','What is the time complexity of accessing an element by index in an array?','{"O(1)","O(log n)","O(n)","O(n log n)"}',0,'Array indexing is constant time.'),
('Programming','Medium','Which data structure uses LIFO ordering?','{"Queue","Stack","Heap","Graph"}',1,'A stack is Last-In-First-Out.'),
('Programming','Medium','In JavaScript, what does `const` guarantee?','{"Immutable value","Immutable binding","Deep freeze","Global scope"}',1,'const prevents reassignment of the binding, not mutation.'),
('Communication','Easy','Active listening primarily means:','{"Preparing your reply","Fully focusing on the speaker","Taking notes only","Interrupting to clarify"}',1,'Active listening is focused attention on the speaker.'),
('Communication','Medium','The STAR method is used to:','{"Structure behavioural answers","Rate presentations","Write emails","Plan sprints"}',0,'STAR = Situation, Task, Action, Result.'),
('Problem Solving','Medium','A problem is best decomposed by:','{"Guessing","Breaking it into smaller subproblems","Writing code first","Skipping edge cases"}',1,'Decomposition reduces complexity.'),
('Problem Solving','Hard','Which strategy solves overlapping subproblems efficiently?','{"Greedy","Dynamic Programming","Brute force","Backtracking"}',1,'DP memoizes overlapping subproblems.'),
('Aptitude','Easy','If 5 machines make 5 items in 5 minutes, how long for 100 machines to make 100 items?','{"100 minutes","20 minutes","5 minutes","1 minute"}',2,'Each machine takes 5 minutes per item.'),
('Aptitude','Medium','A train covers 180 km in 3 hours. Its speed is:','{"50 km/h","55 km/h","60 km/h","65 km/h"}',2,'180/3 = 60 km/h.'),
('Logical Thinking','Easy','Find the next number: 2, 6, 12, 20, ?','{"28","30","32","36"}',1,'Differences increase by 2: +4,+6,+8,+10 => 30.'),
('Logical Thinking','Medium','All roses are flowers. Some flowers fade quickly. Therefore:','{"All roses fade quickly","Some roses fade quickly","No conclusion follows","Roses never fade"}',2,'The middle term is not distributed.'),
('Database','Easy','Which SQL clause filters grouped rows?','{"WHERE","HAVING","ORDER BY","LIMIT"}',1,'HAVING filters after GROUP BY.'),
('Database','Medium','Normalization primarily reduces:','{"Query speed","Data redundancy","Storage cost only","Index size"}',1,'Normalization removes redundancy.'),
('Frontend','Easy','Which hook stores local component state in React?','{"useEffect","useState","useMemo","useRef"}',1,'useState holds local state.'),
('Frontend','Medium','CSS flexbox `justify-content` aligns items along the:','{"Cross axis","Main axis","Z axis","Baseline"}',1,'justify-content works on the main axis.'),
('Backend','Medium','HTTP status 401 means:','{"Not found","Unauthorized","Server error","Conflict"}',1,'401 = missing or invalid authentication.'),
('Backend','Medium','An idempotent HTTP method is:','{"POST","PATCH","PUT","CONNECT"}',2,'PUT produces the same result when repeated.'),
('AI','Easy','Overfitting means the model:','{"Generalizes well","Memorizes training data","Underuses features","Trains too fast"}',1,'Overfit models fit noise in training data.'),
('AI','Medium','Which metric suits imbalanced classification?','{"Accuracy","F1 score","MSE","R squared"}',1,'F1 balances precision and recall.'),
('AI','Hard','In transformers, self-attention primarily models:','{"Token order only","Pairwise token relationships","Gradient flow","Weight decay"}',1,'Self-attention relates every token to every other token.');
