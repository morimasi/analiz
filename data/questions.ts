import { Question } from '../types';

export const questions: Question[] = [
  // =================================================================
  // KATEGORİ 1: DİKKAT VE HİPERAKTİVİTE (DEHB & Yürütücü İşlevler)
  // =================================================================
  {
    id: 'att_1',
    text: 'Yönergeleri takip etmekte zorlanır, sık sık tekrarlamanız gerekir (İşitsel Dikkat).',
    category: 'attention',
    weight: 1.2,
    formType: 'both'
  },
  {
    id: 'att_2',
    text: 'Ödev yaparken veya zihinsel çaba gerektiren işlerde dikkati çabuk dağılır ve isteksizdir.',
    category: 'attention',
    weight: 1.1,
    formType: 'both'
  },
  {
    id: 'att_3',
    text: 'Eşyalarını (kalem, silgi, mont, suluk vb.) sık sık kaybeder veya okulda unutur.',
    category: 'attention',
    weight: 1.0,
    formType: 'parent'
  },
  {
    id: 'att_4',
    text: 'Elleri veya ayakları kıpır kıpırdır, sırasında veya koltukta oturmakta zorlanır (Hiperaktivite).',
    category: 'attention',
    weight: 1.2,
    formType: 'both'
  },
  {
    id: 'att_5',
    text: 'Sırasını beklemekte güçlük çeker, başkalarının sözünü keser veya oyunlara dalar (Dürtüsellik).',
    category: 'attention',
    weight: 1.3,
    formType: 'both'
  },
  {
    id: 'att_6',
    text: 'Bir görevi tamamlamadan diğerine geçer, plansız ve dağınık çalışır.',
    category: 'attention',
    weight: 1.1,
    formType: 'teacher'
  },
  {
    id: 'att_7',
    text: 'Detaylara dikkat etmez, dikkatsizce basit hatalar yapar.',
    category: 'attention',
    weight: 1.0,
    formType: 'both'
  },
  {
    id: 'att_8',
    text: 'Kendisine doğrudan konuşulduğunda dinlemiyormuş gibi görünür (Dalagınlık).',
    category: 'attention',
    weight: 1.1,
    formType: 'both'
  },
  {
    id: 'att_9',
    text: 'Günlük rutin işleri (diş fırçalama, çanta hazırlama) hatırlamakta zorlanır.',
    category: 'attention',
    weight: 1.0,
    formType: 'parent'
  },
  {
    id: 'att_10',
    text: 'Sessizce oyun oynamakta veya boş zaman aktiviteleri yapmakta zorlanır.',
    category: 'attention',
    weight: 1.0,
    formType: 'parent'
  },
  {
    id: 'att_11',
    text: 'Çok konuşur, soru sorulduğunda soru bitmeden cevabı yapıştırır.',
    category: 'attention',
    weight: 1.0,
    formType: 'both'
  },

  // =================================================================
  // KATEGORİ 2: OKUMA GÜÇLÜĞÜ (Disleksi Belirtileri)
  // =================================================================
  {
    id: 'read_1',
    text: 'b/d, p/q, m/n gibi görsel olarak benzer harfleri okurken veya yazarken karıştırır.',
    category: 'reading',
    weight: 1.5, // Kritik Semptom
    formType: 'both'
  },
  {
    id: 'read_2',
    text: 'Okurken satır atlar, kelime sonlarını uydurur veya ekleri yanlış okur.',
    category: 'reading',
    weight: 1.4,
    formType: 'both'
  },
  {
    id: 'read_3',
    text: 'Sesli okumaktan kaçınır, okurken gerilir veya sesi monotonlaşır.',
    category: 'reading',
    weight: 1.2,
    formType: 'teacher'
  },
  {
    id: 'read_4',
    text: 'Okuduğu metnin ana fikrini anlamakta veya özetlemekte zorlanır (Okuduğunu Anlama).',
    category: 'reading',
    weight: 1.3,
    formType: 'both'
  },
  {
    id: 'read_5',
    text: 'Kelimeleri hecelerine ayırmakta veya kafiyeli kelimeleri bulmakta zorlanır (Fonolojik Farkındalık).',
    category: 'reading',
    weight: 1.4,
    formType: 'teacher'
  },
  {
    id: 'read_6',
    text: 'Alfabeyi veya günleri/ayları sırasıyla saymakta karışıklık yaşar.',
    category: 'reading',
    weight: 1.1,
    formType: 'parent'
  },
  {
    id: 'read_7',
    text: 'Okurken yerini kaybetmemek için parmağıyla takip etme ihtiyacı duyar.',
    category: 'reading',
    weight: 1.1,
    formType: 'teacher'
  },
  {
    id: 'read_8',
    text: 'Okuma yaptıktan sonra baş ağrısı veya göz yorgunluğundan şikayet eder.',
    category: 'reading',
    weight: 1.0,
    formType: 'parent'
  },
  {
    id: 'read_9',
    text: 'Tabelaları, levhaları veya kısa notları okumakta yaşıtlarına göre yavaştır.',
    category: 'reading',
    weight: 1.2,
    formType: 'parent'
  },
  {
    id: 'read_10',
    text: 'Yazılı sınavlarda, sözlü sınavlara göre belirgin şekilde daha düşük performans gösterir.',
    category: 'reading',
    weight: 1.3,
    formType: 'teacher'
  },
  {
    id: 'read_11',
    text: 'Harflerin yerini değiştirerek okur (Örn: "ev" yerine "ve", "kitap" yerine "kipat").',
    category: 'reading',
    weight: 1.4,
    formType: 'both'
  },

  // =================================================================
  // KATEGORİ 3: YAZMA GÜÇLÜĞÜ (Disgrafi Belirtileri)
  // =================================================================
  {
    id: 'write_1',
    text: 'Yazısı yaşıtlarına göre okunaksız, harf boyutları düzensiz ve satır hizası bozuktur.',
    category: 'writing',
    weight: 1.2,
    formType: 'both'
  },
  {
    id: 'write_2',
    text: 'Kalemi çok sıkı tutar, yazarken eli çabuk yorulur veya bileği ağrır.',
    category: 'writing',
    weight: 1.2,
    formType: 'both'
  },
  {
    id: 'write_3',
    text: 'Düşüncelerini sözlü olarak çok iyi ifade edebilirken, kağıda dökmekte zorlanır.',
    category: 'writing',
    weight: 1.3,
    formType: 'both'
  },
  {
    id: 'write_4',
    text: 'Noktalama işaretlerini ve büyük/küçük harf kurallarını sürekli unutur.',
    category: 'writing',
    weight: 1.0,
    formType: 'teacher'
  },
  {
    id: 'write_5',
    text: 'Yazarken kendi kendine konuşur veya harfleri çizerken aşırı efor sarf eder.',
    category: 'writing',
    weight: 1.0,
    formType: 'parent'
  },
  {
    id: 'write_6',
    text: 'Tahtadan veya kitaptan deftere geçirirken (kopyalama) çok hata yapar ve yavaştır.',
    category: 'writing',
    weight: 1.3,
    formType: 'teacher'
  },
  {
    id: 'write_7',
    text: 'Kelimeler arasında boşluk bırakmayı unutur veya kelimeleri birbirine bitişik yazar.',
    category: 'writing',
    weight: 1.1,
    formType: 'both'
  },
  {
    id: 'write_8',
    text: 'Kağıdı silerken sık sık deler veya karalar (Silgi kullanımında güçlük).',
    category: 'writing',
    weight: 1.0,
    formType: 'parent'
  },
  {
    id: 'write_9',
    text: 'Yazarken vücut pozisyonu gariptir (Sıraya aşırı eğilme, kağıdı çok yan tutma).',
    category: 'writing',
    weight: 1.1,
    formType: 'both'
  },
  {
    id: 'write_10',
    text: 'Büyük ve küçük harfleri rastgele karıştırarak yazar (Cümle içinde BÜyüK HaRF gibi).',
    category: 'writing',
    weight: 1.2,
    formType: 'teacher'
  },

  // =================================================================
  // KATEGORİ 4: MATEMATİK GÜÇLÜĞÜ (Diskalkuli Belirtileri)
  // =================================================================
  {
    id: 'math_1',
    text: 'Basit toplama/çıkarma işlemlerinde hala parmak kullanmaya ihtiyaç duyar.',
    category: 'math',
    weight: 1.3,
    formType: 'both'
  },
  {
    id: 'math_2',
    text: 'Analog saati okumakta veya zaman kavramlarını (dün/bugün/yarın, önce/sonra) anlamakta zorlanır.',
    category: 'math',
    weight: 1.2,
    formType: 'parent'
  },
  {
    id: 'math_3',
    text: 'Ritmik saymalarda, çarpım tablosunu ezberlemekte ciddi güçlük yaşar.',
    category: 'math',
    weight: 1.2,
    formType: 'teacher'
  },
  {
    id: 'math_4',
    text: 'Zihinden işlem yaparken sayıları aklında tutmakta zorlanır (İşleyen Bellek).',
    category: 'math',
    weight: 1.2,
    formType: 'both'
  },
  {
    id: 'math_5',
    text: 'Para üstü hesaplama veya miktar tahmin etme (azlık-çokluk) becerileri zayıftır.',
    category: 'math',
    weight: 1.1,
    formType: 'parent'
  },
  {
    id: 'math_6',
    text: 'Matematik sembollerini (+, -, x, =) karıştırır veya yanlış kullanır.',
    category: 'math',
    weight: 1.3,
    formType: 'teacher'
  },
  {
    id: 'math_7',
    text: 'İki basamaklı sayıları okurken basamakları karıştırır (Örn: 12 yerine 21, 46 yerine 64).',
    category: 'math',
    weight: 1.4,
    formType: 'both'
  },
  {
    id: 'math_8',
    text: 'Oyunlarda skor tutmakta veya sıra takibi yapmakta zorlanır.',
    category: 'math',
    weight: 1.0,
    formType: 'parent'
  },
  {
    id: 'math_9',
    text: 'Geometrik şekilleri tanımakta veya özelliklerini ayırt etmekte zorlanır.',
    category: 'math',
    weight: 1.0,
    formType: 'teacher'
  },
  {
    id: 'math_10',
    text: 'Matematik problemlerini çözerken hangi işlemi yapacağına karar veremez.',
    category: 'math',
    weight: 1.2,
    formType: 'teacher'
  },
  {
    id: 'math_11',
    text: 'Uzaklık ve mesafe tahminlerinde (ne kadar uzakta, sığar mı) yanılır.',
    category: 'math',
    weight: 1.1,
    formType: 'parent'
  },

  // =================================================================
  // KATEGORİ 5: DİL VE İLETİŞİM (İşitsel İşlemleme & Disfazi)
  // =================================================================
  {
    id: 'lang_1',
    text: 'Kelimeleri telaffuz etmekte zorlanır veya kelime hazinesi yaşıtlarından dardır.',
    category: 'language',
    weight: 1.0,
    formType: 'both'
  },
  {
    id: 'lang_2',
    text: 'Karmaşık veya uzun cümleleri anlamakta güçlük çeker, "ne?" diye sık sorar.',
    category: 'language',
    weight: 1.2,
    formType: 'both'
  },
  {
    id: 'lang_3',
    text: 'Bir olayı veya hikayeyi oluş sırasına göre (baş-orta-son) anlatmakta zorlanır.',
    category: 'language',
    weight: 1.2,
    formType: 'parent'
  },
  {
    id: 'lang_4',
    text: 'Kelime bulmakta zorlanır, "şey" kelimesini sık kullanır veya nesneleri yanlış isimlendirir.',
    category: 'language',
    weight: 1.1,
    formType: 'both'
  },
  {
    id: 'lang_5',
    text: 'Mecaz anlamları, şakaları veya deyimleri anlamakta zorlanır, her şeyi gerçek (literal) algılar.',
    category: 'language',
    weight: 1.1,
    formType: 'both'
  },
  {
    id: 'lang_6',
    text: 'Gürültülü ortamlarda (sınıf, AVM) sesleri ayırt etmekte ve söyleneni anlamakta zorlanır.',
    category: 'language',
    weight: 1.3,
    formType: 'both'
  },
  {
    id: 'lang_7',
    text: 'Kafiyeli kelimeleri bulmakta veya şarkı sözlerini ezberlemekte güçlük çeker.',
    category: 'language',
    weight: 1.0,
    formType: 'parent'
  },
  {
    id: 'lang_8',
    text: 'Sohbet başlatmakta veya sürdürmekte zorlanır, göz teması zayıf olabilir.',
    category: 'language',
    weight: 1.0,
    formType: 'both'
  },
  {
    id: 'lang_9',
    text: 'Benzer sesli kelimeleri karıştırır (Örn: "taş" ile "kaş", "sarı" ile "darı").',
    category: 'language',
    weight: 1.3,
    formType: 'teacher'
  },
  {
    id: 'lang_10',
    text: 'İsteklerini ifade ederken hırçınlaşır veya cümle kurmak yerine işaret etmeyi tercih eder.',
    category: 'language',
    weight: 1.1,
    formType: 'parent'
  },

  // =================================================================
  // KATEGORİ 6: MOTOR VE UZAMSAL BECERİLER (Dispraksi Belirtileri)
  // =================================================================
  {
    id: 'motor_1',
    text: 'Sağını ve solunu karıştırır, yön bulmakta zorlanır.',
    category: 'motor_spatial',
    weight: 1.3,
    formType: 'both'
  },
  {
    id: 'motor_2',
    text: 'Ayakkabı bağlamak, düğme iliklemek, makas kullanmak gibi ince motor işlerde zorlanır.',
    category: 'motor_spatial',
    weight: 1.2,
    formType: 'parent'
  },
  {
    id: 'motor_3',
    text: 'Sakar görünür, sık sık eşyalara çarpar veya düşürür (Vücut farkındalığı azlığı).',
    category: 'motor_spatial',
    weight: 1.1,
    formType: 'both'
  },
  {
    id: 'motor_4',
    text: 'Top yakalama, ip atlama veya bisiklete binme gibi kaba motor becerilerde yaşıtlarının gerisindedir.',
    category: 'motor_spatial',
    weight: 1.1,
    formType: 'parent'
  },
  {
    id: 'motor_5',
    text: 'Defter düzeni kötüdür, yazarken satır çizgisini tutturamaz (Görsel-Uzamsal bozukluk).',
    category: 'motor_spatial',
    weight: 1.2,
    formType: 'teacher'
  },
  {
    id: 'motor_6',
    text: 'Yemek yerken sık sık üstüne döker, çatal-bıçak kullanımında zorlanır.',
    category: 'motor_spatial',
    weight: 1.0,
    formType: 'parent'
  },
  {
    id: 'motor_7',
    text: 'Yapboz (puzzle) yapmakta veya legolarla model oluşturmakta zorlanır.',
    category: 'motor_spatial',
    weight: 1.1,
    formType: 'parent'
  },
  {
    id: 'motor_8',
    text: 'Beden Eğitimi derslerinde veya takım oyunlarında hareketleri taklit etmekte yavaştır.',
    category: 'motor_spatial',
    weight: 1.1,
    formType: 'teacher'
  },
  {
    id: 'motor_9',
    text: 'Sırada otururken sürekli kaykılır, dik durmakta zorlanır (Postüral kontrol zayıflığı).',
    category: 'motor_spatial',
    weight: 1.0,
    formType: 'teacher'
  },
  {
    id: 'motor_10',
    text: 'Müzik eşliğinde ritim tutmakta veya el çırpmakta zorlanır.',
    category: 'motor_spatial',
    weight: 1.0,
    formType: 'both'
  },
  {
    id: 'motor_11',
    text: 'Karmaşık hareket dizilerini (Örn: Önce zıpla, sonra eğil) planlamakta zorlanır (Motor Planlama).',
    category: 'motor_spatial',
    weight: 1.2,
    formType: 'both'
  }
];