window.EICSManager = {
    // 处理流状态，需要维护 inEics, eicsBuffer 并在收到 text 时解析
    processStreamChunk(text, state, botMsg) {
        if (text.includes('<EICS>')) {
            state.inEics = true;
            const parts = text.split('<EICS>');
            if (parts[0]) botMsg.content += parts[0];
            state.eicsBuffer = parts[1] || '';
        } else if (state.inEics) {
            state.eicsBuffer += text;
            if (state.eicsBuffer.includes('</EICS>')) {
                state.inEics = false;
                const parts = state.eicsBuffer.split('</EICS>');
                const jsonStr = parts[0];
                try {
                    const eicsData = JSON.parse(jsonStr);
                    if (!botMsg.eics) botMsg.eics = [];
                    botMsg.eics.push(eicsData);
                } catch(e) {
                    console.error('EICS Parse Error', e);
                }
                if (parts[1]) botMsg.content += parts[1];
                state.eicsBuffer = '';
            }
        } else {
            botMsg.content += text;
        }
    },

    processFullContent(content, botMsg) {
        const eicsRegex = /<EICS>(.*?)<\/EICS>/gs;
        let match;
        while ((match = eicsRegex.exec(content)) !== null) {
            try {
                const eicsData = JSON.parse(match[1]);
                if (!botMsg.eics) botMsg.eics = [];
                botMsg.eics.push(eicsData);
            } catch(e) {
                console.error('EICS Parse Error in non-stream mode', e);
            }
        }
        botMsg.content = content.replace(eicsRegex, '');
    },

    getGiftPrompt() {
        return `\n\n[礼物触发]\n本次回复请在末尾附带礼物，格式：\n<EICS>{"eics_type":"gift","name":"礼物名称","desc":"祝福语","icon":"礼物图标emoji"}</EICS>\n礼物名称从以下列表选择：鲜花、蛋糕、小熊、咖啡杯、音乐盒、星星瓶、羽毛笔、小皇冠\n祝福语基于角色人设生成，不超过30字。`;
    },

    getRejectPrompt(giftName) {
        return `\n[系统提示: 用户刚刚婉拒了你送的${giftName}，请在下一条回复中表现出短暂的情绪反应（失落、理解等）。]`;
    },

    acceptGift(chatApp, msg, eIdx) {
        const eics = msg.eics[eIdx];
        eics.actionTaken = 'accepted';
        
        chatApp.gifts.unshift({
            id: 'gift_' + Date.now(),
            name: eics.name,
            icon: eics.icon,
            desc: eics.desc,
            from: chatApp.currentSessionId,
            fromName: chatApp.currentSession.name,
            receivedAt: Date.now(),
            isPrecious: false
        });
        chatApp.saveGifts();
        chatApp.saveMessages();
        
        // Add core memory
        chatApp.coreMemories.push({
            id: 'mem_' + Date.now(),
            content: `${chatApp.currentSession.name}送过用户${eics.name}`,
            type: 'event',
            confidence: 1.0,
            status: 'pending',
            sessionId: chatApp.currentSessionId,
            createdAt: Date.now(),
            lastAccessedAt: Date.now()
        });
        chatApp.saveCoreMemories();
    },

    rejectGift(chatApp, msg, eIdx) {
        const eics = msg.eics[eIdx];
        eics.actionTaken = 'rejected';
        chatApp.saveMessages();
        
        chatApp.currentSession.prompt += this.getRejectPrompt(eics.name);
        chatApp.saveSessions();
    },

    injectSystemPrompt(session, systemPrompt) {
        if (session && session.pendingGift) {
            systemPrompt += this.getGiftPrompt();
            session.pendingGift = false;
        }
        return systemPrompt;
    },

    generateDiaryMessage(chatApp, diary) {
        return {
            id: 'msg_' + Date.now(),
            role: 'assistant',
            content: '',
            type: 'text',
            mode: chatApp.isOfflineMode ? 'offline' : 'online',
            timestamp: Date.now(),
            eics: [{
                eics_type: 'diary',
                date: diary.date,
                content: diary.content
            }]
        };
    }
};
