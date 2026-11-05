// Find our date picker inputs on the page
const startInput = document.getElementById('startDate');
const endInput = document.getElementById('endDate');
const dateForm = document.getElementById('dateForm');
const gallery = document.getElementById('gallery');
const spaceFact = document.getElementById('spaceFact');
const modal = document.getElementById('imageModal');
const modalImage = document.getElementById('modalImage');
const modalTitle = document.getElementById('modalTitle');
const modalDate = document.getElementById('modalDate');
const modalExplanation = document.getElementById('modalExplanation');
const API_URL = 'https://science.nasa.gov/wp-json/wp/v2/apod-basic/?api_key=DEMO_KEY';

const spaceFacts = [
  'A day on Venus is longer than a year on Venus.',
  'One million Earths could fit inside the Sun.',
  'Neutron stars can spin about 600 times every second.',
  'The footprints left on the Moon could last for millions of years.',
  'Saturn would float in water because its average density is less than water.'
];

// Call the setupDateInputs function from dateRange.js
// This sets up the date pickers to:
// - Default to a range of 9 days (from 9 days ago to today)
// - Restrict dates to NASA's image archive (starting from 1995)
setupDateInputs(startInput, endInput);

spaceFact.textContent = spaceFacts[Math.floor(Math.random() * spaceFacts.length)];

function formatDate(date) {
  return new Date(`${date}T00:00:00`).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

function getPlainText(html) {
  const textContainer = document.createElement('div');
  textContainer.innerHTML = html || '';
  return textContainer.textContent.trim();
}

function escapeHTML(value) {
  const textContainer = document.createElement('div');
  textContainer.textContent = value;
  return textContainer.innerHTML;
}

function showMessage(message, icon = '🔭') {
  gallery.innerHTML = `
    <div class="placeholder">
      <div class="placeholder-icon">${icon}</div>
      <p>${message}</p>
    </div>
  `;
}

function createGalleryItem(item) {
  const title = item.title || 'Untitled space photo';
  const date = formatDate(item.date);
  const safeTitle = escapeHTML(title);
  const safeAlt = escapeHTML(item.alt || title);
  const itemElement = document.createElement('article');
  itemElement.className = 'gallery-item';

  if (item.media_type === 'image' && item.hdurl) {
    itemElement.innerHTML = `
      <button class="image-button" type="button" aria-label="Open details for ${safeTitle}">
        <img src="${item.hdurl}" alt="${safeAlt}" loading="lazy" />
      </button>
      <div class="card-copy">
        <h2>${safeTitle}</h2>
        <p class="card-date">${date}</p>
      </div>
    `;
    itemElement.querySelector('.image-button').addEventListener('click', () => openModal(item));
  } else {
    itemElement.innerHTML = `
      <div class="video-art" aria-hidden="true">▶</div>
      <div class="card-copy">
        <p class="media-label">VIDEO</p>
        <h2>${safeTitle}</h2>
        <p class="card-date">${date}</p>
        <a class="video-link" href="${item.url}" target="_blank" rel="noopener noreferrer">
          Watch this video on NASA's website
        </a>
      </div>
    `;
  }

  return itemElement;
}

function openModal(item) {
  modalImage.src = item.hdurl;
  modalImage.alt = item.alt || item.title;
  modalTitle.textContent = item.title;
  modalDate.textContent = formatDate(item.date);
  modalExplanation.textContent = getPlainText(item.explanation);
  modal.hidden = false;
  document.body.classList.add('modal-open');
  modal.querySelector('.modal-close').focus();
}

function closeModal() {
  modal.hidden = true;
  modalImage.src = '';
  document.body.classList.remove('modal-open');
}

async function loadSpaceImages(event) {
  event.preventDefault();
  const startDate = startInput.value;
  const endDate = endInput.value;

  if (!startDate || !endDate || startDate > endDate) {
    showMessage('Please choose a valid date range.', '⚠️');
    return;
  }

  showMessage('Loading space photos…', '🔄');

  try {
    const response = await fetch(API_URL);
    if (!response.ok) {
      throw new Error(`NASA API returned ${response.status}`);
    }

    const entries = await response.json();
    const selectedEntries = entries
      .filter((entry) => entry.date >= startDate && entry.date <= endDate)
      .sort((first, second) => second.date.localeCompare(first.date));

    if (selectedEntries.length === 0) {
      showMessage('No photos were found for that range. Try a more recent date range.', '🌌');
      return;
    }

    gallery.replaceChildren(...selectedEntries.map(createGalleryItem));
  } catch (error) {
    console.error('Unable to load NASA space photos:', error);
    showMessage('We could not load the space photos. Please try again.', '⚠️');
  }
}

dateForm.addEventListener('submit', loadSpaceImages);
modal.addEventListener('click', (event) => {
  if (event.target.matches('[data-close-modal]')) {
    closeModal();
  }
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && !modal.hidden) {
    closeModal();
  }
});
