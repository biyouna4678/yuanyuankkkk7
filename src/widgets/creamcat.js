document.addEventListener('alpine:init', () => {
          Alpine.data('creamCatWidget', function(item) {
            return {
              currentTime: '',
              timer: null,
              init() {
                this.updateTime();
                this.timer = setInterval(() => this.updateTime(), 1000);
              },
              destroy() {
                if (this.timer) clearInterval(this.timer);
              },
              updateTime() {
                const now = new Date();
                this.currentTime = now.toLocaleTimeString('zh-CN', { hour12: false });
              },
              get calendarDays() {
                // 模拟一个静态的日历展示，带有高亮和猫爪
                return [
                  { text: '8', isHighlight: true }, { text: '9' }, { text: '10' }, { text: '11' }, { text: '12' }, { text: '13' }, { text: '14', isHighlight: true },
                  { text: '15', isHighlight: true }, { text: '16' }, { text: '17' }, { text: '18' }, { text: '19' }, { text: '20' }, { text: '21', isHighlight: true },
                  { text: '22', isHighlight: true }, { text: '23' }, { text: '24' }, { text: '25' }, { text: '26' }, { text: '27' }, { text: '🐾' },
                  { text: '29', isHighlight: true }, { text: '30' }, { text: '31' }, { text: '1', isFaded: true }, { text: '2', isFaded: true }, { text: '3', isFaded: true }, { text: '4', isFaded: true }
                ];
              }
            }
          });
});
