document.addEventListener('DOMContentLoaded', () => {
  const aiBlocks = document.querySelectorAll('.smart-compose');

  aiBlocks.forEach((block) => {
    const toggleBtn = block.querySelector('.ai-toggle-btn');
    const inputContainer = block.querySelector('.ai-input-container');
    const generateBtn = block.querySelector('.ai-generate-btn');
    const resultContainer = block.querySelector('.ai-result-container');
    const previewBox = block.querySelector('.ai-message-preview');
    const textarea = block.querySelector('.ai-reasons');

    toggleBtn.addEventListener('click', () => {
      inputContainer.classList.toggle('hidden');
    });

    generateBtn.addEventListener('click', async () => {
      const userInput = textarea.value.trim();
      if (!userInput) return;

      previewBox.textContent = 'Generating message...';
      resultContainer.classList.remove('hidden');

      try {
        const response = await fetch('https://smartcompose.pipedream.net', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            bullets: userInput,
            billTitle: block.closest('.bill-card')?.querySelector('h1')?.textContent || 'This bill'
          })
        });

        const data = await response.json();
        previewBox.textContent = data.message || 'Something went wrong.';
      } catch (error) {
        previewBox.textContent = 'Error generating message.';
        console.error(error);
      }
    });
  });
});
