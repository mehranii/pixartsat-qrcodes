document.addEventListener("DOMContentLoaded", function () {
  // Initialize Swiper

  // Initialize audio player
  // Initialize audio player with new features
  // المان‌ها

  const playBtn = document.getElementById("playBtn");
  const speedBtn = document.getElementById("speedBtn");
  const speedList = document.getElementById("speedList");
  const speedIndicator = document.getElementById("speedIndicator");
  const currentTimeEl = document.getElementById("currentTime");
  const durationEl = document.getElementById("duration");
  const rewBtn = document.getElementById("rewBtn");
  const ffBtn = document.getElementById("ffBtn");
  const audioEl = document.getElementById("audioPlayer");

  const AUDIO_SRC = "../../scripts/pixartsat_64k.mp3";
  audioEl.src = AUDIO_SRC;

  // WaveSurfer v7
  const wavesurfer = WaveSurfer.create({
    container: "#waveform",
    media: audioEl,
    waveColor: "rgba(255,255,255,0.2)",
    progressColor: "var(--accent-color)",
    cursorColor: "var(--accent-color)",
    barWidth: 2,
    height: 72,
  });

  // Autoplay try
  document.addEventListener("DOMContentLoaded", () => {
    audioEl.play().catch(() => {});
  });

  // Play / Pause
  playBtn.addEventListener("click", () => {
    wavesurfer.playPause();
    updatePlayBtn();
  });

  function updatePlayBtn() {
    playBtn.innerHTML = wavesurfer.isPlaying()
      ? '<i class="fas fa-pause"></i>'
      : '<i class="fas fa-play"></i>';
  }

  // Skip backward / forward
  rewBtn.addEventListener("click", () => {
    wavesurfer.setTime(Math.max(0, wavesurfer.getCurrentTime() - 15));
  });
  ffBtn.addEventListener("click", () => {
    wavesurfer.setTime(
      Math.min(wavesurfer.getDuration(), wavesurfer.getCurrentTime() + 15)
    );
  });

  // Time update
  wavesurfer.on("audioprocess", () => {
    currentTimeEl.textContent = formatTime(wavesurfer.getCurrentTime());
  });

  wavesurfer.on("ready", () => {
    durationEl.textContent = formatTime(wavesurfer.getDuration());
  });

  // Helpers
  function formatTime(sec) {
    if (!isFinite(sec)) return "--:--";
    const s = Math.floor(sec % 60)
      .toString()
      .padStart(2, "0");
    const m = Math.floor(sec / 60)
      .toString()
      .padStart(2, "0");
    return `${m}:${s}`;
  }

  // اگر بخوای می‌تونیم marker یا regions اضافه کنیم — اما این نسخه پایه و حرفه‌ای برای اسکراب و سرعت است.
  // کنترل سرعت — لیست ساده
  speedBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    speedList.style.display =
      speedList.style.display === "block" ? "none" : "block";
    speedList.setAttribute("aria-hidden", speedList.style.display === "none");
  });

  speedList.querySelectorAll("button").forEach((btn) => {
    btn.addEventListener("click", () => {
      const rate = parseFloat(btn.dataset.rate);
      wavesurfer.setPlaybackRate(rate);
      speedIndicator.textContent = rate + "x";
      speedList.style.display = "none";
    });
  });

  // کلیک خارج برای بستن منو
  document.addEventListener("click", (e) => {
    if (!speedBtn.contains(e.target) && !speedList.contains(e.target)) {
      speedList.style.display = "none";
    }
  });

  // وقتی کاربر مستقیم در audioEl کنترل کنه (fallback)
  audioEl.addEventListener("play", updatePlayBtn);
  audioEl.addEventListener("pause", updatePlayBtn);

  // برای خواندن دقیق زمان در mobile زمانی که wavesurfer به روز نمیشود
  audioEl.addEventListener("timeupdate", () => {
    currentTimeEl.textContent = formatTime(audioEl.currentTime);
  });

  // Load product specs from JSON
  fetch("product-config.json")
    .then((response) => {
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      return response.json();
    })
    .then((data) => {
      const specs = data.product_specs;

      // Populate technical specs
      const specsContainer = document.getElementById("technicalSpecs");
      if (specsContainer) {
        specs.technical.forEach((item) => {
          specsContainer.innerHTML += `
              <div class="spec-item">
                <div class="icon"><i class="fas ${item.icon}"></i></div>
                <span class="label">${item.label}</span>
                <span class="value">${item.value}</span>
              </div>
            `;
        });
      }

      // Populate art description
      if (
        document.getElementById("artTitle") &&
        document.getElementById("artContent")
      ) {
        document.getElementById("artTitle").textContent =
          specs.art_description.title;
        document.getElementById("artContent").textContent =
          specs.art_description.content;
      }

      // Set map coordinates
      const mapBtn = document.getElementById("mapBtn");
      if (mapBtn) {
        mapBtn.onclick = () =>
          openMap(
            specs.map_coordinates.lat,
            specs.map_coordinates.lng,
            specs.map_coordinates.zoom
          );
      }

      // Set artist profile
      const artistProfile = document.getElementById("artistProfile");
      if (artistProfile) {
        const img = artistProfile.querySelector("img");
        if (img) img.src = specs.artist_profile.image;
        artistProfile.onclick = () =>
          (window.location.href = specs.artist_profile.portfolio_link);
      }

      // Initialize spectral chart
      if (specs.spectral_data) {
        initSpectralChart(specs.spectral_data);
      }
    })
    .catch((error) => {
      console.error("Error loading product config:", error);
      // Fallback to default specs if needed
    });
});

