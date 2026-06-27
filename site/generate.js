const fs = require("fs");

const csv = fs.readFileSync("data/S1.csv", "utf8");

const lines = csv.trim().split("\n");

lines.shift(); // ヘッダー削除

let rows = "";

for (const line of lines) {
    const [p1, p2, result] = line.split(",");

    rows += `
<tr>
    <td>${p1}</td>
    <td>${p2}</td>
    <td>${result}</td>
</tr>`;
}

let html = fs.readFileSync("template/index.html", "utf8");

html = html.replace("{{TABLE}}", rows);

fs.writeFileSync("output/index.html", html);

console.log("HTML生成完了");
