export function bookTemplate(book) {
  // Calculate how many full and empty stars are needed
  const fullStars = Math.floor(book.Rating);
  const halfStar = book.Rating % 1 >= 0.5;
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
                    <img src="${book.BookImage}" alt="Book cover" />
                  </div>
                  <div class="right-portion">
                    <p>${book.BookName}</p>
                    <div class="author-details">
                      <small>Edition - ${book.Edition}</small>
                      <small>Author : ${book.AuthorName}</small>
                    </div>
                    <div class="">
                      <p>Available Books : <b>${book.BookStock}</b></p>
                    </div>
                    <div class="ratings">
                      <div class="stars">
                        ${starsHTML}
                        <p style="color: darkolivegreen;">(${book.NumberOfRatings})</p>
                      </div>
                    </div>
                  </div>
                </li>`;
}
export function borrowedBooksTemplate(borrowedBooks) {
  let container = document.querySelector(".borrowed-book-details");
  container.innerHTML = "";
  borrowedBooks.forEach((book) => {
   
    // Generate a random color
    const randomColor = `hsl(${Math.floor(Math.random() * 360)}, 70%, 60%)`; // Random hue, balanced saturation & lightness

    container.innerHTML += ` 
      <li class="book-card column">
        <div class="left-portion">
          <b class="label" style="background-color: ${randomColor}; color: white; padding: 5px 10px; border-radius: 5px;">
            ${book.DaysLeft} days ago
          </b>
          <img src="${book.BookImage}" alt="Book cover" />
        </div>
        <div class="right-portion">
          <p>${book.BookName}</p>
        </div>
      </li>`;
  });
}
