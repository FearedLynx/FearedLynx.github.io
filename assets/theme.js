// Theme switch. The initial theme is set by the inline script in <head>.
(function () {
  var root = document.documentElement;
  var button = document.querySelector(".theme-toggle");
  if (!button) return;

  function current() {
    return root.dataset.theme || "light";
  }

  function label() {
    var next = current() === "dark" ? "warm" : "dark";
    button.setAttribute("aria-label", "Switch to " + next + " theme");
    button.title = "Switch to " + next + " theme";
  }

  root.dataset.theme = current();
  label();

  button.addEventListener("click", function () {
    var next = current() === "dark" ? "light" : "dark";
    root.dataset.theme = next;
    try { localStorage.setItem("theme", next); } catch (e) {}
    label();
  });
})();
