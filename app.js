// Import the necessary functions from the Firebase SDKs
import { db } from './firebaseConfig.js';
import { collection, addDoc, getDocs, query, doc, updateDoc, orderBy, deleteDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// Function to add a new bet
async function addBet() {
    // Get values from input fields
    const betName = document.getElementById('betName').value;
    const betAmount = document.getElementById('betAmount').value;
    const betOdds = document.getElementById('betOdds').value;
    const betDate = document.getElementById('betDate').value;

    // Validate input fields
    if (betName.trim() === '') {
        alert('Please enter a bet name');
        return;
    }

    const parsedAmount = parseFloat(betAmount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
        alert('Please enter a valid bet amount');
        return;
    }

    if (betOdds.trim() === '') {
        alert('Please enter the odds');
        return;
    }

    if (betDate.trim() === '') {
        alert('Please select a date and time');
        return;
    }

    try {
        // Add the bet to Firestore
        await addDoc(collection(db, "bets"), {
            name: betName,
            amount: parsedAmount,
            odds: betOdds,
            date: betDate,
            outcome: "Pending",
            returns: 0
        });
        alert('Bet added successfully!');
        displayBets(); // Refresh the list of bets
    } catch (error) {
        console.error('Error adding bet: ', error);
        alert('Error adding bet: ' + error.message);
    }
}

// Function to display bets
async function displayBets(pageNumber = 1, pageSize = 10) {
    const startIndex = (pageNumber - 1) * pageSize;
    const endIndex = pageNumber * pageSize;

    // Query bets ordered by date
    const betsQuery = query(collection(db, "bets"), orderBy("date", "asc"));
    const querySnapshot = await getDocs(betsQuery);
    const betsTable = document.getElementById('betsTable').getElementsByTagName('tbody')[0];
    betsTable.innerHTML = ''; // Clear current bets
    let totalStaked = 0;
    let totalReturned = 0;

    querySnapshot.forEach((doc, index) => {
        if (index >= startIndex && index < endIndex) {
            const bet = doc.data();
            const row = betsTable.insertRow();

            // Display bet details in table cells
            row.insertCell().textContent = bet.name;
            row.insertCell().textContent = `$${parseFloat(bet.amount).toFixed(2)}`;
            row.insertCell().textContent = bet.odds;
            row.insertCell().textContent = new Date(bet.date).toLocaleString(); // Display the date/time
            row.insertCell().textContent = bet.outcome;
            row.insertCell().textContent = `$${parseFloat(bet.returns).toFixed(2)}`;

            const actionsCell = row.insertCell();
            if (bet.outcome === 'Pending') {
                // Create dropdown for outcome selection
                const outcomeSelect = document.createElement('select');
                ['Won', 'Placed', 'Lost', 'Pending'].forEach(outcome => {
                    const option = document.createElement('option');
                    option.value = outcome;
                    option.textContent = outcome;
                    option.selected = outcome === bet.outcome;
                    outcomeSelect.appendChild(option);
                });
                actionsCell.appendChild(outcomeSelect);

                // Create input field for returns
                const returnInput = document.createElement('input');
                returnInput.type = 'number';
                returnInput.value = bet.returns;
                actionsCell.appendChild(returnInput);

                // Create save button to update bet
                const saveButton = document.createElement('button');
                saveButton.textContent = 'Save Changes';
                saveButton.onclick = () => saveBetChanges(doc.id, outcomeSelect.value, returnInput.value, outcomeSelect, returnInput, saveButton);
                actionsCell.appendChild(saveButton);
            }

            // Create delete button for each bet
            const deleteButton = document.createElement('button');
            deleteButton.textContent = 'Delete';
            deleteButton.onclick = () => deleteBet(doc.id);
            actionsCell.appendChild(deleteButton);

            // Calculate total staked and returned
            totalStaked += parseFloat(bet.amount);
            totalReturned += parseFloat(bet.returns);
        }
    });

    // Update sidebar summary
    document.getElementById('totalStaked').textContent = `Total Staked: $${totalStaked.toFixed(2)}`;
    document.getElementById('totalReturned').textContent = `Total Returned: $${totalReturned.toFixed(2)}`;
    document.getElementById('profitLoss').textContent = `Profit/Loss: $${(totalReturned - totalStaked).toFixed(2)}`;

    // Add pagination controls
    const paginationContainer = document.getElementById('paginationContainer');
    paginationContainer.innerHTML = ''; // Clear previous pagination controls

    const totalPages = Math.ceil(querySnapshot.size / pageSize);
    for (let i = 1; i <= totalPages; i++) {
        const pageNumberButton = document.createElement('button');
        pageNumberButton.textContent = i;
        pageNumberButton.onclick = () => displayBets(i, pageSize);
        paginationContainer.appendChild(pageNumberButton);
    }
}

// Function to save bet changes
async function saveBetChanges(betId, outcome, returns, outcomeSelect, returnInput, saveButton) {
    const betRef = doc(db, "bets", betId);
    try {
        await updateDoc(betRef, {
            outcome: outcome,
            returns: parseFloat(returns)
        });
        alert('Bet updated successfully!');
        displayBets(); // Refresh the list to reflect changes

        // Disable fields immediately to indicate that the bet is settled
        outcomeSelect.disabled = true;
        returnInput.disabled = true;
        saveButton.style.display = 'none'; // Hide the save button
    } catch (error) {
        console.error('Error updating bet: ', error);
        alert('Error updating bet: ' + error.message);
    }
}

// Function to delete a bet
async function deleteBet(betId) {
    if (confirm("Are you sure you want to delete this bet?")) {
        try {
            await deleteDoc(doc(db, "bets", betId));
            alert('Bet deleted successfully!');
            displayBets(); // Refresh the list of bets
        } catch (error) {
            console.error('Error deleting bet: ', error);
            alert('Error deleting bet: ' + error.message);
        }
    }
}

// Event listener to add bet when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const addBetButton = document.getElementById('addBetButton');
    if (addBetButton) {
        addBetButton.addEventListener('click', addBet);
    }
    displayBets(); // Display existing bets
});
