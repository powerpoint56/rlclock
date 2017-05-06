"use strict";

if (!Date.now) {
  Date.now = function() {
    return new Date().getTime();
  };
}

(function(document, window) {
  var ready = 2;
  var now = new Date();
  var startWeekday = now.getDay();
  var weekday;
  var currentMinutes;
  var pageTitle = "RL Schedule";
  
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
    },
    
    error: function() {
      ready++;
      dom.id("periods-list").textContent = "Sorry, there has been an error. Please try reloading soon.";
      dom.id("periods-list").style.display = "block";
    },
    
    noSchool: function() {
      var title;
      if (startWeekday === 6 || startWeekday === 0) { // Saturday or Sunday is weekend
        title = "Weekend";
      } else {
        title = "No School";
      }
      dom.id("current-title").textContent = title;
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
        
        var block = document.createElement("div");
        block.className = "list-item";
        
        var letter = document.createElement("span");
        letter.className = "list-item-letter";
        letter.textContent = this.periodName(current);
        block.appendChild(letter);
        
        var time = document.createElement("span");
        time.className = "list-item-time";
        time.textContent = this.formatMinutesAsTime(current.startMinutes) + "-" + this.formatMinutesAsTime(current.endMinutes);
        block.appendChild(time);
        
        fragment.appendChild(block);
      }
      this.periodsListBlocks = fragment;
      dom.id("periods-list-heading").textContent = this.dayName;
      dom.id("periods-list-blocks").appendChild(this.periodsListBlocks);
      dom.id("periods-list").style.display = "block";
      dom.id("about").style.display = "block";
      
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
      this.minutesLeft = (this.periods[this.currentPeriod].endMinutes - currentMinutes);
      this.periodsChildren[this.currentPeriod].classList.add("period-highlight");
    },
    
    update: function(isFirstTime) {
      var timeTemp;
      var title, description;
      var done;
      
      now.setTime(Date.now());
      weekday = now.getDay();
      
      if (weekday !== startWeekday) {
        window.location.reload();
      }
      
      if (isFirstTime) {
        currentMinutes = this.fullMinutes(now.getHours(), now.getMinutes());
      } else {
        currentMinutes++;
      }
      
      if (currentMinutes >= this.end) {
        document.title = pageTitle;
        title = "After school";
        if (weekday !== 5) { // predict the next school day if it isn't Friday
          description = "Tomorrow starts with " + this.tomorrowDayType() + " block.";
        } else {
          description = "The next school day starts with " + this.tomorrowDayType() + " block.";
        }
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
        if (this.minutesLeft === -4 || this.minutesLeft === undefined) {
          this.updatePeriod(isFirstTime);
          title = this.getRelativePeriod(0);
        } else {
          this.minutesLeft--;
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
      var blocks = "HGFEDCBA";
      var position = blocks.indexOf(this.dayLetter) + 1 + this.isDrop();
      return blocks[position % 8];
    },
    
    fullMinutes: function(arg1, arg2) { // hours:minutes into minutes since midnight
      if (typeof arg1 === "string") {
        var arr = arg1.split(":");
        return 60 * arr[0] + 1 * arr[1];
      }
      if (typeof arg1 === "number") {
        return 60 * arg1 + 1 * arg2;
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
    window.location.hostname === "rlclock.tk" ? "//casper.roxburylatin.org/todays_schedule.json" : "todays_schedule.json",
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
  });
  
  var Settings = {
    data: {
      notifications: false
    },
    load: function() {
      this.data = JSON.parse(window.localStorage.getItem("settings")) || this.data;
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
