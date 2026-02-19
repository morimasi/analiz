# Yönetim Modülü Tasarımı (Veli & Öğretmen/Yönetici)

Bu doküman, çocukların bilişsel gelişim risklerini tarayan yapay zeka destekli uygulama için tam kapsamlı yönetim modülünü tanımlar.[web:24][web:26]

---

## 1. Roller ve Yetkiler

### 1.1. Roller

- Veli
- Öğretmen (aynı zamanda Yönetici rolünü de kapsar)
- Sistem Yöneticisi (opsiyonel, sadece teknik/kurumsal yönetim için)

### 1.2. Yetki Matrisi (Özet)

| Özellik                       | Veli | Öğretmen/Yönetici | Sistem Yöneticisi |
|------------------------------|:----:|:-----------------:|:-----------------:|
| Giriş yapma                  |  ✔  |         ✔         |         ✔         |
| Kendi profilini yönetme      |  ✔  |         ✔         |         ✔         |
| Çocuk ekleme/düzenleme       |  ✔  |         ✔         |         ✔         |
| Tarama formu doldurma        |  ✔  |         ✔         |         ✖         |
| Tüm öğrencileri görme        |  ✖  |         ✔         |         ✔         |
| Tüm velileri görme           |  ✖  |         ✔         |         ✔         |
| Rol ve yetki değiştirme      |  ✖  |         ✖         |         ✔         |
| Sistem ayarları              |  ✖  |         ✖         |         ✔         |
| Rapor şablonları/puan ağırlığı| ✖  |         ✔         |         ✔         |

RBAC yaklaşımı ile her izin bir role atanır, kullanıcıya doğrudan izin değil rol verilir.[web:24][web:27]

---

## 2. Kimlik Doğrulama ve Yetkilendirme

### 2.1. Kullanıcı Girişi

- Email + şifre ile giriş.
- Şifreler hash’lenmiş (bcrypt/argon2) olarak tutulur.
- Giriş sonrası:
  - Kullanıcının rolü okunur.
  - İlgili dashboard’a yönlendirilir (Veli Dashboard, Öğretmen Dashboard, Sistem Admin Paneli).[web:22][web:27]

### 2.2. Kayıt (Opsiyonlar)

- Veli:
  - Davet linki ile kayıt (okul ya da öğretmen veli e-posta/telefon üzerinden davet gönderir).[web:26]
  - Kayıt formu: Ad-soyad, email, telefon, şifre, çocuk bilgileri (çocuğu daha sonra da ekleyebilir).
- Öğretmen:
  - Sadece Sistem Yöneticisi tarafından oluşturulur veya okul yönetimi tarafından davet linkiyle.[web:28]
- Sistem Yöneticisi:
  - Kurulum sırasında manuel oluşturulur.

### 2.3. Oturum Yönetimi

- Web: Session veya JWT tabanlı oturum.
- Zaman aşımı (örneğin 30 dk inaktif kullanıcı logout).
- “Beni hatırla” seçeneği ile uzun süreli token.[web:22]

### 2.4. Rol Tabanlı Erişim

- Orta katmanda middleware:
  - `auth` → kullanıcının giriş yapmış olmasını kontrol eder.
  - `role:veli`, `role:ogretmen`, `role:admin` gibi spesifik kontrol.[web:24][web:27]

---

## 3. Veri Modeli (Mantıksal)

### 3.1. Users

- id
- ad_soyad
- email
- telefon
- sifre_hash
- rol (veli, ogretmen, admin)
- durum (aktif, pasif)
- son_giris_tarihi
- olusturma_tarihi, guncelleme_tarihi

### 3.2. Cocuklar (Students)

- id
- ad_soyad
- dogum_tarihi
- cinsiyet
- veli_id (users.id)
- okul_adi
- sinif
- ogretmen_id (users.id - opsiyonel)
- notlar (serbest metin)

### 3.3. Tarama_Formlari (Screenings)

- id
- cocuk_id
- olusturan_kullanici_id (veli veya ogretmen)
- rol (veli/ogretmen formu)
- kategori (Disleksi, DEHB, Diskalkuli vb.)
- ham_puan
- agirlikli_puan
- risk_seviyesi (düşük, orta, yüksek)
- radar_grafik_verisi (JSON)
- AI_yorum_id (AI yorum tablosuna referans)
- durum (taslak, tamamlandi, onaylandi)
- olusturma_tarihi, tamamlanma_tarihi

### 3.4. Sorular (Question Bank)

- id
- soru_meti
- hedef_rol (veli/ogretmen/her ikisi)
- kategori (okuma, dikkat, matematik vb.)
- kritik_mi (bool)
- agirlik_katsayisi (ör: 1–5)
- aktif_mi

### 3.5. Cevaplar (Answers)

- id
- tarama_formu_id
- soru_id
- cevap_degeri (Likert ölçek vb.)
- puan (cevap_degeri * agirlik_katsayisi)

### 3.6. AI_Yorumlar (AI Reports)

