# Pixelf - Teknoloji Yığını

## Frontend Teknolojileri

### 🎨 **UI/UX**
- **HTML5**: Semantik markup
- **CSS3**: Modern styling, flexbox, grid
- **Vanilla JavaScript**: DOM manipülasyonu, ES6+
- **Google Fonts**: Press Start 2P (retro), Inter (modern)

### 🎮 **Tasarım Sistemi**
- **Pixelart Teması**: Retro 8-bit estetik
- **CSS Custom Properties**: Renk paleti yönetimi
- **Responsive Design**: Mobile-first yaklaşım
- **Animation CSS**: Smooth transitions

## Backend ve Veritabanı

### ☁️ **Firebase Servisleri**
- **Firebase Auth**: Kullanıcı kimlik doğrulama
- **Firestore**: NoSQL veritabanı (notlar, gruplar, etkinlikler)
- **Firebase Hosting**: Static site hosting
- **Firebase Storage**: Dosya depolama (gelecekte)

### 🗃️ **Veri Yapısı**
```javascript
// Firestore Collections
/users/{userId}
/notes/{noteId} 
/groups/{groupId}
/events/{eventId}
```

## AI ve Machine Learning

### 🤖 **OpenAI Entegrasyonu**
- **GPT-3.5-turbo**: Chat completions
- **API Kullanımı**: REST API calls
- **Model**: Text generation, summarization

### 🧠 **AI Agents**
- **Summary Agent**: Not özetleme
- **Tagging Agent**: Otomatik etiketleme  
- **Classification Agent**: Kategori önerisi
- **Chat Agent**: Kullanıcı etkileşimi

### 📄 **RAG (Retrieval Augmented Generation)**
- **Document Processing**: PDF, Word, TXT parsing
- **Text Chunking**: Belge parçalama
- **Vector Storage**: Browser localStorage (basit)
- **Semantic Search**: İçerik tabanlı arama

## Deployment ve DevOps

### 🚀 **Hosting**
- **Render.com**: Web service hosting
- **Express.js**: Static file server
- **Environment Variables**: API key yönetimi

### 📦 **Package Management**
- **npm**: Dependency management
- **Node.js**: Runtime environment

## File Structure
```
pixelf/
├── index.html              # Ana sayfa
├── register.html           # Kayıt sayfası
├── styles.css              # Ana stil dosyası
├── app.js                  # Ana uygulama mantığı
├── auth.js                 # Kimlik doğrulama
├── chatbot.js              # AI chatbot
├── data.js                 # Veri yönetimi
├── firebase-config.js      # Firebase yapılandırması
├── server.js               # Express server
├── package.json            # Node.js dependencies
├── agents/                 # AI agent'lar
│   ├── summary-agent.js
│   ├── tagging-agent.js
│   └── chat-agent.js
├── rag/                    # RAG sistemi
│   ├── document-processor.js
│   ├── vector-store.js
│   └── retrieval-system.js
└── docs/                   # Dokümantasyon
    ├── user-flow.md
    ├── tech-stack.md
    └── automation.md
```

## API Entegrasyonları

### 🔌 **Dış Servisler**
- **OpenAI API**: GPT-3.5-turbo
- **Firebase SDK**: Web SDK v9
- **File Reader API**: Dosya okuma
- **LocalStorage API**: Client-side storage

## Geliştirme Araçları

### 🛠️ **Development**
- **VS Code**: Code editor
- **Chrome DevTools**: Debugging
- **Git**: Version control
- **GitHub**: Repository hosting

### 📱 **Cross-Platform Support**
- **Progressive Web App**: PWA ready
- **Mobile Responsive**: Touch-friendly
- **Browser Support**: Modern browsers (Chrome, Firefox, Safari)

## Güvenlik

### 🔒 **Security Measures**
- **Environment Variables**: API key protection
- **Firebase Security Rules**: Database access control
- **Input Validation**: XSS prevention
- **HTTPS**: Secure connection

## Performance

### ⚡ **Optimization**
- **Lazy Loading**: On-demand feature loading
- **Code Splitting**: Modular architecture
- **Caching**: LocalStorage for chat history
- **Minification**: Production build optimization