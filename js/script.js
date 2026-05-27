
    function toggleMenu() {
    const hamburger = document.querySelector(".hamburger");
    const navLinks = document.querySelector(".nav-links");

    hamburger.classList.toggle("active");
    navLinks.classList.toggle("active");
    }

    // Close menu when clicking outside
    document.addEventListener("click", function (event) {
    const hamburger = document.querySelector(".hamburger");
    const navLinks = document.querySelector(".nav-links");

    if (
        !hamburger.contains(event.target) &&
        !navLinks.contains(event.target)
    ) {
        hamburger.classList.remove("active");
        navLinks.classList.remove("active");
    }
    });


    function updateTime() {
        const now = new Date();
        const options = {
            timeZone: "America/New_York",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: true
        };
        const timeString = new Intl.DateTimeFormat("en-US", options).format(now);
        document.getElementById("current-time").textContent = timeString;
    }
    
    // Update time every second
    setInterval(updateTime, 1000);
    
    // Initialize time on page load
    updateTime();

    document.addEventListener("DOMContentLoaded", function () {
        const images = document.querySelectorAll("img");
        images.forEach(img => {
            if (!img.hasAttribute("loading")) {
                img.setAttribute("loading", "lazy");
            }
        });
    });
    
    