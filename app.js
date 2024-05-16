// Assuming Firebase and Firestore are correctly configured and imported in another module
import { db } from './firebaseConfig.js';
import { collection, addDoc, getDocs, query, doc, updateDoc, orderBy } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const betsPerPage = 10; // Number of bets to display per page
let currentPage = 1; // Current page number

async function addBet() {
    const betName = document.getElementById('betName').value;
    const betAmount = document.getElementById('betAmount').value;
    const betOdds = document.getElementById('betOdds').value;
    const betDate = document.getElementById('betDate').value; // Get the date/time input value

    // Validate input fields
    if (betName.trim() === '' || betOdds.trim() === '' || betDate.trim() === '') {
        alert('Please fill out all fields');
        return;
    }

    const parsedAmount = parseFloat(betAmount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
        alert('Please enter a valid bet amount');
        return;
    }

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
        alert('Error adding bet: ' + error.message);
    }
}

async function displayBets() {
    const betsQuery = query(collection(db, "bets"), orderBy("date", "asc"));
    const querySnapshot = await getDocs(betsQuery);
    const betsTable = document.getElementById('betsTable').getElementsByTagName('tbody')[0];
    betsTable.innerHTML = ''; // Clear current bets
    let totalStaked = 0;
    let totalReturned = 0;

    const startIndex = (currentPage - 1) * betsPerPage;
    const endIndex = startIndex + betsPerPage;

    querySnapshot.forEach((doc, index) => {
           console.log("Document data:", doc.data()); // Add this line
        if (index >= startIndex && index < endIndex) {
            const bet = doc.data();
            const row = betsTable.insertRow();

            row.insertCell().textContent = bet.name;
            row.insertCell().textContent = `$${parseFloat(bet.amount).toFixed(2)}`;
            row.insertCell().textContent = bet.odds;
            row.insertCell().textContent = bet.date; // Display the date/time
            row.insertCell().textContent = bet.outcome;
            row.insertCell().textContent = `$${parseFloat(bet.returns).toFixed(2)}`;
    
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
        }
    });

    // Update sidebar summary
    document.getElementById('totalStaked').textContent = `Total Staked: $${totalStaked.toFixed(2)}`;
    document.getElementById('totalReturned').textContent = `Total Returned: $${totalReturned.toFixed(2)}`;
    document.getElementById('profitLoss').textContent = `Profit/Loss: $${(totalReturned - totalStaked).toFixed(2)}`;

    // Update pagination controls
    updatePaginationControls(querySnapshot.size);
}

function updatePaginationControls(totalBets) {
    const totalPages = Math.ceil(totalBets / betsPerPage);
    const paginationContainer = document.getElementById('paginationContainer');
    paginationContainer.innerHTML = ''; // Clear existing pagination controls

    for (let i = 1; i <= totalPages; i++) {
        const pageButton = document.createElement('button');
        pageButton.textContent = i;
        pageButton.onclick = () => {
            currentPage = i;
            displayBets();
        };
        paginationContainer.appendChild(pageButton);
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    const addBetButton = document.getElementById('addBetButton');
    if (addBetButton) {
        addBetButton.addEventListener('click', addBet);
    }
    await displayBets();
});

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

document.addEventListener('DOMContentLoaded', async () => {
    const addBetButton = document.getElementById('addBetButton');
    if (addBetButton) {
        addBetButton.addEventListener('click', addBet);
    }
    await displayBets();
});
