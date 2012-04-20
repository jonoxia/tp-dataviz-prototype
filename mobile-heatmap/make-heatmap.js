  var data = [
    {elemName: "Addons", value: 1.5},
    {elemName: "Back", value:     1.7},
    {elemName: "Bookmark Star", value:     0.8},
    {elemName: "Bookmarks", value:     3.5},
    {elemName: "Close tab", value:     23.5},
    {elemName: "Console", value:     0.5},
    {elemName: "Desktop tabs", value:     0.7},
    {elemName: "Downloads", value:     1.5},
    {elemName: "Edit URL bar", value:     5.1},
    {elemName: "Forward", value:     0.5},
    {elemName: "Hide Left bar", value:     27.4},
    {elemName: "Hide Right bar", value:     10.6},
    {elemName: "History", value:     1.2},
    {elemName: "New Tab", value:     1.8},
    {elemName: "Open Panel", value:     1.3},
    {elemName: "Preferences", value:     0.9},
    {elemName: "Reload", value:     4.9},
    {elemName: "Search", value:     1.7},
    {elemName: "Show Left bar", value:     26.7},
    {elemName: "Show Right bar", value:    10.6},
    {elemName: "Site ID", value:     1.8},
    {elemName: "Stop", value:     2.5},
    {elemName: "Switch tab", value:     55.8},
    {elemName: "URL bar", value:     15.7},
    {elemName: "Undo close tab", value:     0.5}
];

  var rectangles = [
    {elemName: "Switch tab", coords: [9, 165, 72, 49]},
    {elemName: "Hide Left bar", coords: [84, 160, 62, 416]},
    {elemName: "Show Left bar", coords: [84, 160, 62, 416]},
    {elemName: "Close tab", coords: [3, 232, 27, 24]},   // close tab
    {elemName: "URL bar", coords: [131, 119, 201, 41]}, // url bar
    {elemName: "Show Right bar", coords: [332, 165, 46, 413]}, // show right bar
    {elemName: "Hide Right bar", coords: [332, 165, 46, 413]},  // hide right bar
    {elemName: "Edit URL bar", coords: [91, 11, 194, 42]},  // edit url bar
    {elemName: "Reload", coords: [332, 119, 39, 40]}, // reload
    {elemName: "Open Panel", coords: [381, 540, 48, 40]}, // open panel
    {elemName: "Console", coords: [613, 115, 56, 43]}, // console
    {elemName: "Bookmarks", coords: [167, 53, 69, 48]}, // bookmarks
    {elemName: "Addons", coords: [557, 115, 55, 43]},  // addons
    {elemName: "Stop", coords: [377, 120, 40, 37]}, // stop
    {elemName: "New Tab", coords: [6, 540, 73, 38]}, // new tab
    {elemName: "Downloads", coords: [498, 117, 58, 39]}, // downloads
    {elemName: "Search", coords: [286, 10, 38, 40]},  // search
    {elemName: "Back", coords: [379, 205, 50, 37]},  // back
    {elemName: "Site ID", coords: [90, 120, 41, 39]}, // site id
    {elemName: "Preferences", coords: [443, 115, 55, 44]},  // preferences
    {elemName: "History", coords: [243, 55, 63, 46]},  // history
    {elemName: "Bookmark Star", coords: [378, 161, 50, 42]},  // bookmark star
    {elemName: "Desktop tabs", coords: [310, 54, 63, 47]},  // desktop tabs
    {elemName: "Undo close tab", coords: [10, 481, 72, 49]},  // undo close tab
    {elemName: "Forward", coords: [379, 248, 50, 40]} // forward
];

function loadCanvas() {
    var can = $("#the-canvas");
    var ctx = can[0].getContext("2d");
    var img = new Image();
    img.onload = function() {
      ctx.drawImage(img, 0, 0);

      // for each table row, draw a rectangle with matching color onto the image
      // put the data inside it
      var tableRows = document.getElementsByTagName("tr");

      for (var i = 0; i < tableRows.length; i++) {
        var row = tableRows[i];
        var spans = row.getElementsByTagName("span");

        var datum = parseFloat(spans[0].innerHTML);
        var color = $(spans[0]).css("background-color");
        var elemName = spans[1].innerHTML;

        if (elemName == "Hide Right bar" || elemName == "Hide Left bar") {
          continue;
        }

        for (var j = 0; j < rectangles.length; j++) {
          if (rectangles[j].elemName == elemName) {
            ctx.globalAlpha = 0.8;
            ctx.fillStyle = color;
            var coords = rectangles[j].coords;
            ctx.fillRect(coords[0], coords[1], coords[2], coords[3]);
            ctx.globalAlpha = 1.0;
            ctx.fillStyle = "white";
            ctx.font = "14pt Helvetica";
            ctx.fillText(datum, coords[0] + 10, coords[1] + 20);
            break;
          }
        }
      }
    };
    img.src = "fennec-ui-bw.png";

    var x = 0;
    var y = 0;
    can.bind("mousedown", function(evt) {
        x = evt.clientX - can.offset().left;
        y = evt.clientY - can.offset().top;
     });
     can.bind("mouseup", function(evt) {
        var endX = evt.clientX - can.offset().left;
        var endY = evt.clientY - can.offset().top;

       $("#debug").append(x + ", " + y + ",  " + (endX - x) + ", " + (endY - y) + "<br/>");
     });
}
