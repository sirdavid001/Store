const paymentPicker = document.querySelector(".payment-method-picker");
if (paymentPicker) {
  const moreOptionsButton = paymentPicker.querySelector("[data-more-payment-options]");
  const appleCapable = paymentPicker.dataset.appleCapable === "true";
  const options = Array.from(paymentPicker.querySelectorAll(".payment-option"));

  if (appleCapable && moreOptionsButton) {
    options.forEach((option) => {
      const input = option.querySelector("input");
      if (input && input.value !== "apple_pay") {
        option.hidden = true;
      }
    });

    moreOptionsButton.addEventListener("click", () => {
      options.forEach((option) => {
        option.hidden = false;
      });
      moreOptionsButton.hidden = true;
    });
  }
}

const paymentStatusCard = document.querySelector("[data-payment-status-url]");
if (paymentStatusCard) {
  const statusUrl = paymentStatusCard.dataset.paymentStatusUrl;
  let attempts = 0;

  const poll = async () => {
    attempts += 1;
    try {
      const response = await fetch(statusUrl, { headers: { "X-Requested-With": "XMLHttpRequest" } });
      const data = await response.json();
      if (data.status === "ready" && data.redirect_url) {
        window.location.href = data.redirect_url;
        return;
      }
      if (data.status === "failed") {
        window.location.reload();
        return;
      }
    } catch (error) {
      console.error("Payment status poll failed", error);
    }

    if (attempts < 40) {
      window.setTimeout(poll, 3000);
    }
  };

  window.setTimeout(poll, 1500);
}
