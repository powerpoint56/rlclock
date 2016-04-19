if (!Date.now) {
  Date.now = function() {
    return new Date().getTime();
  };
}

(function() {
  "use strict";
 
  var minutesLeft, today;
  var ready = 0;
  var daytype;
  var days = [];
  var dom;
  var now = new Date();
  
  function checkReady() {
    ready++;
    if (ready === 2) {
      main();
    }
  }
  
  function main() {
    dom = {
      periodsList: document.createElement("section"),
      current: document.getElementById("current"),
      currentTitle: document.getElementById("current-title"),
      currentMessage: document.getElementById("current-message")
    };
    
    daytype.isDrop = false;
    today = new Day(daytype.dayType, daytype.hallLength || 0, daytype.isDrop);
    days.push(today);
  
    dom.periodsList.id = "periods-list";
    dom.periodsList.className = "list";
    dom.periodsList.appendChild(today.domElement());
    
    if (today.noClasses) {
      dom.currentTitle.textContent = today.dayString;
      dom.currentMessage.textContent = "There is no school today.";
    } else if (today.special) {
      dom.currentTitle.textContent = "Special schedule";
      dom.currentMessage.textContent = "Please use the schedule sheet given at school.";
    } else {
      onminutechange();
    }
    
    document.body.insertBefore(dom.periodsList, dom.current.nextSibling); // insert
    document.getElementById("about").style.display = "block";
  }

  function Block(letter, start, length) {
    this.letter = letter;
    this.start = start;
    this.end = start + length;
    this.length = length;
  }
  
  Block.prototype.text = function() {
    return this.name ? this.letter + ": " + this.name : this.letter;
  };
  
  Block.prototype.domElement = function() {
    var child;
    this.element = document.createElement("div");
    this.element.className = "list-item";
    child = document.createElement("div");
    child.className = "list-item-letter";
    child.textContent = this.text();
    this.element.appendChild(child);
    child = document.createElement("div");
    child.className = "list-item-time";
    child.textContent = Block.minutesToString(this.start) + "-" + Block.minutesToString(this.end);
    this.element.appendChild(child);
    return this.element;
  };

  Block.minutesToString = function(mins) {
    var h = (Math.floor(mins / 60) % 12 || 12).toString();
    var m = (mins % 60).toString();
    return h + ":" + (m.length === 1 ? "0" + m : m);
  };

  function Day(dayLetter, hallLength, isDrop) {
    this.dayLetter = dayLetter;
    this.hallLength = hallLength;
    this.dayString = this.dayLetter;
    
    if (this.hallLength) {
      this.dayString += "-" + this.hallLength;
    }
    if (!this.dayString || this.dayString === " " || this.dayString === "No Classes" || this.dayString === "Weekend") { // no school, no need to do anything else
      this.noClasses = true;
      return this;
    }

    this.periodDuration = 45;
    if (this.hallLength > 30) {
      if (this.hallLength === 45) {
        this.periodDuration = 44;
      } else if (this.hallLength === 60) {
        this.periodDuration = 42;
      } else if (this.hallLength === 70) {
        this.periodDuration = 40;
      } else if (this.hallLength > 70) {
        this.periodDuration = 35;
      }
    }
    this.isDrop = isDrop;
    this.periodsLength = 7 - this.isDrop;
    this.lunchPeriod = this.hallLength >= 45 ? 2 : 3;
    this.currentBlock = 0;

    this.blocks = [];
    var lastBlock;
    this.blocks.push(new Block("Homeroom", Day.HOMEROOM_START, 5));
    if (this.hallLength) {
      this.blocks.push(new Block(this.hallLength + " minute hall", Day.HOMEROOM_START + 10, this.hallLength));
    }
    var letterIndex = Day.BLOCK_LETTERS.indexOf(this.dayLetter), letter;
    for (var i = 0; i < this.periodsLength; i++) {
      letter = Day.BLOCK_LETTERS[letterIndex];
      lastBlock = this.blocks[this.blocks.length - 1];
      if (i === this.lunchPeriod) {
        this.blocks.push(new Block(letter + " - First Lunch", lastBlock.end + 5, 25));
        this.blocks.push(new Block(letter + " - Passing Period",  lastBlock.end + 30, 20)); // the passing period
        this.blocks.push(new Block(letter + " - Second Lunch",  lastBlock.end + 50, 25));
      } else {
        this.blocks.push(new Block(letter, lastBlock.end + 5, this.periodDuration));
      }
      letterIndex = (letterIndex + 1) % 8;
    }
  }
  
  Day.BEFORE_SCHOOL = -1;
  Day.AFTER_SCHOOL = 8;
  Day.HOMEROOM = -2;
  Day.HOMEROOM_START = 495;
  Day.BLOCK_LETTERS = "ABCDEFGH";

  Day.prototype.domElement = function() {
    var element = document.createElement("div"), child;
    element.className = "list-section";
    child = document.createElement("h3");
    if (this.noClasses) {
      child.textContent = this.dayString;
      element.appendChild(child);
      return element;
    }
    child.textContent = this.dayString;
    element.appendChild(child);
    if (this.special) {
      return element;
    }
    for (var i = 0; i < this.blocks.length; i++) {
      element.appendChild(this.blocks[i].domElement());
    }
    this.element = element;
    return this.element;
  };
  
  Day.prototype.update = function(n) {
    var fullMinutes = n.getMinutes() + n.getHours() * 60;
    if (fullMinutes < today.blocks[0].start) { // before homeroom
      this.currentBlock = Day.BEFORE_SCHOOL;
      if (this.oldBlock !== this.currentBlock) {
        this.title = "Before homeroom";
        this.message = "Good morning!";
        this.oldBlock = this.currentBlock;
      }
    } else if (fullMinutes >= today.blocks[today.blocks.length - 1].end) { // after last block
      this.currentBlock = Day.AFTER_SCHOOL;
      if (this.oldBlock !== this.currentBlock) {
        if (today.blocks[this.oldBlock]) {
          today.blocks[this.oldBlock].element.style.backgroundColor = "";
        }
        this.title = "After school";
        this.message = "Good night!";
        this.oldBlock = this.currentBlock;
      }
    } else { // during school
      while (this.currentBlock < today.blocks.length && today.blocks[this.currentBlock].end + 5 <= fullMinutes) {
        this.currentBlock++;
      }
      if (this.currentBlock !== this.oldBlock) {
        if (today.blocks[this.oldBlock]) {
          today.blocks[this.oldBlock].element.style.backgroundColor = "";
        }
        today.blocks[this.currentBlock].element.style.backgroundColor = "#a3ba82";
        this.title = today.blocks[this.currentBlock].text();
        this.oldBlock = this.currentBlock;
      }
      minutesLeft = today.blocks[this.currentBlock].end - fullMinutes; // minutes remaining until end of block
      if (minutesLeft < 1) {
        this.message = "Passing time: " + (minutesLeft + 5) + " minute" + (minutesLeft + 5 === 1 ? "" : "s") + " until " + today.blocks[this.currentBlock + 1].text() + " begins";
      } else {
        this.message = minutesLeft + " minute" + (minutesLeft === 1 ? "" : "s") + " left in this block";
      }
    }
  };
  
  function onminutechange() {
    now.setTime(Date.now());
    today.update(now);
    
    dom.currentTitle.textContent = today.title;
    dom.currentMessage.textContent = today.message;
    
    setTimeout(onminutechange, 60000 - (now.getSeconds() * 1000));
  }
  
  httpGet("//casper.roxburylatin.org/daytype.json", function() {
    daytype = JSON.parse(this.responseText);
    checkReady();
  });
  
  window.addEventListener("DOMContentLoaded", function() {
    checkReady();
  });
  
  function httpGet(url, callback) {
    var xhr = new XMLHttpRequest();
    xhr.open("GET", url);
    xhr.addEventListener("load", callback);
    xhr.send();
  }
})();
