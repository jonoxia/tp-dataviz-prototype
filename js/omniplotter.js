/*
 *   go to ggplot2 page

// Types:
// If it's continuous it can only be used as an x or a y
//   all others need factors
//   R: factor, ordered factor, or numerics
//   treat "factor with small # of values" different from "factor with large # of values"

//  for lattice, x and y have to be the same axes for all, so find max over all and use that
//  to determine axes for alluse http
 */


/* To do latticing:
 * 1. factor out the part that decides on the width and height of the svg rectangle
 * 2. factor out the part that draws the graph; take width/height as params
 * 3. if there is a lattice, then split the data into separate bookets one for each value...
 * 4. count the values, decide how small each minigraph gets to be
 * 5. call #2 once with each data booket.
 *
 * 6. Assume there's always lattices and just the lattice number = 1
 *
 * 7. when calculating lattices - they all have to have the same axes so get the min-max
 *   x and y limits over ALL of them
 *
 * first pass get all parameters, second pass through iterate all data points and draw them
 *
 */

function latticificate(userData, latticeVar) {
  var chunks = {};

  for (var i = 0; i < userData.length; i++) {
    var user = userData[i];
    var value = user[ latticeVar.id ];

    if (!chunks[value]) {
      chunks[value] = [];
    }

    chunks[value].push(user);
  }

  return chunks;
}


function makeChart(options) {
  var leftMargin = 5;
  var topMargin = 5;
  var rightMargin = 105;
  var bottomMargin = 105;

  var chartWidth = options.chartWidth - leftMargin - rightMargin;
  var chartHeight = options.chartHeight - topMargin - bottomMargin;

  var chart = d3.select("#imagearea").append("svg:svg")
    .attr("width", chartWidth + leftMargin + rightMargin)
    .attr("height", chartHeight + topMargin + bottomMargin)
    .attr("class", "chart")
    .append("svg:g").attr("transform", "translate(" + leftMargin +  ", " + topMargin + ")");

  if (options.caption) {
    // TODO this needs to go higher up...
    chart.append("svg:text")
      .attr("x", chartWidth/2 - 20)
      .attr("y", 20)
      .text(options.caption);
  }

  return {chart: chart, chartWidth: chartWidth, chartHeight: chartHeight};
}


