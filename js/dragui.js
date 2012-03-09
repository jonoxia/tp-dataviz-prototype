
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



function scatterplot(xAxis, yAxis, dotType) {
  var dots;
  // If x and y variables are both user/per user, dots in scatterplot are users.
  // If at least one axis is event-level, though, dots have to be events.

  // (Unless... if one axis is a continuous event-level variable, we could pick the average
  // (or min or max) per user and use that value to plot a user-dot. How to represent that
  // option?)
  // (I guess a dropdown would appear: Dots represent
  //     --> events (all users lumped together)
  //     --> users (average value per user)

  if (xAxis.datatype == "factor" && yAxis.datatype == "factor") {
    $("#output").html("Make a grid of factor vs. factor, plot users/events in each one");
  } else if (xAxis.datatype == "factor") {
    $("#output").html("Factor on the x axis,continous on the y axis, scatter points");
    $("#the-graph-image").attr("src", "img/density-bars.png");
  } else if (yAxis.datatype == "factor") {
    $("#output").html("Continuous on the  x axis, factor on the y axis, scatter points");
    $("#the-graph-image").attr("src", "img/horiz-density-bars.png");
  } else {
    $("#output").html("Continuous scatter on both axes.");
    $("#the-graph-image").attr("src", "img/scatter.png");
  }

}

function barplot(userData, options) {
    // Test using case where xaxis is "user" and yaxis is "per user, factor"
    // There will be others

  // options:
   // {factors: yVar.id, count: "events", bars: "horizontal",factorPerEvent: true}

  var factorId = options.factors;

  var factorValueCounts = {};
  function addCount(val) {
    if (factorValueCounts[val]) {
      factorValueCounts[val] += 1;
    } else {
      factorValueCounts[val] = 1;
    }
  }

  for (var i = 0; i < userData.length; i++) {
    var val;
    if (!options.factorPerEvent) {   // expect factorId to match a field on the user
      val = userData[i][ factorId ];
    }
    if (options.count == "users") { // count users with each value of the factor
      addCount(val);
    } else if (options.count == "events") { // count events
      for (var j = 0; j < userData[i].events.length; j++) {
        if (options.factorPerEvent) {
          val = userData[i].events[j][ factorId ]; // expect factorId to match field on event
        }
        addCount(val);
      }
    }
  }

  var dataForD3 = [];
  var labelsForD3 = [];
  for (var val in factorValueCounts) {
    labelsForD3.push(val);
    dataForD3.push(factorValueCounts[val]);
  }
  // TODO sort dataForD3 into an order that we like - make sort-order a drop-down or something
  // most -> least, least -> most, or alphabetical by factor?


  // Create horiz. bar chart with d3.js
  var chart = d3.select("#imagearea").attr("class", "chart");

  // TODO scaling!!!!
  if (options.bars == "horizontal") {

    var x = d3.scale.linear()
      .domain([0, d3.max(dataForD3)])
      .range(["0px", chart.style("width")]);

    chart.selectAll("div")
      .data(dataForD3)
    .enter().append("div")
      .style("width", x)
      .text(function(d, i) { return labelsForD3[i]; });
  } else if (options.bars == "vertical") {
    // TODO
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

    if (params["color"] && (params["lattice-x"] || params["lattice-y"])) {
      $("#the-graph-image").attr("src", "img/compare-new.png");
      return;
    }
    if (params["lattice-y"]) {
      $("#the-graph-image").attr("src", "img/hist-unsorted.png");
      return;
    }
    if (params["lattice-x"]) {
      $("#the-graph-image").attr("src", "img/3stooges.png");
      return;
    }
    if (params["color"]) {
      $("#the-graph-image").attr("src", "img/directlabel-011.png");
      return;
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
          barplot(userData, {factors: yVar.id, count: "users", bars: "horizontal"});
        } else {
          $("#output").html("horizontal histogram using arbitrary buckets for continuous variable on y");
          $("#the-graph-image").attr("src", "img/horiz-histogram.png");
        }
        break;
      case "event":
        $("#output").html("horizontal-bar histogram of num events per user");
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
          barplot(userData, {factors: xVar.id, count: "users", bars: "vertical"});
        } else {
          $("#output").html(" vertical histogram using arbitrary buckets for continuous variable on x");
          $("#the-graph-image").attr("src", "img/histogram.png");
        }
        break;
      case "per_user":
        $("#output").html(" Scatterplot, each dot is a user; using jitter for any axis that is a factor");
        $("#the-graph-image").attr("src", "img/scatter.png"); // TODO actually could be density bars
        break;
      case "event":
        if (xVar.datatype == "factor") {
          $("#output").html(" Bar chart - x-axis is the user-level factors, y-axis is number of events");
          barplot(userData, {factors: xVar.id, count: "events", bars: "vertical"});
        } else {
          $("#output").html(" Histogram - bucket continuous variable, y-axis is number of events");
          $("#the-graph-image").attr("src", "img/histogram.png");
        }
        break;
      case "per_event":
        if (xVar.datatype == "factor") {
          $("#output").html(" User-level factor is groups on x-axis, each event is a dot, scatter-density bars");
          $("#the-graph-image").attr("src", "img/density-bars.png");
        } else {
          $("#output").html(" Scatter plot, each dot is an event");
          $("#the-graph-image").attr("src", "img/scatter.png");
        }
        break;
      }
      break;
    case "event":
      switch (yVar.semantics) {
        case "user":
          $("#output").html(" vertical-bar histogram of num events per user");
          $("#the-graph-image").attr("src", "img/histogram.png");
        break;
      case "per_user":
        if (yVar.datatype == "factor") {
          $("#output").html(" Bar chart - y-axis is the user-level factors, x-axis is number of events");
          barplot(userData, {factors: yVar.id, count: "events", bars: "horizontal"});
        } else {
          $("#output").html(" Histogram - bucket continuous variable, x-axis is number of events");
          $("#the-graph-image").attr("src", "img/horiz-histogram.png");
        }
        break;
      case "event":
        return; // invalid!
        break;
      case "per_event":
        if (yVar.datatype == "factor") {
          $("#output").html(" horizontal bar chart, num events in each per-event factor group");
          barplot(userData, {factors: yVar.id, count: "events", bars: "horizontal",
                             factorPerEvent: true});
        } else {
          $("#output").html(" horizontal histogram using arbitrary buckets for continuous variable on y");
          $("#the-graph-image").attr("src", "img/horiz-histogram.png");
        }
        break;
      }

      break;
    case "per_event":
      switch (yVar.semantics) {
      case "user":
        $("#output").html(" TODO THIS IS THE HARD ONE!!");
        // need to aggregate the per-event variable for each user -- e.g.
        // producing the 'average event value' per user and plotting that.
        break;
      case "per_user":
        scatterplot(xVar, yVar, "event"); // scatterplot, each dot is event
        break;
      case "event":
        if (xVar.datatype == "factor") {
          $("#output").html(" vertical bar chart, num events in each per-event factor group");
          barplot(userData, {factors: xVar.id, count: "events", bars: "vertical",
                             factorPerEvent: true});
        } else {
          $("#output").html(" vertical histogram using arbitrary buckets for continuous variable on x");
          $("#the-graph-image").attr("src", "img/histogram.png");
        }

        break;
      case "per_event":
        scatterplot(xVar, yVar, "event"); // scatterplot, each dot is event
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