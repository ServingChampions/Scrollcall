window.onload = () => {
  // 1. Populate State Dropdown
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

  stateSelect.innerHTML = '<option value="">-- Select State --</option>';
  allStates.forEach(stateCode => {
    const option = document.createElement('option');
    option.value = stateCode;
    option.textContent = stateCode;
    stateSelect.appendChild(option);
  });

  // 2. Toggle Read More section
  document.getElementById('toggleDetails').addEventListener('click', () => {
    const details = document.getElementById('moreDetails');
    const isHidden = details.classList.toggle('hidden');
    document.getElementById('toggleDetails').innerText = isHidden ? 'Read More' : 'Hide Details';
  });

  // 3. Fetch Senator Data
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

  // 4. Load senator data once on page load
  let senatorsData = {};
  let selectedState = '';

  getSenators().then(data => {
    senatorsData = data;
  });

  // 5. State dropdown logic
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

  // 6. Support/Oppose button logic
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

  document.getElementById('supportBtn').addEventListener('click', () => {
    createUnifiedMailtoLink('support');
  });

  document.getElementById('opposeBtn').addEventListener('click', () => {
    createUnifiedMailtoLink('opposition');
  });
};
