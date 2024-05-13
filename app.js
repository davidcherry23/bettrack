// Assuming Firebase and Firestore are correctly configured and imported in another module
import { db } from './firebaseConfig.js';
import { collection, addDoc, getDocs, query, doc, updateDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

async function addBet() {
    const betName = document.getElementById('betName').value;
    const betAmount = document.getElementById('betAmount').value;
    const betOdds = document.getElementById('betOdds').value;
    const betDateTime = new Date(); // Current date and time

    try {
        await addDoc(collection(db, "bets"), {
            name: betName,
            amount: parseInt(betAmount, 10),
            odds: betOdds,
            outcome: "Pending",
            returns: 0,
            dateTime: betDateTime  // Store the date and time when the bet is placed
        });
        alert('Bet added successfully!');
        displayBets();  // Refresh the list of bets
    } catch (error) {
        console.error('Error adding bet: ', error);
        alert('Error adding bet');
    }
}

async function displayBets() {
    const betsQuery = query(collection(db, "bets"));
    const querySnapshot = await getDocs(betsQuery);
    const betsTable = document.getElementById('betsTable').getElementsByTagName('tbody')[0];
    betsTable.innerHTML = '';  // Clear current bets
    let totalStaked = 0;
    let totalReturned = 0;

    querySnapshot.forEach((doc) => {
        const bet = doc.data();
        const row = betsTable.insertRow();

        row.insertCell().textContent = bet.name;
        row.insertCell().textContent = `$${bet.amount}`;
        row.insertCell().textContent = bet.odds;
        row.insertCell().textContent = bet.outcome;
        row.insertCell().textContent = `$${bet.returns}`;

        // Format and display the date and time
        const dateCell = row.insertCell();
        const betDate = bet.dateTime.toDate();  // Convert Firestore Timestamp to JavaScript Date object
        dateCell.textContent = betDate.toLocaleString();

        // Action cell with interaction elements for 'Pending' bets
        const actionsCell = row.insertCell();
        if (bet.outcome === 'Pending') {
            const outcomeSelect = document.createElement('select');
            ['Won', 'Placed', 'Lost', 'Pending'].forEach(outcome => {
                const option = document.createElement('option');
                option.value = outcome;
                option.textContent = outcome;
                option.selected = outcome === bet.outcome;
                outcomeSelect.appendChild(option);
            });
            actionsCell.appendChild(outcomeSelect);

            const returnInput = document.createElement('input');
            returnInput.type = 'number';
            returnInput.value = bet.returns;
            actionsCell.appendChild(returnInput);

            const saveButton = document.createElement('button');
            saveButton.textContent = 'Save Changes';
            saveButton.onclick = () => saveBetChanges(doc.id, outcomeSelect.value, returnInput.value, outcomeSelect, returnInput, saveButton);
            actionsCell.appendChild(saveButton);
        }

        totalStaked += parseFloat(bet.amount);
        totalReturned += parseFloat(bet.returns);
    });

    // Update sidebar summary with new labels and values
    document.getElementById('totalStaked').textContent = `Stakes: $${totalStaked.toFixed(2)}`;
    document.getElementById('totalReturned').textContent = `Returns: $${totalReturned.toFixed(2)}`;
    document.getElementById('profitLoss').textContent = `Profit/Loss: $${(totalReturned - totalStaked).toFixed(2)}`;
}

async function saveBetChanges(betId, outcome, returns, outcomeSelect, returnInput, saveButton) {
    const betRef = doc(db, "bets", betId);
    try {
        await updateDoc(betRef, {
            outcome: outcome,
            returns: parseFloat(returns)
        });
        alert('Bet updated successfully!');
        displayBets();  // Refresh the list to reflect changes
    } catch (error) {
        console.error('Error updating bet: ', error);
        alert('Error updating bet');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const addBetButton = document.getElementById('addBetButton');
    if (addBetButton) {
        addBetButton.addEventListener('click', addBet);
    }
    displayBets();
});
