document.addEventListener('DOMContentLoaded', function () {
    // Initialize date inputs with today and tomorrow as default values
    initializeDateInputs();

    // Initialize testimonial slider
    initializeTestimonialSlider();

    // Initialize mobile menu toggle
    initializeMobileMenu();

    // Initialize search form validation
    initializeSearchForm();
});

/**
 * Set default dates for the date inputs
 */
function initializeDateInputs() {
    const now = new Date();

    const pickupDateInput = document.getElementById('pickup-date');
    const pickupTimeInput = document.getElementById('pickup-time');
    const numberOfDaysInput = document.getElementById('number-of-days');

    if (pickupDateInput) {
        pickupDateInput.value = formatDate(now);
        pickupDateInput.min = formatDate(now);
    }

    if (pickupTimeInput) {
        pickupTimeInput.value = formatTime(now);

        if (pickupDateInput.value === formatDate(now)) {
            pickupTimeInput.min = formatTime(now);
        }
    }

    pickupDateInput.addEventListener('change', () => {
        const selectedDate = new Date(pickupDateInput.value);
        const today = new Date();

        if (pickupTimeInput) {
            if (pickupDateInput.value === formatDate(today)) {
                // Same-day pickup: restrict time
                const currentTime = formatTime(today);
                pickupTimeInput.min = currentTime;

                if (pickupTimeInput.value < currentTime) {
                    pickupTimeInput.value = currentTime;
                }
            } else {
                pickupTimeInput.min = "00:00"; // no time restriction for future dates
            }
        }
    });

    // Drop-off date display logic (optional)
    if (pickupDateInput && numberOfDaysInput) {
        function updateDropoffInfo() {
            const pickupDate = new Date(pickupDateInput.value);
            const days = parseInt(numberOfDaysInput.value, 10);

            if (!isNaN(days) && days > 0) {
                const dropoffDate = new Date(pickupDate);
                dropoffDate.setDate(pickupDate.getDate() + days);

                const dropoffDisplay = document.getElementById('dropoff-display');
                if (dropoffDisplay) {
                    dropoffDisplay.textContent = `Drop-off Date: ${formatDate(dropoffDate)}`;
                }
            }
        }

        pickupDateInput.addEventListener('change', updateDropoffInfo);
        numberOfDaysInput.addEventListener('input', updateDropoffInfo);
    }
}

