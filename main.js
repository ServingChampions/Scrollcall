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


// Legiscan API

const API_KEY = "0cb8ccb82b8cfd2125429bbb610d0dfa";

// Friendly names for bill status codes
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

const votesRef = firebase.database().ref("votes");

async function fetchBills() {
  try {
    const response = await fetch(`https://api.legiscan.com/?key=${API_KEY}&op=getMasterList&state=US`);
    const data = await response.json();

    if (data && data.masterlist) {
      const bills = Object.values(data.masterlist).filter(item => typeof item === "object");
      const container = document.getElementById("bills-list");

      const snapshot = await votesRef.once("value");
      const voteData = snapshot.val() || {};

      bills.forEach(bill => {
        if (bill.number && bill.title && bill.number.startsWith("SB") && bill.status >= 1) {
          const readableStatus = statusMap[bill.status] || "Unknown";
          const voteCount = voteData[bill.number] || 0;

          const card = document.createElement("div");
          card.classList.add("bill-card");
          card.setAttribute("data-votes", voteCount);
          card.setAttribute("data-status", bill.status);

          card.innerHTML = `
            <h3><a href="${bill.url}" target="_blank">${bill.number}</a>: ${bill.title}</h3>
            <p><strong>Status:</strong> ${readableStatus}</p>
            <p><strong>Last Action:</strong> ${bill.last_action}</p>
            <button class="upvote-btn" data-bill="${bill.number}">👍 Upvote</button>
            <span class="vote-count">${voteCount}</span> votes
          `;

          container.appendChild(card);
        }
      });

      attachVoteHandlers();
      sortByVotes();
    } else {
      console.error("Invalid API response format", data);
    }
  } catch (error) {
    console.error("Error fetching bills:", error);
  }
}

function sortByVotes() {
  const container = document.getElementById("bills-list");
  const cards = Array.from(container.getElementsByClassName("bill-card"));

  const sortedCards = cards.sort((a, b) => {
    const votesA = parseInt(a.getAttribute("data-votes"));
    const votesB = parseInt(b.getAttribute("data-votes"));
    return votesB - votesA;
  });

  container.innerHTML = "";
  sortedCards.forEach(card => container.appendChild(card));
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

// Optional Reset Button (ensure you have <button id="reset-votes">Reset</button> in HTML)
document.getElementById("reset-votes")?.addEventListener("click", async () => {
  await votesRef.set({});
  localStorage.removeItem("votedBills");
  location.reload();
});

// Filter dropdown
document.addEventListener("DOMContentLoaded", () => {
  fetchBills();

  const filter = document.getElementById("status-filter");
  if (filter) {
    filter.addEventListener("change", function () {
      const selected = this.value;
      const cards = document.querySelectorAll(".bill-card");

      cards.forEach(card => {
        const status = card.getAttribute("data-status");
        card.style.display = !selected || status === selected ? "block" : "none";
      });
    });
  }
});

function clearVotes() {
  if (confirm("Are you sure you want to delete all votes?")) {
    firebase.database().ref("votes").remove().then(() => {
      alert("All votes cleared. Refresh the page.");
      localStorage.removeItem("votedBills");
    });
  }
}
