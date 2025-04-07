// js/ana-panel.js

// Sayfa geçişleri için fonksiyonlar
function showSection(sectionId) {
    // Tüm bölümleri gizle
    document.querySelectorAll('.content-section').forEach(section => {
        section.style.display = 'none';
    });

    // Seçilen bölümü göster
    const sectionToShow = document.getElementById(sectionId);
    if (sectionToShow) {
        sectionToShow.style.display = 'block';
    } else {
        console.error(`Bölüm bulunamadı: ${sectionId}`);
        // Ana sayfayı göster veya bir hata mesajı ver
        document.getElementById('homePage').style.display = 'block';
        document.querySelector('[data-section="homePage"]').classList.add('active');
        return; // Hata durumunda aktif menü güncellemesini atla
    }

    // Aktif menü öğesini güncelle
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    const activeButton = document.querySelector(`[data-section="${sectionId}"]`);
    if (activeButton) {
        activeButton.classList.add('active');
    }
}

// Randevu ekleme fonksiyonu
function addAppointment(event) {
    event.preventDefault();

    const hospital = document.getElementById('hospital').value;
    const department = document.getElementById('department').value;
    const doctor = document.getElementById('doctor').value;
    const date = document.getElementById('appDate').value;
    const time = document.getElementById('appTime').value;

    const appointmentHtml = `
        <div class="appointment-item">
            <div class="appointment-time">
                <span class="time">${time}</span>
                <span class="date">${new Date(date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })}</span>
            </div>
            <div class="appointment-details">
                <h3>${department}</h3>
                <p>${doctor} - ${hospital}</p>
            </div>
            <div class="appointment-status confirmed">
                <span>Onaylandı</span>
            </div>
        </div>
    `;

    const appointmentsList = document.getElementById('appointmentsList');
    if (appointmentsList) {
        appointmentsList.insertAdjacentHTML('beforeend', appointmentHtml);
    }
    event.target.reset();
    return false;
}

// İlaç ekleme fonksiyonu
function addMedication(event) {
    event.preventDefault();

    const name = document.getElementById('medName').value;
    const dose = document.getElementById('medDose').value;
    const schedules = Array.from(document.querySelectorAll('input[name="schedule"]:checked'))
                           .map(cb => cb.value);

    const medHtml = `
        <div class="med-card">
            <div class="med-info">
                <i class="fas fa-pills med-icon"></i>
                <div class="med-details">
                    <h3>${name}</h3>
                    <p>${dose}</p>
                    <div class="med-schedule">
                        ${schedules.map(s => `<span class="schedule-badge">${capitalizeFirstLetter(s)}</span>`).join('')}
                    </div>
                </div>
                <button class="delete-med-btn" onclick="deleteMedication(this)">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `;

    const medicationsList = document.getElementById('medicationsList');
    if (medicationsList) {
        medicationsList.insertAdjacentHTML('beforeend', medHtml);
    }
    closeAddMedModal();
    event.target.reset();
    return false;
}

// İlaç silme fonksiyonu
function deleteMedication(button) {
    button.closest('.med-card').remove();
}

// İlk harfi büyük yapma yardımcısı
function capitalizeFirstLetter(string) {
    if (!string) return '';
    return string.charAt(0).toUpperCase() + string.slice(1);
}


// Modal fonksiyonları
function openAddMedModal() {
    const modal = document.getElementById('addMedModal');
    if (modal) {
      modal.style.display = 'block';
    }
}

function closeAddMedModal() {
    const modal = document.getElementById('addMedModal');
    if (modal) {
      modal.style.display = 'none';
    }
}

function openSettingsModal() {
    const modal = document.getElementById('settingsModal');
    if (modal) {
        modal.style.display = 'block';
        // Mevcut ayarları yükle
        loadCurrentSettings();
    }
}

function closeSettingsModal() {
    const modal = document.getElementById('settingsModal');
    if (modal) {
        modal.style.display = 'none';
    }
}


// AI Chat fonksiyonları
const chatMessages = document.getElementById('chatMessages');
const userInput = document.getElementById('userInput');
const sendButton = document.getElementById('sendButton');
const micButton = document.getElementById('micButton');