function initSpectralChart(spectralData) {
  const ctx = document.getElementById("spectralChart");
  if (!ctx) return;

  const bands = {
    Landsat: ["B1", "B2", "B3", "B4", "B5", "B6", "B7"],
    Sentinel: [
      "B1",
      "B2",
      "B3",
      "B4",
      "B5",
      "B6",
      "B7",
      "B8",
      "B8A",
      "B9",
      "B10",
      "B11",
      "B12",
    ],
  };

  const wavelengths = {
    Landsat: [0.44, 0.48, 0.56, 0.65, 0.85, 1.6, 2.2],
    Sentinel: [
      0.443, 0.49, 0.56, 0.665, 0.705, 0.74, 0.783, 0.842, 0.865, 0.945, 1.375,
      1.61, 2.19,
    ],
  };

  const visibleRange = {
    min: 0.4,
    max: 0.7,
  };

  const data = bands[spectralData.satellite].map((band, i) => {
    const wavelength = wavelengths[spectralData.satellite][i];
    return {
      band,
      wavelength,
      isVisible:
        wavelength >= visibleRange.min && wavelength <= visibleRange.max,
      isUsed: spectralData.used_bands.includes(band),
    };
  });

  new Chart(ctx.getContext("2d"), {
    type: "bar",
    data: {
      labels: data.map((d) => d.band),
      datasets: [
        {
          label: "محدوده مرئی",
          data: data.map((d) => (d.isVisible ? d.wavelength : 0)),
          backgroundColor: "rgba(255, 255, 255, 0.3)",
          borderColor: "rgba(255, 255, 255, 0.7)",
          borderWidth: 1,
        },
        {
          label: "باندهای استفاده شده",
          data: data.map((d) => (d.isUsed ? d.wavelength : 0)),
          backgroundColor: "#fda481",
          borderColor: "#fda481",
          borderWidth: 1,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: "طول موج (μm)",
          },
        },
        x: {
          title: {
            display: true,
            text: `باندهای ماهواره ${spectralData.satellite}`,
          },
        },
      },
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          callbacks: {
            label: function (context) {
              let label = context.dataset.label || "";
              if (label) {
                label += ": ";
              }
              if (context.parsed.y !== null) {
                label += context.parsed.y + " μm";
              }
              return label;
            },
          },
        },
      },
    },
  });
}

// Open map function
function openMap(lat, lng, zoom) {
  const url = `https://www.google.com/maps/@${lat},${lng},${zoom}z/data=!3m1!1e3`;
  window.open(url, "_blank");
}

