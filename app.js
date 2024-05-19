// Assuming Firebase and Firestore are correctly configured and imported in another module
import { db } from './firebaseConfig.js';
import { collection, addDoc, getDocs, query, doc, updateDoc, orderBy } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// Function to add a new bet
async function addBet() {
    // Retrieve input values
    const betName = document.getElementById('betName').value;
    const betAmount = document.getElementById('betAmount').value;
    const betOdds = document.getElementById('betOdds').value;
    const betDate = document.getElementById('betDate').value; // Get the date/time input value

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
        // Add bet document to Firestore
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

// Function to format the date and time
function formatDateTime(dateTime) {
    const date = new Date(dateTime);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${day}-${month}-${year} ${hours}:${minutes}`;
}

// Modify the displayBets function to apply the search filter
async function displayBets() {
    // Retrieve bets ordered by date
    const betsQuery = query(collection(db, "bets"), orderBy("date", "desc"));
    const querySnapshot = await getDocs(betsQuery);
    const betsTable = document.getElementById('betsTable').getElementsByTagName('tbody')[0];
    const totalStakedElement = document.getElementById('totalStaked');
    const totalReturnedElement = document.getElementById('totalReturned');
    const profitLossElement = document.getElementById('profitLoss');
    const roiElement = document.getElementById('roi'); // Get the ROI element
    const longestLosingStreakElement = document.getElementById('longestLosingStreak');
    const wonPlacedLostElement = document.getElementById('wonPlacedLost');
    const unsettledBetsElement = document.getElementById('unsettledBets');
    const searchInput = document.getElementById('searchInput').value.trim().toLowerCase();

    // Check if any required elements are null
    if (!betsTable || !totalStakedElement || !totalReturnedElement || !profitLossElement || !roiElement || !longestLosingStreakElement || !wonPlacedLostElement || !unsettledBetsElement) {
        console.error("One or more elements not found.");
        return;
    }

    betsTable.innerHTML = ''; // Clear current bets
    let totalStaked = 0;
    let totalReturned = 0;
    const bets = [];
    let wonCount = 0;
    let placedCount = 0;
    let lostCount = 0;
    let unsettledCount = 0;

    // Iterate over each bet document and apply search filter
    querySnapshot.forEach((doc) => {
        const bet = doc.data();
        if (searchInput.length === 0 || bet.name.toLowerCase().includes(searchInput)) {
            bets.push(bet); // Store bet for later use
            const row = betsTable.insertRow();

            // Fill table cells with bet information
            row.insertCell().textContent = bet.name;
            row.insertCell().textContent = `$${parseFloat(bet.amount).toFixed(2)}`;
            row.insertCell().textContent = bet.odds;
            row.insertCell().textContent = formatDateTime(bet.date); // Use formatted date
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

                unsettledCount++;
            }

            totalStaked += parseFloat(bet.amount);
            totalReturned += parseFloat(bet.returns);

            if (bet.outcome === 'Won') wonCount++;
            if (bet.outcome === 'Placed') placedCount++;
            if (bet.outcome === 'Lost') lostCount++;
        }
    });

    const longestLosingStreak = calculateLongestLosingStreakByDateTime(bets);

    totalStakedElement.textContent = `Total Staked: $${totalStaked.toFixed(2)}`;
    totalReturnedElement.textContent = `Total Returned: $${totalReturned.toFixed(2)}`;

    const profitLoss = totalReturned - totalStaked;
    profitLossElement.innerHTML = `Profit/Loss: <span style="color: ${profitLoss >= 0 ? 'green' : 'red'}">$${profitLoss.toFixed(2)}</span>`;

    const roi = totalStaked !== 0 ? ((totalReturned - totalStaked) / totalStaked) * 100 : 0;
    roiElement.innerHTML = `ROI: <span style="color: ${roi >= 0 ? 'green' : 'red'}">${roi.toFixed(2)}%</span>`;

    longestLosingStreakElement.textContent = `Longest Losing Streak: ${longestLosingStreak}`;

    // Update Won-Placed-Lost with specific colors
    wonPlacedLostElement.innerHTML = `Won-Placed-Lost: <span style="color: green">${wonCount}</span>-<span style="color: blue">${placedCount}</span>-<span style="color: red">${lostCount}</span>`;
    unsettledBetsElement.textContent = `Unsettled bets: ${unsettledCount}`;
}

// Function to save changes to a bet
async function saveBetChanges(betId, outcome, returns, outcomeSelect, returnInput, saveButton) {
    const betRef = doc(db, "bets", betId);
    try {
        // Update bet document in Firestore
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

// Function to calculate the longest losing streak based on date and time
function calculateLongestLosingStreakByDateTime(bets) {
    bets.sort((a, b) => new Date(a.date) - new Date(b.date)); // Sort bets by date and time
    let longestStreak = 0;
    let currentStreak = 0;

    for (let i = 0; i < bets.length; i++) {
        if (bets[i].outcome === 'Lost') {
            currentStreak++;
            longestStreak = Math.max(longestStreak, currentStreak);
        } else {
            currentStreak = 0;
        }
    }

    return longestStreak;
}

// Function to generate outcome chart
async function generateOutcomeChart() {
    const betsQuery = query(collection(db, "bets"));
    const querySnapshot = await getDocs(betsQuery);
    const outcomeCounts = {
        Won: 0,
        Placed: 0,
        Lost: 0,
        Pending: 0
    };

    // Count outcomes
    querySnapshot.forEach(doc => {
        const outcome = doc.data().outcome;
        outcomeCounts[outcome]++;
    });

    // Render donut chart
    const outcomeChart = new ApexCharts(document.getElementById("outcomeChartContainer"), {
        series: Object.values(outcomeCounts),
        chart: {
            type: "donut",
            width: "100%", // Adjust the width to occupy the entire container
            height: "300" // Adjust the height of the chart
        },
        labels: Object.keys(outcomeCounts)
    });

    outcomeChart.render();
}

// Function to generate profit/loss chart
async function generateProfitLossChart() {
    const betsQuery = query(collection(db, "bets"), orderBy("date", "asc"));
    const querySnapshot = await getDocs(betsQuery);
    const profitLossData = [];
    let runningTotal = 0;

    // Prepare data for the chart
    querySnapshot.forEach(doc => {
        const bet = doc.data();
        runningTotal += parseFloat(bet.returns) - parseFloat(bet.amount);
        profitLossData.push({
            x: new Date(bet.date),
            y: parseFloat(runningTotal.toFixed(2)) // Ensure values are to 2 decimal places
        });
    });

    // Render line chart
    const profitLossChart = new ApexCharts(document.getElementById("profitLossChartContainer"), {
        series: [{
            data: profitLossData
        }],
        chart: {
            type: "line",
            width: "100%", // Adjust the width to occupy the entire container
            height: "300" // Adjust the height of the chart
        },
        xaxis: {
            type: "datetime"
        },
        yaxis: {
            title: {
                text: "Profit/Loss"
            },
            labels: {
                formatter: (val) => `£${val.toFixed(2)}` // Ensure y-axis labels are to 2 decimal places
            }
        }
    });

    profitLossChart.render();
}

document.addEventListener('DOMContentLoaded', async () => {
    const addBetButton = document.getElementById('addBetButton');
    const searchInput = document.getElementById('searchInput');
    if (addBetButton) {
        addBetButton.addEventListener('click', addBet);
    }
    if (searchInput) {
        searchInput.addEventListener('input', displayBets);
    }

    // Display existing bets and generate charts only once
    await setupApplication();
});

// Function to set up the application
async function setupApplication() {
    // Display existing bets and generate charts
    await displayBets();
    await generateOutcomeChart();
    await generateProfitLossChart();
}
