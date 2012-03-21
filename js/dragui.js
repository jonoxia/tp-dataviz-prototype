
function updateFragment(params) {
  var baseLoc = ("" + window.location).split("#")[0];
  var args = [];
  for (var key in params) {
    args.push( key + "=" + params[key]);
  }
  window.location = baseLoc + "#" + args.join("&");
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
          var counts = countFactors(userData, {varId: yVar.id, count: "users", colorVar: colorVar});
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
          var counts = countFactors(userData, {varId: xVar.id, count: "users", colorVar: colorVar});
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
          var counts = countFactors(userData, {varId: xVar.id, count: "events", colorVar: colorVar});
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
          var counts = countFactors(userData, {varId: yVar.id, count: "events", colorVar: colorVar});
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
                             varPerEvent: true, colorVar: colorVar});
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
                                               varPerEvent: true, colorVar: colorVar});
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