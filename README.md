# 🏢 SyndicPro - Premium Building Management Hub

SyndicPro is a modern, high-performance web application designed for property managers and syndics to manage residential buildings with precision. Built with a focus on visual excellence, **mobile-first responsiveness**, realtime data synchronization, and **multilingual support (Arabic/French/English)**.

![SyndicPro Dashboard](https://placehold.co/1200x600/6b66ff/ffffff?text=SyndicPro+Dashboard)

---

## ✨ Key Features

### 📊 Intelligent Dashboard
- **Yearly Progress Tracker**: Visualizes payment status for all units in a single view.
- **Financial Overview**: Real-time charts for income vs. expenses, collection rates, and balance summaries.
- **KPI Cards**: Instant access to critical metrics like total residents, pending payments, and active alerts.

### 📱 Premium Mobile Experience
- **Mobile-First Design**: Fully responsive layout optimized for all screen sizes (Desktop, Tablet, Mobile).
- **Touch-Friendly**: Enhanced tap targets, smooth slide-in navigation, and native-feeling forms.
- **Adaptive Layouts**: Smart content reflow ensures usability without compromising data density.

### 🏠 Apartment Management
- **Detailed Unit Profiles**: Track resident info, occupancy status (Owner/Tenant), and floor details.
- **Global Sorting**: Standardized "Floor then Number" sorting for logical unit organization.
- **Quick Actions**: Easy edit/update flows for resident data.

### 💸 Financial Engine
- **Automated Payments**: Instant generation of monthly records with optimistic UI updates.
- **Expense Ledger**: detailed tracking of building outflows with categorization and proof attachments.
- **Real-time Sync**: Updates reflect instantly across all connected devices via Supabase Realtime.

### 📄 Advanced Reporting
- **Multilingual PDF Exports**: Generate professional reports in **Arabic**, French, and English.
- **Smart Font Loading**: Dynamically loads the **Amiri** font to ensure perfect Arabic text rendering.
- **RTL Support**: Full Right-to-Left support for Arabic reports, including reversed table columns.

### 🔒 Enterprise-Grade Security
- **Role-Based Access Control (RBAC)**: secure hierarchy (Admin, Editor, Viewer).
- **Row-Level Security (RLS)**: Database-level protection ensuring users only access authorized data.

---

## 🛠️ Technology Stack

- **Frontend**: [React 19](https://react.dev/) + [Vite 7](https://vite.dev/)
- **Backend/Database**: [Supabase](https://supabase.com/) (PostgreSQL, Realtime, Auth)
- **Styling**: Vanilla CSS (Custom Premium Design System) with CSS Variables
- **Animations**: [Framer Motion](https://www.framer.com/motion/) for smooth UI transitions
- **Icons**: [Lucide React](https://lucide.dev/)
- **PDF Generation**: [jsPDF](https://github.com/parallax/jsPDF) + [jspdf-autotable](https://github.com/simonbengtsson/jspdf-autotable) + Remote Font Loading
- **Internationalization**: [react-i18next](https://react.i18next.com/) (En/Fr/Ar)

---

## 🚀 Getting Started

### 1. Clone & Install
```bash
# Clone the repository
git clone [your-repo-url]

# Install dependencies
npm install
```

### 2. Environment Setup
Create a `.env` file in the client root directory:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Database Initialization
Use the schema provided in `supabase_schema.sql` (or `supabase_schema_safe.sql`) to set up your Supabase project. This includes:
- Tables: `profiles`, `apartments`, `payments`, `expenses`, `settings`
- RLS Policies for security
- Triggers for automatic `updated_at` handling

### 4. Run Locally
```bash
npm run dev
```

---

## 👤 Roles & Permissions

| Role | Permissions |
| :--- | :--- |
| **Admin** | Full system access, User Management, Global Settings, Schema Changes |
| **Editor** | Manage Apartments, Track Payments, Record Expenses, Generate Reports |
| **Viewer** | Read-only access to Dashboard, Financials, and Reports |

---

## 📝 License
Proprietary - Developed for professional building management coordination.
