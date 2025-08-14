// Main application functions
function initializeApp() {
    if (!currentUser) {
        showAuthModal();
        return;
    }
    
    setupEventListeners();
    loadUserNotes(); // Firebase'den verileri yükle
    renderSidebar();
    renderCalendar();
    
    // Add fade-in animation
    document.getElementById('app').classList.add('fade-in');
    
    console.log('🎮 Pixelf uygulaması başlatıldı!');
}

function setupEventListeners() {
    // App buttons
    document.getElementById('newNoteBtn').addEventListener('click', addNewNote);
    document.getElementById('newGroupBtn').addEventListener('click', addNewGroup);
    document.getElementById('fileUploadBtn').addEventListener('click', showFileUpload);
    document.getElementById('aiSummaryBtn').addEventListener('click', generateAISummary);
    document.getElementById('addEventBtn').addEventListener('click', addNewEvent);

    // Calendar navigation
    document.getElementById('prevMonthBtn').addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        renderCalendar();
    });
    
    document.getElementById('nextMonthBtn').addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        renderCalendar();
    });

    // Search
    document.getElementById('searchInput').addEventListener('input', handleSearch);
}

// Sidebar rendering functions
function renderSidebar() {
    const container = document.getElementById('notesContainer');
    if (!container) return;
    
    container.innerHTML = '';

    if (noteGroups.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 20px; color: var(--text-muted);">
                <div style="font-size: 32px; margin-bottom: 12px;">📝</div>
                <p>Henüz notunuz yok</p>
                <p style="font-size: 12px;">Yeni not oluşturmak için yukarıdaki butona tıklayın</p>
            </div>
        `;
        return;
    }

    noteGroups.forEach(group => {
        const groupElement = createGroupElement(group);
        container.appendChild(groupElement);
    });
}

function createGroupElement(group) {
    const groupDiv = document.createElement('div');
    groupDiv.className = 'note-group';
    
    const notesHtml = group.notes && group.notes.length > 0 
        ? group.notes.map(note => createNoteElement(note)).join('')
        : '<div style="text-align: center; color: var(--text-muted); padding: 10px; font-size: 12px;">Bu grupta henüz not yok</div>';
    
    groupDiv.innerHTML = `
        <div class="group-header" onclick="toggleGroup('${group.id}')">
            <span class="group-title">${group.title}</span>
            <span class="group-count">${group.notes ? group.notes.length : 0}</span>
        </div>
        <div class="group-notes" id="group-${group.id}">
            ${notesHtml}
        </div>
    `;

    return groupDiv;
}

function createNoteElement(note) {
    return `
        <div class="note-item ${selectedNote?.id === note.id ? 'selected' : ''}" 
             onclick="selectNote('${note.id}')">
            <div class="note-title">${note.title}</div>
            <div class="note-preview">${note.preview}</div>
            <div class="note-meta">
                <span class="note-date">${note.date}</span>
                ${note.tags.map(tag => `<span class="note-tag">${tag}</span>`).join('')}
            </div>
        </div>
    `;
}

function selectNote(noteId) {
    // Find note in all groups
    let foundNote = null;
    noteGroups.forEach(group => {
        const note = group.notes.find(n => n.id === noteId);
        if (note) foundNote = note;
    });

    if (foundNote) {
        selectedNote = foundNote;
        renderSidebar();
        showNoteEditor(foundNote);
    }
}

function showNoteEditor(note) {
    const welcomeScreen = document.getElementById('welcomeScreen');
    const editorSection = document.querySelector('.editor-section');
    
    welcomeScreen.style.display = 'none';
    
    // Create editor if not exists
    let editor = document.getElementById('noteEditor');
    if (!editor) {
        editor = document.createElement('div');
        editor.id = 'noteEditor';
        editor.className = 'note-editor';
        editorSection.appendChild(editor);
    }

    editor.style.display = 'block';
    editor.innerHTML = `
        <div class="editor-container">
            <input type="text" class="editor-title" value="${note.title}" placeholder="Başlık..." onchange="updateNoteTitle('${note.id}', this.value)">
            <div class="editor-toolbar">
                <button class="toolbar-btn" onclick="formatText('bold')">🔤 Kalın</button>
                <button class="toolbar-btn" onclick="formatText('italic')">🔤 İtalik</button>
                <button class="toolbar-btn" onclick="insertList()">📋 Liste</button>
                <button class="toolbar-btn" onclick="saveNote()">💾 Kaydet</button>
            </div>
            <textarea class="editor-content" placeholder="Notunuzu buraya yazın..." onchange="updateNoteContent('${note.id}', this.value)">${note.content}</textarea>
            
            <div style="margin-top: 20px; padding: 16px; background: var(--pixel-sidebar); border-radius: 6px;">
                <h4 style="color: var(--pixel-primary); margin-bottom: 8px;">📊 Not Bilgileri</h4>
                <p style="font-size: 12px; color: var(--text-muted);">
                    Oluşturulma: ${note.created_at} • 
                    Etiketler: ${note.tags.join(', ')} • 
                    Kelime sayısı: ${note.content.split(' ').length}
                </p>
            </div>
        </div>
    `;
}

// Calendar functions
function renderCalendar() {
    updateMonthDisplay();
    renderCalendarGrid();
}

function updateMonthDisplay() {
    const monthDisplay = document.getElementById('currentMonthDisplay');
    if (monthDisplay) {
        monthDisplay.textContent = `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
    }
}

function renderCalendarGrid() {
    const grid = document.getElementById('calendarGrid');
    if (!grid) return;
    
    grid.innerHTML = '';

    // Day headers
    const dayHeaders = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];
    dayHeaders.forEach(day => {
        const headerElement = document.createElement('div');
        headerElement.className = 'calendar-day-header';
        headerElement.textContent = day;
        grid.appendChild(headerElement);
    });

    // Calendar days
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    for (let i = 0; i < 42; i++) {
        const day = new Date(startDate);
        day.setDate(startDate.getDate() + i);
        
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day';
        
        // Add classes
        if (day.getMonth() !== month) {
            dayElement.classList.add('other-month');
        }
        if (day.toDateString() === new Date().toDateString()) {
            dayElement.classList.add('today');
        }
        if (selectedDate && day.toDateString() === selectedDate.toDateString()) {
            dayElement.classList.add('selected');
        }

        // Get events for this day
        const dayEvents = events.filter(event => {
            return event.date === day.toISOString().split('T')[0];
        });

        // Etkinlik varsa özel gösterge
        const hasEvents = dayEvents.length > 0;
        if (hasEvents) {
            dayElement.classList.add('has-events');
        }

        dayElement.innerHTML = `
            <div class="day-number">${day.getDate()}</div>
            ${hasEvents ? '<div class="event-indicator">🔵</div>' : ''}
            <div class="day-events">
                ${dayEvents.slice(0, 1).map(event => 
                    `<div class="event-item" title="${event.title}: ${event.description}">${event.title}</div>`
                ).join('')}
                ${dayEvents.length > 1 ? `<div class="more-events">+${dayEvents.length - 1}</div>` : ''}
            </div>
        `;

        dayElement.addEventListener('click', () => selectDate(day));
        grid.appendChild(dayElement);
    }
}

function selectDate(date) {
    selectedDate = date;
    renderCalendarGrid();
    showDateEvents(date);
}

function showDateEvents(date) {
    const dateStr = date.toISOString().split('T')[0];
    const dayEvents = events.filter(event => event.date === dateStr);
    
    if (dayEvents.length > 0) {
        const eventList = dayEvents.map(event => 
            `• ${event.time || '09:00'} - ${event.title}: ${event.description}`
        ).join('\n');
        
        showNotification(`📅 ${date.toLocaleDateString('tr-TR')} Etkinlikleri:\n\n${eventList}`, 'info');
    } else {
        showNotification(`📅 ${date.toLocaleDateString('tr-TR')}\n\nBu tarihte etkinlik bulunmuyor.`, 'info');
    }
}

