# RAG (Retrieval Augmented Generation) Sistemi

## Genel Bakış

Pixelf'in RAG sistemi, kullanıcıların yüklediği belgelerde akıllı arama yapmasını ve bu belgelerden bilgi çıkarmasını sağlar. Sistem, belgeleri küçük parçalara böler, vektör indeksler oluşturur ve kullanıcı sorularına context-aware cevaplar verir.

## Sistem Bileşenleri

### 1. DocumentProcessor (`rag/document-processor.js`)
- **Görev**: Belge okuma ve işleme
- **Desteklenen Formatlar**: PDF, Word (.doc/.docx), TXT
- **Özellikler**:
  - Otomatik metin çıkarma
  - Chunk'lama (500 kelime, 50 kelime overlap)
  - Metadata extraction
  - Dil tespit etme
  - Konu çıkarma

### 2. VectorStore (`rag/vector-store.js`)
- **Görev**: Belge depolama ve arama indeksleme
- **Özellikler**:
  - Semantic arama (basit)
  - LocalStorage ile kalıcı depolama
  - Chunk-based indeksleme
  - Benzerlik hesaplama
  - İstatistik raporlama

### 3. RAGSystem (`rag/retrieval-system.js`)
- **Görev**: Ana RAG sistemi koordinasyonu
- **Özellikler**:
  - OpenAI entegrasyonu
  - Query processing
  - Context building
  - Answer generation
  - Multi-document support

## Kullanım Akışı

### 1. Belge Yükleme
```javascript
const ragSystem = new RAGSystem(OPENAI_API_KEY);
const result = await ragSystem.uploadDocument(file);
```

### 2. Sorgulama
```javascript
// Tüm belgelerde arama
const answer = await ragSystem.query("Bu belgede AI nedir?");

// Belirli belgede arama
const answer = await ragSystem.query("Proje timeline'ı nedir?", documentId);
```

### 3. Belge Yönetimi
```javascript
// Belge listesi
const documents = ragSystem.getDocuments();

// Belge detayları
const details = ragSystem.getDocumentDetails(documentId);

// Belge silme
const success = ragSystem.deleteDocument(documentId);
```

## Teknik Detaylar

### Chunk Stratejisi
- **Chunk Boyutu**: 500 kelime
- **Overlap**: 50 kelime
- **Sebep**: Context kaybını önler, OpenAI token limitini aşmaz

### Arama Algoritması
1. **Query Preprocessing**: Stop word removal, stemming
2. **Similarity Calculation**: Word matching + exact match bonus
3. **Ranking**: Score-based sıralama
4. **Context Building**: En iyi chunk'ları birleştir

### Depolama Yapısı
```javascript
{
  documents: Map<id, Document>,
  index: Map<word, Set<location>>,
  searchHistory: Array<query>
}
```

## API Referansı

### RAGSystem Sınıfı

#### Konstruktor
```javascript
new RAGSystem(apiKey)
```

#### Ana Metodlar

##### uploadDocument(file)
Belge yükler ve işler.
- **Parametre**: File object
- **Dönüş**: `{success, document, message}`

##### query(question, documentId?)
RAG sorgusu yapar.
- **Parametreler**: 
  - `question`: String - Kullanıcı sorusu
  - `documentId`: String (opsiyonel) - Belirli belge ID'si
- **Dönüş**: `{success, answer, sources, context}`

##### getDocuments()
Tüm belgeleri listeler.
- **Dönüş**: Array<DocumentSummary>

##### deleteDocument(documentId)
Belge siler.
- **Parametre**: String - Belge ID'si
- **Dönüş**: Boolean

#### Yardımcı Metodlar

##### getSystemStats()
Sistem istatistiklerini verir.

##### getSimilarDocuments(documentId)
Benzer belgeleri önerir.

##### clearAllData()
Tüm RAG verilerini temizler.

## Entegrasyon

### Mevcut Pixelf Sistemi ile Entegrasyon

#### 1. Dosya Yükleme (app.js)
```javascript
// Mevcut handleFileUpload fonksiyonunu güncelle
async function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    // RAG sistemine ekle
    const ragSystem = new RAGSystem(OPENAI_API_KEY);
    const result = await ragSystem.uploadDocument(file);
    
    if (result.success) {
        // Normal not oluşturma
        createNoteFromDocument(result.document);
        showNotification('✅ Belge RAG sistemine eklendi!', 'success');
    }
}
```

