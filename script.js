// ==========================================
// SMOOTH SCROLL & NAVIGATION
// ==========================================
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// ==========================================
// SCROLL ANIMATIONS
// ==========================================
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe all sections and cards
document.querySelectorAll('section, .event-card, .wish-card').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(30px)';
    el.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
    observer.observe(el);
});

// ==========================================
// WEDDING WISHES FORM
// ==========================================
const wishForm = document.getElementById('wishForm');
const wishesGrid = document.getElementById('wishesGrid');

wishForm.addEventListener('submit', function (e) {
    e.preventDefault();

    const name = document.getElementById('wishName').value.trim();
    const message = document.getElementById('wishMessage').value.trim();

    if (name && message) {
        // Create new wish card
        const wishCard = document.createElement('div');
        wishCard.className = 'wish-card';
        wishCard.style.opacity = '0';
        wishCard.style.transform = 'scale(0.8)';

        wishCard.innerHTML = `
            <p class="wish-message">"${message}"</p>
            <p class="wish-author">— ${name}</p>
        `;

        // Add to grid
        wishesGrid.insertBefore(wishCard, wishesGrid.firstChild);

        // Animate in
        setTimeout(() => {
            wishCard.style.transition = 'all 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
            wishCard.style.opacity = '1';
            wishCard.style.transform = 'scale(1)';
        }, 100);

        // Show success message
        showNotification('Thank you for your beautiful wishes! 💕');

        // Reset form
        wishForm.reset();

        // Save to localStorage
        saveWish({ name, message, timestamp: new Date().toISOString() });
    }
});

// ==========================================
// REMOTE STORAGE FOR WISHES (ExtendsClass)
// ==========================================
// Using ExtendsClass for free, CORS-enabled, no-auth storage
const STORAGE_KEY_NAME = 'benjen_storage_id';
const API_BASE_URL = 'https://extendsclass.com/api/json-storage/bin';

// Fallback to localStorage if API fails completely
const USE_FALLBACK = true;

async function getStorageUrl() {
    let storageId = localStorage.getItem(STORAGE_KEY_NAME);

    if (!storageId) {
        try {
            console.log('Initializing new remote storage...');
            // Create a new bin
            const response = await fetch(API_BASE_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({})
            });

            if (response.ok) {
                const data = await response.json();
                // data = { "status": 0, "uri": "...", "id": "..." }
                storageId = data.id;

                if (storageId) {
                    localStorage.setItem(STORAGE_KEY_NAME, storageId);
                    console.log('✅ New storage initialized ID:', storageId);
                    return `${API_BASE_URL}/${storageId}`;
                }
            }
        } catch (e) {
            console.error('Failed to initialize storage:', e);
            return null;
        }
    }

    return storageId ? `${API_BASE_URL}/${storageId}` : null;
}

async function saveWish(wish) {
    try {
        // Get current wishes first
        const wishes = await loadWishesFromAPI();
        wishes.unshift(wish);

        // Keep only last 50 wishes
        const updatedWishes = wishes.slice(0, 50);

        const storageUrl = await getStorageUrl();
        if (!storageUrl) throw new Error('No storage URL available');

        // ExtendsClass uses PUT to update
        const response = await fetch(storageUrl, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ wishes: updatedWishes })
        });

        if (!response.ok) throw new Error('Failed to save to remote storage');

        // Also save to localStorage as backup
        if (USE_FALLBACK) {
            localStorage.setItem('benjenWishes', JSON.stringify(updatedWishes));
        }

        return true;
    } catch (error) {
        console.error('Error saving wish:', error);

        // Fallback to localStorage
        if (USE_FALLBACK) {
            let wishes = JSON.parse(localStorage.getItem('benjenWishes') || '[]');
            wishes.unshift(wish);
            wishes = wishes.slice(0, 50);
            localStorage.setItem('benjenWishes', JSON.stringify(wishes));
        }

        return false;
    }
}

async function loadWishesFromAPI() {
    try {
        const storageUrl = await getStorageUrl();
        if (!storageUrl) return [];

        const response = await fetch(storageUrl);

        if (!response.ok) throw new Error('Failed to load wishes');

        const data = await response.json();
        return data.wishes || [];
    } catch (error) {
        console.error('Error loading wishes from remote storage:', error);

        // Fallback to localStorage
        if (USE_FALLBACK) {
            return JSON.parse(localStorage.getItem('benjenWishes') || '[]');
        }

        return [];
    }
}

