require('dotenv').config();
const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

app.post('/api/generate', async (req, res) => {
    const { inputWord } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        return res.status(500).json({ error: "Server API Key is not configured." });
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
        
        if (data.error) {
            console.error("Gemini API Error:", data.error);
            return res.status(data.error.code || 500).json({ error: data.error.message });
        }

        let text = data.candidates[0].content.parts[0].text;
        
        // 1. レスポンスのクリーンアップ（Markdown除去）
        // ```json ... ``` や ``` ... ``` を除去し、純粋なJSONのみを抽出
        text = text.replace(/```json/g, '').replace(/```/g, '').trim();
        
        try {
            const parsedData = JSON.parse(text);
            res.json(parsedData);
        } catch (parseError) {
            console.error("JSON Parse Error:", parseError, "Raw text:", text);
            res.status(500).json({ error: "Failed to parse API response." });
        }

    } catch (err) {
        console.error("Server Error:", err);
        res.status(500).json({ error: "Internal server error." });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
