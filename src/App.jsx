import React, { useState, useEffect, useCallback } from 'react';
import { Home, Heart, User, Info, Search, Star, ChevronLeft, Edit2, Share2, Send, Plus, Trash2, Camera, Upload, Loader2, LogOut, Eye, EyeOff } from 'lucide-react';

// --- KONFIGURASI API (RESTful) ---
const SUPABASE_URL = "https://xspjdhxvhzgqtzojbish.supabase.co"; 
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhzcGpkaHh2aHpncXR6b2piaXNoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQwNzg4MjQsImV4cCI6MjA3OTY1NDgyNH0.ejbSXzJ9b-ZSrls0VRgwCiWS7imEJhPHFVEc3XeH0Yk"; 

const getHeaders = () => ({
  'apikey': SUPABASE_KEY,
  'Authorization': `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json',
  'Prefer': 'return=representation'
});

// --- SERVICE LAYER ---

const authService = {
  login: async (username, password) => {
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/profiles?name=eq.${username}&select=*`, {
        method: 'GET',
        headers: getHeaders()
      });
      const users = await response.json();
      if (users.length > 0) {
        const user = users[0];
        if (user.password === password) return { success: true, data: user };
      }
      return { success: false, message: "Username atau Password salah!" };
    } catch (error) {
      return { success: false, message: error.message };
    }
  },

  register: async (username, password) => {
    try {
      const check = await fetch(`${SUPABASE_URL}/rest/v1/profiles?name=eq.${username}`, { headers: getHeaders() });
      const existing = await check.json();
      if (existing.length > 0) return { success: false, message: "Username sudah digunakan!" };

      const payload = { name: username, password: password, bio: "Pengguna Baru", image: null };
      const response = await fetch(`${SUPABASE_URL}/rest/v1/profiles`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) throw new Error("Gagal registrasi");
      return { success: true };
    } catch (error) {
      return { success: false, message: error.message };
    }
  },

  updateProfile: async (id, data) => {
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${id}`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify(data)
      });
      const result = await response.json();
      return { success: true, data: result[0] };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }
};

const gameService = {
  getAll: async () => {
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/games?select=*,reviews(*)&order=created_at.desc`, {
        headers: getHeaders()
      });
      const data = await response.json();
      return { success: true, data: data || [] };
    } catch (error) {
      return { success: false, message: error.message, data: [] };
    }
  },
  create: async (gameData) => {
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/games`, {
        method: 'POST', headers: getHeaders(), body: JSON.stringify(gameData)
      });
      const data = await response.json();
      return { success: true, data: data[0] };
    } catch (error) { return { success: false, message: error.message }; }
  },
  update: async (id, gameData) => {
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/games?id=eq.${id}`, {
        method: 'PATCH', headers: getHeaders(), body: JSON.stringify(gameData)
      });
      const data = await response.json();
      return { success: true, data: data[0] };
    } catch (error) { return { success: false, message: error.message }; }
  },
  delete: async (id) => {
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/games?id=eq.${id}`, { method: 'DELETE', headers: getHeaders() });
      return { success: true };
    } catch (error) { return { success: false, message: error.message }; }
  },
  addComment: async (commentData) => {
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/reviews`, {
        method: 'POST', headers: getHeaders(), body: JSON.stringify(commentData)
      });
      return { success: true };
    } catch (error) { return { success: false, message: error.message }; }
  }
};

const uploadService = {
  uploadImage: async (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve({ success: true, url: reader.result });
      reader.readAsDataURL(file);
    });
  }
};

// --- COMPONENTS ---

const AppLogo = ({ size = "small", center = false }) => {
  const LOGO_SRC = "/pwa-192x192.png"; 
  const imgSize = size === "large" ? "w-24 h-24" : "w-10 h-10";
  const containerClass = center ? "justify-center" : "items-center";

  return (
    <div className={`flex ${containerClass} gap-2 select-none`}>
       <img 
         src={LOGO_SRC} 
         alt="App Logo" 
         className={`${imgSize} object-contain rounded-lg`}
       />
       {/* Teks Dihilangkan Sesuai Permintaan */}
    </div>
  );
};

