// Authentication functions
function initializeAuth() {
    const loginBtn = document.getElementById('loginBtn');
    const demoBtn = document.getElementById('demoBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');

    // Event listeners (sadece mevcut elementlere)
    if (loginBtn) loginBtn.addEventListener('click', handleLogin);
    if (demoBtn) demoBtn.addEventListener('click', handleDemoLogin);
    if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);

    // Enter key support
    if (emailInput) {
        emailInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') handleLogin();
        });
    }
    
    if (passwordInput) {
        passwordInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') handleLogin();
        });
    }

    // Check if user is already logged in
    checkExistingSession();
}

function checkExistingSession() {
    // Firebase auth state değişikliklerini dinle
    firebase.auth().onAuthStateChanged((user) => {
        if (user) {
            // Kullanıcı giriş yapmış
            currentUser = {
                email: user.email,
                uid: user.uid,
                name: user.displayName || user.email.split('@')[0]
            };
            
            const userEmailElement = document.getElementById('userEmail');
            if (userEmailElement) {
                userEmailElement.textContent = user.email;
            }
            
            hideAuthModal();
            
            // App.js'deki initializeApp fonksiyonunu çağır
            if (typeof initializeApp === 'function') {
                initializeApp();
            }
            
            console.log('✅ Kullanıcı giriş yapmış:', user.email);
        } else {
            // Kullanıcı giriş yapmamış
            currentUser = null;
            showAuthModal();
            console.log('❌ Kullanıcı giriş yapmamış');
        }
    });
}

function showAuthModal() {
    const authModal = document.getElementById('authModal');
    const app = document.getElementById('app');
    
    if (authModal) {
        authModal.classList.remove('hidden');
    }
    if (app) {
        app.classList.remove('active');
    }
    
    // Clear form
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    
    if (emailInput) emailInput.value = '';
    if (passwordInput) passwordInput.value = '';
    
    // Focus on email input
    setTimeout(() => {
        if (emailInput) emailInput.focus();
    }, 100);
}

function hideAuthModal() {
    const authModal = document.getElementById('authModal');
    const app = document.getElementById('app');
    
    if (authModal) {
        authModal.classList.add('hidden');
    }
    if (app) {
        app.classList.add('active');
    }
}

async function handleLogin() {
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    
    if (!emailInput || !passwordInput) {
        showNotification('⚠️ Giriş formu bulunamadı!', 'warning');
        return;
    }
    
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();
    
    // Validation
    if (!email || !password) {
        showNotification('⚠️ Lütfen e-posta ve şifre girin!', 'warning');
        return;
    }

    if (!isValidEmail(email)) {
        showNotification('⚠️ Geçerli bir e-posta adresi girin!', 'warning');
        return;
    }

    showNotification('🔐 Giriş yapılıyor...', 'info');
    
    try {
        // Firebase ile giriş yap
        const userCredential = await firebase.auth().signInWithEmailAndPassword(email, password);
        
        // currentUser global değişkeni güncelle
        currentUser = {
            email: userCredential.user.email,
            uid: userCredential.user.uid,
            name: userCredential.user.displayName || userCredential.user.email.split('@')[0]
        };
        
        // UI güncellemeleri
        const userEmailElement = document.getElementById('userEmail');
        if (userEmailElement) {
            userEmailElement.textContent = userCredential.user.email;
        }
        
        hideAuthModal();
        
        // App.js'deki initializeApp fonksiyonunu çağır
        if (typeof initializeApp === 'function') {
            initializeApp();
        }
        
        showNotification('🎉 Başarıyla giriş yapıldı!', 'success');
        
    } catch (error) {
        console.error('Login error:', error);
        
        // Hata mesajları
        let errorMessage = 'Giriş yapılamadı!';
        
        switch (error.code) {
            case 'auth/user-not-found':
                errorMessage = 'Bu e-posta ile kayıtlı kullanıcı bulunamadı!';
                break;
            case 'auth/wrong-password':
                errorMessage = 'Yanlış şifre!';
                break;
            case 'auth/invalid-email':
                errorMessage = 'Geçersiz e-posta formatı!';
                break;
            case 'auth/too-many-requests':
                errorMessage = 'Çok fazla başarısız deneme. Lütfen daha sonra tekrar deneyin.';
                break;
            case 'auth/network-request-failed':
                errorMessage = 'İnternet bağlantısını kontrol edin!';
                break;
            default:
                errorMessage = `Giriş hatası: ${error.message}`;
        }
        
        showNotification(`❌ ${errorMessage}`, 'error');
    }
}

