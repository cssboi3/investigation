

pdfjsLib.GlobalWorkerOptions.workerSrc =
"https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

const fileInput = document.getElementById("pdfFile");
const output = document.getElementById("output");
const button = document.getElementById("extractBtn");


function utcToIST(utcTime) {

    const date = new Date(utcTime.replace(" UTC", "Z"));

    return date.toLocaleString("en-GB", {
        timeZone: "Asia/Kolkata",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false
    }) + " IST";
}
button.onclick = async () => {

    const file = fileInput.files[0];

if (!file) {
    alert("Select PDF or HTML");
    return;
}

let completeText = "";

if (file.name.toLowerCase().endsWith(".pdf")) {

    const arrayBuffer = await file.arrayBuffer();

    const pdf = await pdfjsLib.getDocument({
        data: arrayBuffer
    }).promise;

    for (let pageNo = 1; pageNo <= pdf.numPages; pageNo++) {

        const page = await pdf.getPage(pageNo);

        const textContent = await page.getTextContent();

        const pageText = textContent.items
            .map(item => item.str)
            .join(" ");

        completeText += "\n\n===== PAGE " + pageNo + " =====\n\n";
        completeText += pageText;
    }

}
else if (
    file.name.toLowerCase().endsWith(".html") ||
    file.name.toLowerCase().endsWith(".htm")
) {

    const html = await file.text();

    const parser = new DOMParser();

    const doc = parser.parseFromString(html, "text/html");

    completeText = doc.body.innerText;

}
else {

    alert("Only PDF or HTML files are allowed.");

    return;
}
    output.value = completeText;

    // =====================
    // IP Extraction
    // =====================

    const ipv4Regex = /\b(?:\d{1,3}\.){3}\d{1,3}(?::\d+)?\b/g;
    const ipv6Regex = /(?:[A-Fa-f0-9]{1,4}:){7}[A-Fa-f0-9]{1,4}/g;
    const timeRegex = /\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}:\d{2}\sUTC/g;

    const ipv4List = completeText.match(ipv4Regex) || [];
    const ipv6List = completeText.match(ipv6Regex) || [];
    const timeList = completeText.match(timeRegex) || [];

    console.log("IPv4 Addresses");
    console.log(ipv4List);

    console.log("IPv6 Addresses");
    console.log(ipv6List);

    console.log("Times");
    console.log(timeList);

    // =====================
    // Duplicate Count
    // =====================

    const ipCount = {};

    ipv4List.forEach(ip => {
        ipCount[ip] = (ipCount[ip] || 0) + 1;
    });

    console.log("Duplicate Count");
    console.table(ipCount);


// =====================
// Create IP Records
// =====================
// =====================
// Create IP Records (Block Extraction)
// =====================

const records = [];

// PDF ko "IP Address" ke basis par blocks me divide karo
const blocks = completeText.split(/(?=IP\s*Address)/i);

blocks.forEach(block => {

    let ip = "";
    let port = "";
    let time = "";

    // IPv4
    let ipv4 = block.match(/((?:\d{1,3}\.){3}\d{1,3}):(\d+)/);

    // IPv6 (Facebook format)
    let ipv6 = block.match(/\[([A-Fa-f0-9:]+)\]:(\d+)/);

    if (ipv4) {
        ip = ipv4[1];
        port = ipv4[2];
    }
    else if (ipv6) {
        ip = ipv6[1];
        port = ipv6[2];
    }

    // UTC Time
    let t = block.match(/\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}:\d{2}\sUTC/);

    if (t) {
        time = t[0];
    }

    if (ip !== "") {

        records.push({
            srNo: records.length + 1,
            ip: ip,
            port: port,
           time: time ? utcToIST(time) : "Not Found"
        });

    }

});

console.log("IP Records");
console.table(records);

localStorage.setItem("metaCount", records.length);


// =====================
// Show Records in Table
// =====================

const tbody = document.querySelector("#resultTable tbody");

tbody.innerHTML = "";
console.log(records);

for (let i = 0; i < records.length; i++) {

    const row = `
        <tr>
            <td>${records[i].srNo}</td>
            <td>${records[i].ip}</td>
            <td>${records[i].port}</td>
            <td>${records[i].time}</td>
        </tr>
    `;

    tbody.innerHTML += row;
}
};

// Download CSV
document.getElementById("downloadBtn").addEventListener("click", downloadCSV);


function downloadCSV() {

    const table = document.getElementById("resultTable");

    let csv = [];

    for (let i = 0; i < table.rows.length; i++) {

        let row = [];
        let cols = table.rows[i].querySelectorAll("th, td");

        for (let j = 0; j < cols.length; j++) {
            row.push('"' + cols[j].innerText + '"');
        }

        csv.push(row.join(","));
    }

    const csvFile = new Blob([csv.join("\n")], {
        type: "text/csv"
    });

    const now = new Date();

const fileName =
    `IP_Analysis_${now.getFullYear()}-${
    String(now.getMonth() + 1).padStart(2, "0")}-${
    String(now.getDate()).padStart(2, "0")}_${
    String(now.getHours()).padStart(2, "0")}-${
    String(now.getMinutes()).padStart(2, "0")}-${
    String(now.getSeconds()).padStart(2, "0")}.csv`;
const downloadLink = document.createElement("a");
downloadLink.download = fileName;


    downloadLink.href = URL.createObjectURL(csvFile);

    document.body.appendChild(downloadLink);

    downloadLink.click();

    document.body.removeChild(downloadLink);
}