const AuthInput = ({ label, type = "text", placeholder, value, onChange }) => (
  <div className="w-full relative border border-black rounded-xl px-4 py-2 focus-within:ring-1 ring-black mb-4 bg-white">
    <label className="block text-xs text-gray-500 font-bold mb-0.5 absolute -top-2 left-3 bg-white px-1 pointer-events-none">
      {label}
    </label>
    <input 
      type={type} 
      value={value} 
      onChange={onChange} 
      placeholder={placeholder}
      className="w-full outline-none font-medium text-gray-800 bg-transparent text-sm py-1 placeholder:text-gray-400" 
    />
  </div>
);

// --- AUTH SCREENS ---

const LoginScreen = ({ onLoginSuccess, onGoToRegister }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!username || !password) return alert("Harap isi semua kolom!");
    setLoading(true);
    const res = await authService.login(username, password);
    if (res.success) {
      onLoginSuccess(res.data);
    } else {
      alert(res.message);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-8 font-sans">
      <div className="text-center mb-8">
        <h2 className="font-bold text-lg mb-2">Welcome To</h2>
        <AppLogo size="large" center={true} />
        <h3 className="font-bold text-sm mt-2">Your Game Review App</h3>
      </div>
      <h2 className="text-lg font-medium mb-6">Please Login</h2>
      <div className="w-full max-w-xs">
        <AuthInput label="Name" placeholder="Enter Your Username" value={username} onChange={(e) => setUsername(e.target.value)} />
        <AuthInput label="Password" type="password" placeholder="Enter Password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <button onClick={handleLogin} disabled={loading} className="w-full bg-[#5b4dff] text-white font-bold text-lg py-3 rounded-full shadow-lg hover:bg-[#4a3edb] transition mt-4 disabled:opacity-70">
          {loading ? "Logging in..." : "Login"}
        </button>
        <p className="text-xs text-gray-600 mt-4 text-center">Doesn't have account? Register <button onClick={onGoToRegister} className="text-[#5b4dff] font-bold">Here</button></p>
      </div>
    </div>
  );
};

const RegisterScreen = ({ onRegisterSuccess, onGoToLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!username || !password || !confirmPassword) return alert("Isi semua kolom!");
    if (password !== confirmPassword) return alert("Password tidak cocok!");
    setLoading(true);
    const res = await authService.register(username, password);
    if (res.success) {
      alert("Registrasi berhasil! Silakan login.");
      onRegisterSuccess();
    } else {
      alert(res.message);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-8 font-sans">
      <div className="text-center mb-8">
        <h2 className="font-bold text-lg mb-2">Register To</h2>
        <AppLogo size="large" center={true} />
        <h3 className="font-bold text-sm mt-2">Your Game Review App</h3>
      </div>
      <h2 className="text-lg font-medium mb-6">Please Register</h2>
      <div className="w-full max-w-xs">
        <AuthInput label="Create Username" placeholder="Enter Your Username" value={username} onChange={(e) => setUsername(e.target.value)} />
        <AuthInput label="Create Password" type="password" placeholder="Type a Password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <AuthInput label="Confirm Password" type="password" placeholder="Re-type Password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
        <button onClick={handleRegister} disabled={loading} className="w-full bg-[#5b4dff] text-white font-bold text-lg py-3 rounded-full shadow-lg hover:bg-[#4a3edb] transition mt-4 disabled:opacity-70">
          {loading ? "Registering..." : "Register"}
        </button>
        <p className="text-xs text-gray-600 mt-4 text-center">Already have an account? <button onClick={onGoToLogin} className="text-[#5b4dff] font-bold">Login</button></p>
      </div>
    </div>
  );
};

