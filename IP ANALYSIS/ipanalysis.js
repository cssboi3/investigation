const token = "7eafef8a28ce8d";

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function analyzeIP() {

    let ipText = document.getElementById("ip").value;

    let ips = ipText
        .split("\n")
        .map(ip => ip.trim())
        .filter(ip => ip !== "");

    if (ips.length === 0) {
        alert("Please enter IP addresses.");
        return;
    }

map.eachLayer(function(layer){
    if(layer instanceof L.Marker){
        map.removeLayer(layer);
    }
});




    const batchSize = 10;
    const delayBetweenBatches = 10000; // 10 seconds

    let results = [];

    document.getElementById("result").innerHTML =
        `<h3>Starting analysis... 0/${ips.length}</h3>`;

    for (let i = 0; i < ips.length; i += batchSize) {

        let batch = ips.slice(i, i + batchSize);

        let promises = batch.map(async (ip) => {

            try {

               let response = await fetch(`https://ipinfo.io/${ip}/json?token=${token}`);
let data = await response.json();

let lat = "-";
let lon = "-";

if (data.loc) {
    [lat, lon] = data.loc.split(",");
}

return {
    query: data.ip,
    country: data.country,
    city: data.city,
    isp: data.org,
    lat: lat,
    lon: lon
};
            } catch (e) {

                return {
                    query: ip,
                    country: "Error",
                    city: "-",
                    isp: "-",
                    lat: "-",
                    lon: "-"
                };

            }

        });

        let batchResults = await Promise.all(promises);

        results.push(...batchResults);

        document.getElementById("result").innerHTML =
            `<h3>Processed ${results.length} / ${ips.length} IPs...</h3>`;

        // Last batch ke baad wait nahi karna
        if (i + batchSize < ips.length) {
            await sleep(delayBetweenBatches);
        }
    }

    let output = `
    <table border="1" cellpadding="10" cellspacing="0">
        <tr>
            <th>IP Address</th>
            <th>Country</th>
            <th>City</th>
            <th>ISP</th>
            <th>Latitude</th>
            <th>Longitude</th>
        </tr>
    `;
let bounds =[];
    results.forEach(data => {

        output += `
        <tr>
            <td>${data.query || "-"}</td>
            <td>${data.country || "-"}</td>
            <td>${data.city || "-"}</td>
            <td>${data.isp || "-"}</td>
            <td>${data.lat || "-"}</td>
            <td>${data.lon || "-"}</td>
        </tr>
        `;

        if(data.lat && data.lon){

            bounds.push([data.lat,data.lon]);


    L.marker([data.lat,data.lon])
    .addTo(map)
    .bindPopup(`
        <b>${data.query}</b><br>
        ${data.city}, ${data.country}<br>
        ISP: ${data.isp}
    `);

}

    });
    if(bounds.length>0){
    map.fitBounds(bounds);
}

    output += "</table>";

    document.getElementById("result").innerHTML = output;
    localStorage.setItem("ipCount" , results.length);
}

let map = L.map('map').setView([20.5937,78.9629],5);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{
    attribution:'© OpenStreetMap'
}).addTo(map);


function exportExcel(){

    let table = document.querySelector("table");

    let workbook = XLSX.utils.table_to_book(table, {sheet:"IP Analysis"});

    XLSX.writeFile(workbook, "IP_Analysis_Report.xlsx");

}
