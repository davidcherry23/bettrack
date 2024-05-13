import { db } from './firebaseConfig.js';
import { collection, addDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', () => {
    const addBetBtn = document.getElementById('addBetButton');
    if (addBetBtn) {
        addBetBtn.addEventListener('click', addSampleBet);
    }
});

async function addSampleBet() {
    try {
        const docRef = await addDoc(collection(db, "bets"), {
            name: "Test Bet",
            amount: 100
        });
        console.log("Document written with ID: ", docRef.id);
        alert("Bet added successfully!");
    } catch (error) {
        console.error("Error adding document: ", error);
        alert("Error adding bet: " + error);
    }
}
