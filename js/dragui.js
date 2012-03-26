
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

  function someKindOfBarPlot(userData, options) {
    var counts;
    // OK height of bars will be number of users, but what exactly are we counting here?
    console.log("Some kind of bar plot: datatype is " + options.variable.datatype + " semantics is " + options.variable.semantics);
    if (options.variable.semantics == "event_count") {
      $("#output").html("Bars represent the number of users with a total number of actions in the given range.");
      counts = histogramify(userData, {varId: "numEvents", colorVar: options.colorVar});
    } else if (options.variable.semantics == "event_name") {
      $("#output").html("Bars represent the number of users who clicked the given item at least once.");
      counts = whoDidAtLeastOnce(userData, {colorVar: options.colorVar});
    } else if (options.variable.datatype == "factor") {
      $("#output").html("Bars represent the number of users with the given " + options.variable.name);
      counts = countFactors(userData, {varId: options.variable.id, colorVar: options.colorVar});
    } else {
      $("#output").html("Bars represent the number of users with a " + options.variable.name + " in the given range.");
      counts = histogramify(userData, {varId: options.variable.id, colorVar: options.colorVar});
    }
    barplot(counts, {bars: options.bars});
  }

  function eventCountPlot(userData, options) {
    var counts = totalEventsByItem(userData);
    $("#output").html("Bars represent number of uses, totalled across all users, for the given item.");
    barplot(counts, {bars: options.bars});
  }

  function drawNewGraph(params) {
    var xVar = getVarById(params["x-axis"]);
    var yVar = getVarById(params["y-axis"]);

    // TODO: Lattice-wrap not yet implemented.
    var colorVar = null;
    if (params["color"]) {
      colorVar = getVarById(params["color"]);
    }

    // Decide what type of graph to draw
    if ( xVar.semantics == "user" && yVar.semantics == "user") {
      // Invalid!
      return;
    }

    if ( xVar.semantics == "user") {   // and yVar isn't
      someKindOfBarPlot( userData, {variable: yVar, counter: xVar, colorVar: colorVar,
                                    bars: "horizontal"});
      return;
    }

    if ( yVar.semantics == "user") {
      someKindOfBarPlot( userData, {variable: xVar, counter: yVar, colorVar: colorVar,
                                    bars: "vertical"});
      return;
    }

    // Special case: event_name vs. event_count = plot counts of each event
    // TODO actually more useful as scatter plot where each dot is a user and one axis
    // is number of events that user had in that category?
    if ( yVar.semantics == "event_name" && xVar.semantics == "event_count") {
      eventCountPlot(userData, {bars: "horizontal"});
      return;
    }
    if ( xVar.semantics == "event_name" && yVar.semantics == "event_count") {
      eventCountPlot(userData, {bars: "vertical"});
      return;
    }

    // TODO not implemented yet - percentage of users is treated same as number of users

    // All other cases use scatterplot.
    // TODO every category-based scatter plot needs a violin-plot option...
    scatterplot(userData, xVar, yVar, {colorVar: colorVar});
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
          (otherAxisVar.semantics == "event_count" && variable.semantics == "event_count") ||
          (otherAxisVar.semantics == "event_name" && variable.semantics == "event_name")) {
            return "Sorry, I don't know any meaningful way to plot those variables together.";
        }
        if (variable.semantics == "event_name" && otherAxisVar.semantics == "per_user" ||
            variable.semantics == "per_user" && otherAxisVar.semantics == "event_name") {
          return "Sorry, I don't know any meaningful way to plot those variables together.";
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