window.onload = () => {
  const allStates = [
    'TEST',
    'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA',
    'HI','ID','IL','IN','IA','KS','KY','LA','ME','MD',
    'MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
    'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC',
    'SD','TN','TX','UT','VT','VA','WA','WV','WI','WY'
  ];

  let senatorsData = {};
  let selectedStates = {}; // Map bill index -> selected state

  // Load senators.json once
  async function getSenators() {
    try {
      const res = await fetch('assets/data/senators.json');
      return await res.json();
    } catch (err) {
      console.error("Failed to load senators.json:", err);
      return {};
    }
  }

  // Set up each bill card independently
  function setupBillCard(card, index) {
    const dropdown = card.querySelector('.state-dropdown');
    const message = card.querySelector('.recipient-message');
    const supportBtn = card.querySelector('.support-btn');
    const opposeBtn = card.querySelector('.oppose-btn');
    const toggleBtn = card.querySelector('.details-toggle');
    const detailsBox = card.querySelector('.details');

    // Populate dropdown
    dropdown.innerHTML = '<option value="">-- Select State --</option>';
    allStates.forEach(state => {
      const opt = document.createElement('option');
      opt.value = state;
      opt.textContent = state;
      dropdown.appendChild(opt);
    });

    // Dropdown change logic
    dropdown.addEventListener('change', (e) => {
      const state = e.target.value;
      selectedStates[index] = state;

      if (senatorsData[state]) {
        const names = senatorsData[state]
          .map(s => `<strong><u>Senator ${s.name}</u></strong>`)
          .join(' and ');
        message.innerHTML = `By selecting Support or Oppose, your email will be sent to ${names} direct staff urging them to consider your opinion on this bill.`;
        message.classList.remove('hidden');
      } else {
        message.classList.add('hidden');
        message.textContent = '';
      }
    });

    // Mailto link builder
    function sendMail(action) {
      const state = selectedStates[index];
      if (!state || !senatorsData[state]) {
        alert('Please select your state first.');
        return;
      }

      const billTitle = card.querySelector('h1').textContent;
      const emails = senatorsData[state].map(s => s.email).join(',');
      const subject = `Constituent Feedback on ${billTitle}`;
      const body = `Dear Senator,\n\nAs a constituent of ${state}, I am writing to express my ${action} for ${billTitle}.\n\nThank you for your service.\n\nSincerely,\n[Your Name]`;

      const mailto = `mailto:${emails}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      window.location = mailto;
    }

    // Button click handlers
    supportBtn.addEventListener('click', () => sendMail('support'));
    opposeBtn.addEventListener('click', () => sendMail('opposition'));

    // Read More toggle
    toggleBtn.addEventListener('click', () => {
      const isHidden = detailsBox.classList.toggle('hidden');
      toggleBtn.innerText = isHidden ? 'Read More' : 'Hide Details';
    });
  }

  // Init
  getSenators().then(data => {
    senatorsData = data;

    const allCards = document.querySelectorAll('.bill-card');
    allCards.forEach((card, index) => setupBillCard(card, index));
  });

  // Mobile nav toggle
  const menuToggle = document.getElementById('menu-toggle');
  const navMenu = document.getElementById('nav-menu');
  if (menuToggle && navMenu) {
    menuToggle.addEventListener('click', () => {
      navMenu.classList.toggle('active');
    });
  }
};
