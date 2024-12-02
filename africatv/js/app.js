document.addEventListener("DOMContentLoaded", function () {
    const channelSelect = document.getElementById('channelSelect');
    const iptvPlayer = document.getElementById('iptvPlayer');
    const videoSource = document.getElementById('videoSource');
    const channelSearch = document.getElementById('channelSearch');
    const errorMessage = document.getElementById('error-message');

    // Fetch the IPTV playlist
    async function fetchPlaylist() {
        const playlistUrl = "https://raw.githubusercontent.com/iptv-org/iptv/master/playlist.m3u"; // Example M3U URL
        try {
            const response = await fetch(playlistUrl);
            if (!response.ok) throw new Error('Failed to fetch playlist');
            const data = await response.text();
            
            // Extract M3U links (channel URLs)
            const lines = data.split('\n');
            const channels = lines.filter(line => line.startsWith('http')).map((url, index) => ({
                name: `Channel ${index + 1}`,
                url: url,
            }));

            // Store channels globally
            window.channels = channels;

            // Populate the channel select dropdown
            populateChannelSelect(channels);

        } catch (error) {
            showError(error.message);
        }
    }

    // Populate the channel dropdown
    function populateChannelSelect(channels) {
        channelSelect.innerHTML = '<option value="" disabled selected>Select a Channel</option>';
        channels.forEach((channel, index) => {
            const option = document.createElement('option');
            option.value = index;
            option.textContent = channel.name;
            channelSelect.appendChild(option);
        });
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
                hls.on(Hls.Events.ERROR, function () {
                    showError('Failed to load the stream');
                });
            }
            // Fallback for browsers with native HLS support
            else if (iptvPlayer.canPlayType('application/vnd.apple.mpegurl')) {
                iptvPlayer.src = streamUrl;
                iptvPlayer.play();
            } else {
                showError('HLS is not supported in this browser.');
            }
        }
    }

    // Show error message
    function showError(message) {
        errorMessage.textContent = message;
        errorMessage.classList.remove('d-none');
    }

    // Hide error message
    function hideError() {
        errorMessage.classList.add('d-none');
    }

    // Filter the channels based on search input
    function filterChannels() {
        const searchTerm = channelSearch.value.toLowerCase();
        const filteredChannels = window.channels.filter(channel =>
            channel.name.toLowerCase().includes(searchTerm)
        );
        populateChannelSelect(filteredChannels);
    }

    // Listen for search input changes
    channelSearch.addEventListener('input', filterChannels);

    // Initial setup
    fetchPlaylist();
});
