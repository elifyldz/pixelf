// api/chat.js - OpenAI API endpoint
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { message, context } = req.body;

        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        if (!OPENAI_API_KEY) {
            return res.status(500).json({ error: 'OpenAI API key not configured' });
        }

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
                        content: `Sen Pixelf uygulamasının AI asistanı Pixel'sin. Pixelf bir not alma ve takvim uygulaması.

GÖREVIN:
- Kullanıcılara Pixelf özelliklerini öğretmek
- Not alma, takvim, AI özellikleri konusunda yardım etmek
- Kısa, yararlı ve samimi cevaplar vermek
- Emoji kullanarak eğlenceli olmak

PIXELF ÖZELLİKLERİ:
📝 Not Yönetimi:
- Yeni not oluşturma (sol üst "Yeni Sayfa" butonu)
- Notları gruplara ayırma
- Etiketleme sistemi
- AI ile otomatik özetleme

📅 Takvim:
- Etkinlik ekleme (sağ panel "Etkinlik Ekle")
- Aylık görünüm
- Notları etkinliklerle bağlama

🤖 AI Özellikler:
- Not özetleme ("AI Özet" butonu)
- Başlık önerme
- Etiket çıkarma
- İçerik analizi

📎 Dosya İşlemleri:
- TXT, DOC, PDF yükleme
- Otomatik not dönüşümü

⌨️ Kısayollar:
- Ctrl+N: Yeni not
- Ctrl+S: Kaydet
- Ctrl+F: Ara

KONUŞMA STİLİN:
- Samimi ve yardımsever
- Kısa cevaplar (maksimum 3-4 satır)
- Emoji kullan 🎮✨📝
- "Sen" diye hitap et
- Pratik ipuçları ver

Mevcut kullanıcı context'i: ${context || 'Yeni kullanıcı'}`
                    },
                    {
                        role: 'user',
                        content: message
                    }
                ],
                max_tokens: 300,
                temperature: 0.7,
                frequency_penalty: 0.3,
                presence_penalty: 0.3
            })
        });

        if (!response.ok) {
            throw new Error(`OpenAI API error: ${response.status}`);
        }

        const data = await response.json();
        const aiResponse = data.choices[0]?.message?.content;

        if (!aiResponse) {
            throw new Error('No response from OpenAI');
        }

        return res.status(200).json({ 
            response: aiResponse,
            usage: data.usage 
        });

    } catch (error) {
        console.error('Chat API error:', error);
        
        // Fallback to mock response
        const fallbackResponse = getFallbackResponse(req.body.message);
        
        return res.status(200).json({ 
            response: fallbackResponse,
            fallback: true,
            error: error.message 
        });
    }
}

// Fallback function for when OpenAI fails
function getFallbackResponse(message) {
    const msg = message.toLowerCase();
    
    if (msg.includes('not') || msg.includes('yazı')) {
        return "📝 Yeni not oluşturmak için sol üstteki 'Yeni Sayfa' butonunu kullan! Hangi konuda not almak istiyorsun?";
    }
    
    if (msg.includes('takvim') || msg.includes('etkinlik')) {
        return "📅 Sağdaki takvim bölümünden 'Etkinlik Ekle' butonuyla yeni etkinlik oluşturabilirsin!";
    }
    
    if (msg.includes('ai') || msg.includes('özet')) {
        return "🤖 Bir not seçip üst bardan 'AI Özet' butonuna tıklayarak otomatik özet çıkarabilirsin!";
    }
    
    return "🎮 Pixelf ile not alma, takvim planlama ve AI özellikleri kullanabilirsin! Hangi konuda yardım istiyorsun?";
}