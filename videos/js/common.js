function print(str){
    console.log(str);
}

function updateClock(divId) {
    const now = new Date();
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    document.getElementById('divClock').textContent = `${minutes}:${seconds}`;
}
