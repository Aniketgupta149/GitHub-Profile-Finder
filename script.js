const elements = {
  input: document.getElementById('input'),
  searchBtn: document.getElementById('search'),
  profileCard: document.getElementById('profile-card'),
  errorMessage: document.getElementById('error-message'),
  // Profile Elements
  avatar: document.getElementById('prof-img'),
  name: document.getElementById('name'),
  username: document.getElementById('username'),
  bio: document.getElementById('bio'),
  accountType: document.getElementById('account-type'),
  location: document.getElementById('location'),
  company: document.getElementById('company'),
  blog: document.getElementById('blog'),
  joined: document.getElementById('joined'),
  // Stats
  reposCount: document.getElementById('repo'),
  followers: document.getElementById('followers'),
  following: document.getElementById('following'),
  // Lists
  pinnedList: document.getElementById('pinned-list'),
  reposList: document.getElementById('repos-list'),
  contribGraph: document.getElementById('contrib-graph'),
  // Tabs
  tabs: document.querySelectorAll('.tab-btn'),
  tabPanes: document.querySelectorAll('.tab-pane')
};

const API_URL = 'https://api.github.com/users/';

// Event Listeners
elements.searchBtn.addEventListener('click', handleSearch);
elements.input.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') handleSearch();
});

elements.tabs.forEach(tab => {
  tab.addEventListener('click', () => switchTab(tab.dataset.tab));
});

async function handleSearch() {
  const username = elements.input.value.trim();
  if (!username) return;

  showLoading(true);
  hideError();
  elements.profileCard.classList.add('hidden');

  try {
    const [user, repos] = await Promise.all([
      fetchData(`${API_URL}${username}`),
      fetchData(`${API_URL}${username}/repos?sort=updated&per_page=30`)
    ]);

    if (user.message === 'Not Found') {
      throw new Error('User not found');
    }

    renderProfile(user);
    renderRepos(repos);
    renderContributionGraph(username);
    
    elements.profileCard.classList.remove('hidden');
  } catch (error) {
    showError(error.message);
  } finally {
    showLoading(false);
  }
}

async function fetchData(url) {
  const res = await fetch(url);
  if (!res.ok && res.status !== 404) {
    throw new Error('Network error');
  }
  return res.json();
}

function renderProfile(user) {
  elements.avatar.src = user.avatar_url;
  elements.name.textContent = user.name || user.login;
  elements.username.textContent = `@${user.login}`;
  elements.username.href = user.html_url;
  elements.bio.textContent = user.bio || 'No bio available';
  elements.accountType.textContent = user.type;
  
  elements.reposCount.textContent = user.public_repos;
  elements.followers.textContent = user.followers;
  elements.following.textContent = user.following;

  // Meta Info
  updateMetaItem(elements.location, user.location, '📍');
  updateMetaItem(elements.company, user.company, '🏢');
  
  if (user.blog) {
    let blogUrl = user.blog.startsWith('http') ? user.blog : `https://${user.blog}`;
    elements.blog.innerHTML = `🔗 <a href="${blogUrl}" target="_blank">${user.blog}</a>`;
    elements.blog.hidden = false;
  } else {
    elements.blog.hidden = true;
  }

  const joinedDate = new Date(user.created_at).toLocaleDateString('en-US', {
    month: 'short', year: 'numeric'
  });
  elements.joined.textContent = `🗓 Joined ${joinedDate}`;
}

function updateMetaItem(element, value, icon) {
  if (value) {
    element.textContent = `${icon} ${value}`;
    element.hidden = false;
  } else {
    element.hidden = true;
  }
}

function renderRepos(repos) {
  // Sort by stars for pinned/top section
  const topRepos = [...repos].sort((a, b) => b.stargazers_count - a.stargazers_count).slice(0, 6);
  
  elements.pinnedList.innerHTML = topRepos.map(createRepoCard).join('');
  
  // Remaining repos (or all if you prefer a different view)
  // For this design, we'll just show the top ones in the grid
  elements.reposList.innerHTML = ''; 
}

function createRepoCard(repo) {
  return `
    <a href="${repo.html_url}" target="_blank" class="repo-card">
      <div class="repo-name">
        <svg aria-hidden="true" height="16" viewBox="0 0 16 16" version="1.1" width="16" data-view-component="true" class="octicon octicon-repo mr-1 color-fg-muted">
          <path fill="currentColor" d="M2 2.5A2.5 2.5 0 014.5 0h8.75a.75.75 0 01.75.75v12.5a.75.75 0 01-.75.75h-2.5a.75.75 0 110-1.5h1.75v-2h-8a1 1 0 00-.714 1.7.75.75 0 01-1.072 1.05A2.495 2.495 0 012 11.5v-9zm10.5-1V9h-8c-.356 0-.694.074-1 .208V2.5a1 1 0 011-1h8zM5 12.25v3.25a.25.25 0 00.4.2l1.45-1.087a.25.25 0 01.3 0L8.6 15.7a.25.25 0 00.4-.2v-3.25a.25.25 0 00-.25-.25h-3.5a.25.25 0 00-.25.25z"></path>
        </svg>
        ${repo.name}
      </div>
      <p class="repo-desc">${repo.description || 'No description available'}</p>
      <div class="repo-meta">
        ${repo.language ? `
          <div class="repo-lang">
            <span class="lang-dot" style="background-color: ${getLangColor(repo.language)}"></span>
            ${repo.language}
          </div>
        ` : ''}
        <span>⭐ ${repo.stargazers_count}</span>
        <span>🍴 ${repo.forks_count}</span>
      </div>
    </a>
  `;
}

function renderContributionGraph(username) {
  // Using ghchart.rshah.org for the contribution graph
  elements.contribGraph.innerHTML = `
    <img src="https://ghchart.rshah.org/${username}" alt="Contribution Graph" style="width: 100%; min-width: 600px;">
  `;
}

function switchTab(tabName) {
  elements.tabs.forEach(tab => {
    if (tab.dataset.tab === tabName) {
      tab.classList.add('active');
    } else {
      tab.classList.remove('active');
    }
  });

  elements.tabPanes.forEach(pane => {
    if (pane.id === `${tabName}-tab`) {
      pane.classList.add('active');
    } else {
      pane.classList.remove('active');
    }
  });
}

function showError(msg) {
  elements.errorMessage.textContent = msg;
  elements.errorMessage.hidden = false;
}

function hideError() {
  elements.errorMessage.hidden = true;
}

function showLoading(isLoading) {
  elements.searchBtn.textContent = isLoading ? 'Searching...' : 'Search';
  elements.searchBtn.disabled = isLoading;
}

function getLangColor(lang) {
  const colors = {
    JavaScript: '#f1e05a',
    Python: '#3572A5',
    HTML: '#e34c26',
    CSS: '#563d7c',
    TypeScript: '#2b7489',
    Java: '#b07219',
    'C++': '#f34b7d',
    C: '#555555',
    Go: '#00ADD8',
    Rust: '#dea584'
  };
  return colors[lang] || '#8b949e';
}

// Initial load
handleSearch(); // Will fail gracefully if input is empty, but let's pre-fill for demo
elements.input.value = 'aniketgupta149';
handleSearch();
