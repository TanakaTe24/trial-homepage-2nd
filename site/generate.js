const fs = require("fs");

// ファイルからリーグ結果データをパースします
function parseLeagueFile(file) {
  const csv = fs.readFileSync(file, "utf8");

  const lines = csv.trim().split("\n");

  lines.shift(); // ヘッダー削除

  const results = [];
  for (line of lines) {
    const [player1, player2, result] = line.split(",");
    results.push({
      player1: player1.trim(),
      player2: player2.trim(),
      result: result.trim(),
    });
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
  const match = matches.find(
    (m) =>
      (m.player1 === player1 && m.player2 === player2) ||
      (m.player1 === player2 && m.player2 === player1),
  );

  if (!match) {
    return "";
  }

  return match.player1 === player1 ? match.result : reverseResult(match.result);
}

// リーグ結果からランキング順の配列を返却します。
function getRanking(matches) {
  const players = {};
  for (match of matches) {
    if (!players[match.player1])
      players[match.player1] = { name: match.player1, win: 0, lose: 0 };

    if (!players[match.player2])
      players[match.player2] = { name: match.player2, win: 0, lose: 0 };

    const [s1, s2] = match.result.split("-").map(Number);

    if (s1 > s2) {
      players[match.player1].win++;
      players[match.player2].lose++;
    } else {
      players[match.player2].win++;
      players[match.player1].lose++;
    }
  }
  const results = Object.values(players);
  // 対戦結果からセットカウントによる順位にソート(昇順)します
  results.sort((a, b) => b.win - a.win);

  // 同一セットカウントでグループ分けします
  const groups = new Map();
  for (const result of results) {
    if (!groups.has(result.win)) groups.set(result.win, []);

    groups.get(result.win).push(result);
  }

  const ranking = [];
  for (const group of groups) {
    const players = group[1];
    if (players.length == 0) {
      // 基本ありえません
      continue;
    }
    if (players.length == 1) {
      // 1名だけなので、そのまま ranking に追加します
      ranking.push(...players);
      continue;
    }

    // 同一セットカウントのプレイヤーだけで勝ちセットと負けセットの合計でセット取得率を算出します
    const names = new Set(players.map((p) => p.name));
    const ratios = [];
    for (const name of names) {
      let win = 0;
      let lose = 0;
      for (const match of matches) {
        if (name === match.player1 && names.has(match.player2)) {
          let [w, l] = match.result.split("-").map(Number);
          win += w;
          lose += l;
        } else if (name === match.player2 && names.has(match.player1)) {
          let [l, w] = match.result.split("-").map(Number);
          win += w;
          lose += l;
        }
      }
      ratios.push({ name: name, ratio: win / lose });
    }
    // セット取得率でソート(昇順)します
    ratios.sort((a, b) => b.ratio - a.ratio);
    for (const ratio of ratios) {
      // セット取得率の高いプレイヤーから ranking に追加します
      ranking.push(players.find((p) => p.name === ratio.name));
    }
  }
  return ranking;
}

// リーグ結果データからリーグ表を作成します
function createLeague(name, matches, ranking) {
  const players = [...new Set(matches.flatMap((m) => [m.player1, m.player2]))];

  let html = `
    <section id="${name}">
        <h2>${name}リーグ</h2>
        <table>
            <tr>
                <th></th>
    `;
  // 1行目(対戦相手)
  for (const player of players) {
    html += `<th>${player}</th>`;
  }
  html += `<th>順位</th>`;

  html += "</tr>";
  for (const rowPlayer of players) {
    html += `<tr><th>${rowPlayer}</th>`;

    for (const colPlayer of players) {
      html +=
        rowPlayer === colPlayer
          ? "<td>-</td>"
          : `<td>${getResult(matches, rowPlayer, colPlayer)}</td>`;
    }

    // 順位を追加します
    html += `<td>${ranking.findIndex((r) => r.name === rowPlayer) + 1}</td>`;
    html += "</tr>";
  }
  html += `
        </table>
    </section>
    `;

  return html;
}

async function main() {
  const filenames = ["S1", "S2", "S3", "S4"];

  let table = "";
  // 表示したい順番にファイル名を追加します
  for (name of filenames) {
    // csvファイル読んでパース
    const matches = parseLeagueFile(`data/${name}.csv`);
    const ranking = getRanking(matches);
    // リーグ表作成
    table += createLeague(name, matches, ranking);
  }

  let html = fs.readFileSync("template/index.html", "utf8");

  html = html.replace("{{TABLE}}", table);

  fs.writeFileSync("output/index.html", html);

  console.log("HTML生成完了");
}

main();
