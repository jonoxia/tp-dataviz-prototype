
function initDragGui(){
  var items = $("#variables_menu").find("li");
  items.draggable({revert: "valid"});

  $( ".dragtarget" ).droppable({
    drop: function( event, ui ) {
      $("#output").html("You dropped " + ui.draggable.html() + " onto " + $(this).attr("id"));
    }
  });
}
