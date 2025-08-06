require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { google } = require('googleapis');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

const sheets = google.sheets('v4');

async function getGoogleSheetsAuth() {
    try {
        const credentials = {
            type: "service_account",
            project_id: process.env.GOOGLE_PROJECT_ID,
            private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID,
            private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
            client_email: process.env.GOOGLE_CLIENT_EMAIL,
            client_id: process.env.GOOGLE_CLIENT_ID,
            auth_uri: "https://accounts.google.com/o/oauth2/auth",
            token_uri: "https://oauth2.googleapis.com/token",
            auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
            client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${process.env.GOOGLE_CLIENT_EMAIL}`
        };
        
        const auth = new google.auth.GoogleAuth({
            credentials: credentials,
            scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
        });
        
        return auth;
    } catch (error) {
        console.error('Authentication error:', error);
        throw new Error('Google Sheets authentication failed');
    }
}

function findColumnIndex(headers, possibleNames) {
    for (const name of possibleNames) {
        const index = headers.findIndex(header => 
            header && header.toLowerCase().includes(name.toLowerCase())
        );
        if (index !== -1) return index;
    }
    return -1;
}

function rowToCard(headers, row) {
    const card = {};
    
    const columnMappings = {
        number: ['番号', 'number', 'No', 'カード番号'],
        name: ['名前', 'カード名', 'name', 'ポケモン名'],
        rarity: ['レアリティ', 'rarity', 'レア度'],
        type: ['タイプ', 'type', '属性'],
        description: ['説明', 'description', '効果', 'テキスト'],
        price: ['価格', 'price', '値段', '金額'],
        image: ['画像', 'image', 'URL', 'イメージ']
    };
    
    for (const [key, possibleNames] of Object.entries(columnMappings)) {
        const columnIndex = findColumnIndex(headers, possibleNames);
        card[key] = columnIndex !== -1 ? (row[columnIndex] || '') : '';
    }
    
    if (card.image && card.image.includes('IMAGE(')) {
        const match = card.image.match(/IMAGE\("([^"]+)"\)/);
        card.image = match ? match[1] : '';
    }
    
    return card;
}

app.get('/api/search', async (req, res) => {
    try {
        console.log('Request URL:', req.url);
        console.log('Query params:', req.query);
        const { query } = req.query;
        console.log('Search query:', query);
        
        if (!query) {
            return res.status(400).json({ error: '検索クエリが必要です' });
        }
        
        const auth = await getGoogleSheetsAuth();
        const spreadsheetId = process.env.SPREADSHEET_ID;
        const range = 'A:Z';
        
        const response = await sheets.spreadsheets.values.get({
            auth,
            spreadsheetId,
            range,
            valueRenderOption: 'FORMULA'
        });
        
        console.log('Sheets API response status:', response.status);
        const rows = response.data.values || [];
        console.log('Total rows received:', rows.length);
        console.log('Headers:', rows[0]);
        console.log('Sample data row:', rows[1]);
        console.log('Data row length:', rows[1]?.length);
        
        if (rows.length === 0) {
            console.log('No data found in spreadsheet');
            return res.json([]);
        }
        
        const headers = rows[0];
        const dataRows = rows.slice(1);
        
        const numberColumnIndex = findColumnIndex(headers, ['番号', 'number', 'No', 'カード番号']);
        
        if (numberColumnIndex === -1) {
            return res.status(500).json({ error: '番号列が見つかりません' });
        }
        
        const filteredCards = dataRows.filter(row => {
            const cardNumber = row[numberColumnIndex] || '';
            return cardNumber.toString().includes(query);
        });
        
        const cards = filteredCards.map(row => rowToCard(headers, row));
        
        res.json(cards);
        
    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({ error: '検索中にエラーが発生しました' });
    }
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});