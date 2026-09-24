/* =========================================================
   SereneHaven Wellness — script.js
   Handles: navbar scroll state, scroll fade-in animations,
   booking slot/service selection, and payment form validation.
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {
  initNavbarScroll();
  initFadeInOnScroll();
  initServiceSelection();
  initSlotSelection();
  initBookingSummary();
  initBookingFormValidation();
});

/* ---------------------------------------------------------
   Navbar: adds a subtle shadow/compact state once scrolled
   --------------------------------------------------------- */
function initNavbarScroll() {
  const navbar = document.getElementById("mainNavbar");
  if (!navbar) return;

  const toggleScrolled = () => {
    navbar.classList.toggle("scrolled", window.scrollY > 40);
  };

  toggleScrolled();
  window.addEventListener("scroll", toggleScrolled, { passive: true });
}

/* ---------------------------------------------------------
   Fluid fade-in-up animation as elements enter the viewport
   --------------------------------------------------------- */
function initFadeInOnScroll() {
  const elements = document.querySelectorAll(".fade-in-up");
  if (!elements.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );

  elements.forEach((el) => observer.observe(el));
}

/* ---------------------------------------------------------
   Booking Page: Service selection (radio-card behaviour)
   --------------------------------------------------------- */
function initServiceSelection() {
  const options = document.querySelectorAll(".service-option");
  if (!options.length) return;

  const serviceInput = document.getElementById("selectedService");
  const priceInput = document.getElementById("selectedPrice");

  options.forEach((option) => {
    option.addEventListener("click", () => {
      options.forEach((o) => o.classList.remove("selected"));
      option.classList.add("selected");

      serviceInput.value = option.dataset.service;
      priceInput.value = option.dataset.price;

      updateBookingSummary();
    });
  });
}

/* ---------------------------------------------------------
   Booking Page: Time slot grid selection
   --------------------------------------------------------- */
function initSlotSelection() {
  const slotButtons = document.querySelectorAll(".slot-btn");
  if (!slotButtons.length) return;

  const slotInput = document.getElementById("selectedSlot");
  const slotError = document.getElementById("slotError");

  slotButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      if (btn.disabled) return;

      slotButtons.forEach((b) => b.classList.remove("selected"));
      btn.classList.add("selected");

      slotInput.value = btn.dataset.slot;
      slotError.classList.remove("show");

      updateBookingSummary();
    });
  });
}

/* ---------------------------------------------------------
   Booking Page: Live summary panel updates
   --------------------------------------------------------- */
function initBookingSummary() {
  const dateSelect = document.getElementById("bookingDate");
  if (!dateSelect) return;
  dateSelect.addEventListener("change", updateBookingSummary);
  updateBookingSummary();
}

function updateBookingSummary() {
  const serviceInput = document.getElementById("selectedService");
  const priceInput = document.getElementById("selectedPrice");
  const dateSelect = document.getElementById("bookingDate");
  const slotInput = document.getElementById("selectedSlot");

  const summaryService = document.getElementById("summaryService");
  const summaryDateTime = document.getElementById("summaryDateTime");
  const summaryTotal = document.getElementById("summaryTotal");

  if (!serviceInput || !summaryService) return;

  summaryService.textContent = serviceInput.value;
  summaryTotal.textContent = `$${priceInput.value}`;

  const dateLabel = dateSelect ? dateSelect.options[dateSelect.selectedIndex].value : "";
  const slotLabel = slotInput ? slotInput.value : "";

  summaryDateTime.textContent =
    dateLabel && slotLabel ? `${dateLabel} at ${slotLabel}` : "Select a date & time slot";
}

/* ---------------------------------------------------------
   Booking Page: Guest details & payment form validation
   --------------------------------------------------------- */
