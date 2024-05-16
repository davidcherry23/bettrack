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

// Function to display existing bets
async function displayBets() {
    // Retrieve bets ordered by date
    const betsQuery = query(collection(db, "bets"), orderBy("date", "desc"));
    const querySnapshot = await getDocs(betsQuery);
    const betsTable = document.getElementById('betsTable').getElementsByTagName('tbody')[0];
    betsTable.innerHTML = ''; // Clear current bets
    let totalStaked = 0;
    let totalReturned = 0;

    // Iterate over each bet document
    querySnapshot.forEach((doc) => {
        const bet = doc.data();
        const row = betsTable.insertRow();

        // Fill table cells with bet information
        row.insertCell().textContent = bet.name;
        row.insertCell().textContent = `$${parseFloat(bet.amount).toFixed(2)}`;
        row.insertCell().textContent = bet.odds;
        row.insertCell().textContent = bet.date; // Display the date/time
        row.insertCell().textContent = bet.outcome;
        row.insertCell().textContent = `$${parseFloat(bet.returns).toFixed(2)}`;

        const actionsCell = row.insertCell();
        if (bet.outcome === 'Pending') {
            // Allow editing for pending bets
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
            // Attach event listener to save changes
            saveButton.onclick = () => saveBetChanges(doc.id, outcomeSelect.value, returnInput.value, outcomeSelect, returnInput, saveButton);
            actionsCell.appendChild(saveButton);
        }

        // Update totals
        totalStaked += parseFloat(bet.amount);
        totalReturned += parseFloat(bet.returns);
    });

    // Update sidebar summary
    document.getElementById('totalStaked').textContent = `Total Staked: $${totalStaked.toFixed(2)}`;
    document.getElementById('totalReturned').textContent = `Total Returned: $${totalReturned.toFixed(2)}`;
    document.getElementById('profitLoss').textContent = `Profit/Loss: $${(totalReturned - totalStaked).toFixed(2)}`;
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
            y: runningTotal
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
            }
        }
    });

    profitLossChart.render();
}

// Event listener to load existing bets and set up the application
document.addEventListener('DOMContentLoaded', async () => {
    const addBetButton = document.getElementById('addBetButton');
    if (addBetButton) {
        addBetButton.addEventListener('click', addBet);
    }
    // Display existing bets and generate charts
    await displayBets();
    await generateOutcomeChart();
    await generateProfitLossChart();
});
