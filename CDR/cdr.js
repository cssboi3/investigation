

let jsonData = [];
let filteredData = [];

document.getElementById("excelFile").addEventListener("change", function(e){

const reader = new FileReader();

reader.onload = function(evt){

const workbook = XLSX.read(evt.target.result,{type:'binary'});

const sheet = workbook.Sheets[workbook.SheetNames[0]];

jsonData = XLSX.utils.sheet_to_json(sheet);


showColumns();
loaddates();

};

reader.readAsBinaryString(e.target.files[0]);

});

function showColumns(){

let cols = Object.keys(jsonData[0]);

let html="";

let dateSelect=document.getElementById("dateColumn");

dateSelect.innerHTML="";

cols.forEach(col=>{

html+=`
<label>
<input type="checkbox" value="${col}">
${col}
</label>
`;

dateSelect.innerHTML+=`<option value="${col}">${col}</option>`;

});

document.getElementById("columns").innerHTML=html;

}
// DATE FILTER FUNCTION

function parseDate(value) {

    if (!value) return null;

    if (typeof value === "number") {
        return new Date((value - 25569) * 86400 * 1000);
    }

    value = value.toString().trim();

    const months = {
        Jan:0, Feb:1, Mar:2, Apr:3, May:4, Jun:5,
        Jul:6, Aug:7, Sep:8, Oct:9, Nov:10, Dec:11
    };

    let match = value.match(/^(\d{1,2})\/([A-Za-z]{3})\/(\d{4})$/);

    if (match) {
        let day = parseInt(match[1]);
        let month = months[match[2]];
        let year = parseInt(match[3]);

        return new Date(year, month, day);
    }

    return new Date(value);
}
function loadDates() {

    let dateCol = document.getElementById("dateColumn").value;
    if (!dateCol) return;

    let dates = [];

    jsonData.forEach(row => {
        let d = parseDate(row[dateCol]);
        if (d) {
            dates.push(d.toISOString().split("T")[0]);
        }
    });

    dates = [...new Set(dates)].sort();

    let fromList = document.getElementById("fromDates");
let toList = document.getElementById("toDates");

fromList.innerHTML = "";
toList.innerHTML = "";

dates.forEach(date => {
    fromList.innerHTML += `<option value="${date}">`;
    toList.innerHTML += `<option value="${date}">`;
});
}

document.getElementById("dateColumn").addEventListener("change", loadDates);


function filterData(){

let selected=[];

document.querySelectorAll("#columns input:checked").forEach(c=>{
selected.push(c.value);
});

let dateCol=document.getElementById("dateColumn").value;

let from=document.getElementById("fromDate").value;

let to=document.getElementById("toDate").value;

filteredData=jsonData.filter(r=>{

let d = parseDate(r[dateCol]);

let fromDate = from ? new Date(from) : null;
let toDate = to ? new Date(to) : null;
console.log("Excel Date:", r[dateCol]);
console.log("Parsed Date:", d);
console.log("From:", fromDate);
console.log("To:", toDate);
if (fromDate)
    fromDate.setHours(0,0,0,0);

if (toDate)
    toDate.setHours(23,59,59,999);

if (fromDate && d < fromDate) return false;
if (toDate && d > toDate) return false;

return true;
});

let table="<table><tr>";

selected.forEach(c=>{
table+="<th>"+c+"</th>";
});

table+="</tr>";

filteredData.forEach(r=>{

table+="<tr>";

selected.forEach(c=>{
table+="<td>"+(r[c]||"")+"</td>";
});

table+="</tr>";

});

table+="</table>";

document.getElementById("output").innerHTML=table;
localStorage.setItem("cdrCount" , filteredData.length);
}


function downloadExcel(){

    if(filteredData.length === 0){
        alert("Firsy filter Data.");
        return;
    }

    // Selected columns
    let selected = [];
    document.querySelectorAll("#columns input:checked").forEach(c=>{
        selected.push(c.value);
    });

    // selected column Data
    let exportData = filteredData.map(row=>{
        let obj = {};
        selected.forEach(col=>{
            obj[col] = row[col];
        });
        return obj;
    });

    let ws = XLSX.utils.json_to_sheet(exportData);
    let wb = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(wb, ws, "Filtered_CDR");

    XLSX.writeFile(wb, "Filtered_CDR.xlsx");
}
