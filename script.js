const oxymoronDatabase = {
    "小さい": ["巨人", "宇宙", "大罪", "歴史"],
    "静かな": ["絶叫", "爆発", "喧騒", "銃声"],
    "明るい": ["闇", "絶望", "孤独", "監獄"],
    "優しい": ["殺意", "拷問", "拒絶", "兵器"]
};

const inputView = document.getElementById('input-view');
const displayView = document.getElementById('display-view');
const wordInput = document.getElementById('word-input');
const outputPrefix = document.getElementById('output-prefix');
const outputWord = document.getElementById('output-word');
const marg1 = document.getElementById('marg-1');
const marg2 = document.getElementById('marg-2');
const marg3 = document.getElementById('marg-3');
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

        let results = oxymoronDatabase[input];

        if (!results) {
            inputView.style.opacity = '0.5';
            inputView.style.pointerEvents = 'none';
            results = await fetchGeminiOxymoron(input);
        }

        if (results && results.length >= 4) {
            showOxymoron(input, results);
        } else {
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

    const prompt = `ユーザーが入力した単語【${inputWord}】に対して、意味が対極にあり、かつ組み合わせた時に構造的完成度が高いオクシモロン（矛盾語法）を作るための【対極の単語のみ（名詞など）】を4つ、純粋なJSON配列形式（例：["苦痛", "絶望", "地獄", "悲劇"]）だけで返却してください。絶対に『${inputWord}』という入力語自体を含めた完成形を返さないでください。余計な解説文やマークダウンの装飾も一切不要です`;

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash
            22:generateContent?key=${apiKey}`, {
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
        alert("APIリクエスト中にエラーが発生しました: " + err.message);
        return null;
    }
}

function showOxymoron(prefix, words) {
    outputPrefix.textContent = prefix;
    outputWord.textContent = words[0];
    
    marg1.textContent = prefix + words[1];
    marg2.textContent = prefix + words[2];
    marg3.textContent = prefix + words[3];

    inputView.style.opacity = '0';
    setTimeout(() => {
        inputView.style.display = 'none';
        displayView.style.display = 'flex';
        displayView.classList.add('fade-in');
    }, 800);
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
    }, 800);
}

// Focus on input initially
window.onload = () => wordInput.focus();
