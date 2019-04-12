document.addEventListener("DOMContentLoaded", function() {
  var d = new Date();
  var n = d.getHours();

  var morning = [5, 6, 7, 8, 9, 10],
    day = [11, 12, 13, 14, 15, 16],
    sunset = [17, 18, 19, 20],
    night = [21, 22, 23, 24, 0, 1, 2, 3, 4];

  if (morning.includes(n)) {
    setColor("morning");
  } else if (day.includes(n)) {
    setColor("day");
  } else if (sunset.includes(n)) {
    setColor("sunset");
  } else if (night.includes(n)) {
    setColor("night");
  } else {
    setColor("day");
  }

  function setColor(value) {
    var newValue = getComputedStyle(document.documentElement).getPropertyValue(`--${value}`);
    document.documentElement.style.setProperty("--gradient", newValue);
  }
});
