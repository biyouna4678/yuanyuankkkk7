window.MessageActionsApp = function() {
    return {
        // State
        msgMenuOpen: false,
        selectedMsg: null,
        showClearModal: false,

        openMessageMenu(msg) {
            this.selectedMsg = msg;
            this.msgMenuOpen = true;
        },
        
        copyMessage() {
            if (this.selectedMsg) {
                navigator.clipboard.writeText(this.selectedMsg.content);
                window.UIManager.showToast('已复制到剪贴板');
            }
            this.msgMenuOpen = false;
        },
        
        deleteMessage() {
            if (this.selectedMsg) {
                this.messages = this.messages.filter(m => m.id !== this.selectedMsg.id);
                this.saveMessages();
                window.UIManager.showToast('消息已删除');
            }
            this.msgMenuOpen = false;
        },
        
        clearHistory() {
            this.messages = [];
            this.saveMessages();
            this.updateSessionLastMsg('');
            this.menuOpen = false;
            this.showClearModal = false;
            window.UIManager.showToast('对话已清空');
        }
    };
};
