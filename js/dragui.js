
var params = {};
var assignments = {};

function updateFragment() {
  var baseLoc = ("" + window.location).split("#")[0];
  var args = [];
  for (var key in params) {
    args.push( key + "=" + params[key]);
  }
  window.location = baseLoc + "#" + args.join("&");
}

function initDragGui(){
  var items = $("#variables_menu").find("li");
  items.draggable({opacity: 0.7,
                   helper: "clone" });

  $( ".dragtarget" ).droppable({
    drop: function( event, ui ) {
      var variableName = ui.draggable.html();
      var variableId = ui.draggable.attr("id");
      var variableRole = $(this).attr("id");

      var oldRole = assignments[variableName];
      if (oldRole) {
        // don't let same variable be in two places - if this variable is already used
        // somewhere, then swap them (put new role's variable into old role):
        var varInNewRole = $(this).find(".valbox").html();
        $("#" + oldRole).find(".valbox").html(varInNewRole);
        assignments[varInNewRole] = oldRole;
        params[oldRole] = params[variableRole];
      }

      $(this).find(".valbox").html(variableName);
      assignments[variableName] = variableRole;
      params[variableRole] = variableId;


      $("#imagearea").slideUp().slideDown();

      console.log(JSON.stringify(params));

      updateFragment();
    }
  });
}
