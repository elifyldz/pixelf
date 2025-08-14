// Document Processor - Belge işleme ve chunk'lama
class DocumentProcessor {
    constructor() {
        this.chunkSize = 500; // Chunk boyutu (kelime)
        this.chunkOverlap = 50; // Overlap (kelime)
    }

    // Ana işleme fonksiyonu
    async processDocument(file) {
        try {
            console.log('📄 Belge işleniyor:', file.name);
            
            const content = await this.extractText(file);
            const chunks = this.createChunks(content);
            const metadata = this.extractMetadata(file, content);
            
            const document = {
                id: this.generateDocId(),
                name: file.name,
                type: file.type,
                size: file.size,
                content: content,
                chunks: chunks,
                metadata: metadata,
                processedAt: new Date().toISOString()
            };
            
            console.log('✅ Belge işlendi:', document.chunks.length, 'chunk oluşturuldu');
            return document;
            
        } catch (error) {
            console.error('❌ Belge işleme hatası:', error);
            throw error;
        }
    }

    // Dosyadan metin çıkarma
    async extractText(file) {
        const fileName = file.name.toLowerCase();
        
        if (fileName.endsWith('.txt')) {
            return await this.readTextFile(file);
        } else if (fileName.endsWith('.pdf')) {
            return await this.readPDFFile(file);
        } else if (fileName.endsWith('.doc') || fileName.endsWith('.docx')) {
            return await this.readWordFile(file);
        } else {
            // Varsayılan text okuma
            return await this.readTextFile(file);
        }
    }

    // Text dosyası okuma
    readTextFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = e => resolve(e.target.result);
            reader.onerror = reject;
            reader.readAsText(file, 'UTF-8');
        });
    }

    // PDF okuma (basit)
    readPDFFile(file) {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = function(e) {
                try {
                    const text = e.target.result;
                    // PDF'den basit text extraction
                    const lines = text.split('\n');
                    const cleanText = lines
                        .filter(line => line.trim().length > 0)
                        .join('\n')
                        .replace(/[^\x20-\x7E\u00A0-\u00FF\u0100-\u017F\u0180-\u024F]/g, ' ')
                        .replace(/\s+/g, ' ')
                        .trim();
                    
                    resolve(cleanText || 'PDF içeriği okunamadı.');
                } catch (error) {
                    resolve('PDF formatı desteklenmiyor.');
                }
            };
            reader.readAsText(file, 'UTF-8');
        });
    }

    // Word dosyası okuma (basit)
    readWordFile(file) {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = function(e) {
                try {
                    const arrayBuffer = e.target.result;
                    const text = String.fromCharCode.apply(null, new Uint8Array(arrayBuffer));
                    const cleanText = text
                        .replace(/[^\x20-\x7E\u00A0-\u00FF\u0100-\u017F\u0180-\u024F]/g, ' ')
                        .replace(/\s+/g, ' ')
                        .trim();
                    
                    resolve(cleanText || 'Word dosyası içeriği okunamadı.');
                } catch (error) {
                    resolve('Word dosyası formatı desteklenmiyor.');
                }
            };
            reader.readAsArrayBuffer(file);
        });
    }

    // Metni chunk'lara böl
    createChunks(text) {
        const words = text.split(' ');
        const chunks = [];
        
        for (let i = 0; i < words.length; i += this.chunkSize - this.chunkOverlap) {
            const chunkWords = words.slice(i, i + this.chunkSize);
            const chunk = {
                id: chunks.length,
                content: chunkWords.join(' '),
                startIndex: i,
                endIndex: Math.min(i + this.chunkSize, words.length),
                wordCount: chunkWords.length
            };
            chunks.push(chunk);
            
            // Son chunk ise dur
            if (i + this.chunkSize >= words.length) break;
        }
        
        return chunks;
    }

    // Metadata çıkar
    extractMetadata(file, content) {
        const words = content.split(' ').length;
        const lines = content.split('\n').length;
        const characters = content.length;
        
        return {
            fileName: file.name,
            fileType: file.type,
            fileSize: file.size,
            wordCount: words,
            lineCount: lines,
            characterCount: characters,
            readingTime: Math.ceil(words / 200), // dakika
            language: this.detectLanguage(content),
            topics: this.extractTopics(content)
        };
    }

    // Basit dil tespit
    detectLanguage(text) {
        const turkishWords = ['ve', 'bir', 'bu', 'için', 'ile', 'olan', 'var', 'olan'];
        const englishWords = ['the', 'and', 'for', 'are', 'but', 'not', 'you', 'all'];
        
        const words = text.toLowerCase().split(' ').slice(0, 100);
        
        const turkishCount = words.filter(word => turkishWords.includes(word)).length;
        const englishCount = words.filter(word => englishWords.includes(word)).length;
        
        return turkishCount > englishCount ? 'tr' : 'en';
    }

    // Konu çıkarma
    extractTopics(text) {
        const words = text.toLowerCase()
            .replace(/[^\w\sğüşıöçĞÜŞIÖÇ]/g, '')
            .split(' ')
            .filter(word => word.length > 4);
        
        const frequency = {};
        words.forEach(word => {
            frequency[word] = (frequency[word] || 0) + 1;
        });
        
        return Object.keys(frequency)
            .sort((a, b) => frequency[b] - frequency[a])
            .slice(0, 5);
    }

    // Unique ID oluştur
    generateDocId() {
        return 'doc_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    // Chunk arama
    searchChunks(document, query) {
        const queryWords = query.toLowerCase().split(' ');
        const results = [];
        
        document.chunks.forEach(chunk => {
            let score = 0;
            const chunkText = chunk.content.toLowerCase();
            
            queryWords.forEach(word => {
                const regex = new RegExp(word, 'gi');
                const matches = chunkText.match(regex);
                if (matches) {
                    score += matches.length;
                }
            });
            
            if (score > 0) {
                results.push({
                    chunk: chunk,
                    score: score,
                    relevance: score / queryWords.length
                });
            }
        });
        
        return results.sort((a, b) => b.score - a.score);
    }

    // Belge özeti
    async generateDocumentSummary(content, apiKey) {
        if (!apiKey || content.length < 100) {
            return this.generateBasicSummary(content);
        }

        try {
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: 'gpt-3.5-turbo',
                    messages: [
                        {
                            role: 'system',
                            content: 'Bu belgenin ana konularını ve önemli noktalarını özetle. Maksimum 3 paragraf yaz.'
                        },
                        {
                            role: 'user',
                            content: `Bu belgeyi özetle: ${content.substring(0, 3000)}`
                        }
                    ],
                    max_tokens: 300,
                    temperature: 0.3
                })
            });

            const data = await response.json();
            return data.choices[0]?.message?.content || this.generateBasicSummary(content);

        } catch (error) {
            console.error('Document summary error:', error);
            return this.generateBasicSummary(content);
        }
    }

    generateBasicSummary(content) {
        const sentences = content.split('.').filter(s => s.trim().length > 20);
        const firstSentences = sentences.slice(0, 3).join('. ');
        return firstSentences || 'Belge özeti oluşturulamadı.';
    }
}

// Global olarak kullanılabilir hale getir
window.DocumentProcessor = DocumentProcessor;