- id
- tarama_formu_id
- ozet_metin
- detayli_yorum
- tavsiye_mektubu
- olusturma_tarihi

### 3.7. Rapor_PDF

- id
- tarama_formu_id
- dosya_yolu
- olusturma_tarihi

### 3.8. Bildirimler / Mesajlar

- id
- gonderen_id (opsiyonel)
- alan_id
- tip (sistem, mesaj)
- baslik
- icerik
- okundu_mu
- olusturma_tarihi

---

## 4. Veli Modülü

### 4.1. Veli Dashboard

- Özet kartlar:
  - Çocuk sayısı.
  - Tamamlanmış tarama sayısı.
  - Erken uyarı: yüksek riskli sonuçlar (son 3 ay).[web:28]
- Yaklaşan hatırlatmalar:
  - “X çocuğunuz için 6 ay sonra tekrar tarama önerilir.”
- Son raporlar listesi:
  - Tarih, çocuk adı, risk seviyesi, PDF indir butonu.

### 4.2. Profil Yönetimi

- Kişisel bilgiler (ad, soyad, telefon, email) güncelleme.
- Şifre değiştirme.
- Bildirim tercihleri (email, SMS, uygulama içi).

### 4.3. Çocuk Yönetimi

- Çocuk ekleme/düzenleme/silme:
  - Ad, soyad, doğum tarihi, okul, sınıf, öğretmen bilgisi.[web:26]
- Çocuğa atanmış öğretmeni görüntüleme.

### 4.4. Tarama Süreci (Veli)

- Çocuk seç → “Tarama Başlat” butonu.
- Sistem veliye özel soru setini getirir (rol=veli).[web:24]
- Sayfalandırılmış form:
  - Her sayfada 5–10 soru, ilerleme çubuğu.
- Kaydet/Devam Et:
  - Taslak olarak kaydetme, daha sonra devam etme.
- Tamamlama:
  - Ağırlıklı puanlama motoru skoru hesaplar.
  - Radar grafik verisi üretilir (ör: okuma, dikkat, bellekte puanlar).
  - AI servisi çağrılır, yorum ve tavsiye mektubu oluşturur.[web:21][web:8]

### 4.5. Raporlar

- “Raporlarım” sayfası:
  - Filtre: çocuk, tarih aralığı, kategori, risk seviyesi.
  - Liste: tarih, çocuk, kategori, risk seviyesi, “Detay”, “PDF İndir”.
- Rapor detay ekranı:
  - Radar grafik.
  - Ağırlıklı puanlar.
  - AI tavsiye metni.
  - Aksiyon planı: evde uygulanabilecek öneriler listesi.[web:2][web:3]
- PDF çıktısı:
  - Kurumsal logo, özet tablo, grafik, AI yorum, öneriler.[web:4]

### 4.6. İletişim / Mesaj

- Veli → Öğretmen mesaj gönderme:
  - Çocuk seçili iken soru/istek iletme.
- Gelen yanıtları bildirimlerle gösterme.[web:26]

---

## 5. Öğretmen/Yönetici Modülü

### 5.1. Öğretmen Dashboard

- Özet kartlar:
  - Sorumlu olduğu öğrenci sayısı.
  - Son 30 günde yapılan tarama sayısı.
  - Yüksek riskli öğrenci sayısı.[web:26][web:28]
- Risk haritası:
  - Sınıf bazlı risk dağılımı (ör: sınıflara göre renk kodlu).
- Son aktiviteler:
  - Kim, hangi öğrenci için tarama yaptı, sonucu nedir.

### 5.2. Profil Yönetimi

- Kişisel bilgiler.
- Sınıf/okul bilgisi.
- Bildirim tercihleri.

### 5.3. Öğrenci ve Veli Görüntüleme

- Öğrenci listesi:
  - Filtre: sınıf, risk seviyesi, okul.
  - Her öğrenci için:
    - Temel bilgiler.
    - Bağlı veli(ler).
    - Son tarama ve risk durumu.
- Veli listesi:
  - İletişim bilgileri, bağlı öğrenciler, son giriş tarihi.[web:26]

### 5.4. Tarama Yönetimi (Öğretmen Formu)

- Öğretmen, kendi gözlemlerine göre tarama formu doldurur:
  - Öğretmen rolüne özel soru seti (sınıf içi davranış, dikkat, akademik performans).[web:24]
- Aynı çocuk için veli + öğretmen taramaları birleştirilebilir:
  - “Bütünleşik rapor” ekranı:
    - Veli ve öğretmen skorlarının yan yana gösterimi.
    - AI, iki kaynaktan gelen veriyi birlikte yorumlar.[web:21][web:5]

### 5.5. Ağırlıklı Puanlama Motoru Yönetimi

- Soru bazlı ağırlık ayarlama ekranı:
  - Soru listesi, kategori, kritik_mi, ağırlık_katsayısı.
  - Sadece öğretmen/yönetici ve/veya sistem admin yetkili.[web:21][web:23]
- Kategori bazlı eşik değerleri:
  - Örneğin Disleksi için:
    - 0–30: düşük risk
    - 31–60: orta risk
    - 61+: yüksek risk
