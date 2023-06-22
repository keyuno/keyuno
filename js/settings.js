function openSettings() {
    // Create a new window
    var w = window.open('', '', 'resizable=no');
    let TX_FEE = localStorage.getItem("TX_FEE") || 0.00003;
    
    // Get the passphrase from local storage
    var passphrase = localStorage.getItem('passphrase');
  
    // Hide the passphrase by replacing it with asterisks
    var hiddenPassphrase = '<span id="hidden-passphrase">*'.repeat(passphrase.length) + '</span>';
  
    // Write the HTML for the new window to the document
 w.document.write(`
 <html>
 <head>
   <title></title>
 </head>
 <style>
 
   .box {
    position: relative;
     box-shadow: 0 4px 8px 0 rgba(0, 0, 0, 0.2);
     border: 1px solid #ddd;
     border-radius: 5px;
     padding: 16px;
     text-align: center;
     width: 95%;
     height: 7%;

   }

   .box1 {
    position: relative;
     box-shadow: 0 4px 8px 0 rgba(0, 0, 0, 0.2);
     border: 1px solid #ddd;
     border-radius: 5px;
     padding: 16px;
     text-align: center;
     width: 95%;
     height: 7%;

   }

   #eye-icon {
    position: absolute; 
    left: 95%; 
    cursor: pointer;
    top: 35%;
  }
  
  #eye-icon:hover {
    filter: drop-shadow(3px 5px 2px rgb(0 0 0 / 0.4));
    }
  
  .slidercontainer {
    width: 100%;
  }
  
  .slider {
    -webkit-appearance: none;
    width: 100%;
    height: 6px;
    border-radius: 5px;
    background: #898b8966;
    outline: none;
  }
  
  .slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 12px;
    height: 12px;
    border-radius: 2%;
    background: black;
    cursor: pointer;
  }
  
  .logo {
    position: absolute;
    bottom: 0;
    top: 50%;
    left: 50%;
    transform: translateX(-50%);
    opacity: 10%;

  }

 </style>
 
 <body>
 <img src="css/img/logo1.png" class="logo" width="320" height="250" />

 <div style="text-align: left;"><b>Passphrase:</b></div>
 <br />
 <div class="box" style="display: grid; place-items: center;">
 ${hiddenPassphrase}
 <img src="css/icons/visibility.svg" id="eye-icon" />
</div>
 <br />  
 <div style="text-align: left;"><b>Transaction Fee:</b></div>
 <br />  

 <div class="box1">


 <div class="slidercontainer">
 <input type="range" min="0.00001" max="0.0001" value="${TX_FEE}" step="0.000001" class="slider" id="iRange">   
 <p><span id="output">${TX_FEE}</span> BTC</p>
 </div>

<script>
var slider = document.getElementById("iRange");
var output = document.getElementById("output");
output.innerHTML = slider.value;
slider.oninput = function() {
  output.innerHTML = this.value;
  TX_FEE = this.value;
  localStorage.setItem("TX_FEE", TX_FEE);
}
</script>
</body>
</html>
`);


// Add an event listener to the eye icon
    w.document.getElementById('eye-icon').addEventListener('click', function() {
      var hiddenPassphrase = w.document.getElementById('hidden-passphrase');
      if (hiddenPassphrase.innerHTML === passphrase) {
        // Hide the passphrase
        hiddenPassphrase.innerHTML = '*'.repeat(passphrase.length);
      } else {
        // Show the passphrase
        hiddenPassphrase.innerHTML = passphrase;
      }
      
    });
  }

