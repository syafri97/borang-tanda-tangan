const canvas = document.getElementById("signature-pad");
const signaturePad = new SignaturePad(canvas);

// Resize ikut screen
function resizeCanvas() {
  const ratio = Math.max(window.devicePixelRatio || 1, 1);
  canvas.width = canvas.offsetWidth * ratio;
  canvas.height = canvas.offsetHeight * ratio;
  canvas.getContext("2d").scale(ratio, ratio);
  signaturePad.clear();
}

window.addEventListener("resize", resizeCanvas);
resizeCanvas();

const clearButton = document.getElementById("clear");
const form = document.getElementById("signature-form");
const responseDiv = document.getElementById("response");

clearButton.addEventListener("click", () => {
  signaturePad.clear();
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (signaturePad.isEmpty()) {
    responseDiv.textContent = "Sila buat tandatangan dahulu!";
    return;
  }

  const formData = new FormData(form);
  const formObject = Object.fromEntries(formData.entries());

  formObject.signature = signaturePad.toDataURL();

  try {
    const response = await fetch("/submit", {
      method: "POST",
      body: JSON.stringify(formObject),
      headers: {
        "Content-Type": "application/json",
      },
    });

    const result = await response.text();
    responseDiv.textContent = result;

    form.reset();
    signaturePad.clear();
  } catch (error) {
    responseDiv.textContent = "Ralat semasa menghantar borang.";
    console.error(error);
  }
});
