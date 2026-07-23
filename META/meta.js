

pdfjsLib.GlobalWorkerOptions.workerSrc =
"https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

const fileInput = document.getElementById("pdfFile");
const output = document.getElementById("output");
const button = document.getElementById("extractBtn");

button.onclick = async () => {

    const file = fileInput.files[0];

    if (!file) {
        alert("Select PDF");
        return;
    }

    const arrayBuffer = await file.arrayBuffer();

    const pdf = await pdfjsLib.getDocument({
        data: arrayBuffer
    }).promise;

    let completeText = "";

    for (let pageNo = 1; pageNo <= pdf.numPages; pageNo++) {

        const page = await pdf.getPage(pageNo);

        const textContent = await page.getTextContent();

        const pageText = textContent.items
            .map(item => item.str)
            .join(" ");

        completeText += "\n\n===== PAGE " + pageNo + " =====\n\n";
        completeText += pageText;
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

const records = [];

for (let i = 0; i < ipv4List.length; i++) {

    let fullIp = ipv4List[i];

    let ip = fullIp;
    let port = "";

    if (fullIp.includes(":")) {
        const parts = fullIp.split(":");
        ip = parts[0];
        port = parts[1];
    }

    records.push({
        srNo: i + 1,
        ip: ip,
        port: port,
        time: timeList[i] || "Not Found"
    });
    

}

console.log("IP Records");
console.table(records);
localStorage.setItem("metaCount" , records.length)

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

    const downloadLink = document.createElement("a");

    downloadLink.download = "IP_Analysis.csv";
    downloadLink.href = URL.createObjectURL(csvFile);

    document.body.appendChild(downloadLink);

    downloadLink.click();

    document.body.removeChild(downloadLink);
}
