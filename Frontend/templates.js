export function bookTemplate(book) {
  // Calculate how many full and empty stars are needed
  const fullStars = Math.floor(book.ratings);
  const halfStar = book.ratings % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);

  // Generate star icons based on rating
  const starsHTML =
    '<img src="icons/filledStar.svg" alt="" class="star-icon"/>'.repeat(
      fullStars
    ) +
    (halfStar
      ? '<img src="icons/star-half.svg" alt="" class="star-icon"/>'
      : "") +
    '<img src="icons/star.svg" alt="" class="star-icon"/>'.repeat(emptyStars);

  return `<li class="book-card">
                  <div class="left-portion">
                    <img src="${book.icon}" alt="Book cover" />
                  </div>
                  <div class="right-portion">
                    <p>${book.bookName}</p>
                    <div class="author-details">
                      <small>Edition - ${book.edition}</small>
                      <small>Author : ${book.author}</small>
                    </div>
                    <div class="">
                      <p>Available Books : <b>${book.stock}</b></p>
                    </div>
                    <div class="ratings">
                      <div class="stars">
                        ${starsHTML}
                        <p style="color: darkolivegreen;">(${Math.round(
                          Math.random() * 100
                        )})</p>
                      </div>
                    </div>
                  </div>
                </li>`;
}
export function borrowedBooksTemplate(borrowedBooks) {
  let container = document.getElementById("borrow");
  container.innerHTML = "";
  borrowedBooks.forEach((book) => {
    // Generate a random color
    const randomColor = `hsl(${Math.floor(Math.random() * 360)}, 70%, 60%)`; // Random hue, balanced saturation & lightness

    container.innerHTML += ` 
      <li class="book-card column">
        <div class="left-portion">
          <b class="label" style="background-color: ${randomColor}; color: white; padding: 5px 10px; border-radius: 5px;">
            ${book.createdAt}
          </b>
          <img src="${book.icon}" alt="Book cover" />
        </div>
        <div class="right-portion">
          <p>${book.bookName}</p>
        </div>
      </li>`;
  });
}

function makeBookCard(books) {
  let dataum = "";
  
  books.forEach((book) => {
    const randomColor = `hsl(${Math.floor(Math.random() * 360)}, 70%, 60%)`; 
    dataum += `   
    <li class="book-card column">
                    <div class="left-portion">
                      <b
                        class="label"
                        style="
                          background-color: ${randomColor};
                          color: white;
                          padding: 5px 10px;
                          border-radius: 5px;
                        "
                      >
                        ${book.createdAt}
                      </b>
                      <img
                        src="${book.icon}"
                        alt="Book cover"
                      />
                    </div>
                    <div class="right-portion">
                      <p>${book.bookName}</p>
                    </div>
                    <button class="clean" data-bookId=${book._id}>Return</button>
                  </li>`;
  });
  return dataum;
}

export function profileTemplate(books,user) {
  let borrowed = 0;

  let returned = 0
  let template = `
<div class="profile-top-portion">
                <img src="./images/profiles/${user.profile}" alt="" />
                <div class="profile-details">
                  <h2>${user.username}</h2>
                  <small>${user.studentId}</small>
                </div>
              </div>
              <div class="profile-status">
                <div class="left-box">
                  <b>Borrowed</b>
                  <h1>${borrowed}</h1>
                </div>
                <div class="right-box">
                  <b>Returned</b>
                  <h1>${returned}</h1>
                </div>
              </div>
              <h3>Borrowed Books</h3>
              <div class="borrowed-book-details">
                
                ${makeBookCard(books)}
               
              </div>`;

  document.querySelector(".scanned-result").innerHTML = template;
}
