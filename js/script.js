function onTransactionComplete() {
    window.location.href = 'story.html';
}

function transactionError() {
  document.getElementById("text").innerHTML = "Error, try again later."
}
