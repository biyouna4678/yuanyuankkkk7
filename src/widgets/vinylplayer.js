document.addEventListener('alpine:init', () => {
          Alpine.data('vinylPlayerWidget', function(item) {
            return {
              isPlaying: false,
              audioSrc: '',
              audioElement: null,
              
              init() {
                this.audioElement = new Audio();
                this.audioElement.addEventListener('ended', () => {
                  this.isPlaying = false;
                });
              },
              togglePlay() {
                if (!this.audioSrc) {
                  this.triggerUpload();
                  return;
                }
                if (this.isPlaying) {
                  this.audioElement.pause();
                  this.isPlaying = false;
                } else {
                  this.audioElement.play();
                  this.isPlaying = true;
                }
              },
              triggerUpload() {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = 'audio/mp3, audio/mpeg, audio/wav, audio/ogg, audio/m4a, .mp3, .wav, .m4a, .ogg';
                input.onchange = (e) => this.handleFiles(e.target.files);
                input.click();
              },
              handleFiles(files) {
                if (!files || files.length === 0) return;
                const file = files[0];
                if (file) {
                  const url = URL.createObjectURL(file);
                  this.audioSrc = url;
                  this.audioElement.src = url;
                  this.audioElement.play();
                  this.isPlaying = true;
                }
              }
            }
          });
});
