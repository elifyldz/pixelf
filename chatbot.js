// Chatbot functionality with OpenAI integration
let chatHistory = [];
let isTyping = false;

// OpenAI API Key - 
const OPENAI_API_KEY = 'your_new_openai_api_key_here'; 

// API Key kontrolü
function checkOpenAIKey() {
    if (!OPENAI_API_KEY || OPENAI_API_KEY === 'your_new_openai_api_key_here') {
        console.warn('⚠️ OpenAI API key not configured, using mock AI');
        return false;
    }
    return true;
}

// Mock AI responses - backup olarak kalacak
const aiResponses = {
    // Selamlama
    greetings: {
        patterns: ['merhaba', 'selam', 'hey', 'hi', 'hello', 'günaydın', 'iyi günler'],
        responses: [
            "Merhaba! 👋 Ben Pixel, senin AI asistanın! Bugün sana nasıl yardımcı olabilirim?",
            "Selam! 🎮 Pixelf ile ilgili herhangi bir sorun var mı?",
            "Hey! 🤖 Not alma, takvim planlama veya başka bir konuda yardım edebilirim!"
        ]
    },

    // Not işlemleri
    notes: {
        patterns: ['not', 'yazı', 'belge', 'sayfa', 'yeni not', 'not oluştur', 'not ekle'],
        responses: [
            "📝 Yeni not oluşturmak için sol üst köşedeki '📝 Yeni Sayfa' butonuna tıklayabilirsin! Hangi konuda not almak istiyorsun?",
            "📋 Not işlemleri için şunları yapabilirsin:\n• Yeni not oluştur\n• Mevcut notları düzenle\n• Notları gruplara ayır\n• AI ile özet çıkar",
            "💡 İpucu: Notlarını etiketleyerek daha kolay bulabilirsin! Hangi etiketleri kullanmak istiyorsun?"
        ]
    },

    // Takvim işlemleri
    calendar: {
        patterns: ['takvim', 'etkinlik', 'toplantı', 'randevu', 'tarih', 'saat', 'program'],
        responses: [
            "📅 Takvim için sağdaki bölümü kullanabilirsin! Yeni etkinlik eklemek için '➕ Etkinlik Ekle' butonuna tıkla.",
            "🗓️ Takvim özellikleri:\n• Etkinlik ekleme\n• Aylık görünüm\n• Notları etkinliklerle bağlama\n• Hatırlatıcılar",
            "📆 Hangi tarih için etkinlik planlamak istiyorsun? Ben sana yardımcı olabilirim!"
        ]
    },

    // AI özellikleri
    ai: {
        patterns: ['ai', 'yapay zeka', 'özet', 'özetleme', 'analiz', 'gpt', 'chatbot'],
        responses: [
            "🤖 AI özelliklerim:\n• Not özetleme\n• Başlık önerme\n• Etiket çıkarma\n• Akıllı arama\n• Verimlilik ipuçları",
            "✨ Bir notun özetini çıkarmak için, notu seç ve üst bardan '🤖 AI Özet' butonuna tıkla!",
            "🧠 AI analizi ile notlarının kelime sayısını, ana konularını ve önerilen etiketleri görebilirsin!"
        ]
    },

    // Dosya işlemleri
    files: {
        patterns: ['dosya', 'yükle', 'upload', 'pdf', 'word', 'txt', 'belge yükle'],
        responses: [
            "📎 Dosya yüklemek için üst bardan '📎 Dosya Yükle' butonunu kullan! TXT, DOC, PDF formatlarını destekliyorum.",
            "📄 Yüklediğin dosyalar otomatik olarak not haline gelir ve AI ile analiz edilir!",
            "💾 Desteklenen formatlar: .txt, .doc, .docx, .pdf - Hangi dosyayı yüklemek istiyorsun?"
        ]
    },

    // Kısayollar ve ipuçları
    help: {
        patterns: ['yardım', 'help', 'nasıl', 'kısayol', 'özellik', 'ipucu', 'kullanım'],
        responses: [
            "🔥 Pixelf İpuçları:\n• Ctrl+N: Yeni not\n• Ctrl+S: Kaydet\n• Ctrl+F: Ara\n• Tab: Gruplar arası geçiş",
            "💡 Verimlilik İpuçları:\n• Notlarını gruplandır\n• Etiket kullan\n• AI özetlerden yararlan\n• Takvim ile entegre et",
            "🎯 Hangi konuda yardım istiyorsun? Not alma, takvim, AI özellikleri veya başka bir şey?"
        ]
    },

    // Varsayılan cevaplar
    default: [
        "🤔 Bu konuda tam emin değilim. Şu konularda yardımcı olabilirim:\n• 📝 Not işlemleri\n• 📅 Takvim planlama\n• 🤖 AI özellikleri\n• 💡 Kullanım ipuçları",
        "🎮 Başka bir şekilde sorabilir misin? Ben şu konularda uzmanım: notlar, takvim, AI analizi ve verimlilik ipuçları!",
        "💭 Tam anlayamadım. 'Yardım' yazarak tüm özelliklerimi görebilirsin!",
        "🔍 Aradığın cevabı bulamadım. Daha spesifik sorular sorabilirsin: 'Yeni not nasıl oluştururum?' gibi."
    ]
};

