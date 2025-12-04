document.addEventListener("DOMContentLoaded", function () {
  // Initialize Swiper
  var swiper = new Swiper(".gallery-container", {
    slidesPerView: 1,
    spaceBetween: 20,
    centeredSlides: true,
    loop: true,
    pagination: {
      el: ".swiper-pagination",
      clickable: true,
    },
    navigation: {
      nextEl: ".swiper-button-next",
      prevEl: ".swiper-button-prev",
    },
    breakpoints: {
      768: {
        slidesPerView: 1.5,
      },
    },
  });

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

// Modal functions
function openModal(src) {
  const modal = document.getElementById("imageModal");
  const modalImg = document.getElementById("modalImage");
  if (!modal || !modalImg) return;

  modal.classList.add("show");
  modalImg.src = src;
  document.body.style.overflow = "hidden";
}

function closeModal() {
  const modal = document.getElementById("imageModal");
  if (!modal) return;

  modal.classList.remove("show");
  document.body.style.overflow = "auto";
}

// Open map function
function openMap(lat, lng, zoom) {
  const url = `https://www.google.com/maps/@${lat},${lng},${zoom}z/data=!3m1!1e3`;
  window.open(url, "_blank");
}
