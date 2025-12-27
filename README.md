# CDM Quote Pro

Professional loan quoting tool for Client Direct Mortgage loan officers.

## Features

- **Purchase/Refinance Quotes** - 3-option quote builder with rate/price/points structure
- **Home Equity** - HELOC and HELOAN calculators
- **Income Analysis** - W2, Self-Employment, S-Corp, Rental income calculators
- **ARM Products** - Full ARM support with Reg Z compliant APR calculations
- **Shareable Quotes** - Send quotes to borrowers with unique links
- **View Tracking** - Get notified when borrowers view their quotes
- **Mobile-Optimized** - Consumer view designed for mobile

## Tech Stack

- **Frontend**: React 18 + Vite
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth
- **Hosting**: Vercel (recommended)

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 3. Build for Production

```bash
npm run build
```

## Deploy to Vercel

### Option A: GitHub Integration (Recommended)

1. Push this project to a GitHub repository
2. Go to [vercel.com](https://vercel.com)
3. Click "Import Project"
4. Select your GitHub repo
5. Vercel auto-detects Vite config
6. Click "Deploy"

### Option B: Vercel CLI

```bash
npm install -g vercel
vercel login
vercel
```

## Environment Variables

For production, you may want to move Supabase credentials to environment variables:

Create a `.env` file:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Then update `src/supabaseClient.js`:
```javascript
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
```

Add these same variables in Vercel's project settings under "Environment Variables".

## Project Structure

```
cdm-quotepro/
├── index.html          # Entry HTML
├── package.json        # Dependencies
├── vite.config.js      # Vite configuration
├── src/
│   ├── main.jsx        # React entry point
│   ├── App.jsx         # Main router
│   ├── supabaseClient.js    # Database connection
│   ├── components/
│   │   ├── AuthComponent.jsx    # Login/Signup
│   │   └── ShareQuoteModal.jsx  # Share quote modal
│   └── pages/
│       ├── QuotePro.jsx         # Main LO tool
│       └── ConsumerQuoteView.jsx # Borrower view
```

## Routes

| Path | Description |
|------|-------------|
| `/` | Main app (requires login) |
| `/login` | Login page |
| `/q/:shareId` | Consumer quote view (public) |

## Database Schema

The app uses 4 main tables:

- **loan_officers** - LO profiles (email, name, NMLS, etc.)
- **quotes** - Saved quotes with shareable link IDs
- **quote_views** - Tracks when consumers view quotes
- **notifications** - Alerts for LOs

## Adding Loan Officers

### Option 1: Self-Registration
LOs can create accounts themselves at the login page.

### Option 2: Admin Creation
In Supabase Table Editor, insert into `loan_officers`:
```sql
INSERT INTO loan_officers (email, full_name, phone, nmls_number, title, is_active)
VALUES ('lo@cdmortgage.com', 'John Smith', '(555) 123-4567', '123456', 'Loan Officer', true);
```

The LO can then sign up with that same email.

## Custom Domain

To use a custom domain like `quotes.cdmortgage.com`:

1. In Vercel, go to your project settings
2. Click "Domains"
3. Add your domain
4. Update DNS records as instructed

## Support

For issues or feature requests, contact your administrator.

---

Built for Client Direct Mortgage © 2024