// Initialize chatbot
function initializeChatbot() {
    const chatbotInput = document.getElementById('chatbotInput');
    
    if (chatbotInput) {
        // Enter key support
        chatbotInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });
    }

    // Setup chatbot toggle button
    const chatbotToggle = document.getElementById('chatbotToggle');
    if (chatbotToggle) {
        // Remove any existing listeners
        chatbotToggle.onclick = null;
        
        // Add new click listener
        chatbotToggle.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            toggleChatbot();
        });
    }

    // Load chat history from localStorage
    loadChatHistory();
    
    console.log('🤖 Chatbot initialized successfully!');
}

// Send message function - now async for OpenAI
async function sendMessage() {
    const input = document.getElementById('chatbotInput');
    const message = input.value.trim();
    
    if (!message || isTyping) return;
    
    // Clear input
    input.value = '';
    
    // Add user message
    addMessage(message, 'user');
    
    // Show typing indicator
    showTypingIndicator();
    
    try {
        // Generate AI response (now async)
        const response = await generateAIResponse(message);
        
        // Hide typing indicator
        hideTypingIndicator();
        
        // Add AI response
        addMessage(response, 'bot');
        
        // Save to history
        saveChatHistory();
        
    } catch (error) {
        console.error('Send message error:', error);
        hideTypingIndicator();
        
        // Fallback response
        addMessage('🤖 Üzgünüm, şu anda bir sorun yaşıyorum. Tekrar dener misin?', 'bot');
    }
}

// Add message to chat
function addMessage(content, sender) {
    const messagesContainer = document.getElementById('chatbotMessages');
    if (!messagesContainer) return;
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}`;
    
    const currentTime = new Date().toLocaleTimeString('tr-TR', { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
    
    messageDiv.innerHTML = `
        <div class="message-content">${content}</div>
        <div class="message-time">${currentTime}</div>
    `;
    
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    
    // Add to history
    chatHistory.push({
        content: content,
        sender: sender,
        timestamp: new Date().toISOString()
    });
    
    // Animation
    messageDiv.style.opacity = '0';
    messageDiv.style.transform = 'translateY(10px)';
    setTimeout(() => {
        messageDiv.style.transition = 'all 0.3s ease';
        messageDiv.style.opacity = '1';
        messageDiv.style.transform = 'translateY(0)';
    }, 10);
}

// Show typing indicator
function showTypingIndicator() {
    if (isTyping) return;
    isTyping = true;
    
    const messagesContainer = document.getElementById('chatbotMessages');
    if (!messagesContainer) return;
    
    const typingDiv = document.createElement('div');
    typingDiv.className = 'message bot';
    typingDiv.id = 'typingIndicator';
    
    typingDiv.innerHTML = `
        <div class="typing-indicator">
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
        </div>
    `;
    
    messagesContainer.appendChild(typingDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Hide typing indicator
function hideTypingIndicator() {
    const typingIndicator = document.getElementById('typingIndicator');
    if (typingIndicator) {
        typingIndicator.remove();
    }
    isTyping = false;
}

// Generate AI response with OpenAI integration
async function generateAIResponse(userMessage) {
    // API key kontrolü
    if (!checkOpenAIKey()) {
        console.log('OpenAI API key not configured, using mock AI');
        return generateMockAIResponse(userMessage);
    }

    try {
        // Kullanıcı context'i oluştur
        const userContext = `Kullanıcının ${noteGroups ? noteGroups.reduce((total, group) => total + group.notes.length, 0) : 0} notu var, ${noteGroups ? noteGroups.length : 0} grup kullanıyor. Seçili not: ${selectedNote ? selectedNote.title : 'Yok'}`;
        
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${OPENAI_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'gpt-3.5-turbo',
                messages: [
                    {
                        role: 'system',
                        content: `Sen Pixelf uygulamasının AI asistanı Pixel'sin! 🎮

GÖREVIN:
- Pixelf özelliklerini öğretmek
- Not alma ve takvim konusunda yardım etmek  
- Kısa, samimi, yararlı cevaplar vermek (maksimum 3-4 satır)
- Emoji kullanarak eğlenceli olmak

PIXELF ÖZELLİKLERİ:
📝 NOT İŞLEMLERİ:
• "Yeni Sayfa" butonu ile not oluşturma
• Notları gruplara ayırma  
• Etiket sistemi
• "AI Özet" ile otomatik özetleme