// --- MAIN APP ---
export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [authMode, setAuthMode] = useState('login'); 

  const [games, setGames] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refetchTrigger, setRefetchTrigger] = useState(0);
  
  const [activeTab, setActiveTab] = useState('info');
  const [viewMode, setViewMode] = useState('main'); 
  const [formMode, setFormMode] = useState('upload'); 
  const [selectedGame, setSelectedGame] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [commentInput, setCommentInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({ id: null, title: '', platform: '', link: '', rating: 0, description: '', image: null });
  const [profileEdit, setProfileEdit] = useState({ name: '', bio: '', image: '' });
  const [passwordEdit, setPasswordEdit] = useState({ oldPassword: '', newPassword: '' });

  // Initialization
  useEffect(() => {
    const storedUser = localStorage.getItem('session_user');
    if (storedUser) {
      const user = JSON.parse(storedUser);
      setCurrentUser(user);
      setProfileEdit({ name: user.name, bio: user.bio || "", image: user.image });
      const storedFavs = localStorage.getItem(`favs_${user.id}`);
      if(storedFavs) setFavorites(JSON.parse(storedFavs));
    }
  }, []);

  useEffect(() => {
    if (currentUser) {
      const fetchGames = async () => {
        setLoading(true);
        const res = await gameService.getAll();
        if (res.success) setGames(res.data);
        setLoading(false);
      };
      fetchGames();
    }
  }, [currentUser, refetchTrigger]);

  const refetch = useCallback(() => setRefetchTrigger(prev => prev + 1), []);

  // Handlers
  const handleLoginSuccess = (user) => {
    localStorage.setItem('session_user', JSON.stringify(user));
    setCurrentUser(user);
    setProfileEdit({ name: user.name, bio: user.bio || "", image: user.image });
    const storedFavs = localStorage.getItem(`favs_${user.id}`);
    setFavorites(storedFavs ? JSON.parse(storedFavs) : []);
    setActiveTab('home');
  };

  const handleLogout = () => {
    localStorage.removeItem('session_user');
    setCurrentUser(null);
    setAuthMode('login');
    setActiveTab('info');
  };

  const handleLogoClick = () => {
    setActiveTab('info');
    setViewMode('main');
    setSelectedGame(null);
  };

  const handleProfileUpdate = async () => {
    if (passwordEdit.newPassword && passwordEdit.oldPassword !== currentUser.password) {
        return alert("Password lama salah!");
    }
    setIsSubmitting(true);
    const updatedData = {
      name: profileEdit.name,
      bio: profileEdit.bio,
      image: profileEdit.image,
      password: passwordEdit.newPassword || currentUser.password
    };
    const res = await authService.updateProfile(currentUser.id, updatedData);
    if (res.success) {
      const newUser = { ...currentUser, ...updatedData };
      setCurrentUser(newUser);
      localStorage.setItem('session_user', JSON.stringify(newUser)); 
      setPasswordEdit({ oldPassword: '', newPassword: '' });
      alert("Profil berhasil disimpan!");
    } else {
      alert(res.message);
    }
    setIsSubmitting(false);
  };

  const toggleFavorite = (game, e) => {
    e?.stopPropagation();
    let newFavs;
    if (favorites.some(fav => fav.id === game.id)) {
      newFavs = favorites.filter(fav => fav.id !== game.id);
    } else {
      newFavs = [...favorites, game];
    }
    setFavorites(newFavs);
    if (currentUser) localStorage.setItem(`favs_${currentUser.id}`, JSON.stringify(newFavs));
  };

  const handleDeleteGame = async (id) => {
    if(window.confirm("Hapus review ini?")) {
        setIsSubmitting(true);
        const res = await gameService.delete(id);
        if (res.success) {
            const newFavs = favorites.filter(f => f.id !== id);
            setFavorites(newFavs);
            if(currentUser) localStorage.setItem(`favs_${currentUser.id}`, JSON.stringify(newFavs));
            refetch();
        } else {
            alert(res.message);
        }
        setIsSubmitting(false);
    }
  };

  const handleGameClick = (game) => { setSelectedGame(game); setViewMode('detail'); };
  const handleBack = () => { setViewMode('main'); setSelectedGame(null); if(viewMode === 'form') refetch(); };
  const openUploadForm = () => { setFormMode('upload'); setFormData({ id: null, title: '', platform: '', link: '', rating: 0, description: '', image: null }); setViewMode('form'); };
  const openEditForm = (game) => { setFormMode('edit'); setFormData({ ...game }); setViewMode('form'); };
  
  const handleFormSubmit = async () => {
    if (!formData.title || !formData.description) return alert("Lengkapi data!");
    setIsSubmitting(true);
    const payload = { 
        title: formData.title,
        platform: formData.platform,
        rating: parseFloat(formData.rating),
        description: formData.description,
        image: formData.image,
        link: formData.link
    };
    let res;
    if (formMode === 'upload') {
        res = await gameService.create({ ...payload, is_user_created: true });
        if(res.success) { alert("Berhasil upload!"); setActiveTab('profile'); }
    } else {
        res = await gameService.update(formData.id, payload);
        if(res.success) alert("Berhasil update!");
    }
    if(!res.success) alert("Gagal: " + res.message);
    refetch();
    setViewMode('main');
    setIsSubmitting(false);
  };

  const handleSendComment = async () => {
    if (!commentInput.trim()) return;
    const comment = { user_name: currentUser.name, user_avatar: currentUser.image, text: commentInput };
    const updatedReviews = [...(selectedGame.reviews || []), comment];
    setSelectedGame({ ...selectedGame, reviews: updatedReviews }); // Optimistic update
    setCommentInput('');
    await gameService.addComment({ game_id: selectedGame.id, ...comment });
  };

  const handleImageUpload = async (e, type) => {
    const file = e.target.files[0];
    if(file) {
        setIsSubmitting(true);
        const res = await uploadService.uploadImage(file);
        if(res.success) {
            if(type === 'profile') setProfileEdit(prev => ({...prev, image: res.url}));
            else setFormData(prev => ({...prev, image: res.url}));
        }
        setIsSubmitting(false);
    }
  };

  // --- RENDER CONTENT ---
  if (!currentUser) {
    if (authMode === 'register') return <RegisterScreen onRegisterSuccess={() => setAuthMode('login')} onGoToLogin={() => setAuthMode('login')} />;
    return <LoginScreen onLoginSuccess={handleLoginSuccess} onGoToRegister={() => setAuthMode('register')} />;
  }

  if (viewMode === 'form') return (
    <div className="min-h-screen bg-white flex flex-col pb-20 font-sans">
      <Header showBack={true} onBack={handleBack} />
      <div className="p-6 animate-fade-in flex flex-col gap-6">
        <div className="w-full h-48 bg-gray-300 rounded-3xl relative flex items-center justify-center overflow-hidden border-2 border-dashed border-gray-400 hover:bg-gray-200 transition group">
          {formData.image ? <img src={formData.image} className="w-full h-full object-cover" /> : <span className="text-gray-500 font-medium flex flex-col items-center"><Camera className="mb-2"/>{isSubmitting ? "Uploading..." : "Upload Image"}</span>}
          <label className="absolute inset-0 cursor-pointer flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30">
            <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'game')} disabled={isSubmitting} />
          </label>
        </div>
        <div className="space-y-4">
          <div className="group"><label className="flex items-center gap-2 font-bold text-lg mb-1 text-gray-700">Game Name <Edit2 size={16} className="text-gray-400"/></label><input type="text" className="w-full border-b-2 border-gray-300 outline-none py-1 font-medium text-gray-700 focus:border-[#5b4dff]" placeholder="Enter game title..." value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} /></div>
          <div><label className="flex items-center gap-2 font-bold text-md mb-1 text-gray-700">Platform <Edit2 size={14} className="text-gray-400"/></label><input type="text" className="w-full border-b-2 border-gray-300 outline-none py-1 text-gray-700 focus:border-[#5b4dff]" placeholder="PC, PS5, Xbox..." value={formData.platform} onChange={(e) => setFormData({...formData, platform: e.target.value})} /></div>
          <div><label className="flex items-center gap-2 font-bold text-md mb-1 text-gray-700">Game Link <Edit2 size={14} className="text-gray-400"/></label><input type="text" className="w-full border-b-2 border-gray-300 outline-none py-1 text-blue-500 focus:border-[#5b4dff]" placeholder="www.game.com" value={formData.link} onChange={(e) => setFormData({...formData, link: e.target.value})} /></div>
          <div className="flex flex-col items-center py-4 bg-gray-50 rounded-xl"><label className="font-bold text-sm text-gray-500 mb-2">Insert Ratings:</label><div className="flex items-center gap-2 border-b-2 border-black px-4"><Star size={24} className="fill-orange-400 text-orange-400" /><input type="number" max="10" min="0" step="0.1" className="w-16 text-center text-2xl font-bold outline-none bg-transparent" value={formData.rating} onChange={(e) => setFormData({...formData, rating: parseFloat(e.target.value)})} /></div></div>
          <div className="w-full border border-black rounded-2xl p-4 h-40 focus-within:ring-2 ring-[#5b4dff]"><span className="text-gray-400 text-xs block mb-1 font-bold">Review</span><textarea className="w-full h-full outline-none resize-none font-medium text-black text-sm bg-transparent" placeholder="Write your review here..." value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} /></div>
        </div>
        <button onClick={handleFormSubmit} disabled={isSubmitting} className="w-full bg-[#5b4dff] text-white font-bold text-xl py-3 rounded-full shadow-lg hover:bg-[#4a3edb] transition transform active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70">{isSubmitting ? <Loader2 className="animate-spin" /> : formMode === 'upload' ? <><Upload size={20}/> Upload</> : <><Share2 size={20}/> Save</>}</button>
      </div>
    </div>
  );

  // 3. DETAIL VIEW (SAFE RENDER)
  if (viewMode === 'detail' && selectedGame) return (
    <div className="min-h-screen bg-white flex flex-col pb-24 font-sans"> 
      <Header showBack={true} onBack={handleBack} />
      <div className="p-6 animate-fade-in">
        <div className="w-full h-48 bg-gray-300 rounded-3xl mb-4 relative flex items-center justify-center text-gray-700 overflow-hidden shadow-inner">{selectedGame.image ? <img src={selectedGame.image} className="w-full h-full object-cover" /> : "No Image"}</div>
        <div className="flex justify-between items-start mb-2"><h1 className="text-2xl font-bold text-black leading-tight">{selectedGame.title}</h1><div className="flex items-center gap-1 bg-orange-50 px-2 py-1 rounded-lg"><Star size={20} className="fill-orange-400 text-orange-400" /><span className="font-bold text-2xl text-orange-900">{selectedGame.rating}</span></div></div>
        <div className="mb-6 space-y-2 text-sm"><p className="font-medium text-gray-600 flex items-center gap-2"><span className="bg-gray-200 px-2 py-0.5 rounded text-xs text-gray-800">Platform</span> {selectedGame.platform}</p><p className="font-medium flex items-center gap-2"><span className="bg-gray-200 px-2 py-0.5 rounded text-xs text-gray-800">Link</span> <a href={`https://${selectedGame.link}`} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline truncate max-w-[200px]">{selectedGame.link}</a></p></div>
        <div className="flex gap-3 mb-8">
          <div className="w-12 h-12 bg-gray-300 rounded-full flex-shrink-0 flex items-center justify-center overflow-hidden border border-gray-400 shadow-sm">
             {selectedGame.is_user_created && currentUser.image ? (<img src={currentUser.image} className="w-full h-full object-cover" alt="Uploader" />) : (<div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-500"><User size={24} /></div>)}
          </div>
          <div className="border border-black rounded-2xl p-4 w-full relative bg-gray-50">
            <span className="text-xs text-gray-500 font-bold block mb-2 uppercase tracking-wider">{selectedGame.is_user_created ? currentUser.name : "Official Reviewer"}</span>
            <p className="font-medium text-sm text-gray-800 leading-relaxed">{selectedGame.description}</p>
          </div>
        </div>
        <h3 className="font-bold text-black text-lg mb-3 flex items-center gap-2"><Send size={18} className="rotate-45"/> Comments</h3>
        <div className="space-y-3 mb-6">
          {/* SAFE CHECK FOR REVIEWS ARRAY */}
          {(selectedGame.reviews || []).length > 0 ? (selectedGame.reviews || []).map((rev, idx) => (
            <div key={idx} className="bg-white border border-gray-200 rounded-xl p-3 flex gap-3 items-start shadow-sm">
              <div className="w-8 h-8 bg-gray-200 rounded-full flex-shrink-0 flex items-center justify-center text-[0.5rem] text-gray-600 overflow-hidden">{rev.user_avatar ? <img src={rev.user_avatar} className="w-full h-full object-cover"/> : "IMG"}</div>
              <div><span className="block font-bold text-xs text-blue-600 mb-0.5">{rev.user_name}</span><span className="block text-xs text-gray-700 leading-snug">{rev.text}</span></div>
            </div>
          )) : <p className="text-gray-400 text-sm text-center py-4 italic">No comments yet. Be the first!</p>}
        </div>
      </div>
      <div className="fixed bottom-0 left-0 w-full bg-white p-3 flex gap-2 items-center shadow-[0_-4px_20px_-5px_rgba(0,0,0,0.1)] z-50 border-t border-gray-100">
           <div className="w-10 h-10 bg-gray-200 rounded-full flex-shrink-0 overflow-hidden border border-gray-200">{currentUser.image ? <img src={currentUser.image} className="w-full h-full object-cover"/> : <div className="w-full h-full flex items-center justify-center text-[0.5rem] text-gray-500">YOU</div>}</div>
           <input type="text" placeholder="Add a comment..." className="flex-1 bg-gray-100 rounded-full border-none outline-none px-4 py-2.5 text-sm focus:ring-2 ring-[#5b4dff]/50 transition-all" value={commentInput} onChange={(e) => setCommentInput(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSendComment()} />
           <button onClick={handleSendComment} className="bg-[#5b4dff] p-2.5 rounded-full text-white shadow-md hover:bg-[#4a3edb] transition active:scale-95 disabled:opacity-50" disabled={!commentInput.trim()}><Send size={18} /></button>
      </div>
    </div>
  );

  const filteredGames = games.filter(g => g.title.toLowerCase().includes(searchQuery.toLowerCase()));
  const displayedGames = activeTab === 'favorites' ? favorites : filteredGames;
  const myPosts = games.filter(g => g.is_user_created);

  return (
    <div className="min-h-screen bg-white flex flex-col pb-20 font-sans">
      <Header showBack={false} searchQuery={searchQuery} onSearchChange={setSearchQuery} onLogoClick={() => { setActiveTab('info'); setViewMode('main'); }} />
      
      {activeTab === 'info' && (
        <div className="flex-1 flex flex-col items-center justify-center px-8 text-center animate-fade-in">
          <h2 className="text-gray-900 font-bold text-2xl mb-4">Welcome To</h2>
          <AppLogo size="large" center={true} />
          <h3 className="text-black font-bold text-lg mt-6 mb-8">Your Game Review App</h3>
          <p className="text-[#5b4dff] text-sm mb-4 font-medium text-justify leading-relaxed">Know Your Game is a progressive web app integrated with Supabase Database & Storage.</p>
          <button onClick={() => setActiveTab('home')} className="text-black font-bold text-lg hover:underline tracking-wide border-2 border-black px-8 py-3 rounded-xl hover:bg-black hover:text-white transition-colors">TRY IT NOW!</button>
        </div>
      )}

      {activeTab === 'profile' && (
        <div className="flex-1 flex flex-col items-center pt-10 px-6 animate-fade-in overflow-y-auto pb-20 relative w-full">
          <div className="w-full flex justify-end mb-2">
            <button onClick={handleLogout} className="flex items-center gap-2 px-3 py-2 bg-red-50 text-red-600 rounded-full font-bold text-xs hover:bg-red-100 transition shadow-sm"><LogOut size={14} /> Logout</button>
          </div>
          <div className="relative mb-8 group"><div className="w-32 h-32 bg-gray-200 rounded-full flex items-center justify-center text-gray-500 text-xs font-medium border-4 border-white shadow-xl overflow-hidden">{profileEdit.image ? <img src={profileEdit.image} className="w-full h-full object-cover" /> : "Profile Image"}</div><label className="absolute bottom-0 right-0 bg-[#5b4dff] p-2.5 rounded-xl text-white border-4 border-white shadow-md cursor-pointer hover:bg-[#4a3edb] transition active:scale-90"><Edit2 size={18} /><input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'profile')} disabled={isSubmitting} /></label></div>
          <div className="w-full space-y-4 mb-8"><div className="border border-black rounded-xl px-4 py-2 w-full focus-within:ring-1 ring-black"><label className="block text-xs text-gray-500 font-bold mb-0.5">Name</label><input type="text" value={profileEdit.name} onChange={(e) => setProfileEdit({...profileEdit, name: e.target.value})} className="w-full outline-none font-bold text-gray-800 bg-transparent text-lg" /></div><div className="border border-black rounded-xl px-4 py-2 w-full focus-within:ring-1 ring-black"><label className="block text-xs text-gray-500 font-bold mb-0.5">Bio</label><input type="text" value={profileEdit.bio} onChange={(e) => setProfileEdit({...profileEdit, bio: e.target.value})} className="w-full outline-none font-bold text-gray-800 bg-transparent" /></div><div className="pt-4"><h4 className="text-center font-medium text-sm mb-2">Password Reset</h4><AuthInput label="Enter Your Password" type="password" placeholder="Enter current password" value={passwordEdit.oldPassword} onChange={(e) => setPasswordEdit({...passwordEdit, oldPassword: e.target.value})} /><AuthInput label="Enter New Password" type="password" placeholder="Type a password" value={passwordEdit.newPassword} onChange={(e) => setPasswordEdit({...passwordEdit, newPassword: e.target.value})} /></div><button onClick={handleProfileUpdate} disabled={isSubmitting} className="w-full max-w-xs mx-auto block bg-[#5b4dff] text-white font-bold py-2.5 rounded-full shadow-md hover:bg-[#4a3edb] transition">{isSubmitting ? "Saving..." : "Save"}</button></div>
          <div className="w-full border-t pt-4"><div className="flex justify-between items-center mb-4"><h3 className="font-bold text-lg text-gray-800">My Posts:</h3></div>{loading ? <Loader2 className="animate-spin mx-auto"/> : myPosts.length > 0 ? myPosts.map(game => <GameCard key={game.id} game={game} isFav={favorites.some(f => f.id === game.id)} isEditable={true} onClick={handleGameClick} onToggleFavorite={toggleFavorite} onEdit={openEditForm} onDelete={handleDeleteGame} />) : <div className="text-center py-10 text-gray-400 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50"><p>No reviews uploaded yet.</p></div>}<button onClick={openUploadForm} className="w-full bg-[#5b4dff] text-white py-3.5 rounded-xl font-bold shadow-lg hover:bg-[#4a3edb] transition mt-6 flex items-center justify-center gap-2 active:scale-[0.99]"><Plus size={22} /> Upload New Review</button></div>
        </div>
      )}

      {(activeTab === 'home' || activeTab === 'favorites') && (
        <div className="p-6 animate-fade-in w-full">
          {activeTab === 'home' && <p className="text-gray-500 text-xs text-center mb-6 px-8 font-medium leading-relaxed">Scroll down to see game reviews or use the search bar above to find specific games.</p>}
          {activeTab === 'favorites' && <h2 className="text-2xl font-bold text-gray-800 mb-6">My Favorites</h2>}
          {loading ? (<div className="flex flex-col items-center justify-center py-20 text-gray-400"><Loader2 className="w-10 h-10 animate-spin mb-4 text-[#5b4dff]" /><p>Loading games...</p></div>) : displayedGames.length > 0 ? (displayedGames.map(game => <GameCard key={game.id} game={game} isFav={favorites.some(f => f.id === game.id)} onClick={handleGameClick} onToggleFavorite={toggleFavorite} />)) : (<div className="text-center text-gray-400 mt-20 flex flex-col items-center"><Info size={48} className="mb-4 opacity-20"/><p>{activeTab === 'favorites' ? "No favorites yet." : "No games found."}</p></div>)}
          {activeTab === 'home' && (<button onClick={() => { setActiveTab('profile'); openUploadForm(); }} className="fixed right-6 bottom-24 bg-[#5b4dff] w-14 h-14 rounded-full shadow-xl flex items-center justify-center text-white z-40 hover:scale-110 transition hover:bg-[#4a3edb] active:scale-90"><Plus size={32} /></button>)}
        </div>
      )}

      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}

const BottomNav = ({ activeTab, setActiveTab }) => (
  <div className="fixed bottom-0 left-0 w-full bg-[#5b4dff] py-3 px-8 flex justify-between items-center z-50 rounded-t-2xl shadow-[0_-5px_15px_rgba(0,0,0,0.1)]">
    <button onClick={() => setActiveTab('info')} className="p-2 active:scale-90 transition"><Info size={28} className={`transition-all duration-300 ${activeTab === 'info' ? 'text-white stroke-[2.5px] scale-110 drop-shadow-md' : 'text-white/60'}`} /></button>
    <button onClick={() => setActiveTab('home')} className="p-2 active:scale-90 transition"><Home size={28} className={`transition-all duration-300 ${activeTab === 'home' ? 'text-white stroke-[2.5px] scale-110 drop-shadow-md' : 'text-white/60'}`} /></button>
    <button onClick={() => setActiveTab('favorites')} className="p-2 active:scale-90 transition"><Heart size={28} className={`transition-all duration-300 ${activeTab === 'favorites' ? 'text-white stroke-[2.5px] scale-110 drop-shadow-md' : 'text-white/60'}`} /></button>
    <button onClick={() => setActiveTab('profile')} className="p-2 active:scale-90 transition"><User size={28} className={`transition-all duration-300 ${activeTab === 'profile' ? 'text-white stroke-[2.5px] scale-110 drop-shadow-md' : 'text-white/60'}`} /></button>
  </div>
);

const GameCard = ({ game, isFav, isEditable, onClick, onToggleFavorite, onEdit, onDelete }) => (
  <div onClick={() => onClick(game)} className="rounded-[2rem] overflow-hidden shadow-lg bg-gray-200 mb-6 cursor-pointer transform hover:scale-[1.02] transition-transform relative group w-full">
    <div className="h-40 bg-gray-300 relative flex items-center justify-center overflow-hidden">
      {game.image ? <img src={game.image} alt={game.title} className="w-full h-full object-cover" /> : <span className="text-gray-500 font-medium">No Image</span>}
      <div className="absolute top-3 right-4 flex items-center gap-1 text-white drop-shadow-md bg-black/20 px-2 py-1 rounded-lg backdrop-blur-sm">
        <Star size={16} className="fill-yellow-400 text-yellow-400" />
        <span className="font-bold text-lg">{game.rating}</span>
      </div>
    </div>
    <div className="bg-[#8a8eff] p-4 flex justify-between items-center h-16">
      <h3 className="text-white font-semibold text-lg truncate w-3/4">{game.title}</h3>
      <div className="flex gap-3 items-center">
        <button onClick={(e) => onToggleFavorite(game, e)} className="transition hover:scale-110">
          <Heart size={24} className={`${isFav ? 'fill-red-500 text-red-500' : 'text-gray-800'}`} />
        </button>
        {isEditable && (
          <div className="flex gap-2">
              <button onClick={(e) => { e.stopPropagation(); onEdit(game); }} className="transition hover:scale-110">
              <Edit2 size={24} className="text-gray-800 hover:text-white" />
              </button>
              <button onClick={(e) => { e.stopPropagation(); onDelete(game.id); }} className="transition hover:scale-110">
              <Trash2 size={24} className="text-red-600 hover:text-red-800" />
              </button>
          </div>
        )}
      </div>
    </div>
  </div>
);

const Header = ({ showBack, onBack, searchQuery, onSearchChange, onLogoClick }) => (
  <div className="bg-[#5b4dff] px-4 py-3 flex justify-between items-center shadow-md sticky top-0 z-50 h-16 w-full">
    {showBack ? (
      <div className="flex items-center w-full justify-between">
        <button onClick={onBack} className="text-white"><ChevronLeft size={28} /></button>
        <div className="scale-75 origin-right cursor-pointer" onClick={onLogoClick}><AppLogo /></div>
      </div>
    ) : (
      <>
        <div className="bg-white rounded-full flex items-center px-3 py-1.5 w-3/4 shadow-inner transition-all focus-within:ring-2 ring-blue-300">
          <input 
            type="text" 
            placeholder="Search..." 
            className="w-full outline-none text-gray-700 text-sm ml-2 bg-transparent" 
            value={searchQuery} 
            onChange={(e) => onSearchChange(e.target.value)}
          />
          <Search size={18} className="text-gray-400" />
        </div>
        <div className="scale-75 origin-right cursor-pointer" onClick={onLogoClick}><AppLogo /></div>
      </>
    )}
  </div>
);