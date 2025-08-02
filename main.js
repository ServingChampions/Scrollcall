window.onload = () => {
  const allStates = [
    'TEST',
    'AK','AL','AZ','AR','CA','CO','CT','DE','FL','GA',
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
        message.innerHTML = `By selecting Support or Oppose, your email will be sent to ${names} urging them to consider your opinion on this bill.`;
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
  const emails = senatorsData[state].flatMap(s => s.emails).join(',');
  const subject = `Constituent Feedback on ${billTitle}`;
  const bodyText = `Dear Senator's Staff,\n\nAs a constituent of ${state}, I am writing to express my ${action} for ${billTitle}. I believe this legislation has a direct impact on people like me, and I hope my position will be considered in your discussions.\n\nThank you for your time and for the work you do to support our state.\n\nSincerely,\n[Your Name]`;

  const body = encodeURIComponent(bodyText);

  // Store data for modal
  window.currentEmailData = { emails, subject, body, bodyText };

  // Show the modal
  const modal = document.getElementById('email-modal');
  if (modal) modal.classList.remove('hidden');
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
  // One-time modal button logic
const modal = document.getElementById('email-modal');
if (modal) {
  const close = document.getElementById('cancel-modal');
  const mailAppBtn = document.getElementById('mail-app-btn');
  const gmailBtn = document.getElementById('gmail-btn');
  const yahooBtn = document.getElementById('yahoo-btn');
  const copyBtn = document.getElementById('copy-btn');

  close.onclick = () => modal.classList.add('hidden');

  mailAppBtn.onclick = () => {
    const { emails, subject, body } = window.currentEmailData;
    window.location.href = `mailto:${emails}?subject=${encodeURIComponent(subject)}&body=${body}`;
    modal.classList.add('hidden');
  };

  gmailBtn.onclick = () => {
    const { emails, subject, body } = window.currentEmailData;
    const url = `https://mail.google.com/mail/?view=cm&fs=1&to=${emails}&su=${encodeURIComponent(subject)}&body=${body}`;
    window.open(url, '_blank');
    modal.classList.add('hidden');
  };

  yahooBtn.onclick = () => {
    const { emails, subject, body } = window.currentEmailData;
    const url = `https://compose.mail.yahoo.com/?to=${emails}&subject=${encodeURIComponent(subject)}&body=${body}`;
    window.open(url, '_blank');
    modal.classList.add('hidden');
  };

copyBtn.onclick = () => {
  const { emails, subject, bodyText } = window.currentEmailData;

  const fullText = `To: ${emails}
Subject: ${subject}

${bodyText}`;

  navigator.clipboard.writeText(fullText).then(() => {
    copyBtn.textContent = 'Copied! Paste this into your email app to send.';
    setTimeout(() => {
      copyBtn.textContent = 'Copy Message to Clipboard';
    }, 2500);
  });

  const modal = document.getElementById('email-modal');
  if (modal) modal.classList.add('hidden');
};

}

};




// Clear Votes

function clearVotes() {
  if (confirm("Are you sure you want to delete all votes?")) {
    firebase.database().ref("votes").remove().then(() => {
      alert("All votes cleared. Refresh the page.");
      localStorage.removeItem("votedBills");
    });
  }
}

// Legiscan API

const API_KEY = "0cb8ccb82b8cfd2125429bbb610d0dfa";
const MAX_INITIAL_BILLS = 150;
const MAX_CONCURRENT_REQUESTS = 5;
const votesRef = firebase.database().ref("votes");


const statusMap = {
  1: "Introduced",
  2: "Passed One Chamber",
  3: "Passed Both Chambers",
  4: "Signed into Law",
  5: "Vetoed",
  6: "Failed",
  7: "Enacted (Override or Special)",
  8: "Withdrawn",
  9: "Dead"
};

async function throttledFetchBillDetails(bills) {
  const results = [];
  let index = 0;

  async function processNextBatch() {
    const batch = bills.slice(index, index + MAX_CONCURRENT_REQUESTS);
    const batchResults = await Promise.allSettled(batch.map(bill =>
      fetch(`https://api.legiscan.com/?key=${API_KEY}&op=getBill&id=${bill.bill_id}`)
        .then(res => res.json())
        .then(detail => ({ bill, committee: detail?.bill?.committee?.name || "Unknown" }))
        .catch(() => ({ bill, committee: "Unknown" }))
    ));
    results.push(...batchResults);
    index += MAX_CONCURRENT_REQUESTS;
    if (index < bills.length) {
      return processNextBatch();
    }
  }

  await processNextBatch();
  return results;
}

async function fetchBills(limit = MAX_INITIAL_BILLS) {
  try {
    const response = await fetch(`https://api.legiscan.com/?key=${API_KEY}&op=getMasterList&state=US`);
    const data = await response.json();
    if (!data || !data.masterlist) return console.error("Invalid API response", data);

    const bills = Object.values(data.masterlist)
      .filter(item => typeof item === "object" && item.number?.startsWith("SB") && item.status >= 1)
      .slice(0, limit);

    const container = document.getElementById("bills-list");
    container.innerHTML = "";

    const snapshot = await votesRef.once("value");
    const voteData = snapshot.val() || {};
    const committeeMap = {};

    const detailedBills = await throttledFetchBillDetails(bills);

    detailedBills.forEach(result => {
      if (result.status !== "fulfilled") return;
      const { bill, committee } = result.value;
      const voteCount = voteData[bill.number] || 0;
      const readableStatus = statusMap[bill.status] || "Unknown";

      if (!committeeMap[committee]) committeeMap[committee] = 0;
      committeeMap[committee]++;

      const card = document.createElement("div");
      card.classList.add("bill-card");
      card.setAttribute("data-votes", voteCount);
      card.setAttribute("data-status", bill.status);
      card.setAttribute("data-committee", committee);

      card.innerHTML = `
        <h3><a href="${bill.url}" target="_blank">${bill.number}</a>: ${bill.title}</h3>
        <p><strong>Status:</strong> ${readableStatus}</p>
        <p><strong>Committee:</strong> ${committee}</p>
        <p><strong>Last Action:</strong> ${bill.last_action}</p>
        <button class="upvote-btn" data-bill="${bill.number}">👍 Upvote</button>
        <span class="vote-count">${voteCount}</span> votes
      `;

      container.appendChild(card);
    });

    attachVoteHandlers();
    sortByVotes();
    buildCommitteeDropdown(committeeMap);
    buildStatusDropdown();

  } catch (error) {
    console.error("Error fetching bills:", error);
  }
}

function sortByVotes() {
  const container = document.getElementById("bills-list");
  const cards = Array.from(container.getElementsByClassName("bill-card"));
  cards.sort((a, b) => parseInt(b.dataset.votes) - parseInt(a.dataset.votes));
  container.innerHTML = "";
  cards.forEach(card => container.appendChild(card));
}

function attachVoteHandlers() {
  const buttons = document.querySelectorAll(".upvote-btn");
  buttons.forEach(button => {
    button.addEventListener("click", async function () {
      const billNumber = this.getAttribute("data-bill");

      const votedBills = JSON.parse(localStorage.getItem("votedBills")) || [];
      if (votedBills.includes(billNumber)) {
        alert("You have already voted for this bill.");
        return;
      }

      const countSpan = this.nextElementSibling;
      let currentVotes = parseInt(countSpan.textContent);
      currentVotes += 1;
      countSpan.textContent = currentVotes;

      const card = this.closest(".bill-card");
      card.setAttribute("data-votes", currentVotes);
      sortByVotes();

      await votesRef.child(billNumber).set(currentVotes);
      votedBills.push(billNumber);
      localStorage.setItem("votedBills", JSON.stringify(votedBills));
    });
  });
}

function buildCommitteeDropdown(committeeMap) {
  const dropdown = document.getElementById("committee-filter");
  if (!dropdown) return;

  dropdown.innerHTML = `<option value="">All Committees</option>`;
  Object.entries(committeeMap)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .forEach(([name, count]) => {
      dropdown.innerHTML += `<option value="${name}">${name} (${count})</option>`;
    });

  dropdown.addEventListener("change", applyFilters);
}

function buildStatusDropdown() {
  const dropdown = document.getElementById("status-filter");
  if (!dropdown) return;

  dropdown.innerHTML = `<option value="">All Statuses</option>`;
  Object.entries(statusMap)
    .sort((a, b) => a[0] - b[0])
    .forEach(([status, label]) => {
      dropdown.innerHTML += `<option value="${status}">${label}</option>`;
    });

  dropdown.addEventListener("change", applyFilters);
}

function applyFilters() {
  const selectedCommittee = document.getElementById("committee-filter").value;
  const selectedStatus = document.getElementById("status-filter").value;

  const cards = document.querySelectorAll(".bill-card");
  cards.forEach(card => {
    const matchesCommittee = !selectedCommittee || card.getAttribute("data-committee") === selectedCommittee;
    const matchesStatus = !selectedStatus || card.getAttribute("data-status") === selectedStatus;
    card.style.display = matchesCommittee && matchesStatus ? "block" : "none";
  });
}

document.addEventListener("DOMContentLoaded", () => {
  fetchBills();
});

