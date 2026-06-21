// Firebase SDK Initialization (Compat Mode for multi-page Vanilla JS apps)
// Add scripts in HTML headers before utilizing this configuration:
// - https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js
// - https://www.gstatic.com/firebasejs/10.8.0/firebase-auth-compat.js
// - https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore-compat.js
// - https://www.gstatic.com/firebasejs/10.8.0/firebase-storage-compat.js

// TODO: Replace with your actual Firebase project configuration
const firebaseConfig = {
   apiKey: "AIzaSyAAbsTio8-D1EFq9Fm19XtfQfcXLOvg2SE",
  authDomain: "resumebuider-e5b61.firebaseapp.com",
  projectId: "resumebuider-e5b61",
  storageBucket: "resumebuider-e5b61.firebasestorage.app",
  messagingSenderId: "787478663952",
  appId: "1:787478663952:web:342c6162265e11067f0b95"
};

// Initialize Firebase if not already initialized
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

// Global service shortcuts
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

// Configure Google Auth Provider
const googleProvider = new firebase.auth.GoogleAuthProvider();

// Local Storage Session fallback keys (in case Firebase is not configured yet)
const LOCAL_STORAGE_USER_KEY = 'resume_builder_local_user';
const LOCAL_STORAGE_RESUMES_KEY = 'resume_builder_local_resumes';

// Helper to determine if Firebase is fully configured with actual keys
function isFirebaseConfigured() {
    return firebaseConfig.apiKey !== "YOUR_API_KEY_HERE";
}

// Fallback user auth implementation if Firebase is not yet configured (ensures demo mode works immediately)
const FallbackAuth = {
    currentUser: null,
    
    onAuthStateChanged: function(callback) {
        // Look up local storage
        const localUserJson = localStorage.getItem(LOCAL_STORAGE_USER_KEY);
        if (localUserJson) {
            this.currentUser = JSON.parse(localUserJson);
        } else {
            this.currentUser = null;
        }
        
        // Return unsubscribe function
        setTimeout(() => callback(this.currentUser), 100);
        return () => {};
    },
    
    signInWithEmailAndPassword: async function(email, password) {
        if (email && password) {
            const user = { uid: 'local-demo-user', email: email, displayName: email.split('@')[0] };
            localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(user));
            this.currentUser = user;
            return { user };
        }
        throw new Error("Invalid credentials");
    },
    
    createUserWithEmailAndPassword: async function(email, password) {
        if (email && password) {
            const user = { uid: 'local-demo-user', email: email, displayName: email.split('@')[0] };
            localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(user));
            this.currentUser = user;
            return { user };
        }
        throw new Error("Could not create account");
    },
    
    signInWithPopup: async function(provider) {
        const user = { uid: 'local-demo-user', email: 'demo@google.com', displayName: 'Demo Google User' };
        localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(user));
        this.currentUser = user;
        return { user };
    },
    
    signOut: async function() {
        localStorage.removeItem(LOCAL_STORAGE_USER_KEY);
        this.currentUser = null;
    },
    
    sendPasswordResetEmail: async function(email) {
        return true;
    }
};

// Fallback Firestore database implementation (Demo mode data mock)
const FallbackDB = {
    collection: function(colName) {
        return {
            doc: (docId) => {
                return {
                    get: async () => {
                        const all = JSON.parse(localStorage.getItem(LOCAL_STORAGE_RESUMES_KEY) || '[]');
                        const found = all.find(r => r.resumeId === docId);
                        return {
                            exists: !!found,
                            data: () => found
                        };
                    },
                    set: async (data, options) => {
                        let all = JSON.parse(localStorage.getItem(LOCAL_STORAGE_RESUMES_KEY) || '[]');
                        const index = all.findIndex(r => r.resumeId === docId);
                        
                        let updated = { ...data };
                        if (index !== -1) {
                            if (options && options.merge) {
                                updated = { ...all[index], ...data };
                            }
                            all[index] = updated;
                        } else {
                            all.push(updated);
                        }
                        localStorage.setItem(LOCAL_STORAGE_RESUMES_KEY, JSON.stringify(all));
                        return true;
                    },
                    update: async (data) => {
                        let all = JSON.parse(localStorage.getItem(LOCAL_STORAGE_RESUMES_KEY) || '[]');
                        const index = all.findIndex(r => r.resumeId === docId);
                        if (index !== -1) {
                            all[index] = { ...all[index], ...data };
                            localStorage.setItem(LOCAL_STORAGE_RESUMES_KEY, JSON.stringify(all));
                            return true;
                        }
                        throw new Error("Document not found");
                    },
                    delete: async () => {
                        let all = JSON.parse(localStorage.getItem(LOCAL_STORAGE_RESUMES_KEY) || '[]');
                        all = all.filter(r => r.resumeId !== docId);
                        localStorage.setItem(LOCAL_STORAGE_RESUMES_KEY, JSON.stringify(all));
                        return true;
                    }
                };
            },
            where: (field, operator, value) => {
                return {
                    get: async () => {
                        const all = JSON.parse(localStorage.getItem(LOCAL_STORAGE_RESUMES_KEY) || '[]');
                        const filtered = all.filter(r => r[field] === value);
                        return {
                            empty: filtered.length === 0,
                            docs: filtered.map(item => ({
                                id: item.resumeId,
                                data: () => item
                            }))
                        };
                    }
                };
            }
        };
    }
};

// Select operations mode dynamically (Firebase vs Demo Mock)
const activeAuth = isFirebaseConfigured() ? auth : FallbackAuth;
const activeDb = isFirebaseConfigured() ? db : FallbackDB;

console.log(
    isFirebaseConfigured() 
    ? "Firebase is loaded and configured." 
    : "Firebase is in DEMO/Local Storage fallback mode. To connect to Firebase, update frontend/js/firebase-config.js credentials."
);
