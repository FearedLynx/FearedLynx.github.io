// Click a picture (a.zoom) to see it full size in a dialog. Without JS the
// link simply opens the image itself, so nothing is lost.
(function () {
  var links = document.querySelectorAll("a.zoom");
  if (!links.length || typeof HTMLDialogElement !== "function") return;

  var dialog = document.createElement("dialog");
  dialog.className = "zoom-dialog";
  dialog.innerHTML = '<button class="zoom-close" type="button" aria-label="Close">×</button><img alt=""><p></p>';
  document.body.appendChild(dialog);
  var big = dialog.querySelector("img");
  var caption = dialog.querySelector("p");

  links.forEach(function (link) {
    link.addEventListener("click", function (event) {
      event.preventDefault();
      var small = link.querySelector("img");
      big.src = link.getAttribute("href");
      big.alt = small ? small.alt : "";
      caption.textContent = small ? small.alt : "";
      dialog.showModal();
    });
  });

  // Close on the button, a click on the picture or the backdrop, or Escape (built in)
  dialog.addEventListener("click", function (event) {
    if (event.target === dialog || event.target === big || event.target.classList.contains("zoom-close")) dialog.close();
  });
  dialog.addEventListener("close", function () { big.removeAttribute("src"); });
})();
