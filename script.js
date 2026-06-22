const configUrl = "./src/data/site.json";

const state = {
  countdownTimer: null,
  language: getInitialLanguage(),
};

const sharedCopy = {
  brand: "Nithyasri & Naveen Kumar's Grahapravesham",
  when: "When",
  where: "Where",
  date: "Date:",
  time: "Time:",
  days: "Days",
  addToCalendar: "Add to Calendar",
  directions: "Directions",
};

const chooserModalContent = {
  calendar: {
    title: "Add to Calendar",
    primary: { id: "chooser-primary-link", label: "Google Calendar" },
    secondary: { id: "chooser-secondary-link", label: "Apple Calendar" },
  },
  directions: {
    title: "Directions",
    primary: { id: "chooser-primary-link", label: "Google Maps" },
    secondary: { id: "chooser-secondary-link", label: "Apple Maps" },
  },
  contact: {
    title: "Contact Host",
    primary: { id: "chooser-primary-link", label: "Call Host" },
    secondary: { id: "chooser-secondary-link", label: "WhatsApp" },
  },
};

const uiCopy = {
  en: {
    nav: {
      home: "Home",
      schedule: "Schedule",
      watch: "Watch",
    },
    labels: {
      date: "Date:",
      time: "Time:",
      days: "Days",
    },
    sections: {
      scheduleEyebrow: "Schedule",
      scheduleTitle: "Plan your visit",
      heroSchedule: "View Agenda",
      heroWatch: "Watch Livestream",
      heroContact: "Contact Host",
      watchEyebrow: "Livestream",
      watchTitle: "Watch from wherever you are",
    },
  },
  ta: {
    nav: {
      home: "முகப்பு",
      schedule: "நிகழ்ச்சி திட்டம்",
      watch: "நேரலை",
    },
    labels: {
      date: "தேதி:",
      time: "நேரம்:",
      days: "நாட்கள்",
    },
    sections: {
      scheduleEyebrow: "நிகழ்ச்சி",
      scheduleTitle: "உங்கள் வருகையைத் திட்டமிடுங்கள்",
      heroSchedule: "நிகழ்ச்சி திட்டம்",
      heroWatch: "நேரலையைப் பார்க்கவும்",
      heroContact: "தொடர்பு கொள்ளுங்கள்",
      watchEyebrow: "நேரலை",
      watchTitle: "நீங்கள் எங்கிருந்தாலும் பார்க்கலாம்",
    },
  },
};

async function loadSiteData() {
  const response = await fetch(configUrl, { cache: "no-store" });
  if (!response.ok) {
    throw new Error("Unable to load site configuration.");
  }
  return response.json();
}

function getInitialLanguage() {
  const saved = window.localStorage.getItem("site-language");
  if (saved === "en" || saved === "ta") {
    return saved;
  }

  return navigator.language && navigator.language.toLowerCase().startsWith("ta")
    ? "ta"
    : "en";
}

function pickLocalized(value, language) {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value[language] ?? value.en ?? Object.values(value)[0] ?? "";
  }

  return value ?? "";
}

function getLocaleForLanguage(language) {
  return language === "ta" ? "ta-IN" : "en-US";
}

function formatEventDate(dateTime, locale, options, timeZone) {
  return new Intl.DateTimeFormat(locale, { ...options, timeZone }).format(
    new Date(dateTime),
  );
}

function getViewerTimeZone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || "";
}

function getTimeZoneAbbreviation(dateTime, timeZone) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    timeZoneName: "short",
  }).formatToParts(new Date(dateTime));

  return parts.find((part) => part.type === "timeZoneName")?.value || "";
}

