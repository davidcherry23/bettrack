// Get the DOM elements
const betNameInput = document.getElementById('betName');
const betAmountInput = document.getElementById('betAmount');
const betOddsInput = document.getElementById('betOdds');
const betCourseInput = document.getElementById('betCourse');
const betDateInput = document.getElementById('betDate');
const addBetButton = document.getElementById('addBetButton');
const betsTableBody = document.querySelector('#betsTable tbody');
const searchInput = document.getElementById('searchInput');

// Summary Elements
const totalStakedElement = document.getElementById('totalStaked');
const totalReturnedElement = document.getElementById('totalReturned');
const profitLossElement = document.getElementById('profitLoss');
const roiElement = document.getElementById('roi');
const wonPlacedLostElement = document.getElementById('wonPlacedLost');
const longestLosingStreakElement = document.getElementById('longestLosingStreak');
const unsettledBetsElement = document.getElementById('unsettledBets');

// Data storage
let bets = [];
let longestLosingStreak = 0;
let currentLosingStreak = 0;

// Add Bet
addBetButton.addEventListener('click', () => {
    const betName = betNameInput.value.trim();
    const betAmount = parseFloat(betAmountInput.value);
    const betOdds = betOddsInput.value.trim();
    const betCourse = betCourseInput.value.trim();
    const betDate = new Date(betDateInput.value);
    const outcome = ''; // Will be settled later

    if (!betName || isNaN(betAmount) || !betOdds || !betCourse || isNaN(betDate.getTime())) {
        alert('Please fill in all fields');
        return;
    }

    const newBet = {
        name: betName,
        amount: betAmount,
        odds: betOdds,
        course: betCourse, // Store course for tracking
        date: betDate,
        outcome: outcome
    };

    bets.push(newBet);
    addBetToTable(newBet);
    updateSummary();

    betNameInput.value = '';
    betAmountInput.value = '';
    betOddsInput.value = '';
    betCourseInput.value = '';
    betDateInput.value = '';
});

// Add Bet to Table
function addBetToTable(bet) {
    const row = document.createElement('tr');
    row.innerHTML = `
        <td>${bet.name}</td>
        <td>${bet.amount.toFixed(2)}</td>
        <td>${bet.odds}</td>
        <td>${bet.course}</td>
        <td>${bet.date.toLocaleString()}</td>
        <td>
            <select class="outcomeSelector">
                <option value="">Pending</option>
                <option value="win">Win</option>
                <option value="place">Place</option>
                <option value="lose">Lose</option>
            </select>
        </td>
    `;

    const outcomeSelector = row.querySelector('.outcomeSelector');
    outcomeSelector.addEventListener('change', (e) => {
        bet.outcome = e.target.value;
        updateSummary();
    });

    betsTableBody.appendChild(row);
}

// Update Summary Stats
function updateSummary() {
    let totalStaked = 0;
    let totalReturned = 0;
    let wins = 0;
    let places = 0;
    let losses = 0;
    let unsettled = 0;

    bets.forEach(bet => {
        totalStaked += bet.amount;
        const oddsFraction = parseFraction(bet.odds);
        if (bet.outcome === 'win') {
            wins++;
            totalReturned += bet.amount * oddsFraction + bet.amount;
        } else if (bet.outcome === 'place') {
            places++;
            totalReturned += bet.amount; // For place, assume break even
        } else if (bet.outcome === 'lose') {
            losses++;
        } else {
            unsettled++;
        }
    });

    totalStakedElement.textContent = `Total Staked: $${totalStaked.toFixed(2)}`;
    totalReturnedElement.textContent = `Total Returned: $${totalReturned.toFixed(2)}`;
    const profitLoss = totalReturned - totalStaked;
    profitLossElement.textContent = `Profit/Loss: $${profitLoss.toFixed(2)}`;
    const roi = totalStaked > 0 ? (profitLoss / totalStaked) * 100 : 0;
    roiElement.textContent = `ROI: ${roi.toFixed(2)}%`;

    wonPlacedLostElement.innerHTML = `Won-Placed-Lost: <span style="color: green;">${wins}</span>-<span>${places}</span>-<span style="color: red;">${losses}</span>`;
    unsettledBetsElement.textContent = `Unsettled bets: ${unsettled}`;

    updateLosingStreaks(losses);
}

// Update Losing Streak
function updateLosingStreaks(losses) {
    if (losses > currentLosingStreak) {
        currentLosingStreak = losses;
    } else if (losses === 0) {
        currentLosingStreak = 0;
    }

    if (currentLosingStreak > longestLosingStreak) {
        longestLosingStreak = currentLosingStreak;
    }

    longestLosingStreakElement.textContent = `Longest Losing Streak: ${longestLosingStreak}`;
}

// Parse Fractional Odds
function parseFraction(fraction) {
    const [numerator, denominator] = fraction.split('/').map(Number);
    return denominator ? numerator / denominator : NaN;
}

// Search Bets
searchInput.addEventListener('input', () => {
    const searchTerm = searchInput.value.toLowerCase();
    const rows = betsTableBody.querySelectorAll('tr');
    rows.forEach(row => {
        const betName = row.children[0].textContent.toLowerCase();
        if (betName.includes(searchTerm)) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
});

// Export Table Data
const exportButton = document.getElementById('exportButton');
exportButton.addEventListener('click', () => {
    const csvContent = 'data:text/csv;charset=utf-8,' + generateCSV();
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'bets_data.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
});

// Generate CSV
function generateCSV() {
    let csvRows = ['Name,Amount,Odds,Course,Date/Time,Outcome'];
    bets.forEach(bet => {
        const row = [
            bet.name,
            bet.amount.toFixed(2),
            bet.odds,
            bet.course,
            bet.date.toLocaleString(),
            bet.outcome || 'Pending'
        ];
        csvRows.push(row.join(','));
    });
    return csvRows.join('\n');
}
