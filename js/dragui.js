
function updateFragment(params) {
  var baseLoc = ("" + window.location).split("#")[0];
  var args = [];
  for (var key in params) {
    args.push( key + "=" + params[key]);
  }
  window.location = baseLoc + "#" + args.join("&");
}

/*
 *   go to ggplot2 page

// Types:
// If it's continuous it can only be used as an x or a y
//   all others need factors
//   R: factor, ordered factor, or numerics
//   treat "factor with small # of values" different from "factor with large # of values"

//  for lattice, x and y have to be the same axes for all, so find max over all and use that
//  to determine axes for all
 */

// ui item, number of extensions
function scatterplot(userData, xVar, yVar, options) {
  // If x and y variables are both user/per user, dots in scatterplot are users.
  // If at least one axis is event-level, though, dots have to be events.

  // (Unless... if one axis is a continuous event-level variable, we could pick the average
  // (or min or max) per user and use that value to plot a user-dot. How to represent that
  // option?)
  // (I guess a dropdown would appear: Dots represent
  //     --> events (all users lumped together)
  //     --> users (average value per user)

  // TODO the width/height/create container/create chart stuff is duplicated in barplot...
  // choose timestamp vs. num extensions (yeah i know that's silly) to test this out.

  var margin = 40;

  var chartWidth = parseInt(d3.select("#imagearea").style("width").replace("px", "")) - 2 * margin;
  var chartHeight = 600 - 2 * margin; // or somethin?

  var chart = d3.select("#imagearea").append("svg:svg")
    .attr("width", chartWidth + 2 * margin)
    .attr("height", chartHeight + 2 * margin)
    .attr("class", "chart")
    .append("svg:g").attr("transform", "translate(" + margin +  ", " + margin + ")");


  var dataPoints = [];

  function getXVarVal(record) {
    var newX = record[ xVar.id ];
    if (xVar.datatype != "factor") {
      newX = parseFloat(newX);
    }
    return newX;
  }

  function getYVarVal(record) {
    var newY = record[ yVar.id ];
    if (yVar.datatype != "factor") {
      newY = parseFloat(newY);
    }
    return newY;
  }

  // This is close to, but not exactly the same as, traverseData
  // because each point will have an x and a y...
  for (var i = 0; i < userData.length; i++) {
    var newX, newY, numEvents, newColor = null;
    if (!options.xIsPerEvent) {
      newX = getXVarVal(userData[i]);
    }
    if (!options.yIsPerEvent) {
      newY = getYVarVal(userData[i]);
    }
    // Assume color is always factor-type and per-user.
    // TODO: color could be an event property sometimes?
    if (options.colorVar) {
      newColor = userData[i][ options.colorVar.id ];
    }
    if (options.dotType == "user") {
      dataPoints.push( {x: newX, y: newY, c: newColor} );
    }
    else {
      numEvents = userData[i].events.length;
      if (numEvents < 200) {
        // Guard against mega-users because otherwise this triggers "unresponsive script"
        for (var j = 0; j < numEvents; j++) {
          if (options.xIsPerEvent) {
            newX = getXVarVal(userData[i].events[j]);
          }
          if (options.yIsPerEvent) {
            newY = getYVarVal(userData[i].events[j]);
          }
          dataPoints.push({x: newX, y: newY, c: newColor});
        }
      }
    }
  }

  var xScale, yScale;

  var colorMap = {};
  if (options.colorVar) {
    // note a lot of duplicated code - write a "getuniquevaluelist" function
    var lastColorUsed = 0;
    for (i = 0; i < dataPoints.length; i++) {
      var colorVal = dataPoints[i].c;
      if (! colorMap[ colorVal ]) {
        lastColorUsed++;
        colorMap[ colorVal ] = "dataset-" + lastColorUsed; // corresponds to css class name
      }
    }
  }

  if (xVar.datatype == "factor") {
    // Create ordinal scale
    var discreteXVals = {};
    var xVals = [];
    for (i = 0; i < dataPoints.length; i++) {
      discreteXVals[ dataPoints[i].x ] = 1;
    }
    for (var name in discreteXVals) {
      xVals.push(name);
    }
    xScale = d3.scale.ordinal()
      .domain(xVals)
      .rangeBands([0, chartWidth]);
  } else {
    // Create numerical scale:
   xScale = d3.scale.linear()
      .domain([d3.min(dataPoints, function(pt) {return pt.x;}),
               d3.max(dataPoints, function(pt) { return pt.x;})])
      .range([0, chartWidth]);
  }

  if (yVar.datatype == "factor") {
    // Create ordinal y scale
    var discreteYVals = {};
    var yVals = [];
    for (i = 0; i < dataPoints.length; i++) {
      discreteYVals[ dataPoints[i].y ] = 1;
    }
    for (var name in discreteYVals) {
      yVals.push(name);
    }
    yScale = d3.scale.ordinal()
      .domain(yVals)
      .rangeBands([0, chartHeight]);
  } else {
    // Create numerical y scale
    yScale = d3.scale.linear()
      .domain([d3.min(dataPoints, function(pt) {return pt.y;}),
               d3.max(dataPoints, function(pt) { return pt.y;})])
      .range([chartHeight, 0]);
  }

  var yAxis = d3.svg.axis()
    .scale(yScale)
    .ticks(4)
    .tickSize(6, 3, 0)
    .orient("right"); // makes it vertical

  var xAxis = d3.svg.axis()
    .scale(xScale)
    .ticks(4)
    .tickSize(6, 3, 0);

  // Add the x-axis:
  chart.append("svg:g")
      .attr("class", "x axis")
      .attr("transform", "translate(0, " + chartHeight + ")")
      .call(xAxis);

  // Add the y-axis.
  chart.append("svg:g")
      .attr("class", "y axis")
      .attr("transform", "translate(" + chartWidth + ",0)")
      .call(yAxis);

  var xMapper, yMapper;
  if (xVar.datatype == "factor") {
    // add some jitter
    xMapper = function(d) {
      return xScale(d.x) + xScale.rangeBand() * ( 0.4 + Math.random() * 0.2);
    };
  } else {
    xMapper = function(d) { return xScale(d.x); };
  }
  if (yVar.datatype == "factor") {
    yMapper = function(d) {
      return yScale(d.y) + yScale.rangeBand() * ( 0.4 + Math.random() * 0.2);
    };
  } else {
    yMapper = function(d) { return yScale(d.y); };
  }

  var colorMapper = function(d) {
    if (options.colorVar) {
      return colorMap[ d.c ];
    }
    return "dataset-1";
  };

  chart.selectAll("circle")
    .data(dataPoints)
    .enter().append("svg:circle")
    .attr("class", colorMapper)
    .attr("r", 2)
    .attr("cx", xMapper)
    .attr("cy", yMapper);
}