📅 TAKVİM:
• "Etkinlik Ekle" butonu
• Aylık takvim görünümü
• Notları etkinliklerle bağlama

📎 DOSYA:
• "Dosya Yükle" ile TXT, DOC, PDF yükleme
• Otomatik not dönüşümü

⌨️ KISAYOLLAR:
• Ctrl+N: Yeni not
• Ctrl+S: Kaydet  
• Ctrl+F: Ara

KURALLAR:
- Maksimum 3-4 satır cevap ver
- Emoji kullan 🎮✨📝📅
- "Sen" diye hitap et
- Pratik ipuçları ver
- Samimi ol

Kullanıcı durumu: ${userContext}`
                    },
                    {
                        role: 'user',
                        content: userMessage
                    }
                ],
                max_tokens: 200,
                temperature: 0.7,
                frequency_penalty: 0.3,
                presence_penalty: 0.3
            })
        });

        if (!response.ok) {
            throw new Error(`OpenAI API error: ${response.status} - ${response.statusText}`);
        }

        const data = await response.json();
        const aiResponse = data.choices[0]?.message?.content;

        if (!aiResponse) {
            throw new Error('No response from OpenAI');
        }

        console.log('✅ OpenAI response received');
        return aiResponse;

    } catch (error) {
        console.error('OpenAI API error:', error);
        console.log('🔄 Falling back to mock AI');
        
        // Hata durumunda mock AI'ya geç
        return generateMockAIResponse(userMessage);
    }
}

// Backup Mock AI fonksiyonu 
function generateMockAIResponse(userMessage) {
    const message = userMessage.toLowerCase();
    
    // Pattern matching
    for (const [category, data] of Object.entries(aiResponses)) {
        if (category === 'default') continue;
        
        for (const pattern of data.patterns) {
            if (message.includes(pattern)) {
                const responses = data.responses;
                return responses[Math.floor(Math.random() * responses.length)];
            }
        }
    }
    
    // Varsayılan cevap
    const defaultResponses = aiResponses.default;
    return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
}

// Toggle chatbot visibility
function toggleChatbot() {
    const chatbot = document.getElementById('chatbotContainer');
    const toggle = document.getElementById('chatbotToggle');
    
    if (!chatbot) {
        console.error('Chatbot container not found!');
        return;
    }
    
    console.log('🤖 Toggling chatbot...');
    
    chatbot.classList.toggle('active');
    
    if (toggle) {
        toggle.classList.toggle('chat-open');
    }
    
    // Focus input when opened
    if (chatbot.classList.contains('active')) {
        setTimeout(() => {
            const input = document.getElementById('chatbotInput');
            if (input) {
                input.focus();
            }
        }, 100);
        console.log('✅ Chatbot opened');
    } else {
        console.log('✅ Chatbot closed');
    }
}

// Save chat history to localStorage
function saveChatHistory() {
    try {
        localStorage.setItem('pixelf_chat_history', JSON.stringify(chatHistory));
    } catch (e) {
        console.log('Could not save chat history:', e);
    }
}

// Load chat history from localStorage
function loadChatHistory() {
    try {
        const saved = localStorage.getItem('pixelf_chat_history');
        if (saved) {
            chatHistory = JSON.parse(saved);
            
            // Restore messages (son 20 mesaj)
            const recentHistory = chatHistory.slice(-20);
            const messagesContainer = document.getElementById('chatbotMessages');
            
            if (messagesContainer) {
                // Clear existing messages except welcome
                const welcomeMessage = messagesContainer.querySelector('.message.bot');
                messagesContainer.innerHTML = '';
                if (welcomeMessage) {
                    messagesContainer.appendChild(welcomeMessage);
                }
                
                // Add saved messages
                recentHistory.forEach(msg => {
                    if (msg.content) {
                        addMessage(msg.content, msg.sender);
                    }
                });
            }
        }
    } catch (e) {
        console.log('Could not load chat history:', e);
    }
}

// Test function for debugging
function testChatbot() {
    console.log('🧪 Testing chatbot...');
    console.log('Container:', document.getElementById('chatbotContainer'));
    console.log('Toggle:', document.getElementById('chatbotToggle'));
    console.log('Input:', document.getElementById('chatbotInput'));
    console.log('API Key configured:', checkOpenAIKey());
    
    if (typeof toggleChatbot === 'function') {
        console.log('✅ toggleChatbot function available');
        toggleChatbot();
    } else {
        console.error('❌ toggleChatbot function not found');
    }
}

// Global test function
window.testChatbot = testChatbot;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('🎮 Initializing Pixelf Chatbot...');
    initializeChatbot();
    
    // RAG sistemini başlat (diğer scriptler yüklendikten sonra)
    setTimeout(() => {
        initializeRAG();
    }, 1000);
});