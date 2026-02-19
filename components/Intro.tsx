import React, { useState } from 'react';
import { UserProfile, Role } from '../types';
import { Brain, ShieldCheck } from 'lucide-react';

interface IntroProps {
  onStart: (profile: UserProfile) => void;
}

const Intro: React.FC<IntroProps> = ({ onStart }) => {
  const [name, setName] = useState('');
  const [age, setAge] = useState<number | ''>('');
  const [grade, setGrade] = useState('');
  const [role, setRole] = useState<Role>('parent');
  const [acceptedDisclaimer, setAcceptedDisclaimer] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name && age && grade && acceptedDisclaimer) {
      onStart({ name, age: Number(age), grade, role });
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden animate-fade-in">
      <div className="bg-primary p-6 md:p-8 text-center">
        <div className="mx-auto bg-white/20 w-16 h-16 rounded-full flex items-center justify-center mb-4 backdrop-blur-sm shadow-inner">
          <Brain className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">Bilişsel Gelişim Tarama</h1>
        <p className="text-indigo-100 text-sm md:text-base">
          Çocuğunuzun öğrenme yolculuğundaki güçlü ve desteklenmesi gereken yönlerini keşfedin.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Öğrenci Adı</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition text-base shadow-sm"
              placeholder="Ad Soyad"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Yaş</label>
            <input
              type="number"
              required
              min="4"
              max="18"
              value={age}
              onChange={(e) => setAge(Number(e.target.value))}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition text-base shadow-sm"
              placeholder="Örn: 8"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Sınıf Seviyesi</label>
          <select
            required
            value={grade}
            onChange={(e) => setGrade(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition text-base shadow-sm bg-white"
          >
            <option value="">Seçiniz</option>
            <option value="okul_oncesi">Okul Öncesi</option>
            <option value="1">1. Sınıf</option>
            <option value="2">2. Sınıf</option>
            <option value="3">3. Sınıf</option>
            <option value="4">4. Sınıf</option>
            <option value="ortaokul">Ortaokul</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">Siz Kimsiniz?</label>
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setRole('parent')}
              className={`py-4 px-4 rounded-xl border-2 font-medium transition flex flex-col md:flex-row items-center justify-center gap-2 touch-manipulation active:scale-95 ${
                role === 'parent'
                  ? 'border-primary bg-primary/5 text-primary shadow-sm'
                  : 'border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <span className="text-2xl">🏠</span> <span>Ebeveyn</span>
            </button>
            <button
              type="button"
              onClick={() => setRole('teacher')}
              className={`py-4 px-4 rounded-xl border-2 font-medium transition flex flex-col md:flex-row items-center justify-center gap-2 touch-manipulation active:scale-95 ${
                role === 'teacher'
                  ? 'border-primary bg-primary/5 text-primary shadow-sm'
                  : 'border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <span className="text-2xl">🏫</span> <span>Öğretmen</span>
            </button>
          </div>
        </div>

        <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-100 flex gap-3 items-start">
          <ShieldCheck className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-yellow-800 leading-relaxed">
            <p className="font-bold mb-1 text-yellow-900">Yasal Uyarı</p>
            Bu test tıbbi bir tanı koymaz. Sadece risk analizi yapan bir ön tarama aracıdır. Kesin tanı için lütfen bir çocuk psikiyatristine başvurunuz.
          </div>
        </div>

        <div className="flex items-center gap-3 p-2">
          <input
            type="checkbox"
            id="disclaimer"
            checked={acceptedDisclaimer}
            onChange={(e) => setAcceptedDisclaimer(e.target.checked)}
            className="w-6 h-6 text-primary rounded border-gray-300 focus:ring-primary cursor-pointer"
          />
          <label htmlFor="disclaimer" className="text-sm text-gray-600 select-none cursor-pointer font-medium">
            Yasal uyarıyı okudum ve onaylıyorum.
          </label>
        </div>

        <button
          type="submit"
          disabled={!acceptedDisclaimer}
          className="w-full bg-primary hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl transition shadow-lg shadow-primary/30 active:scale-[0.98] text-lg"
        >
          Değerlendirmeye Başla
        </button>
      </form>
    </div>
  );
};

export default Intro;