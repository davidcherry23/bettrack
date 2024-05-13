// Assuming Firebase and Firestore are correctly configured and imported in another module
import { db } from './firebaseConfig.js';
import { collection, addDoc, getDocs, query } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// Function to add a bet
async function addBet() {
    const betName = document.getElementById('betName').value;
    const betAmount = document.getElementById('betAmount').value;

    try {
        await addDoc(collection(db, "bets"), {
            name: betName,
            amount: parseInt(betAmount, 10)
        });
        alert('Bet added successfully!');
        displayBets(); // Refresh the list of bets
    } catch (error) {
        console.error('Error adding bet: ', error);
        alert('Error adding bet');
    }
}

// Function to display bets
async function displayBets() {
    const betsQuery = query(collection(db, "bets"));
    const querySnapshot = await getDocs(betsQuery);
    const betsList = document.getElementById('betsList');
    betsList.innerHTML = ''; // Clear current bets

    querySnapshot.forEach((doc) => {
        const bet = doc.data();
        const betItem = document.createElement('li');
        betItem.textContent = `Bet: ${bet.name}, Amount: $${bet.amount}`;
        betsList.appendChild(betItem);
    });
}

// Setup event listeners and initial data display
document.addEventListener('DOMContentLoaded', () => {
    const addBetButton = document.getElementById('addBetButton');
    if (addBetButton) {
        addBetButton.addEventListener('click', addBet);
    }
    displayBets(); // Initial display of bets
});
