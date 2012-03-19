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