function scatterplot(userData, xVar, yVar, options) {
  // Each dot in the scatter plot is a user.

  var {chart, chartWidth, chartHeight} = makeChart({caption: options.caption,
                                                    chartWidth: options.width,
                                                    chartHeight: options.height});

  var dataPoints = [];

  function getXVarVal(record) {
    if (xVar.semantics == "event_count") {
      return parseInt(record["numEvents"]);
    }
    var newX = 0;  // default to 0 if user data record has no matching property
    if (record[ xVar.id ] != undefined) {
      newX = record[ xVar.id ];
    }
    if (xVar.datatype != "factor") {
      newX = parseFloat(newX);
    }
    return newX;
  }

  function getYVarVal(record) {
    if (yVar.semantics == "event_count") {
      return parseInt(record["numEvents"]);
    }
    var newY = 0;
    if (record[ yVar.id ] != undefined) {
      newY = record[ yVar.id ];
    }
    if (yVar.datatype != "factor") {
      newY = parseFloat(newY);
    }
    return newY;
  }

  for (var i = 0; i < userData.length; i++) {
    var newX, newY, newColor = null;
    newX = getXVarVal(userData[i]);
    newY = getYVarVal(userData[i]);
    if (options.colorVar) {
      // color is always factor-type and per-user.
      newColor = userData[i][ options.colorVar.id ];
    }
    dataPoints.push( {x: newX, y: newY, c: newColor} );
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
      .attr("class", "x-axis")
      .attr("transform", "translate(0, " + chartHeight + ")")
      .call(xAxis);

  // Add the y-axis.
  chart.append("svg:g")
      .attr("class", "y-axis")
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
    .attr("r", 4)
    .attr("cx", xMapper)
    .attr("cy", yMapper);
}


// Different ways of counting up users for a bar chart:

function toCountsAndLabels(colorDictionary) {
  // takes a dictionary like {a: 5, b: 7} and turns it into
  // two arrays like {counts: [5, 7], labels: ["a", "b"]}
  // Also combines the colors in the right order

  var colors = [];
  for (var color in colorDictionary) {
    colors.push(color);
  }

  // to create labels, look at keys across all colors...
  // my kingdom for Python's dict.keys() method
  var labelDict = {};
  for (color in colorDictionary) {
    for (var key in colorDictionary[color]) {
      labelDict[key] = 1;
    }
  }

  var counts = [];
  var labels = [];
  for (key in labelDict) {
    labels.push(key);
    for (var c in colors) {
      color = colors[c];
      if (colorDictionary[color][key]) {
        counts.push(colorDictionary[color][key]);
      } else {
        counts.push(0);
      }
    }
  }

  return {counts: counts, labels: labels, colors: colors};
}

function countFactors(userData, options) {
  var factorValueCounts = {};  // will be key = factor name, value = count

  for (var i =0; i < userData.length; i++) {
    var user = userData[i];

    var color = "everybody";
    if (options.colorVar) {
      color = userData[i][ options.colorVar.id ];
    }
    if (!factorValueCounts[color]) {
      factorValueCounts[color] = {};
    }

    if (options.varId) {
      var val = userData[i][ options.varId ];
      if (factorValueCounts[color][val]) {
        factorValueCounts[color][val] += 1;
      } else {
        factorValueCounts[color][val] = 1;
      }
    }
  }

  return toCountsAndLabels(factorValueCounts);
}

function whoDidAtLeastOnce(userData, eventNames, options) {
  // for each event listed in eventNames, count users who did that event at least once
  var eventCounts = {};

  for (var i =0; i < userData.length; i++) {
    var user = userData[i];

    var color = "everybody";
    if (options.colorVar) {
      color = userData[i][ options.colorVar.id ];
    }
    if (!eventCounts[color]) {
      eventCounts[color] = {};
    }

    for (var e in eventNames) {
      var eventName = eventNames[e];
      var propName = "numUses_" + eventName;
      if (user[propName] != undefined) {
        if (parseInt(user[propName]) > 0) {
          if (eventCounts[color][eventName]) {
            eventCounts[color][eventName] += 1;
          } else {
            eventCounts[color][eventName] = 1;
          }
        }
      }
    }
  }

  return toCountsAndLabels(eventCounts);
}

function totalEventsByItem(userData, eventNames, options) {
  // for each event, count total number of uses of that event across all users
  // TODO not very useful, should be mean or median
  // TODO a lot of duplciated code with whoUsedAtLeastOnce.
  var eventCounts = {};

  for (var i =0; i < userData.length; i++) {
    var user = userData[i];

    var color = "everybody";
    if (options.colorVar) {
      color = userData[i][ options.colorVar.id ];
    }
    if (!eventCounts[color]) {
      eventCounts[color] = {};
    }

    for (var e in eventNames) {
      var eventName = eventNames[e];
      var propName = "numUses_" + eventName;
      if (user[propName] != undefined) {
        var numUses = parseInt(user[propName]);
        if (eventCounts[color][eventName]) {
          eventCounts[color][eventName] += numUses;
        } else {
          eventCounts[color][eventName] = numUses;
        }
      }
    }
  }

  return toCountsAndLabels(eventCounts);
}


function createHistogramBuckets(userData, options) {
  var numBuckets = 15; // TODO make this customizable

  var values = [];
  // Create sorted list of values:
  for (var i = 0; i < userData.length; i++) {
    if (userData[i][ options.varId ] == undefined) {
      values.push(0);
    } else {
      values.push( parseInt(userData[i][ options.varId ]) );
    }
  }
  values = values.sort(function(a, b) { return a - b; });

  var numUsers = userData.length;
  var onePercent = Math.floor(numUsers / 50);
  if (onePercent < 1) onePercent = 1; // zero will screw up the outlier collection

  // Start at the top end, collect outliers until we have 1% of users
  var outlierThreshold = values[ values.length - onePercent ];
  var breakpoints = [];
  var min = values[0];
  // if we have 0s, create a 0 bucket - that will usually be a useful thing to see.
  if (min == 0) {
    breakpoints.push(0);
    min = 1;
  }

  var max = values[ values.length - 1 ];
  // calcuate bucket breakpoints (Math.floored to nearest integer)
  var bucketWidth;
  if ( (outlierThreshold - min) < 5) {
    // don't consoidate outliers if it would reduce our number of buckets to something silly
    outlierThreshold = max;
  }

  if ((outlierThreshold - min) < numBuckets) {
    // (if max - min is less than 15 then having 15 buckets will produce duplicate buckets!!
    //  in this case, reduce number of buckets!)
    numBuckets = (outlierThreshold - min);
    bucketWidth = 1;
  } else {
    // round off bucket width to a whole number, so all breakpoints will be whole numbers,
    // equally spaced
    bucketWidth = Math.floor((outlierThreshold - min)/numBuckets);
  }
  for (var j = 0; j < numBuckets; j++) {
    breakpoints.push( min +  j * bucketWidth);
  }
  // last bucket contains everything from outlierThreshold -> maximum
  breakpoints.push(max);

  return breakpoints;
}

function histogramify(userData, options) {
  console.log("Histogramify.");
  var labels = [];
  var colorBucketCounts = {};

  var breakpoints = createHistogramBuckets(userData, options);
  console.log("Breakpoints are " + breakpoints);
  var numBuckets = breakpoints.length - 1;

  for (var b = 0; b < numBuckets; b++) {
    if (breakpoints[b] == breakpoints[b+1] - 1) {
      // if bucket has a range of 1, just show that one number
      labels.push("" + breakpoints[b]);
    } else {
      // otherwise show min and max of bucket
      labels.push(breakpoints[b] + " - " + (breakpoints[b+1] - 1));
    }
  }

  // go through a second time, create bucket counts
  for (var i = 0; i < userData.length; i++) {
    var val = 0; // default to 0 if user data record has no matching property
    if (userData[i][ options.varId ] != undefined) {
      val = userData[i][ options.varId ];
    }
    // All data will be in 'blah' if there is no colorVar
    var color = "blah";
    if (options.colorVar) {
      color = userData[i][ options.colorVar.id ];
    }
    // If this is the first time we've seen this color, create new empty histogram
    if (!colorBucketCounts[color]) {
      colorBucketCounts[color] = [];
      for (var j = 0; j < breakpoints.length - 1; j++) {
        colorBucketCounts[color][j] = 0;
      }
    }
    // do the actual bucketing of users:
    for (var j = 0; j < numBuckets; j++) {
      if (val < breakpoints[j+1] ) {
        colorBucketCounts[color][j] ++;
        break;
      }
    }
  }

   // how many colors are there?
  var colors = [];
  for (var prop in colorBucketCounts) {
    colors.push(prop);
  }
  var numColors = colors.length;

  // Combine all the colored bucket lists into one list, in an order like
  // red bar 1, green bar 1, blue bar 1, red bar 2, green bar 2, blue bar 2, etc.
  // that's what barplot will be accepting.
  var combinedCounts = [];
  for (var b = 0; b < numBuckets; b++) {
    for (var c = 0; c < numColors; c++) {
      combinedCounts.push( colorBucketCounts[colors[c]][b] );
    }
  }

  return {counts: combinedCounts, labels: labels, colors: colors};
}

function barplot(data, options) {
  // Test using case where xaxis is "user" and yaxis is "per user, factor"
  // There will be others

  var dataForD3 = data.counts;
  var labelsForD3 = data.labels;
  var colors = data.colors; // TODO use this to generate legend showing what each color means.

  // TODO sort dataForD3 into an order that we like - make sort-order a drop-down or something
  // most -> least, least -> most, or alphabetical by factor?
  var horizBars = (options.bars == "horizontal");

  var {chart, chartWidth, chartHeight} = makeChart({caption: options.caption,
                                                    chartWidth: options.width,
                                                    chartHeight: options.height});

  // TODO should be able to choose linear or logarithmic scale
  var barLength = d3.scale.linear()
    .domain([0, d3.max(dataForD3)]);
  if (horizBars) {
    barLength.range([0, chartWidth]);
  } else {
    // vertical bars come up from the bottom, not down from the top
    barLength.range([chartHeight, 0]);
  }

  // Draw a numerical axis. TODO Mark with % if options.axisIsPercent.
  var barLengthAxis = d3.svg.axis()
    .scale(barLength)
    .ticks(10)
    .tickSize(6, 3, 0);
  if (!horizBars) {
    barLengthAxis.orient("right");
  }

  // Ordinal scale:
  // (TODO to set the order, sort labelsForD3 before passing into .domain().)
  var barWidth = d3.scale.ordinal()
    .domain(labelsForD3)
    .rangeBands([0, (horizBars? chartHeight: chartWidth)]);
  var barWidthAxis = d3.svg.axis()
    .scale(barWidth)
    .ticks(10)
    .tickSize(6, 3, 0);
  if (horizBars) {
    barWidthAxis.orient("right");
  }

  var xAxis = chart.append("svg:g")
    .attr("class", "x-axis")
    .attr("transform", "translate(0, " + chartHeight + ")");
  var yAxis = chart.append("svg:g")
    .attr("class", "y-axis")
    .attr("transform", "translate(" + chartWidth + ",0)");

  if (horizBars) {
      xAxis.call(barLengthAxis);
      yAxis.call(barWidthAxis);
  } else {
      xAxis.call(barWidthAxis);
      yAxis.call(barLengthAxis);
  }

  // Draw the bars:
  var bars = chart.selectAll("rect")
    .data(dataForD3)
    .enter().append("svg:rect");

  var barPixels = barWidth.rangeBand() / colors.length;

  function colorMap(d, i) {
    var colorIndex = (i % colors.length) + 1;
    return "dataset-" + colorIndex;
  }

  if (horizBars) {
    bars.attr("y", function(d, i) { return i * barPixels; })
      .attr("width", barLength)
      .attr("height", barPixels)
      .attr("class", colorMap);
  } else {
    bars.attr("x", function(d, i) { return i * barPixels; })
      .attr("y", barLength)
      .attr("width", barPixels)
      .attr("height", function(d) { return chartHeight - barLength(d); })
      .attr("class", colorMap);
  }

  // Rotate the x-axis labels if there are a lot of them:
  // TODO >15 is a totally arbitrary number! should count characters in all labels/longest label
  // to gauge readability.  also it should depend on chartwidth.
// chartwidth < 300 means max length should be 7
// chartwidth of like 600 means max length should be like 15
  console.log("rotate labels? chartWidth is " + chartWidth);
  if (labelsForD3.length > chartWidth * 7 / 300) {
    console.log("Rotating Labels!");
    var offset = (-1) * (barWidth.rangeBand()/2 - 5); // TODO this needs tweaking
    d3.selectAll(".x-axis").selectAll("text").attr("text-anchor", "end")
      .attr("transform", "rotate(-90) translate(0 " + offset + ")");
  }

  // Show tooltips on hover!
  // TODO change the sentence here based on the type of graph.
  // percentage axis: "x % of users have..."
  // numeric axis: "there are x users with..."
  // histogram: "...between y and z things"
  // factors: "...a y value of z"
  bars.append("svg:title").text(function(d, i) {return "There are " + d + " between " + labelsForD3[i];});

}

