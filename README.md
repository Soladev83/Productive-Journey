# 🚀 Productive Journey

A premium, highly polished MERN stack productivity dashboard featuring a **Weekly Planner**, **Daily Checklist with Real-Time SVG Progress Ring**, **Key Learnings Reflections Journal**, and an **Analytics Dashboard** complete with a custom SVG historical line chart.

Designed with an aesthetic, glowing **glassmorphic dark theme** (custom HSL tokens) and powered by a **Zero-Config database connection system** (connects to MongoDB or falls back instantly to local JSON storage if offline).

---

## 📸 Preview Screenshot

Here is the premium user interface displaying your daily reflection log and sidebar tabs in action:

```
+-----------------------------------------------------------------------------+
|  🌌 Journey        |  Good Evening, Dawit!                                   |
|  ----------------- |  Organize today's list, check your scores, and journal  |
|  [D] Dashboard     |                                                         |
|  [W] Daily Work    |  +---------------------------+  +--------------------+  |
|  [P] Weekly Plan   |  | Today's Action Objectives |  | Productivity Matrix|  |
|                    |  | [x] Plan MERN goals       |  |     /---------\    |  |
|  ----------------- |  | [x] Build Express backend |  |    /     67%   \   |  |
|  User: Dawit pc    |  | [ ] Design CSS frontend   |  |    \  Productive /   |  |
|  [D] Local DB OK   |  +---------------------------+  +--------------------+  |
|                    |                                                         |
|                    |  +---------------------------------------------------+  |
|                    |  | Reflections & Key Learnings Journal               |  |
|                    |  | "Completed major development steps today. The     |  |
|                    |  |  custom dual-mode database worked flawlessly!"    |  |
|                    |  +---------------------------------------------------+  |
+-----------------------------------------------------------------------------+
```

---

## ✨ Features

- 📅 **Weekly Focus Planner**: Interactive scheduler boards grouped by days of the week plus a "Weekly Priorities" board. Supports task creation, deletion, completion, and customizable tags (**Work**, **Personal**, **Health**, **Learning**) with glowing category tags.
- 📋 **Daily Workspace Checklist**: Action checklists with physical check-off animations, dynamic productivity score recalculations, and clean target additions.
- 🔄 **Productivity Progress Ring**: A glowing SVG circular progress bar that maps today's productivity index (0% - 100%) in real-time, accompanied by motivational feedback.
- 📝 **Evening Reflections & Learnings Journal**: Beautifully formatted, date-associated logs allowing you to reflect on your day and explicitly document "what you learned" to compound your growth over time.
- 📈 **Stats Dashboard & Trends**: A centralized analytics dashboard compiling overall averages, completed items, missed targets, a scrollable chronological diary timeline, and a custom-drawn **SVG line chart mapping your last 14 days of productivity**.
- 🚀 **Zero-Config Database Fallback**: A custom database connector that attempts to hook into MongoDB but gracefully fails over to a local file database (`backend/data/db.json`) if offline. **The application boots and remains fully functional instantly without any database setup.**

---

## 🛠️ Tech Stack

- **Frontend**: React.js (Bootstrapped with Vite), Lucide Icons, Google Fonts (`Outfit` & `Plus Jakarta Sans`).
- **Backend**: Node.js, Express.js, Cors, Dotenv.
- **Database (Dual-Mode)**: MongoDB & Mongoose ORM, with local JSON file-system storage fallback.
- **Styling**: Vanilla CSS utilizing custom HSL design variables (Glassmorphism, backdrop filters, and custom glows). No Tailwind or bulky UI packages, maintaining pure stylesheet integrity.

---

## 🚀 Getting Started

To run this application locally, ensure you have [Node.js](https://nodejs.org/) installed (v20+ recommended).

### 1. Clone the repository
```bash
git clone https://github.com/your-username/productive-journey.git
cd productive-journey
```

### 2. Launch the Express Backend
Open a terminal in the project directory:
```bash
cd backend
npm install
npm run dev
```
The server will start on **[http://localhost:5000/](http://localhost:5000/)**. You will see terminal output declaring if it connected to MongoDB or successfully initialized the JSON Database fallback at `backend/data/db.json`.

#### 🔗 Customizing the MongoDB Connection (Optional)
To use a remote MongoDB instance or a custom local database, create a `.env` file in the `backend/` directory:
```env
PORT=5000
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/productive_journey
```

### 3. Launch the React Frontend
Open a second terminal window in the project root:
```bash
cd frontend
npm install
npm run dev
```
This will compile and launch the Vite development server on **[http://localhost:5173/](http://localhost:5173/)**. Open the link in your browser to start your productive journey!

---

## 🎨 HSL CSS Design Tokens

The sleek cosmic dark mode is configured in `frontend/src/index.css` using custom HSL properties:

```css
:root {
  --bg-dark: hsl(225, 24%, 6%);
  --bg-card: hsla(225, 24%, 12%, 0.45);
  --accent-purple: hsl(265, 85%, 64%); /* Cosmic Violet */
  --accent-teal: hsl(182, 85%, 46%);   /* Neon Teal */
  --accent-green: hsl(142, 76%, 45%);  /* Success Green */
  --accent-coral: hsl(12, 88%, 59%);   /* Coral Orange */
  
  --border-glass: 1px solid hsla(0, 0%, 100%, 0.07);
}
```

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
