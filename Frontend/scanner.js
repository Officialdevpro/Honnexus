import loadBorrowedBooks from "./script.js";

const scanBtn = document.getElementById("scan-btn");
const scannerContainer = document.getElementById("scanner-container");
const videoElement = document.getElementById("barcode-scanner");
const scannedData = document.getElementById("scanned-data");
const scannedContent = document.getElementById("scanned-content");
const backdrop = document.querySelector(".backdrop");
const loading = document.querySelector(".loading");
const sections = document.querySelectorAll("main section");
let studentId = "";
let bookId = "";
let scannerActive = false;
let currentStream = null;
let scanResolver = null;

document
  .querySelectorAll(".clean-btn")[0]
  .addEventListener("click", async () => {
    try {
      const data = await initScanner();
      console.log("Scanned data:", data);
      // Use the scanned data here
      fetchData("users", data);
    } catch (error) {
      console.error("Scanning failed:", error);
    }
  });
document
  .querySelectorAll(".clean-btn")[1]
  .addEventListener("click", async () => {
    try {
      const data = await initScanner();
      console.log("Scanned data:", data);
      fetchData("books", data);
      // Use the scanned data here
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

      // Set timeout to handle case where no barcode is scanned
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

async function fetchData(purpose, id) {
  let req = await fetch(
    `https://honnexus.onrender.com/api/v1/${purpose}/${id}`
  );

  if (purpose == "books") {
    let { book } = await req.json();
    bookId = book.bookId;

    document.querySelector(".book-img").setAttribute("src", book.icon);
    document.querySelector(".book-name").innerHTML = book.bookName;
    document.querySelector(".author-name").innerHTML = book.author;
    document.querySelector(".stock").innerHTML = book.stock;
    document.querySelector(".edition").innerHTML = book.edition;
    document.querySelector("li.book-card.padding").classList.remove("active");
    hideScanner();
  } else if (purpose == "users") {
    let { student } = await req.json();
    studentId = student.studentId;
    console.log(student);
    document
      .querySelector(".student-img img")
      .setAttribute("src", "images/profiles/" + student.profile);
    let name = document.querySelector(".student-name");
    let id = document.querySelector(".student-id");
    name.innerHTML = student.username;
    id.innerHTML = student.studentId;
    document.querySelector(".student-content").classList.remove("active");
    hideScanner();
  }
}

document.querySelector(".modern-btn").addEventListener("click", () => {
  if (!studentId || !bookId) {
    console.warn("Student ID or Book ID is missing.");
    return;
  }
  linkTogether({ studentId, bookId });
});

async function linkTogether(data) {
  try {
    const response = await fetch(
      "https://honnexus.onrender.com/api/v1/borrow",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      console.error("Error:", result.message || "Something went wrong");
      return;
    }

    console.log("Success:", result);
    document.querySelector("li.book-card.padding").classList.add("active");
    document.querySelector(".student-content").classList.add("active");
    sections.forEach((section) => (section.style.display = "none"));
    loadBorrowedBooks();
    sections[3].style.display = "flex";

    // You can add a success UI feedback here
  } catch (error) {
    console.error("Network error:", error.message);
    // Handle network errors or show error UI
  }
}