// Mesaj gönderme fonksiyonu //HATA YERİ? (Bu yorumu gözden geçirin)
async function sendMessage() {
    if (!userInput || !chatMessages) {
        console.error("Chat elementleri bulunamadı.");
        return;
    }
    const message = userInput.value.trim();
    if (message === '') return;

    // Kullanıcı mesajını ekle
    addMessage('user', message);
    userInput.value = '';

    let loadingId = null; // Define loadingId here
    try {
        // Loading mesajı göster
        loadingId = showLoadingMessage();

        // API'ye istek at (URL'yi kontrol edin: Bu sizin backend proxy'niz mi?)
        const response = await fetch('https://lokman.onrender.com/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [
                    { role: "user", parts: [{ text: message }] }
                ],
                // Eğer backend'iniz farklı bir format bekliyorsa burayı düzenleyin.
                // Örn: body: JSON.stringify({ query: message, userId: 'someUserId' })
            })
        });

        // Loading mesajını kaldır
        if (loadingId) {
            removeLoadingMessage(loadingId);
        }

        if (!response.ok) {
            // Daha detaylı hata mesajı
            const errorData = await response.text(); // veya response.json()
            console.error('API Hata Kodu:', response.status, 'Hata Detayı:', errorData);
            throw new Error(`API ${response.status} koduyla yanıt verdi.`);
        }

        const data = await response.json();

        // API yanıtını ekrana ekle
        // Yanıt formatını kontrol edin. Backend'iniz 'reply' anahtarı mı döndürüyor?
        // Gemini API direkt kullanılıyorsa: data.candidates[0].content.parts[0].text
        const replyText = data.reply || (data.candidates && data.candidates[0]?.content?.parts[0]?.text) || 'Anlaşılır bir yanıt alınamadı.';
        addMessage('ai', replyText);

    } catch (error) {
        console.error('Mesaj gönderilirken hata oluştu:', error);
        if (loadingId) { // Ensure loading message is removed even on error
            removeLoadingMessage(loadingId);
        }
        addMessage('ai', 'Üzgünüm, bir hata oluştu. Lütfen tekrar deneyin veya sistem yöneticinize başvurun.');
    }
}


// Mesaj ekleme fonksiyonu
function addMessage(type, content) {
     if (!chatMessages) return;
    const time = new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });

    // Avatar yollarını düzeltin (img klasörünü varsayarak)
    const aiAvatar = 'img/ai-avatar.png'; // AI avatarının doğru yolunu belirtin
    const userAvatar = 'img/person.jpeg'; // Kullanıcı avatarının doğru yolunu belirtin

    const messageHtml = `
        <div class="message ${type}">
            <div class="message-info">
                ${type === 'ai' ?
                    `<img src="${aiAvatar}" alt="AI" class="message-avatar">
                     <span class="message-sender">E-Lokman AI</span>` :
                    `<span class="message-sender">Siz</span>
                     <img src="${userAvatar}" alt="Kullanıcı" class="message-avatar">`
                }
            </div>
            <div class="message-bubble">
                <p>${content.replace(/\*\*/g, '')}</p> </div>
            <span class="message-time">${time}</span>
        </div>
    `;

    chatMessages.insertAdjacentHTML('beforeend', messageHtml);
    chatMessages.scrollTop = chatMessages.scrollHeight; // En alta kaydır
}

// Loading mesajı gösterme
function showLoadingMessage() {
     if (!chatMessages) return null;
    const loadingId = 'loading-' + Date.now();
    const aiAvatar = 'img/ai-avatar.png'; // Avatar yolunu düzeltin

    const loadingHtml = `
        <div class="message ai" id="${loadingId}">
            <div class="message-info">
                <img src="${aiAvatar}" alt="AI" class="message-avatar">
                <span class="message-sender">E-Lokman AI</span>
            </div>
            <div class="message-bubble">
                <p class="loading-dots">Yanıt yazıyor<span>.</span><span>.</span><span>.</span></p>
            </div>
        </div>
    `;

    chatMessages.insertAdjacentHTML('beforeend', loadingHtml);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    return loadingId;
}

// Loading mesajını kaldırma
function removeLoadingMessage(loadingId) {
    const loadingElement = document.getElementById(loadingId);
    if (loadingElement) {
        loadingElement.remove();
    }
}

