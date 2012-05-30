
function updateFragment(params) {
  var baseLoc = ("" + window.location).split("#")[0];
  var args = [];
  for (var key in params) {
    args.push( key + "=" + params[key]);
  }
  window.location = baseLoc + "#" + args.join("&");
}

function getUrlParams() {
  var args = {};
  if (("" +window.location).search("#") != -1) {
    var params = ("" + window.location).split("#")[1];
    console.log(params);
    if (params != "") {
      params_list = params.split("&");
      for (var pair in params_list) {
	args[params_list[pair].split("=")[0]] = params_list[pair].split("=")[1];
      }
    }
  }
  return args;
}

function enoughValsForGraph(params) {
  	if (params["x-axis"] && params["y-axis"]) {
	  return true;
	}
	return false;
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
    var usePercents;
    if (options.counter.id == "pct_users") {
      usePercents = true;
    } else {
      usePercents = false;
    }

    var countStr = usePercents ? "percentage" : "number";

    // OK height of bars will be number of users, but what exactly are we counting here?
    if (options.variable.semantics == "event_count") {
      $("#output").html("Bars represent the " +
                        countStr + " of users with a total number of actions in the given range.");
      counts = histogramify(userData, {varId: "numEvents", colorVar: options.colorVar});
    } else if (options.variable.semantics == "event_name") {
      $("#output").html("Bars represent the " +
                        countStr + " of users who clicked the given item at least once.");
      counts = whoDidAtLeastOnce(userData, {colorVar: options.colorVar});
    } else if (options.variable.datatype == "factor") {
      $("#output").html("Bars represent the " +
                        countStr + " of users with the given " + options.variable.name);
      counts = countFactors(userData, {varId: options.variable.id, colorVar: options.colorVar});
    } else {
      $("#output").html("Bars represent the " +
                        countStr + " of users with a " + options.variable.name + " in the given range.");
      counts = histogramify(userData, {varId: options.variable.id, colorVar: options.colorVar});
    }

    if (usePercents) {
      // divide each count by number of users
      var numUsers = userData.length;
      for (var i = 0; i < counts.counts.length; i++) {
        counts.counts[i] = counts.counts[i] / numUsers;
      }
    }

    barplot(counts, {bars: options.bars, axisIsPercent: usePercents, caption: options.caption,
                     width: options.width, height: options.height});
  }

  function eventCountPlot(userData, options) {
    var counts = totalEventsByItem(userData, {colorVar: options.colorVar});
    $("#output").html("Bars represent number of uses, totalled across all users, for the given item.");
    barplot(counts, {bars: options.bars, caption: options.caption, width: options.width, height: options.height});
  }

  function drawNewGraph(params) {
    var xVar = getVarById(params["x-axis"]);
    var yVar = getVarById(params["y-axis"]);
    var colorVar = null;
    if (params["color"]) {
      colorVar = getVarById(params["color"]);
    }

    var chartWidth = parseInt(d3.select("#imagearea").style("width").replace("px", ""));
    var chartHeight = 600; // TODO totally arbitrary number

    var dataSets, latticeVar, dataSetName;
    if (params["lattice-x"]) {
      latticeVar = getVarById(params["lattice-x"]);
      dataSets = latticificate(userData, latticeVar);
      // if we're latticed then make smaller charts
      chartWidth = chartWidth * 0.4;
      chartHeight = chartHeight * 0.4; // TODO totally arbitrary number
    } else {
      // Just make one lattice dataset containing all data.
      latticeVar = null;
      dataSets = {everybody: userData};
    }

    // Decide what type of graph to draw
    if ( xVar.semantics == "user" && yVar.semantics == "user") {
      // Invalid!  This should never happen since it should be caught by detectBadAssignment
      return;
    }

    // Plot each data set in its own lattice mini-graph:
    for (dataSetName in dataSets) {
      var latticeLabel = "";
      if (latticeVar) {
        latticeLabel = latticeVar.name + " = " + dataSetName;
      }

      if ( xVar.semantics == "user") {   // and yVar isn't
         someKindOfBarPlot( dataSets[dataSetName],
                            {variable: yVar, counter: xVar, colorVar: colorVar, bars: "horizontal",
                             caption: latticeLabel, width: chartWidth, height: chartHeight});
        continue;
      }

      if ( yVar.semantics == "user") {
        someKindOfBarPlot( dataSets[dataSetName],
                           {variable: xVar, counter: yVar, colorVar: colorVar, bars: "vertical",
                            caption: latticeLabel, width: chartWidth, height: chartHeight});
        continue;
      }

      // Special case: event_name vs. event_count = plot counts of each event
      // TODO actually more useful as scatter plot where each dot is a user and one axis
      // is number of events that user had in that category?
      if ( yVar.semantics == "event_name" && xVar.semantics == "event_count") {
        eventCountPlot(dataSets[dataSetName], {bars: "horizontal", caption: latticeLabel,
                                               width: chartWidth, height: chartHeight, colorVar: colorVar});
        continue;
      }
      if ( xVar.semantics == "event_name" && yVar.semantics == "event_count") {
        eventCountPlot(dataSets[dataSetName], {bars: "vertical", caption: latticeLabel,
                                               width: chartWidth, height: chartHeight, colorVar: colorVar});
        continue;
      }

      // All other cases use scatterplot.
      // TODO every category-based scatter plot needs a violin-plot option; number vs. number
      // scatter plot needs a regression line option.
      scatterplot(dataSets[dataSetName], xVar, yVar, {colorVar: colorVar, caption: latticeLabel,
                                                      width: chartWidth, height: chartWidth});
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

  var initialVals = getUrlParams();
  if (enoughValsForGraph(initialVals)) {
    drawNewGraph(initialVals);
    for (val in initialVals) {
      var valbox = $("#" + val + "-target").find(".valbox");
      valbox.html(getVarById(initialVals[val]).name);
      valbox.attr("variable", initialVals[val]);
      var problem = detectBadAssignment(getVarById(initialVals[val]), val, initialVals);
      if (problem) {
	$("#output").html(problem);
	return;
      }
      assignments[getVarById(initialVals[val]).name] = val;

      //initialize these values in params
      params[val] = initialVals[val];
    }
  }

  function outsideDropTargets(x, y) {
    var div = $("#drop-targets-container");
    var left = div.position().left;
    var top = div.position().top;
    var right = left + div.width();
    var bottom = top + div.height();
    return (x < left || x > right || y < top || y > bottom);
  }

  function unAssignVariable(varId) {
    // TODO is there any good reason the assignments[] keys hvae to be variableNames instead of
    // variableIds?
    if (varId && varId!= "") {
      var name = getVarById(varId).name;
      if (name in assignments) {
        var role = assignments[name];
        delete params[role];
      	delete assignments[name];
      }
    }
  }

  // Make Things Draggable:
  $("#variables_menu").find("li").draggable({opacity: 0.7,
                                             helper: "clone" });

  $("div.dragtarget").find(".valbox").draggable({opacity: 0.7,
                                                 helper: "clone",
                                                 // Unassign variable if you drag it out of the box:
                                                 stop: function(e, ui)  {
                                                   if (outsideDropTargets(e.pageX, e.pageY)) {
                                                     unAssignVariable($(this).attr("variable"));
                                                     $(this).empty();
                                                     // TODO this stuff below is duplicated, factor out
                                                     updateFragment(params);
                                                     if (enoughValsForGraph(params)) {
                                                       $("#imagearea").empty();
                                                       drawNewGraph(params);
                                                     }
                                                   }
                                                 }});

  $( ".dragtarget" ).droppable({
    hoverClass: "dragtarget-hover",
    drop: function( event, ui ) {
      // OK so the object being dropped might be an original variable assignment from the left
      // column or it might be a re-assignment from another slot in the right column. First thing
      // we need to do is distinguish which it is... or maybe not...
      var variableId = ui.draggable.attr("variable");
      var variableRole = $(this).attr("id").split("-target")[0];

      // Check if it's a customizable variable; if so, complete its id by checking the menu setting:
      if (getVarById(variableId).customizable == "event_names") {
        var menuSetting = ui.draggable.find(".event_names_select").first().val();
        variableId = variableId + menuSetting;
      }

      var variableName = getVarById(variableId).name;

      // check if type is ok for role assignment:
      var problem = detectBadAssignment(getVarById(variableId), variableRole, params);
      if (problem) {
        $("#output").html(problem);
        return;
      }

      var oldValinRole = params[variableRole];
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
      // TODO any magic that we apply here must also be done on any other
      // variable assignemnt... should factor it out into an "assign variable" function.
      $(this).find(".valbox").html(variableName);
      $(this).find(".valbox").attr("variable", variableId);
      if (oldValinRole in assignments) {
      	delete assignments[getVarById(oldValinRole).name];
      }
      assignments[variableName] = variableRole;
      params[variableRole] = variableId;

      updateFragment(params);

      // Draw a graph if at least x-axis and y-axis have been set.
      if (enoughValsForGraph(params)) {
        $("#imagearea").empty(); // Clear out old graph, if any
        drawNewGraph(params);
      }
    }
  });

    // TODO need to manually do the thing that jquery UI draggable was doing for us
    // TODO maybe refactor out some of the stuff above into an "assign var" function,
    // use that here.
}

// TODO should be able to drag a variable from its placement after it has been placed.
// Dragging it out should clear that field. Dragging it to another occupied field should swap.
// Other