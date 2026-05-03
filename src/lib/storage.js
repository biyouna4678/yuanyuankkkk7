window.STORAGE_CONSTANTS = {
    DB_NAME: 'SophiaDataDB',
    STORE_IMAGES: 'images',
    MAX_IMAGES: 50
};

window.ImageStorage = {
    db: null,
    async init() {
        if (this.db) return this.db;
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(window.STORAGE_CONSTANTS.DB_NAME, 1);
            request.onupgradeneeded = (e) => {
                const db = e.target.result;
                if (!db.objectStoreNames.contains(window.STORAGE_CONSTANTS.STORE_IMAGES)) {
                    db.createObjectStore(window.STORAGE_CONSTANTS.STORE_IMAGES, { keyPath: 'id' });
                }
            };
            request.onsuccess = (e) => { this.db = e.target.result; resolve(this.db); };
            request.onerror = (e) => reject(e.target.error);
        });
    },
    async saveImage(file) {
        await this.init();
        const id = 'indexeddb://img_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction(window.STORAGE_CONSTANTS.STORE_IMAGES, 'readwrite');
            const store = tx.objectStore(window.STORAGE_CONSTANTS.STORE_IMAGES);
            const countReq = store.count();
            countReq.onsuccess = () => {
                if (countReq.result >= window.STORAGE_CONSTANTS.MAX_IMAGES) {
                    reject(new Error('QUOTA_EXCEEDED'));
                    return;
                }
                const putReq = store.put({ id, blob: file, timestamp: Date.now() });
                putReq.onsuccess = () => resolve(id);
                putReq.onerror = () => reject(putReq.error);
            };
        });
    },
    async getImage(id) {
        await this.init();
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction(window.STORAGE_CONSTANTS.STORE_IMAGES, 'readonly');
            const store = tx.objectStore(window.STORAGE_CONSTANTS.STORE_IMAGES);
            const req = store.get(id);
            req.onsuccess = () => {
                if (req.result) resolve(URL.createObjectURL(req.result.blob));
                else resolve(null);
            };
            req.onerror = () => reject(req.error);
        });
    }
};

window.AppStorage = {
    getItem(key) {
        return localStorage.getItem(key);
    },
    setItem(key, value) {
        localStorage.setItem(key, value);
    },
    removeItem(key) {
        localStorage.removeItem(key);
    }
};
