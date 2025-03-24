import { bookTemplate } from "./templates.js";

document.addEventListener("DOMContentLoaded", function () {
  const sections = document.querySelectorAll("main section");
  const footerLinks = document.querySelectorAll("footer ul li");

  footerLinks.forEach((link, index) => {
    link.addEventListener("click", function () {
      sections.forEach((section) => (section.style.display = "none"));
      sections[index].style.display = "flex";
      const nav = document.querySelector("nav");

      if(index !=2){
        nav.classList.remove("open");
      }

      if (index == 1) {
        document.getElementById("search-box").focus();
      }
    });
  });

  sections[0].style.display = "flex";

  let icon = document.querySelector("svg");
  icon.addEventListener("click", () => {
    document.querySelector(".search-bar").classList.toggle("active");
    if (document.querySelector(".search-bar").classList.contains("active")) {
      document.querySelector("input").focus();
    }
  });
});

async function loadBooks() {
  let req = await fetch("./data/books.json");
  let res = await req.json();
  let bookContainer = document.querySelector(".books");
  bookContainer.innerHTML = "";
  res.forEach((book) => {
    bookContainer.innerHTML += bookTemplate(book);
  });
}
loadBooks();

// Fetch books data from JSON
async function fetchBooks() {
  try {
    const req = await fetch("./data/books.json");
    const books = await req.json();

    // Search functionality
    document.getElementById("search-box").addEventListener("input", (e) => {
      const query = e.target.value.toLowerCase().trim();
      const results = books.filter(
        (book) =>
          book.BookName.toLowerCase().includes(query) ||
          book.AuthorName.toLowerCase().includes(query)
      );

      displayResults(results);
    });

    // Display all books initially
    displayResults(books);
    document.querySelector(".search-results").innerHTML = "";
  } catch (error) {
    console.error("Failed to fetch books:", error);
    document.querySelector(".search-results").innerHTML =
      "<li>Error loading books data.</li>";
  }
}

// Display search results dynamically
function displayResults(results) {
  const resultContainer = document.querySelector(".search-results");
  resultContainer.innerHTML = results.length
    ? results.map((book) => bookTemplate(book)).join("")
    : "<li>No books found</li>";
}

// Call the fetch function when the page loads
fetchBooks();

async function loadBorrowedBooks() {
  let req = await fetch("./data/books.json");
  let res = await req.json();
  let bookContainer = document.querySelector(".borrowed-books");
  bookContainer.innerHTML = "";
  res.forEach((book) => {
    bookContainer.innerHTML += bookTemplate(book);
  });
}
loadBorrowedBooks();

const nav = document.querySelector("nav"),
  toggleBtn = nav.querySelector(".toggle-btn");
const navItems = nav.querySelectorAll("span");
// Create an input element dynamically
const loader = document.querySelector(".loader");
toggleBtn.addEventListener("click", () => {
  nav.classList.toggle("open");
});

navItems.forEach((item) => {
  item.addEventListener("click", () => {
    nav.classList.remove("open");
  });
});

const startButton = document.getElementById("start-scan");
const toggleButton = document.getElementById("toggle-scan");
const switchButton = document.getElementById("switch-camera");
const scanAgainButton = document.getElementById("scan-again");

const videoElement = document.getElementById("barcode-scanner");
const scanOverlay = document.getElementById("scan-overlay");
const scannerContainer = document.getElementById("scanner-container");
const scannedDataDiv = document.getElementById("scanned-data");
const scannedContent = document.getElementById("scanned-content");

let isScanning = false;
let lastScannedCode = null;
let lastScannedTime = 0;
let currentFacingMode = "environment"; // Start with rear camera
let stream = null;
let hasUserInteracted = false;

// Only initialize after user interaction
startButton.addEventListener("click", function () {
  if (!hasUserInteracted) {
    hasUserInteracted = true;

    startButton.disabled = true;
    initializeScanner();
  }
});

function initializeScanner() {
  // First check if we can access the camera
  checkCameraAccess()
    .then(() => {
      // Camera access granted, initialize Quagga
      initQuagga();
      scannerContainer.style.display = "block";
      startButton.classList.add("hidden");
      toggleButton.classList.remove("hidden");
      switchButton.classList.remove("hidden");
    })
    .catch((err) => {
      console.error("Camera access error:", err);

      startButton.disabled = false;
    });
}

