"use strict";

if (!Date.now) {
  Date.now = function() {
    return new Date().getTime();
  };
}

if (screen.width > 640) {
  document.documentElement.classList.add("hoverable");
}

addEventListener("ontouchstart", function detectTouch() {
  document.documentElement.classList.remove("hoverable");
  removeEventListener("ontouchstart", detectTouch);
});

(function(document, window) {
  var ready = 2;
  var now = new Date();
  var startWeekday = now.getDay();
  var weekday;
  var currentMinutes = 0, oldMinutes;
  var pageTitle = "rlclock";
  
  function arrayLastElement(arr) {
    return arr[arr.length - 1];
  }
  
  var dom = {
    id: function(name) {
      return this.elements[name] || (this.elements[name] = document.getElementById(name));
    },
    elements: {}
  };
  
  var Day = {
    loadSchedule: function(schedule) {
      this.isSchool = !!schedule.periods;
      if (!this.isSchool) { // no school
        return this.noSchool();
      }
      this.setupDay(schedule);
      this.prepareScheduleDOM();
      this.checkReady();
    },
    
    setupDay: function(schedule) {
      this.periods = schedule.periods;
      this.hallLength = schedule.hallLength;
      if (this.periods[1].name === "Hall") { // in case hallLength isn't given, calculate from Hall period. REMOVE if API always provides hallLength on a hall day
        this.hallLength = this.fullMinutes(this.periods[1].end) - this.fullMinutes(this.periods[1].start);
      }
      this.firstPeriod = 1;
      if (this.hallLength && this.periods[1].name === "Hall") {
        this.firstPeriod++;
      }
      this.dayLetter = this.periods[this.firstPeriod].block;
      this.dayName = this.dayLetter;
      if (this.hallLength) {
        this.dayName += "-" + this.hallLength;
      }
      this.lunchPeriod = schedule.lunchPeriod || (this.hallLength >= 45 ? 3 : 4);
      if (startWeekday === 5) { // on fridays, save the next school day (in case user checks on weekend)
        window.localStorage.setItem("next-day", this.tomorrowDayType());
        window.localStorage.setItem("next-day-rec", now.getDate());
      }
    },
    
    error: function() {
      ready++;
      dom.id("periods-list").textContent = "Sorry, there has been an error. Please try reloading soon.";
      dom.id("periods-list").classList.remove("hide");
    },
    
    noSchool: function() {
      var title;
      if (startWeekday === 6 || startWeekday === 0) { // Saturday or Sunday is weekend
        title = "Weekend";
      } else {
        title = "No School";
      }
      dom.id("current-title").textContent = title;
      
      dom.id("current-description").textContent = this.displayTomorrowDayType();
    },
    
    prepareScheduleDOM: function() {
      var fragment = document.createDocumentFragment();
      var len = this.periods.length;
      var lunch = 0;
      for (var i = 0; i < len; i++) {
        var current = this.periods[i];
        current.startMinutes = this.fullMinutes(current.start);
        current.endMinutes = this.fullMinutes(current.end);
        
        if (current.period === this.lunchPeriod && current.name !== "Hall") {
          current.lunch = lunch++;
        }
        
        fragment.appendChild(this.createBlock(this.periodName(current), this.formatMinutesAsTime(current.startMinutes) + "-" + this.formatMinutesAsTime(current.endMinutes)));
      }
      this.updatePeriodsList(fragment, this.dayName);
    },
    
    createBlock: function(letterValue, timeValue) {
      var block = document.createElement("div");
      block.className = "list-item";
      
      var letter = document.createElement("span");
      letter.className = "list-item-letter";
      letter.textContent = letterValue;
      block.appendChild(letter);
      
      var time = document.createElement("span");
      time.className = "list-item-time";
      time.textContent = timeValue;
      block.appendChild(time);
      
      return block;
    },
    
    updatePeriodsList: function(fragment, title) {
      this.periodsListBlocks = fragment;
      dom.id("periods-list-heading").textContent = title;
      dom.id("periods-list-blocks").appendChild(this.periodsListBlocks);
      dom.id("periods-list").classList.remove("hide");
      
      this.periodsChildren = dom.id("periods-list-blocks").childNodes;
    },
    
    checkReady: function() {
      if (--ready) return;
      
      this.start = this.periods[0].startMinutes;
      this.end = arrayLastElement(this.periods).endMinutes; // end of last period
      
      this.update(true);
    },
    
    periodName: function(p) {
      if (p.period === this.lunchPeriod && p.name !== "Hall") {
        return p.block + " - " + this.lunches[p.lunch];
      }
      return p.block || p.name;
    },
    
    isDrop: function() {
      return arrayLastElement(this.periods).period === 6;
    },
    
    getRelativePeriod: function(n) {
      return this.periodName(this.periods[this.currentPeriod + n]);
    },
    
    updatePeriod: function() {
      if (this.currentPeriod === undefined) {
        for (var i = 0; i < this.periods.length; i++) {
          var period = this.periods[i];
          if (currentMinutes >= period.startMinutes && currentMinutes < period.endMinutes + 5) {
            this.currentPeriod = i;
            break;
          }
        }
      } else {
        this.periodsChildren[this.currentPeriod].classList.remove("period-highlight");
        this.currentPeriod++;
      }
      this.periodsChildren[this.currentPeriod].classList.add("period-highlight");
    },
    
    update: function() {
      var timeTemp;
      var title, description;
      var done;
      
      now.setTime(Date.now());
      weekday = now.getDay();
      
      if (weekday !== startWeekday) {
        window.location.reload();
      }
      
      currentMinutes = this.fullMinutes(now.getHours(), now.getMinutes());
      if (currentMinutes === oldMinutes) return;
      oldMinutes = currentMinutes;
      /*
      if (isFirstTime) {
        currentMinutes = this.fullMinutes(now.getHours(), now.getMinutes());
      } else {
        currentMinutes++;
      }*/
      
      if (currentMinutes >= this.end) {
        document.title = pageTitle;
        title = "After school";
        description = this.displayTomorrowDayType();
        if (this.currentPeriod) {
          this.periodsChildren[this.currentPeriod].classList.remove("period-highlight");
        }
        done = true;
      } else if (currentMinutes < this.start) {
        title = "Before school";
        timeTemp = this.hoursMinutes(this.start - currentMinutes);
        description = this.formatNumberUnit(timeTemp.hours, "hour", " ", "")
          + this.formatNumberUnit(timeTemp.minutes, "minute", " ") + "until homeroom.";
      } else {
        if (this.minutesLeft === undefined) { // THIS IS REALLY UGLY BUT HMM...
          this.updatePeriod();
          title = this.getRelativePeriod(0);
        }
        this.minutesLeft = (this.periods[this.currentPeriod].endMinutes - currentMinutes);
        if (this.minutesLeft <= -5) { // IS THIS THE CULPRIT?
          this.updatePeriod();
          title = this.getRelativePeriod(0);
        }
        

        if (this.minutesLeft <= 0) {
          description = "Passing time: " + this.formatNumberUnit(this.minutesLeft + 5, "minute") + " until " + this.getRelativePeriod(1);
          if (this.minutesLeft === 0) {
            document.title = pageTitle;
            displayNotification(pageTitle, this.getRelativePeriod(1) + " starts in 5 minutes.");
          }
        } else {
          description = this.formatNumberUnit(this.minutesLeft, "minute") + " left";
          document.title = "(" + this.minutesLeft + ") " + pageTitle;
        }
        
        if (this.minutesLeft === 5) {
          displayNotification(pageTitle, "5 minutes left in " + this.getRelativePeriod(0));
        }
      }
      
      if (title) dom.id("current-title").textContent = title;
      if (description) dom.id("current-description").textContent = description;
      
      if (done) return;
      
      setTimeout(this.update.bind(this), 60000 - now.getSeconds() * 1000);
    },
    
    tomorrowDayType: function() {
      if (this.dayLetter) {
        var blocks = "HGFEDCBA";
        var position = blocks.indexOf(this.dayLetter) + 1 + this.isDrop();
        return blocks[position % 8];
      } else {
        if (Math.abs(now.getDate() - window.localStorage.getItem("next-day-rec")) < 5) {
          return window.localStorage.getItem("next-day");
        } else {
          return 0;
        }
      }
    },
    
    displayTomorrowDayType: function() {
      var type = this.tomorrowDayType();
      if (!type) return "";
      return (weekday > 0 && weekday < 5 ? "Tomorrow" : "The next school day") + " starts with " + type + " block."; // (during the week, tomorrow; weekend, the next school day)
    },
    
    fullMinutes: function(arg1, arg2) { // hours:minutes into minutes since midnight
      if (typeof arg1 === "number") {
        return 60 * arg1 + 1 * arg2;
      }
      if (typeof arg1 === "string") {
        var arr = arg1.split(":");
        return 60 * arr[0] + 1 * arr[1];
      }
    },
    
    hoursMinutes: function(mins) {
      return {
        hours: Math.floor(mins / 60),
        minutes: mins % 60
      };
    },
    
    formatMinutesAsTime: function(minutes) {
      var time = this.hoursMinutes(minutes);
      if (time.minutes < 10) {
        time.minutes = "0" + time.minutes;
      }
      return (time.hours % 12 || 12) + ":" + time.minutes;
    },
    
    formatNumberUnit: function(number, unit, after, afterNot) {
      if (number === 0) {
        return afterNot || "";
      }
      if (number === 1) {
        return number + " " + unit + (after || "");
      }
      return number + " " + unit + "s" + (after || "");
    },
    
    lunches: ["First Lunch", "In Between Lunches", "Second Lunch"]
  };
    
  function httpGet(url, callback, error) {
    var xhr = new XMLHttpRequest();
    xhr.open("GET", url);
    xhr.addEventListener("load", callback);
    xhr.addEventListener("error", error);
    xhr.send();
  }
  
  httpGet(
    "//casper.roxburylatin.org/todays_schedule.json",
    function() {
      Day.loadSchedule(JSON.parse(this.responseText));
    },
    Day.error
  );
  
  addEventListener("DOMContentLoaded", function handler() {
    removeEventListener("DOMContentLoaded", handler);
    
    Day.checkReady();
    
    Settings.load();
    dom.id("settings-button").addEventListener("click", Settings.toggle.bind(Settings));
    dom.id("about-toggle").addEventListener("click", function(e) {
      e.preventDefault();
      if (dom.id("about-more").textContent) {
        dom.id("about-more").classList.toggle("hide");
      } else {
        httpGet("about.txt", function() {
          dom.id("about-more").textContent = this.responseText;
        });
      }
      return false;
    });
    
    // UPDATE notification
    /*if (!window.localStorage.getItem("domain")) {
      var banner = dom.id("banner");
      banner.classList.remove("fade");
      banner.addEventListener("click", function() {
        window.localStorage.setItem("domain", 1);
        banner.classList.add("fade");
      });
    }*/
  });
  
  if (typeof document.hidden !== undefined) {
    addEventListener("visibilitychange", function() {
      if (ready === 0 && !document.hidden) {
        Day.update();
      }
    });
  } else {
    addEventListener("focus", function() {
      if (ready === 0) {
        Day.update();
      }
    });
  }
  
  var Settings = {
    data: {
      notifications: false
    },
    load: function() {
      this.data = JSON.parse(window.localStorage.getItem("settings")) || this.data;
      if (this.data.dark !== false) {
        if (this.data.dark || ((now.getHours() >= 19 || now.getHours() <= 6))) {
          dom.id("dark").checked = true;
          dom.id("settings-form").querySelector('[data-rep="dark"]').checked = true;
        }
      }
    },
    prepareDOM: function() {
      var currentSetting;
      this.allSettings = dom.id("settings").getElementsByTagName("input");
      
      for (var i = 0; i < this.allSettings.length; i++) {
        currentSetting = this.allSettings[i];
        currentSetting.checked = this.data[currentSetting.getAttribute("data-rep")];
      }
      
      dom.id("settings-submit").addEventListener("click", this.submit.bind(this));
      
      this.isDOMReady = true;
    },
    save: function() {
      var currentSetting;
      for (var i = 0; i < this.allSettings.length; i++) { // get settings from checkboxes
        currentSetting = this.allSettings[i];
        this.data[currentSetting.getAttribute("data-rep")] = currentSetting.checked;
      }
      window.localStorage.setItem("settings", JSON.stringify(this.data));
      if (this.data.notifications) {
        notificationPermission();
      }
      dom.id("dark").checked = this.data.dark;
    },
    submit: function() {
      this.save();
      this.toggle();
    },
    toggle: function() {
      if (!this.isDOMReady) {
        this.prepareDOM();
      }
      dom.id("settings").classList.toggle("appear");
    }
  };
  
  var lastNotification;
  function displayNotification(title, body) {
    if (window.Notification.permission !== "granted" || !Settings.data.notifications) {
      return;
    }
    if (lastNotification) {
      setTimeout(lastNotification.close.bind(lastNotification), 5000);
    }
    lastNotification = new window.Notification(body, {title: title});
  }
  
  function notificationPermission() {
    if (!window.Notification) {
      return alert("Notifications not supported.");
    }
    if (window.Notification.permission === "granted") {
      return;
    }
    window.Notification.requestPermission();
  }
})(document, window);
