// Assuming Firebase and Firestore are correctly configured and imported in another module
import { db } from './firebaseConfig.js';
import { collection, addDoc, getDocs, query, doc, updateDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// Function to add a bet
async function addBet() {
    const betName = document.getElementById('betName').value;
    const betAmount = document.getElementById('betAmount').value;
    const betOdds = document.getElementById('betOdds').value;

    try {
        await addDoc(collection(db, "bets"), {
            name: betName,
            amount: parseInt(betAmount, 10),
            odds: betOdds,
            outcome: "Pending", // Default outcome when bet is added
            returns: 0 // Default return when bet is added
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
        const outcomeSelect = document.createElement('select');
        const returnInput = document.createElement('input');
        const saveButton = document.createElement('button');

        // Configure the outcome dropdown
        ['Won', 'Placed', 'Lost', 'Pending'].forEach(outcome => {
            const option = document.createElement('option');
            option.value = outcome;
            option.textContent = outcome;
            option.selected = outcome === bet.outcome;
            outcomeSelect.appendChild(option);
        });

        // Configure the return input
        returnInput.type = 'number';
        returnInput.value = bet.returns;
        returnInput.placeholder = 'Enter Returns';

        // Configure the save button
        saveButton.textContent = 'Save Changes';
        saveButton.onclick = () => saveBetChanges(doc.id, outcomeSelect.value, returnInput.value, outcomeSelect, returnInput, saveButton);

        // Append elements to bet item
        betItem.textContent = `Bet: ${bet.name}, Amount: $${bet.amount}, Odds: ${bet.odds}, `;
        betItem.appendChild(outcomeSelect);
        betItem.appendChild(returnInput);
        
        if (bet.outcome !== 'Pending') {
            outcomeSelect.disabled = true;
            returnInput.disabled = true;
            saveButton.style.display = 'none';
        } else {
            betItem.appendChild(saveButton);
        }

        betsList.appendChild(betItem);
    });
}

// Function to save changes to a bet
async function saveBetChanges(betId, outcome, returns, outcomeSelect, returnInput, saveButton) {
    const betRef = doc(db, "bets", betId);
    try {
        await updateDoc(betRef, {
            outcome: outcome,
            returns: parseFloat(returns)
        });
        alert('Bet updated successfully!');
        displayBets(); // Optionally disable fields immediately without waiting for refresh

        outcomeSelect.disabled = true;
        returnInput.disabled = true;
        saveButton.style.display = 'none';  // Hide the save button as it's no longer needed
    } catch (error) {
        console.error('Error updating bet: ', error);
        alert('Error updating bet');
    }
}

// Event listener to load existing bets and set up the application
document.addEventListener('DOMContentLoaded', () => {
    const addBetButton = document.getElementById('addBetButton');
    if (addBetButton) {
        addBetButton.addEventListener('click', addBet);
    }
    displayBets();
});
