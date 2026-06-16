const configUrl = "./src/data/site.json";

const state = {
  countdownTimer: null,
};

async function loadSiteData() {
  const response = await fetch(configUrl, { cache: "no-store" });
  if (!response.ok) {
    throw new Error("Unable to load site configuration.");
  }
  return response.json();
}

function formatEventDate(dateTime, locale, options, timeZone) {
  return new Intl.DateTimeFormat(locale, { ...options, timeZone }).format(new Date(dateTime));
}

function buildCalendarFile(calendar) {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Grahapravesham//Event Calendar//EN",
    "BEGIN:VEVENT",
    `UID:${calendar.uid}`,
    `DTSTAMP:${calendar.stamp}`,
    `DTSTART:${calendar.start}`,
    `DTEND:${calendar.end}`,
    `SUMMARY:${calendar.title}`,
    `DESCRIPTION:${calendar.details}`,
    `LOCATION:${calendar.location}`,
    "END:VEVENT",
    "END:VCALENDAR"
  ];

  return `data:text/calendar;charset=utf-8,${encodeURIComponent(lines.join("\r\n"))}`;
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

function renderGallery(images) {
  const gallery = document.getElementById("gallery-grid");
  gallery.innerHTML = "";

  images.forEach((image) => {
    const img = document.createElement("img");
    img.src = image.src;
    img.alt = image.alt;
    img.loading = "lazy";
    gallery.appendChild(img);
  });
}

function renderSchedule(items) {
  const scheduleList = document.getElementById("schedule-list");
  scheduleList.innerHTML = "";

  items.forEach((item) => {
    const wrapper = document.createElement("article");
    wrapper.className = "timeline-item";

    const time = document.createElement("div");
    time.className = "timeline-time";
    time.textContent = item.time;

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

function renderRsvp(rsvp) {
  setText("rsvp-copy", rsvp.copy);
  setLink("rsvp-link", rsvp.formUrl);

  const embed = document.getElementById("rsvp-embed");
  embed.src = rsvp.embedUrl || rsvp.formUrl;
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
    const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((difference / (1000 * 60)) % 60);
    const seconds = Math.floor((difference / 1000) % 60);

    setText("days", String(days).padStart(2, "0"));
    setText("hours", String(hours).padStart(2, "0"));
    setText("minutes", String(minutes).padStart(2, "0"));
    setText("seconds", String(seconds).padStart(2, "0"));
  };

  update();
  state.countdownTimer = window.setInterval(update, 1000);
}

function applySiteContent(data) {
  document.title = data.seo.title;

  setText("event-type", data.event.type);
  setText("event-title", data.event.title);
  setText("event-subtitle", data.event.subtitle);
  setText(
    "event-datetime",
    formatEventDate(
      data.event.dateTime,
      data.event.locale,
      data.event.displayFormat,
      data.event.timeZone,
    ),
  );
  setText("event-timezone", data.event.timeZoneLabel);
  setText("event-location", data.venue.name);
  setText("banner-text", data.banner.text);
  setText("banner-text-clone", data.banner.text);

  const inviteImage = document.getElementById("invite-image");
  inviteImage.src = data.media.inviteImage.src;
  inviteImage.alt = data.media.inviteImage.alt;

  setText("venue-name", data.venue.name);
  setText("venue-address", data.venue.address);
  setText("venue-landmark", data.venue.landmark);
  setText("parking-instructions", data.venue.parking);

  setText("host-name", data.contact.hostName);
  setText("host-copy", data.contact.copy);

  setLink("google-maps-link", data.venue.googleMapsUrl);
  setLink("apple-maps-link", data.venue.appleMapsUrl);
  setLink("calendar-link", buildCalendarFile(data.calendar));
  setLink("call-link", `tel:${data.contact.phone}`);
  setLink("whatsapp-link", buildWhatsappLink(data.contact.whatsapp, data.contact.whatsappMessage));

  renderGallery(data.media.gallery);
  renderSchedule(data.schedule);
  renderNotes(data.notes);
  renderRsvp(data.rsvp);
  renderStream(data.stream);
  startCountdown(data.event.dateTime);
}

async function init() {
  try {
    const data = await loadSiteData();
    applySiteContent(data);
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
