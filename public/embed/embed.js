(function () {
  var script = document.currentScript;

  var workflowId = script?.getAttribute("data-workflow-id") || "";

  var scriptSrc = script?.src || "";
  var baseUrl = scriptSrc
    ? scriptSrc.substring(0, scriptSrc.lastIndexOf("/"))
    : "";

  // ==========================
  // Config
  // ==========================
  var theme = script?.getAttribute("data-theme") || "#6366f1";
  var position = script?.getAttribute("data-position") || "right";
  var width = script?.getAttribute("data-width") || "370";
  var height = script?.getAttribute("data-height") || "570";
  var borderRadius = script?.getAttribute("data-border-radius") || "16";
  var title = script?.getAttribute("data-title") || "Chat";
  var welcome = script?.getAttribute("data-welcome") || "";
  var logo = script?.getAttribute("data-logo") || "";
  var avatar = script?.getAttribute("data-avatar") || "";
  var zIndex = script?.getAttribute("data-z-index") || "999999";

  var side = position === "left" ? { left: "24px" } : { right: "24px" };

  // ==========================
  // Icons
  // ==========================
  var chatSVG =
    '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 70 56" width="30" height="30">' +
    '<path fill="white" d="m27.377 44.368 11.027 11.53 8.597-13.663 22.813-2.48L66.132.284.214 7.447 3.895 46.92l23.482-2.552Z"/>' +
    "</svg>";

  var closeSVG =
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" width="30" height="30">' +
    '<path d="M18 6L6 18M6 6l12 12" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>' +
    "</svg>";

  // ==========================
  // Floating Button
  // ==========================
  var btn = document.createElement("button");

  btn.innerHTML = chatSVG;

  Object.assign(btn.style, {
    position: "fixed",
    bottom: "24px",
    zIndex: zIndex,
    width: "56px",
    height: "56px",
    padding: "0",
    borderRadius: "50%",
    background: theme,
    border: "none",
    boxShadow: "0 4px 20px rgba(0,0,0,.15)",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all .2s ease",
    ...side,
  });

  document.body.appendChild(btn);

  // ==========================
  // Build iframe URL
  // ==========================
  var params = new URLSearchParams({
    workflow_id: workflowId,
    theme: theme,
    title: title,
    welcome: welcome,
    logo: logo,
    avatar: avatar,
  });

  // ==========================
  // Iframe
  // ==========================
  var iframe = document.createElement("iframe");

  iframe.src = baseUrl + "/index.html?" + params.toString();

  Object.assign(iframe.style, {
    visibility: "hidden",
    pointerEvents: "none",
    position: "fixed",
    bottom: "90px",
    width: width + "px",
    height: height + "px",
    borderRadius: borderRadius + "px",
    border: "none",
    background: "#fff",
    boxShadow: "0 12px 40px rgba(0,0,0,.18)",
    opacity: "0",
    transition: "opacity .2s ease",
    zIndex: String(Number(zIndex) - 1),
    ...side,
  });

  iframe.onload = function () {
    iframe.style.opacity = "1";
  };

  document.body.appendChild(iframe);

  // ==========================
  // Toggle
  // ==========================
  btn.onclick = function () {
    var open = iframe.style.visibility === "visible";

    if (open) {
      iframe.style.visibility = "hidden";
      iframe.style.pointerEvents = "none";
      btn.innerHTML = chatSVG;
    } else {
      iframe.style.visibility = "visible";
      iframe.style.pointerEvents = "auto";
      btn.innerHTML = closeSVG;
    }
  };
})();