function traverseData(userData, options, callback) {
  for (var i = 0; i < userData.length; i++) {
    var val;
    if (!options.varPerEvent) {   // expect factorId to match a field on the user
      val = userData[i][ options.varId ];
    }
    if (options.count == "users") { // count users with each value of the factor
      callback(val);
    } else if (options.count == "events") { // count events
      for (var j = 0; j < userData[i].events.length; j++) {
        if (options.varPerEvent) {
          val = userData[i].events[j][ options.varId ]; // expect factorId to match field on event
        }
        callback(val);
      }
    }
  }

}

function countFactors(userData, options) {
  var factorValueCounts = {};  // will be key = factor name, value = count
  function addCount(val) { // helper function for counts dictionary
    if (factorValueCounts[val]) {
      factorValueCounts[val] += 1;
    } else {
      factorValueCounts[val] = 1;
    }
  }

  // factorPerEvent, factorId, count "users" or "events"
  traverseData(userData, options, addCount);

  var counts = [];
  var labels = [];
  for (var val in factorValueCounts) {
    labels.push(val);
    counts.push(factorValueCounts[val]);
  }
  return {counts: counts, labels: labels};
}

function histogramify(userData, options) {
  var labels = [];
  var bucketCounts = [];
  var min = null, max = null;
  var numBuckets = 15; // TODO make this customizable

  function compareMinMax(value) {
    if (min == null) {
      min = parseFloat(value);
    } else if (value < min) {
      min = parseFloat(value);
    }
    if (max == null) {
      max = parseFloat(value);
    } else if (value > max) {
      max = parseFloat(value);
    }
  }

  // find min and max values:
  traverseData(userData, options, compareMinMax);

  // calcuate bucket breakpoints
  // TODO it's weird to have fractional breakpoints if variable is an integer!!
  var breakpoints = [];
  var bucketWidth = (max - min)/numBuckets;
  for (var j = 0; j < numBuckets; j++) {
    breakpoints.push( min +  j * bucketWidth);
    // control number of sig figs when float is written out
    var name = (min + j * bucketWidth).toFixed(1) + " - " + (min + (j+1) * bucketWidth).toFixed(1);
    console.log(name);
    labels.push(name);
    bucketCounts.push(0);
  }
  breakpoints.push(max);

  // go through a second time, create bucket counts
  traverseData(userData, options, function(val) {
    for (var j = 0; j < numBuckets; j++) {
      if (val < (min + (j+1) * bucketWidth) ) {
        bucketCounts[j] ++;
        return;
      }
    }
  });

  return {counts: bucketCounts, labels: labels};
}

