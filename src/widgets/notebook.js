document.addEventListener('alpine:init', () => {
          Alpine.data('notebookWidget', function() {
            return {
              get dates() {
                const today = new Date();
                const dates = [];
                for (let i = 0; i < 7; i++) {
                  const d = new Date(today);
                  d.setDate(today.getDate() + i);
                  dates.push({
                    num: d.getDate(),
                    isToday: i === 0
                  });
                }
                return dates;
              }
            }
          });
});