// Ses tanıma (Web Speech API)
let recognition = null;
if ('webkitSpeechRecognition' in window) {
    recognition = new webkitSpeechRecognition();
    recognition.lang = 'tr-TR';
    recognition.continuous = false; // Tek seferlik tanıma
    recognition.interimResults = false; // Ara sonuçları alma

    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
         if (userInput) {
            userInput.value = transcript;
         }
         // İsteğe bağlı: Tanıma sonrası otomatik gönderme
         // sendMessage();
    };

    recognition.onerror = (event) => {
        console.error('Speech Recognition Error:', event.error);
        if (micButton) micButton.classList.remove('active');
    }

    recognition.onend = () => {
        if (micButton) micButton.classList.remove('active'); // Kayıt bittiğinde butonu pasif yap
    };

    // Mikrofon butonu event listener
    if (micButton) {
        micButton.addEventListener('click', () => {
            if (recognition) {
                 try {
                    recognition.start();
                    micButton.classList.add('active'); // Kayıt sırasında butonu aktif yap
                 } catch(e) {
                    console.error("Recognition başlatılamadı:", e);
                 }
            } else {
                console.warn("Speech Recognition desteklenmiyor veya başlatılamadı.");
            }
        });
    }

} else {
    console.warn("Tarayıcınız Web Speech Recognition API'sini desteklemiyor.");
    // Mikrofon butonunu gizle veya devre dışı bırak
    if (micButton) micButton.style.display = 'none';
}


// Tüm randevuları görüntüleme fonksiyonu
function showAllAppointments() {
    // Randevular sekmesine geç
    showSection('appointments');
}

// Dosya Yükleme İşlemleri
const fileInput = document.getElementById('fileInput');
const dropZone = document.getElementById('dropZone');
const reportTableBody = document.querySelector('.patients-table tbody'); // Tablo tbody seçici

function handleFileSelect(event) {
    // event.target.files (Dosya seç butonu ile seçilenler)
    // event.dataTransfer.files (Sürükle-bırak ile gelenler)
    const files = event.target.files || (event.dataTransfer && event.dataTransfer.files);

    if (files && files.length > 0) {
        for (const file of files) {
            if (validateFile(file)) {
                uploadFile(file);
            }
        }
    }
     // event.target'ı sıfırlayarak aynı dosyanın tekrar seçilebilmesini sağla
     if (event.target) {
        event.target.value = null;
     }
}

function validateFile(file) {
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!allowedTypes.includes(file.type)) {
        alert(`Desteklenmeyen dosya formatı: ${file.type}! Lütfen PDF veya resim dosyası yükleyin.`);
        return false;
    }

    if (file.size > maxSize) {
        alert(`Dosya boyutu çok büyük (${(file.size / 1024 / 1024).toFixed(2)}MB)! Maksimum 5MB yükleyebilirsiniz.`);
        return false;
    }

    return true;
}

function uploadFile(file) {
    if (!reportTableBody) return;

    // Yükleme animasyonunu göster
    const loadingRowId = `loading-${file.name}-${Date.now()}`;
    const loadingRow = createLoadingRow(file.name, loadingRowId);
    reportTableBody.insertAdjacentHTML('afterbegin', loadingRow);

    // --- GERÇEK YÜKLEME KISMI ---
    // Burada 'fetch' veya 'XMLHttpRequest' kullanarak dosyayı sunucuya göndermeniz gerekir.
    // Örnek fetch ile:
    /*
    const formData = new FormData();
    formData.append('reportFile', file); // 'reportFile' sunucuda beklenen alan adı olmalı

    fetch('/upload-report-endpoint', { // Sunucu adresinizi buraya yazın
        method: 'POST',
        body: formData
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Yükleme başarısız oldu.');
        }
        return response.json(); // Sunucudan dönen yanıtı al (örn: dosya bilgileri)
    })
    .then(data => {
        console.log('Yükleme başarılı:', data);
        // Yükleme satırını kaldır
        const loadingElement = document.getElementById(loadingRowId);
        if (loadingElement) loadingElement.remove();
        // Yeni rapor satırını ekle (sunucudan gelen bilgilerle)
        addNewReportRow(file.name, new Date(), 'Yeni'); // data içindeki bilgileri kullanın
    })
    .catch(error => {
        console.error('Yükleme hatası:', error);
        alert(`${file.name} yüklenirken bir hata oluştu.`);
        // Hata durumunda yükleme satırını kaldır
        const loadingElement = document.getElementById(loadingRowId);
        if (loadingElement) loadingElement.remove();
    });
    */

    // Şimdilik sadece simüle ediyoruz (2 saniye bekleme)
    setTimeout(() => {
        // Yükleme satırını kaldır
        const loadingElement = document.getElementById(loadingRowId);
        if (loadingElement) loadingElement.remove();

        // Yeni rapor satırı ekle
        addNewReportRow(file.name, new Date(), 'Yeni');

    }, 2000);
}

