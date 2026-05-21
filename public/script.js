const inputView = document.getElementById('input-view');
const loadingView = document.getElementById('loading-view');
const loadingMessage = document.getElementById('loading-message');
const displayView = document.getElementById('display-view');
const wordInput = document.getElementById('word-input');
const outputLeft = document.getElementById('output-left');
const outputRight = document.getElementById('output-right');
const orbitContainer = document.getElementById('orbit-container');

wordInput.addEventListener('keypress', async (e) => {
    if (e.key === 'Enter') {
        const input = wordInput.value.trim();
        if (!input) return;

        // Transition to loading
        inputView.style.opacity = '0';
        loadingMessage.textContent = "矛盾を探しています...";
        setTimeout(() => {
            inputView.style.display = 'none';
            loadingView.style.display = 'block';
        }, 800);

        try {
            const response = await fetch('/api/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ inputWord: input })
            });

            const data = await response.json();

            if (response.ok && data && data.words && data.words.length >= 4) {
                showOxymoron(input, data);
            } else {
                throw new Error(data.error || "Failed to generate");
            }
        } catch (err) {
            console.error(err);
            handleError();
        }
    }
});

function handleError() {
    // 2. エラーハンドリングのUI化
    loadingMessage.textContent = "言葉が混線しているようです。少し息をしてから、もう一度試してください。";
    
    // Slowly fade out and return to input
    setTimeout(() => {
        loadingView.style.opacity = '0';
        setTimeout(() => {
            loadingView.style.display = 'none';
            loadingView.style.opacity = '1';
            inputView.style.display = 'block';
            inputView.style.opacity = '1';
            inputView.style.pointerEvents = 'auto';
            wordInput.focus();
        }, 1500);
    }, 3000);
}

function showOxymoron(inputWord, data) {
    const { position, words } = data;
    
    // Clear previous orbit
    orbitContainer.innerHTML = '';

    if (position === 'before') {
        outputLeft.textContent = words[0];
        outputLeft.className = 'font-sans';
        outputRight.textContent = inputWord;
        outputRight.className = 'font-serif';
    } else {
        outputLeft.textContent = inputWord;
        outputLeft.className = 'font-serif';
        outputRight.textContent = words[0];
        outputRight.className = 'font-sans';
    }

    words.slice(1).forEach((word, index) => {
        const marg = document.createElement('div');
        marg.className = 'marginalia';
        marg.textContent = position === 'before' ? word + inputWord : inputWord + word;
        
        const baseAngle = (index * (Math.PI * 2 / 3));
        const angle = baseAngle + (Math.random() * 0.5 - 0.25); 
        const distance = 250 + Math.random() * 100;
        const x = Math.cos(angle) * distance;
        const y = Math.sin(angle) * distance;
        
        marg.style.left = `calc(50% + ${x}px)`;
        marg.style.top = `calc(50% + ${y}px)`;
        marg.style.transform = 'translate(-50%, -50%)';
        
        orbitContainer.appendChild(marg);
        
        setTimeout(() => {
            marg.classList.add('show');
        }, 1200 + (index * 400));
    });

    loadingView.style.display = 'none';
    displayView.style.display = 'flex';
    displayView.classList.add('fade-in');
}

document.body.addEventListener('click', () => {
    if (displayView.style.display === 'flex') {
        reset();
    }
});

function reset() {
    displayView.classList.remove('fade-in');
    displayView.style.opacity = '0';
    setTimeout(() => {
        displayView.style.display = 'none';
        displayView.style.opacity = '1';
        inputView.style.display = 'block';
        inputView.style.opacity = '1';
        inputView.style.pointerEvents = 'auto';
        wordInput.value = '';
        wordInput.focus();
        orbitContainer.innerHTML = '';
    }, 800);
}

window.onload = () => wordInput.focus();
