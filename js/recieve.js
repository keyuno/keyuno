function yourAddress(address) {
    // Create a new window
    var w = window.open('', '', 'resizable=no');
  
    // Write the HTML for the new window to the document
    w.document.write(`
    <html>
    <script src="js/qrcodejs/qrcode.js"></script>
    <head>
    </head>
    <style>


       
          
          .input-box {
            position: absolute;
            left: 26%; 
            top: 65%; 
            padding: 15px;
            box-shadow: 0px 0px 4px 0px #aaaaaa;

          }

      .address {
     
        font-size: 18px;
        word-break: break-all;
        cursor: pointer;

      }

      .address:hover {
        color: grey;
      }
      .tooltip {
        position: absolute;
        background-color: black;
        color: white;
        padding: 5px 10px;
        border-radius: 5px;
        opacity: 0;
        transition: opacity 0.3s;
      }

      .qrcode {
        position: absolute;
        left: 39%; 
        top: 40%; 
        transform: translateY(-50%);
      
      }

   
    </style>
    
    <body>


        <div class="qrcode" id="qrcode"></div>

        <div class="input-box">
        <div class="address" onclick="copyAddress()"></div>
      </div>
              <div class="tooltip" id="tooltip">Address copied to clipboard</div>
      <script>




      var address = localStorage.getItem('youraddress');
      document.querySelector('.address').innerText = address;

      var qrcode = new QRCode(document.getElementById("qrcode"), {
        text: address.toString(),
        width: 170,
        height: 170,
        colorDark : "#000000",
        colorLight : "#ffffff",
        correctLevel : QRCode.CorrectLevel.H
    });
  
        function copyAddress() {
          // Copy the address to the clipboard
          navigator.clipboard.writeText(document.querySelector('.address').innerText);
          
          // Show the tooltip
          var tooltip = document.querySelector('#tooltip');
          tooltip.style.top = (event.clientY + 20) + 'px';
          tooltip.style.left = (event.clientX + 20) + 'px';
          tooltip.style.opacity = 1;
          
          // Hide the tooltip 
          setTimeout(function() {
            tooltip.style.opacity = 0;
          }, 800);
        }
      </script>
    </body>
    </html>
    `);
  }
  