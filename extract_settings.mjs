import fs from 'fs';

let html = fs.readFileSync('index.html', 'utf8');

const regexMap = {
    saveApiSettings: /saveApiSettings\(\) \{[\s\S]*?\},/,
    testApiConnection: /testApiConnection\(type\) \{[\s\S]*?\},(?=\s*syncCircleConfig)/,
    syncCircleConfig: /syncCircleConfig\(\) \{[\s\S]*?\},/,
    resetApiToDefault: /resetApiToDefault\(\) \{[\s\S]*?\},/,
    importApiSettings: /importApiSettings\(\) \{[\s\S]*?\},/,
    exportChatData: /exportChatData\(\) \{[\s\S]*?\},/
};

const settingsJsContent = `window.SettingsManager = {
    saveApiSettings(app) {
        AppStorage.setItem('sophia_api_key', app.apiKey);
        AppStorage.setItem('sophia_api_url', app.apiUrl);
        AppStorage.setItem('sophia_api_model', app.apiModel);
        AppStorage.setItem('sophia_api_temp', app.apiTemp);
        AppStorage.setItem('sophia_api_max_tokens', app.apiMaxTokens);
        AppStorage.setItem('sophia_api_stream', app.apiStream);
        AppStorage.setItem('sophia_circle_api_key', app.circleApiKey);
    },

    testApiConnection(app, type) {
        app[type + 'Status'] = 'unknown';
        window.UIManager.showToast('正在拨通星际网络...');
        setTimeout(() => {
            const isOk = Math.random() > 0.2;
            app[type + 'Status'] = isOk ? 'online' : 'offline';
            window.UIManager.showToast(isOk ? '连接成功 ✨' : '连接失败，检查配置 ❌');
        }, 1200);
    },

    syncCircleConfig(app) {
        app.circleApiKey = app.apiKey;
        this.saveApiSettings(app);
        window.UIManager.showToast('配置同步成功');
    },

    resetApiToDefault(app) {
        app.apiUrl = 'https://api.openai.com/v1/chat/completions';
        app.apiKey = '';
        app.apiModel = 'gpt-4o-mini';
        app.apiTemp = 0.7;
        app.apiMaxTokens = 300;
        app.apiStream = true;
        app.circleApiKey = '';
        app.roleStatus = 'unknown';
        app.circleEnabled = false;
        app.showApiResetConfirm = false;
        this.saveApiSettings(app);
        window.UIManager.showToast('一切已回到初始状态');
    },

    importApiSettings(app) {
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
                            
                            app.apiKey = data.settings.apiKey || '';
                            app.apiUrl = data.settings.apiUrl || 'https://api.openai.com/v1/chat/completions';
                            app.apiModel = data.settings.apiModel || 'gpt-4o-mini';
                            if (data.settings.apiTemp !== undefined) app.apiTemp = data.settings.apiTemp;
                            if (data.settings.apiMaxTokens !== undefined) app.apiMaxTokens = data.settings.apiMaxTokens;
                            if (data.settings.apiStream !== undefined) app.apiStream = data.settings.apiStream;
                            if (data.settings.circleApiKey) app.circleApiKey = data.settings.circleApiKey;
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

    exportChatData(app) {
        const data = {
            sessions: app.sessions,
            messages: app.messages,
            coreMemories: app.coreMemories,
            settings: {
                apiKey: app.apiKey,
                apiUrl: app.apiUrl,
                apiModel: app.apiModel,
                apiTemp: app.apiTemp,
                apiMaxTokens: app.apiMaxTokens,
                apiStream: app.apiStream,
                circleApiKey: app.circleApiKey,
                offlineTheme: app.offlineTheme,
                chatBgUrl: app.chatBgUrl,
                memorySettings: app.memorySettings
            }
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = \`sophia_chatdata_\${new Date().toISOString().split('T')[0]}.json\`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        window.UIManager.showToast('聊天数据已导出成功！');
    }
};
`;

fs.writeFileSync('src/apps/settings.js', settingsJsContent);

// Replace methods in HTML
html = html.replace(regexMap.saveApiSettings, '                saveApiSettings() { window.SettingsManager.saveApiSettings(this); },');
html = html.replace(regexMap.testApiConnection, '                testApiConnection(type) { window.SettingsManager.testApiConnection(this, type); },');
html = html.replace(regexMap.syncCircleConfig, '                syncCircleConfig() { window.SettingsManager.syncCircleConfig(this); },');
html = html.replace(regexMap.resetApiToDefault, '                resetApiToDefault() { window.SettingsManager.resetApiToDefault(this); },');
html = html.replace(regexMap.importApiSettings, '                importApiSettings() { window.SettingsManager.importApiSettings(this); },');
html = html.replace(regexMap.exportChatData, '                exportChatData() { window.SettingsManager.exportChatData(this); },');

if (!html.includes('src="/src/apps/settings.js"')) {
    html = html.replace('</head>', '    <script src="/src/apps/settings.js"></script>\n</head>');
}

fs.writeFileSync('index.html', html);
console.log('Settings extraction done');
