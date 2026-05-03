window.ChatEngineApp = function() {
    return {
        // State
        sessions: [],
        currentSessionId: null,
        messages: [],
        inputText: '',
        isGenerating: false,
        isOfflineMode: false,
        offlineTheme: 'midnight', // 'midnight' or 'afternoon'
        chatBgUrl: AppStorage.getItem('sophia_chat_bgurl') || '',
        gifts: [],
        showGiftWall: false,
        diaries: [],
        showDiaryBook: false,
        newRole: {
            name: '',
            tag: '',
            prompt: '',
            greeting: '',
            avatar: ''
        },

        loadSessions() {
                    const saved = AppStorage.getItem('sophia_sessions');
                    if (saved) {
                        this.sessions = JSON.parse(saved);
                    } else {
                        // Default session
                        this.sessions = [{
                            id: 'session_1',
                            name: 'Sophia',
                            tag: '官方',
                            avatar: '',
                            prompt: '你是Sophia，一个贴心的AI助手。',
                            greeting: '你好呀！我是Sophia，很高兴认识你~',
                            updatedAt: Date.now(),
                            unread: 0,
                            lastMsg: '你好呀！我是Sophia，很高兴认识你~'
                        }];
                        this.saveSessions();
                    }
                },
                
                saveSessions() {
                    AppStorage.setItem('sophia_sessions', JSON.stringify(this.sessions));
                },
                
                get currentSession() {
                    return this.sessions.find(s => s.id === this.currentSessionId);
                },
                
                openChat(sessionId) {
                    this.currentSessionId = sessionId;
                    this.loadMessages(sessionId);
                    this.loadSessionP1Data(sessionId);
                    
                    // Clear unread
                    const session = this.sessions.find(s => s.id === sessionId);
                    if (session) {
                        session.unread = 0;
                        this.saveSessions();
                    }
                    
                    this.switchTab('chat');
                    this.scrollToBottom();
                },
                
                loadSessionP1Data(sessionId) {
                    this.loadSessionMemories(sessionId);
                    
                    const diaries = AppStorage.getItem(`sophia_diaries_${sessionId}`);
                    if (diaries) this.diaries = JSON.parse(diaries);
                    else this.diaries = [];
                },
                
                toggleOfflineMode() {
                    if (this.isOfflineMode) {
                        // Exiting offline mode
                        this.generateOfflineSummary();
                        this.isOfflineMode = false;
                    } else {
                        // Entering offline mode
                        this.isOfflineMode = true;
                        UIManager.showToast('已进入线下模式');
                    }
                },
                
                async generateOfflineSummary() {
                    const offlineMsgs = this.messages.filter(m => m.mode === 'offline');
                    if (offlineMsgs.length < 2) {
                        UIManager.showToast('线下对话太少，无法生成总结');
                        return;
                    }
                    
                    UIManager.showToast('正在生成剧情总结...');
                    
                    const prompt = `
请总结以下线下模式的剧情，字数在500字以内。
对话内容：
${offlineMsgs.map(m => `${m.role === 'user' ? '我' : this.currentSession.name}: ${m.content}`).join('\n')}
`;
                    
                    try {
                        const response = await fetch(this.apiUrl, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${this.apiKey}`
                            },
                            body: JSON.stringify({
                                model: this.apiModel,
                                messages: [{ role: 'user', content: prompt }],
                                temperature: 0.7
                            })
                        });
                        
                        if (!response.ok) throw new Error('API Error');
                        const data = await response.json();
                        const summaryText = data.choices[0].message.content;
                        
                        const summary = {
                            id: 'summary_' + Date.now(),
                            content: summaryText,
                            timestamp: Date.now(),
                            messageRange: [offlineMsgs[0].id, offlineMsgs[offlineMsgs.length - 1].id]
                        };
                        
                        AppStorage.setItem(`sophia_offline_summaries_${this.currentSessionId}`, JSON.stringify(summary));
                        UIManager.showToast('剧情总结已生成并保存');
                    } catch (e) {
                        console.error(e);
                        UIManager.showToast('总结生成失败，可稍后在菜单中手动触发');
                    }
                },
                
                
                
                saveDiaries() {
                    if (this.currentSessionId) {
                        AppStorage.setItem(`sophia_diaries_${this.currentSessionId}`, JSON.stringify(this.diaries));
                    }
                },
                
                
                
                
                
                toggleGiftPrecious(id) {
                    const gift = this.gifts.find(g => g.id === id);
                    if (gift) {
                        gift.isPrecious = !gift.isPrecious;
                        this.saveP1Data();
                    }
                },
                
                loadMessages(sessionId) {
                    const saved = AppStorage.getItem(`sophia_messages_${sessionId}`);
                    if (saved) {
                        this.messages = JSON.parse(saved);
                    } else {
                        const session = this.sessions.find(s => s.id === sessionId);
                        if (session && session.greeting) {
                            this.messages = [{
                                id: 'msg_' + Date.now(),
                                role: 'assistant',
                                content: session.greeting,
                                type: 'text',
                                timestamp: Date.now()
                            }];
                            this.saveMessages();
                        } else {
                            this.messages = [];
                        }
                    }
                },
                
                saveMessages() {
                    if (this.currentSessionId) {
                        AppStorage.setItem(`sophia_messages_${this.currentSessionId}`, JSON.stringify(this.messages));
                    }
                },
                
                scrollToBottom() {
                    this.$nextTick(() => {
                        const container = this.$refs.messageContainer;
                        if (container) {
                            container.scrollTop = container.scrollHeight;
                        }
                    });
                },
                
                async sendMessage() {
                    if (!this.inputText.trim() || this.isGenerating) return;
                    
                    if (!this.apiKey) {
                        UIManager.showToast('请先在设置中配置API Key');
                        this.switchTab('settings');
                        return;
                    }
                    
                    const userMsg = {
                        id: 'msg_' + Date.now(),
                        role: 'user',
                        content: this.inputText.trim(),
                        type: 'text',
                        mode: this.isOfflineMode ? 'offline' : 'online',
                        timestamp: Date.now()
                    };
                    
                    this.messages.push(userMsg);
                    this.inputText = '';
                    this.scrollToBottom();
                    this.saveMessages();
                    
                    this.updateSessionLastMsg(userMsg.content);
                    
                    await this.generateReply();
                },
                
                handlePanelAction(action) {
                    if (action === 'image') {
                        this.openImagePicker('发送图片', '', (url) => this.sendImage(url));
                    } else if (action === 'court') {
                        this.openCourt();
                    } else if (action === 'gift') {
                        this.panelOpen = false;
                        // For simplicity, we just trigger a random gift from user to bot
                        const gifts = [
                            {name: '鲜花', icon: '💐', desc: '送你一束花'},
                            {name: '奶茶', icon: '🧋', desc: '请你喝奶茶'},
                            {name: '小蛋糕', icon: '🍰', desc: '甜甜的蛋糕'}
                        ];
                        const g = gifts[Math.floor(Math.random() * gifts.length)];
                        
                        const userMsg = {
                            id: 'msg_' + Date.now(),
                            role: 'user',
                            content: `[送出礼物: ${g.name}]`,
                            type: 'text',
                            mode: this.isOfflineMode ? 'offline' : 'online',
                            timestamp: Date.now()
                        };
                        this.messages.push(userMsg);
                        this.saveMessages();
                        this.scrollToBottom();
                        this.updateSessionLastMsg(userMsg.content);
                        
                        // Bot reacts to gift
                        this.currentSession.prompt += `\n[系统提示: 用户刚刚送了你${g.name}，请在下一条回复中表示感谢并表现出开心。]`;
                        this.saveSessions();
                        this.generateReply();
                        
                    } else if (action === 'diary') {
                        this.panelOpen = false;
                        this.generateDiary();
                    } else {
                        this.showDevToast();
                    }
                },
                
                sendImage(url) {
                    if (!url) return;
                    const userMsg = {
                        id: 'msg_' + Date.now(),
                        role: 'user',
                        content: '[图片]',
                        type: 'image',
                        imageId: url,
                        mode: this.isOfflineMode ? 'offline' : 'online',
                        timestamp: Date.now()
                    };
                    this.messages.push(userMsg);
                    this.saveMessages();
                    this.scrollToBottom();
                    this.panelOpen = false;
                    this.updateSessionLastMsg('[图片]');
                    // Trigger AI reply after image
                    this.generateReply();
                },
                
                updateSessionLastMsg(content) {
                    const session = this.currentSession;
                    if (session) {
                        session.lastMsg = content;
                        session.updatedAt = Date.now();
                        this.saveSessions();
                    }
                },
                
                async generateReply() {
                    this.isGenerating = true;
                    
                    const botMsg = {
                        id: 'msg_' + Date.now(),
                        role: 'assistant',
                        content: '',
                        type: 'text',
                        mode: this.isOfflineMode ? 'offline' : 'online',
                        timestamp: Date.now()
                    };
                    this.messages.push(botMsg);
                    this.scrollToBottom();
                    
                    const session = this.currentSession;
                    let systemPrompt = session ? session.prompt : 'You are a helpful assistant.';
                    
                    // Inject Core Memories
                    const confirmedMemories = this.coreMemories.filter(m => m.status === 'confirmed').slice(-20);
                    if (confirmedMemories.length > 0) {
                        systemPrompt += `\n\n[用户记忆]\n${confirmedMemories.map(m => `- ${m.content}`).join('\n')}`;
                    }
                    
                    // Inject Offline Mode Instructions
                    if (this.isOfflineMode) {
                        const savedSummary = AppStorage.getItem(`sophia_offline_summaries_${this.currentSessionId}`);
                        if (savedSummary) {
                            const summaryObj = JSON.parse(savedSummary);
                            systemPrompt += `\n\n[前情提要]\n${summaryObj.content}`;
                        }
                        
                        systemPrompt += `\n\n当前处于线下模式。请以小说风格回复，包含旁白、动作描写和环境描写。
格式示例：
Sophia轻轻放下手中的咖啡杯，抬起头看着你，眼中带着一丝笑意。
「今天怎么想起约我出来了？」
窗外的阳光洒在她身上，空气里有淡淡的花香。`;
                    }
                    
                    // Inject Gift Prompt
                    systemPrompt = window.EICSManager.injectSystemPrompt(session, systemPrompt);
                    
                    const apiMessages = [
                        { role: 'system', content: systemPrompt },
                        ...this.messages.slice(0, -1).map(m => {
                            if (m.type === 'image') {
                                return { role: m.role, content: '[用户发送了一张图片]' };
                            }
                            return { role: m.role, content: m.content };
                        })
                    ];
                    
                    try {
                        const payload = {
                            model: this.apiModel,
                            messages: apiMessages,
                            stream: this.apiStream,
                            temperature: Number(this.apiTemp) || 0.7,
                            max_tokens: Number(this.apiMaxTokens) || 300
                        };

                        if(this.apiUrl.includes('anthropic')) {
                           payload.system = systemPrompt;
                           payload.messages = this.messages.slice(0, -1).map(m => ({ role: m.role, content: m.content }));
                        }

                        const response = await fetch(this.apiUrl, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${this.apiKey}`
                            },
                            body: JSON.stringify(payload)
                        });
                        
                        if (!response.ok) {
                            if (response.status === 401) {
                                throw new Error('API Key无效，请检查配置');
                            }
                            throw new Error(`API请求失败: ${response.status}`);
                        }
                        
                        if (this.apiStream) {
                            const reader = response.body.getReader();
                            const decoder = new TextDecoder('utf-8');
                            let done = false;
                            
                            let streamState = { eicsBuffer: '', inEics: false };
                            
                            while (!done) {
                                const { value, done: readerDone } = await reader.read();
                                done = readerDone;
                                if (value) {
                                    const chunk = decoder.decode(value, { stream: !done });
                                    const lines = chunk.split('\n').filter(line => line.trim() !== '');
                                    
                                    for (const line of lines) {
                                        if (line.startsWith('data: ') && line !== 'data: [DONE]') {
                                            try {
                                                const data = JSON.parse(line.slice(6));
                                                if (data.choices && data.choices[0].delta && data.choices[0].delta.content) {
                                                    const text = data.choices[0].delta.content;
                                                    
                                                    // EICS Interception Logic
                                                    window.EICSManager.processStreamChunk(text, streamState, botMsg);
                                                    this.scrollToBottom();
                                                }
                                            } catch (e) {
                                                console.error('Error parsing stream chunk', e);
                                            }
                                        }
                                    }
                                }
                            }
                        } else {
                            const data = await response.json();
                            if (data.choices && data.choices[0].message && data.choices[0].message.content) {
                                let content = data.choices[0].message.content;
                                
                                // Process full content for EICS tags
                                window.EICSManager.processFullContent(content, botMsg);
                                this.scrollToBottom();
                            }
                        }
                        
                        this.saveMessages();
                        this.updateSessionLastMsg(botMsg.content);
                        
                        // Async Memory Extraction
                        if (this.memorySettings.autoExtract) {
                            this.extractCoreMemory();
                        }
                        
                        // Async Gift Check
                        this.checkGiftTrigger();
                        
                    } catch (error) {
                        console.error(error);
                        botMsg.content = `[发送失败: ${error.message}]`;
                        this.saveMessages();
                        if (error.message.includes('API Key无效')) {
                            UIManager.showToast(error.message);
                            this.switchTab('settings');
                        } else {
                            UIManager.showToast('网络中断或请求失败');
                        }
                    } finally {
                        this.isGenerating = false;
                    }
                },
                
                async checkGiftTrigger() {
                    // Basic probability 15%
                    if (Math.random() > 0.15) return;
                    
                    // Check if already sent 3 gifts today
                    const today = new Date().toDateString();
                    const todayGifts = this.gifts.filter(g => new Date(g.receivedAt).toDateString() === today);
                    if (todayGifts.length >= 3) return;
                    
                    // Trigger gift in next message by setting a flag
                    this.currentSession.pendingGift = true;
                },
                
                
                
                                acceptGift(msg, eIdx) {
                    window.EICSManager.acceptGift(this, msg, eIdx);
                },
                
                rejectGift(msg, eIdx) {
                    window.EICSManager.rejectGift(this, msg, eIdx);
                },
                
                async generateDiary() {
                    UIManager.showToast('正在生成今日日记...');
                    
                    const msgs = this.messages.slice(-20);
                    const prompt = `
请根据以下最近的聊天记录，以${this.currentSession.name}的口吻写一篇日记。
日记应该包含对今天聊天的感受、对用户的看法，以及一些生活细节的想象。
字数在800字左右。
聊天记录：
${msgs.map(m => `${m.role === 'user' ? '我' : this.currentSession.name}: ${m.content}`).join('\n')}
`;
                    try {
                        const response = await fetch(this.apiUrl, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${this.apiKey}` },
                            body: JSON.stringify({
                                model: this.apiModel,
                                messages: [{ role: 'user', content: prompt }],
                                temperature: 0.7
                            })
                        });
                        if (response.ok) {
                            const data = await response.json();
                            const content = data.choices[0].message.content.trim();
                            
                            const diary = {
                                id: 'diary_' + Date.now(),
                                date: new Date().toLocaleDateString(),
                                content: content,
                                timestamp: Date.now()
                            };
                            this.diaries.unshift(diary);
                            this.saveDiaries();
                            
                            // Send diary as EICS card in chat
                            const botMsg = window.EICSManager.generateDiaryMessage(this, diary);
                            this.messages.push(botMsg);
                            this.saveMessages();
                            this.scrollToBottom();
                            
                            // Add core memory that user peeked at diary
                            this.coreMemories.push({
                                id: 'mem_' + Date.now(),
                                content: `用户偷看了${this.currentSession.name}的日记`,
                                type: 'event',
                                confidence: 1.0,
                                status: 'confirmed',
                                sessionId: this.currentSessionId,
                                createdAt: Date.now(),
                                expiresAt: this.memorySettings.retention === 'forever' ? null : Date.now() + this.memorySettings.retention * 24 * 60 * 60 * 1000
                            });
                            this.saveCoreMemories();
                            
                        } else {
                            UIManager.showToast('日记生成失败');
                        }
                    } catch (e) {
                        console.error(e);
                        UIManager.showToast('日记生成失败');
                    }
                },
                
                createRole() {
                    if (!this.newRole.name || !this.newRole.prompt) {
                        UIManager.showToast('角色名和设定为必填项');
                        return;
                    }
                    
                    const newSession = {
                        id: 'session_' + Date.now(),
                        name: this.newRole.name,
                        tag: this.newRole.tag,
                        avatar: this.newRole.avatar,
                        prompt: this.newRole.prompt,
                        greeting: this.newRole.greeting,
                        updatedAt: Date.now(),
                        unread: 0,
                        lastMsg: this.newRole.greeting || '新角色已创建'
                    };
                    
                    this.sessions.unshift(newSession);
                    this.saveSessions();
                    
                    // Reset form
                    this.newRole = { name: '', tag: '', prompt: '', greeting: '', avatar: '' };
                    this.switchTab('list');
                    UIManager.showToast('角色创建成功');
                },
                
                
                formatTime(ts) {
                    const d = new Date(ts);
                    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
                },
                
                showDevToast() {
                    UIManager.showToast('该功能正在开发中，敬请期待～');
                },
                
                openImagePicker(title, currentUrl, callback) {
                    window.iosApp.openImagePicker(title, currentUrl, callback);
                }
    };
};