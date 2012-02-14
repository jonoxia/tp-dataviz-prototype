
function initDragGui(){
  var items = $("#variables_menu").find("li");
  items.draggable();

  /*$( "#droppable" ).droppable({
    drop: function( event, ui ) {
      $( this )
	.addClass( "ui-state-highlight" )
        .find( "p" )
	.html( "Dropped!" );
    }
  });*/
}
