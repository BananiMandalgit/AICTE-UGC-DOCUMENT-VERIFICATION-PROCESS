import { initializeApp } from 'firebase/app'
import { getStorage } from 'firebase/storage'

// const firebaseConfig = {
//   apiKey: "AIzaSyDozBDixS2BJB1LihIwW-6lH_dJS6Ia8rw",
//   authDomain: "report-app-4f717.firebaseapp.com",
//   projectId: "report-app-4f717",
//   storageBucket: "report-app-4f717.firebasestorage.app",
//   messagingSenderId: "864886161868",
//   appId: "1:864886161868:web:0a1d6c8763c728a5e61d69",
//   measurementId: "G-XDLGX8KYGB"
// };

const app = initializeApp(firebaseConfig)
export const storage = getStorage(app)