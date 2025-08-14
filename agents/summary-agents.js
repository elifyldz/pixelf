// Summary Agent - Not özetleme ve analiz
class SummaryAgent {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.name = "Summary Agent";
        this.description = "Notları özetler, ana konuları çıkarır ve etiket önerir";
    }

    // Not özetleme
    async summarizeNote(noteContent) {
        if (!this.apiKey || this.apiKey === 'your_openai_api_key_here') {
            return this.generateMockSummary(noteContent);
        }

        try {
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: 'gpt-3.5-turbo',
                    messages: [
                        {
                            role: 'system',
                            content: `Sen bir not özetleme uzmanısın. Verilen notu:
                            1. Kısa ve öz bir şekilde özetle (max 3 cümle)
                            2. Ana konuları madde halinde listele
                            3. 3-5 adet etiket öner
                            4. Notun kategorisini belirle (kişisel, iş, eğitim, vs.)
                            
                            Cevabını JSON formatında ver:
                            {
                                "summary": "özet",
                                "mainTopics": ["konu1", "konu2"],
                                "suggestedTags": ["etiket1", "etiket2"],
                                "category": "kategori",
                                "wordCount": sayı,
                                "readingTime": "X dakika"
                            }`
                        },
                        {
                            role: 'user',
                            content: `Bu notu analiz et: ${noteContent}`
                        }
                    ],
                    max_tokens: 300,
                    temperature: 0.3
                })
            });

            const data = await response.json();
            const aiResponse = data.choices[0]?.message?.content;
            
            try {
                return JSON.parse(aiResponse);
            } catch (e) {
                // JSON parse edilemezse basit format döndür
                return {
                    summary: aiResponse || "Özet oluşturulamadı",
                    mainTopics: ["genel"],
                    suggestedTags: ["not"],
                    category: "genel",
                    wordCount: noteContent.split(' ').length,
                    readingTime: Math.ceil(noteContent.split(' ').length / 200) + " dakika"
                };
            }

        } catch (error) {
            console.error('Summary Agent Error:', error);
            return this.generateMockSummary(noteContent);
        }
    }

    // Başlık önerisi
    async suggestTitle(noteContent) {
        if (!this.apiKey || this.apiKey === 'your_openai_api_key_here') {
            return this.generateMockTitle(noteContent);
        }

        try {
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: 'gpt-3.5-turbo',
                    messages: [
                        {
                            role: 'system',
                            content: 'Verilen not içeriğine uygun, kısa ve açıklayıcı bir başlık öner. Sadece başlığı döndür, başka açıklama yapma.'
                        },
                        {
                            role: 'user',
                            content: `Bu not için başlık öner: ${noteContent.substring(0, 500)}`
                        }
                    ],
                    max_tokens: 50,
                    temperature: 0.7
                })
            });

            const data = await response.json();
            return data.choices[0]?.message?.content || this.generateMockTitle(noteContent);

        } catch (error) {
            console.error('Title suggestion error:', error);
            return this.generateMockTitle(noteContent);
        }
    }

    // Mock functions (fallback)
    generateMockSummary(content) {
        const wordCount = content.split(' ').length;
        const sentences = content.split('.').filter(s => s.trim().length > 10);
        const keyPoints = sentences.slice(0, 2);
        
        return {
            summary: `Bu not ${keyPoints.join(' ')} konularını içeriyor.`,
            mainTopics: this.extractKeywords(content).slice(0, 3),
            suggestedTags: this.generateMockTags(content),
            category: this.guessCategory(content),
            wordCount: wordCount,
            readingTime: Math.ceil(wordCount / 200) + " dakika"
        };
    }

    generateMockTitle(content) {
        const firstSentence = content.split('.')[0];
        if (firstSentence && firstSentence.length > 10) {
            return firstSentence.substring(0, 50) + (firstSentence.length > 50 ? '...' : '');
        }
        return "Yeni Not";
    }

    generateMockTags(content) {
        const words = content.toLowerCase().split(' ');
        const commonTags = ['proje', 'geliştirme', 'plan', 'ai', 'teknoloji', 'not', 'önemli', 'toplantı', 'görev'];
        return commonTags.filter(tag => 
            words.some(word => word.includes(tag))
        ).slice(0, 3);
    }

    extractKeywords(content) {
        const words = content.toLowerCase()
            .replace(/[^\w\sğüşıöçĞÜŞIÖÇ]/g, '')
            .split(' ')
            .filter(word => word.length > 3);
        
        const frequency = {};
        words.forEach(word => {
            frequency[word] = (frequency[word] || 0) + 1;
        });
        
        return Object.keys(frequency)
            .sort((a, b) => frequency[b] - frequency[a])
            .slice(0, 5);
    }

    guessCategory(content) {
        const text = content.toLowerCase();
        
        if (text.includes('toplantı') || text.includes('proje') || text.includes('iş')) {
            return 'iş';
        } else if (text.includes('ders') || text.includes('öğren') || text.includes('eğitim')) {
            return 'eğitim';
        } else if (text.includes('alışveriş') || text.includes('liste') || text.includes('hatırla')) {
            return 'günlük';
        } else {
            return 'kişisel';
        }
    }

    // Agent bilgileri
    getInfo() {
        return {
            name: this.name,
            description: this.description,
            capabilities: [
                'Not özetleme',
                'Ana konu çıkarma',
                'Etiket önerisi',
                'Kategori belirleme',
                'Başlık önerisi',
                'Okuma süresi hesaplama'
            ],
            status: this.apiKey ? 'Aktif (OpenAI)' : 'Aktif (Mock)'
        };
    }
}

// Global olarak kullanılabilir hale getir
window.SummaryAgent = SummaryAgent;