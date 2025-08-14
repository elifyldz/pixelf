// Firebase'den gelecek veriler
let noteGroups = [];
let events = [];

// Global variables
let currentUser = null;
let currentDate = new Date();
let selectedDate = null;
let selectedNote = null;

const monthNames = [
    'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
    'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
];

// Utility functions
function generateId() {
    return Date.now() + Math.random();
}

function formatDate(date) {
    return new Date(date).toLocaleDateString('tr-TR', { 
        day: 'numeric', 
        month: 'short' 
    });
}

function getCurrentDate() {
    return new Date().toISOString().split('T')[0];
}

// Ana Firebase veri yükleme fonksiyonu
function loadUserNotes() {
    if (!currentUser) return;
    
    if (currentUser.uid === 'demo-user') {
        loadDemoData();
        return;
    }
    
    try {
        // Önce notları yükle
        firebase.firestore().collection('notes')
          .where('userId', '==', currentUser.uid)
          .orderBy('createdAt', 'desc')
          .onSnapshot((snapshot) => {
            const personalGroup = {
                id: 'personal',
                title: '📌 Kişisel',
                notes: []
            };
            
            snapshot.forEach((doc) => {
                const noteData = doc.data();
                personalGroup.notes.push({
                    id: doc.id,
                    title: noteData.title,
                    content: noteData.content,
                    preview: noteData.content.substring(0, 80) + (noteData.content.length > 80 ? '...' : ''),
                    tags: noteData.tags || ['yeni'],
                    date: formatDate(noteData.createdAt?.toDate() || new Date()),
                    created_at: noteData.createdAt?.toDate().toISOString().split('T')[0] || getCurrentDate()
                });
            });
            
            // Kişisel grubu başta yerleştir
            noteGroups = [personalGroup];
            
            // Grupları ayrı olarak yükle
            loadUserGroups();
            
            // Sidebar'ı render et
            if (typeof renderSidebar === 'function') {
                renderSidebar();
            }
        });
        
        // Etkinlikleri yükle
        loadUserEvents();
        
    } catch (error) {
        console.error('Error loading notes:', error);
        loadDemoData();
    }
}

// Firebase'den grupları yükle
function loadUserGroups() {
    if (!currentUser || currentUser.uid === 'demo-user') return;
    
    try {
        firebase.firestore().collection('groups')
          .where('userId', '==', currentUser.uid)
          .orderBy('createdAt', 'desc')
          .onSnapshot((snapshot) => {
            // Kişisel grubu koru, diğerlerini ekle
            const personalGroup = noteGroups.find(g => g.id === 'personal');
            noteGroups = personalGroup ? [personalGroup] : [];
            
            snapshot.forEach((doc) => {
                const groupData = doc.data();
                noteGroups.push({
                    id: doc.id,
                    title: `${groupData.icon || '📁'} ${groupData.title}`,
                    notes: []
                });
            });
            
            // Sidebar'ı güncelle
            if (typeof renderSidebar === 'function') {
                renderSidebar();
            }
        });
        
    } catch (error) {
        console.error('Error loading groups:', error);
    }
}

// Firebase'den etkinlikleri yükle
function loadUserEvents() {
    if (!currentUser || currentUser.uid === 'demo-user') return;
    
    try {
        firebase.firestore().collection('events')
          .where('userId', '==', currentUser.uid)
          .onSnapshot((snapshot) => {
            events = [];
            
            snapshot.forEach((doc) => {
                const eventData = doc.data();
                events.push({
                    id: doc.id,
                    title: eventData.title,
                    description: eventData.description,
                    date: eventData.date,
                    time: eventData.time
                });
            });
            
            // Takvimi güncelle
            if (typeof renderCalendar === 'function') {
                renderCalendar();
            }
        });
        
    } catch (error) {
        console.error('Error loading events:', error);
    }
}

