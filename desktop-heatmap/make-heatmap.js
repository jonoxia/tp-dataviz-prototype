var rectangles = (function () {
    var rectangles = null;
    $.ajax({
        'async': false,
        'global': false,
        'url': "action_counts.json",
        'dataType': "json",
        'success': function (data) {
            rectangles = data;
        }
    });
    return rectangles;
})();

function loadCanvas() {
    var can = $("#the-canvas");
    var ctx = can[0].getContext("2d");
    var img = new Image();
    
    img.onload = function() {
		ctx.drawImage(img, 0, 0);
	    for (var j = 0; j < rectangles.length; j++) {
	            ctx.globalAlpha = 0.8;
	            ctx.fillStyle = get_gradient_color(rectangles[j].percent);
	            var coords = rectangles[j].coords;
	            ctx.fillRect(coords[1], coords[3], coords[2]-coords[1], coords[0] - coords[3]);
	    		ctx.globalAlpha = 1.0;
		        ctx.fillStyle = "black";
		        ctx.font = "8pt Helvetica";
		        var txt = rectangles[j].percent;
		        ctx.fillText(txt, (rectangles[j].coords[2] - rectangles[j].coords[1])/2 + rectangles[j].coords[1] - 10, rectangles[j].coords[3] - 5);
	    }
    }
    img.src = "ff_image.png";
}

function make_legend() {
	var rectangles_sorted = (rectangles.sort(compare_counts)).reverse()
	for (var j = 0; j < rectangles_sorted.length; j++) {		
		document.write("<tr><td><span id='value1' style= \"padding: 5px; text-align: right; margin: 0 10 0 0; display:block; background-color: "+ get_gradient_color(rectangles_sorted[j].percent) +"\">" + rectangles_sorted[j].percent + "</span></td><td><span class='label'> " + rectangles_sorted[j].elemName + "</span></td></tr>");   
	}
}

function get_gradient_color(score) {
   if(score>100 || score<0) score=100;
   score = 120 - 1.2*score
   return "hsl("+score+","+50+"%,"+50+"%)";	
}

function compare_counts(a,b) {
  if (a.count < b.count)
     return -1;
  if (a.count > b.count)
    return 1;
  return 0;
}
