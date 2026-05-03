window.MemoryApp = function() {
    return {
        memorySettings: JSON.parse(AppStorage.getItem('sophia_memory_settings') || '{"retention": 30, "autoExtract": true}'),
        coreMemories: [],
        showMemoryManager: false,

        loadSessionMemories(sessionId) {
            const coreMemories = AppStorage.getItem(`sophia_core_memories`);
            if (coreMemories) {
                const allMems = JSON.parse(coreMemories);
                this.coreMemories = allMems.filter(m => m.sessionId === sessionId);
            } else {
                this.coreMemories = [];
            }
        },

        saveCoreMemories() {
            const saved = AppStorage.getItem('sophia_core_memories');
            let allMems = saved ? JSON.parse(saved) : [];
            allMems = allMems.filter(m => m.sessionId !== this.currentSessionId);
            allMems = [...allMems, ...this.coreMemories];
            AppStorage.setItem('sophia_core_memories', JSON.stringify(allMems));
        },

        confirmMemory(id) {
            const mem = this.coreMemories.find(m => m.id === id);
            if (mem) {
                mem.status = 'confirmed';
                this.saveCoreMemories();
            }
        },

        deleteMemory(id) {
            this.coreMemories = this.coreMemories.filter(m => m.id !== id);
            this.saveCoreMemories();
        },

        async extractCoreMemory() {
            const msgs = this.messages.slice(-2);
            if (msgs.length < 2 || msgs[0].role !== 'user') return;
            
            const prompt = `请分析以下对话，提取值得长期记住的用户信息。
只提取高置信度的事实性信息，不要推测。
输出JSON格式：
{"new_memories": [{"content": "记忆内容", "type": "preference|habit|fact|event", "confidence": 0.0-1.0}]}
只输出JSON，不要其他文字。

对话内容：
用户: ${msgs[0].content}
角色: ${msgs[1].content}`;
            
            try {
                const response = await fetch(this.apiUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${this.apiKey}` },
                    body: JSON.stringify({
                        model: this.apiModel,
                        messages: [{ role: 'user', content: prompt }],
                        temperature: 0.1
                    })
                });
                if (!response.ok) return;
                const data = await response.json();
                let text = data.choices[0].message.content;
                text = text.replace(/```json/g, '').replace(/```/g, '').trim();
                const result = JSON.parse(text);
                
                if (result.new_memories && result.new_memories.length > 0) {
                    result.new_memories.forEach(mem => {
                        if (mem.confidence >= 0.8) {
                            this.coreMemories.push({
                                id: 'mem_' + Date.now() + Math.random().toString(36).substr(2, 5),
                                content: mem.content,
                                type: mem.type,
                                confidence: mem.confidence,
                                status: 'pending',
                                sessionId: this.currentSessionId,
                                createdAt: Date.now(),
                                expiresAt: this.memorySettings.retention === 'forever' ? null : Date.now() + (this.memorySettings.retention === 'forever' ? Infinity : this.memorySettings.retention * 24 * 60 * 60 * 1000)
                            });
                        }
                    });
                    this.saveCoreMemories();
                }
            } catch (e) {
                console.error('Memory extraction failed', e);
            }
        },

        async generateDailySummary() {
            window.UIManager.showToast('正在生成今日记忆摘要...');
            
            const today = new Date().toDateString();
            const todayMsgs = this.messages.filter(m => new Date(m.timestamp).toDateString() === today);
            
            if (todayMsgs.length === 0) {
                window.UIManager.showToast('今日没有对话记录');
                return;
            }
            
            const prompt = `请根据以下今天的聊天记录，总结一份今日记忆摘要。
字数在200字以内。
聊天记录：
${todayMsgs.map(m => `${m.role === 'user' ? '我' : this.currentSession.name}: ${m.content}`).join('\n')}
`;
            try {
                const response = await fetch(this.apiUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${this.apiKey}` },
                    body: JSON.stringify({
                        model: this.apiModel,
                        messages: [{ role: 'user', content: prompt }],
                        temperature: 0.5
                    })
                });
                if (response.ok) {
                    const data = await response.json();
                    const summaryText = data.choices[0].message.content.trim();
                    
                    const summary = {
                        id: 'summary_' + Date.now(),
                        date: today,
                        content: summaryText,
                        timestamp: Date.now()
                    };
                    
                    AppStorage.setItem(`sophia_memory_summaries_${this.currentSessionId}`, JSON.stringify(summary));
                    window.UIManager.showToast('今日记忆摘要已生成');
                } else {
                    throw new Error('API Error');
                }
            } catch (error) {
                console.error(error);
                window.UIManager.showToast('生成摘要失败');
            }
        },

        markAsCoreMemory() {
            if (this.selectedMsg) {
                const content = this.selectedMsg.content;
                if (content) {
                    this.coreMemories.push({
                        id: 'mem_' + Date.now(),
                        content: content,
                        type: 'fact',
                        confidence: 1.0,
                        status: 'confirmed',
                        sessionId: this.currentSessionId,
                        createdAt: Date.now(),
                        expiresAt: this.memorySettings.retention === 'forever' ? null : Date.now() + (this.memorySettings.retention === 'forever' ? Infinity : this.memorySettings.retention * 24 * 60 * 60 * 1000)
                    });
                    this.saveCoreMemories();
                    window.UIManager.showToast('已保存为核心记忆');
                }
                this.msgMenuOpen = false;
            }
        }
    };
};
