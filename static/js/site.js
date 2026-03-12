const navToggle = document.querySelector("[data-nav-toggle]");
const siteNav = document.querySelector("[data-site-nav]");

if (navToggle && siteNav) {
  navToggle.addEventListener("click", () => {
    siteNav.classList.toggle("is-open");
  });
}

document.querySelectorAll("[data-flash]").forEach((flash) => {
  window.setTimeout(() => {
    flash.style.opacity = "0";
    flash.style.transition = "opacity 0.3s ease";
  }, 5000);
});

const cartSummary = document.querySelector("[data-cart-summary]");
if (cartSummary) {
  const currency = cartSummary.dataset.currency || "NGN";
  const money = new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  });

  const taxRate = Number(cartSummary.dataset.taxRate || 0.075);
  const shippingFee = Number(cartSummary.dataset.shippingFee || 0);
  const freeShippingThreshold = Number(cartSummary.dataset.freeShippingThreshold || 0);
  const lineTotals = cartSummary.querySelectorAll("[data-line-total]");
  const quantityInputs = cartSummary.querySelectorAll("[data-cart-quantity]");

  const updateSummary = () => {
    let subtotal = 0;
    quantityInputs.forEach((input, index) => {
      const row = input.closest(".cart-line");
      const unitPrice = Number(row?.dataset.unitPrice || 0);
      const quantity = Number(input.value || 0);
      const lineTotal = unitPrice * quantity;
      subtotal += lineTotal;
      if (lineTotals[index]) {
        lineTotals[index].textContent = money.format(lineTotal);
      }
    });

    const tax = subtotal * taxRate;
    const shippingValue = subtotal === 0 ? 0 : (subtotal >= freeShippingThreshold ? 0 : shippingFee);
    const total = subtotal + tax + shippingValue;
    const subtotalElement = document.querySelector("[data-cart-subtotal]");
    const taxElement = document.querySelector("[data-cart-tax]");
    const shippingElement = document.querySelector("[data-cart-shipping]");
    const totalElement = document.querySelector("[data-cart-total]");

    if (subtotalElement) subtotalElement.textContent = money.format(subtotal);
    if (taxElement) taxElement.textContent = money.format(tax);
    if (shippingElement) shippingElement.textContent = money.format(shippingValue);
    if (totalElement) totalElement.textContent = money.format(total);
  };

  quantityInputs.forEach((input) => input.addEventListener("input", updateSummary));
}
