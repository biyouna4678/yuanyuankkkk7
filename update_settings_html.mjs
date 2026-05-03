import fs from 'fs';

let html = fs.readFileSync('index.html', 'utf8');

// 1. Remove the old api settings properties and methods from chatApp
const propertiesToRemove = [
    /showApiSettings: false,/,
    /apiKey: AppStorage\.getItem\('sophia_api_key'\) \|\| '',/,
    /apiUrl: AppStorage\.getItem\('sophia_api_url'\) \|\| 'https:\/\/api\.openai\.com\/v1\/chat\/completions',/,
    /apiModel: AppStorage\.getItem\('sophia_api_model'\) \|\| 'gpt-4o-mini',/,
    /showApiResetConfirm: false,/,
    /apiShowKey: false,/,
    /circleEnabled: false,/,
    /roleStatus: 'unknown',/,
    /circleStatus: 'unknown',/,
    /apiTemp: Number\(AppStorage\.getItem\('sophia_api_temp'\)\) \|\| 0\.7,/,
    /apiMaxTokens: Number\(AppStorage\.getItem\('sophia_api_max_tokens'\)\) \|\| 300,/,
    /apiStream: AppStorage\.getItem\('sophia_api_stream'\) !== 'false',/,
    /urlPresets: \['https:\/\/api\.openai\.com\/v1\/chat\/completions', 'https:\/\/api\.deepseek\.com\/v1\/chat\/completions', 'https:\/\/api\.anthropic\.com\/v1\/messages'\],/,
    /modelPresets: \['gpt-4o-mini', 'gpt-4o', 'deepseek-chat', 'claude-3-5-sonnet'\],/,
    /circleApiKey: AppStorage\.getItem\('sophia_circle_api_key'\) \|\| '',/
];

propertiesToRemove.forEach(regex => {
    html = html.replace(regex, '');
});

// Remove methods wrapped in window.SettingsManager previously inserted
const oldMethodPatterns = [
    /saveApiSettings\(\) \{ window\.SettingsManager\.saveApiSettings\(this\); \},\s*/,
    /testApiConnection\(type\) \{ window\.SettingsManager\.testApiConnection\(this, type\); \},\s*/,
    /syncCircleConfig\(\) \{ window\.SettingsManager\.syncCircleConfig\(this\); \},\s*/,
    /resetApiToDefault\(\) \{ window\.SettingsManager\.resetApiToDefault\(this\); \},\s*/,
    /importApiSettings\(\) \{ window\.SettingsManager\.importApiSettings\(this\); \},\s*/,
    /exportChatData\(\) \{ window\.SettingsManager\.exportChatData\(this\); \},?\s*/
];

oldMethodPatterns.forEach(regex => {
    html = html.replace(regex, '');
});

