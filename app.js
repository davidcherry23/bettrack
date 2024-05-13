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
            dateTime: betDateTime
        });
        alert('Bet added successfully!');
        displayBets();
    } catch (error) {
        console.error('Error adding bet: ', error);
        alert('Error adding bet');
    }
}

async function displayBets() {
    const betsQuery = query(collection(db, "bets"));
    const querySnapshot = await getDocs(betsQuery);
    const betsTable = document.getElementById('betsTable').getElementsByTagName('tbody')[0];
    betsTable.innerHTML = '';
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

        const dateCell = row.insertCell();
        const betDate = bet.dateTime.toDate(); // Convert Firestore Timestamp to JavaScript Date object
        dateCell.textContent = betDate.toLocaleString();

        const actionsCell = row.insertCell();
        if (bet.outcome === 'Pending') {
            // Add interaction elements here (select, input, button)
        }

        totalStaked += parseFloat(bet.amount);
        totalReturned += parseFloat(bet.returns);
    });

    document.getElementById('totalStaked').textContent = `Total Staked: $${totalStaked.toFixed(2)}`;
    document.getElementById('totalReturned').textContent = `Total Returned: $${totalReturned.toFixed(2)}`;
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
        displayBets(); // Refresh list
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
