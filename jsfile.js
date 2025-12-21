document.addEventListener('DOMContentLoaded', () => {
    const navToggle = document.querySelector('.nav-toggle');
    const navMenu = document.querySelector('.nav-menu');

    navToggle.addEventListener('click', () => {
        // Toggle the 'active' class on both the menu and the button
        navMenu.classList.toggle('active');
        navToggle.classList.toggle('active');
    });

    // Optional: Close the menu when a link is clicked (useful on mobile)
    const navLinks = document.querySelectorAll('.nav-menu a');

    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            // Check if the menu is currently active (i.e., we are on mobile)
            if (navMenu.classList.contains('active')) {
                navMenu.classList.remove('active');
                navToggle.classList.remove('active');
            }
        });
    });
});

document.querySelectorAll(".faq-question").forEach(button => {
  button.addEventListener("click", () => {
    const faqItem = button.parentElement;

    // Close other open items (optional but recommended)
    document.querySelectorAll(".faq-item").forEach(item => {
      if (item !== faqItem) {
        item.classList.remove("active");
      }
    });

    // Toggle current item
    faqItem.classList.toggle("active");
  });
});