function formatDate(date) {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function formatTime(date) {
    const hours = `${date.getHours()}`.padStart(2, '0');
    const minutes = `${date.getMinutes()}`.padStart(2, '0');
    return `${hours}:${minutes}`;
}

/**
 * Initialize testimonial slider functionality
 */
function initializeTestimonialSlider() {
    const testimonialSlider = document.querySelector('.testimonial-slider');
    const testimonialCards = document.querySelectorAll('.testimonial-card');
    const prevButton = document.getElementById('prev-testimonial');
    const nextButton = document.getElementById('next-testimonial');

    if (!testimonialSlider || !prevButton || !nextButton) return;

    let currentIndex = 0;
    const totalTestimonials = testimonialCards.length;

    // Hide all testimonials except the first one
    testimonialCards.forEach((card, index) => {
        if (index !== 0) {
            card.style.display = 'none';
        }
    });

    // Function to show testimonial at specific index
    function showTestimonial(index) {
        testimonialCards.forEach(card => {
            card.style.display = 'none';
        });

        testimonialCards[index].style.display = 'block';

        // Add fade-in animation
        testimonialCards[index].style.opacity = '0';
        setTimeout(() => {
            testimonialCards[index].style.opacity = '1';
            testimonialCards[index].style.transition = 'opacity 0.5s ease';
        }, 50);
    }

    // Event listeners for next and previous buttons
    nextButton.addEventListener('click', function () {
        currentIndex = (currentIndex + 1) % totalTestimonials;
        showTestimonial(currentIndex);
    });

    prevButton.addEventListener('click', function () {
        currentIndex = (currentIndex - 1 + totalTestimonials) % totalTestimonials;
        showTestimonial(currentIndex);
    });

    // Auto-rotate testimonials every 5 seconds
    setInterval(() => {
        currentIndex = (currentIndex + 1) % totalTestimonials;
        showTestimonial(currentIndex);
    }, 5000);
}

/**
 * Initialize mobile menu toggle functionality
 */
function initializeMobileMenu() {
    // Create mobile menu elements
    const header = document.querySelector('header');

    if (!header) return;

    const mobileMenuButton = document.createElement('div');
    mobileMenuButton.className = 'mobile-menu-button';
    mobileMenuButton.innerHTML = '<i class="fas fa-bars"></i>';

    const nav = document.querySelector('nav');
    const authButtons = document.querySelector('.auth-buttons');

    // Only proceed if we have the necessary elements
    if (!nav || !authButtons) return;

    // Clone the navigation and auth buttons for mobile menu
    const mobileMenuContainer = document.createElement('div');
    mobileMenuContainer.className = 'mobile-menu-container';

    // Add mobile menu button to header
    header.querySelector('.container').appendChild(mobileMenuButton);

    // Add mobile menu container after header
    document.body.insertBefore(mobileMenuContainer, header.nextSibling);

    // Toggle mobile menu when button is clicked
    mobileMenuButton.addEventListener('click', function () {
        mobileMenuContainer.classList.toggle('active');

        if (mobileMenuContainer.classList.contains('active')) {
            // If menu is now active, populate it
            mobileMenuContainer.innerHTML = '';

            const mobileNav = nav.cloneNode(true);
            const mobileAuthButtons = authButtons.cloneNode(true);

            mobileMenuContainer.appendChild(mobileNav);
            mobileMenuContainer.appendChild(mobileAuthButtons);

            // Add close button
            const closeButton = document.createElement('div');
            closeButton.className = 'mobile-menu-close';
            closeButton.innerHTML = '<i class="fas fa-times"></i>';
            mobileMenuContainer.appendChild(closeButton);

            // Close menu when close button is clicked
            closeButton.addEventListener('click', function () {
                mobileMenuContainer.classList.remove('active');
            });

            // Close menu when a link is clicked
            mobileMenuContainer.querySelectorAll('a').forEach(link => {
                link.addEventListener('click', function () {
                    mobileMenuContainer.classList.remove('active');
                });
            });

            // Prevent scrolling on body when menu is open
            document.body.style.overflow = 'hidden';
        } else {
            // Re-enable scrolling when menu is closed
            document.body.style.overflow = '';
        }
    });

    // Add CSS for mobile menu
    const style = document.createElement('style');
    style.textContent = `
        .mobile-menu-button {
            display: none;
            font-size: 1.5rem;
            cursor: pointer;
            color: var(--secondary-color);
        }
        
        .mobile-menu-container {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: var(--dark-bg);
            z-index: 1000;
            padding: 50px 20px;
            overflow-y: auto;
            transform: translateX(-100%);
            transition: transform 0.3s ease;
        }
        
        .mobile-menu-container.active {
            display: block;
            transform: translateX(0);
        }
        
        .mobile-menu-container nav ul {
            flex-direction: column;
            align-items: center;
            margin: 30px 0;
        }
        
        .mobile-menu-container nav ul li {
            margin: 15px 0;
        }
        
        .mobile-menu-container nav ul li a {
            color: white;
            font-size: 1.2rem;
        }
        
        .mobile-menu-container .auth-buttons {
            flex-direction: column;
            align-items: center;
            gap: 15px;
            margin-top: 30px;
        }
        
        .mobile-menu-container .auth-buttons .btn {
            width: 200px;
        }
        
        .mobile-menu-close {
            position: absolute;
            top: 20px;
            right: 20px;
            font-size: 1.5rem;
            color: white;
            cursor: pointer;
        }
        
        @media (max-width: 768px) {
            .mobile-menu-button {
                display: block;
            }
            
            header nav, header .auth-buttons {
                display: none;
            }
        }
    `;

    document.head.appendChild(style);
}

/**
 * Initialize search form validation
 */
function initializeSearchForm() {
  const searchForm = document.querySelector('.search-form form');

  if (!searchForm) return;

  searchForm.addEventListener('submit', function (e) {
    e.preventDefault();

    const pickupLocation = document.getElementById('pickup-location')?.value;
    const dropoffLocation = document.getElementById('dropoff-location')?.value;
    const pickupDate = document.getElementById('pickup-date')?.value;
    const pickupTime = document.getElementById('pickup-time')?.value;
    const numberOfDays = document.getElementById('number-of-days')?.value;
    const userseats = document.getElementById('userseats')?.value;

    let isValid = true;
    let errorMessage = '';

    if (!pickupLocation) {
      isValid = false;
      errorMessage = 'Please select a pickup location';
    } else if (!dropoffLocation) {
      isValid = false;
      errorMessage = 'Please select a drop-off location';
    } else if (!pickupDate) {
      isValid = false;
      errorMessage = 'Please select a pickup date';
    } else if (!pickupTime) {
      isValid = false;
      errorMessage = 'Please select a pickup time';
    } else if (!numberOfDays || parseInt(numberOfDays) <= 0) {
      isValid = false;
      errorMessage = 'Please enter a valid number of days';
    } else if (!userseats || parseInt(userseats) <= 0) {
      isValid = false;
      errorMessage = 'Please enter a valid number of seats';
    }

    // Proceed if valid
    if (isValid) {
      const existingError = searchForm.querySelector('.error-message');
      if (existingError) existingError.remove();

      const submitButton = searchForm.querySelector('button[type="submit"]');
      const originalText = submitButton.textContent;
      submitButton.textContent = 'Searching...';
      submitButton.disabled = true;

      setTimeout(() => {
        submitButton.textContent = originalText;
        submitButton.disabled = false;
        searchForm.submit();
      }, 500); // Faster delay if needed

    } else {
      let errorElement = searchForm.querySelector('.error-message');
      if (!errorElement) {
        errorElement = document.createElement('div');
        errorElement.className = 'error-message';
        errorElement.style.color = 'red';
        errorElement.style.marginTop = '15px';
        errorElement.style.textAlign = 'center';
        searchForm.appendChild(errorElement);
      }
      errorElement.textContent = errorMessage;
    }
  });
}

function toggleDropdown() {
    const menu = document.getElementById('dropdownMenu');
    menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
}

window.addEventListener('click', function (e) {
    const avatar = document.querySelector('.user-avatar');
    const menu = document.getElementById('dropdownMenu');
    if (menu && avatar && !avatar.contains(e.target)) {
        menu.style.display = 'none';
    }
});

document.addEventListener('DOMContentLoaded', () => {
    const pickupDateInput = document.getElementById('pickup-date');
    const numberOfDaysInput = document.getElementById('number-of-days');
    const totalPriceInput = document.getElementById('totalPrice');
    const rateInput = document.getElementById('rate');

    if (!pickupDateInput || !numberOfDaysInput || !rateInput || !totalPriceInput) {
        console.error("One or more required input fields not found.");
        return;
    }

    function calculateTotal() {
        const pickup = new Date(pickupDateInput.value);
        const days = parseInt(numberOfDaysInput.value, 10);
        const ratePerDay = parseFloat(rateInput.value);

        if (
            pickup instanceof Date && !isNaN(pickup.getTime()) &&
            !isNaN(days) && days > 0 &&
            !isNaN(ratePerDay)
        ) {
            totalPriceInput.value = days * ratePerDay;
        } else {
            totalPriceInput.value = '';
        }
    }

    pickupDateInput.addEventListener('change', calculateTotal);
    numberOfDaysInput.addEventListener('input', calculateTotal);

    // Trigger on load
    calculateTotal();
});

function startPayment() {
    const payBtn = document.getElementById('pay-now');

    const totalPrice = payBtn.dataset.totalprice;
    const userName = payBtn.dataset.username;
    const userEmail = payBtn.dataset.useremail;

    fetch('/payment', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ amount: totalPrice })
    })
        .then(res => res.json())
        .then(order => {
            const options = {
                key: "rzp_test_ABC123xyz456", // Replace with your key
                amount: order.amount,
                currency: order.currency,
                name: "Your Car Booking Service",
                description: "Car rental payment",
                order_id: order.id,
                handler: function (response) {
                    alert("Payment Successful! Payment ID: " + response.razorpay_payment_id);
                    window.location.href = "/success";
                },
                prefill: {
                    name: userName,
                    email: userEmail
                },
                theme: {
                    color: "#3399cc"
                }
            };

            const rzp = new Razorpay(options);
            rzp.open();
        })
        .catch(err => {
            console.error("Payment failed to start:", err);
            alert("Something went wrong.");
        });
}