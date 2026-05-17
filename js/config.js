// =============================================
// Firebase Configuration
// =============================================
// HOW TO SET UP:
// 1. Go to https://console.firebase.google.com/
// 2. Create a new project (e.g., "bolao-copa-2026")
// 3. Add a Web App (click </> icon)
// 4. Copy your firebaseConfig values below
// 5. Enable Authentication → Email/Password + Google
// 6. Enable Firestore Database (start in test mode)
// 7. Enable Hosting (optional, for deployment)
// =============================================

const firebaseConfig = {
  apiKey: "AIzaSyDNYcGYZq_ahF-YjUDT2dthes3z0buQbVk",
  authDomain: "pitacopa-a2cea.firebaseapp.com",
  projectId: "pitacopa-a2cea",
  storageBucket: "pitacopa-a2cea.firebasestorage.app",
  messagingSenderId: "870796412485",
  appId: "1:870796412485:web:92310fd26612530711452c",
  measurementId: "G-H952ZC3WWR"
};

// Initialize Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-analytics.js";

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
export const analytics = getAnalytics(app);

// =============================================
// football-data.org API Key
// =============================================
// 1. Register free at https://www.football-data.org/client/register
// 2. Copy your API token below (free tier includes FIFA World Cup)
// =============================================
export const FOOTBALL_DATA_API_KEY = '0f07e2f1cb3947d18390f4601aa0a912';  // ← paste your key here

// =============================================
// Firestore Data Structure Reference:
//
// users/{uid}
//   name: string
//   email: string
//   photoURL: string
//   lang: 'pt' | 'en'
//   createdAt: timestamp
//
// boloes/{bolaoId}
//   name: string
//   description: string
//   createdBy: uid
//   createdByName: string
//   inviteCode: string (6 chars)
//   deadline: timestamp
//   createdAt: timestamp
//   participantCount: number
//
// boloes/{bolaoId}/participants/{uid}
//   name: string
//   photoURL: string
//   joinedAt: timestamp
//   points: number
//   exactScores: number
//   correctResults: number
//
// boloes/{bolaoId}/predictions/{uid}
//   champion: string (team name)
//   runnerUp: string
//   topScorer: string
//   games: { [gameId]: { home: number, away: number } }
//   updatedAt: timestamp
//
// results/{gameId}  (admin only)
//   home: number
//   away: number
//   confirmed: boolean
// =============================================
