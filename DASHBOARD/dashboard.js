

let cdrCount = Number(localStorage.getItem("cdrCount")) || 0;
let ipCount = Number(localStorage.getItem("ipCount")) || 0;
let metaCount = Number(localStorage.getItem("metaCount")) || 0;

document.getElementById("cdrCount").textContent = cdrCount;
document.getElementById("ipCount").textContent = ipCount;
document.getElementById("metaCount").textContent = metaCount;

document.getElementById("totalCount").textContent = cdrCount + ipCount + metaCount;