function barplot(data, options) {
  // Test using case where xaxis is "user" and yaxis is "per user, factor"
  // There will be others

  var dataForD3 = data.counts;
  var labelsForD3 = data.labels;
  // TODO sort dataForD3 into an order that we like - make sort-order a drop-down or something
  // most -> least, least -> most, or alphabetical by factor?

  var containerWidth = parseInt(d3.select("#imagearea").style("width").replace("px", ""));
  var containerHeight = 600; // or somethin?
  var leftMargin = 50;
  var bottomMargin = 50; // or something?
  var chartWidth = containerWidth - leftMargin;
  var chartHeight = containerHeight - bottomMargin;
  var horizBars = (options.bars == "horizontal");

  var container = d3.select("#imagearea").append("svg:svg")
    .attr("width", containerWidth)
    .attr("height", containerHeight);

  // Flip the y-axis so 0,0 is at the bottom left and increasing y goes up
  var chart = container.append("svg:g")
    .attr("class", "chart")
    .attr("transform", "translate(" + leftMargin + "," + (chartHeight) + ")scale(1,-1)");

  // TODO should be able to choose linear or logarithmic scale
  var barLength = d3.scale.linear()
    .domain([0, d3.max(dataForD3)])
    .range([0, (horizBars? chartWidth : chartHeight)]);

  var barWidth = (horizBars? chartHeight : chartWidth) / dataForD3.length;
  // could use d3.scale.ordinal() for this but it's trivial to calculate it

  chart.selectAll("rect")
    .data(dataForD3)
  .enter().append("svg:rect")
    .attr((horizBars? "y": "x"), function(d, i) { return i * barWidth; })
    .attr((horizBars? "width": "height"), barLength)
    .attr((horizBars? "height": "width"), barWidth);

  // Text goes outside the chart so as not to be upside-down
  var texties = container.selectAll("text")
   .data(dataForD3)
 .enter().append("svg:text")
   .attr("dx", -3) // padding-right
   .attr("dy", ".35em") // vertical-align: middle
   .attr("text-anchor", "end") // text-align: right
   .text(function(d, i) {return labelsForD3[i];});

  if (horizBars) {
    texties.attr("x", leftMargin)
      .attr("y", function(d, i) {return chartHeight - (i * barWidth + barWidth/2);});
  } else {
    // ROTATE
    texties.attr("x", function(d, i) {return i * barWidth + barWidth/2 + leftMargin;})
      .attr("y", chartHeight)
      .attr("transform", function(d, i) {
              return "rotate( -45 " + (i * barWidth + barWidth/2 + leftMargin) + "," + chartHeight + ")";
            });
  }

}

