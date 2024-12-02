document.addEventListener("DOMContentLoaded", function () {
    const channelSelect = document.getElementById('channelSelect');
    const iptvPlayer = document.getElementById('iptvPlayer');
    const videoSource = document.getElementById('videoSource');

    // Fetch the IPTV playlist
    async function fetchPlaylist() {
        const playlistUrl = "https://raw.githubusercontent.com/iptv-org/iptv/master/playlist.m3u"; // Example M3U URL
        const response = await fetch(playlistUrl);
        const data = await response.text();
        
        // Extract M3U links (channel URLs)
        const lines = data.split('\n');
        const channels = lines.filter(line => line.startsWith('http')).map(url => ({ url }));

        // Populate the channel select dropdown
        channels.forEach((channel, index) => {
            const option = document.createElement('option');
            option.value = index;
            option.textContent = `Channel ${index + 1}`;
            channelSelect.appendChild(option);
        });
        
        // Store the channels globally
        window.channels = channels;
    }

    // Play the selected stream
    function playStream() {
        const selectedChannel = window.channels[channelSelect.value];
        if (selectedChannel && selectedChannel.url) {
            const streamUrl = selectedChannel.url;

            // Use HLS.js for streaming
            if (Hls.isSupported()) {
                const hls = new Hls();
                hls.loadSource(streamUrl);
                hls.attachMedia(iptvPlayer);
                hls.on(Hls.Events.MANIFEST_PARSED, function() {
                    iptvPlayer.play();
                });
            }
            // Fallback for browsers with native HLS support
            else if (iptvPlayer.canPlayType('application/vnd.apple.mpegurl')) {
                iptvPlayer.src = streamUrl;
                iptvPlayer.play();
            }
        }
    }

    // Initial setup
    fetchPlaylist();
});