// Add ...window.SettingsApp()
html = html.replace(
    /switchTab\(tab\) \{/,
    '...window.SettingsApp(),\n                switchTab(tab) {'
);


// 2. Add New setting menu items in Settings Tab
const newMenuHTML = `
                <!-- Profile Entry -->
                <div class="bg-white rounded-2xl p-4 shadow-sm border border-sophia-border/20 flex justify-between items-center cursor-pointer" @click="showProfileEdit = true">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 bg-sophia-fill rounded-xl flex items-center justify-center text-xl">👤</div>
                        <div>
                            <div class="font-bold text-gray-800 text-sm">个人资料</div>
                            <div class="text-[10px] text-gray-400">编辑头像和个性签名</div>
                        </div>
                    </div>
                    <div class="text-gray-300">›</div>
                </div>

                <!-- Wallet Entry -->
                <div class="bg-white rounded-2xl p-4 shadow-sm border border-sophia-border/20 flex justify-between items-center cursor-pointer" @click="showWallet = true">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 bg-sophia-fill rounded-xl flex items-center justify-center text-xl">💎</div>
                        <div>
                            <div class="font-bold text-gray-800 text-sm">我的钱包</div>
                            <div class="text-[10px] text-gray-400">查看银核与交易记录</div>
                        </div>
                    </div>
                    <div class="text-gray-300">›</div>
                </div>

                <!-- Favorites Entry -->
                <div class="bg-white rounded-2xl p-4 shadow-sm border border-sophia-border/20 flex justify-between items-center cursor-pointer" @click="showFavorites = true">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 bg-sophia-fill rounded-xl flex items-center justify-center text-xl">⭐</div>
                        <div>
                            <div class="font-bold text-gray-800 text-sm">收藏夹</div>
                            <div class="text-[10px] text-gray-400">查看收藏的对话与卡片</div>
                        </div>
                    </div>
                    <div class="text-gray-300">›</div>
                </div>
`;

html = html.replace(
    /<!-- Gift Wall Entry -->/,
    newMenuHTML + '\n                <!-- Gift Wall Entry -->'
);

// 3. Add full-screen modal HTML for Profile, Wallet, Favorites
const fullScreenModals = `
        <!-- Profile Overaly -->
        <div x-show="showProfileEdit" x-transition.opacity.duration.300ms x-cloak class="absolute inset-0 z-[500] flex flex-col bg-[#f4f4f4]">
            <header class="glass sticky top-0 z-10 px-6 pt-12 pb-4 flex items-center gap-4 border-b border-sophia-border/10 bg-white/85 backdrop-blur-[20px]">
                <button type="button" @click="showProfileEdit = false" class="active:scale-90 transition-transform">
                    <svg class="w-6 h-6 stroke-pink-300" fill="none" viewBox="0 0 24 24" stroke-width="3"><path d="m15 18-6-6 6-6"/></svg>
                </button>
                <h3 class="font-black text-gray-700 text-lg">个人资料</h3>
            </header>
            <div class="flex-1 api-scroll-container p-5 space-y-6 pb-28 no-scrollbar">
                <section class="api-creamy-card space-y-6 api-page-fade">
                    <div class="flex flex-col items-center gap-4 py-4">
                        <div class="w-24 h-24 rounded-full shadow-[0_2px_10px_rgba(255,133,178,0.2)] border-[3px] border-white bg-cover bg-center cursor-pointer relative" 
                             :style="userProfile.avatar ? \`background-image: url(\${$store.imageStore.get(userProfile.avatar)})\` : 'background-color: white'"
                             @click="triggerAvatarUpload()">
                             <div class="absolute inset-0 bg-black/20 rounded-full flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                                <span class="text-white text-2xl">📷</span>
                             </div>
                        </div>
                        <p class="text-xs text-gray-400">点击更换头像</p>
                    </div>
                    
                    <div>
                        <label class="api-label">昵称</label>
                        <div class="api-input-group">
                            <input type="text" x-model="userProfile.name" @change="saveUserProfile()" placeholder="你的名字">
                        </div>
                    </div>
                    <div>
                        <label class="api-label">个性签名</label>
                        <div class="api-input-group">
                            <input type="text" x-model="userProfile.motto" @change="saveUserProfile()" placeholder="随便写点什么...">
                        </div>
                    </div>
                    
                    <button class="w-full bg-sophia-accent text-white font-bold py-3 mt-4 rounded-xl shadow-soft" @click="showProfileEdit = false">确认修改</button>
                </section>
            </div>
        </div>

        <!-- Wallet Overlay -->
        <div x-show="showWallet" x-transition.opacity.duration.300ms x-cloak class="absolute inset-0 z-[500] flex flex-col bg-[#f4f4f4]">
            <header class="glass sticky top-0 z-10 px-6 pt-12 pb-4 flex items-center gap-4 border-b border-sophia-border/10 bg-white/85 backdrop-blur-[20px]">
                <button type="button" @click="showWallet = false" class="active:scale-90 transition-transform">
                    <svg class="w-6 h-6 stroke-pink-300" fill="none" viewBox="0 0 24 24" stroke-width="3"><path d="m15 18-6-6 6-6"/></svg>
                </button>
                <h3 class="font-black text-gray-700 text-lg">我的钱包</h3>
            </header>
            <div class="flex-1 api-scroll-container p-5 space-y-6 pb-28 no-scrollbar">
                <!-- Balance Card -->
                <div class="bg-gradient-to-r from-pink-300 to-rose-300 text-white rounded-3xl p-6 shadow-xl shadow-pink-200">
                    <div class="text-sm font-medium mb-1 opacity-90">当前余额 (银核)</div>
                    <div class="text-4xl font-black" x-text="userWallet.coins"></div>
                    <div class="mt-4 flex gap-3">
                        <button class="bg-white/20 hover:bg-white/30 backdrop-blur-md px-4 py-2 rounded-xl text-xs font-bold transition-colors" @click="earnCoins(100, '签到奖励')">签到领取</button>
                        <button class="bg-white/20 hover:bg-white/30 backdrop-blur-md px-4 py-2 rounded-xl text-xs font-bold transition-colors">充值</button>
                    </div>
                </div>
                
                <!-- Transactions -->
                <h4 class="text-[11px] text-sophia-title font-bold tracking-[0.15em] uppercase px-1 pt-2">交易明细</h4>
                <div class="space-y-3">
                    <template x-for="item in userWallet.transactions" :key="item.id">
                        <div class="bg-white rounded-2xl p-4 shadow-sm border border-sophia-border/20 flex justify-between items-center">
                            <div>
                                <div class="font-bold text-gray-800 text-xs" x-text="item.title"></div>
                                <div class="text-[9px] text-gray-400 mt-0.5" x-text="item.date"></div>
                            </div>
                            <div class="font-bold" :class="item.amount.startsWith('+') ? 'text-green-500' : 'text-gray-700'" x-text="item.amount"></div>
                        </div>
                    </template>
                    <div x-show="userWallet.transactions.length === 0" class="text-center text-xs text-gray-400 py-10">暂无交易记录</div>
                </div>
            </div>
        </div>

        <!-- Favorites Overlay -->
        <div x-show="showFavorites" x-transition.opacity.duration.300ms x-cloak class="absolute inset-0 z-[500] flex flex-col bg-[#f4f4f4]">
            <header class="glass sticky top-0 z-10 px-6 pt-12 pb-4 flex items-center gap-4 border-b border-sophia-border/10 bg-white/85 backdrop-blur-[20px]">
                <button type="button" @click="showFavorites = false" class="active:scale-90 transition-transform">
                    <svg class="w-6 h-6 stroke-pink-300" fill="none" viewBox="0 0 24 24" stroke-width="3"><path d="m15 18-6-6 6-6"/></svg>
                </button>
                <h3 class="font-black text-gray-700 text-lg">我的收藏</h3>
            </header>
            <div class="flex-1 api-scroll-container p-5 space-y-4 pb-28 no-scrollbar">
                <template x-for="fav in userFavorites" :key="fav.id">
                    <div class="bg-white rounded-2xl p-4 shadow-sm border border-sophia-border/20 flex flex-col gap-2 relative">
                        <button class="absolute top-3 right-3 text-red-300 hover:text-red-400" @click="removeFavorite(fav.id)">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" stroke-linecap="round" stroke-linejoin="round"></path></svg>
                        </button>
                        <div class="text-[10px] text-gray-400" x-text="new Date(fav.savedAt).toLocaleDateString()"></div>
                        <div class="text-sm text-gray-800 leading-relaxed" x-text="fav.content"></div>
                        <div x-show="fav.type === 'message' && fav.roleName" class="text-[10px] font-bold text-sophia-accent mt-1" x-text="'来自: ' + fav.roleName"></div>
                    </div>
                </template>
                <div x-show="userFavorites.length === 0" class="flex flex-col items-center justify-center pt-20 text-gray-400 gap-2">
                    <span class="text-4xl opacity-50">💔</span>
                    <p class="text-xs font-medium">暂时没有收藏的内容哦</p>
                </div>
            </div>
        </div>
`;

html = html.replace(
    /<!-- API Settings Full Overlay -->/,
    fullScreenModals + '\n        <!-- API Settings Full Overlay -->'
);

fs.writeFileSync('index.html', html);
console.log('Update settings html done');
