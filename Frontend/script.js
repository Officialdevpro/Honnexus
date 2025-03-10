document.addEventListener("DOMContentLoaded", function () {
    const sections = document.querySelectorAll("main section");
    const footerLinks = document.querySelectorAll("footer ul li");

    footerLinks.forEach((link, index) => {
        link.addEventListener("click", function () {
            sections.forEach(section => section.style.display = "none");
            sections[index].style.display = "flex";
        });
    });
});
