(function() {
  var Hotline = {
    element: document.getElementById("hotline"),
    update: function() {
      var xhr = new XMLHttpRequest();
      xhr.open("GET", "https://roxburylatin.myschoolapp.com/api/announcement/forsection/3277652/?format=json&editMode=false&active=true&future=false&expired=false&contextLabelId=12");
      xhr.addEventListener("load", function() {
        Hotline.loadJSON(this.responseText);
        Hotline.updateDOM();
      });
      xhr.addEventListener("error", function() {});
      xhr.send();
    },
    loadJSON: function(json) {
      this.data = JSON.parse(json);
      this.updateDom();
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
      if (!info.Name && !info.Description) {
        return;
      }
      var announcement = document.createElement("div");
      announcement.className = "announcement";
      var child;
      if (info.Name) {
        child = document.createElement("h6");
        child.className = "title";
        child.textContent = info.Name;
        announcement.appendChild(child);
      }
      if (info.Description) {
        child = document.createElement("p");
        child.className = "content";
        child.textContent = info.Description;
        announcement.appendChild(child);
      }
      if (info.Author) {
        child = document.createElement("p");
        child.className = "author";
        child.textContent = info.Author;
        announcement.appendChild(child);
      }
      return announcement;
    }
  };
  Hotline.loadJSON(JSON.parse(document.getElementById("data").textContent));
 // Hotline.update();
 // setInterval(Hotline.update.bind(Hotline), 10 * 60 * 1000); // update every 15 minutes
 
})();