function initDragGui(variables, userData){

  function getVarById(varId) {
    for(var x = 0; x < variables.length; x++) {
      if (variables[x].id == varId) {
        return variables[x];
      }
    }
    return null;
  }

  function drawNewGraph(params) {
    var xVar = getVarById(params["x-axis"]);
    var yVar = getVarById(params["y-axis"]);

    // TODO: Lattice-wrap not yet implemented.
    var colorVar = null;
    if (params["color"]) {
      colorVar = getVarById(params["color"]);
    }

    switch( xVar.semantics ) {
    case "user":
      switch (yVar.semantics) {
        case "user":
          return;
          // invalid
        break;
      case "per_user":
        if (yVar.datatype == "factor") {
          $("#output").html("horizontal bar chart, num users in each per-user factor");
          var counts = countFactors(userData, {varId: yVar.id, count: "users"});
          barplot(counts, {bars: "horizontal"});
        } else {
          $("#output").html("horizontal histogram using arbitrary buckets for continuous variable on y");
          var hist = histogramify(userData, {varId: yVar.id, count: "users"});
          barplot(hist, {bars: "horizontal"});
        }
        break;
      case "event":
        $("#output").html("horizontal-bar histogram of num events per user");
        // TODO this requires an argument to histogramify where we can just count events
        // and not even look at any data fields...!
        $("#the-graph-image").attr("src", "img/horiz-histogram.png");
        break;
      case "per_event":
        $("#output").html("TODO THIS IS THE HARD ONE");
        break;
      }
      break;
    case "per_user":
      switch (yVar.semantics) {
        case "user":
        if (xVar.datatype == "factor") {
          $("#output").html(" vertical bar chart, num users in each per-user factor");
          var counts = countFactors(userData, {varId: xVar.id, count: "users"});
          barplot(counts, {bars: "vertical"});
        } else {
          $("#output").html(" vertical histogram using arbitrary buckets for continuous variable on x");
          var hist = histogramify(userData, {varId: xVar.id, count: "users"});
          barplot(hist, {bars: "vertical"});
        }
        break;
      case "per_user":
        $("#output").html(" Scatterplot, each dot is a user; using jitter for any axis that is a factor");
        scatterplot(userData, xVar, yVar, {dotType: "user", colorVar: colorVar});
        break;
      case "event":
        if (xVar.datatype == "factor") {
          $("#output").html(" Bar chart - x-axis is the user-level factors, y-axis is number of events");
          var counts = countFactors(userData, {varId: xVar.id, count: "events"});
          barplot(counts, {bars: "vertical"});
        } else {
          $("#output").html(" Histogram - bucket continuous variable, y-axis is number of events");
          var hist = histogramify(userData, {varId: xVar.id, count: "events"});
          barplot(hist, {bars: "vertical"});
        }
        break;
      case "per_event":
        if (xVar.datatype == "factor") {
          $("#output").html(" User-level factor is groups on x-axis, each event is a dot, scatter-density bars");
          $("#the-graph-image").attr("src", "img/density-bars.png");
        } else {
          scatterplot(userData, xVar, yVar, {yIsPerEvent: true, dotType: "event", colorVar: colorVar});
          $("#output").html(" Scatter plot, each dot is an event");
        }
        break;
      }
      break;
    case "event":
      switch (yVar.semantics) {
        case "user":
          $("#output").html(" vertical-bar histogram of num events per user");
          $("#the-graph-image").attr("src", "img/histogram.png");
          // todo this is the weird one again, just floppified
        break;
      case "per_user":
        if (yVar.datatype == "factor") {
          $("#output").html(" Bar chart - y-axis is the user-level factors, x-axis is number of events");
          var counts = countFactors(userData, {varId: yVar.id, count: "events"});
          barplot(counts, {bars: "horizontal"});
        } else {
          $("#output").html(" Histogram - bucket continuous variable, x-axis is number of events");
          var hist = histogramify(userData, {varId: yVar.id, count: "events"});
          barplot(hist, {bars: "horizontal"});
        }
        break;
      case "event":
        return; // invalid!
        break;
      case "per_event":
        if (yVar.datatype == "factor") {
          $("#output").html(" horizontal bar chart, num events in each per-event factor group");
          var counts = countFactors(userData, {varId: yVar.id, count: "events",
                             varPerEvent: true});
          barplot(counts, { bars: "horizontal"});
        } else {
          $("#output").html(" horizontal histogram using arbitrary buckets for continuous variable on y");
          var hist = histogramify(userData, {varId: yVar.id, count: "events",
                                             varPerEvent: true});
          barplot(hist, {bars: "horizontal"});
        }
        break;
      }

      break;
    case "per_event":
      switch (yVar.semantics) {
      case "user":
        $("#output").html("TODO THIS IS THE HARD ONE!!");
        // need to aggregate the per-event variable for each user -- e.g.
        // producing the 'average event value' per user and plotting that.
        break;
      case "per_user":
        scatterplot(userData, xVar, yVar, {xIsPerEvent: true, dotType: "event", colorVar: colorVar});
        break;
      case "event":
        if (xVar.datatype == "factor") {
          $("#output").html(" vertical bar chart, num events in each per-event factor group");
          var counts = countFactors(userData, {varId: xVar.id, count: "events",
                                               varPerEvent: true});
          barplot(counts, { bars: "vertical"});
        } else {
          $("#output").html(" vertical histogram using arbitrary buckets for continuous variable on x");
          $("#the-graph-image").attr("src", "img/histogram.png");
          var hist = histogramify(userData,  {varId: xVar.id, count: "events",
                                              varPerEvent: true});
          barplot(hist, {bars: "vertical"});
        }
        break;
      case "per_event":
        scatterplot(userData, xVar, yVar, {xIsPerEvent: true, yIsPerEvent: true, dotType: "event", colorVar: colorVar});
        break;
      }
      break;
    }
  }

  function detectBadAssignment(variable, role, params) {

    if (role == "lattice-x" || role == "lattice-y") {
      if (variable.datatype != "factor") {
        return "Continuous variables cannot be used for latticing.";
      }
    }

    if (role == "color") {
      if (variable.datatype != "factor") {
        return "Continuous variables cannot be used for colored multiplot.";
        // but a continuous variable could be mapped to color in a scatterplot or map or something...
        // the role name "color" is misleading if it really means "plot multiple lines w/ discrete colors
      }
    }

    if (role == "x-axis" || role == "y-axis") {
      // reject if x and y axes both refer to same variable (e.g. num users vs pct users)
      var otherAxis;
      if (role == "x-axis") {
        otherAxis =  params["y-axis"];
      } else {
        otherAxis = params["x-axis"];
      }
      if (otherAxis) {
        var otherAxisVar = getVarById(otherAxis);
        if ((otherAxisVar.semantics == "user" && variable.semantics == "user") ||
          (otherAxisVar.semantics == "event" && variable.semantics == "event")){
          return "I can't plot the same variable on both axes!";
        }
      }
    }

    // TODO more rules here
    return false;
  }



  var params = {};
  var assignments = {};

  var items = $("#variables_menu").find("li");
  items.draggable({opacity: 0.7,
                   helper: "clone" });

  $( ".dragtarget" ).droppable({
    drop: function( event, ui ) {
      var variableName = ui.draggable.html();
      var variableId = ui.draggable.attr("id").split("var_")[1];
      var variableRole = $(this).attr("id").split("-target")[0];

      // check if type is ok for role assignment:
      var problem = detectBadAssignment(getVarById(variableId), variableRole, params);
      if (problem) {
        $("#output").html(problem);
        return;
      }

      var oldRole = assignments[variableName];
      if (oldRole) {
        // TODO if the swapping would create an invalid assignment, just drop the old one

        // don't let same variable be in two places - if this variable is already used
        // somewhere, then swap them (put new role's variable into old role):
        var varInNewRole = $(this).find(".valbox").html();
        $("#" + oldRole + "-target").find(".valbox").html(varInNewRole);
        if (varInNewRole) {
          assignments[varInNewRole] = oldRole;
          params[oldRole] = params[variableRole];
        } else {
          params[oldRole] = null;
        }
      }

      $(this).find(".valbox").html(variableName);
      assignments[variableName] = variableRole;
      params[variableRole] = variableId;

      updateFragment(params);

      // Draw a graph if at least x-axis and y-axis have been set.
      if (params["x-axis"] && params["y-axis"]) {
        $("#imagearea").empty(); // Clear out old graph, if any
        drawNewGraph(params);
      }
    }
  });
}

// TODO should be able to drag a variable from its placement after it has been placed.
// Dragging it out should clear that field. Dragging it to another occupied field should swap.
// Other