document.addEventListener("DOMContentLoaded", function () {
  // Initialize Swiper
  const gallerySwiper = new Swiper(".gallery-container", {
    direction: "horizontal",
    loop: true,
    speed: 400,
    spaceBetween: 10,
    slidesPerView: 1,
    centeredSlides: true,
    grabCursor: true,
    touchRatio: 1,
    shortSwipes: true,
    longSwipesRatio: 0.5,

    // Desktop navigation
    navigation: {
      nextEl: ".swiper-button-next",
      prevEl: ".swiper-button-prev",
    },

    pagination: {
      el: ".swiper-pagination",
      clickable: true,
    },

    on: {
      init: function () {
        updateSlideCounter(this);
        updateThumbnails(this);
      },
      slideChange: function () {
        updateSlideCounter(this);
        updateThumbnails(this);
      },
    },
  });

  // Mobile navigation buttons
  const prevBtn = document.querySelector(".prev-btn");
  const nextBtn = document.querySelector(".next-btn");

  if (prevBtn) {
    prevBtn.addEventListener("click", () => {
      gallerySwiper.slidePrev();
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener("click", () => {
      gallerySwiper.slideNext();
    });
  }

  // Thumbnail click
  const thumbs = document.querySelectorAll(".thumb");
  thumbs.forEach((thumb, index) => {
    thumb.addEventListener("click", () => {
      gallerySwiper.slideTo(index);
    });
  });

  // Update slide counter
  function updateSlideCounter(swiper) {
    const currentSlide = document.querySelector(".current-slide");
    const totalSlides = document.querySelector(".total-slides");

    if (currentSlide) {
      currentSlide.textContent = swiper.realIndex + 1;
    }

    if (totalSlides) {
      totalSlides.textContent =
        swiper.slides.length - (swiper.params.loop ? 2 : 0);
    }
  }

  // Update active thumbnail
  function updateThumbnails(swiper) {
    const thumbs = document.querySelectorAll(".thumb");
    const activeIndex = swiper.realIndex;

    thumbs.forEach((thumb, index) => {
      if (index === activeIndex) {
        thumb.classList.add("active");
      } else {
        thumb.classList.remove("active");
      }
    });
  }

  // Modal functionality
  const modal = document.getElementById("galleryModal");
  const modalImage = document.getElementById("modalImage");
  const modalCaption = document.getElementById("modalCaption");
  const modalClose = document.querySelector(".modal-close");
  const modalPrev = document.querySelector(".modal-prev");
  const modalNext = document.querySelector(".modal-next");
  const zoomBtns = document.querySelectorAll(".zoom-btn");
  const imageContainers = document.querySelectorAll(".image-container");

  // Open modal with image
  function openModal(index) {
    const slide = gallerySwiper.slides[index];
    const img = slide.querySelector("img");
    const caption = slide.querySelector(".caption").textContent;

    modalImage.src = img.dataset.src || img.src;
    modalCaption.textContent = caption;
    modal.classList.add("active");
    document.body.style.overflow = "hidden";

    // Update modal navigation to current index
    currentModalIndex = index;
  }

  // Close modal
  function closeModal() {
    modal.classList.remove("active");
    document.body.style.overflow = "";
  }

  // Event listeners for images
  imageContainers.forEach((container, index) => {
    // Click on image container
    container.addEventListener("click", (e) => {
      if (!e.target.closest(".zoom-btn")) {
        openModal(index);
      }
    });
  });

  // Event listeners for zoom buttons
  zoomBtns.forEach((btn, index) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      openModal(index);
    });
  });

  // Modal navigation
  let currentModalIndex = 0;

  modalPrev.addEventListener("click", () => {
    currentModalIndex =
      (currentModalIndex - 1 + gallerySwiper.slides.length) %
      gallerySwiper.slides.length;
    openModal(currentModalIndex);
  });

  modalNext.addEventListener("click", () => {
    currentModalIndex = (currentModalIndex + 1) % gallerySwiper.slides.length;
    openModal(currentModalIndex);
  });

  // Close modal events
  modalClose.addEventListener("click", closeModal);

  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      closeModal();
    }
  });

  // Keyboard navigation
  document.addEventListener("keydown", (e) => {
    if (!modal.classList.contains("active")) return;

    switch (e.key) {
      case "Escape":
        closeModal();
        break;
      case "ArrowRight":
        modalPrev.click();
        break;
      case "ArrowLeft":
        modalNext.click();
        break;
    }
  });

  // Swipe to close modal on mobile
  let touchStartX = 0;
  let touchEndX = 0;

  modal.addEventListener("touchstart", (e) => {
    touchStartX = e.changedTouches[0].screenX;
  });

  modal.addEventListener("touchend", (e) => {
    touchEndX = e.changedTouches[0].screenX;
    handleSwipe();
  });

  function handleSwipe() {
    const swipeThreshold = 50;
    const swipeDistance = touchEndX - touchStartX;

    if (Math.abs(swipeDistance) > swipeThreshold) {
      if (swipeDistance > 0) {
        modalPrev.click(); // Swipe right -> previous
      } else {
        modalNext.click(); // Swipe left -> next
      }
    }
  }

  // Lazy loading for thumbnails
  const observerOptions = {
    root: null,
    rootMargin: "50px",
    threshold: 0.1,
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const img = entry.target.querySelector("img");
        if (img && img.dataset.src) {
          img.src = img.dataset.src;
          img.removeAttribute("data-src");
        }
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  // Observe gallery items
  document.querySelectorAll(".gallery-item").forEach((item) => {
    observer.observe(item);
  });
});
