const fs = require("fs");

// ファイルからリーグ結果データをパースします
function parseLeagueFile(file) {
    const csv = fs.readFileSync(file, "utf8");

    const lines = csv.trim().split("\n");

    lines.shift(); // ヘッダー削除

    const results = [];
    for (line of lines) {
        const [player1, player2, result] = line.split(",");
        results.push({player1: player1.trim(), player2: player2.trim(), result: result.trim()});
    }
    return results;
}

// 対戦相手側の結果(セットカウント)に変換します
function reverseResult(result) {
    const [a, b] = result.split("-");
    return `${b}-${a}`;
}

// 指定したプレイヤーもしくは対戦相手側の結果を返却します
function getResult(matches, player1, player2) {
    const match = matches.find(m =>
        (m.player1 === player1 && m.player2 === player2) ||
        (m.player1 === player2 && m.player2 === player1)
    );

    if (!match) {
        return "";
    }

    return match.player1 === player1
        ? match.result
        : reverseResult(match.result);
}

// リーグ結果データからリーグ表を作成します
function createLeague(name, matches) {
    const players = [...new Set(
        matches.flatMap(m => [m.player1, m.player2])
    )];

    let html = `
    <section id="${name}">
        <h2>${name}リーグ</h2>
        <table>
            <tr>
                <th></th>
    `;
    for (const player of players) {
        html += `<th>${player}</th>`;
    }

    html += "</tr>";
    for (const rowPlayer of players) {

        html += `<tr><th>${rowPlayer}</th>`;

        for (const colPlayer of players) {

            html += rowPlayer === colPlayer
                ? "<td>-</td>"
                : `<td>${getResult(matches, rowPlayer, colPlayer)}</td>`;
        }

        html += "</tr>";
    }
    html += `
        </table>
    </section>
    `;

    return html;
}

async function main() {
    let rows = "";

    for (name of ["S1", "S2"]) {
        // csvファイル読んでパース
        const matches = parseLeagueFile(`data/${name}.csv`);
        // リーグ表作成
        rows += createLeague(name, matches);
    }

    let html = fs.readFileSync("template/index.html", "utf8");

    html = html.replace("{{TABLE}}", rows);

    fs.writeFileSync("output/index.html", html);

    console.log("HTML生成完了");
}

main();
