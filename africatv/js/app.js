document.addEventListener("DOMContentLoaded", function () {
    const channelSearch = document.getElementById('channelSearch');
    const channelList = document.getElementById('channelList');
    const categoriesDiv = document.getElementById('categories');
    const favoritesList = document.getElementById('favoritesList');
    const iptvPlayer = document.getElementById('iptvPlayer');
    const errorMessage = document.getElementById('error-message');
    
    // Store the fetched channels globally
    window.channels = [];
    window.categories = new Set(); // Store categories to avoid duplicates
    window.favorites = JSON.parse(localStorage.getItem('favorites')) || [];

    // Fetch and parse the IPTV playlist
    async function fetchPlaylist() {
        const playlistUrl = "https://iptv-org.github.io/iptv/categories/business.m3u"; // Example M3U URL
        try {
            const response = await fetch(playlistUrl);
            if (!response.ok) throw new Error('Failed to fetch playlist');
            const data = await response.text();

            const lines = data.split('\n');
            const channels = [];
            let currentChannel = {};

            lines.forEach((line, index) => {
                if (line.startsWith('#EXTINF')) {
                    // Parse the channel metadata (description, logo, quality, resolution, language, status)
                    const metadata = parseMetadata(line);
                    currentChannel = { ...metadata };
                } else if (line.startsWith('http')) {
                    // Set the stream URL
                    currentChannel.url = line;
                    channels.push(currentChannel); // Add the channel to the list
                }
            });

            // Update global channels and categories
            window.channels = channels;
            channels.forEach(channel => window.categories.add(channel.category));

            populateCategories();
            populateChannelList(channels);
            populateFavoritesList();
        } catch (error) {
            showError(error.message);
        }
    }

    // Parse the extended channel metadata from the M3U file
    function parseMetadata(line) {
        const regex = /#EXTINF:-1\s+tvg-id="(.+?)"\s+tvg-name="(.+?)"\s+tvg-logo="(.+?)"\s+group-title="(.+?)"\s+desc="(.+?)"\s+quality="(.+?)"\s+resolution="(.+?)"\s+language="(.+?)"\s+status="(.+?)",/;
        const match = line.match(regex);

        if (match) {
            return {
                id: match[1],
                name: match[2],
                logo: match[3],
                category: match[4],
                description: match[5],
                quality: match[6],
                resolution: match[7],
                language: match[8],
                status: match[9]
            };
        }
        return {};
    }

    // Populate the channel list with categories
    function populateCategories() {
        categoriesDiv.innerHTML = ''; // Clear categories div

        window.categories.forEach(category => {
            const categoryButton = document.createElement('button');
            categoryButton.classList.add('btn', 'btn-secondary', 'm-1');
            categoryButton.textContent = category;
            categoryButton.addEventListener('click', () => filterByCategory(category));
            categoriesDiv.appendChild(categoryButton);
        });
    }

    // Filter channels based on selected category
    function filterByCategory(category) {
        const filteredChannels = window.channels.filter(channel => channel.category === category);
        populateChannelList(filteredChannels);
    }

    // Populate the channel list with extended metadata (logo, description, quality, resolution, language, status)
    function populateChannelList(channels) {
        channelList.innerHTML = ''; // Clear previous list

        channels.forEach((channel) => {
            const channelDiv = document.createElement('div');
            channelDiv.classList.add('d-flex', 'align-items-center', 'my-2');

            const img = document.createElement('img');
            img.src = channel.logo || 'https://via.placeholder.com/150'; // Default if no logo
            img.alt = `${channel.name} logo`;
            img.classList.add('img-thumbnail', 'me-3');
            img.style.width = '50px';

            const name = document.createElement('span');
            name.textContent = channel.name;
            name.classList.add('me-3');

            const description = document.createElement('small');
            description.textContent = channel.description;
            description.classList.add('d-block', 'text-muted');

            const quality = document.createElement('span');
            quality.textContent = `Quality: ${channel.quality}`;
            quality.classList.add('badge', 'bg-primary', 'ms-3');

            const resolution = document.createElement('span');
            resolution.textContent = `Resolution: ${channel.resolution}`;
            resolution.classList.add('badge', 'bg-success', 'ms-3');

            const language = document.createElement('span');
            language.textContent = `Language: ${channel.language}`;
            language.classList.add('badge', 'bg-info', 'ms-3');

            const status = document.createElement('span');
            status.textContent = `Status: ${channel.status}`;
            status.classList.add('badge', channel.status === 'active' ? 'bg-success' : 'bg-danger', 'ms-3');

            const favoriteBtn = document.createElement('button');
            favoriteBtn.classList.add('btn', 'btn-outline-warning');
            favoriteBtn.textContent = window.favorites.includes(channel.url) ? 'Remove from Favorites' : 'Add to Favorites';
            favoriteBtn.addEventListener('click', () => toggleFavorite(channel));

            channelDiv.appendChild(img);
            channelDiv.appendChild(name);
            channelDiv.appendChild(description);
            channelDiv.appendChild(quality);
            channelDiv.appendChild(resolution);
            channelDiv.appendChild(language);
            channelDiv.appendChild(status);
            channelDiv.appendChild(favoriteBtn);
            channelList.appendChild(channelDiv);
        });
    }

    // Toggle favorite channel
    function toggleFavorite(channel) {
        if (window.favorites.includes(channel.url)) {
            window.favorites = window.favorites.filter(url => url !== channel.url);
        } else {
            window.favorites.push(channel.url);
        }

        localStorage.setItem('favorites', JSON.stringify(window.favorites));
        populateChannelList(window.channels); // Re-populate the channel list
        populateFavoritesList();
    }

    // Populate the favorites list
    function populateFavoritesList() {
        favoritesList.innerHTML = ''; // Clear favorites list
        const favoriteChannels = window.channels.filter(channel => window.favorites.includes(channel.url));

        favoriteChannels.forEach((channel) => {
            const favoriteDiv = document.createElement('div');
            favoriteDiv.classList.add('d-flex', 'align-items-center', 'my-2');

            const img = document.createElement('img');
            img.src = channel.logo || 'https://via.placeholder.com/150'; // Default if no logo
            img.alt = `${channel.name} logo`;
            img.classList.add('img-thumbnail', 'me-3');
            img.style.width = '50px';

            const name = document.createElement('span');
            name.textContent = channel.name;
            name.classList.add('me-3');

            favoriteDiv.appendChild(img);
            favoriteDiv.appendChild(name);
            favoritesList.appendChild(favoriteDiv);
        });
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

    // Search functionality
    function filterChannels() {
        const searchTerm = channelSearch.value.toLowerCase();
        const filteredChannels = window.channels.filter(channel =>
            channel.name.toLowerCase().includes(searchTerm)
        );
        populateChannelList(filteredChannels);
    }

    // Listen for search input changes
    channelSearch.addEventListener('input', filterChannels);

    // Initial setup
    fetchPlaylist();
});
