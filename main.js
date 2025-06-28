window.onload = () => {
  // Read More button logic
  document.getElementById('toggleDetails').addEventListener('click', () => {
    const details = document.getElementById('moreDetails');
    const isHidden = details.classList.toggle('hidden');
    document.getElementById('toggleDetails').innerText = isHidden ? 'Read More' : 'Hide Details';
  });

  // Senator logic
  async function getSenators() {
    const res = await fetch('assets/data/senators.json');
    return await res.json();
  }

  function createMailtoLink(senator, action) {
    const subject = encodeURIComponent('Constituent Feedback on S.394 – GENIUS Act of 2025');
    const body = encodeURIComponent(
      `Dear Senator ${senator.name},\n\nAs a constituent of ${selectedState}, I am writing to express my ${action} for S.394 – GENIUS Act of 2025.\n\nThank you for your service.\n\nSincerely,\n[Your Name]`
    );
    return `mailto:${senator.email}?subject=${subject}&body=${body}`;
  }

  let senatorsData = {};
  let selectedState = '';

  document.getElementById('state').addEventListener('change', async (e) => {
    selectedState = e.target.value;
    const container = document.getElementById('senatorsList');
    container.innerHTML = '';

    if (!senatorsData.TN) senatorsData = await getSenators();

    if (senatorsData[selectedState]) {
      container.classList.remove('hidden');
      senatorsData[selectedState].forEach((sen) => {
        ['support', 'oppose'].forEach((action) => {
          const btn = document.createElement('button');
          btn.textContent = action === 'support' ? `Support ${sen.name}` : `Oppose ${sen.name}`;
          btn.onclick = () => window.location = createMailtoLink(sen, action);
          const div = document.createElement('div');
          div.className = 'senator';
          div.innerHTML = `<strong>${sen.name}</strong> (${action === 'support' ? '👍' : '👎'})`;
          div.appendChild(btn);
          container.appendChild(div);
        });
      });
    } else {
      container.classList.add('hidden');
    }
  });
};
