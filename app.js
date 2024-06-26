// Assuming Firebase and Firestore are correctly configured and imported in another module
import { db } from './firebaseConfig.js';
import { collection, addDoc, getDocs, query, doc, updateDoc, orderBy, deleteDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

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

// Modify the displayBets function to display amounts in pounds (£)
// Function to display bets and include delete buttons for unsettled bets
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

        if (searchInput.length === 0 || bet.name.toLowerCase().includes(searchInput) || formattedDate.includes(searchInput)) {
            bets.push(bet);
            const row = betsTable.insertRow();

            row.insertCell().textContent = bet.name;
            row.insertCell().textContent = `£${parseFloat(bet.amount).toFixed(2)}`;
            row.insertCell().textContent = bet.odds;
            row.insertCell().textContent = formatDateTime(bet.date);

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

                const returnInput = document.createElement('input');
                returnInput.type = 'number';
                returnInput.value = bet.returns;
                actionsCell.appendChild(returnInput);

                const saveButton = document.createElement('button');
                saveButton.textContent = 'Save Changes';
                saveButton.onclick = () => saveBetChanges(doc.id, outcomeSelect.value, returnInput.value, outcomeSelect, returnInput, saveButton);
                actionsCell.appendChild(saveButton);

                const deleteButton = document.createElement('button');
                deleteButton.textContent = 'Delete';
                deleteButton.onclick = () => deleteBet(doc.id);
                actionsCell.appendChild(deleteButton);

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

    totalStakedElement.textContent = `Total Staked: £${totalStaked.toFixed(2)}`;
    totalReturnedElement.textContent = `Total Returned: £${totalReturned.toFixed(2)}`;

    const profitLoss = totalReturned - totalStaked;
    profitLossElement.innerHTML = `Profit/Loss: <span style="color: ${profitLoss >= 0 ? 'green' : 'red'}">£${profitLoss.toFixed(2)}</span>`;

    const roi = totalStaked !== 0 ? ((totalReturned - totalStaked) / totalStaked) * 100 : 0;
    roiElement.innerHTML = `ROI: <span style="color: ${roi >= 0 ? 'green' : 'red'}">${roi.toFixed(2)}%</span>`;

    longestLosingStreakElement.textContent = `Longest Losing Streak: ${longestLosingStreak}`;

    wonPlacedLostElement.innerHTML = `Won-Placed-Lost: <span style="color: green">${wonCount}</span>-<span style="color: orange">${placedCount}</span>-<span style="color: red">${lostCount}</span>`;
    unsettledBetsElement.textContent = `Unsettled bets: ${unsettledCount}`;
}

// Function to delete a bet with confirmation
async function deleteBet(betId) {
    const confirmation = confirm("Are you sure you want to delete this bet?");
    if (!confirmation) {
        return;
    }

    const betRef = doc(db, "bets", betId);
    try {
        await deleteDoc(betRef);
        alert('Bet deleted successfully!');
        displayBets(); // Refresh the list to reflect changes
    } catch (error) {
        console.error('Error deleting bet: ', error);
        alert('Error deleting bet');
    }
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

function exportTableData() {
    const betsTable = document.getElementById('betsTable');
    const rows = betsTable.getElementsByTagName('tr');
    let csvContent = "data:text/csv;charset=utf-8,";

    // Loop through table rows
    for (const row of rows) {
        const cells = row.getElementsByTagName('td');
        const rowData = [];

        // Loop through table cells
        for (const cell of cells) {
            rowData.push(cell.textContent.trim());
        }

        // Create CSV row
        const csvRow = rowData.join(',');
        csvContent += csvRow + "\r\n";
    }

    // Create download link
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "table_data.csv");
    document.body.appendChild(link); // Required for Firefox
    link.click();
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
                formatter: (val) => `£${val.toFixed(2)}` // Display £ symbol before the value
            }
        },
        tooltip: {
            enabled: true,
            custom: function({ series, seriesIndex, dataPointIndex, w }) {
                const date = new Date(w.config.series[seriesIndex].data[dataPointIndex].x);
                const value = w.config.series[seriesIndex].data[dataPointIndex].y.toFixed(2);
                return `<div>Date: ${date.toLocaleDateString()}</div><div>Profit/Loss: £${value}</div>`;
            }
        }
    });

    profitLossChart.render();
}




document.addEventListener('DOMContentLoaded', async () => {
    const addBetButton = document.getElementById('addBetButton');
    const searchInput = document.getElementById('searchInput');
    const exportButton = document.getElementById('exportButton');
    if (addBetButton) {
        addBetButton.addEventListener('click', addBet);
    }
    if (searchInput) {
        searchInput.addEventListener('input', displayBets);
    }
    if (exportButton) {
        exportButton.addEventListener('click', exportTableData);
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