function buildGoogleCalendarUrl(calendar) {
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: calendar.title,
    dates: `${calendar.start}/${calendar.end}`,
    details: calendar.details,
    location: calendar.location,
    ctz: "America/New_York",
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function buildWebcalUrl(path) {
  const url = new URL(path, window.location.href);
  url.protocol = "webcal:";
  return url.toString();
}

function buildWhatsappLink(number, message) {
  const sanitized = number.replace(/[^\d]/g, "");
  return `https://wa.me/${sanitized}?text=${encodeURIComponent(message)}`;
}

function setText(id, value) {
  const node = document.getElementById(id);
  if (node) {
    node.textContent = value;
  }
}

function setLink(id, href) {
  const node = document.getElementById(id);
  if (node) {
    node.href = href;
  }
}

function setupChooserModal(data) {
  const dialog = document.getElementById("chooser-dialog");
  const title = document.getElementById("chooser-dialog-title");
  const primaryLink = document.getElementById("chooser-primary-link");
  const secondaryLink = document.getElementById("chooser-secondary-link");

  if (!dialog || !title || !primaryLink || !secondaryLink) {
    return;
  }

  const configureModal = (kind) => {
    const content = chooserModalContent[kind];
    if (!content) {
      return;
    }

    title.textContent = content.title;
    primaryLink.textContent = content.primary.label;
    secondaryLink.textContent = content.secondary.label;

    if (kind === "calendar") {
      setLink(primaryLink.id, buildGoogleCalendarUrl(data.calendar));
      setLink(secondaryLink.id, buildWebcalUrl("./calendar.ics"));
    } else {
      if (kind === "contact") {
        setLink(primaryLink.id, `tel:${data.contact.phone}`);
        setLink(
          secondaryLink.id,
          buildWhatsappLink(data.contact.whatsapp, data.contact.whatsappMessage),
        );
        return;
      }
      setLink(primaryLink.id, data.venue.googleMapsUrl);
      setLink(secondaryLink.id, data.venue.appleMapsUrl);
    }
  };

  document.querySelectorAll(".chooser-trigger").forEach((trigger) => {
    trigger.addEventListener("click", () => {
      const kind =
        trigger.id === "calendar-summary"
          ? "calendar"
          : trigger.id === "directions-summary"
            ? "directions"
            : "contact";
      configureModal(kind);
      if (typeof dialog.showModal === "function") {
        dialog.showModal();
      }
    });
  });

  dialog.addEventListener("click", (event) => {
    const rect = dialog.getBoundingClientRect();
    const clickedOutside =
      event.clientX < rect.left ||
      event.clientX > rect.right ||
      event.clientY < rect.top ||
      event.clientY > rect.bottom;

    if (clickedOutside) {
      dialog.close();
    }
  });
}

function renderSchedule(items, locale, timeZone, labels) {
  const scheduleList = document.getElementById("schedule-list");
  scheduleList.innerHTML = "";

  items.forEach((item) => {
    const wrapper = document.createElement("article");
    wrapper.className = "timeline-item";

    const time = document.createElement("div");
    time.className = "timeline-time";
    const date = formatEventDate(item.dateTime, locale, {
      dateStyle: "full",
    }, timeZone);
    const clock = formatEventDate(item.dateTime, locale, {
      timeStyle: "short",
    }, timeZone);
    const zone = getTimeZoneAbbreviation(item.dateTime, timeZone);
    time.textContent = `${labels.date} ${date}\n${labels.time} ${clock}${zone ? ` ${zone}` : ""}`;

    const content = document.createElement("div");
    const title = document.createElement("h3");
    title.textContent = item.title;
    const description = document.createElement("p");
    description.className = "supporting";
    description.textContent = item.description;

    content.append(title, description);
    wrapper.append(time, content);
    scheduleList.appendChild(wrapper);
  });
}

function renderStream(stream) {
  setText("stream-copy", stream.copy);
  const streamEmbed = document.getElementById("stream-embed");
  const streamLink = document.getElementById("stream-link");

  if (streamLink) {
    streamLink.href = stream.watchUrl || stream.embedUrl || "#";
  }

  if (streamEmbed) {
    streamEmbed.src = stream.embedUrl || "";
  }
}

function startCountdown(dateTime) {
  const targetTime = new Date(dateTime).getTime();

  const update = () => {
    const now = Date.now();
    const difference = Math.max(targetTime - now, 0);

    const days = Math.floor(difference / (1000 * 60 * 60 * 24));

    setText("days", String(days).padStart(2, "0"));
  };

  update();
  state.countdownTimer = window.setInterval(update, 1000);
}

function applySiteContent(data) {
  const language = state.language;
  const content = data.i18n?.[language] ?? {};
  const locale = getLocaleForLanguage(language);
  const viewerTimeZone = getViewerTimeZone();
  const timeZone = viewerTimeZone || data.event.timeZone;
  const labels = uiCopy[language].labels;

  document.documentElement.lang = language === "ta" ? "ta" : "en";
  document.title =
    pickLocalized(content.seo?.title, language) || data.seo.title;

  setText(
    "brand-link",
    pickLocalized(content.brand, language) || sharedCopy.brand,
  );
  setText("when-label", sharedCopy.when);
  setText("where-label", sharedCopy.where);
  setText("days-label", labels.days);
  setText("calendar-summary", sharedCopy.addToCalendar);
  setText("directions-summary", sharedCopy.directions);
  setText("contact-summary", uiCopy[language].sections.heroContact);
  setText("hero-schedule-link", uiCopy[language].sections.heroSchedule);
  setText("hero-watch-link", uiCopy[language].sections.heroWatch);
  setText("stream-link", "Open Livestream");
  setText("schedule-eyebrow", uiCopy[language].sections.scheduleEyebrow);
  setText("schedule-title", uiCopy[language].sections.scheduleTitle);
  setText("watch-eyebrow", uiCopy[language].sections.watchEyebrow);
  setText("watch-title", uiCopy[language].sections.watchTitle);

  setText(
    "event-title",
    pickLocalized(content.event?.title, language) || data.event.title,
  );
  const dateLabel = labels.date;
  const timeLabel = labels.time;
  const eventDate = formatEventDate(data.event.dateTime, locale, { dateStyle: "full" }, timeZone);
  const eventTime = formatEventDate(data.event.dateTime, locale, { timeStyle: "short" }, timeZone);
  const eventZone = getTimeZoneAbbreviation(data.event.dateTime, timeZone);
  setText("event-datetime", `${dateLabel} ${eventDate}\n${timeLabel} ${eventTime}${eventZone ? ` ${eventZone}` : ""}`);
  setText(
    "event-subtitle",
    pickLocalized(content.event?.subtitle, language) || data.event.subtitle,
  );
  setText(
    "event-location",
    `${pickLocalized(content.venue?.name, language) || data.venue.name}\n${pickLocalized(content.venue?.address, language) || data.venue.address}`,
  );
  setText(
    "banner-text",
    pickLocalized(content.banner?.text, language) || data.banner.text,
  );
  setText(
    "banner-text-clone",
    pickLocalized(content.banner?.text, language) || data.banner.text,
  );

  const inviteImage = document.getElementById("invite-image");
  inviteImage.src = data.media.inviteImage.src;
  inviteImage.alt =
    pickLocalized(content.media?.inviteImageAlt, language) ||
    data.media.inviteImage.alt;

  setText("parking-inline", pickLocalized(content.venue?.parking, language) || data.venue.parking);

  const languageButtons = document.querySelectorAll(".lang-btn");
  languageButtons.forEach((button) => {
    const active = button.dataset.lang === language;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-pressed", String(active));
  });

  const scheduleItems = data.schedule.map((item, index) => {
    const translated = content.schedule?.[index] ?? {};
    return {
      dateTime: item.dateTime,
      title: pickLocalized(translated.title, language) || item.title,
      description:
        pickLocalized(translated.description, language) || item.description,
    };
  });

  renderSchedule(scheduleItems, locale, timeZone, labels);
  renderStream({
    copy: pickLocalized(content.stream?.copy, language) || data.stream.copy,
    watchUrl: data.stream.watchUrl,
    embedUrl: data.stream.embedUrl,
  });
  startCountdown(data.event.dateTime);
}

function setLanguage(language, data) {
  state.language = language;
  window.localStorage.setItem("site-language", language);
  applySiteContent(data);
}

async function init() {
  try {
    const data = await loadSiteData();
    applySiteContent(data);
    setupChooserModal(data);
    document.querySelectorAll(".lang-btn").forEach((button) => {
      button.addEventListener("click", () =>
        setLanguage(button.dataset.lang, data),
      );
    });
    const app = document.getElementById("app");
    app.classList.remove("page-loading");
    app.classList.add("page-ready");
    app.setAttribute("aria-busy", "false");
  } catch (error) {
    const app = document.getElementById("app");
    app.innerHTML =
      '<section class="section"><article class="panel"><h2>Content unavailable</h2><p class="supporting">Update <code>src/data/site.json</code> with valid details and refresh the page.</p></article></section>';
    app.classList.remove("page-loading");
    app.classList.add("page-ready");
    app.setAttribute("aria-busy", "false");
    console.error(error);
  }
}

init();
