// score.js

// ---------- SETUP PAGE LOGIC ----------

// Save match setup and go to live.html
function goToLiveMatch() {
    event.preventDefault(); // prevent form submit

    const team1 = document.getElementById("team1").value.trim();
    const team2 = document.getElementById("team2").value.trim();
    const tossWinner = document.getElementById("toss-winner").value;
    const tossDecision = document.getElementById("toss-decision").value;

    if (!team1 || !team2 || !tossWinner || !tossDecision) {
        alert("Please fill all fields!");
        return;
    }

    // Decide batting and bowling teams
    let battingFirst, bowlingFirst; 
    if ((tossWinner === "team1" && tossDecision === "bat") || (tossWinner === "team2" && tossDecision === "bowl")) {
        battingFirst = team1;
        bowlingFirst = team2;
    } else {
        battingFirst = team2;
        bowlingFirst = team1;
    }

    // Save to localStorage
    const matchData = {
        team1,
        team2,
        battingFirst,
        bowlingFirst,
        innings: 1,
        team1Score: 0,
        team1Wickets: 0,
        team1Balls: 0,
        team2Score: 0,
        team2Wickets: 0,
        team2Balls: 0,
        batters: {},
        bowlers: {},
        striker: "",
        nonStriker: "",
        currentBowler: "",
        target: 0
    };
    localStorage.setItem("matchData", JSON.stringify(matchData));

    window.location.href = "live.html";
}

// ---------- COMMON HELPER FUNCTIONS ----------

// Load match data
function loadMatchData() {
    return JSON.parse(localStorage.getItem("matchData"));
}

// Save match data
function saveMatchData(data) {
    localStorage.setItem("matchData", JSON.stringify(data));
}

// ---------- LIVE PAGE LOGIC ----------

// Update live display

// score.js

// Match State
let totalRuns = 0;
let totalBalls = 0;
let totalWickets = 0;
let oversLimit = 20; // can be changed based on input later
let target = null; // only for 2nd innings
let innings = 1;

// Batters
let striker = { name: "", runs: 0, balls: 0, fours: 0, sixes: 0 };
let nonStriker = { name: "", runs: 0, balls: 0, fours: 0, sixes: 0 };

// Bowlers
let currentBowler = { name: "", balls: 0, runs: 0, wickets: 0 };
let bowlers = {};

// DOM Elements
const matchStatus = document.getElementById("match-status");
const scoreDisplay = document.getElementById("overall-score");
const teamScores = document.getElementById("team-scores");
const batterTable = document.querySelector("#batter-table tbody");
const bowlerTable = document.querySelector("#bowler-stats tbody");
const crrDisplay = document.getElementById("crr");
const rrrDisplay = document.getElementById("rrr");

// Initialization
function startMatch() {
    striker.name = prompt("Enter name of striker:");
    nonStriker.name = prompt("Enter name of non-striker:");
    currentBowler.name = prompt("Enter name of the bowler:");
    bowlers[currentBowler.name] = { overs: 0, balls: 0, maidens: 0, runs: 0, wickets: 0 };
    updateUI();
}

function updateUI() {
    scoreDisplay.textContent = `Runs: ${totalRuns} / ${totalWickets} | Overs: ${formatOvers(totalBalls)}`;

    updateBatterTable();
    updateBowlerTable();

    crrDisplay.textContent = calculateCRR().toFixed(2);
    rrrDisplay.textContent = innings === 2 && target !== null
        ? calculateRRR().toFixed(2)
        : "0.00";

    matchStatus.textContent = innings === 1
        ? "First Innings"
        : `Chasing ${target} - Second Innings`;
}

function updateBatterTable() {
    batterTable.innerHTML = `
        <tr>
            <td>${striker.name}*</td>
            <td>${striker.runs}</td>
            <td>${striker.balls}</td>
            <td>${striker.fours}</td>
            <td>${striker.sixes}</td>
            <td>${calculateStrikeRate(striker).toFixed(2)}</td>
        </tr>
        <tr>
            <td>${nonStriker.name}</td>
            <td>${nonStriker.runs}</td>
            <td>${nonStriker.balls}</td>
            <td>${nonStriker.fours}</td>
            <td>${nonStriker.sixes}</td>
            <td>${calculateStrikeRate(nonStriker).toFixed(2)}</td>
        </tr>
    `;
}

