const inputView = document.getElementById('input-view');
const loadingView = document.getElementById('loading-view');
const displayView = document.getElementById('display-view');
const wordInput = document.getElementById('word-input');
const outputLeft = document.getElementById('output-left');
const outputRight = document.getElementById('output-right');
const orbitContainer = document.getElementById('orbit-container');
const apiKeyInput = document.getElementById('api-key');
const apiConfig = document.getElementById('api-config');

// Load API Key from localStorage
apiKeyInput.value = localStorage.getItem('gemini_api_key') || '';

apiKeyInput.addEventListener('change', () => {
    localStorage.setItem('gemini_api_key', apiKeyInput.value);
});

function toggleConfig(e) {
    e.stopPropagation();
    apiConfig.style.display = apiConfig.style.display === 'block' ? 'none' : 'block';
}

wordInput.addEventListener('keypress', async (e) => {
    if (e.key === 'Enter') {
        const input = wordInput.value.trim();
        if (!input) return;

        // Transition to loading
        inputView.style.opacity = '0';
        setTimeout(() => {
            inputView.style.display = 'none';
            loadingView.style.display = 'block';
        }, 800);

        const data = await fetchGeminiOxymoron(input);

        if (data && data.words && data.words.length >= 4) {
            showOxymoron(input, data);
        } else {
            // Revert on error
            loadingView.style.display = 'none';
            inputView.style.display = 'block';
            inputView.style.opacity = '1';
            inputView.style.pointerEvents = 'auto';
            alert("矛盾が見つかりませんでした。");
        }
    }
});

async function fetchGeminiOxymoron(inputWord) {
    const apiKey = apiKeyInput.value;
    if (!apiKey) {
        alert("APIキーが設定されていません。右下の小さな点から設定してください。");
        return null;
    }

    const prompt = `ユーザーが入力した単語【${inputWord}】に対して、構造的完成度が高いオクシモロン（矛盾語法）を生成してください。
以下の厳格なJSONフォーマットで返却してください。
{
"position": "before", // 入力語が名詞の場合、対極の『形容詞』を生成し、"before"を指定。入力語が形容詞等の場合、対極の『名詞』を生成し、"after"を指定。
"words": ["第1候補", "第2候補", "第3候補", "第4候補"]
}
※配列には必ず対極の単語のみを含め、入力語自体は絶対に含めないこと。マークダウンや解説は一切不要です。`;

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                    response_mime_type: "application/json"
                }
            })
        });

        const data = await response.json();
        if (data.error) throw new Error(data.error.message);
        
        const text = data.candidates[0].content.parts[0].text;
        return JSON.parse(text);
    } catch (err) {
        console.error(err);
        return null;
    }
}

function showOxymoron(inputWord, data) {
    const { position, words } = data;
    
    // Clear previous orbit
    orbitContainer.innerHTML = '';

    if (position === 'before') {
        // [Generated(Gothic)] + [Input(Mincho)]
        outputLeft.textContent = words[0];
        outputLeft.className = 'font-sans';
        outputRight.textContent = inputWord;
        outputRight.className = 'font-serif';
    } else {
        // [Input(Mincho)] + [Generated(Gothic)]
        outputLeft.textContent = inputWord;
        outputLeft.className = 'font-serif';
        outputRight.textContent = words[0];
        outputRight.className = 'font-sans';
    }

    // Create orbiting candidates (2nd to 4th)
    words.slice(1).forEach((word, index) => {
        const marg = document.createElement('div');
        marg.className = 'marginalia';
        marg.textContent = position === 'before' ? word + inputWord : inputWord + word;
        
        // Random orbit positioning with better distribution
        // Distribute 3 words roughly 120 degrees apart to avoid overlap
        const baseAngle = (index * (Math.PI * 2 / 3));
        const angle = baseAngle + (Math.random() * 0.5 - 0.25); 
        const distance = 250 + Math.random() * 100; // Increased distance for larger text
        const x = Math.cos(angle) * distance;
        const y = Math.sin(angle) * distance;
        
        marg.style.left = `calc(50% + ${x}px)`;
        marg.style.top = `calc(50% + ${y}px)`;
        marg.style.transform = 'translate(-50%, -50%)';
        
        orbitContainer.appendChild(marg);
        
        // Staggered fade in
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

// Focus on input initially
window.onload = () => wordInput.focus();
