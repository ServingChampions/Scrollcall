window.onload = () => {
  // 1. Populate State Dropdown (only if it exists)
  const allStates = [
    'TEST',
    'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA',
    'HI','ID','IL','IN','IA','KS','KY','LA','ME','MD',
    'MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
    'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC',
    'SD','TN','TX','UT','VT','VA','WA','WV','WI','WY'
  ];

  const stateSelect = document.getElementById('state');
  const recipientMessage = document.getElementById('recipientMessage');

  if (stateSelect) {
    stateSelect.innerHTML = '<option value="">-- Select State --</option>';
    allStates.forEach(stateCode => {
      const option = document.createElement('option');
      option.value = stateCode;
      option.textContent = stateCode;
      stateSelect.appendChild(option);
    });
  }

  // 2. Toggle Read More section (if present)
  const toggleBtn = document.getElementById('toggleDetails');
  const moreDetails = document.getElementById('moreDetails');
  if (toggleBtn && moreDetails) {
    toggleBtn.addEventListener('click', () => {
      const isHidden = moreDetails.classList.toggle('hidden');
      toggleBtn.innerText = isHidden ? 'Read More' : 'Hide Details';
    });
  }

  // 3. Load senator data
  let senatorsData = {};
  let selectedState = '';

  async function getSenators() {
    try {
      const res = await fetch('assets/data/senators.json');
      const data = await res.json();
      console.log("Loaded senators.json:", data);
      return data;
    } catch (err) {
      console.error("Failed to load senators.json:", err);
      return {};
    }
  }

  getSenators().then(data => {
    senatorsData = data;
  });

  // 4. State dropdown selection handler
  if (stateSelect && recipientMessage) {
    stateSelect.addEventListener('change', (e) => {
      selectedState = e.target.value;
      console.log("Selected state:", selectedState);

      if (senatorsData[selectedState]) {
        const names = senatorsData[selectedState]
          .map(s => `<strong><u>Senator ${s.name}</u></strong>`)
          .join(' and ');

        recipientMessage.innerHTML = `By selecting Support or Oppose, your email will be sent to ${names} urging them to consider your opinion on this bill.`;
        recipientMessage.classList.remove('hidden');
      } else {
        recipientMessage.classList.add('hidden');
        recipientMessage.textContent = '';
      }
    });
  }

  // 5. Create mailto link on Support/Oppose click
  function createUnifiedMailtoLink(action) {
    if (!selectedState || !senatorsData[selectedState]) {
      alert('Please select your state first.');
      return;
    }

    const subject = `Constituent Feedback on S.394 – GENIUS Act of 2025`;
    const body = `Dear Senator,\n\nAs a constituent of ${selectedState}, I am writing to express my ${action} for S.394 – the GENIUS Act of 2025.\n\nThank you for your service.\n\nSincerely,\n[Your Name]`;

    const emails = senatorsData[selectedState].map(s => s.email).join(',');
    const mailto = `mailto:${emails}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    window.location = mailto;
  }

  const supportBtn = document.getElementById('supportBtn');
  const opposeBtn = document.getElementById('opposeBtn');

  if (supportBtn) {
    supportBtn.addEventListener('click', () => {
      createUnifiedMailtoLink('support');
    });
  }

  if (opposeBtn) {
    opposeBtn.addEventListener('click', () => {
      createUnifiedMailtoLink('opposition');
    });
  }


// 6. Mobile nav toggle
const menuToggle = document.getElementById('menu-toggle');
const navMenu = document.getElementById('nav-menu');

if (menuToggle && navMenu) {
  menuToggle.addEventListener('click', () => {
    navMenu.classList.toggle('active');
  });
} else {
  console.warn("Menu toggle or nav menu not found in DOM.");
}

};
