// Assuming Firebase and Firestore are correctly configured and imported in another module
import { db } from './firebaseConfig.js';
import { collection, addDoc, getDocs, query, doc, updateDoc, orderBy } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// Function to add a new bet
async function addBet() {
    const betName = document.getElementById('betName').value;
    const betAmount = document.getElementById('betAmount').value;
    const betOdds = document.getElementById('betOdds').value;
    const betDate = document.getElementById('betDate').value; // Get the date/time input value

    // Ensure amount is parsed as a float
    const parsedAmount = parseFloat(betAmount);

    if (!isNaN(parsedAmount)) {
        try {
            await addDoc(collection(db, "bets"), {
                name: betName,
                amount: parsedAmount, // Store as a float
                odds: betOdds,
                date: betDate, // Store date/time
                outcome: "Pending",
                returns: 0
            });
            alert('Bet added successfully!');
            displayBets(); // Refresh the list of bets
        } catch (error) {
            console.error('Error adding bet: ', error);
            alert('Error adding bet');
        }
    } else {
        alert('Please enter a valid amount');
    }
}

// Function to display bets in a table
async function displayBets() {
    const betsQuery = query(collection(db, "bets"), orderBy("date", "asc"));
    const querySnapshot = await getDocs(betsQuery);
    const betsTable = document.getElementById('betsTable').getElementsByTagName('tbody')[0];
    betsTable.innerHTML = '';

    querySnapshot.forEach((doc) => {
        const bet = doc.data();
        const row = betsTable.insertRow();
        row.setAttribute('id', `row-${doc.id}`);
        row.setAttribute('data-editable', false); // New attribute to track edit state

        if (row.getAttribute('data-editable') === 'true') {
            // If in edit mode, display input fields
            row.insertCell().innerHTML = `<input type="text" id="name-${doc.id}" value="${bet.name}">`;
            row.insertCell().innerHTML = `<input type="number" id="amount-${doc.id}" value="${bet.amount.toFixed(2)}">`;
            row.insertCell().innerHTML = `<input type="text" id="odds-${doc.id}" value="${bet.odds}">`;
            row.insertCell().innerHTML = `<input type="date" id="date-${doc.id}" value="${bet.date}">`;
            row.insertCell().innerHTML = `<button onclick="saveUpdatedBet('${doc.id}')">Save</button>`;
        } else {
            // Display regular text
            row.insertCell().textContent = bet.name;
            row.insertCell().textContent = `$${parseFloat(bet.amount).toFixed(2)}`;
            row.insertCell().textContent = bet.odds;
            row.insertCell().textContent = bet.date;

            // Add edit button
            const editButtonCell = row.insertCell();
            const editButton = document.createElement('button');
            editButton.textContent = 'Edit';
            editButton.onclick = () => toggleEditMode(doc.id);
            editButtonCell.appendChild(editButton);
        }
    });
}


    // Update sidebar summary
    document.getElementById('totalStaked').textContent = `Total Staked: $${totalStaked.toFixed(2)}`;
    document.getElementById('totalReturned').textContent = `Total Returned: $${totalReturned.toFixed(2)}`;
    document.getElementById('profitLoss').textContent = `Profit/Loss: $${(totalReturned - totalStaked).toFixed(2)}`;
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
        displayBets(); // Refresh the list to reflect changes

        // Optionally, disable fields immediately to show the bet is settled
        outcomeSelect.disabled = true;
        returnInput.disabled = true;
        saveButton.style.display = 'none'; // Hide the save button as it's no longer needed
    } catch (error) {
        console.error('Error updating bet: ', error);
        alert('Error updating bet');
    }
}

// Function to toggle edit mode
function toggleEditMode(docId) {
    const row = document.getElementById(`row-${docId}`);
    const isEditable = row.getAttribute('data-editable') === 'true';
    row.setAttribute('data-editable', !isEditable);
    displayBets();  // Redraw the bets to reflect edit mode state
}

// Function to save the updated bet
async function saveUpdatedBet(docId) {
    const betName = document.getElementById(`name-${docId}`).value;
    const betAmount = parseFloat(document.getElementById(`amount-${docId}`).value);
    const betOdds = document.getElementById(`odds-${docId}`).value;
    const betDate = document.getElementById(`date-${docId}`).value;

    const betRef = doc(db, "bets", docId);
    try {
        await updateDoc(betRef, {
            name: betName,
            amount: betAmount,
            odds: betOdds,
            date: betDate
        });
        toggleEditMode(docId);  // Turn off edit mode after saving
        alert('Bet updated successfully!');
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
