

function updateFragment(params) {
  var baseLoc = ("" + window.location).split("#")[0];
  var args = [];
  for (var key in params) {
    args.push( key + "=" + params[key]);
  }
  window.location = baseLoc + "#" + args.join("&");
}

function drawNewGraph(params) {

  $("#imagearea").slideUp().slideDown();
  $("#output").html("Drawing graph with " + JSON.stringify(params));
}

function detectBadAssignment(type, role) {

  if (role == "lattice-x" || role == "lattice-y") {
    if (type != "factor") {
      return "Continuous variables cannot be used for latticing.";
    }
  }

  if (role == "color") {
    if (type != "factor") {
      return "Continuous variables cannot be used for colored multiplot.";
      // but a continuous variable could be mapped to color in a scatterplot or map or something...
      // the role name "color" is misleading if it really means "plot multiple lines w/ discrete colors
    }
  }

  // TODO more rules here
  return false;
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

function initDragGui(data){
  var params = {};
  var assignments = {};
  var varTypes = {};

  for(var x = 0; x < data.length; x++) {
    varTypes[data[x].id] = data[x].datatype;
  }

  var items = $("#variables_menu").find("li");
  items.draggable({opacity: 0.7,
                   helper: "clone" });

  $( ".dragtarget" ).droppable({
    drop: function( event, ui ) {
      var variableName = ui.draggable.html();
      var variableId = ui.draggable.attr("id").split("var_")[1];
      var variableRole = $(this).attr("id").split("-target")[0];

      // check if type is ok for role assignment:
      var type = varTypes[ variableId];
      var problem = detectBadAssignment(type, variableRole);
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
        drawNewGraph(params);
      }
    }
  });
}

// TODO should be able to drag a variable from its placement after it has been placed.
// Dragging it out should clear that field. Dragging it to another occupied field should swap.