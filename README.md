# QueueTrackrweb
Smart, Real-time Queue Management

# QueueTrackr Web App

**QueueTrackr** is a smart, real-time queue management system built for universities. It allows admin staff to manage queues digitally while students join and track their position seamlessly — eliminating physical waiting lines.

---

## 🚀 Features

### 🛠️ Admin
- Create named queues with unique codes (e.g., `Q3847`)
- View active queues with real-time updates
- See current user being served
- View list of users in a queue (name and number)
- Dismiss the currently served user to move to the next
- End any active queue
- Fully responsive dashboard for mobile & desktop

### 🎓 Student
- Join a queue using a queue ID
- View position in queue
- See the person currently being served (name & number)
- View all users in queue with names
- Leave a queue at any time
- Real-time updates with Firestore `onSnapshot`

---

## 📸 Screenshots

> Add screenshots of Admin Dashboard and Student View here if needed.

---

## 🧰 Tech Stack

- **Frontend:** React, CSS
- **Authentication:** Firebase Auth
- **Database:** Firebase Firestore
- **Hosting:** Vite Dev Server (or Firebase Hosting optional)
- **Realtime Sync:** Firestore `onSnapshot`
- **Image Assets:** Custom-designed logos and spinner

---

## 🧑‍💻 Installation & Setup

```bash
# 1. Clone the repository
git clone https://github.com/yourusername/queuetrackr-web.git

# 2. Navigate into the project
cd queuetrackr-web

# 3. Install dependencies
npm install

# 4. Run the development server
npm run dev
```

### 🔐 Firebase Setup
1. Create a project at [Firebase Console](https://console.firebase.google.com)
2. Enable **Authentication** (Email/Password)
3. Set up **Firestore** database in test mode
4. Replace Firebase config values in `/src/firebase.js`

```js
const firebaseConfig = {
  apiKey: 'YOUR_KEY',
  authDomain: 'YOUR_DOMAIN',
  projectId: 'YOUR_PROJECT_ID',
  ...
};
```

---

## 📁 Project Structure

```bash
src/
├── assets/               # Logo and spinner
├── components/           # Shared UI components like Loader
├── context/              # AuthContext with user state
├── pages/                # Welcome, Login, Signup, Dashboards
├── firebase.js           # Firebase config/init
└── App.jsx               # Main routing and layout
```

---

## ✅ To Do / Coming Soon
- 🔒 Role-based route protection
- 📱 Push notifications (e.g., “You're next”)
- 📊 Queue analytics dashboard
- 📦 Firebase deployment

---

## 🙌 Contributions

Pull requests and suggestions are welcome!  
Please open an issue first to discuss your idea or enhancement.

---

## 📄 License

MIT License © 2025 Kamarudeen Abubakar (QueueTrackr)
