/*
  # Initial Schema for News & Quiz Challenge App

  1. New Tables
    - `profiles`
      - `id` (uuid, primary key, references auth.users)
      - `username` (text, unique, not null)
      - `avatar_url` (text)
      - `points` (integer, default 0)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `news_articles`
      - `id` (uuid, primary key)
      - `title` (text, not null)
      - `content` (text, not null)
      - `category` (text)
      - `image_url` (text)
      - `author_id` (uuid, references profiles)
      - `created_at` (timestamptz)
    
    - `quiz_questions`
      - `id` (uuid, primary key)
      - `question` (text, not null)
      - `options` (jsonb, not null)
      - `correct_answer` (integer, not null)
      - `category` (text)
      - `difficulty` (text)
      - `created_at` (timestamptz)
    
    - `challenges`
      - `id` (uuid, primary key)
      - `challenger_id` (uuid, references profiles)
      - `opponent_id` (uuid, references profiles)
      - `status` (text, default 'pending')
      - `winner_id` (uuid, references profiles, nullable)
      - `created_at` (timestamptz)
    
    - `challenge_responses`
      - `id` (uuid, primary key)
      - `challenge_id` (uuid, references challenges)
      - `user_id` (uuid, references profiles)
      - `question_id` (uuid, references quiz_questions)
      - `selected_answer` (integer, not null)
      - `is_correct` (boolean, not null)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
    - Public read access for news articles and quiz questions
    - Challenge participants can view and update their challenges
*/

CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  username text UNIQUE NOT NULL,
  avatar_url text,
  points integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE TABLE IF NOT EXISTS news_articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  category text DEFAULT 'general',
  image_url text,
  author_id uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE news_articles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view news articles"
  ON news_articles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create news articles"
  ON news_articles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = author_id);

CREATE TABLE IF NOT EXISTS quiz_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question text NOT NULL,
  options jsonb NOT NULL,
  correct_answer integer NOT NULL,
  category text DEFAULT 'general',
  difficulty text DEFAULT 'medium',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE quiz_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view quiz questions"
  ON quiz_questions FOR SELECT
  TO authenticated
  USING (true);

CREATE TABLE IF NOT EXISTS challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  challenger_id uuid REFERENCES profiles(id) NOT NULL,
  opponent_id uuid REFERENCES profiles(id) NOT NULL,
  status text DEFAULT 'pending',
  winner_id uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own challenges"
  ON challenges FOR SELECT
  TO authenticated
  USING (auth.uid() = challenger_id OR auth.uid() = opponent_id);

CREATE POLICY "Users can create challenges"
  ON challenges FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = challenger_id);

CREATE POLICY "Challenge participants can update"
  ON challenges FOR UPDATE
  TO authenticated
  USING (auth.uid() = challenger_id OR auth.uid() = opponent_id)
  WITH CHECK (auth.uid() = challenger_id OR auth.uid() = opponent_id);

CREATE TABLE IF NOT EXISTS challenge_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id uuid REFERENCES challenges(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) NOT NULL,
  question_id uuid REFERENCES quiz_questions(id) NOT NULL,
  selected_answer integer NOT NULL,
  is_correct boolean NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE challenge_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view responses for their challenges"
  ON challenge_responses FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM challenges
      WHERE challenges.id = challenge_responses.challenge_id
      AND (challenges.challenger_id = auth.uid() OR challenges.opponent_id = auth.uid())
    )
  );

CREATE POLICY "Users can insert their own responses"
  ON challenge_responses FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);