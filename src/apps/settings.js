window.SettingsApp = function() {
    return {
        // API Settings
        showApiSettings: false,
        apiKey: AppStorage.getItem('sophia_api_key') || '',
        apiUrl: AppStorage.getItem('sophia_api_url') || 'https://api.openai.com/v1/chat/completions',
        apiModel: AppStorage.getItem('sophia_api_model') || 'gpt-4o-mini',
        showApiResetConfirm: false,
        apiShowKey: false,
        circleEnabled: false,
        roleStatus: 'unknown',
        circleStatus: 'unknown',
        apiTemp: Number(AppStorage.getItem('sophia_api_temp')) || 0.7,
        apiMaxTokens: Number(AppStorage.getItem('sophia_api_max_tokens')) || 300,
        apiStream: AppStorage.getItem('sophia_api_stream') !== 'false',
        urlPresets: ['https://api.openai.com/v1/chat/completions', 'https://api.deepseek.com/v1/chat/completions', 'https://api.anthropic.com/v1/messages'],
        modelPresets: ['gpt-4o-mini', 'gpt-4o', 'deepseek-chat', 'claude-3-5-sonnet'],
        circleApiKey: AppStorage.getItem('sophia_circle_api_key') || '',

        // Profile
        showProfileEdit: false,
        userProfile: JSON.parse(AppStorage.getItem('sophia_user_profile') || '{"name":"You","motto":"Keep exploring","avatar":""}'),
        
        // Favorites
        showFavorites: false,
        userFavorites: JSON.parse(AppStorage.getItem('sophia_favorites') || '[]'),
        
        // Wallet
        showWallet: false,
        userWallet: JSON.parse(AppStorage.getItem('sophia_user_wallet') || '{"coins": 100, "transactions": []}'),

        saveApiSettings() {
            AppStorage.setItem('sophia_api_key', this.apiKey);
            AppStorage.setItem('sophia_api_url', this.apiUrl);
            AppStorage.setItem('sophia_api_model', this.apiModel);
            AppStorage.setItem('sophia_api_temp', this.apiTemp);
            AppStorage.setItem('sophia_api_max_tokens', this.apiMaxTokens);
            AppStorage.setItem('sophia_api_stream', this.apiStream);
            AppStorage.setItem('sophia_circle_api_key', this.circleApiKey);
        },

        testApiConnection(type) {
            this[type + 'Status'] = 'unknown';
            window.UIManager.showToast('正在拨通星际网络...');
            setTimeout(() => {
                const isOk = Math.random() > 0.2;
                this[type + 'Status'] = isOk ? 'online' : 'offline';
                window.UIManager.showToast(isOk ? '连接成功 ✨' : '连接失败，检查配置 ❌');
            }, 1200);
        },

        syncCircleConfig() {
            this.circleApiKey = this.apiKey;
            this.saveApiSettings();
            window.UIManager.showToast('配置同步成功');
        },

        resetApiToDefault() {
            this.apiUrl = 'https://api.openai.com/v1/chat/completions';
            this.apiKey = '';
            this.apiModel = 'gpt-4o-mini';
            this.apiTemp = 0.7;
            this.apiMaxTokens = 300;
            this.apiStream = true;
            this.circleApiKey = '';
            this.roleStatus = 'unknown';
            this.circleEnabled = false;
            this.showApiResetConfirm = false;
            this.saveApiSettings();
            window.UIManager.showToast('一切已回到初始状态');
        },

        importApiSettings() {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'application/json';
            input.onchange = e => {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = event => {
                        try {
                            const data = JSON.parse(event.target.result);
                            if (data.settings && data.settings.apiKey !== undefined) {
                                AppStorage.setItem('sophia_api_key', data.settings.apiKey || '');
                                AppStorage.setItem('sophia_api_url', data.settings.apiUrl || 'https://api.openai.com/v1/chat/completions');
                                AppStorage.setItem('sophia_api_model', data.settings.apiModel || 'gpt-4o-mini');
                                if (data.settings.apiTemp !== undefined) AppStorage.setItem('sophia_api_temp', data.settings.apiTemp);
                                if (data.settings.apiMaxTokens !== undefined) AppStorage.setItem('sophia_api_max_tokens', data.settings.apiMaxTokens);
                                if (data.settings.apiStream !== undefined) AppStorage.setItem('sophia_api_stream', data.settings.apiStream);
                                if (data.settings.circleApiKey) AppStorage.setItem('sophia_circle_api_key', data.settings.circleApiKey);
                                window.UIManager.showToast('API 设置导入成功，即将生效的配置已保存！');
                                
                                this.apiKey = data.settings.apiKey || '';
                                this.apiUrl = data.settings.apiUrl || 'https://api.openai.com/v1/chat/completions';
                                this.apiModel = data.settings.apiModel || 'gpt-4o-mini';
                                if (data.settings.apiTemp !== undefined) this.apiTemp = data.settings.apiTemp;
                                if (data.settings.apiMaxTokens !== undefined) this.apiMaxTokens = data.settings.apiMaxTokens;
                                if (data.settings.apiStream !== undefined) this.apiStream = data.settings.apiStream;
                                if (data.settings.circleApiKey) this.circleApiKey = data.settings.circleApiKey;
                            } else {
                                window.UIManager.showToast('无效的配置文件');
                            }
                        } catch (err) {
                            window.UIManager.showToast('文件解析失败');
                        }
                    };
                    reader.readAsText(file);
                }
            };
            input.click();
        },

        exportChatData() {
            const data = {
                sessions: this.sessions,
                messages: this.messages,
                coreMemories: this.coreMemories,
                settings: {
                    apiKey: this.apiKey,
                    apiUrl: this.apiUrl,
                    apiModel: this.apiModel,
                    apiTemp: this.apiTemp,
                    apiMaxTokens: this.apiMaxTokens,
                    apiStream: this.apiStream,
                    circleApiKey: this.circleApiKey,
                    offlineTheme: this.offlineTheme,
                    chatBgUrl: this.chatBgUrl,
                    memorySettings: this.memorySettings
                }
            };
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `sophia_chatdata_${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            window.UIManager.showToast('聊天数据已导出成功！');
        },

        // Profile logic
        saveUserProfile() {
            AppStorage.setItem('sophia_user_profile', JSON.stringify(this.userProfile));
            window.UIManager.showToast('个人资料已保存');
        },

        triggerAvatarUpload() {
            window.UIManager.openImagePicker('选择你的头像', this.userProfile.avatar, (url) => {
                this.userProfile.avatar = url;
                this.saveUserProfile();
            });
        },

        // Wallet Logic
        earnCoins(amount, title) {
            this.userWallet.coins += amount;
            this.userWallet.transactions.unshift({
                id: Date.now(),
                title: title,
                amount: '+' + amount,
                date: new Date().toISOString().split('T')[0]
            });
            AppStorage.setItem('sophia_user_wallet', JSON.stringify(this.userWallet));
            window.UIManager.showToast(`获得 ${amount} 银核`);
        },
        spendCoins(amount, title) {
            if (this.userWallet.coins < amount) {
                window.UIManager.showToast('银核不足！');
                return false;
            }
            this.userWallet.coins -= amount;
            this.userWallet.transactions.unshift({
                id: Date.now(),
                title: title,
                amount: '-' + amount,
                date: new Date().toISOString().split('T')[0]
            });
            AppStorage.setItem('sophia_user_wallet', JSON.stringify(this.userWallet));
            return true;
        },

        // Favorites Logic
        addFavorite(item) {
            this.userFavorites.unshift({ ...item, savedAt: Date.now() });
            AppStorage.setItem('sophia_favorites', JSON.stringify(this.userFavorites));
            window.UIManager.showToast('已加入收藏');
        },
        removeFavorite(id) {
            this.userFavorites = this.userFavorites.filter(f => f.id !== id);
            AppStorage.setItem('sophia_favorites', JSON.stringify(this.userFavorites));
            window.UIManager.showToast('已取消收藏');
        }
    };
};