function checkCameraAccess() {
  return navigator.mediaDevices
    .getUserMedia({
      video: {
        facingMode: currentFacingMode,
        width: { ideal: 1280 },
        height: { ideal: 720 },
      },
    })
    .then((mediaStream) => {
      // Show camera feed in the video element
      videoElement.srcObject = mediaStream;
      stream = mediaStream;
      return new Promise((resolve) => {
        videoElement.onloadedmetadata = () => {
          videoElement.play();
          resolve();
        };
      });
    });
}

function initQuagga() {
  Quagga.init(
    {
      inputStream: {
        name: "Live",
        type: "LiveStream",
        target: videoElement,
        constraints: {
          width: { min: 640 },
          height: { min: 480 },
          facingMode: currentFacingMode,
          aspectRatio: { ideal: 1.3333333 },
        },
      },
      decoder: {
        readers: [
          "code_128_reader",
          "ean_reader",
          "ean_8_reader",
          "code_39_reader",
          "code_39_vin_reader",
          "codabar_reader",
          "upc_reader",
          "upc_e_reader",
        ],
        multiple: false,
      },
      locate: true,
      frequency: 10,
      halfSample: true,
      patchSize: "medium",
    },
    function (err) {
      if (err) {
        console.error("Error initializing scanner:", err);

        startButton.disabled = false;
        startButton.classList.remove("hidden");
        return;
      }
      console.log("Barcode scanner initialized successfully");
      isScanning = true;
      Quagga.start();
    }
  );

  Quagga.onDetected(function (result) {
    const code = result.codeResult.code;
    const now = Date.now();

    // Prevent duplicate scans within 2 seconds
    if (code === lastScannedCode && now - lastScannedTime < 2000) {
      return;
    }

    lastScannedCode = code;
    lastScannedTime = now;

    // Visual feedback

    // Display scanned data
    scannedContent.textContent = code;
    scannedDataDiv.style.display = "block";

    console.log("Barcode detected:", code);
    playBeepSound();

    // Try to vibrate - will only work if user has interacted
    try {
      if (navigator.vibrate && hasUserInteracted) {
        navigator.vibrate(200);
      }
    } catch (e) {
      console.log("Vibration not supported or not allowed yet");
    }

    // Automatically close camera after successful scan
    closeScanner();

    // Show scan again button
    scanAgainButton.classList.remove("hidden");
    toggleButton.classList.add("hidden");
    switchButton.classList.add("hidden");
  });
}

function closeScanner() {
  // Stop Quagga and camera stream
  if (Quagga && isScanning) {
    Quagga.stop();
    isScanning = false;
  }
  if (stream) {
    stream.getTracks().forEach((track) => track.stop());
    videoElement.srcObject = null;
  }

  // Hide scanner elements
  scanOverlay.classList.add("hidden");
  scannerContainer.style.display = "none";
}

function toggleScanner() {
  if (isScanning) {
    Quagga.stop();
    scanOverlay.classList.add("hidden");
    toggleButton.textContent = "Resume Scan";

    isScanning = false;
  } else {
    Quagga.start();
    scanOverlay.classList.remove("hidden");
    toggleButton.textContent = "Pause Scan";

    isScanning = true;
  }
}

function switchCamera() {
  // Stop current stream and Quagga
  closeScanner();

  // Toggle between front and back camera
  currentFacingMode =
    currentFacingMode === "environment" ? "user" : "environment";

  // Reinitialize with the other camera
  initializeScanner();
}

function scanAgain() {
  // Reset UI
  scannedDataDiv.style.display = "none";
  scanAgainButton.classList.add("hidden");
  toggleButton.classList.remove("hidden");
  switchButton.classList.remove("hidden");

  // Restart scanner
  initializeScanner();
}

function playBeepSound() {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    oscillator.type = "sine";
    oscillator.frequency.value = 800;
    gainNode.gain.value = 0.1;

    oscillator.start();
    setTimeout(() => {
      oscillator.stop();
    }, 200);
  } catch (e) {
    console.log("Couldn't play sound:", e);
  }
}

toggleButton.addEventListener("click", toggleScanner);
switchButton.addEventListener("click", switchCamera);
scanAgainButton.addEventListener("click", scanAgain);

window.addEventListener("beforeunload", function () {
  closeScanner();
});