function createLoadingRow(fileName, rowId) {
    return `
        <tr class="loading-row" id="${rowId}">
            <td colspan="4">
                <div class="upload-progress">
                    <i class="fas fa-spinner fa-spin"></i>
                    <span>${fileName} yükleniyor...</span>
                </div>
            </td>
        </tr>
    `;
}

function addNewReportRow(fileName, date, status) {
    if (!reportTableBody) return;
    const formattedDate = date instanceof Date ? date.toLocaleDateString('tr-TR') : date;
    const statusBadgeClass = status === 'Yeni' ? 'stable' : 'default'; // Duruma göre sınıf belirle

    const newRow = `
        <tr>
            <td>
                <div class="patient-info">
                    <i class="fas fa-file-medical document-icon"></i>
                    <div>
                        <h4>${fileName}</h4>
                        <span>Yüklenen Dosya</span>
                    </div>
                </div>
            </td>
            <td>${formattedDate}</td>
            <td><span class="status-badge ${statusBadgeClass}">${status}</span></td>
            <td>
                <button class="table-action-btn" title="Görüntüle">
                    <i class="fas fa-eye"></i>
                </button>
                 <button class="table-action-btn" title="Sil">
                    <i class="fas fa-trash"></i>
                </button>
                </td>
        </tr>
    `;

    reportTableBody.insertAdjacentHTML('afterbegin', newRow);
}


// Ayarlar Fonksiyonları
function loadCurrentSettings() {
    // localStorage'dan kayıtlı ayarları al (varsayılan değerler sağla)
    const defaultSettings = { name: 'Şahan Üner', email: '', phone: '', notifications: ['email', 'sms', 'push'] };
    const settings = JSON.parse(localStorage.getItem('userSettings')) || defaultSettings;

    const userNameInput = document.getElementById('userName');
    const userEmailInput = document.getElementById('userEmail');
    const userPhoneInput = document.getElementById('userPhone');

    if (userNameInput) userNameInput.value = settings.name;
    if (userEmailInput) userEmailInput.value = settings.email;
    if (userPhoneInput) userPhoneInput.value = settings.phone;

    // Bildirim tercihlerini ayarla
    document.querySelectorAll('input[name="notifications"]').forEach(checkbox => {
        checkbox.checked = settings.notifications.includes(checkbox.value);
    });
}

function saveSettings(event) {
    event.preventDefault();

    const userNameInput = document.getElementById('userName');
    const userEmailInput = document.getElementById('userEmail');
    const userPhoneInput = document.getElementById('userPhone');

    // Form verilerini al
    const settings = {
        name: userNameInput ? userNameInput.value : 'Bilinmiyor',
        email: userEmailInput ? userEmailInput.value : '',
        phone: userPhoneInput ? userPhoneInput.value : '',
        notifications: Array.from(document.querySelectorAll('input[name="notifications"]:checked'))
                          .map(cb => cb.value)
    };

    // Ayarları localStorage'a kaydet
    try {
        localStorage.setItem('userSettings', JSON.stringify(settings));

        // Kullanıcı adını arayüzde güncelle (varsa)
        const userDetailName = document.querySelector('.user-details p');
        if (userDetailName) {
            userDetailName.textContent = settings.name;
        }

        // Modal'ı kapat
        closeSettingsModal();

        // Başarılı mesajı göster
        alert('Ayarlarınız başarıyla kaydedildi!');

    } catch (e) {
        console.error("Ayarlar kaydedilirken localStorage hatası:", e);
        alert("Ayarlar kaydedilemedi. Tarayıcınızda depolama alanı dolu veya desteklenmiyor olabilir.");
    }

    return false; // Formun sunucuya gönderilmesini engelle
}

