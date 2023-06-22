function choice() {
  // Get the data related to the "latest-address" element
  var latestAddress = document.getElementById('latest-address').innerHTML;

  // Store the data in local storage under the key "youraddress"
  try {
    localStorage.setItem('address.new', latestAddress);
  } catch (e) {
    console.error('Failed to set "address.new" in local storage:', e);
    return;
  }

  // Get the value of the 'earliestAsset' variable from local storage
  const earliestAsset = localStorage.getItem('earliestAsset');

  // Check if the 'earliestAsset' variable is not empty
  if (earliestAsset) {
    // If it's not empty, go to updatenft.html
    window.location.href = 'updatenft.html';
  } else {
    // If it's empty, go to createnft.html
    window.location.href = 'createnft.html';
  }
}
