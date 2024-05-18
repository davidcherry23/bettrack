import { db } from './firebaseConfig.js';
import { collection, addDoc, getDocs, query, doc, updateDoc, orderBy } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// Function to add a new bet
async function addBet() {
    const betName = document.getElementById('betName').value;
    const betAmount = document.getElementById('betAmount').value;
    const betOdds = document.getElementById('betOdds').value;
    const betDate = document.getElementById('betDate').value;

    if (betName.trim() === '' || isNaN(parseFloat(betAmount)) || parseFloat(betAmount) <= 0 || betOdds.trim() === '' || betDate.trim() === '') {
        alert('Please enter valid bet details');
        return;
    }

    try {
        await addDoc(collection(db, "bets"), {
            name: betName,
            amount: parseFloat(betAmount),
            odds: betOdds,
            date: betDate,
            outcome: "Pending",
            returns: 0
        });
        alert('Bet added successfully!');
        displayBets();
    } catch (error) {
        console.error('Error adding bet: ', error);
        alert('Error adding bet: ' + error.message);
    }
}

async function displayBets(searchQuery = '') {
    const betsQuery = query(collection(db, "bets"), orderBy("date", "desc"));
    const querySnapshot = await getDocs(betsQuery);
    const betsTable = document.getElementById('betsTable').getElementsByTagName('tbody')[0];
    const totalStakedElement = document.getElementById('totalStaked');
    const totalReturnedElement = document.getElementById('totalReturned');
    const profitLossElement = document.getElementById('profitLoss');
    const longestLosingStreakElement = document.getElementById('longestLosingStreak');
    const wonPlacedLostElement = document.getElementById('wonPlacedLost');
    const unsettledBetsElement = document.getElementById('unsettledBets');

    if (!betsTable || !totalStakedElement || !totalReturnedElement || !profitLossElement || !longestLosingStreakElement || !wonPlacedLostElement || !unsettledBetsElement) {
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
        if (searchQuery && !bet.name.toLowerCase().includes(searchQuery.toLowerCase())) {
            return;
        }
        bets.push({ ...bet, id: doc.id });
        const row = betsTable.insertRow();

        const nameCell = row.insertCell();
        nameCell.textContent = bet.name;
        nameCell.setAttribute('data-id', doc.id);

        const amountCell = row.insertCell();
        amountCell.textContent = `$${parseFloat(bet.amount).toFixed(2)}`;

        const oddsCell = row.insertCell();
        oddsCell.textContent = bet.odds;

        const dateCell = row.insertCell();
        dateCell.textContent = bet.date;

        const outcomeCell = row.insertCell();
        outcomeCell.textContent = bet.outcome;
        if (bet.outcome === 'Pending') {
            const settleButton = document.createElement('button');
            settleButton.textContent = 'Settle';
            settleButton.addEventListener('click', () => settleBet(doc.id));
            outcomeCell.appendChild(settleButton);
        }

        const returnsCell = row.insertCell();
        returnsCell.textContent = `$${parseFloat(bet.returns).toFixed(2)}`;

        const actionsCell = row.insertCell();
        const editButton = document.createElement('button');
        editButton.textContent = 'Edit';
        editButton.addEventListener('click', () => enableEditMode(row));
        actionsCell.appendChild(editButton);

        totalStaked += parseFloat(bet.amount);
        totalReturned += parseFloat(bet.returns);

        if (bet.outcome === 'Won') wonCount++;
        if (bet.outcome === 'Placed') placedCount++;
        if (bet.outcome === 'Lost') lostCount++;
        if (bet.outcome === 'Pending') unsettledCount++;
    });

    const longestLosingStreak = calculateLongestLosingStreakByDateTime(bets);

    totalStakedElement.textContent = `Total Staked: $${totalStaked.toFixed(2)}`;
    totalReturnedElement.textContent = `Total Returned: $${totalReturned.toFixed(2)}`;
    profitLossElement.textContent = `Profit/Loss: $${(totalReturned - totalStaked).toFixed(2)}`;
    longestLosingStreakElement.textContent = `Longest Losing Streak: ${longestLosingStreak}`;
    wonPlacedLostElement.textContent = `Won-Placed-Lost: ${wonCount}-${placedCount}-${lostCount}`;
    unsettledBetsElement.textContent = `Unsettled bets: ${unsettledCount}`;
}