function handleDemoLogin() {
    showNotification('🎮 Demo hesabıyla giriş yapılıyor...', 'info');
    
    setTimeout(() => {
        // Demo kullanıcısı oluştur
        currentUser = { 
            email: 'demo@pixelf.com', 
            uid: 'demo-user',
            name: 'Demo Kullanıcısı',
            loginTime: new Date().toISOString()
        };
        
        // UI güncellemeleri
        const userEmailElement = document.getElementById('userEmail');
        if (userEmailElement) {
            userEmailElement.textContent = 'demo@pixelf.com';
        }
        
        hideAuthModal();
        
        // App.js'deki initializeApp fonksiyonunu çağır
        if (typeof initializeApp === 'function') {
            initializeApp();
        }
        
        showNotification('🎮 Demo hesabıyla giriş yapıldı! Tüm özellikleri deneyebilirsiniz.', 'success');
    }, 800);
}

async function handleLogout() {
    if (confirm('🚪 Çıkış yapmak istediğinize emin misiniz?')) {
        try {
            // Firebase oturumunu kapat (eğer demo değilse)
            if (currentUser && currentUser.uid !== 'demo-user') {
                await firebase.auth().signOut();
            }
            
            // Global değişkenleri temizle
            currentUser = null;
            selectedNote = null;
            selectedDate = null;
            noteGroups = [];
            
            // UI sıfırlamaları
            const userEmailElement = document.getElementById('userEmail');
            if (userEmailElement) {
                userEmailElement.textContent = '';
            }
            
            const welcomeScreen = document.getElementById('welcomeScreen');
            if (welcomeScreen) {
                welcomeScreen.style.display = 'flex';
            }
            
            const editor = document.getElementById('noteEditor');
            if (editor) {
                editor.style.display = 'none';
            }
            
            // Sidebar temizle
            const notesContainer = document.getElementById('notesContainer');
            if (notesContainer) {
                notesContainer.innerHTML = '';
            }
            
            showAuthModal();
            showNotification('👋 Başarıyla çıkış yapıldı!', 'success');
            
        } catch (error) {
            console.error('Logout error:', error);
            showNotification('❌ Çıkış yapılırken hata oluştu!', 'error');
        }
    }
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    // Style the notification
    Object.assign(notification.style, {
        position: 'fixed',
        top: '20px',
        right: '20px',
        padding: '12px 20px',
        borderRadius: '6px',
        color: 'white',
        fontWeight: '600',
        fontSize: '14px',
        zIndex: '3000',
        maxWidth: '400px',
        wordWrap: 'break-word',
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
        transform: 'translateX(400px)',
        transition: 'transform 0.3s ease'
    });
    
    // Set background color based on type
    switch (type) {
        case 'success':
            notification.style.background = '#06ffa5';
            notification.style.color = '#0f0f23';
            break;
        case 'warning':
            notification.style.background = '#f77f00';
            notification.style.color = '#0f0f23';
            break;
        case 'error':
            notification.style.background = '#ff006e';
            break;
        default:
            notification.style.background = '#fcbf49';
            notification.style.color = '#0f0f23';
    }
    
    // Add to DOM
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 10);
    
    // Auto remove after 4 seconds
    setTimeout(() => {
        notification.style.transform = 'translateX(400px)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 4000);
    
    // Click to dismiss
    notification.addEventListener('click', () => {
        notification.style.transform = 'translateX(400px)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    });
}

// Initialize auth when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeAuth);