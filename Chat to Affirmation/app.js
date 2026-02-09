// 1. Word Banks (From your code)
const tier1Words = ["AT", "AM", "IN", "UP", "IT", "ON", "AN", "ED"];
const tier2Words = ["CAT", "DOG", "PIG", "SUN", "BOX", "MAP", "BAT", "NET", "TOP", "FIN"];
const tier3Words = ["FROG", "STOP", "BLUE", "SWIM", "HAND", "JUMP", "DRUM", "GIFT", "FAST"];

// 2. Initial Game State (Updated to include currentMode)
let gameState = {
    points: 0,
    tier: 1,
    currentWord: "AT",
    lastWord: "",
    currentMode: "SLIDE" 
};

// 3. Connect to the HTML Hooks
const scoreDisplay = document.getElementById('score');
const tierDisplay = document.getElementById('tier-level');
const letterElements = [
    document.getElementById('letter-1'),
    document.getElementById('letter-2'),
    document.getElementById('letter-3'),
    document.getElementById('letter-4')
];
const slider = document.getElementById('blend-slider');
const typeInput = document.getElementById('type-input');
const challengeText = document.getElementById('challenge-text');
const resetTierButton = document.getElementById('reset-tier-button');

// 4. Load saved progress from LocalStorage
function loadGame() {
    const saved = localStorage.getItem('blendingAppSave');
    if (saved) {
        gameState = JSON.parse(saved);
        updateScreen();
    }
}

// 5. Update the Screen & Layout
function updateScreen() {
    scoreDisplay.innerText = gameState.points;
    tierDisplay.innerText = gameState.tier;
    
    // Display the letters
    const chars = gameState.currentWord.split("");
    letterElements.forEach((el, i) => {
        el.innerText = chars[i] || "";
        el.style.marginLeft = "20px"; // Reset spacing for letters
    });
}

// 6. Randomly pick the next challenge
function setNextChallenge() {
    const modes = ["SLIDE", "TYPE", "SPEAK"];
    gameState.currentMode = modes[Math.floor(Math.random() * modes.length)];
    
    // Hide all mode sections
    document.querySelectorAll('.mode-area').forEach(el => el.style.display = 'none');
    
    if (gameState.currentMode === "SLIDE") {
        document.getElementById('slide-section').style.display = 'block';
        challengeText.innerText = "Challenge: SLIDE TO BLEND!";
        slider.value = 0;
    } else if (gameState.currentMode === "TYPE") {
        document.getElementById('type-section').style.display = 'block';
        challengeText.innerText = "Challenge: TYPE THE WORD!";
        typeInput.value = "";
        typeInput.focus();
    } else {
        document.getElementById('speak-section').style.display = 'block';
        challengeText.innerText = "Challenge: SAY THE WORD!";
    }
}

// 7. Success Logic (Combination of your point logic + new modes)
function winWord() {
    speak(gameState.currentWord); // Computer says the word
    gameState.points += 10;
    
    // Your Level Up Logic
    if (gameState.points >= 50