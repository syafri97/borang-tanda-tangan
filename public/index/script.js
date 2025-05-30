const signaturePad = new SignaturePad(document.getElementById("signature-pad"));
const clearButton = document.getElementById("clear");
const form = document.getElementById("signature-form");
const responseDiv = document.getElementById("response");

clearButton.addEventListener("click", () => {
  signaturePad.clear();
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  // Check if the signature is empty
  if (signaturePad.isEmpty()) {
    responseDiv.textContent = "Sila buat tandatangan dahulu!";
    return;
  }

  // Collect form data
  const formData = new FormData(form);
  const formObject = Object.fromEntries(formData.entries());

  // Append the signature data in base64 format
  formObject.signature = signaturePad.toDataURL();

  // Send form data as JSON
  try {
    const response = await fetch("/submit", {
      method: "POST",
      body: JSON.stringify(formObject), // Send JSON data
      headers: {
        "Content-Type": "application/json", // Set content type to JSON
      },
    });

    const result = await response.text();
    responseDiv.textContent = result;

    // Reset the form and signature pad after submission
    form.reset();
    signaturePad.clear();
  } catch (error) {
    responseDiv.textContent = "Ralat semasa menghantar borang.";
    console.error(error); // Log the error to console
  }
});
