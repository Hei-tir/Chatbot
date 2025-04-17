require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');
const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require('@google/generative-ai');

const app = express();
const port = 3000;
const apiKey = process.env.GEMINI_API_KEY; // Chave de API do Gemini
if (!apiKey) {
    console.error("Erro: Chave de API do Gemini não encontrada. Verifique seu arquivo .env e a variável GEMINI_API_KEY.");
    process.exit(1); // Encerra se a chave não for encontrada
}

const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash", // Ou outro modelo como "gemini-pro"
    // Opcional: Ajustes de segurança (veja a documentação do Google AI)
    // safetySettings: [
    //   { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    //   { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    // ],
});


// Middleware to parse JSON bodies
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));
async function getGeminiResponse(userMessage) {
    try {
        const prompt = `Você é a Namorada do usuario, responda a mensagem de forma consiça e coerrente:\n\nUsuário: ${userMessage}\nAssistente:`;

        console.log("Enviando para Gemini:", prompt); // Log para depuração

        const result = await model.generateContent(prompt); // Usando o prompt com contexto
        const response = result.response;
        const text = response.text();

        console.log("Resposta do Gemini:", text); // Log para depuração
        return text;

    } catch (error) {
        console.error("Erro ao chamar a API do Gemini:", error);

        // Verifica se o erro é devido a bloqueio de segurança
        if (error.message.includes('SAFETY')) {
            return "Desculpe, não posso responder a isso devido às políticas de segurança.";
        }
        // Outros erros
        return "Desculpe, ocorreu um erro ao tentar processar sua mensagem. Tente novamente mais tarde.";
    }
}
app.get('/', (req, res) => {
    res.send('Servidor do Chatbot (com Gemini) está no ar! Envie POST para /chat.');
});

// Endpoint to handle chat messages
app.post('/chat', async (req, res) => {
    const mensagemUsuario = req.body.mensagem;

    console.log('Mensagem recebida do frontend:', mensagemUsuario);

    if (!mensagemUsuario) {
        return res.status(400).json({ error: 'Message is required' });
    }

    // Process the message (placeholder logic)
    const respostaBot = await getGeminiResponse(mensagemUsuario);

    res.json({ resposta: respostaBot });
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