// Firebase entegreli not ekleme
async function addNewNote() {
    if (!currentUser) {
        showNotification('⚠️ Lütfen önce giriş yapın!', 'warning');
        return;
    }

    const title = prompt('📝 Yeni not başlığı:');
    if (!title) return;

    const content = prompt('📖 Not içeriği:') || '';
    const tagsInput = prompt('🏷️ Etiketler (virgülle ayırın):') || 'yeni';
    const tags = tagsInput.split(',').map(tag => tag.trim()).filter(tag => tag);

    showNotification('💾 Not kaydediliyor...', 'info');

    try {
        if (currentUser.uid && currentUser.uid !== 'demo-user') {
            // Firebase'e kaydet
            await firebase.firestore().collection('notes').add({
                title: title,
                content: content,
                tags: tags,
                userId: currentUser.uid,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            console.log('✅ Firebase note created');
            showNotification('✅ Yeni not oluşturuldu!', 'success');
        } else {
            // Demo kullanıcısı için local
            createLocalNote(title, content, tags);
        }
    } catch (error) {
        console.error('Error adding note:', error);
        showNotification('❌ Not kaydedilemedi!', 'error');
        createLocalNote(title, content, tags);
    }
}

// Local not oluşturma (demo için)
function createLocalNote(title, content, tags) {
    const newNote = {
        id: generateId(),
        title: title,
        content: content,
        preview: content.substring(0, 80) + (content.length > 80 ? '...' : ''),
        tags: tags,
        date: formatDate(new Date()),
        created_at: getCurrentDate()
    };

    // İlk gruba ekle
    if (noteGroups.length === 0) {
        noteGroups.push({
            id: 'personal',
            title: '📌 Kişisel',
            notes: []
        });
    }
    
    noteGroups[0].notes.unshift(newNote);
    renderSidebar();
    selectNote(newNote.id);
    showNotification('✅ Yeni not oluşturuldu!', 'success');
}

// Firebase entegreli grup ekleme
async function addNewGroup() {
    if (!currentUser) {
        showNotification('⚠️ Lütfen önce giriş yapın!', 'warning');
        return;
    }

    const title = prompt('📁 Yeni grup adı:');
    if (!title) return;

    const icons = ['📁', '💼', '🎯', '📚', '🔥', '⭐', '💡', '🚀'];
    const randomIcon = icons[Math.floor(Math.random() * icons.length)];

    showNotification('📁 Grup oluşturuluyor...', 'info');

    try {
        if (currentUser.uid && currentUser.uid !== 'demo-user') {
            // Firebase'e kaydet
            await firebase.firestore().collection('groups').add({
                title: title,
                icon: randomIcon,
                userId: currentUser.uid,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                noteCount: 0
            });
            
            console.log('✅ Firebase group created');
            showNotification('✅ Yeni grup oluşturuldu!', 'success');
        } else {
            // Demo kullanıcısı için local
            createLocalGroup(title, randomIcon);
        }
    } catch (error) {
        console.error('Error adding group:', error);
        showNotification('❌ Grup oluşturulamadı!', 'error');
        createLocalGroup(title, randomIcon);
    }
}

// Local grup oluşturma (demo için)
function createLocalGroup(title, icon) {
    const newGroup = {
        id: generateId().toString(),
        title: `${icon} ${title}`,
        notes: []
    };

    noteGroups.push(newGroup);
    renderSidebar();
    showNotification('✅ Yeni grup oluşturuldu!', 'success');
}

// Firebase entegreli etkinlik ekleme
async function addNewEvent() {
    if (!currentUser) {
        showNotification('⚠️ Lütfen önce giriş yapın!', 'warning');
        return;
    }

    const title = prompt('📅 Etkinlik başlığı:');
    if (!title) return;

    const description = prompt('📝 Etkinlik açıklaması:') || '';
    const date = prompt('📆 Tarih (YYYY-MM-DD):') || getCurrentDate();
    const time = prompt('🕐 Saat (HH:MM):') || '09:00';

    showNotification('📅 Etkinlik ekleniyor...', 'info');

    try {
        if (currentUser.uid && currentUser.uid !== 'demo-user') {
            // Firebase'e kaydet
            await firebase.firestore().collection('events').add({
                title: title,
                description: description,
                date: date,
                time: time,
                userId: currentUser.uid,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            console.log('✅ Firebase event created');
            
            const eventDate = new Date(date).toLocaleDateString('tr-TR');
            showNotification(`📅 "${title}" etkinliği ${eventDate} tarihine eklendi!`, 'success');
        } else {
            // Demo kullanıcısı için local
            createLocalEvent(title, description, date, time);
        }
    } catch (error) {
        console.error('Error adding event:', error);
        showNotification('❌ Etkinlik eklenemedi!', 'error');
        createLocalEvent(title, description, date, time);
    }
}

// Local etkinlik oluşturma (demo için)
function createLocalEvent(title, description, date, time) {
    const newEvent = {
        id: generateId(),
        title: title,
        description: description,
        date: date,
        time: time
    };

    events.push(newEvent);
    renderCalendar();
    
    const eventDate = new Date(date).toLocaleDateString('tr-TR');
    showNotification(`📅 "${title}" etkinliği ${eventDate} tarihine eklendi!`, 'success');
}

function showFileUpload() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.txt,.doc,.docx,.pdf';
    input.onchange = handleFileUpload;
    input.click();
}

async function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    showNotification('📎 Dosya yükleniyor...', 'info');

    const reader = new FileReader();
    reader.onload = function(e) {
        const content = e.target.result;
        
        // Create new note from file
        const newNote = {
            id: generateId(),
            title: `📎 ${file.name}`,
            content: content.substring(0, 2000) + (content.length > 2000 ? '...' : ''),
            preview: `Dosyadan yüklendi: ${file.name}`,
            tags: ['dosya', 'yüklendi'],
            date: formatDate(new Date()),
            created_at: getCurrentDate()
        };

        // İlk gruba ekle
        if (noteGroups.length === 0) {
            noteGroups.push({
                id: 'personal',
                title: '📌 Kişisel',
                notes: []
            });
        }

        noteGroups[0].notes.unshift(newNote);
        renderSidebar();
        selectNote(newNote.id);
        
        showNotification(`✅ ${file.name} başarıyla yüklendi ve not olarak kaydedildi!`, 'success');
    };
    
    reader.onerror = function() {
        showNotification('❌ Dosya yüklenirken hata oluştu!', 'error');
    };
    
    reader.readAsText(file, 'UTF-8');
}