#### 2. Chatbot Entegrasyonu (chatbot.js)
```javascript
// generateAIResponse fonksiyonuna RAG desteği ekle
async function generateAIResponse(userMessage) {
    // RAG sorgusu kontrol et
    if (userMessage.includes('belgede') || userMessage.includes('dosyada')) {
        const ragSystem = new RAGSystem(OPENAI_API_KEY);
        const ragResult = await ragSystem.query(userMessage);
        
        if (ragResult.success) {
            return `📄 Belgelerden bulduğum bilgi:\n\n${ragResult.answer}\n\n📚 Kaynak: ${ragResult.sources[0]?.documentName}`;
        }
    }
    
    // Normal AI response
    return await generateNormalAIResponse(userMessage);
}
```

## Kullanım Örnekleri

### Örnek 1: PDF Analizi
```javascript
// 1. PDF yükle
const pdfFile = document.getElementById('fileInput').files[0];
const ragSystem = new RAGSystem(API_KEY);
await ragSystem.uploadDocument(pdfFile);

// 2. Sorgula
const result = await ragSystem.query("Bu PDF'deki ana konular neler?");
console.log(result.answer);
```

### Örnek 2: Çoklu Belge Arama
```javascript
// Tüm belgelerde arama
const results = await ragSystem.query("Proje bütçesi nedir?");

// En alakalı 3 kaynak
results.sources.slice(0, 3).forEach(source => {
    console.log(`${source.documentName}: ${source.content}`);
});
```

### Örnek 3: Belge Karşılaştırması
```javascript
// Benzer belgeleri bul
const similar = ragSystem.getSimilarDocuments(docId);
similar.forEach(doc => {
    console.log(`${doc.document.name} - Benzerlik: ${doc.similarity}`);
});
```

## Performans ve Limitler

### Performans Optimizasyonu
- **Chunk Caching**: İşlenmiş chunk'lar cache'lenir
- **Lazy Loading**: Büyük belgeler ihtiyaç halinde yüklenir
- **Index Optimization**: Frequently used words prioritized

### Sistem Limitleri
- **Maksimum Belge Boyutu**: 10MB
- **Maksimum Chunk Sayısı**: 1000 per document
- **LocalStorage Limiti**: ~5MB total storage
- **OpenAI Context**: 3000 token per query

### Hata Durumları
- **Belge okuma hatası**: Fallback to basic text extraction
- **API rate limit**: Graceful degradation to mock responses
- **Storage full**: Automatic cleanup of old documents

## Gelecek Geliştirmeler

### Planned Features
- [ ] Real vector embeddings (OpenAI embeddings API)
- [ ] Advanced chunking strategies
- [ ] Multi-language support
- [ ] Document versioning
- [ ] Collaborative annotations
- [ ] Export/import functionality

### Performance Improvements
- [ ] Web Workers for processing
- [ ] Streaming responses
- [ ] Progressive loading
- [ ] Smart caching strategies

## Sorun Giderme

### Yaygın Sorunlar

#### Belge yüklenmiyor
- Dosya formatını kontrol edin (PDF, DOC, TXT)
- Dosya boyutunu kontrol edin (<10MB)
- Browser console'da hata mesajlarını kontrol edin

#### Arama sonuç vermiyor
- Query'nizi farklı kelimelerle deneyin
- Belgenin doğru yüklendiğini kontrol edin
- Stop word'ler kullanmaktan kaçının

#### Yavaş performans
- LocalStorage boyutunu kontrol edin
- Eski belgeleri temizleyin
- Browser cache'ini temizleyin

### Debug Komutları

```javascript
// Sistem durumu
const stats = ragSystem.getSystemStats();
console.log('RAG Stats:', stats);

// Belge listesi
const docs = ragSystem.getDocuments();
console.log('Documents:', docs);

// Search history
const history = ragSystem.getSearchHistory();
console.log('Search History:', history);

// Cleanup
ragSystem.clearAllData();
```