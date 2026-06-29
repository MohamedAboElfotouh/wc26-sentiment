# WC26 Sentiment Pulse ⚽️📊

**Live Demo:** [https://wc26-sentiment.vercel.app/](https://wc26-sentiment.vercel.app/)

## Overview
WC26 Sentiment Pulse is a real-time, MLOps-driven web application designed to track and visualize the global public perception of the 48 national teams competing in the 2026 FIFA World Cup. 

Rather than tracking on-pitch statistics, this platform acts as a live thermometer for the internet's "vibe." By leveraging automated social media scraping and natural language processing (NLP), the application translates chaotic fan opinions into clean, quantitative sentiment scores ranging from `-1.0` (Maximum Hate) to `+1.0` (Absolute Love).

## Key Features
*   **Real-Time Sentiment Dashboard:** Instantly highlights the current public favorite and the team under the highest online scrutiny.
*   **Historical Trends Comparison:** Interactive line charts allowing users to plot and compare the emotional momentum of up to three teams simultaneously.
*   **Live Fan Feed:** Displays a random sample of safe, profanity-filtered fan reactions that are driving a team's current score.
*   **System-Aware Theming:** Fully integrated Light/Dark mode utilizing Tailwind CSS.

## Architecture & How It Works
The project relies on a precisely orchestrated microservices architecture, built to scale efficiently while staying within free-tier limits.

1.  **Data Ingestion:** A headless Python script (`scrape-sentiment.py`) handles API rate limits and server cold starts via exponential backoff. It queries TwitterAPI.io using dynamic search terms and blacklist filters to pull unique fan reactions.
2.  **NLP Inference:** The raw text is passed to the Hugging Face Inference API using the multilingual `cardiffnlp/twitter-xlm-roberta-base-sentiment` model to accurately classify text into positive, neutral, or negative categories.
3.  **Data Processing & Storage:** A split-stream logic flow scores the raw text for AI accuracy, but runs a strict `better_profanity` filter before archiving the safe text to a highly-indexed Supabase PostgreSQL database. A pruning function automatically deletes tweets older than 48 hours to optimize storage.
4.  **Hybrid Caching Strategy:** A GitHub Actions workflow manages the execution of the Python pipeline. Upon a successful run, it triggers a secure Next.js webhook (`/api/revalidate`) to clear the edge cache. This guarantees lightning-fast static page loads for users with zero unnecessary database hits.

## Tech Stack
### Frontend
*   **Framework:** Next.js 15 (App Router)
*   **Styling:** Tailwind CSS
*   **Data Visualization:** Recharts
*   **Assets:** FlagCDN (Lightweight SVG/PNG routing)

### Backend & MLOps
*   **Database:** Supabase (PostgreSQL + Row Level Security)
*   **Data Pipeline:** Python 3.11
*   **Machine Learning:** Hugging Face Inference API
*   **CI/CD Automation:** GitHub Actions
*   **Deployment:** Vercel

---

## Local Setup & Installation

### Prerequisites
*   Node.js (v18+)
*   Python (3.11+)
*   A Supabase Project
*   TwitterAPI.io & Hugging Face API keys

### 1. Clone the repository
\`\`\`bash
git clone https://github.com/yourusername/wc26-sentiment.git
cd wc26-sentiment
\`\`\`

### 2. Install Frontend Dependencies
\`\`\`bash
npm install
\`\`\`

### 3. Install Python Dependencies
\`\`\`bash
pip install -r requirements.txt
\`\`\`

### 4. Environment Variables
Create a `.env.local` file in the root directory and add your keys:
\`\`\`env
# Next.js / Supabase Variables
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# MLOps Pipeline Variables (Required for the Python script)
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
TWITTER_API_KEY=your_twitterapi_io_key
HUGGINGFACE_API_KEY=your_huggingface_read_token

# Cache Revalidation Secret
REVALIDATION_SECRET=your_secure_random_string
\`\`\`

### 5. Run the Application locally
Start the Next.js development server:
\`\`\`bash
npm run dev
\`\`\`

To manually test the MLOps pipeline and populate your local database:
\`\`\`bash
python scripts/scrape-sentiment.py
\`\`\`
