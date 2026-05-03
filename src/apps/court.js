window.CourtApp = function() {
    return {
        // State
        courtCases: JSON.parse(AppStorage.getItem('sophia_court_cases') || '[]'),
        showCourt: false,
        currentCase: null,
        isGeneratingVerdict: false,

        saveCourtCases() {
            AppStorage.setItem('sophia_court_cases', JSON.stringify(this.courtCases));
        },

        async openCourt() {
            this.panelOpen = false;
            this.showCourt = true;
            this.currentCase = {
                caseNumber: 'CASE-' + Date.now().toString().slice(-6),
                plaintiff: '我',
                defendant: this.currentSession.name,
                caseReason: '',
                verdict: null,
                verdictText: null
            };
            
            // Generate case reason
            const msgs = this.messages.slice(-10);
            const prompt = `请根据以下最近的聊天记录，总结一个“小狗法庭”的案由。
案由应该是有趣的、生活化的抱怨，比如“回复太慢”、“说话太敷衍”、“不关心我”等。
字数不超过15字。
聊天记录：
${msgs.map(m => `${m.role === 'user' ? '我' : this.currentSession.name}: ${m.content}`).join('\n')}`;
            
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
                    this.currentCase.caseReason = data.choices[0].message.content.trim();
                }
            } catch (e) {
                console.error('Case reason generation failed', e);
                this.currentCase.caseReason = '感情纠纷';
            }
        },
        
        async generateVerdict() {
            this.isGeneratingVerdict = true;
            const msgs = this.messages.slice(-10);
            const prompt = `你现在是“小狗法庭”的法官（一只可爱但公正的小狗）。
原告：我
被告：${this.currentSession.name}
案由：${this.currentCase.caseReason}

请根据以下聊天记录，给出一份判决书。
判决书风格：幽默、可爱、偏袒某一方（随机）。
最后必须给出一个明确的判决结果（如：被告罚抄写“我爱你”三遍，或原告无理取闹驳回起诉）。

输出JSON格式：
{"verdictText": "判决书正文（约100字）", "verdict": "一句话判决结果"}

聊天记录：
${msgs.map(m => `${m.role === 'user' ? '我' : this.currentSession.name}: ${m.content}`).join('\n')}`;
            
            try {
                const response = await fetch(this.apiUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${this.apiKey}` },
                    body: JSON.stringify({
                        model: this.apiModel,
                        messages: [{ role: 'user', content: prompt }],
                        temperature: 0.8
                    })
                });
                if (response.ok) {
                    const data = await response.json();
                    let text = data.choices[0].message.content;
                    text = text.replace(/```json/g, '').replace(/```/g, '').trim();
                    const result = JSON.parse(text);
                    
                    this.currentCase.verdictText = result.verdictText;
                    this.currentCase.verdict = result.verdict;
                    
                    // Save case
                    this.courtCases.unshift({
                        ...this.currentCase,
                        date: Date.now()
                    });
                    if (this.courtCases.length > 100) this.courtCases.pop();
                    this.saveCourtCases();
                } else {
                    throw new Error('API Error');
                }
            } catch (e) {
                console.error(e);
                this.currentCase.verdictText = '法官小狗睡着了，无法给出判决...';
                this.currentCase.verdict = '休庭';
            } finally {
                this.isGeneratingVerdict = false;
            }
        }
    };
};
