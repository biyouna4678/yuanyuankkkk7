document.addEventListener('alpine:init', () => {
          Alpine.data('rongRongWidget', function(initialItem) {
            return {
              item: initialItem,
              get daysCount() {
                if (!this.item || !this.item.startDate) return 324;
                const start = new Date(this.item.startDate);
                const now = new Date();
                if (isNaN(start.getTime())) return 324;
                start.setHours(0,0,0,0);
                now.setHours(0,0,0,0);
                const diffTime = Math.abs(now - start);
                let diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                if (this.item.includeToday) {
                    diffDays += 1;
                }
                return diffDays;
              }
            }
          });
});
