import React, { useState } from 'react';
import { api } from '../services/db';
import { Role } from '../types';
import { Brain, User, GraduationCap, ArrowRight, Lock, Loader2 } from 'lucide-react';

interface AuthViewProps {
  onLogin: () => void;
}

const AuthView: React.FC<AuthViewProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState<Role>('parent');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    schoolName: ''
  });
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleLoginProcess(formData.email);
  };

  const handleLoginProcess = async (email: string) => {
    setError('');
    setLoading(true);
    try {
      if (isLogin) {
        const user = await api.auth.login(email, role);
        if (user) {
          onLogin();
        } else {
          setError('Kullanıcı bulunamadı veya rol eşleşmedi. Lütfen kayıt olun.');
        }
      } else {
        if (!formData.name || !formData.email) {
          setError('Lütfen tüm alanları doldurun.');
          setLoading(false);
          return;
        }
        await api.auth.register({
            name: formData.name,
            email: formData.email,
            role: role,
            schoolName: formData.schoolName
        });
        onLogin();
      }
    } catch (err: any) {
      setError(err.message || 'Bir hata oluştu.');
    } finally {
        setLoading(false);
    }
  };

  const handleDemoLogin = async (demoRole: Role) => {
    setRole(demoRole);
    setLoading(true);
    const email = demoRole === 'parent' ? 'veli@demo.com' : 'ogretmen@demo.com';
    
    // Slight delay to simulate feeling of logging in
    try {
        const user = await api.auth.login(email, demoRole);
        if(user) {
            onLogin();
        } else {
            setError("Demo verisi yüklenemedi. Sayfayı yenileyip tekrar deneyin.");
        }
    } catch(e) {
        setError("Giriş hatası.");
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="mx-auto bg-primary w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg shadow-primary/30 mb-6">
          <Brain className="w-10 h-10 text-white" />
        </div>
        <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
          MindScreen AI
        </h2>
        <p className="mt-2 text-sm text-gray-600">
          {isLogin ? 'Hesabınıza giriş yapın' : 'Yeni bir hesap oluşturun'}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl rounded-2xl sm:px-10 border border-gray-100">
          
          {/* Role Switcher */}
          <div className="flex bg-gray-100 p-1 rounded-xl mb-6">
            <button
              type="button"
              onClick={() => setRole('parent')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold rounded-lg transition-all ${
                role === 'parent' ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <User className="w-4 h-4" /> Veli
            </button>
            <button
              type="button"
              onClick={() => setRole('teacher')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold rounded-lg transition-all ${
                role === 'teacher' ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <GraduationCap className="w-4 h-4" /> Öğretmen
            </button>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Ad Soyad</label>
                <div className="mt-1">
                  <input
                    type="text"
                    required={!isLogin}
                    className="appearance-none block w-full px-3 py-2.5 border border-gray-300 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700">E-posta Adresi</label>
              <div className="mt-1">
                <input
                  type="email"
                  required
                  className="appearance-none block w-full px-3 py-2.5 border border-gray-300 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>

            {role === 'teacher' && !isLogin && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Okul Adı</label>
                <div className="mt-1">
                  <input
                    type="text"
                    required={role === 'teacher' && !isLogin}
                    className="appearance-none block w-full px-3 py-2.5 border border-gray-300 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                    value={formData.schoolName}
                    onChange={(e) => setFormData({ ...formData, schoolName: e.target.value })}
                  />
                </div>
              </div>
            )}

            {isLogin && (
               <div className="bg-yellow-50 p-4 rounded-xl flex flex-col gap-3 border border-yellow-100">
                 <div className="flex items-start gap-2">
                    <Lock className="w-4 h-4 text-yellow-600 mt-0.5" />
                    <p className="text-xs text-yellow-700 leading-tight">
                      <strong>Demo Modu:</strong> Şifre gerekmez. Hızlı giriş için butonları kullanın.
                    </p>
                 </div>
                 
                 <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={loading}
                      onClick={() => handleDemoLogin('parent')}
                      className="flex-1 py-2 bg-yellow-100 hover:bg-yellow-200 text-yellow-800 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1 disabled:opacity-50"
                    >
                        {loading ? <Loader2 className="w-3 h-3 animate-spin"/> : <User className="w-3 h-3" />} Demo Veli
                    </button>
                    <button
                      type="button"
                      disabled={loading}
                      onClick={() => handleDemoLogin('teacher')}
                      className="flex-1 py-2 bg-yellow-100 hover:bg-yellow-200 text-yellow-800 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1 disabled:opacity-50"
                    >
                        {loading ? <Loader2 className="w-3 h-3 animate-spin"/> : <GraduationCap className="w-3 h-3" />} Demo Öğretmen
                    </button>
                 </div>
               </div>
            )}

            {error && (
              <div className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
                {error}
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-primary hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition active:scale-[0.98] disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {loading ? 'İşleniyor...' : (isLogin ? 'Giriş Yap' : 'Kayıt Ol')}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">
                  {isLogin ? 'Hesabınız yok mu?' : 'Zaten hesabınız var mı?'}
                </span>
              </div>
            </div>

            <div className="mt-6">
              <button
                onClick={() => setIsLogin(!isLogin)}
                disabled={loading}
                className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-gray-300 rounded-xl shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition"
              >
                {isLogin ? (
                  <>Hesap Oluştur <ArrowRight className="w-4 h-4" /></>
                ) : (
                  'Giriş Yap'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthView;