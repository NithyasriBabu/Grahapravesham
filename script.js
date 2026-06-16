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
  timezonePrefix: "Your local time zone:",
  timezoneFallback: "Event time zone:",
  days: "Days",
  addToCalendar: "Add to Calendar",
  googleCalendar: "Google Calendar",
  appleCalendar: "Apple Calendar",
  directions: "Directions",
  googleMaps: "Google Maps",
  appleMaps: "Apple Maps",
  callHost: "Call Host",
  whatsapp: "WhatsApp",
};

const uiCopy = {
  en: {
    nav: {
      home: "Home",
      schedule: "Schedule",
      watch: "Watch",
      contact: "Contact",
    },
    sections: {
      scheduleEyebrow: "Schedule",
      scheduleTitle: "Plan your visit",
      watchEyebrow: "Livestream",
      watchTitle: "Watch from wherever you are",
      contactEyebrow: "Contact",
      contactTitle: "Reach us quickly on the day",
      notesTitle: "Event notes",
    },
  },
  ta: {
    nav: {
      home: "முகப்பு",
      schedule: "நிகழ்ச்சி திட்டம்",
      watch: "நேரலை",
      contact: "தொடர்பு",
    },
    sections: {
      scheduleEyebrow: "நிகழ்ச்சி",
      scheduleTitle: "உங்கள் வருகையைத் திட்டமிடுங்கள்",
      watchEyebrow: "நேரலை",
      watchTitle: "நீங்கள் எங்கிருந்தாலும் பார்க்கலாம்",
      contactEyebrow: "தொடர்பு",
      contactTitle: "நிகழ்ச்சி நாளில் விரைவாக எங்களைத் தொடர்புகொள்ளுங்கள்",
      notesTitle: "நிகழ்ச்சி குறிப்புகள்",
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

function renderSchedule(items, locale, timeZone) {
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
    time.textContent = `${sharedCopy.date} ${date}\n${sharedCopy.time} ${clock}`;

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

function renderNotes(notes) {
  const list = document.getElementById("event-notes");
  list.innerHTML = "";

  notes.forEach((note) => {
    const item = document.createElement("li");
    item.textContent = note;
    list.appendChild(item);
  });
}

function renderStream(stream) {
  setText("stream-copy", stream.copy);
  setText("stream-placeholder", stream.placeholder);
  const streamEmbed = document.getElementById("stream-embed");
  const shouldShowEmbed = Boolean(stream.embedUrl) && !stream.embedUrl.includes("VIDEO_ID");
  streamEmbed.src = shouldShowEmbed ? stream.embedUrl : "";
  streamEmbed.classList.toggle("is-hidden", !shouldShowEmbed);
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

  document.documentElement.lang = language === "ta" ? "ta" : "en";
  document.title =
    pickLocalized(content.seo?.title, language) || data.seo.title;

  setText("brand-link", sharedCopy.brand);
  setText("nav-home", uiCopy[language].nav.home);
  setText("nav-schedule", uiCopy[language].nav.schedule);
  setText("nav-watch", uiCopy[language].nav.watch);
  setText("nav-contact", uiCopy[language].nav.contact);

  setText("when-label", sharedCopy.when);
  setText("where-label", sharedCopy.where);
  setText("days-label", sharedCopy.days);
  setText("calendar-summary", sharedCopy.addToCalendar);
  setText("directions-summary", sharedCopy.directions);
  setText("schedule-eyebrow", uiCopy[language].sections.scheduleEyebrow);
  setText("schedule-title", uiCopy[language].sections.scheduleTitle);
  setText("watch-eyebrow", uiCopy[language].sections.watchEyebrow);
  setText("watch-title", uiCopy[language].sections.watchTitle);
  setText("contact-eyebrow", uiCopy[language].sections.contactEyebrow);
  setText("contact-title", uiCopy[language].sections.contactTitle);
  setText("notes-title", uiCopy[language].sections.notesTitle);

  setText(
    "event-title",
    pickLocalized(content.event?.title, language) || data.event.title,
  );
  const dateLabel = sharedCopy.date;
  const timeLabel = sharedCopy.time;
  const eventDate = formatEventDate(data.event.dateTime, locale, { dateStyle: "full" }, timeZone);
  const eventTime = formatEventDate(data.event.dateTime, locale, { timeStyle: "short" }, timeZone);
  setText("event-datetime", `${dateLabel} ${eventDate}\n${timeLabel} ${eventTime}`);
  setText(
    "event-subtitle",
    pickLocalized(content.event?.subtitle, language) || data.event.subtitle,
  );
  setText(
    "event-timezone",
    viewerTimeZone
    ? `${sharedCopy.timezonePrefix} ${viewerTimeZone}`
    : `${sharedCopy.timezoneFallback} ${pickLocalized(content.event?.timeZoneLabel, language) || data.event.timeZoneLabel}`,
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

  setText(
    "host-name",
    pickLocalized(content.contact?.hostName, language) || data.contact.hostName,
  );
  setText(
    "host-copy",
    pickLocalized(content.contact?.copy, language) || data.contact.copy,
  );

  setText("google-calendar-link", sharedCopy.googleCalendar);
  setText("apple-calendar-link", sharedCopy.appleCalendar);
  setText("google-maps-link", sharedCopy.googleMaps);
  setText("apple-maps-link", sharedCopy.appleMaps);
  setText("call-link", sharedCopy.callHost);
  setText("whatsapp-link", sharedCopy.whatsapp);

  const calendar = {
    ...data.calendar,
    title:
      pickLocalized(content.calendar?.title, language) || data.calendar.title,
    details:
      pickLocalized(content.calendar?.details, language) ||
      data.calendar.details,
    location:
      pickLocalized(content.calendar?.location, language) ||
      data.calendar.location,
  };
  setLink("google-calendar-link", buildGoogleCalendarUrl(calendar));
  setLink("apple-calendar-link", buildWebcalUrl("./calendar.ics"));
  setLink("call-link", `tel:${data.contact.phone}`);
  setLink(
    "whatsapp-link",
    buildWhatsappLink(data.contact.whatsapp, data.contact.whatsappMessage),
  );
  setLink("google-maps-link", data.venue.googleMapsUrl);
  setLink("apple-maps-link", data.venue.appleMapsUrl);

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

  renderSchedule(scheduleItems, locale, timeZone);
  renderNotes(
    (content.notes ?? data.notes).map((note, index) => {
      const translated = content.notes?.[index];
      return pickLocalized(translated, language) || note;
    }),
  );
  renderStream({
    copy: pickLocalized(content.stream?.copy, language) || data.stream.copy,
    placeholder:
      pickLocalized(content.stream?.placeholder, language) ||
      data.stream.placeholder,
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
