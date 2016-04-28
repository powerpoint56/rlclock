(function() {
  var Hotline = {
    element: document.getElementById("hotline"),
    update: function() {
      var xhr = new XMLHttpRequest();
      xhr.open("GET", "http://198.199.74.94/today"); //http://104.131.78.235:25555/today
      xhr.addEventListener("load", function() {
        Hotline.loadJSON(this.responseText);
        Hotline.updateDOM();
      });
      xhr.addEventListener("error", function() {});
      xhr.send();
    },
    loadJSON: function(json) {
      this.data = JSON.parse(json).data;
    },
    updateDOM: function() {
      var fragment = document.createDocumentFragment();
      for (var i = 0; i < this.data.length; i++) {
        var announcement = this.announcementDOM(this.data[i]);
        if (announcement) {
          fragment.appendChild(announcement);
        }
      }
      while (this.element.firstChild) {
        this.element.removeChild(this.element.firstChild);
      }
      this.element.appendChild(fragment);
    },
    announcementDOM: function(info) {
      if (!info.title && !info.content) {
        return;
      }
      var announcement = document.createElement("div");
      announcement.className = "announcement";
      var child;
      if (info.title) {
        child = document.createElement("h6");
        child.className = "title";
        child.textContent = info.title;
        announcement.appendChild(child);
      }
      if (info.content) {
        child = document.createElement("p");
        child.className = "content";
        child.textContent = info.content;
        announcement.appendChild(child);
      }
      if (info.author) {
        child = document.createElement("p");
        child.className = "author";
        child.textContent = info.author;
        announcement.appendChild(child);
      }
      return announcement;
    }
  };
  
  Hotline.update();
})();
