// Assuming Firebase App and Firestore are initialized in the index.html as shown

// You need to import Firestore if you use it
import { db } from './firebaseConfig.js';

document.addEventListener('DOMContentLoaded', () => {
    const addBetBtn = document.getElementById('addBetButton');
    if (addBetBtn) {
        addBetBtn.addEventListener('click', addSampleBet);
    }
});

function addSampleBet() {
    addDoc(collection(db, "bets"), {
        name: "Test Bet",
        amount: 100
    }).then(docRef => {
        console.log("Document written with ID: ", docRef.id);
        alert("Bet added successfully!");
    }).catch(error => {
        console.error("Error adding document: ", error);
        alert("Error adding bet: " + error);
    });
}