function enableEditMode(row) {
    const cells = row.cells;
    for (let i = 0; i < cells.length - 1; i++) {
        cells[i].contentEditable = true;
    }
    const saveButton = document.createElement('button');
    saveButton.textContent = 'Save';
    saveButton.addEventListener('click', () => saveChanges(row));
    cells[cells.length - 1].appendChild(saveButton);
}

async function saveChanges(row) {
    const cells = row.cells;
    const betId = cells[0].getAttribute('data-id');
    const updatedBet = {
        name: cells[0].textContent,
        amount: parseFloat(cells[1].textContent.replace('$', '')),
        odds: cells[2].textContent,
        date: cells[3].textContent,
        outcome: cells[4].textContent,
        returns: parseFloat(cells[5].textContent.replace('$', ''))
    };

    try {
        const betRef = doc(db, "bets", betId);
        await updateDoc(betRef, updatedBet);
        alert('Bet updated successfully!');
    } catch (error) {
        console.error('Error updating bet: ', error);
        alert('Error updating bet: ' + error.message);
    }
    displayBets();
}

async function settleBet(betId) {
    const outcome = prompt("Enter outcome (Won, Placed, Lost):");
    const returns = outcome === 'Won' || outcome === 'Placed' ? parseFloat(prompt("Enter returns amount:")) : 0;
    
    if (!outcome || (outcome !== 'Won' && outcome !== 'Placed' && outcome !== 'Lost')) {
        alert('Invalid outcome');
        return;
    }

    try {
        const betRef = doc(db, "bets", betId);
        await updateDoc(betRef, { outcome, returns });
        alert('Bet settled successfully!');
    } catch (error) {
        console.error('Error settling bet: ', error);
        alert('Error settling bet: ' + error.message);
    }
    displayBets();
}

function calculateLongestLosingStreakByDateTime(bets) {
    bets.sort((a, b) => new Date(a.date) - new Date(b.date));
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

async function generateOutcomeChart() {
    const betsQuery = query(collection(db, "bets"));
    const querySnapshot = await getDocs(betsQuery);
    const outcomeCounts = {
        Won: 0,
        Placed: 0,
        Lost: 0,
        Pending: 0
    };

    querySnapshot.forEach(doc => {
        const outcome = doc.data().outcome;
        outcomeCounts[outcome]++;
    });

    const outcomeChart = new ApexCharts(document.getElementById("outcomeChartContainer"), {
        series: Object.values(outcomeCounts),
        chart: {
            type: "donut",
            width: "100%",
            height: "300"
        },
        labels: Object.keys(outcomeCounts)
    });

    outcomeChart.render();
}

async function generateProfitLossChart() {
    const betsQuery = query(collection(db, "bets"), orderBy("date", "asc"));
    const querySnapshot = await getDocs(betsQuery);
    const profitLossData = [];
    let runningTotal = 0;

    querySnapshot.forEach(doc => {
        const bet = doc.data();
        runningTotal += parseFloat(bet.returns) - parseFloat(bet.amount);
        profitLossData.push({ x: new Date(bet.date), y: runningTotal });
    });

    const profitLossChart = new ApexCharts(document.getElementById("profitLossChartContainer"), {
        series: [{
            name: "Profit/Loss",
            data: profitLossData
        }],
        chart: {
            type: "line",
            width: "100%",
            height: "300"
        },
        xaxis: {
            type: "datetime"
        }
    });

    profitLossChart.render();
}

document.addEventListener('DOMContentLoaded', async () => {
    const addBetButton = document.getElementById('addBetButton');
    const searchInput = document.getElementById('searchInput');

    addBetButton.addEventListener('click', addBet);
    searchInput.addEventListener('input', () => displayBets(searchInput.value));

    await displayBets();
    await generateOutcomeChart();
    await generateProfitLossChart();
});
