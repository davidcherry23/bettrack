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
        nameCell.contentEditable = true;

        const amountCell = row.insertCell();
        amountCell.textContent = `$${parseFloat(bet.amount).toFixed(2)}`;
        amountCell.contentEditable = true;

        const oddsCell = row.insertCell();
        oddsCell.textContent = bet.odds;
        oddsCell.contentEditable = true;

        const dateCell = row.insertCell();
        dateCell.textContent = bet.date;
        dateCell.contentEditable = true;

        const outcomeCell = row.insertCell();
        outcomeCell.textContent = bet.outcome;
        outcomeCell.contentEditable = true;

        const returnsCell = row.insertCell();
        returnsCell.textContent = `$${parseFloat(bet.returns).toFixed(2)}`;
        returnsCell.contentEditable = true;

        const actionsCell = row.insertCell();
        if (bet.outcome === 'Pending') {
            unsettledCount++;
        }

        totalStaked += parseFloat(bet.amount);
        totalReturned += parseFloat(bet.returns);

        if (bet.outcome === 'Won') wonCount++;
        if (bet.outcome === 'Placed') placedCount++;
        if (bet.outcome === 'Lost') lostCount++;
    });

    const longestLosingStreak = calculateLongestLosingStreakByDateTime(bets);

    totalStakedElement.textContent = `Total Staked: $${totalStaked.toFixed(2)}`;
    totalReturnedElement.textContent = `Total Returned: $${totalReturned.toFixed(2)}`;
    profitLossElement.textContent = `Profit/Loss: $${(totalReturned - totalStaked).toFixed(2)}`;
    longestLosingStreakElement.textContent = `Longest Losing Streak: ${longestLosingStreak}`;
    wonPlacedLostElement.textContent = `Won-Placed-Lost: ${wonCount}-${placedCount}-${lostCount}`;
    unsettledBetsElement.textContent = `Unsettled bets: ${unsettledCount}`;
}

async function saveAllChanges() {
    const betsTable = document.getElementById('betsTable').getElementsByTagName('tbody')[0];
    const rows = betsTable.rows;

    for (let i = 0; i < rows.length; i++) {
        const cells = rows[i].cells;
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
        } catch (error) {
            console.error('Error updating bet: ', error);
            alert('Error updating bet: ' + error.message);
        }
    }
    alert('All changes saved successfully!');
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
        profitLossData.push({
            x: new Date(bet.date),
            y: parseFloat(runningTotal.toFixed(2))
        });
    });

    const profitLossChart = new ApexCharts(document.getElementById("profitLossChartContainer"), {
        series: [{
            data: profitLossData
        }],
        chart: {
            type: "line",
            width: "100%",
            height: "300"
        },
        xaxis: {
            type: "datetime"
        },
        yaxis: {
            title: {
                text: "Profit/Loss"
            },
            labels: {
                formatter: (val) => `£${val.toFixed(2)}`
            }
        }
    });

    profitLossChart.render();
}

document.addEventListener('DOMContentLoaded', async () => {
    const addBetButton = document.getElementById('addBetButton');
    const editButton = document.getElementById('editButton');
    const saveButton = document.getElementById('saveButton');
    const searchInput = document.getElementById('searchInput');

    if (addBetButton) addBetButton.addEventListener('click', addBet);
    if (editButton) editButton.addEventListener('click', () => { document.querySelectorAll('#betsTable td').forEach(cell => cell.contentEditable = true); });
    if (saveButton) saveButton.addEventListener('click', saveAllChanges);
    if (searchInput) searchInput.addEventListener('input', () => displayBets(searchInput.value));

    await displayBets();
    await generateOutcomeChart();
    await generateProfitLossChart();
});