async function loadWishes() {
    const wishes = await loadWishesFromAPI();

    wishes.forEach(wish => {
        const wishCard = document.createElement('div');
        wishCard.className = 'wish-card';
        wishCard.innerHTML = `
            <p class="wish-message">"${wish.message}"</p>
            <p class="wish-author">— ${wish.name}</p>
        `;
        wishesGrid.appendChild(wishCard);
    });
}

// Load saved wishes on page load
window.addEventListener('DOMContentLoaded', loadWishes);

// ==========================================
// NOTIFICATION SYSTEM
// ==========================================
function showNotification(message) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, #ff69b4 0%, #ffb6d9 100%);
        color: white;
        padding: 1rem 2rem;
        border-radius: 50px;
        box-shadow: 0 10px 30px rgba(255, 105, 180, 0.4);
        z-index: 1000;
        font-family: 'Outfit', sans-serif;
        font-weight: 500;
        animation: slideInRight 0.5s ease;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.5s ease';
        setTimeout(() => notification.remove(), 500);
    }, 3000);
}

// Add notification animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// ==========================================
// PARALLAX EFFECT FOR HERO
// ==========================================
window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    const hero = document.querySelector('.hero');
    if (hero) {
        hero.style.transform = `translateY(${scrolled * 0.5}px)`;
    }
});

// ==========================================
// COUNTDOWN TO WEDDING (OPTIONAL)
// ==========================================
function updateCountdown() {
    const weddingDate = new Date('2026-01-10T00:00:00').getTime();
    const now = new Date().getTime();
    const distance = weddingDate - now;

    if (distance > 0) {
        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        // You can add a countdown display element if needed
        console.log(`${days}d ${hours}h ${minutes}m ${seconds}s until the wedding!`);
    }
}

// Update countdown every second
setInterval(updateCountdown, 1000);

// ==========================================
// RESPONSIVE MENU (IF NEEDED)
// ==========================================
const handleResize = () => {
    const width = window.innerWidth;
    // Add any responsive adjustments here
};

window.addEventListener('resize', handleResize);
handleResize();

// ==========================================
// PREVENT FORM RESUBMISSION
// ==========================================
if (window.history.replaceState) {
    window.history.replaceState(null, null, window.location.href);
}

// ==========================================
// LOADING ANIMATION
// ==========================================
window.addEventListener('load', () => {
    document.body.style.opacity = '0';
    document.body.style.transition = 'opacity 0.5s ease';
    setTimeout(() => {
        document.body.style.opacity = '1';
    }, 100);
});

// ==========================================
// TOUCH GESTURES FOR MOBILE
// ==========================================
let touchStartY = 0;
let touchEndY = 0;

document.addEventListener('touchstart', e => {
    touchStartY = e.changedTouches[0].screenY;
}, { passive: true });

document.addEventListener('touchend', e => {
    touchEndY = e.changedTouches[0].screenY;
    handleSwipe();
}, { passive: true });

function handleSwipe() {
    const swipeDistance = touchStartY - touchEndY;
    // Add swipe gestures if needed
}

// ==========================================
// EASTER EGG: CONFETTI ON COUPLE NAMES CLICK
// ==========================================
const heroTitle = document.querySelector('.hero-title');
if (heroTitle) {
    heroTitle.addEventListener('click', () => {
        createConfetti();
    });
}

function createConfetti() {
    const colors = ['#ff69b4', '#ffb6d9', '#d4af37', '#faf6f1'];
    const confettiCount = 50;

    for (let i = 0; i < confettiCount; i++) {
        const confetti = document.createElement('div');
        confetti.style.cssText = `
            position: fixed;
            width: 10px;
            height: 10px;
            background: ${colors[Math.floor(Math.random() * colors.length)]};
            top: 50%;
            left: 50%;
            opacity: 1;
            border-radius: 50%;
            pointer-events: none;
            z-index: 9999;
        `;
        document.body.appendChild(confetti);

        const angle = Math.random() * Math.PI * 2;
        const velocity = 5 + Math.random() * 10;
        const vx = Math.cos(angle) * velocity;
        const vy = Math.sin(angle) * velocity;

        let x = 0, y = 0, opacity = 1;
        const gravity = 0.3;
        let velocityY = vy;

        const animate = () => {
            x += vx;
            velocityY += gravity;
            y += velocityY;
            opacity -= 0.01;

            confetti.style.transform = `translate(${x}px, ${y}px)`;
            confetti.style.opacity = opacity;

            if (opacity > 0) {
                requestAnimationFrame(animate);
            } else {
                confetti.remove();
            }
        };

        requestAnimationFrame(animate);
    }
}