- Değişikliklerin geçmişi tutulur (audit log).

### 5.6. Raporlama ve Analitik

- Öğretmen rapor sayfası:
  - Sınıf bazlı, okul bazlı, tarih aralığına göre filtrasyon.
- Grafikler:
  - Kategori bazlı risk dağılımı.
  - Zaman içinde risk değişimi (trend grafiği).
- Toplu PDF:
  - Sınıftaki tüm öğrenciler için özet rapor PDF (kurum içi kullanım için).[web:28]

### 5.7. Yönetici Fonksiyonları (Öğretmen/Yönetici Rolü)

- Kullanıcı listesi:
  - Veliler ve öğretmenler.
  - Durum değiştirme (aktif/pasif).
- Davet gönderme:
  - Yeni veli/öğretmen davet e-postası / SMS.[web:26]
- Rol atama (sadece admin ya da belirlenen üst seviye yönetici):
  - Bir kullanıcıyı veli→öğretmen yapmak gibi işlemler kısıtlı tutulmalı.[web:27]

---

## 6. Sistem Yöneticisi Modülü (Opsiyonel)

### 6.1. Sistem Ayarları

- Uygulama genel parametreleri:
  - Tarama periyodu önerileri (ör: yılda 1).
  - Varsayılan eşik değerleri.
- Logo, kurum adı, rapor şablonları.[web:22]

### 6.2. Rol ve İzin Yönetimi

- Yeni rol tanımlama (gerekirse).
- Her rol için izin listesi (menü bazlı, işlem bazlı):
  - Örneğin “Tarama Sonuçlarını Silme” sadece admin’de.[web:19][web:27]

### 6.3. Audit Log

- Kim ne zaman:
  - Tarama silmiş, ağırlık değiştirmiş, rol güncellemiş kayıtları.
- Güvenlik ve mevzuat uyumu için raporlanabilir ekran.[web:22]

---

## 7. Güvenlik ve Gizlilik

- RBAC alt yapısı ile her kullanıcının sadece yetkili olduğu verilere erişebilmesi.[web:24][web:27]
- Hassas veriler (çocuk bilgileri, raporlar) için:
  - HTTPS zorunlu.
  - Sunucu tarafında şifreleme (opsiyonel).
- Erişim günlükleri (log):
  - Başarılı/başarısız giriş denemeleri.
- Veri maskeleme:
  - İstatistiksel analiz ekranlarında kişisel kimlik bilgilerinin maskelemesi (toplu raporlarda).[web:22]

---

## 8. İş Akışları (Özet)

### 8.1. Veli Tarama İş Akışı

1. Veli giriş yapar.
2. Çocuk seçer veya yeni çocuk ekler.
3. “Tarama Başlat” → Veli soru seti gelir.
4. Formu doldurur, tamamlar.
5. Puanlama motoru çalışır, risk seviyesi belirlenir.
6. AI yorum ve tavsiye mektubu üretilir.
7. Radar grafik + PDF rapor oluşturulur, Veli Dashboard’da görünür.

### 8.2. Öğretmen Tarama İş Akışı

1. Öğretmen giriş yapar.
2. Sınıf listesinden öğrenci seçer.
3. Öğretmen soru seti ile tarama formu doldurur.
4. Aynı şekilde puanlama ve AI yorum oluşur.
5. Veli raporuyla entegre “Bütünleşik Rapor” opsiyonu.

### 8.3. Yönetim İş Akışı

1. Yönetici yeni veli/öğretmen için davet oluşturur.
2. Kullanıcı davet linkiyle kayıt olur.
3. Yönetici, gerekirse rol ve durum değişiklikleri yapar.
4. Ağırlık/limit güncellemeleriyle model sürekli iyileştirilir.[web:21][web:23]

---

## 9. Arayüz Modülleri (Sayfa Bazında)

### 9.1. Ortak

- Giriş Sayfası
- Şifre Sıfırlama
- Profil Sayfası
- Bildirim Merkezi
- Yardım / SSS

### 9.2. Veli

- Veli Dashboard
- Çocuk Listesi / Detay
- Tarama Formu (Veli)
- Raporlarım
- Mesajlar (Veli ↔ Öğretmen)

### 9.3. Öğretmen/Yönetici

- Öğretmen Dashboard
- Sınıf/Öğrenci Listesi
- Tarama Formu (Öğretmen)
- Bütünleşik Rapor Ekranı
- Soru & Ağırlık Yönetimi
- Toplu Raporlar / Analitik
- Kullanıcı Yönetimi (veli/öğretmen listesi)

### 9.4. Sistem Yöneticisi (Opsiyonel)

- Sistem Ayarları
- Rol & İzin Yönetimi
- Audit Log Ekranı

---

Bu .md dosyasını direkt repo’ya “YONETIM_MODULU_TASARIMI.md” olarak ekleyip, geliştirme sürecinde teknik gereksinim ve ekran tasarımı için referans olarak kullanabilirsin.[web:24][web:26]