// Firebase'e not kaydetme
async function saveNoteToFirebase(note) {
    if (!currentUser || currentUser.uid === 'demo-user') return;
    
    try {
        await firebase.firestore().collection('notes').doc(note.id).set({
            title: note.title,
            content: note.content,
            tags: note.tags,
            userId: currentUser.uid,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        console.log('✅ Note saved to Firebase:', note.id);
    } catch (error) {
        console.error('Error saving note:', error);
    }
}

// Firebase'e grup kaydetme
async function saveGroupToFirebase(group) {
    if (!currentUser || currentUser.uid === 'demo-user') return;
    
    try {
        await firebase.firestore().collection('groups').doc(group.id).set({
            title: group.title.replace(/^[📁📂📊💼🎯📚🔥⭐💡🚀]\s/, ''), // Icon'u çıkar
            icon: group.title.match(/^[📁📂📊💼🎯📚🔥⭐💡🚀]/)?.[0] || '📁',
            userId: currentUser.uid,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            noteCount: group.notes ? group.notes.length : 0
        });
        
        console.log('✅ Group saved to Firebase:', group.id);
    } catch (error) {
        console.error('Error saving group:', error);
    }
}

// Firebase'e etkinlik kaydetme
async function saveEventToFirebase(event) {
    if (!currentUser || currentUser.uid === 'demo-user') return;
    
    try {
        await firebase.firestore().collection('events').doc(event.id).set({
            title: event.title,
            description: event.description,
            date: event.date,
            time: event.time,
            userId: currentUser.uid,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        console.log('✅ Event saved to Firebase:', event.id);
    } catch (error) {
        console.error('Error saving event:', error);
    }
}

// Demo data function - Firebase bağlantısı yoksa
function loadDemoData() {
    noteGroups = [
        {
            id: 'personal',
            title: '📌 Kişisel',
            notes: [
                {
                    id: 1,
                    title: '🎯 Bugünkü Hedefler',
                    content: 'Bugün yapılacaklar:\n• Proje sunumunu hazırla\n• E-postaları kontrol et\n• Spor salonuna git\n• Market alışverişi',
                    preview: 'Bugün yapılacaklar: • Proje sunumunu hazırla • E-postaları kontrol et...',
                    tags: ['günlük', 'hedef'],
                    date: formatDate(new Date()),
                    created_at: getCurrentDate()
                },
                {
                    id: 2,
                    title: '💡 Proje Fikirleri',
                    content: 'Yeni proje için fikirler:\n• AI destekli not alma uygulaması\n• Akıllı takvim entegrasyonu\n• Chatbot özelliği',
                    preview: 'Yeni proje için fikirler: • AI destekli not alma uygulaması...',
                    tags: ['proje', 'ai'],
                    date: formatDate(new Date() - 24*60*60*1000),
                    created_at: getCurrentDate()
                }
            ]
        },
        {
            id: 'work',
            title: '💼 İş',
            notes: [
                {
                    id: 3,
                    title: '📊 Haftalık Rapor',
                    content: 'Bu hafta tamamlanan işler:\n• Müşteri toplantısı\n• Kod review\n• Dokümantasyon güncellemesi',
                    preview: 'Bu hafta tamamlanan işler: • Müşteri toplantısı • Kod review...',
                    tags: ['rapor', 'haftalık'],
                    date: formatDate(new Date() - 2*24*60*60*1000),
                    created_at: getCurrentDate()
                }
            ]
        }
    ];
    
    // Demo events
    events = [
        {
            id: 1,
            title: 'Toplantı',
            description: 'Proje toplantısı',
            date: getCurrentDate(),
            time: '14:00'
        },
        {
            id: 2,
            title: 'Doktor',
            description: 'Doktor randevusu',
            date: new Date(Date.now() + 24*60*60*1000).toISOString().split('T')[0],
            time: '10:30'
        }
    ];
    
    console.log('📚 Demo data yüklendi');
    
    if (typeof renderSidebar === 'function') {
        renderSidebar();
    }
    
    if (typeof renderCalendar === 'function') {
        renderCalendar();
    }
}

// Belge yükleme fonksiyonu
function uploadDocument(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = function(e) {
            try {
                const content = e.target.result;
                
                // Yeni not oluştur
                const newNote = {
                    id: generateId().toString(),
                    title: `📄 ${file.name}`,
                    content: content.substring(0, 5000) + (content.length > 5000 ? '...' : ''),
                    preview: `Dosyadan yüklendi: ${file.name}`,
                    tags: ['dosya', 'yüklendi', file.type.includes('pdf') ? 'pdf' : 'belge'],
                    date: formatDate(new Date()),
                    created_at: getCurrentDate()
                };
                
                // İlk gruba ekle (Kişisel)
                if (noteGroups.length === 0) {
                    noteGroups.push({
                        id: 'personal',
                        title: '📌 Kişisel',
                        notes: []
                    });
                }
                
                noteGroups[0].notes.unshift(newNote);
                
                // Firebase'e kaydet
                if (currentUser && currentUser.uid !== 'demo-user') {
                    saveNoteToFirebase(newNote);
                }
                
                resolve(newNote);
            } catch (error) {
                reject(error);
            }
        };
        
        reader.onerror = function() {
            reject(new Error('Dosya okuma hatası'));
        };
        
        // Dosya tipine göre okuma
        if (file.type.includes('text') || file.name.endsWith('.txt')) {
            reader.readAsText(file, 'UTF-8');
        } else if (file.type.includes('pdf')) {
            // PDF için base64 okuma (basit metin çıkarma için)
            reader.readAsText(file, 'UTF-8');
        } else {
            reader.readAsText(file, 'UTF-8');
        }
    });
}

// Kullanıcı verilerini temizleme
function clearUserData() {
    noteGroups = [];
    events = [];
    selectedNote = null;
    selectedDate = null;
    
    // UI'yi temizle
    const notesContainer = document.getElementById('notesContainer');
    if (notesContainer) {
        notesContainer.innerHTML = '';
    }
    
    const welcomeScreen = document.getElementById('welcomeScreen');
    if (welcomeScreen) {
        welcomeScreen.style.display = 'flex';
    }
    
    const editor = document.getElementById('noteEditor');
    if (editor) {
        editor.style.display = 'none';
    }
}

// Export functions for global use
window.loadUserNotes = loadUserNotes;
window.saveNoteToFirebase = saveNoteToFirebase;
window.saveGroupToFirebase = saveGroupToFirebase;
window.saveEventToFirebase = saveEventToFirebase;
window.uploadDocument = uploadDocument;
window.clearUserData = clearUserData;