console.log('💕 BenJen Wedding Website - Built with Love 💕');

/* ==========================================
   3D FAN/COVERFLOW GALLERY LOGIC
   ========================================== */
const galleryContainer = document.querySelector('.gallery-carousel');
const cards = document.querySelectorAll('.gallery-card');
const prevBtn = document.querySelector('.prev-btn');
const nextBtn = document.querySelector('.next-btn');
const indicators = document.querySelectorAll('.indicator');

let currentIndex = 2; // Start with the middle card (index 2) active
const totalCards = cards.length;

// Function to update gallery state
function updateGallery() {
    cards.forEach((card, index) => {
        // Reset classes
        card.className = 'gallery-card';

        // Calculate distance from current index
        const diff = index - currentIndex;

        if (diff === 0) {
            card.classList.add('active');
        } else if (diff === -1) {
            card.classList.add('prev');
        } else if (diff === 1) {
            card.classList.add('next');
        } else if (diff === -2) {
            card.classList.add('prev-2');
        } else if (diff === 2) {
            card.classList.add('next-2');
        } else {
            // For cards further away, hide them or style as needed
            // Using generic logic for far-left and far-right
            if (diff < -2) card.classList.add('prev-2'); // Stack them
            if (diff > 2) card.classList.add('next-2');
            card.style.opacity = '0';
            card.style.pointerEvents = 'none';
            return; // Skip opacity/pointer reset below
        }

        // Ensure visible cards are clickable
        card.style.opacity = '';
        card.style.pointerEvents = 'auto';
    });

    // Update Indicators
    indicators.forEach((ind, index) => {
        if (index === currentIndex) {
            ind.classList.add('active');
        } else {
            ind.classList.remove('active');
        }
    });
}

// Event Listeners
nextBtn.addEventListener('click', () => {
    if (currentIndex < totalCards - 1) {
        currentIndex++;
        updateGallery();
    }
});

prevBtn.addEventListener('click', () => {
    if (currentIndex > 0) {
        currentIndex--;
        updateGallery();
    }
});

// Allow clicking on any card to make it active
cards.forEach((card, index) => {
    card.addEventListener('click', () => {
        if (currentIndex !== index) {
            currentIndex = index;
            updateGallery();
        }
    });
});

// Use indicators to navigate
indicators.forEach((ind, index) => {
    ind.addEventListener('click', () => {
        currentIndex = index;
        updateGallery();
    });
});

// Keyboard Navigation
document.addEventListener('keydown', (e) => {
    // Only trigger if gallery is in view
    const galleryRect = document.querySelector('.gallery-3d-container').getBoundingClientRect();
    if (galleryRect.top < window.innerHeight && galleryRect.bottom > 0) {
        if (e.key === 'ArrowLeft' && currentIndex > 0) {
            currentIndex--;
            updateGallery();
        } else if (e.key === 'ArrowRight' && currentIndex < totalCards - 1) {
            currentIndex++;
            updateGallery();
        }
    }
});

// Touch / Swipe Support
let touchStartX = 0;
let touchEndX = 0;

galleryContainer.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
}, { passive: true });

galleryContainer.addEventListener('touchend', (e) => {
    touchEndX = e.changedTouches[0].screenX;
    handleSwipe();
}, { passive: true });

function handleSwipe() {
    if (touchStartX - touchEndX > 50) {
        // Swiped Left -> Next Image
        if (currentIndex < totalCards - 1) {
            currentIndex++;
            updateGallery();
        }
    }
    if (touchEndX - touchStartX > 50) {
        // Swiped Right -> Prev Image
        if (currentIndex > 0) {
            currentIndex--;
            updateGallery();
        }
    }
}

// Initialize
updateGallery();