function updateBowlerTable() {
    bowlerTable.innerHTML = '';
    for (const name in bowlers) {
        const b = bowlers[name];
        const economy = b.balls > 0 ? (b.runs / (b.balls / 6)).toFixed(2) : "0.00";
        bowlerTable.innerHTML += `
            <tr>
                <td>${name}${name === currentBowler.name ? "*" : ""}</td>
                <td>${formatOvers(b.balls)}</td>
                <td>${b.maidens}</td>
                <td>${b.runs}</td>
                <td>${b.wickets}</td>
                <td>${economy}</td>
            </tr>
        `;
    }
}

function calculateCRR() {
    return totalBalls > 0 ? (totalRuns / (totalBalls / 6)) : 0;
}

function calculateRRR() {
    const ballsLeft = oversLimit * 6 - totalBalls;
    const runsRequired = target - totalRuns;
    return ballsLeft > 0 ? (runsRequired / (ballsLeft / 6)) : 0;
}

function calculateStrikeRate(batter) {
    return batter.balls > 0 ? (batter.runs / batter.balls) * 100 : 0;
}

function formatOvers(balls) {
    return `${Math.floor(balls / 6)}.${balls % 6}`;
}

function rotateStrike() {
    [striker, nonStriker] = [nonStriker, striker];
}

// Scoring Logic
document.querySelectorAll(".score-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        const runs = parseInt(btn.dataset.runs);
        striker.runs += runs;
        striker.balls++;
        totalRuns += runs;
        totalBalls++;

        // Update batter stats
        if (runs === 4) striker.fours++;
        if (runs === 6) striker.sixes++;

        // Update bowler stats
        currentBowler.balls++;
        currentBowler.runs += runs;
        bowlers[currentBowler.name].balls++;
        bowlers[currentBowler.name].runs += runs;

        if (runs % 2 === 1) rotateStrike();

        checkOverCompletion();
        updateUI();
    });
});

document.getElementById("wicket-btn").addEventListener("click", () => {
    totalWickets++;
    totalBalls++;
    striker.balls++;

    currentBowler.balls++;
    currentBowler.wickets++;
    bowlers[currentBowler.name].balls++;
    bowlers[currentBowler.name].wickets++;

    updateUI();

    if (totalWickets < 10) {
        striker = {
            name: prompt("New batter's name:"),
            runs: 0,
            balls: 0,
            fours: 0,
            sixes: 0
        };
    } else {
        alert("Innings Over!");
        if (innings === 1) {
            innings = 2;
            target = totalRuns + 1;
            totalRuns = 0;
            totalBalls = 0;
            totalWickets = 0;
            striker = {
                name: prompt("New striker:"),
                runs: 0, balls: 0, fours: 0, sixes: 0
            };
            nonStriker = {
                name: prompt("New non-striker:"),
                runs: 0, balls: 0, fours: 0, sixes: 0
            };
            currentBowler.name = prompt("New bowler:");
            bowlers = {};
            bowlers[currentBowler.name] = { overs: 0, balls: 0, maidens: 0, runs: 0, wickets: 0 };
        } else {
            alert("Match Finished");
        }
    }

    checkOverCompletion();
    updateUI();
});

function checkOverCompletion() {
    if (totalBalls % 6 === 0) {
        bowlers[currentBowler.name].overs++;
        const runsThisOver = bowlers[currentBowler.name].runs - (bowlers[currentBowler.name].previousRuns || 0);
        if (runsThisOver === 0) bowlers[currentBowler.name].maidens++;
        bowlers[currentBowler.name].previousRuns = bowlers[currentBowler.name].runs;

        rotateStrike();
        currentBowler.name = prompt("New bowler:");
        if (!bowlers[currentBowler.name]) {
            bowlers[currentBowler.name] = { overs: 0, balls: 0, maidens: 0, runs: 0, wickets: 0 };
        }
    }
}

