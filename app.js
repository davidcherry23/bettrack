import { db } from './firebaseConfig.js';
import { collection, addDoc, getDocs, query, doc, updateDoc, orderBy, deleteDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// Function to add a new bet
async function addBet() {
    const betName = document.getElementById('betName').value;
    const betAmount = document.getElementById('betAmount').value;
    const betOdds = document.getElementById('betOdds').value;
    const betDate = document.getElementById('betDate').value;
    const betCourse = document.getElementById('betCourse').value; // Course selection

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
    if (betCourse.trim() === '') {
        alert('Please select a course');
        return;
    }

    try {
        await addDoc(collection(db, "bets"), {
            name: betName,
            amount: parsedAmount,
            odds: betOdds,
            date: betDate,
            course: betCourse, // Store course
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

// Function to format date and time
function formatDateTime(dateTime) {
    const date = new Date(dateTime);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${day}-${month}-${year} ${hours}:${minutes}`;
}

// Function to display bets and filter by name, date, or course
async function displayBets() {
    const betsQuery = query(collection(db, "bets"), orderBy("date", "desc"));
    const querySnapshot = await getDocs(betsQuery);
    const betsTable = document.getElementById('betsTable').getElementsByTagName('tbody')[0];
    const totalStakedElement = document.getElementById('totalStaked');
    const totalReturnedElement = document.getElementById('totalReturned');
    const profitLossElement = document.getElementById('profitLoss');
    const roiElement = document.getElementById('roi');
    const longestLosingStreakElement = document.getElementById('longestLosingStreak');
    const wonPlacedLostElement = document.getElementById('wonPlacedLost');
    const unsettledBetsElement = document.getElementById('unsettledBets');
    const searchInput = document.getElementById('searchInput').value.trim().toLowerCase();

    if (!betsTable || !totalStakedElement || !totalReturnedElement || !profitLossElement || !roiElement || !longestLosingStreakElement || !wonPlacedLostElement || !unsettledBetsElement) {
        console.error("One or more elements not found.");
        return;
    }

    betsTable.innerHTML = '';
    let totalStaked = 0;
    let totalReturned = 0;
    const bets = [];
    let wonCount = 0;
    let placedCount = 0;
    let lostCount = 0;
    let unsettledCount = 0;

    querySnapshot.forEach((doc) => {
        const bet = doc.data();
        const formattedDate = formatDateTime(bet.date).toLowerCase();
        const formattedCourse = bet.course.toLowerCase();

        if (searchInput.length === 0 || bet.name.toLowerCase().includes(searchInput) || formattedDate.includes(searchInput) || formattedCourse.includes(searchInput)) {
            bets.push(bet);
            const row = betsTable.insertRow();

            row.insertCell().textContent = bet.name;
            row.insertCell().textContent = `£${parseFloat(bet.amount).toFixed(2)}`;
            row.insertCell().textContent = bet.odds;
            row.insertCell().textContent = formatDateTime(bet.date);
            row.insertCell().textContent = bet.course; // Display course

            const outcomeCell = row.insertCell();
            outcomeCell.textContent = bet.outcome;
            switch (bet.outcome) {
                case 'Won':
                    outcomeCell.style.color = 'green';
                    break;
                case 'Lost':
                    outcomeCell.style.color = 'red';
                    break;
                case 'Placed':
                    outcomeCell.style.color = 'orange';
                    break;
                default:
            }

            row.insertCell().textContent = `£${parseFloat(bet.returns).toFixed(2)}`;

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

                const saveButton = document.createElement('button');
                saveButton.textContent = 'Save';
                saveButton.addEventListener('click', async () => {
                    const selectedOutcome = outcomeSelect.value;
                    let returns = 0;
                    if (selectedOutcome === 'Won') {
                        const odds = parseOdds(bet.odds);
                        returns = bet.amount * odds + bet.amount;
                    } else if (selectedOutcome === 'Placed') {
                        const odds = parseOdds(bet.odds);
                        returns = (bet.amount * odds + bet.amount) / 2;
                    }

                    await updateDoc(doc(db, "bets", doc.id), { outcome: selectedOutcome, returns });
                    displayBets(); // Refresh the list of bets
                });
                actionsCell.appendChild(saveButton);
            }

            totalStaked += parseFloat(bet.amount);
            totalReturned += parseFloat(bet.returns);
            if (bet.outcome === 'Won') {
                wonCount++;
            } else if (bet.outcome === 'Placed') {
                placedCount++;
            } else if (bet.outcome === 'Lost') {
                lostCount++;
            } else {
                unsettledCount++;
            }
        }
    });

    // Update summary
    totalStakedElement.textContent = `Total Staked: £${totalStaked.toFixed(2)}`;
    totalReturnedElement.textContent = `Total Returned: £${totalReturned.toFixed(2)}`;
    const profitLoss = totalReturned - totalStaked;
    profitLossElement.textContent = `Profit/Loss: £${profitLoss.toFixed(2)}`;
    const roi = (totalReturned / totalStaked - 1) * 100;
    roiElement.textContent = `ROI: ${isNaN(roi) ? '0.00' : roi.toFixed(2)}%`;
    wonPlacedLostElement.innerHTML = `Won-Placed-Lost: <span style="color: green;">${wonCount}</span>-<span>${placedCount}</span>-<span style="color: red;">${lostCount}</span>`;
    unsettledBetsElement.textContent = `Unsettled bets: ${unsettledCount}`;
}

// Utility function to parse odds
function parseOdds(odds) {
    const [numerator, denominator] = odds.split('/').map(Number);
    return numerator / denominator;
}

// Export table data
document.getElementById('exportButton').addEventListener('click', () => {
    const betsTable = document.getElementById('betsTable');
    const rows = betsTable.querySelectorAll('tr');
    const csv = Array.from(rows).map(row => {
        const cells = row.querySelectorAll('td, th');
        return Array.from(cells).map(cell => cell.textContent).join(',');
    }).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'bets.csv';
    link.click();
});

// Add event listener to add bet button
document.getElementById('addBetButton').addEventListener('click', addBet);

// Add event listener to search input
document.getElementById('searchInput').addEventListener('input', displayBets);

// Initialize display of bets on page load
window.onload = displayBets;