// Çıkış Yap Fonksiyonu
function logout() {
    if (confirm('Çıkış yapmak istediğinizden emin misiniz?')) {
        // LocalStorage'ı temizle (isteğe bağlı, sadece belirli item'ları da silebilirsiniz)
        localStorage.removeItem('userSettings');
        // localStorage.clear(); // Tüm local storage'ı temizler

        // Ana giriş sayfasına yönlendir (yolu kontrol edin)
        window.location.href = 'index.html'; // index.html ana dizinde ise
    }
}


// --- Event Listeners ---
document.addEventListener('DOMContentLoaded', function() {
    // DOM hazır olduğunda çalışacak kodlar

    // --- Genel Elementler ---
    const addMedModal = document.getElementById('addMedModal');
    const settingsModal = document.getElementById('settingsModal');

    // --- Sidebar Navigasyon ---
    document.querySelectorAll('.nav-btn[data-section]').forEach(btn => {
        btn.addEventListener('click', function() {
            const sectionId = this.getAttribute('data-section');
            if (sectionId) {
                showSection(sectionId);
            }
        });
    });

     // Başlangıçta Ana Sayfa'yı göster
     showSection('homePage');

    // --- AI Chat ---
    if (sendButton) {
        sendButton.addEventListener('click', sendMessage);
    }
    if (userInput) {
        userInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                sendMessage();
            }
        });
    }
    // Mikrofon butonu event listener'ı zaten yukarıda eklendi.

    // --- Randevu Ekleme Formu ---
    const addAppointmentForm = document.getElementById('addAppointmentForm');
    if (addAppointmentForm) {
        addAppointmentForm.addEventListener('submit', addAppointment);
    }

    // --- İlaç Ekleme Formu ---
    const addMedForm = document.getElementById('addMedForm');
    if (addMedForm) {
        addMedForm.addEventListener('submit', addMedication);
    }
    // İlaç Ekle Butonu (Modal açma)
     const openModalButtons = document.querySelectorAll('.add-med-btn');
     openModalButtons.forEach(button => {
        // Direkt ID ile açmak yerine class ile bulup event listener ekleyebiliriz
        // Ancak HTML'de onclick="openAddMedModal()" zaten var, bu yüzden tekrar eklemeye gerek yok.
        // Eğer onclick'leri kaldırırsak:
        // button.addEventListener('click', openAddMedModal);
     });


    // --- Dosya Yükleme ---
    const browseBtn = document.querySelector('.browse-btn');
    if (browseBtn && fileInput) {
        browseBtn.addEventListener('click', () => fileInput.click());
    }
    if (fileInput) {
        fileInput.addEventListener('change', handleFileSelect);
    }
    // Drop Zone Eventleri
    if (dropZone) {
        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault(); // Tarayıcının dosyayı açmasını engelle
            dropZone.classList.add('drag-over');
        });

        dropZone.addEventListener('dragleave', () => {
            dropZone.classList.remove('drag-over');
        });

        dropZone.addEventListener('drop', (e) => {
            e.preventDefault(); // Tarayıcının dosyayı açmasını engelle
            dropZone.classList.remove('drag-over');
            handleFileSelect(e); // handleFileSelect fonksiyonuna dataTransfer'ı ilet
        });
         // Başlangıçta drop zone'u göster (isteğe bağlı)
         dropZone.style.display = 'block';
    }


    // --- Ayarlar ---
    const settingsBtn = document.querySelector('.settings-btn');
    const settingsForm = document.getElementById('settingsForm');
    if (settingsBtn) {
        settingsBtn.addEventListener('click', openSettingsModal);
    }
    if (settingsForm) {
        settingsForm.addEventListener('submit', saveSettings);
    }

    // --- Çıkış Yap ---
    const logoutBtn = document.querySelector('.logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }

    // --- Modalları Kapatma ---
    // Kapatma butonları (X işaretleri)
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', function() {
            // En yakın modalı bul ve kapat
            const modal = this.closest('.modal');
            if (modal) {
                modal.style.display = 'none';
            }
        });
    });

    // Modal dışına tıklanınca kapatma
    window.addEventListener('click', function(event) {
        if (event.target.classList.contains('modal')) {
            event.target.style.display = 'none';
        }
    });

     // --- Diğer Başlangıç Ayarları ---
     // Örneğin, localStorage'dan ilaçları veya randevuları yükleme...
     // loadMedicationsFromStorage();
     // loadAppointmentsFromStorage();
     loadCurrentSettings(); // Ayarları yükle

}); // DOMContentLoaded Sonu