// Scorecard Navigation
document.getElementById("scorecard-btn").addEventListener("click", () => {
    window.location.href = "scorecard.html";
});

startMatch();



// ---------- SCORECARD PAGE LOGIC ----------

if (document.getElementById("batting-table")) {
    const data = loadMatchData();
    const battingTbody = document.getElementById("batting-table").querySelector("tbody");
    for (let player in data.batters) {
        const batter = data.batters[player];
        const row = `<tr>
            <td>${player}</td>
            <td>${batter.runs}</td>
            <td>${batter.balls}</td>
            <td>${batter.fours}</td>
            <td>${batter.sixes}</td>
            <td>${((batter.runs / batter.balls) * 100).toFixed(1)}</td>
        </tr>`;
        battingTbody.innerHTML += row;
    }

    const bowlingTbody = document.getElementById("bowling-table").querySelector("tbody");
    for (let player in data.bowlers) {
        const bowler = data.bowlers[player];
        const row = `<tr>
            <td>${player}</td>
            <td>${Math.floor(bowler.balls / 6)}.${bowler.balls % 6}</td>
            <td>${bowler.maidens}</td>
            <td>${bowler.runsConceded}</td>
            <td>${bowler.wickets}</td>
            <td>${bowler.balls ? (bowler.runsConceded / (bowler.balls / 6)).toFixed(2) : "0.00"}</td>
        </tr>`;
        bowlingTbody.innerHTML += row;
    }

    document.getElementById("backToLiveBtn").addEventListener("click", function() {
        window.location.href = "live.html";
    });
    document.getElementById("summaryPageBtn").addEventListener("click", function() {
        window.location.href = "summary.html"; 
    });
}

// ---------- SUMMARY PAGE LOGIC ----------

if (document.getElementById("result")) {
    const data = loadMatchData();
    let resultText = "";

    if (data.team2Score >= data.team1Score + 1) {
        const wicketsLeft = 10 - data.team2Wickets;
        const ballsLeft = 12 - data.team2Balls;
        resultText = `${data.bowlingFirst} wins by ${wicketsLeft} wickets (${ballsLeft} balls left)!`;
    } else {
        const runMargin = data.team1Score - data.team2Score;
        resultText = `${data.battingFirst} wins by ${runMargin} runs!`;
    }

    document.getElementById("result").innerHTML = `<h2>${resultText}</h2>`;
}

function resetMatch() {
    localStorage.clear();
    window.location.href = "setup.html";
}

document.addEventListener("DOMContentLoaded", updateDisplay);

document.addEventListener("DOMContentLoaded", function() {
    if (document.getElementById("batting-table")) {
        const data = loadMatchData();
        
        if (!data) return; // extra safety
        
        const battingTbody = document.getElementById("batting-table").querySelector("tbody");
        battingTbody.innerHTML = ""; // Clear old rows (important if page refreshes)

        for (let player in data.batters) {
            const batter = data.batters[player];
            battingTbody.innerHTML += `
                <tr>
                    <td>${player}</td>
                    <td>${batter.runs}</td>
                    <td>${batter.balls}</td>
                    <td>${batter.fours}</td>
                    <td>${batter.sixes}</td>
                    <td>${(batter.balls ? (batter.runs / batter.balls) * 100 : 0).toFixed(1)}</td>
                </tr>`;
        }

        const bowlingTbody = document.getElementById("bowling-table").querySelector("tbody");
        bowlingTbody.innerHTML = ""; // Clear old rows

        for (let player in data.bowlers) {
            const bowler = data.bowlers[player];
            bowlingTbody.innerHTML += `
                <tr>
                    <td>${player}</td>
                    <td>${Math.floor(bowler.balls / 6)}.${bowler.balls % 6}</td>
                    <td>${bowler.maidens}</td>
                    <td>${bowler.runsConceded}</td>
                    <td>${bowler.wickets}</td>
                    <td>${(bowler.balls ? (bowler.runsConceded / (bowler.balls / 6)) : 0).toFixed(2)}</td>
                </tr>`;
        }

        // Back to Live button
        document.getElementById("backToLiveBtn").addEventListener("click", function() {
            window.location.href = "live.html";
        });
    }
});