function initBookingFormValidation() {
  const form = document.getElementById("bookingForm");
  if (!form) return;

  const successOverlay = document.getElementById("successOverlay");
  const closeSuccessBtn = document.getElementById("closeSuccessBtn");

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const isSlotValid = validateSlotSelection();
    const isFormValid = validateFormFields();

    if (isSlotValid && isFormValid) {
      showSuccessOverlay();
      form.reset();
      resetSelections();
    }
  });

  if (closeSuccessBtn) {
    closeSuccessBtn.addEventListener("click", () => {
      successOverlay.classList.remove("active");
    });
  }

  // Live formatting for card fields
  const cardNumber = document.getElementById("cardNumber");
  const cardExpiry = document.getElementById("cardExpiry");
  const cardCvv = document.getElementById("cardCvv");

  if (cardNumber) {
    cardNumber.addEventListener("input", () => {
      cardNumber.value = formatCardNumber(cardNumber.value);
    });
  }

  if (cardExpiry) {
    cardExpiry.addEventListener("input", () => {
      cardExpiry.value = formatExpiry(cardExpiry.value);
    });
  }

  if (cardCvv) {
    cardCvv.addEventListener("input", () => {
      cardCvv.value = cardCvv.value.replace(/\D/g, "").slice(0, 4);
    });
  }
}

function validateSlotSelection() {
  const slotInput = document.getElementById("selectedSlot");
  const slotError = document.getElementById("slotError");
  if (!slotInput) return true;

  const isValid = slotInput.value.trim().length > 0;
  slotError.classList.toggle("show", !isValid);
  return isValid;
}

function validateFormFields() {
  const fields = [
    {
      id: "guestName",
      validate: (v) => v.trim().length >= 2,
    },
    {
      id: "guestEmail",
      validate: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()),
    },
    {
      id: "cardNumber",
      validate: (v) => v.replace(/\s/g, "").length === 16 && /^\d+$/.test(v.replace(/\s/g, "")),
    },
    {
      id: "cardExpiry",
      validate: (v) => isValidExpiry(v.trim()),
    },
    {
      id: "cardCvv",
      validate: (v) => /^\d{3,4}$/.test(v.trim()),
    },
  ];

  let allValid = true;

  fields.forEach(({ id, validate }) => {
    const input = document.getElementById(id);
    const errorEl = document.querySelector(`[data-error-for="${id}"]`);
    if (!input) return;

    const valid = validate(input.value);
    input.classList.toggle("is-invalid-field", !valid);
    if (errorEl) errorEl.classList.toggle("show", !valid);

    if (!valid) allValid = false;
  });

  return allValid;
}

function isValidExpiry(value) {
  const match = /^(\d{2})\/(\d{2})$/.exec(value);
  if (!match) return false;

  const month = parseInt(match[1], 10);
  const year = parseInt(`20${match[2]}`, 10);
  if (month < 1 || month > 12) return false;

  const now = new Date();
  const expiryDate = new Date(year, month, 0); // last day of expiry month
  return expiryDate >= new Date(now.getFullYear(), now.getMonth(), 1);
}

function formatCardNumber(value) {
  const digits = value.replace(/\D/g, "").slice(0, 16);
  return digits.replace(/(.{4})/g, "$1 ").trim();
}

function formatExpiry(value) {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

function showSuccessOverlay() {
  const overlay = document.getElementById("successOverlay");
  if (overlay) overlay.classList.add("active");
}

function resetSelections() {
  document.querySelectorAll(".slot-btn.selected").forEach((b) => b.classList.remove("selected"));
  const slotInput = document.getElementById("selectedSlot");
  if (slotInput) slotInput.value = "";

  document.querySelectorAll(".is-invalid-field").forEach((el) => el.classList.remove("is-invalid-field"));
  document.querySelectorAll(".field-error.show").forEach((el) => el.classList.remove("show"));

  const options = document.querySelectorAll(".service-option");
  options.forEach((o, i) => o.classList.toggle("selected", i === 0));
  const serviceInput = document.getElementById("selectedService");
  const priceInput = document.getElementById("selectedPrice");
  if (options.length && serviceInput && priceInput) {
    serviceInput.value = options[0].dataset.service;
    priceInput.value = options[0].dataset.price;
  }

  updateBookingSummary();
}
