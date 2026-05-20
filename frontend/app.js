const API_BASE = "/api/v1";
const tokenKey = "internshala_notes_token";
const userKey = "internshala_notes_user";

const state = {
  token: localStorage.getItem(tokenKey),
  user: JSON.parse(localStorage.getItem(userKey) || "null"),
};

const $ = (id) => document.getElementById(id);

function showMessage(text, type = "success") {
  const message = $("message");
  message.textContent = text;
  message.className = `message ${type}`;
  setTimeout(() => message.classList.add("hidden"), 4200);
}

function setSession(token, user) {
  state.token = token;
  state.user = user;
  localStorage.setItem(tokenKey, token);
  localStorage.setItem(userKey, JSON.stringify(user));
  renderSession();
}

function clearSession() {
  state.token = null;
  state.user = null;
  localStorage.removeItem(tokenKey);
  localStorage.removeItem(userKey);
  renderSession();
}

async function api(path, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };
  if (state.token) {
    headers.Authorization = `Bearer ${state.token}`;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (response.status === 204) {
    return null;
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const detail = typeof data.detail === "string" ? data.detail : "Request failed.";
    throw new Error(detail);
  }
  return data;
}

function renderSession() {
  const signedIn = Boolean(state.token && state.user);
  $("authView").classList.toggle("hidden", signedIn);
  $("dashboardView").classList.toggle("hidden", !signedIn);
  $("logoutBtn").classList.toggle("hidden", !signedIn);

  if (!signedIn) {
    $("userBadge").textContent = "Signed out";
    $("adminPanel").classList.add("hidden");
    return;
  }

  $("userBadge").textContent = `${state.user.email} · ${state.user.role}`;
  $("adminPanel").classList.toggle("hidden", state.user.role !== "admin");
  loadNotes();
}

function noteTemplate(note) {
  const article = document.createElement("article");
  article.className = "note-item";
  article.dataset.id = note.id;
  article.innerHTML = `
    <div>
      <input class="note-title" value="${escapeHtml(note.title)}" maxlength="120" />
      <textarea class="note-content" maxlength="2000" rows="3">${escapeHtml(note.content)}</textarea>
      <label class="check-row compact">
        <input class="note-completed" type="checkbox" ${note.completed ? "checked" : ""} />
        Completed
      </label>
    </div>
    <div class="note-actions">
      <button class="ghost save-note" type="button">Update</button>
      <button class="danger delete-note" type="button">Delete</button>
    </div>
  `;
  return article;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function loadNotes() {
  if (!state.token) return;
  try {
    const notes = await api("/notes");
    const list = $("notesList");
    list.innerHTML = "";
    if (!notes.length) {
      list.innerHTML = '<p class="empty">No notes yet.</p>';
      return;
    }
    notes.forEach((note) => list.appendChild(noteTemplate(note)));
  } catch (error) {
    showMessage(error.message, "error");
  }
}

async function loadAdminData() {
  try {
    const [users, notes] = await Promise.all([api("/admin/users"), api("/admin/notes")]);
    $("adminUsers").innerHTML = users
      .map((user) => `<li>${escapeHtml(user.email)} <span>${user.role}</span></li>`)
      .join("");
    $("adminNotes").innerHTML = notes
      .map((note) => `<li>${escapeHtml(note.title)} <span>owner #${note.owner_id}</span></li>`)
      .join("");
  } catch (error) {
    showMessage(error.message, "error");
  }
}

$("registerForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    const user = await api("/auth/register", {
      method: "POST",
      body: JSON.stringify({
        full_name: $("registerName").value,
        email: $("registerEmail").value,
        password: $("registerPassword").value,
      }),
    });
    showMessage(`Created ${user.email}. You can log in now.`);
    event.target.reset();
  } catch (error) {
    showMessage(error.message, "error");
  }
});

$("loginForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    const data = await api("/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email: $("loginEmail").value,
        password: $("loginPassword").value,
      }),
    });
    setSession(data.access_token, data.user);
    showMessage("Logged in.");
    event.target.reset();
  } catch (error) {
    showMessage(error.message, "error");
  }
});

$("logoutBtn").addEventListener("click", () => {
  clearSession();
  showMessage("Logged out.");
});

$("noteForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    await api("/notes", {
      method: "POST",
      body: JSON.stringify({
        title: $("noteTitle").value,
        content: $("noteContent").value,
        completed: $("noteCompleted").checked,
      }),
    });
    event.target.reset();
    showMessage("Note saved.");
    loadNotes();
  } catch (error) {
    showMessage(error.message, "error");
  }
});

$("notesList").addEventListener("click", async (event) => {
  const item = event.target.closest(".note-item");
  if (!item) return;

  try {
    if (event.target.classList.contains("save-note")) {
      await api(`/notes/${item.dataset.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          title: item.querySelector(".note-title").value,
          content: item.querySelector(".note-content").value,
          completed: item.querySelector(".note-completed").checked,
        }),
      });
      showMessage("Note updated.");
      loadNotes();
    }

    if (event.target.classList.contains("delete-note")) {
      await api(`/notes/${item.dataset.id}`, { method: "DELETE" });
      showMessage("Note deleted.");
      loadNotes();
    }
  } catch (error) {
    showMessage(error.message, "error");
  }
});

$("refreshNotesBtn").addEventListener("click", loadNotes);
$("loadAdminBtn").addEventListener("click", loadAdminData);

renderSession();

