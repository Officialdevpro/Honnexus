import loadBorrowedBooks from "./script.js";
import { profileTemplate } from "./templates.js";

const scannerContainer = document.getElementById("scanner-container-1");
const videoElement = document.getElementById("barcode-scanner-1");

const backdrop = document.querySelector(".backdrop-1");
const loading = document.querySelector(".loading-1");

let studentId = "";
let bookId = "";
let scannerActive = false;
let currentStream = null;
let scanResolver = null;

document.getElementById("recordBtn").addEventListener("click", async () => {
  document.querySelector(".scanned-result").innerHTML = "";
  try {
    const data = await initScanner();

    fetch("https://honnexus.onrender.com/api/v1/borrow?studentId=" + data)
      .then((response) => {
        if (!response.ok) throw new Error("Network response was not ok");
        return response.json();
      })
      .then((data) => {
        // Use the data as needed
        profileTemplate(data.books, data.user);
      })
      .catch((error) => {
        console.error("Fetch error:", error);
      });
  } catch (error) {
    console.error("Scanning failed:", error);
  }
});

async function initScanner() {
  return new Promise(async (resolve, reject) => {
    try {
      loading.style.display = "block";
      backdrop.classList.add("active");

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });

      currentStream = stream;
      videoElement.srcObject = stream;

      videoElement.onloadedmetadata = () => {
        videoElement.play();
        initQuagga(resolve, reject);
        scannerContainer.classList.add("active");
      };
    } catch (error) {
      hideScanner();
      reject(error);
    }
  });
}

function initQuagga(resolve, reject) {
  Quagga.init(
    {
      inputStream: {
        name: "Live",
        type: "LiveStream",
        target: videoElement,
        constraints: {
          width: { min: 640 },
          height: { min: 480 },
          aspectRatio: { ideal: 1.333 },
        },
      },
      decoder: { readers: ["code_128_reader", "ean_reader", "upc_reader"] },
    },
    (err) => {
      if (err) {
        hideScanner();
        reject(err);
        return;
      }
      Quagga.start();
      loading.style.display = "none";

      const timeout = setTimeout(() => {
        hideScanner();
        reject(new Error("Scan timed out"));
      }, 30000); // 30 seconds timeout

      Quagga.onDetected((result) => {
        clearTimeout(timeout);
        const code = result.codeResult.code;

        hideScanner();
        resolve(code);
      });

      scannerActive = true;
    }
  );
}

function hideScanner() {
  scannerContainer.classList.remove("active");
  backdrop.classList.remove("active");

  if (currentStream) {
    currentStream.getTracks().forEach((track) => track.stop());
  }

  if (Quagga && scannerActive) {
    Quagga.stop();
    scannerActive = false;
  }
}

window.addEventListener("beforeunload", hideScanner);
