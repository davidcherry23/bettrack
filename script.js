// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAaVOmHDYkG1qHxI6QpFpgM-B3MAQXY-2U",
  authDomain: "bettrack-88281.firebaseapp.com",
  projectId: "bettrack-88281",
  storageBucket: "bettrack-88281.appspot.com",
  messagingSenderId: "674702146250",
  appId: "1:674702146250:web:5aec6047588594e163d233",
  measurementId: "G-SKEKMK613Z"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize Firestore
const db = firebase.firestore();

function addSampleBet() {
    db.collection("bets").add({
        name: "Test Bet",
        amount: 100
    })
    .then(docRef => {
        alert("Document written with ID: " + docRef.id);
    })
    .catch(error => {
        console.error("Error adding document: ", error);
    });
}
