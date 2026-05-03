document.addEventListener('alpine:init', () => {
          Alpine.data('listenTogetherPlayer', function() {
            return {
              audio: null,
              playlist: [],
              currentIndex: 0,
              isPlaying: false,
              currentTime: 0,
              duration: 0,
              isUploading: false,
              uploadProgress: 0,
              
              init() {
                this.audio = new Audio();
                this.audio.addEventListener('timeupdate', () => {
                  this.currentTime = this.audio.currentTime;
                });
                this.audio.addEventListener('loadedmetadata', () => {
                  this.duration = this.audio.duration;
                });
                this.audio.addEventListener('ended', () => {
                  this.nextSong();
                });
              },
              
              formatTime(seconds) {
                if (!seconds || isNaN(seconds)) return '0:00';
                const m = Math.floor(seconds / 60);
                const s = Math.floor(seconds % 60).toString().padStart(2, '0');
                return `${m}:${s}`;
              },
              
              togglePlay() {
                if (this.playlist.length === 0) return;
                if (this.isPlaying) {
                  this.audio.pause();
                  this.isPlaying = false;
                } else {
                  this.audio.play();
                  this.isPlaying = true;
                }
              },
              
              nextSong() {
                if (this.playlist.length === 0) return;
                this.currentIndex = (this.currentIndex + 1) % this.playlist.length;
                this.playCurrent();
              },
              
              prevSong() {
                if (this.playlist.length === 0) return;
                this.currentIndex = (this.currentIndex - 1 + this.playlist.length) % this.playlist.length;
                this.playCurrent();
              },
              
              playCurrent() {
                if (this.playlist.length === 0) return;
                this.audio.src = this.playlist[this.currentIndex].url;
                this.audio.play();
                this.isPlaying = true;
              },
              
              triggerUpload() {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = 'audio/mp3, audio/mpeg';
                input.multiple = true;
                input.onchange = (e) => this.handleFiles(e.target.files);
                input.click();
              },
              
              handleFiles(files) {
                if (!files || files.length === 0) return;
                
                this.isUploading = true;
                this.uploadProgress = 0;
                
                let progress = 0;
                const interval = setInterval(() => {
                  progress += 10;
                  this.uploadProgress = progress;
                  if (progress >= 100) {
                    clearInterval(interval);
                    this.processFiles(files);
                  }
                }, 50);
              },
              
              processFiles(files) {
                Array.from(files).forEach(file => {
                  const url = URL.createObjectURL(file);
                  let title = file.name.replace(/\.[^/.]+$/, "");
                  let artist = "未知歌手";
                  
                  if (title.includes('-')) {
                    const parts = title.split('-');
                    artist = parts[0].trim();
                    title = parts[1].trim();
                  }
                  
                  this.playlist.push({
                    title,
                    artist,
                    url
                  });
                });
                
                this.isUploading = false;
                
                if (this.playlist.length > 0 && !this.isPlaying) {
                  this.currentIndex = this.playlist.length - files.length;
                  this.playCurrent();
                }
              }
            }
          });
});
