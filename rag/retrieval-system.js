// RAG System - Retrieval Augmented Generation ana sistemi
class RAGSystem {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.documentProcessor = new DocumentProcessor();
        this.vectorStore = new VectorStore();
        this.name = "RAG System";
        this.maxContextLength = 3000; // Token limiti
    }

    // Belge yükle ve işle
    async uploadDocument(file) {
        try {
            console.log('📄 RAG: Belge yükleniyor...', file.name);
            
            // Belgeyi işle
            const processedDoc = await this.documentProcessor.processDocument(file);
            
            // Vector store'a ekle
            const success = this.vectorStore.addDocument(processedDoc);
            
            if (success) {
                console.log('✅ RAG: Belge başarıyla yüklendi ve indekslendi');
                return {
                    success: true,
                    document: processedDoc,
                    message: `"${file.name}" başarıyla yüklendi ve ${processedDoc.chunks.length} parçaya bölündü.`
                };
            } else {
                throw new Error('Vector store\'a eklenemedi');
            }
            
        } catch (error) {
            console.error('❌ RAG: Belge yükleme hatası:', error);
            return {
                success: false,
                error: error.message,
                message: 'Belge yüklenirken hata oluştu.'
            };
        }
    }

    // RAG sorgu sistemi
    async query(question, documentId = null) {
        try {
            console.log('🔍 RAG Query:', question);
            
            // İlgili belge parçalarını bul
            const relevantChunks = documentId 
                ? this.vectorStore.searchInDocument(documentId, question, 5)
                : this.vectorStore.semanticSearch(question, 5);
            
            if (relevantChunks.length === 0) {
                return {
                    success: false,
                    message: 'Bu soruyla ilgili bilgi bulunamadı.',
                    sources: []
                };
            }
            
            // Context oluştur
            const context = this.buildContext(relevantChunks);
            
            // OpenAI ile cevap üret
            const answer = await this.generateAnswer(question, context);
            
            return {
                success: true,
                answer: answer,
                sources: relevantChunks.map(chunk => ({
                    documentName: chunk.documentName || 'Bilinmeyen',
                    content: chunk.content.substring(0, 200) + '...',
                    score: chunk.score
                })),
                context: context.substring(0, 500) + '...'
            };
            
        } catch (error) {
            console.error('❌ RAG Query Error:', error);
            return {
                success: false,
                message: 'Sorgu işlenirken hata oluştu.',
                error: error.message
            };
        }
    }

    // Context oluştur
    buildContext(chunks) {
        let context = '';
        let currentLength = 0;
        
        for (const chunk of chunks) {
            const chunkText = `\n\n--- Kaynak: ${chunk.documentName || 'Belge'} ---\n${chunk.content}`;
            
            if (currentLength + chunkText.length > this.maxContextLength) {
                break;
            }
            
            context += chunkText;
            currentLength += chunkText.length;
        }
        
        return context;
    }

    // OpenAI ile cevap üret
    async generateAnswer(question, context) {
        if (!this.apiKey || this.apiKey === 'your_openai_api_key_here') {
            return this.generateMockAnswer(question, context);
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
                            content: `Sen bir belge analiz asistanısın. Verilen belgelerden yararlanarak soruları cevapla.

KURALLAR:
1. Sadece verilen belgelerden bilgi kullan
2. Bilgi belgede yoksa "Bu bilgi belgelerde mevcut değil" de
3. Cevabını kaynaklarla destekle
4. Kısa ve öz cevap ver
5. Türkçe cevap ver

BELGELER:
${context}`
                        },
                        {
                            role: 'user',
                            content: question
                        }
                    ],
                    max_tokens: 500,
                    temperature: 0.3
                })
            });

            const data = await response.json();
            return data.choices[0]?.message?.content || this.generateMockAnswer(question, context);

        } catch (error) {
            console.error('OpenAI RAG error:', error);
            return this.generateMockAnswer(question, context);
        }
    }

    // Mock cevap (fallback)
    generateMockAnswer(question, context) {
        const contextWords = context.toLowerCase().split(' ');
        const questionWords = question.toLowerCase().split(' ');
        
        const matches = questionWords.filter(word => 
            contextWords.some(cWord => cWord.includes(word))
        );
        
        if (matches.length > 0) {
            return `Bu soruyla ilgili bilgileri belgelerinizde buldum. "${matches.join(', ')}" konularında bilgi mevcut. Detaylı cevap için OpenAI API key'inizi yapılandırın.`;
        } else {
            return 'Bu soruyla ilgili doğrudan bilgi bulunamadı. Sorunuzu farklı kelimelerle sormayı deneyin.';
        }
    }

    // Belge listesi
    getDocuments() {
        return this.vectorStore.getAllDocuments().map(doc => ({
            id: doc.id,
            name: doc.name,
            type: doc.type,
            size: doc.size,
            wordCount: doc.metadata.wordCount,
            chunkCount: doc.chunks.length,
            processedAt: doc.processedAt,
            topics: doc.metadata.topics
        }));
    }

    // Belge sil
    deleteDocument(documentId) {
        return this.vectorStore.removeDocument(documentId);
    }

    // Belge detayları
    getDocumentDetails(documentId) {
        const document = this.vectorStore.getDocument(documentId);
        if (!document) return null;
        
        return {
            id: document.id,
            name: document.name,
            metadata: document.metadata,
            chunkCount: document.chunks.length,
            sampleContent: document.content.substring(0, 500) + '...',
            topics: document.metadata.topics,
            processedAt: document.processedAt
        };
    }

    // Sistem istatistikleri
    getSystemStats() {
        const vectorStats = this.vectorStore.getStats();
        
        return {
            name: this.name,
            status: this.apiKey ? 'Aktif (OpenAI)' : 'Aktif (Mock)',
            ...vectorStats,
            capabilities: [
                'Belge yükleme (PDF, Word, TXT)',
                'Otomatik chunk\'lama',
                'Semantic arama',
                'Context-aware cevaplar',
                'Çoklu belge desteği'
            ]
        };
    }

    // Belge önerisi
    getSimilarDocuments(documentId) {
        return this.vectorStore.suggestSimilarDocuments(documentId);
    }

    // Arama geçmişi (basit)
    addToSearchHistory(query, results) {
        const history = this.getSearchHistory();
        history.unshift({
            query: query,
            timestamp: new Date().toISOString(),
            resultCount: results.length,
            hasResults: results.length > 0
        });
        
        // Son 50 aramayı tut
        if (history.length > 50) {
            history.splice(50);
        }
        
        localStorage.setItem('pixelf_rag_search_history', JSON.stringify(history));
    }

    getSearchHistory() {
        try {
            const history = localStorage.getItem('pixelf_rag_search_history');
            return history ? JSON.parse(history) : [];
        } catch (e) {
            return [];
        }
    }

    clearSearchHistory() {
        localStorage.removeItem('pixelf_rag_search_history');
    }

    // Sistem temizleme
    clearAllData() {
        this.vectorStore.clearStorage();
        this.clearSearchHistory();
        console.log('🗑️ RAG: Tüm veriler temizlendi');
    }

    // Batch belge yükleme
    async uploadMultipleDocuments(files) {
        const results = [];
        
        for (const file of files) {
            const result = await this.uploadDocument(file);
            results.push({
                fileName: file.name,
                success: result.success,
                message: result.message
            });
        }
        
        return results;
    }

    // Belge içerik güncelleme
    async updateDocument(documentId, newContent) {
        try {
            const existingDoc = this.vectorStore.getDocument(documentId);
            if (!existingDoc) {
                throw new Error('Belge bulunamadı');
            }
            
            // Yeni chunks oluştur
            const newChunks = this.documentProcessor.createChunks(newContent);
            
            // Belgeyi güncelle
            existingDoc.content = newContent;
            existingDoc.chunks = newChunks;
            existingDoc.metadata.wordCount = newContent.split(' ').length;
            existingDoc.processedAt = new Date().toISOString();
            
            // Vector store'u güncelle
            this.vectorStore.addDocument(existingDoc);
            
            return {
                success: true,
                message: 'Belge başarıyla güncellendi'
            };
            
        } catch (error) {
            return {
                success: false,
                message: error.message
            };
        }
    }
}

// Global olarak kullanılabilir hale getir
window.RAGSystem = RAGSystem;