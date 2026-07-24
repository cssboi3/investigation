

let jsonData = [];
let filteredData = [];

document.getElementById("excelFile").addEventListener("change", function(e){

const reader = new FileReader();

reader.onload = function(evt){

const workbook = XLSX.read(evt.target.result,{type:'binary'});

const sheet = workbook.Sheets[workbook.SheetNames[0]];

jsonData = XLSX.utils.sheet_to_json(sheet);


showColumns();
loadDates();

};

reader.readAsBinaryString(e.target.files[0]);

});


function showColumns(){

let cols = Object.keys(jsonData[0]);

let html="";

let dateSelect=document.getElementById("dateColumn");
let timeSelect=document.getElementById("timeColumn");

dateSelect.innerHTML="";
timeSelect.innerHTML="";

cols.forEach(col=>{

html+=`
<label>
<input type="checkbox" value="${col}">
${col}
</label>
`;

dateSelect.innerHTML+=`<option value="${col}">${col}</option>`;
timeSelect.innerHTML+=`<option value="${col}">${col}</option>`;

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

function parseTime(value){

    if(!value) return null;

    value=value.toString().trim();

    if(/^\d{1,2}:\d{2}$/.test(value))
        value+=":00";

    if(/^\d{1,2}:\d{2}:\d{2}$/.test(value)){
        let [h,m,s]=value.split(":").map(Number);
        return h*3600+m*60+s;
    }

    let match=value.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)$/i);

    if(match){
        let h=parseInt(match[1]);
        let m=parseInt(match[2]);
        let s=parseInt(match[3]||0);

        if(/PM/i.test(match[4]) && h!=12) h+=12;
        if(/AM/i.test(match[4]) && h==12) h=0;

        return h*3600+m*60+s;
    }

    return null;
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
document.getElementById("timeColumn").addEventListener("change", loadTimes);


function filterData(){

let selected=[];

document.querySelectorAll("#columns input:checked").forEach(c=>{
selected.push(c.value);
});

let dateCol=document.getElementById("dateColumn").value;
let timeCol=document.getElementById("timeColumn").value;

let fromTime=document.getElementById("fromTime").value;

let toTime=document.getElementById("toTime").value;



let from=document.getElementById("fromDate").value;

let to=document.getElementById("toDate").value;

filteredData=jsonData.filter(r=>{

let d = parseDate(r[dateCol]);
let rowTime = parseTime(r[timeCol]);

let fromSec = fromTime ? parseTime(fromTime) : null;

let toSec = toTime ? parseTime(toTime) : null;




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

if (fromSec !== null && rowTime < fromSec) return false;
if (toSec !== null && rowTime > toSec) return false;



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
        alert("First filter Data.");
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

    const now = new Date();

const fileName =
    `Filtered_CDR_${now.getFullYear()}-${
    String(now.getMonth() + 1).padStart(2, "0")}-${
    String(now.getDate()).padStart(2, "0")}_${
    String(now.getHours()).padStart(2, "0")}-${
    String(now.getMinutes()).padStart(2, "0")}-${
    String(now.getSeconds()).padStart(2, "0")}.xlsx`;

XLSX.writeFile(wb, fileName);
}
