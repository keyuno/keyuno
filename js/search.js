function searchURL(searchTerm) {
    network.unselectAll();
  
    // If no search term is provided, get the search term from the text input element
    if (!searchTerm) {
      searchTerm = document.querySelector("input").value.toLowerCase();
    }
  
    for (var i = 0; i < allNodes.length; i++) {
      if (allNodes[i].search.indexOf(searchTerm) >= 0 && searchTerm != '') {
        network.selectNodes([allNodes[i].id]);
        allNodes[i].color = {
          background: 'black',
          highlight: {
            background: 'black',
          },
        };
      } else {
        allNodes[i].color = {
          background: 'white',
          highlight: {
            background: 'white'
          },
        };
      }
    }
    data.nodes.update(allNodes);
  
    // Get the bounding box of the selected nodes
    var boundingBox = network.getBoundingBox(network.getSelectedNodes());
  
    // Set the scale of the network to fit the bounding box
    var scale = Math.min(
      container.offsetWidth / boundingBox.right,
      container.offsetHeight / boundingBox.bottom
    );


    // Zoom in on the selected nodes
    network.moveTo({
      position: {
        x: (boundingBox.left + boundingBox.right) / 2,
        y: (boundingBox.top + boundingBox.bottom) / 2
      },
      scale: 1.5,
      animation: true
    });
  }