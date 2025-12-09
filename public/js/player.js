(function(){
    const qs = new URLSearchParams(location.search);
    const title = (qs.get('title') || 'Self-hosted Sermon (Example)').toString();
    const src = (qs.get('src') || 'https://example.com/media/sermons/example-1080p.mp4').toString();
    const poster = (qs.get('poster') || 'https://example.com/media/sermons/example-poster.jpg').toString();
    const speaker = (qs.get('speaker') || 'Pastor Name').toString();
    const date = (qs.get('date') || 'Jan 1, 2025').toString();
    const duration = (qs.get('duration') || '45:00').toString();
    const description = (qs.get('description') || 'This is a placeholder description. Replace with your sermon summary.').toString();

    document.title = title + ' - Sermon Player';
    document.getElementById('overlayTitle').textContent = title;
    document.getElementById('overlayMeta').textContent = speaker + ' • ' + date;
    document.getElementById('infoTitle').textContent = title;
    document.getElementById('infoDate').textContent = '📅 ' + date;
    document.getElementById('infoSpeaker').textContent = '👤 ' + speaker;
    document.getElementById('infoDuration').textContent = '⏱️ ' + duration;
    document.getElementById('infoDescription').textContent = description;

    const video = document.getElementById('mainVideo');
    const posterImg = document.getElementById('posterImage');
    const posterContainer = document.getElementById('videoPoster');
    const playButtonLarge = document.getElementById('playButtonLarge');
    const playPauseBtn = document.getElementById('playPauseBtn');
    const controls = document.getElementById('videoControls');
    const progressBar = document.getElementById('progressBar');
    const progressContainer = document.getElementById('progressContainer');
    const timeDisplay = document.getElementById('timeDisplay');
    const volumeBtn = document.getElementById('volumeBtn');
    const volumeSlider = document.getElementById('volumeSlider');
    const volumeFill = document.getElementById('volumeFill');
    const fullscreenBtn = document.getElementById('fullscreenBtn');
    const loadingSpinner = document.getElementById('loadingSpinner');
    const playerShell = document.getElementById('videoPlayer');

    // Set poster image
    posterImg.src = poster;
    posterImg.onerror = function(){ posterImg.remove(); };

    // Attach source (HLS if m3u8)
    function attachSource(url){
        if (url.toLowerCase().endsWith('.m3u8')) {
            if (Hls.isSupported()) {
                const hls = new Hls({ maxBufferLength: 30 });
                hls.loadSource(url);
                hls.attachMedia(video);
            } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
                video.src = url; // Safari
            } else {
                // Fallback: show message or try MP4 alternative if provided
                console.warn('HLS not supported in this browser');
            }
        } else {
            const source = document.createElement('source');
            source.src = url;
            source.type = 'video/mp4';
            video.appendChild(source);
        }
    }
    attachSource(src);

    // Player controls
    let isPlaying = false;
    let controlsTimeout = null;

    function formatTime(seconds){
        if (isNaN(seconds)) return '0:00';
        const mins = Math.floor(seconds / 60) || 0;
        const secs = Math.floor(seconds % 60) || 0;
        return `${mins}:${secs.toString().padStart(2,'0')}`;
    }
    function updateTime(){
        timeDisplay.textContent = `${formatTime(video.currentTime)} / ${formatTime(video.duration)}`;
    }
    function updateProgress(){
        const pct = (video.currentTime / (video.duration || 1)) * 100;
        progressBar.style.width = pct + '%';
        updateTime();
    }
    function seek(e){
        const rect = progressContainer.getBoundingClientRect();
        const pos = (e.clientX - rect.left) / rect.width;
        video.currentTime = pos * (video.duration || 0);
    }

    function play(){ video.play(); posterContainer.classList.add('hidden'); }
    function togglePlay(){ video.paused ? video.play() : video.pause(); }
    function onPlay(){ isPlaying = true; playPauseBtn.textContent = '⏸️'; }
    function onPause(){ isPlaying = false; playPauseBtn.textContent = '▶️'; }
    function toggleMute(){ video.muted = !video.muted; volumeBtn.textContent = video.muted ? '🔇' : '🔊'; volumeFill.style.width = video.muted ? '0%' : (video.volume*100)+'%'; }
    function changeVolume(e){ const rect = volumeSlider.getBoundingClientRect(); const pos = (e.clientX-rect.left)/rect.width; video.volume = Math.max(0, Math.min(1, pos)); video.muted=false; volumeBtn.textContent='🔊'; volumeFill.style.width=(video.volume*100)+'%'; }
    function toggleFullscreen(){ if (!document.fullscreenElement) { playerShell.requestFullscreen(); } else { document.exitFullscreen(); } }
    function showControls(){ controls.classList.add('show'); clearTimeout(controlsTimeout); if (isPlaying) { controlsTimeout = setTimeout(()=>controls.classList.remove('show'), 3000); } }
    function hideControls(){ if (isPlaying) controls.classList.remove('show'); }
    function showLoading(){ loadingSpinner.classList.add('active'); }
    function hideLoading(){ loadingSpinner.classList.remove('active'); }

    playButtonLarge.addEventListener('click', play);
    playPauseBtn.addEventListener('click', togglePlay);
    video.addEventListener('timeupdate', updateProgress);
    video.addEventListener('loadedmetadata', updateTime);
    video.addEventListener('play', onPlay);
    video.addEventListener('pause', onPause);
    video.addEventListener('waiting', showLoading);
    video.addEventListener('canplay', hideLoading);

    progressContainer.addEventListener('click', seek);
    volumeBtn.addEventListener('click', toggleMute);
    volumeSlider.addEventListener('click', changeVolume);
    fullscreenBtn.addEventListener('click', toggleFullscreen);

    playerShell.addEventListener('mousemove', showControls);
    playerShell.addEventListener('mouseleave', hideControls);

    document.addEventListener('keydown', (e)=>{
        if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
        switch(e.key){
            case ' ': case 'k': e.preventDefault(); togglePlay(); break;
            case 'f': toggleFullscreen(); break;
            case 'm': toggleMute(); break;
            case 'ArrowLeft': video.currentTime = Math.max(0, video.currentTime - 5); break;
            case 'ArrowRight': video.currentTime = Math.min(video.duration||0, video.currentTime + 5); break;
        }
    });
})();